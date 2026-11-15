import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { PoolConnection } from "mysql2/promise";
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
import {
  admins,
  staff,
  requireRole,
  checkBranch,
  hashPassword,
  verifyPassword,
  tokenHash,
} from "./security.js";
import { id } from "./catalog.js";

const password = z.string().min(12).max(256);
export async function claimLogin(store: Store, email: string, at = Date.now()) {
  const bucket = tokenHash("login:" + email.trim().toLowerCase());
  const allowed = await store.transaction(async (c) => {
    await write(
      c,
      "INSERT INTO login_throttles(bucket,attempts,expires_ms) VALUES (?,0,?) ON DUPLICATE KEY UPDATE bucket=bucket",
      [bucket, at + 900000],
    );
    const row = await one(
      c,
      "SELECT attempts,expires_ms FROM login_throttles WHERE bucket=? FOR UPDATE",
      [bucket],
    );
    const n = Number(row!.expires_ms) <= at ? 0 : row!.attempts;
    if (n >= 30) return false;
    await write(
      c,
      "UPDATE login_throttles SET attempts=?,expires_ms=? WHERE bucket=?",
      [n + 1, n === 0 ? at + 900000 : row!.expires_ms, bucket],
    );
    return true;
  });
  if (!allowed) fail(429, "Too many login attempts");
  return bucket;
}
export async function resetPassword(store: Store, body: unknown) {
  const d = z
    .object({ token: z.string().min(40).max(100), password })
    .parse(body);
  const hash = tokenHash(d.token),
    at = new Date().toISOString();
  const found = await store.read((c) =>
    one(c, "SELECT user_id FROM password_reset_tokens WHERE token_hash=?", [
      hash,
    ]),
  );
  if (!found) fail(400, "Reset link is invalid or expired");
  const next = await hashPassword(d.password);
  await store.transaction(async (c) => {
    const user = await obj(c, "users", found.user_id, true);
    const token = await one(
      c,
      "SELECT * FROM password_reset_tokens WHERE token_hash=? FOR UPDATE",
      [hash],
    );
    if (!user.active || !token || token.used_at || token.expires_at <= at)
      fail(400, "Reset link is invalid or expired");
    await write(
      c,
      "UPDATE users SET password_salt=?,password_hash=? WHERE id=?",
      [next.salt, next.hash, user.id],
    );
    await write(
      c,
      "UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL",
      [at, user.id],
    );
    await write(c, "DELETE FROM auth_sessions WHERE user_id=?", [user.id]);
    await audit(c, user, "password_reset", "user", user.id);
  });
}
async function canManage(c: PoolConnection, actor: Row, target: Row) {
  requireRole(actor, ...admins);
  checkBranch(actor, target.branch_id);
  if (
    actor.role === "branch_admin" &&
    (admins.includes(target.role) ||
      Boolean(
        await one(
          c,
          "SELECT id FROM user_role_assignments WHERE user_id=? AND active=1 AND (role IN ('central_admin','branch_admin') OR branch_id<>?) LIMIT 1",
          [target.id, actor.branch_id],
        ),
      ))
  )
    fail(403, "Central Admin required");
}
export function accounts(store: Store) {
  const r = Router();
  r.post("/account/password", async (q, s) => {
    const d = z
        .object({ current_password: z.string().max(256), password })
        .parse(q.body),
      u = s.locals.user;
    const next = await hashPassword(d.password);
    await store.transaction(async (c) => {
      const user = await obj(c, "users", u.id, true);
      if (
        !user.active ||
        !(await verifyPassword(
          d.current_password,
          user.password_salt,
          user.password_hash,
        ))
      )
        fail(400, "Current password is incorrect");
      await write(
        c,
        "UPDATE users SET password_salt=?,password_hash=? WHERE id=?",
        [next.salt, next.hash, u.id],
      );
      await write(c, "DELETE FROM auth_sessions WHERE user_id=?", [u.id]);
      await write(
        c,
        "UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL",
        [new Date().toISOString(), u.id],
      );
      await audit(c, u, "password_changed", "user", u.id);
    });
    s.json({ ok: true, sign_in_required: true });
  });
  r.post("/account/revoke-sessions", async (_q, s) => {
    const u = s.locals.user;
    await store.transaction(async (c) => {
      await obj(c, "users", u.id, true);
      await write(c, "DELETE FROM auth_sessions WHERE user_id=?", [u.id]);
      await audit(c, u, "sessions_revoked", "user", u.id);
    });
    s.json({ ok: true, sign_in_required: true });
  });
  r.post("/users/:id/status", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user,
      d = z
        .object({ active: z.boolean(), expected_active: z.boolean() })
        .parse(q.body);
    if (uid === u.id) fail(409, "Cannot change your own account status");
    await store.transaction(async (c) => {
      // A central admin cannot disable itself; serialize central-state changes too.
      await rows(
        c,
        "SELECT id FROM users WHERE role='central_admin' ORDER BY id FOR UPDATE",
      );
      const target = await obj(c, "users", uid, true);
      await canManage(c, u, target);
      if (Boolean(target.active) !== d.expected_active)
        fail(409, "Account changed; reload Users");
      if (
        !d.active &&
        target.role === "central_admin" &&
        (
          await rows(
            c,
            "SELECT id FROM users WHERE role='central_admin' AND active=1",
          )
        ).length <= 1
      )
        fail(409, "Keep an active Central Admin");
      if (target.active === Number(d.active)) return;
      await write(c, "UPDATE users SET active=? WHERE id=?", [
        Number(d.active),
        uid,
      ]);
      await write(c, "DELETE FROM auth_sessions WHERE user_id=?", [uid]);
      await write(
        c,
        "UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL",
        [new Date().toISOString(), uid],
      );
      await audit(
        c,
        u,
        d.active ? "account_activated" : "account_deactivated",
        "user",
        uid,
      );
    });
    s.json({ ok: true });
  });
  r.post("/users/:id/reset-link", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user,
      token = randomBytes(36).toString("base64url");
    if (uid === u.id) fail(409, "Use Change password for your own account");
    const expires = new Date(Date.now() + 1800000).toISOString();
    await store.transaction(async (c) => {
      const target = await obj(c, "users", uid, true);
      await canManage(c, u, target);
      if (!target.active) fail(409, "Activate the account first");
      const at = new Date().toISOString();
      await write(
        c,
        "UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL",
        [at, uid],
      );
      await write(
        c,
        "INSERT INTO password_reset_tokens VALUES (?,?,?,?,NULL,?)",
        [tokenHash(token), uid, u.id, expires, at],
      );
      await audit(c, u, "reset_link_issued", "user", uid);
    });
    s.json({ token, expires_at: expires });
  });
  r.get("/account/roles", async (_q, s) => {
    const u = s.locals.user;
    s.json({
      base: {
        role: u.base_role,
        branch_id: u.base_branch_id,
        department_id: u.base_department_id,
      },
      active_assignment_id: u.assignment_id || null,
      assignments: await store.read((c) =>
        rows(
          c,
          "SELECT a.id,a.role,a.branch_id,a.department_id,b.name branch_name,d.name department_name FROM user_role_assignments a LEFT JOIN branches b ON b.id=a.branch_id LEFT JOIN departments d ON d.id=a.department_id WHERE a.user_id=? AND a.active=1 ORDER BY a.id",
          [u.id],
        ),
      ),
    });
  });
  r.post("/account/role", async (q, s) => {
    const d = z.object({ assignment_id: id.nullable() }).parse(q.body),
      u = s.locals.user,
      csrf = randomBytes(28).toString("base64url"),
      token = tokenHash(s.locals.token);
    await store.transaction(async (c) => {
      await obj(c, "users", u.id, true);
      if (d.assignment_id) {
        const assignment = await one(
          c,
          "SELECT * FROM user_role_assignments WHERE id=? AND user_id=? AND active=1 FOR UPDATE",
          [d.assignment_id, u.id],
        );
        if (!assignment) fail(403, "Role assignment unavailable");
        await write(
          c,
          "INSERT INTO session_role_bindings VALUES (?,?) ON DUPLICATE KEY UPDATE assignment_id=VALUES(assignment_id)",
          [token, d.assignment_id],
        );
      } else
        await write(c, "DELETE FROM session_role_bindings WHERE token_hash=?", [
          token,
        ]);
      await write(c, "UPDATE auth_sessions SET csrf=? WHERE token_hash=?", [
        csrf,
        token,
      ]);
      await audit(c, u, "role_switched", "user", u.id, {
        assignment_id: d.assignment_id,
      });
    });
    s.json({ ok: true, csrf });
  });
  r.get("/users/:id/roles", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, "central_admin");
    s.json(
      await store.read((c) =>
        rows(
          c,
          "SELECT a.id,a.role,a.branch_id,a.department_id,a.active,b.name branch_name,d.name department_name FROM user_role_assignments a LEFT JOIN branches b ON b.id=a.branch_id LEFT JOIN departments d ON d.id=a.department_id WHERE a.user_id=? ORDER BY a.id",
          [uid],
        ),
      ),
    );
  });
  r.post("/users/:id/roles", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, "central_admin");
    const d = z
      .object({
        role: z.enum([
          "central_admin",
          "branch_admin",
          "teacher",
          "zimmadar",
          "department_supervisor",
        ]),
        branch_id: id.nullable(),
        department_id: id.nullable(),
      })
      .parse(q.body);
    const key = [d.role, d.branch_id || 0, d.department_id || 0].join(":");
    s.json(
      await store.transaction(async (c) => {
        const target = await obj(c, "users", uid, true);
        if (!staff.includes(target.role) || !target.active)
          fail(400, "Active staff account required");
        if (d.role === "central_admin") {
          if (d.branch_id || d.department_id)
            fail(400, "Central role has no local scope");
        } else {
          if (d.role === "branch_admin" && d.department_id)
            fail(400, "Branch Admin uses branch scope");
          if (!d.branch_id) fail(400, "Branch required");
          await obj(c, "branches", d.branch_id);
          const central =
            target.role === "central_admin" ||
            Boolean(
              await one(
                c,
                "SELECT id FROM user_role_assignments WHERE user_id=? AND role='central_admin' AND active=1",
                [uid],
              ),
            );
          if (!central && target.branch_id !== d.branch_id)
            fail(403, "Non-central staff stay in their branch");
          if (target.department_id && d.department_id !== target.department_id)
            fail(403, "Non-central staff stay in their department");
          if (!central && d.department_id) {
            const existingDepartment = await one(
              c,
              "SELECT department_id FROM user_role_assignments WHERE user_id=? AND active=1 AND department_id IS NOT NULL LIMIT 1",
              [uid],
            );
            if (
              existingDepartment &&
              existingDepartment.department_id !== d.department_id
            )
              fail(403, "Non-central staff stay in one department");
          }
          if (d.role === "department_supervisor" && !d.department_id)
            fail(400, "Department required");
          if (d.department_id) {
            const dep = await obj(c, "departments", d.department_id);
            if (dep.branch_id !== d.branch_id)
              fail(400, "Department branch mismatch");
          }
        }
        const prior = await one(
          c,
          "SELECT id,active FROM user_role_assignments WHERE user_id=? AND scope_key=?",
          [uid, key],
        );
        if (prior?.active) return { ok: true, already_assigned: true };
        if (prior)
          await write(
            c,
            "UPDATE user_role_assignments SET active=1 WHERE id=?",
            [prior.id],
          );
        else
          await write(
            c,
            "INSERT INTO user_role_assignments(user_id,role,branch_id,department_id,scope_key,created_at) VALUES (?,?,?,?,?,?)",
            [
              uid,
              d.role,
              d.branch_id,
              d.department_id,
              key,
              new Date().toISOString(),
            ],
          );
        // Reset capabilities issued under a weaker role must not survive elevation.
        await write(
          c,
          "UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL",
          [new Date().toISOString(), uid],
        );
        await audit(c, u, "role_assigned", "user", uid, {
          role: d.role,
          branch_id: d.branch_id,
          department_id: d.department_id,
        });
        return { ok: true };
      }),
    );
  });
  r.post("/users/:id/roles/:assignment_id/revoke", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      aid = id.parse(Number(q.params.assignment_id)),
      u = s.locals.user;
    requireRole(u, "central_admin");
    await store.transaction(async (c) => {
      await obj(c, "users", uid, true);
      const a = await one(
        c,
        "SELECT * FROM user_role_assignments WHERE id=? AND user_id=? FOR UPDATE",
        [aid, uid],
      );
      if (!a) fail(404, "Role assignment not found");
      if (!a.active) return;
      await write(c, "UPDATE user_role_assignments SET active=0 WHERE id=?", [
        aid,
      ]);
      await write(
        c,
        "DELETE s FROM auth_sessions s JOIN session_role_bindings b ON b.token_hash=s.token_hash WHERE b.assignment_id=?",
        [aid],
      );
      await audit(c, u, "role_revoked", "user", uid, { assignment_id: aid });
    });
    s.json({ ok: true });
  });
  return r;
}
