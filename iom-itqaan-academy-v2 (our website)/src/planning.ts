import { Router } from "express";
import { z } from "zod";
import type { PoolConnection } from "mysql2/promise";
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
import {
  admins,
  requireRole,
  checkBranch,
  batchScope,
  classScope,
} from "./security.js";
import { bd, bdIso, parseLocal } from "./policy.js";
const id = z.number().int().positive(),
  date = z.iso.date(),
  reason = z.string().trim().min(2).max(2000);
export function dateRange(start?: string | null, end?: string | null) {
  if (start && end && end < start) fail(400, "End before start");
}
export async function validAssignment(
  c: PoolConnection,
  uid: number | null,
  role: string,
  b: Row,
) {
  if (!uid) return;
  const a = await obj(c, "users", uid);
  const extra = await one(
    c,
    "SELECT id FROM user_role_assignments WHERE user_id=? AND role=? AND branch_id=? AND active=1 AND (department_id IS NULL OR department_id=?)",
    [uid, role, b.branch_id, b.department_id],
  );
  if (
    !a.active ||
    (!(
      a.role === role &&
      a.branch_id === b.branch_id &&
      (!a.department_id || a.department_id === b.department_id)
    ) &&
      !extra)
  )
    fail(400, "Assigned role / scope mismatch");
}
export async function lockScheduling(
  c: PoolConnection,
  batchId: number,
  u: Row,
) {
  const before = await batchScope(c, batchId, u, "manage");
  if (before.teacher_id) await obj(c, "users", before.teacher_id, true);
  await obj(c, "batches", batchId, true);
  const b = await batchScope(c, batchId, u, "manage");
  if (b.teacher_id !== before.teacher_id)
    fail(409, "Batch assignment changed; reload");
  return b;
}
export async function noConflict(
  c: PoolConnection,
  batch: number,
  teacher: number | null,
  start: string,
  end: string,
  except = 0,
) {
  const candidates = await rows(
    c,
    "SELECT id,batch_id,actual_teacher_id,scheduled_start,scheduled_end FROM class_sessions WHERE status<>'cancelled' AND id<>? AND (batch_id=? OR (? IS NOT NULL AND actual_teacher_id=?)) AND substring(scheduled_start,1,10)<=? AND substring(scheduled_end,1,10)>=?",
    [
      except,
      batch,
      teacher,
      teacher,
      bd(parseLocal(end)).slice(0, 10),
      bd(parseLocal(start)).slice(0, 10),
    ],
  );
  if (
    candidates.some(
      (v) =>
        +parseLocal(v.scheduled_start) < +parseLocal(end) &&
        +parseLocal(v.scheduled_end) > +parseLocal(start),
    )
  )
    fail(409, "Teacher or batch has an overlapping class");
}
export function withinDates(b: Row, start: string, end: string) {
  const day = bd(parseLocal(start)).slice(0, 10),
    last = bd(parseLocal(end)).slice(0, 10);
  if (
    ((b.start_date || b.course_start_date) &&
      day < (b.start_date || b.course_start_date)) ||
    ((b.end_date || b.course_end_date) &&
      last > (b.end_date || b.course_end_date))
  )
    fail(409, "Outside batch dates");
}
export async function scheduleOne(c: PoolConnection, u: Row, d: Row) {
  requireRole(u, ...admins, "zimmadar");
  const b = await lockScheduling(c, d.batch_id, u),
    st = parseLocal(d.scheduled_start),
    ed = parseLocal(d.scheduled_end);
  if (+ed <= +st || +ed - +st > 86400000)
    fail(400, "Class must end after start within 24 hours");
  withinDates(b, d.scheduled_start, d.scheduled_end);
  await noConflict(c, b.id, b.teacher_id, bdIso(st), bdIso(ed));
  if (b.teacher_id) await validAssignment(c, b.teacher_id, "teacher", b);
  const v = await write(
    c,
    "INSERT INTO class_sessions(batch_id,scheduled_start,scheduled_end,meeting_url,actual_teacher_id,routine_id,routine_occurrence) VALUES (?,?,?,?,?,?,?)",
    [
      b.id,
      bdIso(st),
      bdIso(ed),
      d.meeting_url || null,
      b.teacher_id,
      d.routine_id || null,
      d.routine_id ? bdIso(st) : null,
    ],
  );
  await audit(c, u, "schedule", "class_session", v.insertId);
  return { id: v.insertId };
}
async function batchOwnZimmadar(c: PoolConnection, cl: Row, u: Row) {
  const b = await batchScope(c, cl.batch_id, u, "manage");
  if (u.role !== "zimmadar" || b.zimmadar_id !== u.id)
    fail(403, "Assigned Batch Zimmadar only");
  return b;
}
export function planning(store: Store, now = () => new Date()) {
  const r = Router();
  r.get("/academic-sessions", async (_q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    s.json(
      await store.read((c) =>
        rows(
          c,
          "SELECT * FROM academic_sessions" +
            (u.role === "central_admin" ? "" : " WHERE branch_id=?") +
            " ORDER BY start_date DESC",
          u.role === "central_admin" ? [] : [u.branch_id],
        ),
      ),
    );
  });
  r.post("/academic-sessions", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        branch_id: id,
        label: z.string().trim().min(2).max(150),
        start_date: date,
        end_date: date,
      })
      .parse(q.body);
    dateRange(d.start_date, d.end_date);
    checkBranch(u, d.branch_id);
    s.json(
      await store.transaction(async (c) => {
        await obj(c, "branches", d.branch_id);
        const v = await write(
          c,
          "INSERT INTO academic_sessions(branch_id,label,start_date,end_date) VALUES (?,?,?,?)",
          [d.branch_id, d.label, d.start_date, d.end_date],
        );
        await audit(c, u, "create", "academic_session", v.insertId);
        return { id: v.insertId };
      }),
    );
  });
  for (const type of ["courses", "batches"] as const)
    r.post(`/${type}/:id/settings`, async (q, s) => {
      const u = s.locals.user;
      requireRole(u, ...admins);
      const uid = id.parse(Number(q.params.id));
      const d = z
        .object({
          start_date: date.nullable(),
          end_date: date.nullable(),
          academic_session_id: id.nullable().optional(),
        })
        .parse(q.body);
      dateRange(d.start_date, d.end_date);
      await store.transaction(async (c) => {
        const target = await obj(c, type, uid, true);
        const co =
            type === "courses"
              ? target
              : await obj(c, "courses", target.course_id),
          dep = await obj(c, "departments", co.department_id);
        checkBranch(u, dep.branch_id);
        if (type === "batches" && d.academic_session_id) {
          const session = await one(
            c,
            "SELECT * FROM academic_sessions WHERE id=?",
            [d.academic_session_id],
          );
          if (!session || session.branch_id !== dep.branch_id)
            fail(400, "Session branch mismatch");
          if (
            (d.start_date && d.start_date < session.start_date) ||
            (d.end_date && d.end_date > session.end_date)
          )
            fail(400, "Outside academic session dates");
        }
        if (type === "batches") {
          const existing = await rows(
            c,
            "SELECT scheduled_start,scheduled_end FROM class_sessions WHERE batch_id=? AND status<>'cancelled'",
            [uid],
          );
          for (const cl of existing)
            withinDates(d, cl.scheduled_start, cl.scheduled_end);
          if (
            (co.start_date && d.start_date && d.start_date < co.start_date) ||
            (co.end_date && d.end_date && d.end_date > co.end_date)
          )
            fail(400, "Outside course dates");
        } else {
          const classes = await rows(
            c,
            "SELECT ss.scheduled_start,ss.scheduled_end FROM class_sessions ss JOIN batches b ON b.id=ss.batch_id WHERE b.course_id=? AND ss.status<>'cancelled'",
            [uid],
          );
          for (const cl of classes)
            withinDates(d, cl.scheduled_start, cl.scheduled_end);
          const batches = await rows(
            c,
            "SELECT start_date,end_date FROM batches WHERE course_id=?",
            [uid],
          );
          if (
            batches.some(
              (b) =>
                (d.start_date && b.start_date && b.start_date < d.start_date) ||
                (d.end_date && b.end_date && b.end_date > d.end_date),
            )
          )
            fail(409, "Existing batch falls outside these dates");
        }
        await write(
          c,
          `UPDATE ${type} SET start_date=?,end_date=?${type === "batches" ? ",academic_session_id=?" : ""} WHERE id=?`,
          [
            d.start_date,
            d.end_date,
            ...(type === "batches" ? [d.academic_session_id || null] : []),
            uid,
          ],
        );
        await audit(c, u, "settings", type, uid, d);
      });
      s.json({ ok: true });
    });
  r.get("/batches/:id/assignments", async (q, s) => {
    const uid = id.parse(Number(q.params.id));
    await store.read((c) => batchScope(c, uid, s.locals.user));
    requireRole(s.locals.user, ...admins, "zimmadar", "department_supervisor");
    s.json(
      await store.read((c) =>
        rows(
          c,
          "SELECT h.*,ot.name old_teacher,nt.name new_teacher,oz.name old_zimmadar,nz.name new_zimmadar FROM batch_assignment_history h LEFT JOIN users ot ON ot.id=h.old_teacher_id LEFT JOIN users nt ON nt.id=h.new_teacher_id LEFT JOIN users oz ON oz.id=h.old_zimmadar_id LEFT JOIN users nz ON nz.id=h.new_zimmadar_id WHERE h.batch_id=? ORDER BY h.id DESC LIMIT 100",
          [uid],
        ),
      ),
    );
  });
  r.post("/batches/:id/assignments", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        teacher_id: id.nullable(),
        zimmadar_id: id.nullable(),
        expected_teacher_id: id.nullable(),
        expected_zimmadar_id: id.nullable(),
        update_scheduled: z.boolean().default(false),
        reason,
      })
      .parse(q.body);
    await store.transaction(async (c) => {
      if (d.update_scheduled && d.teacher_id)
        await obj(c, "users", d.teacher_id, true);
      await obj(c, "batches", uid, true);
      const b = await batchScope(c, uid, u, "admin");
      if (
        b.teacher_id !== d.expected_teacher_id ||
        b.zimmadar_id !== d.expected_zimmadar_id
      )
        fail(409, "Assignment changed; reload");
      await validAssignment(c, d.teacher_id, "teacher", b);
      await validAssignment(c, d.zimmadar_id, "zimmadar", b);
      if (b.teacher_id === d.teacher_id && b.zimmadar_id === d.zimmadar_id)
        return;
      if (d.update_scheduled && b.teacher_id !== d.teacher_id) {
        if (!d.teacher_id) fail(400, "Choose a teacher for scheduled classes");
        const pending = await rows(
          c,
          "SELECT * FROM class_sessions WHERE batch_id=? AND status='scheduled' ORDER BY id FOR UPDATE",
          [uid],
        );
        for (const cl of pending.filter(
          (cl) =>
            +parseLocal(cl.scheduled_start) >= +now() &&
            (!cl.actual_teacher_id || cl.actual_teacher_id === b.teacher_id),
        )) {
          await noConflict(
            c,
            b.id,
            d.teacher_id,
            cl.scheduled_start,
            cl.scheduled_end,
            cl.id,
          );
          await write(
            c,
            "UPDATE class_sessions SET actual_teacher_id=?,schedule_revision=schedule_revision+1 WHERE id=?",
            [d.teacher_id, cl.id],
          );
          const after = await obj(c, "class_sessions", cl.id);
          await write(
            c,
            "INSERT INTO class_schedule_events(class_id,action,before_state,after_state,reason,actor_id,at) VALUES (?,?,?,?,?,?,?)",
            [
              cl.id,
              "regular_assignment",
              JSON.stringify(cl),
              JSON.stringify(after),
              d.reason,
              u.id,
              now().toISOString(),
            ],
          );
        }
      }
      await write(
        c,
        "UPDATE batches SET teacher_id=?,zimmadar_id=? WHERE id=?",
        [d.teacher_id, d.zimmadar_id, uid],
      );
      await write(
        c,
        "INSERT INTO batch_assignment_history(batch_id,old_teacher_id,new_teacher_id,old_zimmadar_id,new_zimmadar_id,reason,actor_id,at) VALUES (?,?,?,?,?,?,?,?)",
        [
          uid,
          b.teacher_id,
          d.teacher_id,
          b.zimmadar_id,
          d.zimmadar_id,
          d.reason,
          u.id,
          now().toISOString(),
        ],
      );
      await audit(c, u, "assignment_changed", "batch", uid, {
        teacher_id: d.teacher_id,
        zimmadar_id: d.zimmadar_id,
      });
    });
    s.json({ ok: true });
  });
  r.get("/routines", async (_q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins, "zimmadar");
    s.json(
      await store.read(async (c) => {
        return rows(
          c,
          "SELECT r.*,b.label batch_name,d.branch_id,co.department_id,b.zimmadar_id FROM weekly_routines r JOIN batches b ON b.id=r.batch_id JOIN courses co ON co.id=b.course_id JOIN departments d ON d.id=co.department_id" +
            (u.role === "central_admin"
              ? ""
              : " WHERE d.branch_id=?" +
                (u.role === "zimmadar" ? " AND b.zimmadar_id=?" : "") +
                (u.department_id ? " AND co.department_id=?" : "")) +
            " ORDER BY r.id DESC LIMIT 200",
          u.role === "central_admin"
            ? []
            : [
                u.branch_id,
                ...(u.role === "zimmadar" ? [u.id] : []),
                ...(u.department_id ? [u.department_id] : []),
              ],
        );
      }),
    );
  });
  r.post("/routines/:id/stop", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, ...admins, "zimmadar");
    await store.transaction(async (c) => {
      const routine = await one(
        c,
        "SELECT * FROM weekly_routines WHERE id=? FOR UPDATE",
        [uid],
      );
      if (!routine) fail(404, "Routine not found");
      await batchScope(c, routine.batch_id, u, "manage");
      if (!routine.active) return;
      await write(c, "UPDATE weekly_routines SET active=0 WHERE id=?", [uid]);
      await audit(c, u, "stop", "weekly_routine", uid);
    });
    s.json({ ok: true });
  });
  r.post("/routines", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins, "zimmadar");
    const d = z
      .object({
        batch_id: id,
        weekday: z.number().int().min(0).max(6),
        start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        from_date: date,
        until_date: date,
        meeting_url: z.url().startsWith("https://").nullable().optional(),
      })
      .parse(q.body);
    dateRange(d.from_date, d.until_date);
    if (d.end_time <= d.start_time)
      fail(400, "Weekly slot must end later on the same day");
    s.json(
      await store.transaction(async (c) => {
        const b = await lockScheduling(c, d.batch_id, u);
        withinDates(
          b,
          d.from_date + "T" + d.start_time,
          d.until_date + "T" + d.end_time,
        );
        const v = await write(
          c,
          "INSERT INTO weekly_routines(batch_id,weekday,start_time,end_time,from_date,until_date,meeting_url,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
          [
            d.batch_id,
            d.weekday,
            d.start_time,
            d.end_time,
            d.from_date,
            d.until_date,
            d.meeting_url || null,
            u.id,
            now().toISOString(),
          ],
        );
        await audit(c, u, "create", "weekly_routine", v.insertId);
        return { id: v.insertId };
      }),
    );
  });
  r.post("/routines/:id/generate", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, ...admins, "zimmadar");
    const d = z.object({ from_date: date, until_date: date }).parse(q.body);
    dateRange(d.from_date, d.until_date);
    if (+new Date(d.until_date) - +new Date(d.from_date) > 30 * 86400000)
      fail(400, "Generate at most 31 calendar days");
    s.json(
      await store.transaction(async (c) => {
        const routine = await one(
          c,
          "SELECT * FROM weekly_routines WHERE id=?",
          [uid],
        );
        if (!routine) fail(404, "Routine not found");
        const b = await lockScheduling(c, routine.batch_id, u);
        const current = await one(
          c,
          "SELECT active FROM weekly_routines WHERE id=? FOR UPDATE",
          [uid],
        );
        if (!current?.active) fail(409, "Routine inactive");
        if (
          d.from_date < routine.from_date ||
          d.until_date > routine.until_date
        )
          fail(400, "Outside routine dates");
        let created = 0,
          existing = 0;
        for (
          let stamp = +new Date(d.from_date + "T00:00:00Z");
          stamp <= +new Date(d.until_date + "T00:00:00Z");
          stamp += 86400000
        ) {
          const day = new Date(stamp);
          if (day.getUTCDay() !== routine.weekday) continue;
          const dt = day.toISOString().slice(0, 10),
            start = bdIso(parseLocal(dt + "T" + routine.start_time)),
            end = bdIso(parseLocal(dt + "T" + routine.end_time));
          if (
            await one(
              c,
              "SELECT id FROM class_sessions WHERE routine_id=? AND routine_occurrence=?",
              [uid, start],
            )
          ) {
            existing++;
            continue;
          }
          await scheduleOne(c, u, {
            batch_id: b.id,
            scheduled_start: start,
            scheduled_end: end,
            meeting_url: routine.meeting_url,
            routine_id: uid,
          });
          created++;
        }
        if (created)
          await audit(c, u, "generate", "weekly_routine", uid, {
            created,
            existing,
          });
        return { created, existing };
      }),
    );
  });
  for (const action of ["reschedule", "cancel", "substitute"] as const)
    r.post(`/classes/:id/${action}`, async (q, s) => {
      const uid = id.parse(Number(q.params.id)),
        u = s.locals.user;
      const d = z
        .object({
          reason,
          expected_start: z.string(),
          expected_revision: z.number().int().nonnegative().default(0),
          scheduled_start: z.string().optional(),
          scheduled_end: z.string().optional(),
          teacher_id: id.optional(),
        })
        .parse(q.body);
      await store.transaction(async (c) => {
        const initial = await obj(c, "class_sessions", uid);
        const teacher =
          action === "substitute" ? d.teacher_id : initial.actual_teacher_id;
        if (teacher) await obj(c, "users", teacher, true);
        const cl = await obj(c, "class_sessions", uid, true),
          b = await batchOwnZimmadar(c, cl, u);
        if (
          action === "reschedule" &&
          cl.actual_teacher_id !== initial.actual_teacher_id
        )
          fail(409, "Teacher assignment changed; reload");
        if (
          cl.status !== "scheduled" ||
          cl.schedule_revision !== d.expected_revision ||
          cl.scheduled_start !== d.expected_start
        )
          fail(409, "Class started or changed; reload");
        if (action === "cancel")
          await write(
            c,
            "UPDATE class_sessions SET status='cancelled' WHERE id=?",
            [uid],
          );
        else if (action === "substitute") {
          if (!d.teacher_id) fail(400, "Teacher required");
          await validAssignment(c, d.teacher_id, "teacher", b);
          await noConflict(
            c,
            b.id,
            d.teacher_id,
            cl.scheduled_start,
            cl.scheduled_end,
            uid,
          );
          await write(
            c,
            "UPDATE class_sessions SET actual_teacher_id=? WHERE id=?",
            [d.teacher_id, uid],
          );
        } else {
          if (!d.scheduled_start || !d.scheduled_end)
            fail(400, "New start and end required");
          const st = parseLocal(d.scheduled_start),
            ed = parseLocal(d.scheduled_end);
          if (+ed <= +st || +ed - +st > 86400000)
            fail(400, "Invalid class interval");
          withinDates(b, d.scheduled_start, d.scheduled_end);
          await noConflict(
            c,
            b.id,
            cl.actual_teacher_id,
            bdIso(st),
            bdIso(ed),
            uid,
          );
          await write(
            c,
            "UPDATE class_sessions SET scheduled_start=?,scheduled_end=? WHERE id=?",
            [bdIso(st), bdIso(ed), uid],
          );
        }
        await write(
          c,
          "UPDATE class_sessions SET schedule_revision=schedule_revision+1 WHERE id=?",
          [uid],
        );
        const after = await obj(c, "class_sessions", uid);
        await write(
          c,
          "INSERT INTO class_schedule_events(class_id,action,before_state,after_state,reason,actor_id,at) VALUES (?,?,?,?,?,?,?)",
          [
            uid,
            action,
            JSON.stringify(cl),
            JSON.stringify(after),
            d.reason,
            u.id,
            now().toISOString(),
          ],
        );
        await audit(c, u, action, "class_session", uid);
      });
      s.json({ ok: true });
    });
  r.get("/classes/:id/schedule-history", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, ...admins, "teacher", "zimmadar", "department_supervisor");
    await store.read((c) => classScope(c, uid, u));
    s.json(
      await store.read((c) =>
        rows(
          c,
          "SELECT id,action,reason,actor_id,at,before_state,after_state FROM class_schedule_events WHERE class_id=? ORDER BY id DESC LIMIT 100",
          [uid],
        ),
      ),
    );
  });
  r.post("/enrollments/:id/status", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        status: z.enum([
          "active",
          "on_hold",
          "withdrawn",
          "completed",
          "inactive",
        ]),
        expected_status: z.string(),
        expected_end_date: date.nullable().optional(),
        end_date: date.nullable(),
        reason,
      })
      .parse(q.body);
    await store.transaction(async (c) => {
      const en = await obj(c, "enrollments", uid, true);
      await batchScope(c, en.batch_id, u, "admin");
      if (
        en.status !== d.expected_status ||
        (d.expected_end_date !== undefined &&
          en.end_date !== d.expected_end_date)
      )
        fail(409, "Enrollment changed; reload");
      dateRange(en.start_date, d.end_date);
      if (d.end_date) {
        const held = await one(
          c,
          "SELECT MAX(substring(scheduled_start,1,10)) last_day FROM class_sessions WHERE batch_id=? AND status='ended' AND held_verified=1 AND substring(scheduled_start,1,10)>=? AND (? IS NULL OR substring(scheduled_start,1,10)<=?)",
          [en.batch_id, en.start_date, en.end_date, en.end_date],
        );
        if (held?.last_day && d.end_date < held.last_day)
          fail(409, "End date would hide existing held-class history");
      }
      if (
        ["withdrawn", "completed", "inactive"].includes(d.status) &&
        !d.end_date
      )
        fail(400, "Last active date required");
      if (
        ["withdrawn", "completed", "inactive"].includes(en.status) &&
        d.status !== en.status
      )
        fail(
          409,
          "Closed enrollment reactivation is deferred; create a new enrollment",
        );
      if (d.status === en.status && d.end_date === en.end_date) return;
      await write(c, "UPDATE enrollments SET status=?,end_date=? WHERE id=?", [
        d.status,
        d.end_date,
        uid,
      ]);
      await write(
        c,
        "INSERT INTO enrollment_status_history(enrollment_id,from_status,to_status,previous_end_date,end_date,reason,actor_id,at) VALUES (?,?,?,?,?,?,?,?)",
        [
          uid,
          en.status,
          d.status,
          en.end_date,
          d.end_date,
          d.reason,
          u.id,
          now().toISOString(),
        ],
      );
      await audit(c, u, "status_changed", "enrollment", uid, {
        from: en.status,
        to: d.status,
        end_date: d.end_date,
      });
    });
    s.json({ ok: true });
  });
  r.get("/enrollments/:id/status-history", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, ...admins);
    s.json(
      await store.read(async (c) => {
        const en = await obj(c, "enrollments", uid);
        await batchScope(c, en.batch_id, u, "admin");
        return rows(
          c,
          "SELECT * FROM enrollment_status_history WHERE enrollment_id=? ORDER BY id DESC LIMIT 100",
          [uid],
        );
      }),
    );
  });
  return r;
}
