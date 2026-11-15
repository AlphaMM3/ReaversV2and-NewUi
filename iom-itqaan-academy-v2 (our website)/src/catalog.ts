import { Router } from "express";
import { z } from "zod";
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
  staff,
  roles,
  requireRole,
  checkBranch,
  checkDepartment,
  hashPassword,
  batchScope,
} from "./security.js";
import { bdIso, parseLocal } from "./policy.js";
import { scheduleOne } from "./planning.js";
export const id = z.number().int().positive();
const text = (n = 150) => z.string().min(2).max(n);
const date = z.iso.date();

export interface ListStudentsQuery {
  branch_id?: number;
  family_id?: number;
  search?: string;
  limit?: number;
}
export interface ListEnrollmentsQuery {
  batch_id?: number;
  student_id?: number;
  status?: string;
  limit?: number;
}
export interface ListClassesQuery {
  batch_id?: number;
  status?: string;
  from?: string;
  until?: string;
  limit?: number;
}
export async function createEnrollment(c: any, u: Row, d: Row) {
  await obj(c, "batches", d.batch_id, true);
  const st = await obj(c, "students", d.student_id),
    b = await batchScope(c, d.batch_id, u, "admin");
  if (st.branch_id !== b.branch_id)
    fail(400, "Cannot enroll across branches without approved transfer");
  if (d.end_date && d.end_date < d.start_date) fail(400, "End before start");
  if (
    ((b.start_date || b.course_start_date) &&
      d.start_date < (b.start_date || b.course_start_date)) ||
    ((b.end_date || b.course_end_date) &&
      (!d.end_date || d.end_date > (b.end_date || b.course_end_date)))
  )
    fail(400, "Enrollment must fit batch dates");
  const overlaps =
    "status='active' AND (end_date IS NULL OR end_date>=?) AND (? IS NULL OR start_date<=?)";
  if (
    b.delivery_mode === "one_to_one" &&
    (await one(
      c,
      "SELECT 1 FROM enrollments WHERE batch_id=? AND " + overlaps + " LIMIT 1",
      [b.id, d.start_date, d.end_date || null, d.end_date || null],
    ))
  )
    fail(409, "One-to-one slot already assigned");
  if (
    await one(
      c,
      "SELECT 1 FROM enrollments WHERE batch_id=? AND student_id=? AND " +
        overlaps +
        " LIMIT 1",
      [b.id, st.id, d.start_date, d.end_date || null, d.end_date || null],
    )
  )
    fail(409, "Student already has an overlapping active enrollment");
  const v = await write(
    c,
    "INSERT INTO enrollments(student_id,batch_id,start_date,end_date) VALUES (?,?,?,?)",
    [st.id, b.id, d.start_date, d.end_date || null],
  );
  await audit(c, u, "enroll", "enrollment", v.insertId);
  return { id: v.insertId };
}
export async function students(c: any, u: Row, query: ListStudentsQuery = {}, countOnly = false) {
  const base =
    "SELECT s.id,s.full_name,s.family_id,s.branch_id,f.name family_name FROM students s JOIN families f ON f.id=s.family_id";
  let where = "",
    args: any[] = [];
  if (u.role === "central_admin") {
    // central admin sees all
  } else if (u.role === "branch_admin") {
    where = "WHERE s.branch_id=?";
    args = [u.branch_id];
  } else if (u.role.startsWith("guardian")) {
    where =
      "JOIN family_guardians fg ON fg.family_id=s.family_id WHERE fg.user_id=?";
    args = [u.id];
  } else if (u.role === "department_supervisor") {
    where =
      "WHERE s.branch_id=? AND EXISTS (SELECT 1 FROM enrollments e JOIN batches b ON b.id=e.batch_id JOIN courses co ON co.id=b.course_id WHERE e.student_id=s.id AND co.department_id=?)";
    args = [u.branch_id, u.department_id];
  } else if (u.role === "teacher") {
    where =
      "WHERE s.branch_id=? AND EXISTS (SELECT 1 FROM enrollments e JOIN batches b ON b.id=e.batch_id JOIN courses co ON co.id=b.course_id WHERE e.student_id=s.id AND (b.teacher_id=? OR EXISTS (SELECT 1 FROM class_sessions ss WHERE ss.batch_id=b.id AND ss.actual_teacher_id=?))" +
      (u.department_id ? " AND co.department_id=?" : "") +
      ")";
    args = [u.branch_id, u.id, u.id, ...(u.department_id ? [u.department_id] : [])];
  } else {
    where =
      `WHERE s.branch_id=? AND EXISTS (SELECT 1 FROM enrollments e JOIN batches b ON b.id=e.batch_id JOIN courses co ON co.id=b.course_id WHERE e.student_id=s.id AND b.${u.role === "teacher" ? "teacher_id" : "zimmadar_id"}=?${u.department_id ? " AND co.department_id=?" : ""})`;
    args = [u.branch_id, u.id, ...(u.department_id ? [u.department_id] : [])];
  }

  if (query.family_id) {
    where += (where ? (where.includes("WHERE") ? " AND " : " WHERE ") : " WHERE ") + "s.family_id=?";
    args.push(query.family_id);
  }
  if (query.search) {
    where += (where ? (where.includes("WHERE") ? " AND " : " WHERE ") : " WHERE ") + "s.full_name LIKE ?";
    args.push(`%${query.search.trim()}%`);
  }
  if (query.branch_id && u.role === "central_admin") {
    where += (where ? (where.includes("WHERE") ? " AND " : " WHERE ") : " WHERE ") + "s.branch_id=?";
    args.push(query.branch_id);
  }

  if (countOnly) {
    return rows(c, `SELECT COUNT(*) total FROM (${base} ${where}) scoped_students`.replace(/\s+/g, " "), args);
  }
  const limitClause = query.limit
    ? ` LIMIT ${Math.min(Math.max(1, Math.floor(Number(query.limit))), 500)}`
    : "";
  return rows(c, `${base} ${where} ORDER BY s.id DESC${limitClause}`.replace(/\s+/g, " "), args);
}
export async function enrollments(c: any, u: Row, query: ListEnrollmentsQuery = {}, countOnly = false) {
  const base =
    "SELECT e.*,s.full_name student_name,s.family_id,s.branch_id,b.label batch_name,b.delivery_mode,c.title course_title FROM enrollments e JOIN students s ON s.id=e.student_id JOIN batches b ON b.id=e.batch_id JOIN courses c ON c.id=b.course_id";
  let where = "",
    args: any[] = [];
  if (u.role === "central_admin") {
    // central admin sees all
  } else if (u.role === "branch_admin") {
    where = "WHERE s.branch_id=?";
    args = [u.branch_id];
  } else if (u.role.startsWith("guardian")) {
    where =
      "JOIN family_guardians fg ON fg.family_id=s.family_id WHERE fg.user_id=?";
    args = [u.id];
  } else if (u.role === "department_supervisor") {
    where = "WHERE s.branch_id=? AND c.department_id=?";
    args = [u.branch_id, u.department_id];
  } else if (u.role === "teacher") {
    where =
      "WHERE s.branch_id=? AND (b.teacher_id=? OR EXISTS (SELECT 1 FROM class_sessions ss WHERE ss.batch_id=b.id AND ss.actual_teacher_id=?))" +
      (u.department_id ? " AND c.department_id=?" : "");
    args = [u.branch_id, u.id, u.id, ...(u.department_id ? [u.department_id] : [])];
  } else {
    where =
      `WHERE s.branch_id=? AND b.${u.role === "teacher" ? "teacher_id" : "zimmadar_id"}=?${u.department_id ? " AND c.department_id=?" : ""}`;
    args = [u.branch_id, u.id, ...(u.department_id ? [u.department_id] : [])];
  }

  if (query.batch_id) {
    where += (where ? (where.includes("WHERE") ? " AND " : " WHERE ") : " WHERE ") + "e.batch_id=?";
    args.push(query.batch_id);
  }
  if (query.student_id) {
    where += (where ? (where.includes("WHERE") ? " AND " : " WHERE ") : " WHERE ") + "e.student_id=?";
    args.push(query.student_id);
  }
  if (query.status) {
    where += (where ? (where.includes("WHERE") ? " AND " : " WHERE ") : " WHERE ") + "e.status=?";
    args.push(query.status);
  }

  if (countOnly) {
    return rows(
      c,
      `SELECT COUNT(*) total, COALESCE(SUM(delivery_mode='group'),0) group_enrollments, COALESCE(SUM(delivery_mode='one_to_one'),0) one_to_one_enrollments, COALESCE(SUM(status='active'),0) active_enrollments FROM (${base} ${where}) scoped_enrollments`.replace(/\s+/g, " "),
      args,
    );
  }
  const limitClause = query.limit
    ? ` LIMIT ${Math.min(Math.max(1, Math.floor(Number(query.limit))), 500)}`
    : "";
  return rows(c, `${base} ${where} ORDER BY e.id DESC${limitClause}`.replace(/\s+/g, " "), args);
}
export async function classes(c: any, u: Row, countOnly = false, query: ListClassesQuery = {}) {
  const base =
    "SELECT s.*,b.label batch_name,b.delivery_mode,c.title course_title,d.branch_id,b.teacher_id,b.zimmadar_id FROM class_sessions s JOIN batches b ON b.id=s.batch_id JOIN courses c ON c.id=b.course_id JOIN departments d ON d.id=c.department_id";
  let clause = "",
    args: any[] = [];
  if (u.role === "branch_admin") {
    clause = " WHERE d.branch_id=?";
    args = [u.branch_id];
  } else if (u.role === "teacher") {
    clause = " WHERE s.actual_teacher_id=?";
    args = [u.id];
  } else if (u.role === "zimmadar") {
    clause = " WHERE b.zimmadar_id=?";
    args = [u.id];
  } else if (u.role.startsWith("guardian")) {
    clause =
      " WHERE EXISTS (SELECT 1 FROM enrollments e JOIN students st ON st.id=e.student_id JOIN family_guardians fg ON fg.family_id=st.family_id WHERE e.batch_id=b.id AND fg.user_id=?)";
    args = [u.id];
  }
  if (u.role === "department_supervisor") {
    clause = " WHERE d.branch_id=?";
    args = [u.branch_id];
  }
  if (u.role !== "central_admin" && u.department_id) {
    clause += (clause ? " AND " : " WHERE ") + "c.department_id=?";
    args.push(u.department_id);
  }
  if (query.batch_id) {
    clause += (clause ? " AND " : " WHERE ") + "s.batch_id=?";
    args.push(query.batch_id);
  }
  if (query.status) {
    clause += (clause ? " AND " : " WHERE ") + "s.status=?";
    args.push(query.status);
  }
  if (query.from) {
    clause += (clause ? " AND " : " WHERE ") + "s.scheduled_start >= ?";
    args.push(query.from);
  }
  if (query.until) {
    clause += (clause ? " AND " : " WHERE ") + "s.scheduled_start <= ?";
    args.push(query.until);
  }
  if (countOnly)
    return rows(
      c,
      "SELECT COUNT(*) total FROM (" + base + clause + ") scoped_classes",
      args,
    );
  const limit = Math.min(Math.max(1, Math.floor(Number(query.limit) || 200)), 500);
  return rows(
    c,
    base + clause + ` ORDER BY s.scheduled_start DESC LIMIT ${limit}`,
    args,
  );
}
export function catalog(store: Store) {
  const r = Router();
  r.get("/users", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...staff);
    s.json(
      await store.read((c) => {
        const base =
          "SELECT id,name,email,role,branch_id,department_id,active,(SELECT GROUP_CONCAT(ar.role) FROM user_role_assignments ar WHERE ar.user_id=users.id AND ar.active=1) assigned_roles FROM users WHERE " +
          (["central_admin", "branch_admin", "zimmadar"].includes(u.role) && q.query.include_inactive === "1"
            ? "1=1"
            : "active=1");
        return rows(
          c,
          base +
            (u.role === "central_admin"
              ? " ORDER BY id DESC"
              : ["teacher", "department_supervisor"].includes(u.role)
                ? " AND id=?"
                : " AND (branch_id=? OR branch_id IS NULL) ORDER BY id DESC"),
          u.role === "central_admin"
            ? []
            : [
                ["teacher", "department_supervisor"].includes(u.role)
                  ? u.id
                  : u.branch_id,
              ],
        );
      }),
    );
  });
  r.patch("/users/:id", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin", "branch_admin", "zimmadar");
    const targetUserId = z.coerce.number().int().positive().parse(q.params.id);
    const body = z
      .object({
        active: z.union([z.literal(0), z.literal(1)]),
        reason: z.string().max(500).optional(),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const targetUser = await obj(c, "users", targetUserId);
        if (!targetUser) fail(404, "User not found");
        if (u.role === "branch_admin") {
          if (targetUser.role === "central_admin" || targetUser.branch_id !== u.branch_id) {
            fail(403, "Cannot modify users outside your branch");
          }
        } else if (u.role === "zimmadar") {
          if (!["guardian_primary", "guardian_secondary", "student"].includes(targetUser.role)) {
            fail(403, "Zimmadar can only activate or deactivate guardian/student accounts");
          }
        }
        await write(c, "UPDATE users SET active=? WHERE id=?", [body.active, targetUserId]);
        await audit(c, u, "update", "user", targetUserId, {
          active: body.active,
          reason: body.reason || (body.active ? "Account activated" : "Account deactivated / Fee hold"),
        });
        return { success: true, id: targetUserId, active: body.active };
      }),
    );
  });
  r.post("/users", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        email: z.email().max(254),
        name: text(),
        role: z.enum(roles as [string, ...string[]]),
        branch_id: id.nullable().optional(),
        department_id: id.nullable().optional(),
        password: z.string().min(12).max(256),
      })
      .parse(q.body);
    if (
      u.role === "branch_admin" &&
      (admins.includes(d.role) || d.branch_id !== u.branch_id)
    )
      fail(403, "Branch admin cannot create privileged/cross-branch users");
    if (d.role !== "central_admin" && !d.branch_id)
      fail(400, "Branch required");
    const h = await hashPassword(d.password);
    s.json(
      await store.transaction(async (c) => {
        if (d.branch_id) await obj(c, "branches", d.branch_id);
        if (d.role === "department_supervisor" && !d.department_id)
          fail(400, "Department required");
        if (d.department_id) {
          if (
            !["teacher", "zimmadar", "department_supervisor"].includes(d.role)
          )
            fail(400, "This role has no department scope");
          const dep = await obj(c, "departments", d.department_id);
          if (dep.branch_id !== d.branch_id)
            fail(400, "Department branch mismatch");
        }
        const v = await write(
          c,
          "INSERT INTO users(email,name,role,branch_id,password_salt,password_hash,created_at,department_id) VALUES (?,?,?,?,?,?,?,?)",
          [
            d.email.trim().toLowerCase(),
            d.name,
            d.role,
            d.branch_id || null,
            h.salt,
            h.hash,
            new Date().toISOString(),
            d.department_id || null,
          ],
        );
        await audit(c, u, "create", "user", v.insertId, { role: d.role });
        return { id: v.insertId };
      }),
    );
  });
  r.get("/branches", async (_q, s) => {
    const u = s.locals.user;
    requireRole(u, ...staff);
    s.json(
      await store.read((c) =>
        rows(
          c,
          "SELECT * FROM branches" +
            (u.role === "central_admin" ? "" : " WHERE id=?"),
          u.role === "central_admin" ? [] : [u.branch_id],
        ),
      ),
    );
  });
  r.post("/branches", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin");
    const d = z.object({ name: text(100) }).parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const v = await write(c, "INSERT INTO branches(name) VALUES (?)", [
          d.name,
        ]);
        await audit(c, u, "create", "branch", v.insertId);
        return { id: v.insertId };
      }),
    );
  });
  r.get("/families", async (_q, s) => {
    const u = s.locals.user;
    s.json(
      await store.read((c) => {
        if (u.role === "central_admin")
          return rows(c, "SELECT * FROM families ORDER BY id DESC");
        if (u.role === "branch_admin")
          return rows(c, "SELECT * FROM families WHERE branch_id=?", [
            u.branch_id,
          ]);
        if (u.role.startsWith("guardian"))
          return rows(
            c,
            "SELECT f.* FROM families f JOIN family_guardians fg ON fg.family_id=f.id WHERE fg.user_id=?",
            [u.id],
          );
        return fail(403, "Family list restricted");
      }),
    );
  });
  r.post("/families", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        name: z.string().min(1).max(150),
        branch_id: id,
        guardian_user_id: id.nullable().optional(),
      })
      .parse(q.body);
    checkBranch(u, d.branch_id);
    s.json(
      await store.transaction(async (c) => {
        await obj(c, "branches", d.branch_id);
        if (d.guardian_user_id) {
          const g = await obj(c, "users", d.guardian_user_id);
          if (
            !g.active ||
            !g.role.startsWith("guardian") ||
            g.branch_id !== d.branch_id
          )
            fail(400, "Guardian role / branch mismatch");
        }
        const v = await write(
          c,
          "INSERT INTO families(name,branch_id) VALUES (?,?)",
          [d.name, d.branch_id],
        );
        if (d.guardian_user_id)
          await write(
            c,
            "INSERT INTO family_guardians(family_id,user_id) VALUES (?,?)",
            [v.insertId, d.guardian_user_id],
          );
        await audit(c, u, "create", "family", v.insertId);
        return { id: v.insertId };
      }),
    );
  });
  r.get("/families/:family_id/guardians", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const familyId = id.parse(Number(q.params.family_id));
    s.json(
      await store.read(async (c) => {
        const family = await obj(c, "families", familyId);
        checkBranch(u, family.branch_id);
        return rows(
          c,
          "SELECT u.id,u.name,u.role,u.active FROM family_guardians fg JOIN users u ON u.id=fg.user_id WHERE fg.family_id=? ORDER BY u.id",
          [familyId],
        );
      }),
    );
  });
  // Basic admin family setup, D-010/064/066. Primary self-service is separate scope.
  r.post("/families/:family_id/guardians", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const familyId = id.parse(Number(q.params.family_id));
    const d = z.object({ guardian_user_id: id }).parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const family = await obj(c, "families", familyId, true);
        checkBranch(u, family.branch_id);
        const guardian = await obj(c, "users", d.guardian_user_id, true);
        if (
          !guardian.active ||
          !guardian.role.startsWith("guardian") ||
          guardian.branch_id !== family.branch_id
        )
          fail(400, "Active Guardian in the same branch required");
        const existing = await one(
          c,
          "SELECT 1 FROM family_guardians WHERE family_id=? AND user_id=?",
          [familyId, guardian.id],
        );
        if (existing) return { ok: true, already_linked: true };
        await write(
          c,
          "INSERT INTO family_guardians(family_id,user_id) VALUES (?,?)",
          [familyId, guardian.id],
        );
        await audit(c, u, "link_guardian", "family", familyId, {
          guardian_user_id: guardian.id,
          role: guardian.role,
        });
        return { ok: true, already_linked: false };
      }),
    );
  });
  r.get("/guardians", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...staff);
    s.json(
      await store.read((c) =>
        rows(
          c,
          `SELECT u.id, u.name, u.email, u.role, u.branch_id, u.active, u.created_at,
                  f.id as family_id, f.name as family_name,
                  (SELECT GROUP_CONCAT(CONCAT(s.id, ':', s.full_name) SEPARATOR '; ') 
                   FROM students s WHERE s.family_id = f.id) as students_info
           FROM users u
           LEFT JOIN family_guardians fg ON fg.user_id = u.id
           LEFT JOIN families f ON f.id = fg.family_id
           WHERE u.role LIKE 'guardian%'
           ORDER BY u.id DESC`,
        ),
      ),
    );
  });
  r.post("/guardians", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins, "zimmadar");
    const d = z
      .object({
        name: text(),
        email: z.string().email().max(254),
        password: z.string().min(12).max(256),
        branch_id: id.default(1),
        family_name: z.string().min(2).max(150).optional(),
        student_ids: z.array(id).optional(),
      })
      .parse(q.body);
    checkBranch(u, d.branch_id);
    const h = await hashPassword(d.password);
    s.json(
      await store.transaction(async (c) => {
        const at = new Date().toISOString();
        const v = await write(
          c,
          "INSERT INTO users(email,name,role,branch_id,password_salt,password_hash,created_at) VALUES (?,?,?,?,?,?,?)",
          [
            d.email.trim().toLowerCase(),
            d.name.trim(),
            "guardian_primary",
            d.branch_id,
            h.salt,
            h.hash,
            at,
          ],
        );
        const guardianUserId = v.insertId;
        const famName = d.family_name?.trim() || `${d.name.trim()} পরিবার`;
        const fv = await write(
          c,
          "INSERT INTO families(name,branch_id) VALUES (?,?)",
          [famName, d.branch_id],
        );
        const familyId = fv.insertId;
        await write(
          c,
          "INSERT INTO family_guardians(family_id,user_id) VALUES (?,?)",
          [familyId, guardianUserId],
        );
        if (d.student_ids && d.student_ids.length > 0) {
          for (const sId of d.student_ids) {
            await write(c, "UPDATE students SET family_id=? WHERE id=?", [
              familyId,
              sId,
            ]);
          }
        }
        await audit(c, u, "create", "guardian", guardianUserId, {
          family_id: familyId,
        });
        return { ok: true, user_id: guardianUserId, family_id: familyId };
      }),
    );
  });
  r.get("/students", async (q, s) => {
    const query: ListStudentsQuery = {};
    if (q.query.family_id) {
      const fId = Number(q.query.family_id);
      if (Number.isInteger(fId) && fId > 0) query.family_id = fId;
    }
    if (q.query.branch_id) {
      const bId = Number(q.query.branch_id);
      if (Number.isInteger(bId) && bId > 0) query.branch_id = bId;
    }
    if (typeof q.query.search === "string" && q.query.search.trim()) {
      query.search = q.query.search.trim().slice(0, 100);
    }
    if (q.query.limit) {
      const lim = Number(q.query.limit);
      if (Number.isInteger(lim) && lim > 0) query.limit = lim;
    }
    s.json(await store.read((c) => students(c, s.locals.user, query)));
  });
  r.post("/students", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const d = z.object({ full_name: text(160), family_id: id }).parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const f = await obj(c, "families", d.family_id);
        checkBranch(u, f.branch_id);
        const v = await write(
          c,
          "INSERT INTO students(full_name,branch_id,family_id,created_at) VALUES (?,?,?,?)",
          [d.full_name, f.branch_id, d.family_id, new Date().toISOString()],
        );
        await audit(c, u, "create", "student", v.insertId);
        return { id: v.insertId };
      }),
    );
  });
  r.get("/departments", async (_q, s) => {
    const u = s.locals.user;
    s.json(
      await store.read((c) =>
        u.role.startsWith("guardian")
          ? Promise.resolve([])
          : rows(
              c,
              "SELECT * FROM departments" +
                (u.role === "central_admin"
                  ? ""
                  : " WHERE branch_id=?" +
                    (u.department_id ? " AND id=?" : "")),
              u.role === "central_admin"
                ? []
                : [u.branch_id, ...(u.department_id ? [u.department_id] : [])],
            ),
      ),
    );
  });
  r.post("/departments", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        branch_id: id,
        name: text(),
        category: z
          .enum(["regular", "single_course", "other"])
          .default("regular"),
      })
      .parse(q.body);
    checkBranch(u, d.branch_id);
    s.json(
      await store.transaction(async (c) => {
        await obj(c, "branches", d.branch_id);
        const v = await write(
          c,
          "INSERT INTO departments(branch_id,name,category) VALUES (?,?,?)",
          [d.branch_id, d.name, d.category],
        );
        await audit(c, u, "create", "department", v.insertId);
        return { id: v.insertId };
      }),
    );
  });
  r.get("/courses", async (q, s) => {
    const u = s.locals.user;
    if (u.role.startsWith("guardian")) {
      s.json([]);
      return;
    }
    const queryDeptId = q.query.department_id ? Number(q.query.department_id) : undefined;
    const queryDuration = typeof q.query.duration_type === "string" && ["fixed", "continuous"].includes(q.query.duration_type.trim())
      ? q.query.duration_type.trim()
      : undefined;

    s.json(
      await store.read((c) => {
        let sql =
          "SELECT c.*,d.name department,d.branch_id,d.category FROM courses c JOIN departments d ON d.id=c.department_id";
        const args: any[] = [];
        if (u.role !== "central_admin") {
          sql += " WHERE d.branch_id=?";
          args.push(u.branch_id);
          if (u.department_id) {
            sql += " AND c.department_id=?";
            args.push(u.department_id);
          }
        }
        if (queryDeptId && Number.isInteger(queryDeptId) && queryDeptId > 0) {
          sql += (sql.includes(" WHERE ") ? " AND " : " WHERE ") + "c.department_id=?";
          args.push(queryDeptId);
        }
        if (queryDuration) {
          sql += (sql.includes(" WHERE ") ? " AND " : " WHERE ") + "c.duration_type=?";
          args.push(queryDuration);
        }
        return rows(c, sql, args);
      }),
    );
  });
  r.post("/courses", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        department_id: id,
        title: text(),
        duration_type: z.enum(["fixed", "continuous"]).default("fixed"),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const dep = await obj(c, "departments", d.department_id);
        checkBranch(u, dep.branch_id);
        const v = await write(
          c,
          "INSERT INTO courses(department_id,title,duration_type) VALUES (?,?,?)",
          [d.department_id, d.title, d.duration_type],
        );
        await audit(c, u, "create", "course", v.insertId);
        return { id: v.insertId };
      }),
    );
  });
  r.get("/batches", async (q, s) => {
    const u = s.locals.user;
    let sql =
        `SELECT b.*,c.title course_title,d.branch_id,d.name department,
                ut.name teacher_name, uz.name zimmadar_name,
                st.full_name one_to_one_student_name
         FROM batches b
         JOIN courses c ON c.id=b.course_id
         JOIN departments d ON d.id=c.department_id
         LEFT JOIN users ut ON ut.id=b.teacher_id
         LEFT JOIN users uz ON uz.id=b.zimmadar_id
         LEFT JOIN enrollments e ON e.batch_id=b.id AND b.delivery_mode='one_to_one' AND e.status IN ('active','enrolled')
         LEFT JOIN students st ON st.id=e.student_id`,
      args: any[] = [];
    if (u.role === "branch_admin") {
      sql += " WHERE d.branch_id=?";
      args = [u.branch_id];
    } else if (["teacher", "zimmadar"].includes(u.role)) {
      sql += ` WHERE b.${u.role === "teacher" ? "teacher_id" : "zimmadar_id"}=?`;
      args = [u.id];
    } else if (u.role.startsWith("guardian")) {
      sql +=
        " WHERE EXISTS (SELECT 1 FROM enrollments e JOIN students st ON st.id=e.student_id JOIN family_guardians fg ON fg.family_id=st.family_id WHERE e.batch_id=b.id AND fg.user_id=?)";
      args = [u.id];
    }
    if (u.role === "department_supervisor") {
      sql += " WHERE d.branch_id=?";
      args = [u.branch_id];
    }
    if (u.role !== "central_admin" && u.department_id) {
      sql += " AND c.department_id=?";
      args.push(u.department_id);
    }
    if (q.query.course_id) {
      const cId = Number(q.query.course_id);
      if (Number.isInteger(cId) && cId > 0) {
        sql += (sql.includes(" WHERE ") ? " AND " : " WHERE ") + "b.course_id=?";
        args.push(cId);
      }
    }
    if (typeof q.query.delivery_mode === "string" && ["group", "one_to_one"].includes(q.query.delivery_mode.trim())) {
      sql += (sql.includes(" WHERE ") ? " AND " : " WHERE ") + "b.delivery_mode=?";
      args.push(q.query.delivery_mode.trim());
    }
    s.json(await store.read((c) => rows(c, sql, args)));
  });
  r.post("/batches", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        course_id: id,
        label: text(),
        delivery_mode: z.enum(["group", "one_to_one"]).default("group"),
        teacher_id: id.nullable().optional(),
        zimmadar_id: id.nullable().optional(),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const co = await obj(c, "courses", d.course_id),
          dep = await obj(c, "departments", co.department_id);
        checkBranch(u, dep.branch_id);
        for (const [uid, role] of [
          [d.teacher_id, "teacher"],
          [d.zimmadar_id, "zimmadar"],
        ] as const) {
          if (uid) {
            const a = await obj(c, "users", uid);
            const extra = await one(
              c,
              "SELECT id FROM user_role_assignments WHERE user_id=? AND role=? AND branch_id=? AND active=1 AND (department_id IS NULL OR department_id=?)",
              [uid, role, dep.branch_id, dep.id],
            );
            if (
              !a.active ||
              (!(
                a.role === role &&
                a.branch_id === dep.branch_id &&
                (!a.department_id || a.department_id === dep.id)
              ) &&
                !extra)
            )
              fail(400, "Assigned role / branch mismatch");
          }
        }
        const v = await write(
          c,
          "INSERT INTO batches(course_id,label,delivery_mode,teacher_id,zimmadar_id) VALUES (?,?,?,?,?)",
          [
            d.course_id,
            d.label,
            d.delivery_mode,
            d.teacher_id || null,
            d.zimmadar_id || null,
          ],
        );
        await audit(c, u, "create", "batch", v.insertId);
        return { id: v.insertId };
      }),
    );
  });
  r.patch("/batches/:id", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins, "zimmadar");
    const batchId = id.parse(Number(q.params.id));
    const d = z
      .object({
        label: text().optional(),
        delivery_mode: z.enum(["group", "one_to_one"]).optional(),
        teacher_id: id.nullable().optional(),
        zimmadar_id: id.nullable().optional(),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const batch = await obj(c, "batches", batchId, true);
        const co = await obj(c, "courses", batch.course_id);
        const dep = await obj(c, "departments", co.department_id);
        checkBranch(u, dep.branch_id);
        if (d.teacher_id) {
          const t = await obj(c, "users", d.teacher_id);
          if (!t.active) fail(400, "Teacher account is inactive");
        }
        if (d.zimmadar_id) {
          const zUser = await obj(c, "users", d.zimmadar_id);
          if (!zUser.active) fail(400, "Zimmadar account is inactive");
        }
        const updates: string[] = [];
        const vals: any[] = [];
        if (d.label !== undefined) {
          updates.push("label=?");
          vals.push(d.label);
        }
        if (d.delivery_mode !== undefined) {
          updates.push("delivery_mode=?");
          vals.push(d.delivery_mode);
        }
        if (d.teacher_id !== undefined) {
          updates.push("teacher_id=?");
          vals.push(d.teacher_id);
        }
        if (d.zimmadar_id !== undefined) {
          updates.push("zimmadar_id=?");
          vals.push(d.zimmadar_id);
        }
        if (updates.length > 0) {
          vals.push(batchId);
          await write(
            c,
            `UPDATE batches SET ${updates.join(",")} WHERE id=?`,
            vals,
          );
        }
        await audit(c, u, "update", "batch", batchId, d);
        return { ok: true, id: batchId };
      }),
    );
  });
  r.get("/enrollments", async (q, s) => {
    const query: ListEnrollmentsQuery = {};
    if (q.query.batch_id) {
      const bId = Number(q.query.batch_id);
      if (Number.isInteger(bId) && bId > 0) query.batch_id = bId;
    }
    if (q.query.student_id) {
      const stId = Number(q.query.student_id);
      if (Number.isInteger(stId) && stId > 0) query.student_id = stId;
    }
    if (typeof q.query.status === "string" && ["active", "completed", "on_hold", "withdrawn", "inactive"].includes(q.query.status.trim())) {
      query.status = q.query.status.trim();
    }
    if (q.query.limit) {
      const lim = Number(q.query.limit);
      if (Number.isInteger(lim) && lim > 0) query.limit = lim;
    }
    s.json(await store.read((c) => enrollments(c, s.locals.user, query)));
  });
  r.post("/enrollments", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        student_id: id,
        batch_id: id,
        start_date: date,
        end_date: date.nullable().optional(),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        return createEnrollment(c, u, d);
      }),
    );
  });
  r.get("/classes", async (q, s) => {
    const query: ListClassesQuery = {};
    if (q.query.batch_id) {
      const bId = Number(q.query.batch_id);
      if (Number.isInteger(bId) && bId > 0) query.batch_id = bId;
    }
    if (typeof q.query.status === "string" && ["scheduled", "in_progress", "ended", "cancelled"].includes(q.query.status.trim())) {
      query.status = q.query.status.trim();
    }
    if (typeof q.query.from === "string" && /^\d{4}-\d{2}-\d{2}/.test(q.query.from.trim())) {
      query.from = q.query.from.trim();
    }
    if (typeof q.query.until === "string" && /^\d{4}-\d{2}-\d{2}/.test(q.query.until.trim())) {
      query.until = q.query.until.trim();
    }
    if (q.query.limit) {
      const lim = Number(q.query.limit);
      if (Number.isInteger(lim) && lim > 0) query.limit = lim;
    }
    s.json(await store.read((c) => classes(c, s.locals.user, false, query)));
  });
  r.post("/classes", async (q, s) => {
    const u = s.locals.user;
    const d = z
      .object({
        batch_id: id,
        scheduled_start: z.string(),
        scheduled_end: z.string(),
        meeting_url: z.url().startsWith("https://").nullable().optional(),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        return scheduleOne(c, u, d);
      }),
    );
  });
  r.get("/summary", async (_q, s) =>
    s.json(
      await store.read(async (c) => {
        const u = s.locals.user,
          st = await students(c, u, {}, true),
          en = await enrollments(c, u, {}, true),
          cl = await classes(c, u, true);
        return {
          students: Number(st[0].total),
          enrollments: Number(en[0].total),
          classes: Number(cl[0].total),
          group_enrollments: Number(en[0].group_enrollments),
          one_to_one_enrollments: Number(en[0].one_to_one_enrollments),
          active_enrollments: Number(en[0].active_enrollments),
        };
      }),
    ),
  );
  r.get("/audit", async (_q, s) => {
    requireRole(s.locals.user, "central_admin");
    s.json(
      await store.read((c) =>
        rows(c, "SELECT * FROM audit_events ORDER BY id DESC LIMIT 100"),
      ),
    );
  });
  return r;
}
