import { Router } from "express";
import { z } from "zod";
import { type Store, one, rows, obj, write, fail, audit } from "./db.js";
import { admins, requireRole, checkBranch } from "./security.js";
export async function reportTemplate(
  c: any,
  course: number,
  reportId?: number,
) {
  if (reportId) {
    const bound = await one(
      c,
      "SELECT t.id,t.version,t.prompt FROM report_template_bindings b JOIN course_report_templates t ON t.id=b.template_id WHERE b.report_id=?",
      [reportId],
    );
    return bound;
  }
  return one(
    c,
    "SELECT id,version,prompt FROM course_report_templates WHERE course_id=? ORDER BY version DESC LIMIT 1",
    [course],
  );
}
export function reportTemplates(store: Store) {
  const r = Router();
  r.get("/courses/:id/report-templates", async (q, s) => {
    const uid = z.coerce.number().int().positive().parse(q.params.id),
      u = s.locals.user;
    requireRole(u, ...admins);
    s.json(
      await store.read(async (c) => {
        const co = await obj(c, "courses", uid),
          dep = await obj(c, "departments", co.department_id);
        checkBranch(u, dep.branch_id);
        return rows(
          c,
          "SELECT id,version,prompt,created_at FROM course_report_templates WHERE course_id=? ORDER BY version DESC",
          [uid],
        );
      }),
    );
  });
  r.post("/courses/:id/report-templates", async (q, s) => {
    const uid = z.coerce.number().int().positive().parse(q.params.id),
      u = s.locals.user;
    requireRole(u, ...admins);
    const d = z
      .object({
        prompt: z.string().trim().min(1).max(8000),
        expected_version: z.number().int().nonnegative(),
      })
      .parse(q.body);
    s.json(
      await store.transaction(async (c) => {
        const co = await obj(c, "courses", uid, true),
          dep = await obj(c, "departments", co.department_id);
        checkBranch(u, dep.branch_id);
        const prior = await reportTemplate(c, uid);
        if ((prior?.version || 0) !== d.expected_version)
          fail(409, "Template changed; reload");
        const version = (prior?.version || 0) + 1,
          v = await write(
            c,
            "INSERT INTO course_report_templates(course_id,version,prompt,created_by,created_at) VALUES (?,?,?,?,?)",
            [uid, version, d.prompt, u.id, new Date().toISOString()],
          );
        await audit(c, u, "template_version", "course", uid, { version });
        return { id: v.insertId, version };
      }),
    );
  });
  return r;
}
