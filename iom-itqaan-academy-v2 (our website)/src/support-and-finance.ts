import { Router } from "express";
import { z } from "zod";
import {
  type Store,
  rows,
  one,
  write,
  fail,
  audit,
} from "./db.js";
import { batchScope, requireRole } from "./security.js";

const id = z.coerce.number().int().positive();
const monthStr = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const httpUrl = (maxLen: number) =>
  z
    .string()
    .trim()
    .url()
    .max(maxLen)
    .refine((v) => /^https?:\/\//i.test(v), "Only http/https URLs are permitted");
const urlStr = httpUrl(1000);

export function supportAndFinance(store: Store, now = () => new Date()) {
  const r = Router();

  // --------------------------------------------------------------------------
  // PAYMENT STATUS & REFERENCE VIEW (7.1.1, D-015, D-141, D-171)
  // --------------------------------------------------------------------------

  // Get payment status for enrollment and month
  r.get("/payments/status", async (q, s) => {
    const u = s.locals.user;
    const enrollmentId = id.parse(q.query.enrollment_id);
    const month = monthStr.parse(q.query.month);

    s.json(
      await store.read(async (c) => {
        // Scope verification
        const en = await one(
          c,
          `SELECT e.*, st.family_id, st.full_name student_name, b.label batch_name, co.title course_title, co.department_id, d.branch_id
           FROM enrollments e
           JOIN students st ON st.id = e.student_id
           JOIN batches b ON b.id = e.batch_id
           JOIN courses co ON co.id = b.course_id
           JOIN departments d ON d.id = co.department_id
           WHERE e.id = ?`,
          [enrollmentId],
        );
        if (!en) fail(404, "Enrollment not found");

        if (u.role.startsWith("guardian")) {
          const fg = await one(
            c,
            "SELECT 1 FROM family_guardians WHERE family_id = ? AND user_id = ?",
            [en.family_id, u.id],
          );
          if (!fg) fail(403, "Access to learner payment status denied");
        } else if (u.role !== "central_admin") {
          if (u.branch_id !== en.branch_id) fail(403, "Out of branch");
          if (u.role === "department_supervisor" && u.department_id !== en.department_id)
            fail(403, "Outside department scope");
        }

        const ref = await one(
          c,
          "SELECT * FROM payment_references WHERE enrollment_id = ? AND billing_month = ?",
          [enrollmentId, month],
        );

        if (ref) {
          return {
            enrollment_id: en.id,
            student_name: en.student_name,
            course_title: en.course_title,
            batch_name: en.batch_name,
            billing_month: month,
            payment_status: ref.payment_status,
            reference_code: ref.reference_code,
            portal_url: ref.portal_url || "https://payment.academy.local/portal",
            verified_at: ref.verified_at,
            notes: ref.notes,
            external_authority_notice:
              "Authoritative collection and payment confirmation lives in the external Payment Portal.",
          };
        }

        // Honest missing state when no confirmed payment reference exists
        return {
          enrollment_id: en.id,
          student_name: en.student_name,
          course_title: en.course_title,
          batch_name: en.batch_name,
          billing_month: month,
          payment_status: "unknown",
          reference_code: null,
          portal_url: "https://payment.academy.local/portal",
          verified_at: null,
          notes: null,
          message:
            "No verified payment reference recorded for this period. Verify status directly in Payment Portal.",
          external_authority_notice:
            "Authoritative collection and payment confirmation lives in the external Payment Portal.",
        };
      }),
    );
  });

  // Guardian views all verified payment references for linked children
  r.get("/guardian/payments", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "guardian_primary", "guardian_secondary");

    s.json(
      await store.read(async (c) => {
        const list = await rows(
          c,
          `SELECT pr.id, pr.enrollment_id, pr.billing_month, pr.reference_code,
                  pr.payment_status, pr.portal_url, pr.verified_at, pr.notes,
                  st.id student_id, st.full_name student_name,
                  co.title course_title, b.label batch_name
           FROM payment_references pr
           JOIN enrollments e ON e.id = pr.enrollment_id
           JOIN students st ON st.id = e.student_id
           JOIN batches b ON b.id = e.batch_id
           JOIN courses co ON co.id = b.course_id
           JOIN family_guardians fg ON fg.family_id = st.family_id
           WHERE fg.user_id = ?
           ORDER BY pr.billing_month DESC, pr.id DESC LIMIT 100`,
          [u.id],
        );
        return list;
      }),
    );
  });

  // Admin records verified external payment reference
  r.post("/payments/references", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "branch_admin", "central_admin");
    const d = z
      .object({
        enrollment_id: id,
        billing_month: monthStr,
        reference_code: z.string().trim().min(1).max(80),
        payment_status: z.enum(["paid", "due", "waived", "unknown"]).default("paid"),
        portal_url: httpUrl(500).optional(),
        notes: z.string().trim().max(1000).optional(),
      })
      .parse(q.body);

    s.json(
      await store.transaction(async (c) => {
        const en = await one(
          c,
          `SELECT e.*, d.branch_id FROM enrollments e
           JOIN batches b ON b.id = e.batch_id
           JOIN courses co ON co.id = b.course_id
           JOIN departments d ON d.id = co.department_id
           WHERE e.id = ?`,
          [d.enrollment_id],
        );
        if (!en) fail(404, "Enrollment not found");
        if (u.role === "branch_admin" && u.branch_id !== en.branch_id)
          fail(403, "Out of branch");

        const updatedAt = now().toISOString();
        const existing = await one(
          c,
          "SELECT id FROM payment_references WHERE enrollment_id = ? AND billing_month = ? FOR UPDATE",
          [d.enrollment_id, d.billing_month],
        );

        let refId: number;
        if (existing) {
          await write(
            c,
            `UPDATE payment_references
             SET reference_code = ?, payment_status = ?, portal_url = ?, verified_at = ?, notes = ?, updated_by = ?, updated_at = ?
             WHERE id = ?`,
            [
              d.reference_code,
              d.payment_status,
              d.portal_url || null,
              updatedAt,
              d.notes || null,
              u.id,
              updatedAt,
              existing.id,
            ],
          );
          refId = existing.id;
        } else {
          const res = await write(
            c,
            `INSERT INTO payment_references (enrollment_id, billing_month, reference_code, payment_status, portal_url, verified_at, notes, updated_by, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              d.enrollment_id,
              d.billing_month,
              d.reference_code,
              d.payment_status,
              d.portal_url || null,
              updatedAt,
              d.notes || null,
              u.id,
              updatedAt,
            ],
          );
          refId = res.insertId;
        }

        await audit(c, u, "record_payment_reference", "payment_references", refId, {
          enrollment_id: d.enrollment_id,
          billing_month: d.billing_month,
          payment_status: d.payment_status,
        });

        return { id: refId, ok: true, payment_status: d.payment_status };
      }),
    );
  });

  // Admin lists verified payment references
  r.get("/payments/references", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "branch_admin", "central_admin");
    s.json(
      await store.read(async (c) => {
        let branchSql = "1=1";
        const args: any[] = [];
        if (u.role === "branch_admin") {
          branchSql = "d.branch_id = ?";
          args.push(u.branch_id);
        }
        return rows(
          c,
          `SELECT pr.id, pr.enrollment_id, pr.billing_month, pr.reference_code,
                  pr.payment_status, pr.portal_url, pr.verified_at, pr.notes,
                  st.id student_id, st.full_name student_name,
                  co.title course_title, b.label batch_name
           FROM payment_references pr
           JOIN enrollments e ON e.id = pr.enrollment_id
           JOIN students st ON st.id = e.student_id
           JOIN batches b ON b.id = e.batch_id
           JOIN courses co ON co.id = b.course_id
           JOIN departments d ON d.id = co.department_id
           WHERE ${branchSql}
           ORDER BY pr.billing_month DESC, pr.id DESC LIMIT 100`,
          args,
        );
      }),
    );
  });

  // --------------------------------------------------------------------------
  // CONTROLLED ANNOUNCEMENTS & MANUAL SUPPORT (7.4.1)
  // --------------------------------------------------------------------------

  // List announcements
  r.get("/announcements", async (q, s) => {
    const u = s.locals.user;
    const currentTime = now().toISOString();

    s.json(
      await store.read(async (c) => {
        if (u.role.startsWith("guardian")) {
          // Announcements relevant to guardian's children (branch or enrolled batches)
          const list = await rows(
            c,
            `SELECT DISTINCT a.id, a.title, a.body, a.priority, a.created_at,
                    b.label batch_name, br.name branch_name
             FROM announcements a
             JOIN branches br ON br.id = a.branch_id
             LEFT JOIN batches b ON b.id = a.batch_id
             WHERE (a.expires_at IS NULL OR a.expires_at >= ?)
               AND (
                 a.batch_id IN (
                   SELECT e.batch_id FROM enrollments e
                   JOIN students st ON st.id = e.student_id
                   JOIN family_guardians fg ON fg.family_id = st.family_id
                   WHERE fg.user_id = ?
                 )
                 OR (a.batch_id IS NULL AND a.branch_id IN (
                   SELECT fam.branch_id FROM families fam
                   JOIN family_guardians fg ON fg.family_id = fam.id
                   WHERE fg.user_id = ?
                 ))
               )
             ORDER BY a.priority = 'urgent' DESC, a.created_at DESC LIMIT 50`,
            [currentTime, u.id, u.id],
          );
          return list;
        }

        // Staff access
        let scopeSql = "1=1";
        const scopeArgs: any[] = [];
        if (u.role !== "central_admin") {
          scopeSql = "(a.branch_id = ?)";
          scopeArgs.push(u.branch_id);
          if (u.role === "zimmadar") {
            scopeSql += " AND (a.batch_id IS NULL OR a.batch_id IN (SELECT id FROM batches WHERE zimmadar_id = ?))";
            scopeArgs.push(u.id);
          } else if (u.role === "teacher") {
            scopeSql += " AND (a.batch_id IS NULL OR a.batch_id IN (SELECT id FROM batches WHERE teacher_id = ?))";
            scopeArgs.push(u.id);
          }
        }

        const items = await rows(
          c,
          `SELECT a.id, a.branch_id, a.department_id, a.batch_id, a.title, a.body,
                  a.priority, a.created_at, a.expires_at, u.name author_name,
                  br.name branch_name, b.label batch_name
           FROM announcements a
           JOIN branches br ON br.id = a.branch_id
           JOIN users u ON u.id = a.created_by
           LEFT JOIN batches b ON b.id = a.batch_id
           WHERE ${scopeSql} AND (a.expires_at IS NULL OR a.expires_at >= ?)
           ORDER BY a.priority = 'urgent' DESC, a.created_at DESC LIMIT 100`,
          [...scopeArgs, currentTime],
        );
        return items;
      }),
    );
  });

  // Post announcement
  r.post("/announcements", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin", "branch_admin", "department_supervisor", "zimmadar");
    const d = z
      .object({
        branch_id: id,
        department_id: id.nullable().optional(),
        batch_id: id.nullable().optional(),
        title: z.string().trim().min(1).max(150),
        body: z.string().trim().min(1).max(10000),
        priority: z.enum(["normal", "urgent"]).default("normal"),
        expires_at: z.string().nullable().optional(),
        request_id: z.string().min(12).max(80),
      })
      .parse(q.body);

    s.json(
      await store.transaction(async (c) => {
        if (u.role !== "central_admin" && u.branch_id !== d.branch_id)
          fail(403, "Out of branch");

        if (!d.batch_id && !d.department_id && !["central_admin", "branch_admin"].includes(u.role))
          fail(403, "Branch-wide announcements require admin role");

        if (u.role === "zimmadar" && !d.batch_id)
          fail(403, "Zimmadar announcements must target an assigned batch");

        if (d.department_id) {
          const dept = await one(c, "SELECT id, branch_id FROM departments WHERE id = ?", [
            d.department_id,
          ]);
          if (!dept) fail(404, "Department not found");
          if (dept.branch_id !== d.branch_id)
            fail(400, "Department does not belong to specified branch");
          if (u.role === "department_supervisor" && u.department_id !== d.department_id)
            fail(403, "Out of department");
        }

        if (d.batch_id) {
          const batch = await batchScope(c, d.batch_id, u, "manage");
          if (batch.branch_id !== d.branch_id)
            fail(400, "Batch does not belong to specified branch");
          if (d.department_id && batch.department_id !== d.department_id)
            fail(400, "Batch does not belong to specified department");
          if (u.role === "zimmadar" && batch.zimmadar_id !== u.id)
            fail(403, "Assigned Batch Zimmadar only");
        }

        // Idempotency check
        const existing = await one(
          c,
          `SELECT id, branch_id, department_id, batch_id, title, body, priority, expires_at
           FROM announcements WHERE created_by = ? AND request_id = ?`,
          [u.id, d.request_id],
        );
        if (existing) {
          if (
            existing.branch_id !== d.branch_id ||
            (existing.department_id ?? null) !== (d.department_id ?? null) ||
            (existing.batch_id ?? null) !== (d.batch_id ?? null) ||
            existing.title !== d.title ||
            existing.body !== d.body ||
            existing.priority !== d.priority ||
            (existing.expires_at ?? null) !== (d.expires_at ?? null)
          ) {
            fail(409, "Request already used with different parameters");
          }
          return { id: existing.id, already_created: true };
        }

        const createdAt = now().toISOString();
        const res = await write(
          c,
          `INSERT INTO announcements (branch_id, department_id, batch_id, title, body, priority, created_by, created_at, expires_at, request_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            d.branch_id,
            d.department_id || null,
            d.batch_id || null,
            d.title,
            d.body,
            d.priority,
            u.id,
            createdAt,
            d.expires_at || null,
            d.request_id,
          ],
        );

        await audit(c, u, "create_announcement", "announcements", res.insertId, {
          branch_id: d.branch_id,
          title: d.title,
          priority: d.priority,
        });

        return { id: res.insertId, created_at: createdAt };
      }),
    );
  });

  // Manual support path information
  r.get("/support/info", async (q, s) => {
    const u = s.locals.user;
    s.json(
      await store.read(async (c) => {
        let branchId = u.branch_id;
        if (u.role.startsWith("guardian") && !branchId) {
          const fam = await one(
            c,
            "SELECT branch_id FROM families fam JOIN family_guardians fg ON fg.family_id = fam.id WHERE fg.user_id = ? LIMIT 1",
            [u.id],
          );
          branchId = fam?.branch_id || 1;
        }

        const branch = await one(c, "SELECT id, name FROM branches WHERE id = ?", [branchId || 1]);

        return {
          branch_id: branch?.id || 1,
          branch_name: branch?.name || "Main Campus",
          helpline: "+880-1700-000000",
          whatsapp_url: "https://wa.me/8801700000000",
          support_email: "support@academy.local",
          office_hours: "9:00 AM - 5:00 PM (Saturday - Thursday)",
          portal_url: "https://payment.academy.local/portal",
          instructions:
            "For payment verification, admission inquiries, or operational assistance, please contact the branch office directly via WhatsApp or helpline.",
        };
      }),
    );
  });

  // --------------------------------------------------------------------------
  // COURSE RESOURCES (7.5.1)
  // --------------------------------------------------------------------------

  // List course resources
  r.get("/resources", async (q, s) => {
    const u = s.locals.user;
    const courseId = q.query.course_id ? id.parse(q.query.course_id) : undefined;
    const batchId = q.query.batch_id ? id.parse(q.query.batch_id) : undefined;

    s.json(
      await store.read(async (c) => {
        if (u.role.startsWith("guardian")) {
          // Guardians: resources for courses/batches their children are enrolled in
          const list = await rows(
            c,
            `SELECT cr.id, cr.course_id, cr.batch_id, cr.title, cr.url, cr.category,
                    cr.description, cr.created_at, co.title course_title, b.label batch_name
             FROM course_resources cr
             JOIN courses co ON co.id = cr.course_id
             LEFT JOIN batches b ON b.id = cr.batch_id
             WHERE cr.course_id IN (
               SELECT b2.course_id FROM enrollments e
               JOIN batches b2 ON b2.id = e.batch_id
               JOIN students st ON st.id = e.student_id
               JOIN family_guardians fg ON fg.family_id = st.family_id
               WHERE fg.user_id = ?
             )
             AND (cr.batch_id IS NULL OR cr.batch_id IN (
               SELECT e.batch_id FROM enrollments e
               JOIN students st ON st.id = e.student_id
               JOIN family_guardians fg ON fg.family_id = st.family_id
               WHERE fg.user_id = ?
             ))
             ${courseId ? "AND cr.course_id = ?" : ""}
             ${batchId ? "AND cr.batch_id = ?" : ""}
             ORDER BY cr.id DESC LIMIT 100`,
            [u.id, u.id, ...(courseId ? [courseId] : []), ...(batchId ? [batchId] : [])],
          );
          return list;
        }

        // Staff access
        let scopeSql = "1=1";
        const scopeArgs: any[] = [];
        if (u.role !== "central_admin") {
          scopeSql = "d.branch_id = ?";
          scopeArgs.push(u.branch_id);
          if (u.role === "department_supervisor") {
            scopeSql += " AND co.department_id = ?";
            scopeArgs.push(u.department_id);
          } else if (u.role === "teacher") {
            scopeSql += " AND (cr.batch_id IS NULL OR cr.batch_id IN (SELECT id FROM batches WHERE teacher_id = ?))";
            scopeArgs.push(u.id);
          }
        }

        const items = await rows(
          c,
          `SELECT cr.id, cr.course_id, cr.batch_id, cr.title, cr.url, cr.category,
                  cr.description, cr.created_at, co.title course_title, b.label batch_name,
                  u.name author_name
           FROM course_resources cr
           JOIN courses co ON co.id = cr.course_id
           JOIN departments d ON d.id = co.department_id
           JOIN users u ON u.id = cr.created_by
           LEFT JOIN batches b ON b.id = cr.batch_id
           WHERE ${scopeSql}
             ${courseId ? "AND cr.course_id = ?" : ""}
             ${batchId ? "AND cr.batch_id = ?" : ""}
           ORDER BY cr.id DESC LIMIT 100`,
          [...scopeArgs, ...(courseId ? [courseId] : []), ...(batchId ? [batchId] : [])],
        );
        return items;
      }),
    );
  });

  // Create course resource
  r.post("/resources", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "teacher", "zimmadar", "branch_admin", "central_admin");
    const d = z
      .object({
        course_id: id,
        batch_id: id.nullable().optional(),
        title: z.string().trim().min(1).max(150),
        url: urlStr,
        category: z.enum(["syllabus", "book", "link", "material"]).default("material"),
        description: z.string().trim().max(2000).nullable().optional(),
        request_id: z.string().min(12).max(80),
      })
      .parse(q.body);

    s.json(
      await store.transaction(async (c) => {
        const course = await one(
          c,
          `SELECT co.*, d.branch_id FROM courses co
           JOIN departments d ON d.id = co.department_id
           WHERE co.id = ?`,
          [d.course_id],
        );
        if (!course) fail(404, "Course not found");
        if (u.role !== "central_admin" && u.branch_id !== course.branch_id)
          fail(403, "Out of branch");

        if (d.batch_id) {
          const batch = await batchScope(c, d.batch_id, u, u.role === "teacher" ? "teach" : "manage");
          if (batch.course_id !== d.course_id)
            fail(400, "Batch does not belong to specified course");
        }

        // Idempotency check
        const existing = await one(
          c,
          "SELECT id FROM course_resources WHERE created_by = ? AND request_id = ?",
          [u.id, d.request_id],
        );
        if (existing) return { id: existing.id, already_created: true };

        const createdAt = now().toISOString();
        const res = await write(
          c,
          `INSERT INTO course_resources (course_id, batch_id, title, url, category, description, created_by, created_at, request_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            d.course_id,
            d.batch_id || null,
            d.title,
            d.url,
            d.category,
            d.description || null,
            u.id,
            createdAt,
            d.request_id,
          ],
        );

        await audit(c, u, "create_course_resource", "course_resources", res.insertId, {
          course_id: d.course_id,
          title: d.title,
        });

        return { id: res.insertId, created_at: createdAt };
      }),
    );
  });

  return r;
}

