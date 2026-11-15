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
import { requireRole, checkBranch, checkDepartment } from "./security.js";
import { parseLocal } from "./policy.js";
import { enrollmentAccess } from "./attendance-data.js";
import { reconcileEnrollment } from "./followup-engine.js";
import { workflowApprovals } from "./workflow-approvals.js";
const id = z.number().int().positive(),
  reason = z.string().trim().min(2).max(2000);
const notice = z.object({
  enrollment_id: id,
  start_date: z.iso.date(),
  end_date: z.iso.date(),
  reason,
  extension_of: id.nullable().optional(),
  request_id: z.string().min(12).max(80),
});
async function validate(c: any, en: Row, d: Row, now: Date) {
  let coveredThrough: string | null = null;
  if (
    d.end_date < d.start_date ||
    d.start_date < en.start_date ||
    (en.end_date && d.end_date > en.end_date)
  )
    fail(400, "Leave must fit enrollment dates");
  const days =
    (+new Date(d.end_date + "T00:00:00Z") -
      +new Date(d.start_date + "T00:00:00Z")) /
      86400000 +
    1;
  if (days > 14 && !d.extension_of)
    fail(400, "More than 14 days requires an extension request");
  if (d.extension_of) {
    const parent = await one(
      c,
      "SELECT * FROM student_leaves WHERE id=? AND enrollment_id=? AND status='approved'",
      [d.extension_of, en.id],
    );
    if (
      !parent ||
      d.start_date !== parent.start_date ||
      d.end_date <= parent.end_date
    )
      fail(
        400,
        "Extension must extend an approved notice from its original start",
      );
    coveredThrough = parent.end_date;
  }
  const classes = await rows(
    c,
    "SELECT * FROM class_sessions WHERE batch_id=? AND status<>'cancelled' AND substring(scheduled_start,1,10)>=? AND substring(scheduled_start,1,10)<=?",
    [en.batch_id, d.start_date, d.end_date],
  );
  for (const cl of classes) {
    if (coveredThrough && cl.scheduled_start.slice(0, 10) <= coveredThrough)
      continue;
    const end = +parseLocal(cl.actual_end || cl.scheduled_end);
    if (+now > end + 86400000)
      fail(409, "A covered class is past its emergency notice deadline");
  }
}
async function history(
  c: any,
  leave: number,
  revision: number,
  event: string,
  details: unknown,
  actor: number,
  at: Date,
) {
  await write(
    c,
    "INSERT INTO student_leave_history(leave_id,revision,event,details,actor_id,at) VALUES (?,?,?,?,?,?)",
    [leave, revision, event, JSON.stringify(details), actor, at.toISOString()],
  );
}
export function studentLeave(store: Store, now = () => new Date()) {
  const r = Router();
  r.get("/leaves", async (q, s) => {
    const u = s.locals.user;
    const status =
      q.query.status === undefined
        ? null
        : z.enum(["pending", "approved", "rejected"]).parse(q.query.status);
    const result = await store.read(async (c) => {
      const list = await rows(
        c,
        "SELECT l.*,e.batch_id,st.full_name student_name,st.family_id,co.title course_title FROM student_leaves l JOIN enrollments e ON e.id=l.enrollment_id JOIN students st ON st.id=e.student_id JOIN batches b ON b.id=e.batch_id JOIN courses co ON co.id=b.course_id" +
          (status ? " WHERE l.status=?" : "") +
          " ORDER BY l.id DESC",
        status ? [status] : [],
      );
      const out: Row[] = [];
      for (const l of list) {
        try {
          await enrollmentAccess(c, l.enrollment_id, u);
          out.push(l);
        } catch (e: any) {
          if (e.status !== 403) throw e;
        }
        if (out.length >= 200) break;
      }
      return out;
    });
    s.json(result);
  });
  r.post("/leaves", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "guardian_primary", "guardian_secondary");
    const d = notice.parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        await obj(c, "enrollments", d.enrollment_id, true);
        const { en } = await enrollmentAccess(c, d.enrollment_id, u);
        const prior = await one(
          c,
          "SELECT * FROM student_leaves WHERE requested_by=? AND request_id=?",
          [u.id, d.request_id],
        );
        if (prior) {
          if (
            prior.enrollment_id !== d.enrollment_id ||
            prior.start_date !== d.start_date ||
            prior.end_date !== d.end_date ||
            prior.reason !== d.reason ||
            prior.extension_of !== (d.extension_of || null)
          )
            fail(409, "Request already used");
          return { id: prior.id, already_requested: true };
        }
        await validate(c, en, d, now());
        const v = await write(
          c,
          "INSERT INTO student_leaves(enrollment_id,start_date,end_date,reason,extension_of,requested_by,submitted_at,request_id) VALUES (?,?,?,?,?,?,?,?)",
          [
            en.id,
            d.start_date,
            d.end_date,
            d.reason,
            d.extension_of || null,
            u.id,
            now().toISOString(),
            d.request_id,
          ],
        );
        await history(
          c,
          v.insertId,
          1,
          "requested",
          {
            start: d.start_date,
            end: d.end_date,
            extension_of: d.extension_of || null,
          },
          u.id,
          now(),
        );
        await audit(c, u, "request_leave", "student_leave", v.insertId);
        return { id: v.insertId };
      }),
    );
  });
  r.post("/leaves/:id/resubmit", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, "guardian_primary", "guardian_secondary");
    const d = z
      .object({
        start_date: z.iso.date(),
        end_date: z.iso.date(),
        reason,
        expected_revision: z.number().int().positive(),
      })
      .parse(q.body);
    await store.transaction(async (c) => {
      const peek = await one(
        c,
        "SELECT enrollment_id FROM student_leaves WHERE id=?",
        [uid],
      );
      if (!peek) fail(404, "Leave not found");
      await obj(c, "enrollments", peek.enrollment_id, true);
      const { en } = await enrollmentAccess(c, peek.enrollment_id, u),
        l = await one(c, "SELECT * FROM student_leaves WHERE id=? FOR UPDATE", [
          uid,
        ]);
      if (l!.status !== "rejected" || l!.revision !== d.expected_revision)
        fail(409, "Notice changed or is not rejected");
      await validate(c, en, { ...d, extension_of: l!.extension_of }, now());
      await write(
        c,
        "UPDATE student_leaves SET start_date=?,end_date=?,reason=?,status='requested',revision=revision+1,submitted_at=?,reviewed_by=NULL,reviewed_at=NULL,review_reason=NULL WHERE id=?",
        [d.start_date, d.end_date, d.reason, now().toISOString(), uid],
      );
      await history(c, uid, l!.revision + 1, "resubmitted", d, u.id, now());
      await audit(c, u, "resubmit_leave", "student_leave", uid);
    });
    s.json({ ok: true });
  });
  r.post("/leaves/:id/review", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, "zimmadar", "department_supervisor");
    const d = z
      .object({
        action: z.enum(["approve", "reject"]),
        reason: z.string().trim().max(2000).default(""),
        expected_revision: z.number().int().positive(),
      })
      .parse(q.body);
    if (d.action === "reject" && !d.reason)
      fail(400, "Written rejection reason required");
    s.json(
      await store.transaction(async (c) => {
        const peek = await one(
          c,
          "SELECT enrollment_id FROM student_leaves WHERE id=?",
          [uid],
        );
        if (!peek) fail(404, "Leave not found");
        await obj(c, "enrollments", peek.enrollment_id, true);
        const { en, b } = await enrollmentAccess(c, peek.enrollment_id, u),
          l = await one(
            c,
            "SELECT * FROM student_leaves WHERE id=? FOR UPDATE",
            [uid],
          );
        if (l!.revision !== d.expected_revision)
          fail(409, "Notice changed; reload");
        let status: string;
        if (l!.status === "requested") {
          if (u.role !== "zimmadar" || b.zimmadar_id !== u.id)
            fail(403, "Assigned Batch Zimmadar only");
          status =
            d.action === "reject"
              ? "rejected"
              : l!.extension_of
                ? "supervisor_review"
                : "approved";
        } else if (l!.status === "supervisor_review") {
          if (
            u.role !== "department_supervisor" ||
            u.department_id !== b.department_id
          )
            fail(403, "Department Supervisor final approval required");
          status = d.action === "reject" ? "rejected" : "approved";
        } else fail(409, "Notice already reviewed");
        // Interval-edge approval is intentionally gated until the outstanding reply.
        if (status === "approved") {
          if (!workflowApprovals.overlappingAndRetroactiveLeave) {
            const past = await one(
              c,
              "SELECT ss.id FROM class_sessions ss WHERE ss.batch_id=? AND ss.status='ended' AND ss.held_verified=1 AND substring(ss.scheduled_start,1,10)>=? AND substring(ss.scheduled_start,1,10)<=? LIMIT 1",
              [en.batch_id, l!.start_date, l!.end_date],
            );
            if (past)
              fail(409, "Retrospective leave policy approval is pending");
          }
          const overlaps = await rows(
            c,
            "SELECT id FROM student_leaves WHERE enrollment_id=? AND status='approved' AND id<>? AND start_date<=? AND end_date>=?",
            [en.id, uid, l!.end_date, l!.start_date],
          );
          if (
            overlaps.length &&
            !workflowApprovals.overlappingAndRetroactiveLeave
          )
            fail(409, "Overlapping/extended leave policy approval is pending");
        }
        await write(
          c,
          "UPDATE student_leaves SET status=?,reviewed_by=?,reviewed_at=?,review_reason=?,revision=revision+1 WHERE id=?",
          [status, u.id, now().toISOString(), d.reason, uid],
        );
        await history(
          c,
          uid,
          l!.revision + 1,
          status,
          { review_reason: d.reason },
          u.id,
          now(),
        );
        if (status === "approved")
          await reconcileEnrollment(c, en.id, now(), "leave");
        await audit(c, u, "review_leave", "student_leave", uid, { status });
        return { ok: true, status };
      }),
    );
  });
  r.get("/leaves/:id/history", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    s.json(
      await store.read(async (c) => {
        const l = await one(
          c,
          "SELECT enrollment_id FROM student_leaves WHERE id=?",
          [uid],
        );
        if (!l) fail(404, "Leave not found");
        await enrollmentAccess(c, l.enrollment_id, u);
        return rows(
          c,
          "SELECT * FROM student_leave_history WHERE leave_id=? ORDER BY id DESC LIMIT 100",
          [uid],
        );
      }),
    );
  });
  return r;
}
