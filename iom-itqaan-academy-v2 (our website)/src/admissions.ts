import { Router } from "express";
import { z } from "zod";
import {
  type Store,
  type Row,
  rows,
  one,
  write,
  obj,
  fail,
  audit,
} from "./db.js";
import { admins, requireRole, checkBranch, batchScope } from "./security.js";
import { createEnrollment } from "./catalog.js";
const id = z.number().int().positive();
export function admissions(store: Store, now = () => new Date()) {
  const r = Router();
  r.get("/admission-options", async (_q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins, "guardian_primary");
    s.json(
      await store.read(async (c) => {
        const families = await rows(
          c,
          "SELECT f.id,f.name,f.branch_id FROM families f" +
            (u.role === "central_admin"
              ? ""
              : u.role === "branch_admin"
                ? " WHERE f.branch_id=?"
                : " JOIN family_guardians fg ON fg.family_id=f.id WHERE fg.user_id=?"),
          u.role === "central_admin"
            ? []
            : [u.role === "branch_admin" ? u.branch_id : u.id],
        );
        const branches = new Set(families.map((f) => f.branch_id));
        const courses = (
          await rows(
            c,
            "SELECT c.id,c.title,c.department_id,d.name department,d.branch_id FROM courses c JOIN departments d ON d.id=c.department_id",
          )
        ).filter((co) => branches.has(co.branch_id));
        return { families, courses };
      }),
    );
  });
  r.get("/admissions", async (_q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins, "guardian_primary", "guardian_secondary");
    const data = await store.read((c) =>
      rows(
        c,
        "SELECT a.*,c.title course_title,f.name family_name,f.branch_id FROM admission_applications a JOIN families f ON f.id=a.family_id JOIN courses c ON c.id=a.course_id" +
          (u.role === "central_admin"
            ? ""
            : u.role === "branch_admin"
              ? " WHERE f.branch_id=?"
              : " WHERE EXISTS (SELECT 1 FROM family_guardians fg WHERE fg.family_id=a.family_id AND fg.user_id=?)") +
          " ORDER BY a.id DESC LIMIT 200",
        u.role === "central_admin"
          ? []
          : [u.role === "branch_admin" ? u.branch_id : u.id],
      ),
    );
    s.json(
      u.role.startsWith("guardian")
        ? data.map((a) =>
            Object.fromEntries(
              [
                "id",
                "student_name",
                "birth_date",
                "academic_level",
                "family_id",
                "family_name",
                "course_id",
                "course_title",
                "status",
                "method",
                "review_reason",
                "enrollment_id",
                "created_at",
                "updated_at",
              ].map((k) => [k, a[k]]),
            ),
          )
        : data,
    );
  });
  r.post("/admissions", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins, "guardian_primary");
    const d = z
      .object({
        family_id: id,
        student_id: id.nullable().optional(),
        course_id: id,
        student_name: z.string().trim().min(2).max(150),
        birth_date: z.iso.date(),
        academic_level: z.string().trim().min(1).max(150),
        contact_phone: z.string().trim().min(3).max(80),
        country: z.string().trim().min(2).max(100),
        method: z.enum(["direct", "assessment"]),
        request_id: z.string().min(12).max(80),
      })
      .parse(q.body);
    if (d.birth_date > now().toISOString().slice(0, 10))
      fail(400, "Birth date cannot be in the future");
    s.json(
      await store.transaction(async (c) => {
        // Serialize retries per submitting identity; uniqueness is also enforced in SQL.
        await obj(c, "users", u.id, true);
        const family = await obj(c, "families", d.family_id),
          course = await obj(c, "courses", d.course_id),
          dep = await obj(c, "departments", course.department_id);
        if (u.role.startsWith("guardian")) {
          if (
            !(await one(
              c,
              "SELECT 1 FROM family_guardians WHERE family_id=? AND user_id=?",
              [family.id, u.id],
            ))
          )
            fail(403, "Own family only");
        } else checkBranch(u, family.branch_id);
        if (dep.branch_id !== family.branch_id)
          fail(400, "Course and family branch mismatch");
        if (d.student_id) {
          const student = await obj(c, "students", d.student_id);
          if (
            student.family_id !== family.id ||
            student.branch_id !== family.branch_id
          )
            fail(400, "Student family mismatch");
        }
        const prior = await one(
          c,
          "SELECT * FROM admission_applications WHERE created_by=? AND request_id=?",
          [u.id, d.request_id],
        );
        if (prior) {
          if (
            prior.family_id !== d.family_id ||
            prior.course_id !== d.course_id ||
            prior.student_name !== d.student_name ||
            prior.birth_date !== d.birth_date ||
            prior.academic_level !== d.academic_level ||
            prior.method !== d.method ||
            prior.student_id !== (d.student_id || null) ||
            prior.contact_phone !== d.contact_phone ||
            prior.country !== d.country
          )
            fail(409, "Request already used for another application");
          return { id: prior.id, already_submitted: true };
        }
        const at = now().toISOString(),
          v = await write(
            c,
            "INSERT INTO admission_applications(family_id,student_id,course_id,student_name,birth_date,academic_level,contact_phone,country,method,request_id,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
              d.family_id,
              d.student_id || null,
              d.course_id,
              d.student_name,
              d.birth_date,
              d.academic_level,
              d.contact_phone,
              d.country,
              d.method,
              d.request_id,
              u.id,
              at,
              at,
            ],
          );
        await audit(c, u, "apply", "admission", v.insertId);
        return { id: v.insertId };
      }),
    );
  });
  r.post("/admissions/:id/review", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        expected_revision: z.number().int().positive(),
        status: z.enum(["reviewing", "rejected"]),
        assessment_note: z.string().max(5000).default(""),
        review_reason: z.string().trim().max(2000).default(""),
      })
      .parse(q.body);
    if (d.status === "rejected" && !d.review_reason)
      fail(400, "Rejection reason required");
    await store.transaction(async (c) => {
      const a = await one(
        c,
        "SELECT * FROM admission_applications WHERE id=? FOR UPDATE",
        [uid],
      );
      if (!a) fail(404, "Application not found");
      const family = await obj(c, "families", a.family_id);
      checkBranch(u, family.branch_id);
      if (
        a.revision !== d.expected_revision ||
        !["submitted", "reviewing"].includes(a.status)
      )
        fail(409, "Application changed or closed");
      await write(
        c,
        "UPDATE admission_applications SET status=?,assessment_note=?,review_reason=?,reviewed_by=?,revision=revision+1,updated_at=? WHERE id=?",
        [
          d.status,
          d.assessment_note,
          d.review_reason,
          u.id,
          now().toISOString(),
          uid,
        ],
      );
      await audit(c, u, "review", "admission", uid, { status: d.status });
    });
    s.json({ ok: true });
  });
  r.post("/admissions/:id/accept", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        expected_revision: z.number().int().positive(),
        batch_id: id,
        start_date: z.iso.date(),
        end_date: z.iso.date().nullable().optional(),
        placement_note: z.string().trim().min(2).max(5000),
        assessment_note: z.string().trim().max(5000).default(""),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const a = await one(
          c,
          "SELECT * FROM admission_applications WHERE id=? FOR UPDATE",
          [uid],
        );
        if (!a) fail(404, "Application not found");
        const family = await obj(c, "families", a.family_id);
        checkBranch(u, family.branch_id);
        if (a.status === "accepted")
          return { enrollment_id: a.enrollment_id, already_accepted: true };
        if (
          a.revision !== d.expected_revision ||
          !["submitted", "reviewing"].includes(a.status)
        )
          fail(409, "Application changed or closed");
        if (
          a.method === "assessment" &&
          !(d.assessment_note || a.assessment_note)
        )
          fail(400, "Record approved assessment outcome before accepting");
        const batch = await batchScope(c, d.batch_id, u, "admin");
        if (batch.course_id !== a.course_id)
          fail(400, "Placement must use the applied course");
        let student = a.student_id;
        if (!student) {
          student = (
            await write(
              c,
              "INSERT INTO students(full_name,branch_id,family_id,created_at) VALUES (?,?,?,?)",
              [
                a.student_name,
                family.branch_id,
                family.id,
                now().toISOString(),
              ],
            )
          ).insertId;
        }
        const enrollment = await createEnrollment(c, u, {
          student_id: student,
          batch_id: d.batch_id,
          start_date: d.start_date,
          end_date: d.end_date,
        });
        await write(
          c,
          "UPDATE admission_applications SET status='accepted',student_id=?,enrollment_id=?,assessment_note=?,placement_note=?,reviewed_by=?,revision=revision+1,updated_at=? WHERE id=?",
          [
            student,
            enrollment.id,
            d.assessment_note || a.assessment_note || "",
            d.placement_note,
            u.id,
            now().toISOString(),
            uid,
          ],
        );
        await audit(c, u, "accept", "admission", uid, {
          enrollment_id: enrollment.id,
        });
        return { enrollment_id: enrollment.id, student_id: student };
      }),
    );
  });
  return r;
}
