import { createHash } from "node:crypto";
import { type Row, one, rows, write, obj } from "./db.js";
import { parseLocal } from "./policy.js";
import {
  attendanceFacts,
  monthMetrics,
  currentMonth,
  pausedDeadline,
  attendancePolicy,
} from "./attendance-data.js";
import {
  workflowContext,
  notify,
  caseEvent,
} from "./followup-notifications.js";
export async function closeCase(c: any, f: Row, reason: string, now: Date) {
  if (f.status !== "pending") return;
  await write(
    c,
    "UPDATE followup_cases SET status='closed',closed_at=?,close_reason=?,revision=revision+1 WHERE id=?",
    [now.toISOString(), reason, f.id],
  );
  await write(
    c,
    "UPDATE workflow_notifications SET status='skipped',error_code='case_closed' WHERE case_id=? AND status IN ('queued','retry')",
    [f.id],
  );
  await caseEvent(c, f.id, "closed", { reason }, now);
  f.status = "closed";
}
async function newCase(
  c: any,
  context: Row,
  kind: string,
  key: string,
  now: Date,
  month: string | null,
  sourceClass: number | null,
) {
  const old = await one(
    c,
    "SELECT * FROM followup_cases WHERE enrollment_id=? AND kind=? AND source_key=?",
    [context.id, kind, key],
  );
  if (old) return old;
  if (!context.teacher_id) return null;
  const v = await write(
    c,
    "INSERT INTO followup_cases(enrollment_id,kind,source_key,calculation_month,source_class_id,assignee_id,created_at,origin_at,due_at,escalation_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [
      context.id,
      kind,
      key,
      month,
      sourceClass,
      context.teacher_id,
      now.toISOString(),
      now.toISOString(),
      kind === "low_attendance"
        ? new Date(+now + 72 * 3600000).toISOString()
        : null,
      kind === "low_attendance"
        ? new Date(+now + 144 * 3600000).toISOString()
        : null,
    ],
  );
  const f = await one(c, "SELECT * FROM followup_cases WHERE id=?", [
    v.insertId,
  ]);
  await caseEvent(
    c,
    f!.id,
    "created",
    { kind, source_key: key, policy: attendancePolicy },
    now,
  );
  await notify(
    c,
    context,
    f!.id,
    `case:${f!.id}:1:initial`,
    "initial",
    kind === "low_attendance"
      ? "Low attendance: Guardian contact required"
      : "Seven held classes missed: Guardian contact required",
    kind === "low_attendance"
      ? ["teacher", "zimmadar", "guardian"]
      : ["teacher", "zimmadar"],
    now,
    f!.assignee_id,
  );
  return f;
}
export async function reconcileEnrollment(
  c: any,
  eid: number,
  now: Date,
  trigger = "worker",
) {
  const en = await obj(c, "enrollments", eid, true),
    context = await workflowContext(c, eid);
  if (!context) return null;
  const { held, leaves, intervals } = await attendanceFacts(c, en, now),
    month = currentMonth(now),
    metrics = monthMetrics(held, month);
  const activeLeave = intervals.find((v) => v.start <= +now && v.end >= +now);
  const prior = await one(
    c,
    "SELECT * FROM attendance_projections WHERE enrollment_id=?",
    [eid],
  );
  const cases = await rows(
    c,
    "SELECT * FROM followup_cases WHERE enrollment_id=? ORDER BY id",
    [eid],
  );
  // Derive episode boundaries from approved facts, not from worker tick count.
  let run = 0,
    phase2 = 0,
    episode = "",
    first: Row | null = null,
    second = false,
    leaveEnd = 0,
    secondClass: Row | null = null;
  const validKeys = new Set<string>(),
    activeEscalations = new Set<string>();
  for (const cl of held) {
    const instant = +parseLocal(cl.scheduled_start);
    const ended = intervals.filter((v) => v.end < instant).at(-1)?.end || 0;
    if (ended > leaveEnd) {
      run = 0;
      phase2 = 0;
      episode = "";
      first = null;
      second = false;
      leaveEnd = ended;
    }
    if (intervals.some((v) => v.start <= instant && instant <= v.end)) continue;
    if (cl.status === "Present" || cl.status === "Late") {
      run = 0;
      phase2 = 0;
      episode = "";
      first = null;
      second = false;
      continue;
    }
    if (cl.status !== "Absent") {
      run = 0;
      phase2 = 0;
      episode = "";
      first = null;
      second = false;
      continue;
    }
    if (!episode) episode = "absence:" + cl.id;
    if (!first) {
      run++;
      if (run >= 7) {
        validKeys.add(episode);
        first = cases.find(
          (v) => v.kind === "absence" && v.source_key === episode,
        ) || {
          id: 0,
          status: "uncreated",
          source_key: episode,
          source_class_id: cl.id,
        };
      }
    } else {
      validKeys.add(episode);
      if (
        first.status === "completed" &&
        first.completed_at &&
        +parseLocal(cl.actual_start) > +parseLocal(first.completed_at)
      ) {
        phase2++;
        if (phase2 >= 7 && !second) {
          second = true;
          activeEscalations.add(episode);
          secondClass = cl;
        }
      }
    }
  }
  // An ended leave resets the display even if no new class has yet occurred.
  if (intervals.some((v) => v.end < +now && v.end > leaveEnd)) {
    run = 0;
    phase2 = 0;
    episode = "";
    first = null;
    second = false;
  }
  if (!activeLeave && en.status === "active" && episode && first?.id === 0)
    first = await newCase(
      c,
      context,
      "absence",
      episode,
      now,
      null,
      first.source_class_id,
    );
  if (
    !activeLeave &&
    en.status === "active" &&
    episode &&
    second &&
    secondClass &&
    first?.id
  ) {
    const old = await one(
      c,
      "SELECT * FROM absence_escalations WHERE enrollment_id=? AND episode_key=?",
      [eid, episode],
    );
    if (!old) {
      const v = await write(
        c,
        "INSERT INTO absence_escalations(enrollment_id,episode_key,first_case_id,threshold_class_id,created_at) VALUES (?,?,?,?,?)",
        [eid, episode, first.id, secondClass.id, now.toISOString()],
      );
      await notify(
        c,
        context,
        first.id,
        `absence-stage2:${v.insertId}`,
        "absence_stage2",
        "Second seven held classes missed",
        ["zimmadar", "supervisor"],
        now,
      );
    }
  }
  for (const f of cases.filter(
    (v) => v.kind === "absence" && v.status === "pending",
  ))
    if (!validKeys.has(f.source_key))
      await closeCase(c, f, "source_recalculated", now);
  for (const alert of await rows(
    c,
    "SELECT * FROM absence_escalations WHERE enrollment_id=? AND active=1",
    [eid],
  ))
    if (alert.episode_key!==episode||!second||Boolean(activeLeave))
      await write(c, "UPDATE absence_escalations SET active=0 WHERE id=?", [
        alert.id,
      ]);
  // Present/Late return detection; no separate return message, per AM-14/D-078.
  for (const leave of leaves.filter((v) => v.status === "approved")) {
    const end =
      intervals.find((v) => v.ids.includes(leave.id))?.end ||
      +parseLocal(leave.end_date + "T23:59:59.999+06:00");
    const returned = held.find(
      (cl) =>
        +parseLocal(cl.scheduled_start) > end &&
        ["Present", "Late"].includes(cl.status),
    );
    if ((returned?.id || null) !== leave.returned_class_id){
      await write(
        c,
        "UPDATE student_leaves SET returned_class_id=?,returned_at=? WHERE id=?",
        [returned?.id || null, returned?.verified_at || null, leave.id],
      );
      await write(c,'UPDATE student_leaves SET revision=revision+1 WHERE id=?',[leave.id]);
      await write(c,'INSERT INTO student_leave_history(leave_id,revision,event,details,actor_id,at) VALUES (?,?,?,?,NULL,?)',[leave.id,leave.revision+1,returned?'returned':'return_recalculated',JSON.stringify({old_class:leave.returned_class_id,new_class:returned?.id||null}),now.toISOString()]);
    }
  }
  let lowWarningAt = prior?.low_warning_at || null,
    nextRepeat = prior?.next_repeat_at || null;
  const lastEnded = intervals.filter((v) => v.end < +now).at(-1);
  if (lastEnded && lowWarningAt && +parseLocal(lowWarningAt) < lastEnded.end) {
    const restart = new Date(lastEnded.end + 1 + 7 * 86400000).toISOString();
    if (!nextRepeat || nextRepeat < restart) nextRepeat = restart;
  }
  if (
    en.status === "active" &&
    metrics.low_attendance_evaluable &&
    metrics.below_75_percent &&
    !activeLeave &&
    (!nextRepeat || +parseLocal(nextRepeat) <= +now)
  ) {
    const f = await newCase(
      c,
      context,
      "low_attendance",
      "low:" + now.toISOString(),
      now,
      month,
      null,
    );
    if (f) {
      lowWarningAt = now.toISOString();
      nextRepeat = new Date(+now + 7 * 86400000).toISOString();
    }
  }
  const all = await rows(
    c,
    "SELECT * FROM followup_cases WHERE enrollment_id=? ORDER BY id",
    [eid],
  );
  for (const f of all) {
    if (
      !activeLeave &&
      f.kind === "low_attendance" &&
      f.status === "pending" &&
      metrics.low_attendance_evaluable &&
      !metrics.below_75_percent
    )
      await closeCase(
        c,
        f,
        f.calculation_month === month
          ? "attendance_recovered"
          : "new_month_recovered",
        now,
      );
    if (
      f.status === "closed" &&
      ['attendance','leave'].includes(trigger) &&
      (f.kind==='absence'?validKeys.has(f.source_key):monthMetrics(held,f.calculation_month||month).below_75_percent) &&
      !f.review_needed
    ) {
      await write(c, "UPDATE followup_cases SET review_needed=1 WHERE id=?", [
        f.id,
      ]);
      await caseEvent(
        c,
        f.id,
        "review_required",
        { trigger },
        now,
        null,
        "closed-recalculation:" + f.cycle,
      );
    }
    if (f.status !== "pending") continue;
    const hours =
      f.cycle_kind === "reopened"
        ? [24, null, null]
        : f.cycle_kind === "reassigned"
          ? [48, 48, 72]
          : [72, 144, null];
    const deadlines =
      f.kind === "low_attendance"
        ? hours.map((h) =>
            h === null
              ? null
              : pausedDeadline(+parseLocal(f.origin_at), h, intervals, +now),
          )
        : [null, null, null];
    const remaining =
      activeLeave && deadlines[0]
        ? Math.max(0, +parseLocal(deadlines[0]) - (activeLeave.end + 1))
        : null;
    if (
      f.due_at !== deadlines[0] ||
      f.escalation_at !== deadlines[1] ||
      f.management_at !== deadlines[2] ||
      Boolean(f.paused) !== Boolean(activeLeave)
    ) {
      await write(
        c,
        "UPDATE followup_cases SET due_at=?,escalation_at=?,management_at=?,paused=?,remaining_ms=?,deadline_version=deadline_version+1,revision=revision+1 WHERE id=?",
        [...deadlines, Number(Boolean(activeLeave)), remaining, f.id],
      );
      await caseEvent(
        c,
        f.id,
        "deadline_reconciled",
        {
          due_at: deadlines[0],
          paused: Boolean(activeLeave),
          remaining_ms: remaining,
        },
        now,
      );
      await write(
        c,
        "UPDATE workflow_notifications SET status='skipped',error_code='deadline_changed' WHERE case_id=? AND status IN ('queued','retry')",
        [f.id],
      );
    }
  }
  const data = {
    policy: attendancePolicy,
    month: metrics,
    absence: {
      episode,
      first_count: run,
      second_count: phase2,
      first_case_id: first?.id || null,
      second_escalated: second,
      paused: Boolean(activeLeave),
    },
    leave_active: Boolean(activeLeave),
    unassigned_teacher: !context.teacher_id,
  };
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        held,
        leaves: leaves.map((v) => ({
          id: v.id,
          start: v.start_date,
          end: v.end_date,
          status: v.status,
        })),
        data,
      }),
    )
    .digest("hex");
  await write(
    c,
    "INSERT INTO attendance_projections(enrollment_id,facts_hash,data_json,low_warning_at,next_repeat_at,calculated_at) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE revision=revision+IF(facts_hash<>VALUES(facts_hash),1,0),facts_hash=VALUES(facts_hash),data_json=VALUES(data_json),low_warning_at=VALUES(low_warning_at),next_repeat_at=VALUES(next_repeat_at),calculated_at=VALUES(calculated_at)",
    [
      eid,
      hash,
      JSON.stringify(data),
      lowWarningAt,
      nextRepeat,
      now.toISOString(),
    ],
  );
  return data;
}
