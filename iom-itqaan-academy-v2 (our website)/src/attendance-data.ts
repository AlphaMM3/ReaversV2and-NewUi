import type { PoolConnection } from "mysql2/promise";
import { type Row, one, rows, obj, fail } from "./db.js";
import { batchScope, checkBranch, checkDepartment, staff } from "./security.js";
import { bd, parseLocal, attendanceTotals } from "./policy.js";
export const attendancePolicy = "attendance-2026-11-04";
export async function enrollmentAccess(c: PoolConnection, id: number, u: Row) {
  const en = await obj(c, "enrollments", id),
    student = await obj(c, "students", en.student_id);
  const b = await one(
    c,
    "SELECT b.*,d.branch_id,co.department_id,co.title course_title FROM batches b JOIN courses co ON co.id=b.course_id JOIN departments d ON d.id=co.department_id WHERE b.id=?",
    [en.batch_id],
  );
  if (!b) fail(404, "Batch not found");
  if (u.role.startsWith("guardian")) {
    if (
      !(await one(
        c,
        "SELECT 1 FROM family_guardians WHERE family_id=? AND user_id=?",
        [student.family_id, u.id],
      ))
    )
      fail(403, "Own family only");
  } else if (u.role === "teacher") {
    checkBranch(u, b.branch_id);
    checkDepartment(u, b.department_id);
    if (
      b.teacher_id !== u.id &&
      !(await one(
        c,
        "SELECT id FROM class_sessions WHERE batch_id=? AND actual_teacher_id=? LIMIT 1",
        [b.id, u.id],
      ))
    )
      fail(403, "Assigned learner only");
  } else await batchScope(c, en.batch_id, u);
  return { en, student, b };
}
export function inclusiveLeave(start: string, end: string) {
  return {
    start: +parseLocal(start + "T00:00:00+06:00"),
    end: +parseLocal(end + "T23:59:59.999+06:00"),
  };
}
export function mergedIntervals(leaves: Row[]) {
  const list = leaves
    .filter((v) => v.status === "approved")
    .map((v) => ({ ...inclusiveLeave(v.start_date, v.end_date), ids: [v.id] }))
    .sort((a, b) => a.start - b.start);
  const result: typeof list = [];
  for (const v of list) {
    const prior = result.at(-1);
    if (prior && v.start <= prior.end + 1) {
      prior.end = Math.max(prior.end, v.end);
      prior.ids.push(...v.ids);
    } else result.push({ ...v });
  }
  return result;
}
export async function attendanceFacts(c: PoolConnection, en: Row, now: Date) {
  const classes = await rows(
    c,
    "SELECT ss.id,ss.scheduled_start,ss.actual_start,ss.actual_end,ss.actual_teacher_id,a.id attendance_id,a.status,a.join_time,a.verified_at FROM class_sessions ss LEFT JOIN attendance a ON a.class_id=ss.id AND a.enrollment_id=? WHERE ss.batch_id=? AND ss.status='ended' AND ss.held_verified=1 AND ss.actual_start IS NOT NULL AND ss.actual_end IS NOT NULL AND substring(ss.scheduled_start,1,10)>=? AND (? IS NULL OR substring(ss.scheduled_start,1,10)<=?) ORDER BY ss.scheduled_start,ss.id",
    [en.id, en.batch_id, en.start_date, en.end_date, en.end_date],
  );
  const held = classes.filter(
    (v) =>
      +parseLocal(v.actual_end) <= +now &&
      +parseLocal(v.scheduled_start) <= +now,
  );
  const leaves = await rows(
    c,
    "SELECT * FROM student_leaves WHERE enrollment_id=? ORDER BY start_date,id",
    [en.id],
  );
  return { held, leaves, intervals: mergedIntervals(leaves) };
}
export function monthMetrics(held: Row[], month: string) {
  const selected = held.filter((v) => v.scheduled_start.slice(0, 7) === month);
  return {
    month,
    ...attendanceTotals(selected.map((v) => v.status)),
    class_ids: selected.map((v) => v.id),
  };
}
// Deadlines are computed from the original cycle, so downtime cannot lose a pause.
export function pausedDeadline(
  origin: number,
  hours: number,
  intervals: { start: number; end: number }[],
  now: number,
) {
  let due = origin + hours * 3600000;
  for (const leave of intervals) {
    if (leave.end < origin || leave.start > now) continue;
    const start = Math.max(origin, leave.start);
    if (start > due) due = Math.max(due, leave.end + 1);
    else due += leave.end - start + 1;
  }
  return new Date(due).toISOString();
}
export function currentMonth(now: Date) {
  return bd(now).slice(0, 7);
}
