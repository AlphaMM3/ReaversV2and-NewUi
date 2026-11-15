import { Router } from "express";
import { type Store, type Row, rows, write, fail } from "./db.js";
import { staff, requireRole } from "./security.js";
import {
  attendanceTotals,
  bd,
  parseLocal,
  reportDue,
  dueStages,
} from "./policy.js";
const base = `SELECT s.id class_id,s.actual_start,s.actual_end,s.actual_teacher_id,b.label batch_name,b.teacher_id,b.zimmadar_id,b.id batch_id,d.branch_id,c.department_id,d.name department,c.title course_title,r.id report_id,r.status report_status,r.first_submitted_at FROM class_sessions s JOIN batches b ON b.id=s.batch_id JOIN courses c ON c.id=b.course_id JOIN departments d ON d.id=c.department_id LEFT JOIN reports r ON r.class_id=s.id WHERE s.status='ended' AND s.actual_start IS NOT NULL AND s.actual_end IS NOT NULL ORDER BY s.actual_end DESC`;
export function canSee(item: Row, u: Row) {
  if (
    u.role !== "central_admin" &&
    (u.branch_id !== item.branch_id ||
      (u.department_id && u.department_id !== item.department_id))
  )
    return false;
  if (u.role === "department_supervisor")
    return Boolean(u.department_id && u.department_id === item.department_id);
  return (
    u.role === "central_admin" ||
    (u.role === "branch_admin" && u.branch_id === item.branch_id) ||
    (u.role === "teacher" &&
      [item.teacher_id, item.actual_teacher_id].includes(u.id)) ||
    (u.role === "zimmadar" && u.id === item.zimmadar_id)
  );
}
export async function processAlerts(store: Store, now = new Date()) {
  return store.transaction(async (c) => {
    const created: Row[] = [];
    for (const s of await rows(c, base)) {
      if (s.first_submitted_at) continue;
      const due = reportDue(s.actual_start, s.actual_end);
      if (!due || due.slice(0, 10) !== bd(now).slice(0, 10)) continue;
      for (const { stage, at } of dueStages(due)) {
        const delta = +now - +parseLocal(at);
        if (delta < 0 || delta >= 300000) continue;
        // Lock the class and recheck submission before inserting the unique outbox event.
        await rows(c, "SELECT id FROM class_sessions WHERE id=? FOR UPDATE", [
          s.class_id,
        ]);
        if (
          (
            await rows(
              c,
              "SELECT first_submitted_at FROM reports WHERE class_id=? FOR UPDATE",
              [s.class_id],
            )
          )[0]?.first_submitted_at
        )
          continue;
        const target =
            stage === "teacher"
              ? s.actual_teacher_id || s.teacher_id
              : stage === "zimmadar"
                ? s.zimmadar_id
                : null,
          delivery_status =
            stage === "supervisor" || (stage !== "management" && !target)
              ? "unassigned"
              : "in_app_queue";
        const v = await write(
          c,
          "INSERT INTO report_alert_events(class_id,due_at,stage,scheduled_at,created_at,target_user_id,delivery_status) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id",
          [
            s.class_id,
            due,
            stage,
            at,
            now.toISOString(),
            target,
            delivery_status,
          ],
        );
        if (v.affectedRows === 1 && v.insertId)
          created.push({ class_id: s.class_id, stage, delivery_status });
      }
    }
    return created;
  });
}
export function monitor(store: Store, now = () => new Date()) {
  const r = Router();
  r.get("/report-monitor", async (_q, s) => {
    const u = s.locals.user;
    requireRole(u, ...staff);
    s.json(
      await store.read(async (c) =>
        (await rows(c, base))
          .filter((v) => canSee(v, u))
          .flatMap((v) => {
            const due = reportDue(v.actual_start, v.actual_end);
            if (!due) return [];
            const pending = !v.first_submitted_at,
              overdue = pending && +now() > +parseLocal(due);
            return [
              {
                ...v,
                due_at: due,
                obligation_status: pending
                  ? overdue
                    ? "overdue"
                    : "awaiting_submission"
                  : v.report_status || "submitted",
                submission_outstanding: pending,
                overdue,
                noon_escalation_enabled: dueStages(due).length > 0,
                eligible_stages: pending
                  ? dueStages(due).filter((d) => +parseLocal(d.at) <= +now())
                  : [],
              },
            ];
          }),
      ),
    );
  });
  r.get("/report-alerts", async (_q, s) => {
    const u = s.locals.user;
    requireRole(u, ...staff);
    s.json(
      await store.read(async (c) =>
        (
          await rows(
            c,
            "SELECT e.*,b.label batch_name,d.branch_id,c.department_id,b.teacher_id,b.zimmadar_id,s.actual_teacher_id FROM report_alert_events e JOIN class_sessions s ON s.id=e.class_id JOIN batches b ON b.id=s.batch_id JOIN courses c ON c.id=b.course_id JOIN departments d ON d.id=c.department_id ORDER BY e.id DESC",
          )
        )
          .filter((v) => canSee(v, u))
          .slice(0, 500),
      ),
    );
  });
  r.post("/report-alerts/check-now", async (_q, s) => {
    requireRole(s.locals.user, "central_admin");
    s.json({
      logged_events: await processAlerts(store, now()),
      channel: "in_app_only",
    });
  });
  r.get("/attendance/monthly", async (q, s) => {
    const u = s.locals.user,
      month = String(q.query.month || bd(now()).slice(0, 7));
    if (!/^(19\d{2}|20\d{2}|21\d{2}|2200)-(0[1-9]|1[0-2])$/.test(month))
      fail(400, "Month must be YYYY-MM");
    s.json(
      await store.read(async (c) => {
        const result: Row[] = [];
        for (const en of await rows(
          c,
          "SELECT e.id,e.start_date,e.end_date,e.status enrollment_status,s.id student_id,s.full_name student_name,s.family_id,s.branch_id,c.department_id,b.id batch_id,b.label batch_name,b.teacher_id,b.zimmadar_id,b.delivery_mode,c.title course_title FROM enrollments e JOIN students s ON s.id=e.student_id JOIN batches b ON b.id=e.batch_id JOIN courses c ON c.id=b.course_id",
        )) {
          if (
            !canSee(en, u) &&
            !(
              u.role.startsWith("guardian") &&
              (
                await rows(
                  c,
                  "SELECT 1 FROM family_guardians WHERE family_id=? AND user_id=?",
                  [en.family_id, u.id],
                )
              ).length
            )
          )
            continue;
          const rec = await rows(
            c,
            "SELECT ss.id,a.status FROM class_sessions ss LEFT JOIN attendance a ON a.class_id=ss.id AND a.enrollment_id=? WHERE ss.batch_id=? AND ss.status='ended' AND ss.held_verified=1 AND substring(ss.scheduled_start,1,7)=? AND substring(ss.scheduled_start,1,10)>=? AND (? IS NULL OR substring(ss.scheduled_start,1,10)<=?)",
            [
              en.id,
              en.batch_id,
              month,
              en.start_date,
              en.end_date,
              en.end_date,
            ],
          );
          result.push({
            ...en,
            month,
            ...attendanceTotals(rec.map((x) => x.status)),
          });
        }
        return result;
      }),
    );
  });
  return r;
}
