import { type Row, rows, one, write } from "./db.js";
export async function workflowContext(c: any, enrollment: number) {
  return one(
    c,
    "SELECT e.*,s.family_id,s.full_name student_name,b.teacher_id,b.zimmadar_id,b.id batch_id,co.department_id,d.branch_id FROM enrollments e JOIN students s ON s.id=e.student_id JOIN batches b ON b.id=e.batch_id JOIN courses co ON co.id=b.course_id JOIN departments d ON d.id=co.department_id WHERE e.id=?",
    [enrollment],
  );
}
export async function recipients(
  c: any,
  context: Row,
  route: string,
  assignee?: number,
) {
  if (route === "teacher" || route === "zimmadar") {
    const uid =
      route === "teacher"
        ? assignee || context.teacher_id
        : context.zimmadar_id;
    return uid
      ? (
          await rows(
            c,
            "SELECT DISTINCT u.id FROM users u LEFT JOIN user_role_assignments ar ON ar.user_id=u.id AND ar.active=1 WHERE u.id=? AND u.active=1 AND ((u.role=? AND u.branch_id=? AND (u.department_id IS NULL OR u.department_id=?)) OR (ar.role=? AND ar.branch_id=? AND (ar.department_id IS NULL OR ar.department_id=?)))",
            [
              uid,
              route,
              context.branch_id,
              context.department_id,
              route,
              context.branch_id,
              context.department_id,
            ],
          )
        ).map((v: Row) => v.id)
      : [];
  }
  if (route === "guardian")
    return (
      await rows(
        c,
        "SELECT u.id FROM users u JOIN family_guardians fg ON fg.user_id=u.id WHERE fg.family_id=? AND u.active=1",
        [context.family_id],
      )
    ).map((v: Row) => v.id);
  if (route === "supervisor")
    return (
      await rows(
        c,
        "SELECT DISTINCT u.id FROM users u LEFT JOIN user_role_assignments ar ON ar.user_id=u.id AND ar.active=1 WHERE u.active=1 AND ((u.role='department_supervisor' AND u.branch_id=? AND u.department_id=?) OR (ar.role='department_supervisor' AND ar.branch_id=? AND ar.department_id=?))",
        [
          context.branch_id,
          context.department_id,
          context.branch_id,
          context.department_id,
        ],
      )
    ).map((v: Row) => v.id);
  // Management requires its separately approved explicit duty; never infer it from account-admin status.
  return [];
}
export async function caseEvent(
  c: any,
  caseId: number,
  event: string,
  details: unknown,
  at: Date,
  actor: number | null = null,
  key: string | null = null,
) {
  return write(
    c,
    "INSERT INTO followup_events(case_id,event,event_key,details,actor_id,at) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id",
    [caseId, event, key, JSON.stringify(details), actor, at.toISOString()],
  );
}
export async function notify(
  c: any,
  context: Row,
  caseId: number | null,
  eventKey: string,
  stage: string,
  title: string,
  routes: string[],
  at: Date,
  assignee?: number,
) {
  let created = 0;
  for (const route of routes) {
    const people = await recipients(c, context, route, assignee);
    if (!people.length && caseId)
      await caseEvent(
        c,
        caseId,
        "unassigned_route",
        { route, stage },
        at,
        null,
        eventKey + ":" + route,
      );
    for (const uid of people) {
      for (const channel of [
        "in_app",
        ...((await one(
          c,
          "SELECT 1 FROM telegram_connections WHERE user_id=?",
          [uid],
        ))
          ? ["telegram"]
          : []),
      ]) {
        const v = await write(
          c,
          "INSERT INTO workflow_notifications(user_id,event_key,enrollment_id,case_id,route,stage,title,channel,status,next_attempt_at,created_at,delivered_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id",
          [
            uid,
            eventKey,
            context.id,
            caseId,
            route,
            stage,
            title,
            channel,
            channel === "in_app" ? "in_app" : "queued",
            channel === "telegram" ? at.toISOString() : null,
            at.toISOString(),
            channel === "in_app" ? at.toISOString() : null,
          ],
        );
        if (v.insertId) created++;
      }
    }
  }
  return created;
}
