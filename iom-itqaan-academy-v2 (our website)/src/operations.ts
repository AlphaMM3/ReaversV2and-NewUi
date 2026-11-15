import { Router } from "express";
import { z } from "zod";
import { type Store, rows, write, audit } from "./db.js";
import { requireRole, admins } from "./security.js";
import { students } from "./catalog.js";
export async function cleanupAccounts(store: Store, at = new Date()) {
  return store.transaction(async (c) => ({
    sessions: (
      await write(
        c,
        "DELETE FROM auth_sessions WHERE expires_at<=? LIMIT 1000",
        [at.toISOString()],
      )
    ).affectedRows,
    reset_tokens: (
      await write(
        c,
        "DELETE FROM password_reset_tokens WHERE expires_at<=? LIMIT 1000",
        [at.toISOString()],
      )
    ).affectedRows,
    throttles: (
      await write(
        c,
        "DELETE FROM login_throttles WHERE expires_ms<=? LIMIT 1000",
        [+at],
      )
    ).affectedRows,
  }));
}
export function csvCell(value: unknown) {
  let v = String(value ?? "");
  if (/^[\s]*[=+@\-]/.test(v) || /^[\t\r]/.test(v)) v = "'" + v;
  return '"' + v.replaceAll('"', '""') + '"';
}
export function operations(store: Store) {
  const r = Router();
  r.get("/audit/events/:id", async (q, s) => {
    requireRole(s.locals.user, "central_admin");
    const uid = z.coerce.number().int().positive().parse(q.params.id);
    const event = await store.read((c) =>
      rows(
        c,
        "SELECT id,at,actor_id,action,entity,entity_id,details FROM audit_events WHERE id=?",
        [uid],
      ),
    );
    if (!event.length) {
      s.status(404).json({ detail: "Audit event not found" });
      return;
    }
    s.json(event[0]);
  });
  r.get("/audit/page", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin");
    const before =
      q.query.before === undefined
        ? Number.MAX_SAFE_INTEGER
        : z.coerce.number().int().positive().parse(q.query.before);
    const limit =
      q.query.limit === undefined
        ? 50
        : z.coerce.number().int().min(1).max(100).parse(q.query.limit);
    const data = await store.read((c) =>
      rows(
        c,
        "SELECT id,at,actor_id,action,entity,entity_id FROM audit_events WHERE id<? ORDER BY id DESC LIMIT " +
          (limit + 1),
        [before],
      ),
    );
    s.json({
      items: data.slice(0, limit),
      next_before: data.length > limit ? data[limit - 1].id : null,
    });
  });
  r.get("/exports/students.csv", async (_q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const data = await store.transaction(async (c) => {
      const list = await students(c, u);
      await audit(c, u, "export", "student", 0, { count: list.length });
      return list;
    });
    const fields = ["id", "full_name", "family_id", "branch_id"];
    s.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="students.csv"',
      "Cache-Control": "no-store",
    });
    s.send(
      "\uFEFF" +
        [
          fields.map(csvCell).join(","),
          ...data.map((row) => fields.map((k) => csvCell(row[k])).join(",")),
        ].join("\r\n"),
    );
  });
  return r;
}
