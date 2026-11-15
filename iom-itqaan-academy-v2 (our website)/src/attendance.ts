import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
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
import { classScope, requireRole, staff } from "./security.js";
import { parseLocal, bdIso, correctionCutoff, lateFromJoin } from "./policy.js";
import { reconcileEnrollment } from "./followup-engine.js";
const id = z.number().int().positive();
const entry = z.object({
  enrollment_id: id,
  status: z.enum(["Present", "Late", "Absent"]),
  join_time: z.string().nullable().optional(),
  reason: z.string().trim().min(2).max(2000).optional(),
  expected_revision: z.number().int().nonnegative().optional(),
  request_id: z.string().min(12).max(80).optional(),
});
export function verifiedEntry(cl: Row, d: Row) {
  let status = d.status,
    join: string | null = null;
  if (d.join_time) {
    join = bdIso(parseLocal(d.join_time));
    if (
      !cl.actual_start ||
      +parseLocal(join) < +parseLocal(cl.actual_start) ||
      (cl.actual_end && +parseLocal(join) > +parseLocal(cl.actual_end))
    )
      fail(400, "Join time must be during the actual class");
    status = lateFromJoin(cl.actual_start, join) ? "Late" : "Present";
  }
  return { status, join };
}
async function revision(c: any, attendance: number) {
  return Number(
    (
      await one(
        c,
        "SELECT COALESCE(MAX(id),0) version FROM attendance_revisions WHERE attendance_id=?",
        [attendance],
      )
    )?.version || 0,
  );
}
async function applyAttendance(
  c: any,
  u: Row,
  cl: Row,
  en: Row,
  prior: Row | null,
  value: { status: string; join: string | null },
  reason: string,
  request: string,
  at: Date,
  approvedBy: number | null = null,
) {
  const aid =
    prior?.id ||
    (
      await write(
        c,
        "INSERT INTO attendance(class_id,enrollment_id,status,join_time,verified_by,verified_at) VALUES (?,?,?,?,?,?)",
        [cl.id, en.id, value.status, value.join, u.id, at.toISOString()],
      )
    ).insertId;
  if (prior)
    await write(
      c,
      "UPDATE attendance SET status=?,join_time=?,verified_by=?,verified_at=? WHERE id=?",
      [value.status, value.join, approvedBy || u.id, at.toISOString(), aid],
    );
  const v = await write(
    c,
    "INSERT INTO attendance_revisions(attendance_id,old_status,new_status,old_join_time,new_join_time,actor_id,approved_by,reason,request_id,at) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [
      aid,
      prior?.status || null,
      value.status,
      prior?.join_time || null,
      value.join,
      u.id,
      approvedBy,
      reason,
      request,
      at.toISOString(),
    ],
  );
  await audit(
    c,
    u,
    prior ? "correct_attendance" : "record_attendance",
    "attendance",
    aid,
    {
      revision: v.insertId,
      approved_by: approvedBy,
      old: prior?.status || null,
      new: value.status,
    },
  );
  await reconcileEnrollment(c, en.id, at, "attendance");
  return {
    id: aid,
    status: value.status,
    revision: v.insertId,
    corrected: Boolean(prior),
  };
}
export function attendance(store: Store, now = () => new Date()) {
  const r = Router();
  r.get("/classes/:id/attendance", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    s.json(
      await store.read(async (c) => {
        const { s: cl } = await classScope(c, uid, u);
        const day = bdIso(parseLocal(cl.scheduled_start)).slice(0, 10);
        return rows(
          c,
          "SELECT a.id,? class_id,e.id enrollment_id,st.full_name,COALESCE(a.status,'Unrecorded') status,a.join_time,a.verified_by,a.verified_at,(SELECT COALESCE(MAX(ar.id),0) FROM attendance_revisions ar WHERE ar.attendance_id=a.id) revision FROM enrollments e JOIN students st ON st.id=e.student_id LEFT JOIN attendance a ON a.enrollment_id=e.id AND a.class_id=? WHERE e.batch_id=? AND e.start_date<=? AND (e.end_date IS NULL OR e.end_date>=?)" +
            (u.role.startsWith("guardian")
              ? " AND EXISTS (SELECT 1 FROM family_guardians fg WHERE fg.family_id=st.family_id AND fg.user_id=?)"
              : "") +
            " ORDER BY st.full_name,e.id",
          [
            uid,
            uid,
            cl.batch_id,
            day,
            day,
            ...(u.role.startsWith("guardian") ? [u.id] : []),
          ],
        );
      }),
    );
  });
  r.post("/classes/:id/attendance", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user,
      d = entry.parse(q.body),
      request = d.request_id || randomUUID();
    s.json(
      await store.transaction(async (c) => {
        const { s: cl } = await classScope(c, uid, u, "teach", true);
        if (cl.status !== "ended" || cl.held_verified !== 1)
          fail(409, "Class must be ended and verified held");
        const en = await obj(c, "enrollments", d.enrollment_id, true),
          day = bdIso(parseLocal(cl.scheduled_start)).slice(0, 10);
        if (
          en.batch_id !== cl.batch_id ||
          day < en.start_date ||
          (en.end_date && day > en.end_date)
        )
          fail(403, "Enrollment not effective for this class");
        const value = verifiedEntry(cl, d),
          prior = await one(
            c,
            "SELECT * FROM attendance WHERE class_id=? AND enrollment_id=? FOR UPDATE",
            [uid, en.id],
          );
        if (prior) {
          const replay = await one(
            c,
            "SELECT * FROM attendance_revisions WHERE attendance_id=? AND request_id=?",
            [prior.id, request],
          );
          if (replay) {
            if (
              replay.new_status !== value.status ||
              replay.new_join_time !== value.join
            )
              fail(409, "Request already used");
            return {
              id: prior.id,
              status: replay.new_status,
              revision: replay.id,
              already_recorded: true,
            };
          }
          if (prior.status === value.status && prior.join_time === value.join)
            return {
              id: prior.id,
              status: prior.status,
              revision: await revision(c, prior.id),
              already_recorded: true,
            };
          if (
            d.expected_revision === undefined ||
            d.expected_revision !== (await revision(c, prior.id))
          )
            fail(409, "Attendance changed; reload before correction");
          if (!d.reason) fail(400, "Correction reason required");
          if (
            +now() >
            +parseLocal(correctionCutoff(cl.scheduled_start)) + 999
          ) {
            const existing = await one(
              c,
              "SELECT id FROM attendance_corrections WHERE requester_id=? AND request_id=?",
              [u.id, request],
            );
            if (existing) return { id: existing.id, pending_approval: true };
            const v = await write(
              c,
              "INSERT INTO attendance_corrections(class_id,enrollment_id,attendance_id,expected_revision,new_status,new_join_time,reason,requester_id,request_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
              [
                uid,
                en.id,
                prior.id,
                d.expected_revision,
                value.status,
                value.join,
                d.reason,
                u.id,
                request,
                now().toISOString(),
              ],
            );
            await audit(c, u, "request_correction", "attendance", prior.id, {
              request_id: v.insertId,
            });
            return { id: v.insertId, pending_approval: true };
          }
        }
        return applyAttendance(
          c,
          u,
          cl,
          en,
          prior,
          value,
          d.reason || "Teacher verification",
          request,
          now(),
        );
      }),
    );
  });
  r.get("/attendance-corrections", async (_q, s) => {
    const u = s.locals.user;
    requireRole(
      u,
      "teacher",
      "zimmadar",
      "central_admin",
      "branch_admin",
      "department_supervisor",
    );
    s.json(
      await store.read(async (c) => {
        const list = await rows(
          c,
          "SELECT cr.*,ss.batch_id,b.zimmadar_id,co.department_id,d.branch_id,st.full_name student_name FROM attendance_corrections cr JOIN class_sessions ss ON ss.id=cr.class_id JOIN batches b ON b.id=ss.batch_id JOIN courses co ON co.id=b.course_id JOIN departments d ON d.id=co.department_id JOIN enrollments e ON e.id=cr.enrollment_id JOIN students st ON st.id=e.student_id ORDER BY cr.id DESC",
        );
        return list
          .filter(
            (v) =>
              u.role === "central_admin" ||
              (u.branch_id === v.branch_id &&
                (!u.department_id || u.department_id === v.department_id) &&
                (u.role === "teacher"
                  ? v.requester_id === u.id
                  : u.role === "zimmadar"
                    ? v.zimmadar_id === u.id
                    : true)),
          )
          .slice(0, 200);
      }),
    );
  });
  r.post("/attendance-corrections/:id/review", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, "zimmadar");
    const d = z
      .object({
        action: z.enum(["approve", "reject"]),
        reason: z.string().trim().min(2).max(2000),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const peek = await one(
          c,
          "SELECT * FROM attendance_corrections WHERE id=?",
          [uid],
        );
        if (!peek) fail(404, "Correction not found");
        const { s: cl, b } = await classScope(
          c,
          peek.class_id,
          u,
          "manage",
          true,
        );
        if (b.zimmadar_id !== u.id) fail(403, "Assigned Batch Zimmadar only");
        const en = await obj(c, "enrollments", peek.enrollment_id, true),
          req = await one(
            c,
            "SELECT * FROM attendance_corrections WHERE id=? FOR UPDATE",
            [uid],
          );
        if (req!.status !== "pending") fail(409, "Correction already reviewed");
        if (d.action === "approve") {
          const a = await one(
            c,
            "SELECT * FROM attendance WHERE id=? FOR UPDATE",
            [req!.attendance_id],
          );
          if (!a || (await revision(c, a.id)) !== req!.expected_revision)
            fail(409, "Attendance changed; request a fresh correction");
          const requester = await obj(c, "users", req!.requester_id);
          if (!requester.active || cl.actual_teacher_id !== requester.id)
            fail(409, "Request ownership changed; review manually");
          await applyAttendance(
            c,
            requester,
            cl,
            en,
            a,
            { status: req!.new_status, join: req!.new_join_time },
            req!.reason,
            req!.request_id,
            now(),
            u.id,
          );
        }
        await write(
          c,
          "UPDATE attendance_corrections SET status=?,reviewer_id=?,review_reason=?,reviewed_at=? WHERE id=?",
          [
            d.action === "approve" ? "approved" : "rejected",
            u.id,
            d.reason,
            now().toISOString(),
            uid,
          ],
        );
        await audit(c, u, "review_correction", "attendance_correction", uid, {
          action: d.action,
        });
        return { ok: true };
      }),
    );
  });
  r.get(
    "/classes/:class_id/attendance/:enrollment_id/history",
    async (q, s) => {
      const cid = id.parse(Number(q.params.class_id)),
        eid = id.parse(Number(q.params.enrollment_id)),
        u = s.locals.user;
      s.json(
        await store.read(async (c) => {
          await classScope(c, cid, u);
          const en = await obj(c, "enrollments", eid),
            student = await obj(c, "students", en.student_id);
          if (
            u.role.startsWith("guardian") &&
            !(await one(
              c,
              "SELECT 1 FROM family_guardians WHERE family_id=? AND user_id=?",
              [student.family_id, u.id],
            ))
          )
            fail(403, "Own family only");
          const history = await rows(
            c,
            "SELECT ar.* FROM attendance_revisions ar JOIN attendance a ON a.id=ar.attendance_id WHERE a.class_id=? AND a.enrollment_id=? ORDER BY ar.id DESC LIMIT 100",
            [cid, eid],
          );
          return u.role.startsWith("guardian")
            ? history.map((v) => ({
                id: v.id,
                old_status: v.old_status,
                new_status: v.new_status,
                old_join_time: v.old_join_time,
                new_join_time: v.new_join_time,
                at: v.at,
              }))
            : history;
        }),
      );
    },
  );
  return r;
}
