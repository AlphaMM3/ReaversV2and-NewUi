import { type Store, type Row, one, rows, write, obj, fail } from "./db.js";
import { parseLocal, bd } from "./policy.js";
import { reconcileEnrollment } from "./followup-engine.js";
import {
  workflowContext,
  notify,
  recipients,
} from "./followup-notifications.js";
import { workflowApprovals } from "./workflow-approvals.js";
export function latestStage(f: Row, now: Date) {
  if (f.status !== "pending" || f.paused) return null;
  if (f.management_at && +now > +parseLocal(f.management_at))
    return { stage: "management_overdue", routes: ["management"] };
  if (f.escalation_at && +now > +parseLocal(f.escalation_at))
    return { stage: "supervisor_overdue", routes: ["supervisor"] };
  if (f.due_at && +now > +parseLocal(f.due_at))
    return {
      stage: "teacher_overdue",
      routes:
        f.cycle_kind === "reassigned"
          ? ["teacher", "supervisor"]
          : ["teacher", "zimmadar"],
    };
  return {
    stage: "initial",
    routes:
      f.kind === "low_attendance"
        ? ["teacher", "zimmadar", "guardian"]
        : ["teacher", "zimmadar"],
  };
}
export async function processFollowups(
  store: Store,
  now = new Date(),
  afterId = 0,
) {
  const ids = await store.read((c) =>
    rows(
      c,
      "SELECT e.id FROM enrollments e WHERE e.id>? AND (e.status='active' OR EXISTS (SELECT 1 FROM followup_cases f WHERE f.enrollment_id=e.id AND f.status='pending')) ORDER BY e.id LIMIT 201",
      [afterId],
    ),
  );
  let examined = 0,
    notifications = 0;
  for (const { id } of ids.slice(0, 200))
    await store.transaction(async (c) => {
      await reconcileEnrollment(c, id, now);
      const context = await workflowContext(c, id);
      if (!context || context.status !== "active") return;
      examined++;
      for (const f of await rows(
        c,
        "SELECT * FROM followup_cases WHERE enrollment_id=? AND status='pending'",
        [id],
      )) {
        const stage = latestStage(f, now);
        if (!stage || stage.stage === "initial") continue;
        notifications += await notify(
          c,
          context,
          f.id,
          `case:${f.id}:${f.cycle}:${f.deadline_version}:${stage.stage}`,
          stage.stage,
          "Guardian follow-up needs action",
          stage.routes,
          now,
          f.assignee_id,
        );
      }
    });
  // A worker crash after claiming may already have delivered externally; require review.
  const abandoned = await store.transaction((c) =>
    write(
      c,
      "UPDATE workflow_notifications SET status='unknown',error_code='interrupted_send' WHERE channel='telegram' AND status='sending' AND attempted_at<?",
      [new Date(+now - 300000).toISOString()],
    ),
  );
  return {
    next_after: ids.length > 200 ? ids[199].id : 0,
    examined,
    notifications,
    ambiguous_deliveries: abandoned.affectedRows,
    delivery: "in_app; Telegram requires explicit provider configuration",
  };
}
export async function notificationCurrent(c: any, n: Row, now: Date) {
  const context = await workflowContext(c, n.enrollment_id);
  if (!context || context.status !== "active") return false;
  const f = n.case_id
    ? await one(c, "SELECT * FROM followup_cases WHERE id=?", [n.case_id])
    : null;
  if (f?.paused) return false;
  if (n.stage === "absence_stage2") {
    const signal=/^absence-stage2:(\d+)$/.exec(n.event_key);if(!signal||!await one(c,'SELECT id FROM absence_escalations WHERE id=? AND enrollment_id=? AND active=1',[Number(signal[1]),context.id]))return false;
    const projection = await one(
      c,
      "SELECT data_json FROM attendance_projections WHERE enrollment_id=?",
      [context.id],
    );
    if (
      !projection ||
      !JSON.parse(projection.data_json).absence.second_escalated
    )
      return false;
  } else if (f) {
    if (f.status !== "pending") return false;
    const current = latestStage(f, now);
    if (
      n.stage !== "manual_reminder" &&
      n.route !== "guardian" &&
      current?.stage !== n.stage
    )
      return false;
    if (n.route === "guardian") {
      if (f.calculation_month && f.calculation_month !== bd(now).slice(0, 7))
        return false;
      if (
        await one(
          c,
          "SELECT id FROM followup_cases WHERE enrollment_id=? AND kind='low_attendance' AND id>? LIMIT 1",
          [context.id, f.id],
        )
      )
        return false;
    }
  }
  return (await recipients(c, context, n.route, f?.assignee_id)).includes(
    n.user_id,
  );
}
export type DeliveryOutcome =
  | { outcome: "sent"; messageId: string }
  | { outcome: "retry"; afterMs: number }
  | { outcome: "unknown" | "failed"; code: string };
export async function deliverTelegram(
  store: Store,
  sender: (chat: string, text: string) => Promise<DeliveryOutcome>,
  now = new Date(),
) {
  const jobs = await store.read((c) =>
    rows(
      c,
      "SELECT id,enrollment_id FROM workflow_notifications WHERE channel='telegram' AND status IN ('queued','retry') AND next_attempt_at<=? ORDER BY id LIMIT 50",
      [now.toISOString()],
    ),
  );
  const counts = { sent: 0, retry: 0, unknown: 0, failed: 0, skipped: 0 };
  for (const job of jobs) {
    const claim = await store.transaction(async (c) => {
      await obj(c, "enrollments", job.enrollment_id, true);
      await reconcileEnrollment(c, job.enrollment_id, now);
      const n = await one(
        c,
        "SELECT * FROM workflow_notifications WHERE id=? FOR UPDATE",
        [job.id],
      );
      if (!n || !["queued", "retry"].includes(n.status)) return null;
      const linked = await one(
        c,
        "SELECT chat_id FROM telegram_connections WHERE user_id=?",
        [n.user_id],
      );
      if (
        n.route === "guardian" &&
        !workflowApprovals.guardianUrgentPreference
      ) {
        await write(
          c,
          "UPDATE workflow_notifications SET status='policy_hold',error_code='guardian_cadence_pending' WHERE id=?",
          [n.id],
        );
        counts.skipped++;
        return null;
      }
      if (!linked || !(await notificationCurrent(c, n, now))) {
        await write(
          c,
          "UPDATE workflow_notifications SET status='skipped',error_code='no_longer_actionable' WHERE id=?",
          [n.id],
        );
        counts.skipped++;
        return null;
      }
      await write(
        c,
        "UPDATE workflow_notifications SET status='sending',attempt_count=attempt_count+1,attempted_at=? WHERE id=?",
        [now.toISOString(), n.id],
      );
      return {
        ...n,
        id: n.id,
        title: n.title,
        chat: linked.chat_id,
        attempt: n.attempt_count + 1,
      };
    });
    if (!claim) continue;
    let result: DeliveryOutcome;
    try {
      result = await sender(claim.chat, claim.title);
    } catch {
      result = { outcome: "unknown", code: "transport_ambiguous" };
    }
    if (result.outcome === "retry" && claim.attempt >= 5)
      result = { outcome: "failed", code: "retry_limit" };
    await store.transaction(async (c) => {
      const n = await one(
        c,
        "SELECT * FROM workflow_notifications WHERE id=? FOR UPDATE",
        [claim.id],
      );
      if (n?.status !== "sending" || n.attempt_count !== claim.attempt) return;
      if (result.outcome === "sent")
        await write(
          c,
          "UPDATE workflow_notifications SET status='sent',delivered_at=?,provider_message_id=? WHERE id=?",
          [now.toISOString(), result.messageId, claim.id],
        );
      else if (result.outcome === "retry")
        await write(
          c,
          "UPDATE workflow_notifications SET status='retry',next_attempt_at=?,error_code='rate_limited' WHERE id=?",
          [
            new Date(+now + Math.max(1000, result.afterMs)).toISOString(),
            claim.id,
          ],
        );
      else
        await write(
          c,
          "UPDATE workflow_notifications SET status=?,error_code=? WHERE id=?",
          [result.outcome, result.code, claim.id],
        );
    });
    counts[result.outcome]++;
  }
  return counts;
}
