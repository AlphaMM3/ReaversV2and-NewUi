import { Router } from "express";
import { z } from "zod";
import {
  type Store,
  type Row,
  rows,
  one,
  obj,
  write,
  fail,
  audit,
} from "./db.js";
import { batchScope, requireRole } from "./security.js";

const id = z.coerce.number().int().positive();
const dateStr = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);

export function learning(store: Store, now = () => new Date()) {
  const r = Router();

  // --------------------------------------------------------------------------
  // HOMEWORK
  // --------------------------------------------------------------------------

  // List homework items
  r.get("/homework", async (q, s) => {
    const u = s.locals.user;
    const batchId = q.query.batch_id ? id.parse(q.query.batch_id) : undefined;
    const enrollmentId = q.query.enrollment_id ? id.parse(q.query.enrollment_id) : undefined;

    s.json(
      await store.read(async (c) => {
        if (u.role.startsWith("guardian")) {
          // Guardian: own family learners only
          const list = await rows(
            c,
            `SELECT h.id, h.batch_id, h.title, h.instructions, h.due_date, h.created_at,
                    b.label batch_name, co.title course_title,
                    sh.id student_homework_id, sh.enrollment_id, sh.status,
                    sh.teacher_feedback, sh.feedback_at, sh.completed_at,
                    st.id student_id, st.full_name student_name
             FROM homework h
             JOIN batches b ON b.id = h.batch_id
             JOIN courses co ON co.id = b.course_id
             JOIN student_homework sh ON sh.homework_id = h.id
             JOIN enrollments e ON e.id = sh.enrollment_id
             JOIN students st ON st.id = e.student_id
             JOIN family_guardians fg ON fg.family_id = st.family_id
             WHERE fg.user_id = ?
               ${enrollmentId ? "AND sh.enrollment_id = ?" : ""}
               ${batchId ? "AND h.batch_id = ?" : ""}
             ORDER BY h.due_date DESC, h.id DESC`,
            [
              u.id,
              ...(enrollmentId ? [enrollmentId] : []),
              ...(batchId ? [batchId] : []),
            ],
          );
          return list;
        }

        // Staff access
        let scopeSql = "1=1";
        const scopeArgs: any[] = [];
        if (u.role === "teacher") {
          scopeSql = "b.teacher_id = ? AND d.branch_id = ?";
          scopeArgs.push(u.id, u.branch_id);
        } else if (u.role === "zimmadar") {
          scopeSql = "b.zimmadar_id = ? AND d.branch_id = ?";
          scopeArgs.push(u.id, u.branch_id);
        } else if (u.role === "department_supervisor") {
          scopeSql = "d.branch_id = ? AND co.department_id = ?";
          scopeArgs.push(u.branch_id, u.department_id);
        } else if (u.role === "branch_admin") {
          scopeSql = "d.branch_id = ?";
          scopeArgs.push(u.branch_id);
        }

        const items = await rows(
          c,
          `SELECT h.id, h.batch_id, h.enrollment_id, h.class_id, h.title, h.instructions,
                  h.due_date, h.created_by, h.created_at,
                  b.label batch_name, co.title course_title, u.name teacher_name
           FROM homework h
           JOIN batches b ON b.id = h.batch_id
           JOIN courses co ON co.id = b.course_id
           JOIN departments d ON d.id = co.department_id
           JOIN users u ON u.id = h.created_by
           WHERE ${scopeSql}
             ${batchId ? "AND h.batch_id = ?" : ""}
             ${enrollmentId ? "AND (h.enrollment_id = ? OR h.enrollment_id IS NULL)" : ""}
           ORDER BY h.due_date DESC, h.id DESC LIMIT 200`,
          [
            ...scopeArgs,
            ...(batchId ? [batchId] : []),
            ...(enrollmentId ? [enrollmentId] : []),
          ],
        );
        return items;
      }),
    );
  });

  // Get submissions for a homework item
  r.get("/homework/:id/submissions", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "teacher", "zimmadar", "department_supervisor", "branch_admin", "central_admin");
    const hwId = id.parse(q.params.id);
    s.json(
      await store.read(async (c) => {
        const h = await one(c, "SELECT * FROM homework WHERE id = ?", [hwId]);
        if (!h) fail(404, "Homework not found");
        await batchScope(c, h.batch_id, u, "read");
        return rows(
          c,
          `SELECT sh.id, sh.homework_id, sh.enrollment_id, sh.status, sh.teacher_feedback,
                  sh.feedback_at, sh.completed_at, sh.revision,
                  st.id student_id, st.full_name student_name
           FROM student_homework sh
           JOIN enrollments e ON e.id = sh.enrollment_id
           JOIN students st ON st.id = e.student_id
           WHERE sh.homework_id = ?
           ORDER BY st.full_name ASC`,
          [hwId],
        );
      }),
    );
  });

  // Create homework
  r.post("/homework", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "teacher", "branch_admin", "central_admin");
    const d = z
      .object({
        batch_id: id,
        enrollment_id: id.nullable().optional(),
        class_id: id.nullable().optional(),
        title: z.string().trim().min(1).max(150),
        instructions: z.string().trim().min(1).max(10000),
        due_date: dateStr,
        request_id: z.string().min(12).max(80),
      })
      .parse(q.body);

    s.json(
      await store.transaction(async (c) => {
        const batch = await batchScope(c, d.batch_id, u, "teach");
        if (u.role === "teacher" && batch.teacher_id !== u.id)
          fail(403, "Assigned Teacher only");

        if (d.enrollment_id) {
          const en = await one(c, "SELECT id, batch_id FROM enrollments WHERE id = ?", [
            d.enrollment_id,
          ]);
          if (!en) fail(404, "Enrollment not found");
          if (en.batch_id !== d.batch_id)
            fail(400, "Enrollment does not belong to specified batch");
        }
        if (d.class_id) {
          const cl = await one(c, "SELECT id, batch_id FROM class_sessions WHERE id = ?", [
            d.class_id,
          ]);
          if (!cl) fail(404, "Class session not found");
          if (cl.batch_id !== d.batch_id)
            fail(400, "Class session does not belong to specified batch");
        }

        // Idempotency check on request_id
        const existing = await one(
          c,
          "SELECT * FROM homework WHERE created_by = ? AND request_id = ?",
          [u.id, d.request_id],
        );
        if (existing) {
          if (
            existing.batch_id !== d.batch_id ||
            existing.title !== d.title ||
            existing.due_date !== d.due_date
          )
            fail(409, "Request already used with different parameters");
          return { id: existing.id, already_created: true };
        }

        const createdAt = now().toISOString();
        const res = await write(
          c,
          `INSERT INTO homework (batch_id, enrollment_id, class_id, title, instructions, due_date, created_by, created_at, request_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            d.batch_id,
            d.enrollment_id || null,
            d.class_id || null,
            d.title,
            d.instructions,
            d.due_date,
            u.id,
            createdAt,
            d.request_id,
          ],
        );
        const hwId = res.insertId;

        // Generate student_homework entries
        if (d.enrollment_id) {
          await write(
            c,
            "INSERT INTO student_homework (homework_id, enrollment_id, status) VALUES (?, ?, 'assigned')",
            [hwId, d.enrollment_id],
          );
        } else {
          // Batch-wide: assign to all currently active learners in this batch
          const learners = await rows(
            c,
            "SELECT id FROM enrollments WHERE batch_id = ? AND status IN ('active', 'enrolled')",
            [d.batch_id],
          );
          for (const lr of learners) {
            await write(
              c,
              "INSERT INTO student_homework (homework_id, enrollment_id, status) VALUES (?, ?, 'assigned')",
              [hwId, lr.id],
            );
          }
        }

        await audit(c, u, "create_homework", "homework", hwId, {
          batch_id: d.batch_id,
          title: d.title,
          due_date: d.due_date,
        });

        return { id: hwId, created_at: createdAt };
      }),
    );
  });

  // Update learner homework status & teacher feedback
  r.post("/student-homework/:id", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "teacher", "branch_admin", "central_admin");
    const shId = id.parse(q.params.id);
    const d = z
      .object({
        status: z.enum(["assigned", "submitted", "completed", "incomplete"]),
        teacher_feedback: z.string().trim().max(5000).nullable().optional(),
        expected_revision: z.number().int().positive(),
      })
      .parse(q.body);

    s.json(
      await store.transaction(async (c) => {
        const sh = await one(
          c,
          `SELECT sh.*, h.batch_id FROM student_homework sh
           JOIN homework h ON h.id = sh.homework_id
           WHERE sh.id = ? FOR UPDATE`,
          [shId],
        );
        if (!sh) fail(404, "Student homework record not found");
        if (sh.revision !== d.expected_revision)
          fail(409, "Record changed; reload before submitting");

        const batch = await batchScope(c, sh.batch_id, u, "teach");
        if (u.role === "teacher" && batch.teacher_id !== u.id)
          fail(403, "Assigned Teacher only");

        const updatedAt = now().toISOString();
        const completedAt =
          d.status === "completed" ? (sh.completed_at || updatedAt) : null;
        const feedbackAt = d.teacher_feedback ? updatedAt : sh.feedback_at;

        await write(
          c,
          `UPDATE student_homework
           SET status = ?, teacher_feedback = ?, feedback_at = ?, completed_at = ?,
               updated_by = ?, updated_at = ?, revision = revision + 1
           WHERE id = ?`,
          [
            d.status,
            d.teacher_feedback || sh.teacher_feedback || null,
            feedbackAt,
            completedAt,
            u.id,
            updatedAt,
            shId,
          ],
        );

        await audit(c, u, "update_homework_status", "student_homework", shId, {
          status: d.status,
          enrollment_id: sh.enrollment_id,
        });

        return { ok: true, status: d.status, revision: sh.revision + 1 };
      }),
    );
  });

  // Get single student homework record
  r.get("/student-homework/:id", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "teacher", "branch_admin", "central_admin", "zimmadar", "department_supervisor");
    const shId = id.parse(q.params.id);
    s.json(
      await store.read(async (c) => {
        const sh = await one(
          c,
          `SELECT sh.*, st.full_name student_name, h.title homework_title, h.batch_id
           FROM student_homework sh
           JOIN homework h ON h.id = sh.homework_id
           JOIN enrollments e ON e.id = sh.enrollment_id
           JOIN students st ON st.id = e.student_id
           WHERE sh.id = ?`,
          [shId],
        );
        if (!sh) fail(404, "Student homework record not found");
        await batchScope(c, sh.batch_id, u, "read");
        return sh;
      }),
    );
  });

  // --------------------------------------------------------------------------
  // ASSESSMENTS & MARKS
  // --------------------------------------------------------------------------

  // List assessments
  r.get("/assessments", async (q, s) => {
    const u = s.locals.user;
    const batchId = q.query.batch_id ? id.parse(q.query.batch_id) : undefined;
    const enrollmentId = q.query.enrollment_id ? id.parse(q.query.enrollment_id) : undefined;

    s.json(
      await store.read(async (c) => {
        if (u.role.startsWith("guardian")) {
          // Guardian: only published marks for own children
          const list = await rows(
            c,
            `SELECT a.id assessment_id, a.batch_id, a.title assessment_title, a.assessment_type,
                    a.max_marks, a.pass_marks, a.assessment_date,
                    am.id mark_id, am.enrollment_id, am.obtained_marks,
                    am.guardian_feedback, am.published_at,
                    st.id student_id, st.full_name student_name,
                    b.label batch_name, co.title course_title
             FROM assessments a
             JOIN batches b ON b.id = a.batch_id
             JOIN courses co ON co.id = b.course_id
             JOIN assessment_marks am ON am.assessment_id = a.id
             JOIN enrollments e ON e.id = am.enrollment_id
             JOIN students st ON st.id = e.student_id
             JOIN family_guardians fg ON fg.family_id = st.family_id
             WHERE fg.user_id = ? AND am.status = 'published'
               ${enrollmentId ? "AND am.enrollment_id = ?" : ""}
               ${batchId ? "AND a.batch_id = ?" : ""}
             ORDER BY a.assessment_date DESC, a.id DESC`,
            [
              u.id,
              ...(enrollmentId ? [enrollmentId] : []),
              ...(batchId ? [batchId] : []),
            ],
          );
          return list;
        }

        // Staff access
        let scopeSql = "1=1";
        const scopeArgs: any[] = [];
        if (u.role === "teacher") {
          scopeSql = "b.teacher_id = ? AND d.branch_id = ?";
          scopeArgs.push(u.id, u.branch_id);
        } else if (u.role === "zimmadar") {
          scopeSql = "b.zimmadar_id = ? AND d.branch_id = ?";
          scopeArgs.push(u.id, u.branch_id);
        } else if (u.role === "department_supervisor") {
          scopeSql = "d.branch_id = ? AND co.department_id = ?";
          scopeArgs.push(u.branch_id, u.department_id);
        } else if (u.role === "branch_admin") {
          scopeSql = "d.branch_id = ?";
          scopeArgs.push(u.branch_id);
        }

        const items = await rows(
          c,
          `SELECT a.id, a.batch_id, a.title, a.assessment_type, a.max_marks,
                  a.pass_marks, a.assessment_date, a.created_by, a.created_at,
                  b.label batch_name, co.title course_title, u.name teacher_name
           FROM assessments a
           JOIN batches b ON b.id = a.batch_id
           JOIN courses co ON co.id = b.course_id
           JOIN departments d ON d.id = co.department_id
           JOIN users u ON u.id = a.created_by
           WHERE ${scopeSql}
             ${batchId ? "AND a.batch_id = ?" : ""}
           ORDER BY a.assessment_date DESC, a.id DESC LIMIT 200`,
          [...scopeArgs, ...(batchId ? [batchId] : [])],
        );
        return items;
      }),
    );
  });

  // Create assessment
  r.post("/assessments", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "teacher", "branch_admin", "central_admin");
    const d = z
      .object({
        batch_id: id,
        title: z.string().trim().min(1).max(150),
        assessment_type: z.enum(["oral_practical", "continuous"]).default("oral_practical"),
        max_marks: z.number().positive().max(1000).default(100),
        pass_marks: z.number().positive().max(1000).nullable().optional(),
        assessment_date: dateStr,
        request_id: z.string().min(12).max(80),
      })
      .parse(q.body);

    s.json(
      await store.transaction(async (c) => {
        const batch = await batchScope(c, d.batch_id, u, "teach");
        if (u.role === "teacher" && batch.teacher_id !== u.id)
          fail(403, "Assigned Teacher only");

        const existing = await one(
          c,
          "SELECT * FROM assessments WHERE created_by = ? AND request_id = ?",
          [u.id, d.request_id],
        );
        if (existing) {
          if (
            existing.batch_id !== d.batch_id ||
            existing.title !== d.title ||
            Number(existing.max_marks) !== d.max_marks
          )
            fail(409, "Request already used with different parameters");
          return { id: existing.id, already_created: true };
        }

        const createdAt = now().toISOString();
        const res = await write(
          c,
          `INSERT INTO assessments (batch_id, title, assessment_type, max_marks, pass_marks, assessment_date, created_by, created_at, request_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            d.batch_id,
            d.title,
            d.assessment_type,
            d.max_marks,
            d.pass_marks || null,
            d.assessment_date,
            u.id,
            createdAt,
            d.request_id,
          ],
        );

        await audit(c, u, "create_assessment", "assessments", res.insertId, {
          batch_id: d.batch_id,
          title: d.title,
          max_marks: d.max_marks,
        });

        return { id: res.insertId, created_at: createdAt };
      }),
    );
  });

  // Get marks for an assessment
  r.get("/assessments/:id/marks", async (q, s) => {
    const u = s.locals.user;
    const assessId = id.parse(q.params.id);

    s.json(
      await store.read(async (c) => {
        const a = await one(c, "SELECT * FROM assessments WHERE id = ?", [assessId]);
        if (!a) fail(404, "Assessment not found");
        await batchScope(c, a.batch_id, u, "read");

        const list = await rows(
          c,
          `SELECT am.*, st.id student_id, st.full_name student_name
           FROM assessment_marks am
           JOIN enrollments e ON e.id = am.enrollment_id
           JOIN students st ON st.id = e.student_id
           WHERE am.assessment_id = ?
           ORDER BY st.full_name ASC`,
          [assessId],
        );

        // Mask internal remarks for non-staff or non-assigned
        if (u.role.startsWith("guardian")) {
          return list
            .filter((m) => m.status === "published")
            .map((m) => ({
              id: m.id,
              assessment_id: m.assessment_id,
              enrollment_id: m.enrollment_id,
              obtained_marks: m.obtained_marks,
              guardian_feedback: m.guardian_feedback,
              published_at: m.published_at,
              student_name: m.student_name,
            }));
        }

        return list;
      }),
    );
  });

  // Record / enter assessment marks
  r.post("/assessments/:id/marks", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "teacher", "branch_admin", "central_admin");
    const assessId = id.parse(q.params.id);
    const d = z
      .object({
        marks: z.array(
          z.object({
            enrollment_id: id,
            obtained_marks: z.number().min(0).max(1000),
            teacher_remarks: z.string().trim().max(2000).optional(),
            guardian_feedback: z.string().trim().max(2000).optional(),
          }),
        ).min(1).max(500),
      })
      .parse(q.body);

    s.json(
      await store.transaction(async (c) => {
        const a = await one(c, "SELECT * FROM assessments WHERE id = ? FOR UPDATE", [assessId]);
        if (!a) fail(404, "Assessment not found");
        const batch = await batchScope(c, a.batch_id, u, "teach");
        if (u.role === "teacher" && batch.teacher_id !== u.id)
          fail(403, "Assigned Teacher only");

        const maxMarks = Number(a.max_marks);
        const recordedAt = now().toISOString();
        const results = [];

        for (const entry of d.marks) {
          if (entry.obtained_marks > maxMarks)
            fail(400, `Obtained marks ${entry.obtained_marks} exceeds maximum ${maxMarks}`);

          const en = await one(c, "SELECT id, batch_id FROM enrollments WHERE id = ?", [
            entry.enrollment_id,
          ]);
          if (!en) fail(404, "Enrollment not found");
          if (en.batch_id !== a.batch_id)
            fail(400, "Enrollment does not belong to assessment batch");

          const existing = await one(
            c,
            "SELECT * FROM assessment_marks WHERE assessment_id = ? AND enrollment_id = ? FOR UPDATE",
            [assessId, entry.enrollment_id],
          );

          if (existing) {
            await write(
              c,
              `UPDATE assessment_marks
               SET obtained_marks = ?, teacher_remarks = ?, guardian_feedback = ?,
                   recorded_by = ?, recorded_at = ?, revision = revision + 1
               WHERE id = ?`,
              [
                entry.obtained_marks,
                entry.teacher_remarks || existing.teacher_remarks || null,
                entry.guardian_feedback || existing.guardian_feedback || null,
                u.id,
                recordedAt,
                existing.id,
              ],
            );
            results.push({ id: existing.id, enrollment_id: entry.enrollment_id, updated: true });
          } else {
            const ins = await write(
              c,
              `INSERT INTO assessment_marks (assessment_id, enrollment_id, obtained_marks, teacher_remarks, guardian_feedback, status, recorded_by, recorded_at)
               VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)`,
              [
                assessId,
                entry.enrollment_id,
                entry.obtained_marks,
                entry.teacher_remarks || null,
                entry.guardian_feedback || null,
                u.id,
                recordedAt,
              ],
            );
            results.push({ id: ins.insertId, enrollment_id: entry.enrollment_id, created: true });
          }
        }

        await audit(c, u, "record_assessment_marks", "assessments", assessId, {
          entries_count: d.marks.length,
        });

        return { ok: true, count: results.length, items: results };
      }),
    );
  });

  // Explicit publication of assessment results by Zimmadar
  r.post("/assessments/:id/publish", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "zimmadar", "branch_admin", "central_admin");
    const assessId = id.parse(q.params.id);

    s.json(
      await store.transaction(async (c) => {
        const a = await one(c, "SELECT * FROM assessments WHERE id = ? FOR UPDATE", [assessId]);
        if (!a) fail(404, "Assessment not found");
        const batch = await batchScope(c, a.batch_id, u, "manage");
        if (u.role === "zimmadar" && batch.zimmadar_id !== u.id)
          fail(403, "Assigned Batch Zimmadar only");

        const publishedAt = now().toISOString();
        const updated = await write(
          c,
          `UPDATE assessment_marks
           SET status = 'published', published_at = ?, published_by = ?
           WHERE assessment_id = ?`,
          [publishedAt, u.id, assessId],
        );

        await audit(c, u, "publish_assessment_results", "assessments", assessId, {
          published_by: u.id,
          marks_published: updated.affectedRows,
        });

        return { ok: true, published_count: updated.affectedRows, published_at: publishedAt };
      }),
    );
  });

  // Mark correction post-entry with audited reason and history
  r.post("/assessments/:id/marks/:markId/correction", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "teacher", "zimmadar", "branch_admin", "central_admin");
    const assessId = id.parse(q.params.id);
    const markId = id.parse(q.params.markId);
    const d = z
      .object({
        new_marks: z.number().min(0).max(1000),
        reason: z.string().trim().min(5).max(2000),
        expected_revision: z.number().int().positive(),
      })
      .parse(q.body);

    s.json(
      await store.transaction(async (c) => {
        const a = await one(c, "SELECT * FROM assessments WHERE id = ?", [assessId]);
        if (!a) fail(404, "Assessment not found");
        const batch = await batchScope(c, a.batch_id, u, u.role === "zimmadar" ? "manage" : "teach");
        if (u.role === "teacher" && batch.teacher_id !== u.id)
          fail(403, "Assigned Teacher only");
        if (u.role === "zimmadar" && batch.zimmadar_id !== u.id)
          fail(403, "Assigned Zimmadar only");

        const mark = await one(
          c,
          "SELECT * FROM assessment_marks WHERE id = ? AND assessment_id = ? FOR UPDATE",
          [markId, assessId],
        );
        if (!mark) fail(404, "Assessment mark record not found");
        if (mark.revision !== d.expected_revision)
          fail(409, "Record changed; reload before submitting correction");

        const maxMarks = Number(a.max_marks);
        if (d.new_marks > maxMarks)
          fail(400, `New marks ${d.new_marks} exceeds maximum ${maxMarks}`);

        const at = now().toISOString();
        // Record revision history
        await write(
          c,
          `INSERT INTO assessment_mark_history (mark_id, revision, old_marks, new_marks, reason, actor_id, at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            markId,
            mark.revision,
            mark.obtained_marks,
            d.new_marks,
            d.reason,
            u.id,
            at,
          ],
        );

        await write(
          c,
          `UPDATE assessment_marks
           SET obtained_marks = ?, revision = revision + 1
           WHERE id = ?`,
          [d.new_marks, markId],
        );

        await audit(c, u, "correct_assessment_marks", "assessment_marks", markId, {
          old_marks: mark.obtained_marks,
          new_marks: d.new_marks,
          reason: d.reason,
        });

        return { ok: true, obtained_marks: d.new_marks, revision: mark.revision + 1 };
      }),
    );
  });

  // --------------------------------------------------------------------------
  // UNIFIED GUARDIAN LEARNER PROGRESS (6.4.1)
  // --------------------------------------------------------------------------

  r.get("/guardian/learners/:id/progress-summary", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "guardian_primary", "guardian_secondary");
    const studentId = id.parse(q.params.id);

    s.json(
      await store.read(async (c) => {
        // Verify Guardian own-child relationship
        const student = await one(
          c,
          `SELECT st.id, st.full_name, st.family_id
           FROM students st
           JOIN family_guardians fg ON fg.family_id = st.family_id
           WHERE st.id = ? AND fg.user_id = ?`,
          [studentId, u.id],
        );
        if (!student) fail(403, "Access to requested learner denied");

        // 1. Enrollments
        const enrollments = await rows(
          c,
          `SELECT e.id, e.batch_id, e.start_date, e.end_date, e.status,
                  b.label batch_name, b.delivery_mode, co.title course_title
           FROM enrollments e
           JOIN batches b ON b.id = e.batch_id
           JOIN courses co ON co.id = b.course_id
           WHERE e.student_id = ?
           ORDER BY e.id DESC`,
          [studentId],
        );

        const results = [];

        for (const en of enrollments) {
          // 2. Attendance summary (verified held classes only)
          const heldClasses = await rows(
            c,
            `SELECT ss.id, a.status
             FROM class_sessions ss
             LEFT JOIN attendance a ON a.class_id = ss.id AND a.enrollment_id = ?
             WHERE ss.batch_id = ? AND ss.status = 'ended' AND ss.held_verified = 1
               AND substring(ss.scheduled_start, 1, 10) >= ?
               AND (? IS NULL OR substring(ss.scheduled_start, 1, 10) <= ?)`,
            [en.id, en.batch_id, en.start_date, en.end_date, en.end_date],
          );

          let presentCount = 0;
          let lateCount = 0;
          let absentCount = 0;
          let unrecordedCount = 0;

          for (const cl of heldClasses) {
            if (cl.status === "Present") presentCount++;
            else if (cl.status === "Late") lateCount++;
            else if (cl.status === "Absent") absentCount++;
            else unrecordedCount++;
          }

          const totalHeld = heldClasses.length;
          const attended = presentCount + lateCount;
          const attendanceRate =
            totalHeld > 0 && unrecordedCount === 0
              ? Math.round((attended / totalHeld) * 100)
              : null;

          // 3. Homework items for this enrollment
          const homeworkList = await rows(
            c,
            `SELECT h.id, h.title, h.due_date, sh.status, sh.teacher_feedback, sh.completed_at
             FROM homework h
             JOIN student_homework sh ON sh.homework_id = h.id
             WHERE sh.enrollment_id = ?
             ORDER BY h.due_date DESC, h.id DESC LIMIT 50`,
            [en.id],
          );

          const hwTotal = homeworkList.length;
          const hwCompleted = homeworkList.filter((h) => h.status === "completed").length;
          const hwPending = homeworkList.filter((h) => h.status === "assigned" || h.status === "submitted").length;

          // 4. Published Assessment Marks for this enrollment (NEVER draft marks)
          const publishedAssessments = await rows(
            c,
            `SELECT a.title, a.assessment_type, a.max_marks, a.pass_marks, a.assessment_date,
                    am.obtained_marks, am.guardian_feedback, am.published_at
             FROM assessment_marks am
             JOIN assessments a ON a.id = am.assessment_id
             WHERE am.enrollment_id = ? AND am.status = 'published'
             ORDER BY a.assessment_date DESC`,
            [en.id],
          );

          // 5. Published progress updates
          const publications = await rows(
            c,
            `SELECT p.id, p.title, p.progress_summary, p.homework_summary, p.published_at
             FROM published_progress p
             WHERE p.enrollment_id = ?
             ORDER BY p.id DESC LIMIT 5`,
            [en.id],
          );

          results.push({
            enrollment_id: en.id,
            course_title: en.course_title,
            batch_name: en.batch_name,
            delivery_mode: en.delivery_mode,
            status: en.status,
            attendance: {
              total_held: totalHeld,
              present: presentCount,
              late: lateCount,
              absent: absentCount,
              unrecorded: unrecordedCount,
              attendance_rate: attendanceRate,
              provisional: unrecordedCount > 0,
            },
            homework: {
              total_assigned: hwTotal,
              completed: hwCompleted,
              pending: hwPending,
              recent: homeworkList.slice(0, 5),
            },
            assessments: publishedAssessments.length > 0 ? publishedAssessments : null,
            latest_publications: publications.length > 0 ? publications : null,
          });
        }

        return {
          student_id: student.id,
          student_name: student.full_name,
          enrollments: results,
        };
      }),
    );
  });

  return r;
}

