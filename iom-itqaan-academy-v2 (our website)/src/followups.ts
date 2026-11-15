import { Router } from "express";
import { z } from "zod";
import {
  type Store,
  type Row,
  one,
  rows,
  write,
  obj,
  fail,
  audit,
} from "./db.js";
import { checkBranch, checkDepartment, requireRole } from "./security.js";
import { parseLocal } from "./policy.js";
import { enrollmentAccess } from "./attendance-data.js";
import {
  workflowContext,
  caseEvent,
  notify,
} from "./followup-notifications.js";
import { reconcileEnrollment } from "./followup-engine.js";
import { validAssignment } from "./planning.js";
import { workflowApprovals } from "./workflow-approvals.js";
const id = z.number().int().positive(),
  text = z.string().trim().min(1).max(5000);
const note = z.object({
  contact_date: z.iso.date(),
  guardian_statement: text,
  next_steps: text,
  note: z.string().max(5000).default(""),
  expected_revision: z.number().int().positive(),
  request_id: z.string().min(12).max(80),
});
export async function caseAccess(
  c: any,
  uid: number,
  u: Row,
  metadata = false,
) {
  const f = await one(c, "SELECT * FROM followup_cases WHERE id=?", [uid]);
  if (!f) fail(404, "Follow-up not found");
  const context = await workflowContext(c, f.enrollment_id);
  if (!context) fail(404, "Enrollment not found");
  if (u.role === "central_admin" && metadata) return { f, context };
  checkBranch(u, context.branch_id);
  checkDepartment(u, context.department_id);
  if (
    (u.role === "teacher" && f.assignee_id === u.id) ||
    (u.role === "zimmadar" && context.zimmadar_id === u.id) ||
    (u.role === "department_supervisor" &&
      u.department_id === context.department_id) ||
    (u.role === "branch_admin" && metadata)
  )
    return { f, context };
  fail(403, "Related workflow staff only");
}
export async function lockedCase(c: any, uid: number, u: Row) {
  const peek = await one(
    c,
    "SELECT enrollment_id FROM followup_cases WHERE id=?",
    [uid],
  );
  if (!peek) fail(404, "Follow-up not found");
  await obj(c, "enrollments", peek.enrollment_id, true);
  await one(c, "SELECT id FROM followup_cases WHERE id=? FOR UPDATE", [uid]);
  return caseAccess(c, uid, u);
}
async function saveNote(
  c: any,
  f: Row,
  u: Row,
  d: Row,
  at: Date,
  approval: number | null = null,
) {
  if (d.contact_date > at.toISOString().slice(0, 10))
    fail(400, "Contact date cannot be in the future");
  if (!["pending", "completed"].includes(f.status)) fail(409, "Case is closed");
  await write(
    c,
    "INSERT INTO followup_notes(case_id,cycle,contact_date,guardian_statement,next_steps,note,author_id,approved_by,request_id,at) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [
      f.id,
      f.cycle,
      d.contact_date,
      d.guardian_statement,
      d.next_steps,
      d.note || "",
      u.id,
      approval,
      d.request_id,
      at.toISOString(),
    ],
  );
  await write(
    c,
    "UPDATE followup_cases SET status='completed',completed_at=COALESCE(completed_at,?),note_submitted_at=COALESCE(note_submitted_at,?),revision=revision+1 WHERE id=?",
    [at.toISOString(), at.toISOString(), f.id],
  );
  await write(
    c,
    "UPDATE workflow_notifications SET status='skipped',error_code='case_completed' WHERE case_id=? AND status IN ('queued','retry')",
    [f.id],
  );
  await caseEvent(
    c,
    f.id,
    approval ? "note_edit_approved" : "note_submitted",
    { cycle: f.cycle, approved_by: approval },
    at,
    u.id,
  );
  await audit(c, u, "followup_note", "followup", f.id, {
    approved_by: approval,
  });
  await reconcileEnrollment(c, f.enrollment_id, at, "completion");
}
async function reopen(c: any, f: Row, u: Row, at: Date) {
  if (
    f.kind !== "low_attendance" ||
    f.status !== "completed" ||
    f.reopen_count >= 2
  )
    fail(409, "Only completed low-attendance cases may reopen, at most twice");
  await write(
    c,
    "UPDATE followup_cases SET status='pending',reopen_count=reopen_count+1,cycle=cycle+1,cycle_kind='reopened',origin_at=?,completed_at=NULL,note_submitted_at=NULL,due_at=?,escalation_at=NULL,management_at=NULL,deadline_version=deadline_version+1,revision=revision+1 WHERE id=?",
    [at.toISOString(), new Date(+at + 86400000).toISOString(), f.id],
  );
  await caseEvent(
    c,
    f.id,
    "reopened",
    { reopen_count: f.reopen_count + 1 },
    at,
    u.id,
  );
  await reconcileEnrollment(c, f.enrollment_id, at, "reopen");
}
async function proposal(
  c: any,
  f: Row,
  u: Row,
  kind: string,
  payload: Row,
  at: Date,
) {
  const old = await one(
    c,
    "SELECT * FROM followup_requests WHERE requested_by=? AND request_id=?",
    [u.id, payload.request_id],
  );
  if (old) {
    if (
      old.case_id !== f.id ||
      old.kind !== kind ||
      old.payload !== JSON.stringify(payload)
    )
      fail(409, "Request already used");
    return { id: old.id, pending_approval: old.status === "pending" };
  }
  const v = await write(
    c,
    "INSERT INTO followup_requests(case_id,kind,expected_revision,payload,requested_by,request_id,created_at) VALUES (?,?,?,?,?,?,?)",
    [
      f.id,
      kind,
      f.revision,
      JSON.stringify(payload),
      u.id,
      payload.request_id,
      at.toISOString(),
    ],
  );
  await caseEvent(
    c,
    f.id,
    "approval_requested",
    { request_id: v.insertId, kind },
    at,
    u.id,
  );
  return { id: v.insertId, pending_approval: true };
}
export function followups(store: Store, now = () => new Date()) {
  const r = Router();
  r.get("/followup-requests/:id", async (q, s) => {
    const uid = id.parse(Number(q.params.id));
    s.json(
      await store.read(async (c) => {
        const req = await one(c, "SELECT * FROM followup_requests WHERE id=?", [
          uid,
        ]);
        if (!req) fail(404, "Request not found");
        await caseAccess(c, req.case_id, s.locals.user);
        return req;
      }),
    );
  });
  r.get("/followups", async (q, s) => {
    const u = s.locals.user;
    requireRole(
      u,
      "teacher",
      "zimmadar",
      "department_supervisor",
      "central_admin",
      "branch_admin",
    );
    const status =
        q.query.status === undefined
          ? null
          : z.enum(["pending", "completed", "closed"]).parse(q.query.status),
      before =
        q.query.before === undefined
          ? Number.MAX_SAFE_INTEGER
          : z.coerce.number().int().positive().parse(q.query.before),
      limit =
        q.query.limit === undefined
          ? 50
          : z.coerce.number().int().min(1).max(100).parse(q.query.limit);
    s.json(
      await store.read(async (c) => {
        const list = await rows(
          c,
          "SELECT f.*,st.full_name student_name,b.label batch_name,co.title course_title,d.branch_id,co.department_id,b.zimmadar_id FROM followup_cases f JOIN enrollments e ON e.id=f.enrollment_id JOIN students st ON st.id=e.student_id JOIN batches b ON b.id=e.batch_id JOIN courses co ON co.id=b.course_id JOIN departments d ON d.id=co.department_id WHERE f.id<?" +
            (status ? " AND f.status=?" : "") +
            (u.role === "central_admin"
              ? ""
              : " AND d.branch_id=?" +
                (u.department_id ? " AND co.department_id=?" : "") +
                (u.role === "teacher"
                  ? " AND f.assignee_id=?"
                  : u.role === "zimmadar"
                    ? " AND b.zimmadar_id=?"
                    : "")) +
            " ORDER BY f.id DESC LIMIT " +
            (limit + 1),
          [
            before,
            ...(status ? [status] : []),
            ...(u.role === "central_admin"
              ? []
              : [
                  u.branch_id,
                  ...(u.department_id ? [u.department_id] : []),
                  ...(["teacher", "zimmadar"].includes(u.role) ? [u.id] : []),
                ]),
          ],
        );
        return {
          items: list.slice(0, limit).map((v) => ({
            ...v,
            overdue:
              v.status === "pending" &&
              !v.paused &&
              v.due_at &&
              +parseLocal(v.due_at) < +now(),
            escalated:
              v.status === "pending" &&
              !v.paused &&
              v.escalation_at &&
              +parseLocal(v.escalation_at) < +now(),
          })),
          next_before: list.length > limit ? list[limit - 1].id : null,
        };
      }),
    );
  });
  r.get("/followups/:id", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    s.json(
      await store.read(async (c) => {
        const { f } = await caseAccess(c, uid, u, true);
        let privateAccess = true;
        try {
          await caseAccess(c, uid, u);
        } catch (e: any) {
          if (e.status !== 403) throw e;
          privateAccess = false;
        }
        return {
          case: f,
          notes: privateAccess
            ? await rows(
                c,
                "SELECT * FROM followup_notes WHERE case_id=? ORDER BY id DESC LIMIT 100",
                [uid],
              )
            : [],
          requests: privateAccess
            ? await rows(
                c,
                "SELECT * FROM followup_requests WHERE case_id=? ORDER BY id DESC LIMIT 100",
                [uid],
              )
            : [],
          events: await rows(
            c,
            "SELECT id,event,actor_id,at" +
              (privateAccess ? ",details" : "") +
              " FROM followup_events WHERE case_id=? ORDER BY id DESC LIMIT 100",
            [uid],
          ),
          notes_restricted: !privateAccess,
        };
      }),
    );
  });
  r.post("/followups/:id/note", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, "teacher");
    const d = note.parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const { f } = await lockedCase(c, uid, u);
        const replay=await one(c,'SELECT * FROM followup_notes WHERE author_id=? AND request_id=?',[u.id,d.request_id]);
        if(replay){if(replay.case_id!==uid||replay.contact_date!==d.contact_date||replay.guardian_statement!==d.guardian_statement||replay.next_steps!==d.next_steps||replay.note!==d.note)fail(409,'Request already used');return{ok:true,already_submitted:true};}
        if (f.revision !== d.expected_revision)
          fail(409, "Case changed; reload");
        if (
          f.status === "completed" &&
          f.note_submitted_at &&
          +now() > +parseLocal(f.note_submitted_at) + 86400000
        )
          return proposal(c, f, u, "note_edit", d, now());
        await saveNote(c, f, u, d, now());
        return { ok: true, completed: true };
      }),
    );
  });
  r.post("/followups/:id/reopen", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, "teacher");
    const d = z
      .object({
        expected_revision: z.number().int().positive(),
        request_id: z.string().min(12).max(80),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const { f } = await lockedCase(c, uid, u);
        if (f.revision !== d.expected_revision)
          fail(409, "Case changed; reload");
        if (
          f.kind !== "low_attendance" ||
          f.status !== "completed" ||
          f.reopen_count >= 2
        )
          fail(409, "Reopen limit/state does not permit this action");
        if (+now() > +parseLocal(f.completed_at) + 86400000)
          return proposal(c, f, u, "reopen", d, now());
        await reopen(c, f, u, now());
        return { ok: true };
      }),
    );
  });
  r.post("/followups/:id/new-request", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, "teacher");
    const d = z
      .object({
        reason: text,
        expected_revision: z.number().int().positive(),
        request_id: z.string().min(12).max(80),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const { f } = await lockedCase(c, uid, u);
        if (
          f.kind !== "low_attendance" ||
          f.reopen_count < 2 ||
          f.revision !== d.expected_revision
        )
          fail(
            409,
            "New request requires the completed reopen limit and current revision",
          );
        return proposal(c, f, u, "new_case", d, now());
      }),
    );
  });
  r.post("/followup-requests/:id/review", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, "zimmadar");
    const d = z
      .object({ action: z.enum(["approve", "reject"]), reason: text })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const peek = await one(
          c,
          "SELECT * FROM followup_requests WHERE id=?",
          [uid],
        );
        if (!peek) fail(404, "Request not found");
        const { f, context } = await lockedCase(c, peek.case_id, u);
        if (context.zimmadar_id !== u.id)
          fail(403, "Assigned Batch Zimmadar only");
        const req = await one(
          c,
          "SELECT * FROM followup_requests WHERE id=? FOR UPDATE",
          [uid],
        );
        if (req!.status !== "pending" || req!.expected_revision !== f.revision)
          fail(409, "Request or case changed");
        const payload = JSON.parse(req!.payload);
        if (d.action === "approve") {
          const requester = await obj(c, "users", req!.requested_by);
          if (!requester.active || f.assignee_id !== requester.id)
            fail(409, "Requester is no longer assigned");
          if (req!.kind === "note_edit")
            await saveNote(c, f, requester, payload, now(), u.id);
          else if (req!.kind === "reopen") await reopen(c, f, u, now());
          else if (req!.kind === "new_case") {
            if (f.reopen_count < 2) fail(409, "Reopen limit not reached");
            const data = await reconcileEnrollment(
              c,
              f.enrollment_id,
              now(),
              "review",
            );
            if (
              !data?.month.low_attendance_evaluable ||
              !data.month.below_75_percent ||
              data.leave_active
            )
              fail(
                409,
                "Current attendance does not support a new low-attendance case",
              );
            const at = now(),
              v = await write(
                c,
                "INSERT INTO followup_cases(enrollment_id,kind,source_key,calculation_month,assignee_id,parent_case_id,cycle_kind,created_at,origin_at,due_at,escalation_at) VALUES (?,'low_attendance',?,?,?,?,'new',?,?,?,?)",
                [
                  f.enrollment_id,
                  "approved-request:" + uid,
                  data.month.month,
                  f.assignee_id,
                  f.id,
                  at.toISOString(),
                  at.toISOString(),
                  new Date(+at + 72 * 3600000).toISOString(),
                  new Date(+at + 144 * 3600000).toISOString(),
                ],
              );
            await caseEvent(
              c,
              v.insertId,
              "approved_new_case",
              { parent: f.id, request_id: uid },
              at,
              u.id,
            );
            await notify(
              c,
              context,
              v.insertId,
              `case:${v.insertId}:1:initial`,
              "initial",
              "Approved new Guardian follow-up",
              ["teacher", "zimmadar"],
              at,
              f.assignee_id,
            );
          } else fail(400, "Unknown request kind");
        }
        await write(
          c,
          "UPDATE followup_requests SET status=?,reviewed_by=?,review_reason=?,reviewed_at=? WHERE id=?",
          [
            d.action === "approve" ? "approved" : "rejected",
            u.id,
            d.reason,
            now().toISOString(),
            uid,
          ],
        );
        await caseEvent(
          c,
          f.id,
          "request_reviewed",
          { request_id: uid, action: d.action },
          now(),
          u.id,
        );
        return { ok: true };
      }),
    );
  });
  r.post("/followups/:id/reassign", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, "department_supervisor");
    if (!workflowApprovals.managementPrivacyAndTerminalActions)
      fail(409, "Reassignment privacy policy approval is pending");
    const d = z
      .object({
        teacher_id: id,
        reason: text,
        expected_revision: z.number().int().positive(),
      })
      .parse(q.body);
    await store.transaction(async (c) => {
      const { f, context } = await lockedCase(c, uid, u);
      if (
        f.kind !== "low_attendance" ||
        f.status !== "pending" ||
        !f.escalation_at ||
        +parseLocal(f.escalation_at) >= +now() ||
        f.paused ||
        f.revision !== d.expected_revision
      )
        fail(409, "Only current escalated cases may be reassigned");
      await validAssignment(c, d.teacher_id, "teacher", context);
      await write(
        c,
        "UPDATE followup_cases SET assignee_id=?,cycle=cycle+1,cycle_kind='reassigned',origin_at=?,due_at=?,escalation_at=?,management_at=?,deadline_version=deadline_version+1,revision=revision+1 WHERE id=?",
        [
          d.teacher_id,
          now().toISOString(),
          new Date(+now() + 48 * 3600000).toISOString(),
          new Date(+now() + 48 * 3600000).toISOString(),
          new Date(+now() + 72 * 3600000).toISOString(),
          uid,
        ],
      );
      await write(
        c,
        "UPDATE workflow_notifications SET status='skipped',error_code='reassigned' WHERE case_id=? AND status IN ('queued','retry')",
        [uid],
      );
      await caseEvent(
        c,
        uid,
        "reassigned",
        { from: f.assignee_id, to: d.teacher_id, reason: d.reason },
        now(),
        u.id,
      );
      await reconcileEnrollment(c, f.enrollment_id, now(), "reassign");
    });
    s.json({ ok: true });
  });
  r.post("/followups/bulk-reminder", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "zimmadar");
    const d = z
      .object({
        case_ids: z.array(id).min(1).max(20),
        request_id: z.string().min(12).max(80),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        let queued = 0;
        for (const uid of [...new Set(d.case_ids)].sort((a, b) => a - b)) {
          const { f, context } = await lockedCase(c, uid, u);
          if (f.status !== "pending" || f.paused) continue;
          if(await one(c,'SELECT id FROM followup_events WHERE case_id=? AND event_key=?',[uid,'bulk:'+d.request_id]))continue;
          await caseEvent(c,uid,'manual_reminder',{request_id:d.request_id},now(),u.id,'bulk:'+d.request_id);
          queued += await notify(
            c,
            context,
            uid,
            "bulk:" + d.request_id + ":" + uid,
            "manual_reminder",
            "Guardian follow-up reminder",
            ["teacher"],
            now(),
            f.assignee_id,
          );
        }
        return { queued };
      }),
    );
  });
  return r;
}
