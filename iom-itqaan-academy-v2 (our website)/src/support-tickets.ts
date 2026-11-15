import { Router } from "express";
import { z } from "zod";
import { audit, fail, one, rows, write, type Store, type Row } from "./db.js";
import { requireRole } from "./security.js";

const roles = ["central_admin", "branch_admin", "teacher", "zimmadar", "department_supervisor", "guardian_primary", "guardian_secondary"];
const attachments = z.array(z.object({
  name: z.string().max(255), type: z.string().regex(/^image\/(?:png|jpeg|webp|gif)$/),
  url: z.string().regex(/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/).max(500000),
})).max(3).optional();
const create = z.object({
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
  category: z.string().max(50),
  priority: z.string().max(20),
  target_role: z.enum(["central_admin", "zimmadar"]),
  student_name: z.string().max(200).optional(),
  student_id: z.number().int().positive().optional(),
  attachments,
});
const reply = z.object({ message: z.string().trim().min(1).max(10000), attachments });
const status = z.object({ status: z.enum(["open", "in_progress", "resolved", "closed"]) });

function staffAccess(u: Row, t: Row) {
  if (u.role === "central_admin") return true;
  if (u.branch_id == null || u.branch_id !== t.branch_id) return false;
  if (u.role === "branch_admin") return t.target_role !== "central_admin";
  return ["zimmadar", "department_supervisor"].includes(u.role) &&
    t.target_role === "zimmadar" &&
    (u.department_id == null || u.department_id === t.department_id);
}
const decode = (value: string | object) => typeof value === "string" ? JSON.parse(value) : value;

export function supportTickets(store: Store, now = () => new Date()) {
  const r = Router();
  r.get("/support/tickets", async (_q, s) => {
    const u = s.locals.user;
    requireRole(u, ...roles);
    s.json(await store.read(async (c) => {
      const tickets = await rows(c, "SELECT * FROM support_tickets ORDER BY updated_at DESC, id DESC");
      const result = [];
      for (const t of tickets) {
        if (t.owner_id !== u.id && !staffAccess(u, t)) continue;
        const replies = await rows(c, "SELECT id,payload FROM support_replies WHERE ticket_id=? ORDER BY id", [t.id]);
        result.push({ ...decode(t.payload), id: String(t.id), token: String(t.id), status: t.status,
          target_role: t.target_role, created_at: t.created_at, updated_at: t.updated_at,
          replies: replies.map((m) => ({ ...decode(m.payload), id: String(m.id) })) });
      }
      return result;
    }));
  });
  r.post("/support/tickets", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...roles);
    const d = create.parse(q.body);
    const guardian = u.role.startsWith("guardian");
    const id = await store.transaction(async (c) => {
      let child: Row | null = null;
      if (guardian && d.student_id) {
        child = await one(c, "SELECT st.id,st.full_name,st.branch_id FROM students st JOIN family_guardians fg ON fg.family_id=st.family_id WHERE st.id=? AND fg.user_id=?", [d.student_id, u.id]);
        if (!child) fail(403, "This child is not linked to your account");
      }
      const branch = guardian ? child?.branch_id ?? null : u.branch_id ?? null;
      const at = now().toISOString();
      const result = await write(c, "INSERT INTO support_tickets(owner_id,branch_id,department_id,target_role,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?)", [
        u.id, branch, guardian ? null : u.department_id ?? null, d.target_role,
        JSON.stringify({ ...d, student_name: guardian ? child?.full_name : d.student_name, kind: u.role === "teacher" ? "teacher_escalation" : "guardian_ticket",
          created_by_id: u.id, created_by_name: u.name, created_by_role: u.role }), at, at,
      ]);
      await audit(c, u, "create_support_ticket", "support_ticket", result.insertId, {});
      return String(result.insertId);
    });
    s.status(201).json({ id, token: id });
  });
  r.post("/support/tickets/:id/:action", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...roles);
    const id = z.coerce.number().int().positive().parse(q.params.id);
    const action = z.enum(["reply", "status"]).parse(q.params.action);
    await store.transaction(async (c) => {
      const t = await one(c, "SELECT * FROM support_tickets WHERE id=? FOR UPDATE", [id]);
      if (!t || (t.owner_id !== u.id && !staffAccess(u, t))) fail(404, "Ticket not found");
      const at = now().toISOString();
      if (action === "reply") {
        const d = reply.parse(q.body);
        if (t.status === "closed") fail(409, "Ticket is closed");
        await write(c, "INSERT INTO support_replies(ticket_id,payload) VALUES(?,?)", [id, JSON.stringify({
          ...d, author_name: u.name, author_role: u.role, created_at: at,
        })]);
      } else {
        if (!staffAccess(u, t)) fail(403, "Only responsible staff can change status");
        await write(c, "UPDATE support_tickets SET status=? WHERE id=?", [status.parse(q.body).status, id]);
      }
      await write(c, "UPDATE support_tickets SET updated_at=? WHERE id=?", [at, id]);
      await audit(c, u, action + "_support_ticket", "support_ticket", id, {});
    });
    s.json({ ok: true });
  });
  return r;
}
