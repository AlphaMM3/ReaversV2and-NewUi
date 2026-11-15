import express, { Router } from "express";
import { z } from "zod";
import { type Store, rows, write, fail, audit } from "./db.js";
import { requireRole, admins } from "./security.js";

const ALLOWED_STORE_KEYS = new Set([
  "iom_rbac_policy_v1",
  "iom_nav_visibility_rules_v1",
  "iom_teacher_leaves_v1",
  "iom_fee_plans_v1",
  "iom_expenses_v1",
  "iom_payroll_settlements_v1",
  "iom_syllabus_milestones_v1",
  "iom_student_milestone_logs_v1",
  "iom_digital_certificates_v1",
  "iom_exit_dropout_reasons_v1",
  "iom_fee_waivers_v1",
  "iom_automation_rules_v1",
  "iom_academy_branding_v1",
  "iom_student_photos_v1",
  "iom_course_tracker_plans_v1",
  "iom_homework_overrides_v1",
  "iom_staff_notices_v1",
]);

export function superAdminStores(store: Store, now = () => new Date()) {
  const r = Router();

  r.get("/super-admin/stores", async (_q, s) => {
    const list = await store.read((c) =>
      rows(c, "SELECT store_key, payload, updated_at FROM super_admin_stores"),
    );
    const out: Record<string, { value: unknown; updated_at: string }> = {};
    for (const row of list) {
      if (!ALLOWED_STORE_KEYS.has(row.store_key)) continue;
      try {
        out[row.store_key] = {
          value: JSON.parse(String(row.payload)),
          updated_at: String(row.updated_at),
        };
      } catch {
        // skip corrupted json
      }
    }
    s.json({ stores: out });
  });

  r.put(
    "/super-admin/stores/:key",
    express.json({ limit: "2mb" }),
    async (q, s) => {
      const key = String(q.params.key || "").trim();
      if (!ALLOWED_STORE_KEYS.has(key)) fail(404, "Unknown configuration key");
      const u = s.locals.user;

      if (key === "iom_rbac_policy_v1" || key === "iom_nav_visibility_rules_v1") {
        requireRole(u, "central_admin");
      } else if (key === "iom_teacher_leaves_v1" || key === "iom_student_photos_v1" || key === "iom_staff_notices_v1") {
        requireRole(u, ...admins, "department_supervisor", "zimmadar", "teacher");
      } else {
        requireRole(u, ...admins, "department_supervisor", "zimmadar");
      }

      const d = z
        .object({
          value: z.unknown(),
        })
        .parse(q.body);

      const serialized = JSON.stringify(d.value);
      if (!serialized || serialized.length > 1_800_000) {
        fail(413, "Configuration payload too large");
      }
      const at = now().toISOString();

      await store.transaction(async (c) => {
        await write(
          c,
          `INSERT INTO super_admin_stores(store_key, payload, updated_by, updated_at)
           VALUES (?,?,?,?)
           ON DUPLICATE KEY UPDATE payload=VALUES(payload), updated_by=VALUES(updated_by), updated_at=VALUES(updated_at)`,
          [key, serialized, u.id, at],
        );
        await audit(c, u, "update_super_admin_store", "super_admin_store", 0, {
          store_key: key,
          bytes: serialized.length,
        });
      });

      s.json({ ok: true, key, updated_at: at });
    },
  );

  return r;
}

