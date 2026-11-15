import {
  randomBytes,
  createHash,
  timingSafeEqual,
  pbkdf2 as derive,
} from "node:crypto";
import { promisify } from "node:util";
import type { PoolConnection } from "mysql2/promise";
import { one, write, fail, type Row } from "./db.js";
const pbkdf2 = promisify(derive);
export const admins = ["central_admin", "branch_admin"];
export const staff = [
  ...admins,
  "teacher",
  "zimmadar",
  "department_supervisor",
];
export const roles = [...staff, "guardian_primary", "guardian_secondary"];
export const cookieName = "academy_session";
export const tokenHash = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
export async function hashPassword(
  password: string,
  salt = randomBytes(16).toString("hex"),
) {
  if (password.length < 12 || password.length > 256)
    throw new Error("Password length must be 12–256");
  return {
    salt,
    hash: (
      await pbkdf2(password, Buffer.from(salt, "hex"), 400000, 32, "sha256")
    ).toString("hex"),
  };
}
export async function verifyPassword(
  password: string,
  salt: string,
  hash: string,
) {
  const h = (
    await pbkdf2(password, Buffer.from(salt, "hex"), 400000, 32, "sha256")
  ).toString("hex");
  return safeEqual(h, hash);
}
export async function createSession(c: PoolConnection, id: number) {
  const token = randomBytes(36).toString("base64url"),
    csrf = randomBytes(28).toString("base64url");
  await write(
    c,
    "INSERT INTO auth_sessions(token_hash,user_id,csrf,expires_at) VALUES (?,?,?,?)",
    [tokenHash(token), id, csrf, new Date(Date.now() + 43200000).toISOString()],
  );
  return { token, csrf };
}
export async function sessionUser(c: PoolConnection, token: string) {
  const u = await one(
    c,
    "SELECT u.*,s.csrf,sr.assignment_id,ar.role assigned_role,ar.branch_id assigned_branch,ar.department_id assigned_department FROM auth_sessions s JOIN users u ON u.id=s.user_id LEFT JOIN session_role_bindings sr ON sr.token_hash=s.token_hash LEFT JOIN user_role_assignments ar ON ar.id=sr.assignment_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1 AND (sr.token_hash IS NULL OR (ar.active=1 AND ar.user_id=u.id))",
    [tokenHash(token), new Date().toISOString()],
  );
  if (!u) return null;
  u.base_role = u.role;
  u.base_branch_id = u.branch_id;
  u.base_department_id = u.department_id;
  if (u.assignment_id) {
    u.role = u.assigned_role;
    u.branch_id = u.assigned_branch;
    u.department_id = u.assigned_department;
  }
  return u;
}
export function requireRole(u: Row, ...allowed: string[]) {
  if (!allowed.includes(u.role)) fail(403, "Permission denied");
}
export function checkBranch(u: Row, branch: number) {
  if (
    u.role !== "central_admin" &&
    (!staff.includes(u.role) || u.branch_id !== branch)
  )
    fail(403, "Outside your branch scope");
}
export function checkDepartment(u: Row, department: number) {
  if (
    u.role !== "central_admin" &&
    u.department_id &&
    u.department_id !== department
  )
    fail(403, "Outside your department scope");
}
export async function batchScope(
  c: PoolConnection,
  id: number,
  u: Row,
  mode = "read",
) {
  const b =
    (await one(
      c,
      "SELECT b.*,d.branch_id,c.department_id,c.title course_title,c.start_date course_start_date,c.end_date course_end_date FROM batches b JOIN courses c ON b.course_id=c.id JOIN departments d ON c.department_id=d.id WHERE b.id=?",
      [id],
    )) || fail(404, "Batch not found");
  if (u.role === "central_admin") return b;
  checkDepartment(u, b.department_id);
  if (staff.includes(u.role) && u.branch_id !== b.branch_id)
    fail(403, "Out of branch");
  if (["admin", "manage", "read", "teach"].includes(mode) && admins.includes(u.role))
    return b;
  if (
    mode === "read" &&
    u.role === "department_supervisor" &&
    u.department_id === b.department_id
  )
    return b;
  if (
    ["manage", "read"].includes(mode) &&
    u.role === "zimmadar" &&
    b.zimmadar_id === u.id
  )
    return b;
  if (
    ["teach", "read"].includes(mode) &&
    u.role === "teacher" &&
    b.teacher_id === u.id
  )
    return b;
  if (
    mode === "read" &&
    u.role.startsWith("guardian") &&
    (await one(
      c,
      "SELECT 1 FROM enrollments e JOIN students s ON s.id=e.student_id JOIN family_guardians fg ON fg.family_id=s.family_id WHERE e.batch_id=? AND fg.user_id=? LIMIT 1",
      [id, u.id],
    ))
  )
    return b;
  return fail(403, "No batch access");
}
export async function classScope(
  c: PoolConnection,
  id: number,
  u: Row,
  mode = "read",
  lock = false,
) {
  const s = await (await import("./db.js")).obj(c, "class_sessions", id, lock);
  // A session records its actual teacher independently of later batch assignments.
  if (u.role === "teacher" && s.actual_teacher_id === u.id) {
    const b = await one(
      c,
      "SELECT b.*,d.branch_id,co.department_id FROM batches b JOIN courses co ON co.id=b.course_id JOIN departments d ON d.id=co.department_id WHERE b.id=?",
      [s.batch_id],
    );
    if (!b) fail(404, "Batch not found");
    checkBranch(u, b.branch_id);
    checkDepartment(u, b.department_id);
    if (mode === "read" || mode === "teach") return { s, b };
  }
  const b = await batchScope(
    c,
    s.batch_id,
    u,
    mode === "manage" ? "manage" : "read",
  );
  if (
    mode === "teach" &&
    !(u.role === "teacher" && (s.actual_teacher_id || b.teacher_id) === u.id)
  )
    fail(403, "Assigned teacher only");
  return { s, b };
}
