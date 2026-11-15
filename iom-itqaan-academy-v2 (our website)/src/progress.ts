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

// Explicit projection: no internal report body, review reason or follow-up note.
const projection = `SELECT p.id,p.enrollment_id,p.title,p.progress_summary,p.homework_summary,p.published_at,
 st.id student_id,st.full_name student_name,b.label batch_name,b.delivery_mode,co.title course_title
 FROM published_progress p JOIN enrollments e ON e.id=p.enrollment_id
 JOIN students st ON st.id=e.student_id JOIN batches b ON b.id=e.batch_id
 JOIN courses co ON co.id=b.course_id JOIN departments d ON d.id=co.department_id`;

function scope(u: Row): { sql: string; args: any[] } {
  if (u.role === "department_supervisor")
    return {
      sql: "d.branch_id=? AND co.department_id=?",
      args: [u.branch_id, u.department_id],
    };
  if (u.role.startsWith("guardian"))
    return {
      sql: "EXISTS (SELECT 1 FROM family_guardians fg WHERE fg.family_id=st.family_id AND fg.user_id=?)",
      args: [u.id],
    };
  if (u.role === "central_admin") return { sql: "1=1", args: [] };
  if (u.role === "branch_admin")
    return { sql: "d.branch_id=?", args: [u.branch_id] };
  if (u.role === "teacher")
    return {
      sql:
        "b.teacher_id=? AND d.branch_id=?" +
        (u.department_id ? " AND co.department_id=?" : ""),
      args: [u.id, u.branch_id, ...(u.department_id ? [u.department_id] : [])],
    };
  if (u.role === "zimmadar")
    return {
      sql:
        "b.zimmadar_id=? AND d.branch_id=?" +
        (u.department_id ? " AND co.department_id=?" : ""),
      args: [u.id, u.branch_id, ...(u.department_id ? [u.department_id] : [])],
    };
  return fail(403, "No progress access");
}

export function progress(store: Store, now = () => new Date()) {
  const r = Router();
  r.get("/progress", async (q, s) => {
    const u = s.locals.user,
      access = scope(u);
    const enrollment =
      q.query.enrollment_id === undefined
        ? undefined
        : z.coerce.number().int().positive().parse(q.query.enrollment_id);
    s.json(
      await store.read((c) =>
        rows(
          c,
          projection +
            " WHERE " +
            access.sql +
            (enrollment ? " AND e.id=?" : "") +
            " ORDER BY p.id DESC LIMIT 200",
          [...access.args, ...(enrollment ? [enrollment] : [])],
        ),
      ),
    );
  });
  r.post("/progress", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "zimmadar");
    const d = z
      .object({
        enrollment_id: z.number().int().positive(),
        request_id: z.string().uuid(),
        title: z.string().trim().min(1).max(150),
        progress_summary: z.string().trim().min(1).max(5000),
        homework_summary: z.string().trim().max(5000).default(""),
      })
      .strict()
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const en = await obj(c, "enrollments", d.enrollment_id, true);
        const batch = await batchScope(c, en.batch_id, u, "manage");
        if (batch.zimmadar_id !== u.id) fail(403, "Assigned Zimmadar only");
        // Serialize same-publisher retries, including requests for different learners.
        await obj(c, "users", u.id, true);
        const old = await one(
          c,
          "SELECT * FROM published_progress WHERE publisher_id=? AND request_id=?",
          [u.id, d.request_id],
        );
        if (old) {
          if (
            old.enrollment_id !== d.enrollment_id ||
            old.title !== d.title ||
            old.progress_summary !== d.progress_summary ||
            old.homework_summary !== d.homework_summary
          )
            fail(
              409,
              "Publication request already used with different content",
            );
          return { id: old.id, published_at: old.published_at };
        }
        const at = now().toISOString();
        const v = await write(
          c,
          "INSERT INTO published_progress(enrollment_id,publisher_id,request_id,title,progress_summary,homework_summary,published_at) VALUES (?,?,?,?,?,?,?)",
          [
            d.enrollment_id,
            u.id,
            d.request_id,
            d.title,
            d.progress_summary,
            d.homework_summary,
            at,
          ],
        );
        await audit(
          c,
          u,
          "publish_progress",
          "published_progress",
          v.insertId,
          { enrollment_id: d.enrollment_id },
        );
        return { id: v.insertId, published_at: at };
      }),
    );
  });
  r.get("/guardian/attendance", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "guardian_primary", "guardian_secondary");
    const month = z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .parse(q.query.month);
    s.json(
      await store.read((c) =>
        rows(
          c,
          `SELECT e.id enrollment_id,st.id student_id,st.full_name student_name,
      co.title course_title,b.label batch_name,b.delivery_mode,ss.id class_id,ss.scheduled_start,
      a.status attendance_status FROM enrollments e JOIN students st ON st.id=e.student_id
      JOIN batches b ON b.id=e.batch_id JOIN courses co ON co.id=b.course_id
      JOIN class_sessions ss ON ss.batch_id=b.id
      LEFT JOIN attendance a ON a.class_id=ss.id AND a.enrollment_id=e.id
      WHERE EXISTS (SELECT 1 FROM family_guardians fg WHERE fg.family_id=st.family_id AND fg.user_id=?)
      AND ss.status='ended' AND ss.held_verified=1 AND substring(ss.scheduled_start,1,7)=?
      AND substring(ss.scheduled_start,1,10)>=e.start_date
      AND (e.end_date IS NULL OR substring(ss.scheduled_start,1,10)<=e.end_date)
      ORDER BY ss.scheduled_start DESC,e.id DESC LIMIT 200`,
          [u.id, month],
        ),
      ),
    );
  });
  return r;
}
