import express, { Router } from "express";
import { z } from "zod";
import { type Store, rows, one, write, fail, audit, obj } from "./db.js";
import { requireRole, admins, batchScope } from "./security.js";
import { parseLocal, bd } from "./policy.js";

const idSchema = z.coerce.number().int().positive();

export interface WebhookAutomationConfig {
  enabled: boolean;
  lead_minutes: number;
  telegram_bot_token?: string;
  telegram_default_chat_id?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_access_token?: string;
  whatsapp_default_recipient?: string;
  custom_webhook_url?: string;
  custom_webhook_secret?: string;
  updated_at?: string;
}

const DEFAULT_WEBHOOK_CONFIG: WebhookAutomationConfig = {
  enabled: true,
  lead_minutes: 15,
  telegram_bot_token: "",
  telegram_default_chat_id: "",
  whatsapp_phone_number_id: "",
  whatsapp_access_token: "",
  whatsapp_default_recipient: "",
  custom_webhook_url: "",
  custom_webhook_secret: "",
};

async function readStoreValue<T>(store: Store, key: string, fallback: T): Promise<T> {
  const row = await store.read((c) =>
    one(c, "SELECT payload FROM super_admin_stores WHERE store_key = ?", [key]),
  );
  if (!row?.payload) return fallback;
  try {
    return JSON.parse(String(row.payload)) as T;
  } catch {
    return fallback;
  }
}

async function readWebhookConfig(store: Store): Promise<WebhookAutomationConfig> {
  const stored = await readStoreValue<Partial<WebhookAutomationConfig>>(
    store,
    "iom_webhook_automation_v1",
    {},
  );
  return {
    ...DEFAULT_WEBHOOK_CONFIG,
    ...stored,
    telegram_bot_token:
      stored.telegram_bot_token || process.env.ACADEMY_TELEGRAM_BOT_TOKEN || "",
    whatsapp_phone_number_id:
      stored.whatsapp_phone_number_id || process.env.ACADEMY_WHATSAPP_PHONE_ID || "",
    whatsapp_access_token:
      stored.whatsapp_access_token || process.env.ACADEMY_WHATSAPP_TOKEN || "",
    custom_webhook_url:
      stored.custom_webhook_url || process.env.ACADEMY_CUSTOM_WEBHOOK_URL || "",
  };
}

function maskSecret(val?: string): string {
  const v = (val || "").trim();
  if (!v) return "";
  if (v.length <= 6) return "******";
  return "****" + v.slice(-4);
}

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let cycleRunning = false;
let lastCycleAt: string | null = null;
let lastCycleSummary: {
  scanned_classes: number;
  sent_count: number;
  skipped_count: number;
} | null = null;

async function dispatchExternalMessage(
  cfg: WebhookAutomationConfig,
  channel: string,
  target: string,
  text: string,
): Promise<{ status: string; http_status: number | null; error_text: string | null }> {
  try {
    if (channel === "telegram" && cfg.telegram_bot_token && target) {
      const url = `https://api.telegram.org/bot${cfg.telegram_bot_token.trim()}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: target,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: false,
        }),
      });
      return {
        status: res.ok ? "sent" : "failed",
        http_status: res.status,
        error_text: res.ok ? null : `Telegram HTTP ${res.status}`,
      };
    }

    if (
      channel === "whatsapp" &&
      cfg.whatsapp_access_token &&
      cfg.whatsapp_phone_number_id &&
      target
    ) {
      const cleanTo = target.replace(/[^0-9]/g, "");
      const url = `https://graph.facebook.com/v19.0/${cfg.whatsapp_phone_number_id.trim()}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.whatsapp_access_token.trim()}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanTo,
          type: "text",
          text: { body: text },
        }),
      });
      return {
        status: res.ok ? "sent" : "failed",
        http_status: res.status,
        error_text: res.ok ? null : `WhatsApp Cloud HTTP ${res.status}`,
      };
    }

    if (cfg.custom_webhook_url) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (cfg.custom_webhook_secret) {
        headers["X-Academy-Webhook-Secret"] = cfg.custom_webhook_secret;
      }
      const res = await fetch(cfg.custom_webhook_url.trim(), {
        method: "POST",
        headers,
        body: JSON.stringify({ channel, target, message: text }),
      });
      return {
        status: res.ok ? "sent" : "failed",
        http_status: res.status,
        error_text: res.ok ? null : `Webhook HTTP ${res.status}`,
      };
    }

    // Fallback: recorded in auto_reminder_dispatches ledger ready for local copy/external worker
    return {
      status: "queued_local",
      http_status: null,
      error_text: null,
    };
  } catch (err: any) {
    return {
      status: "failed",
      http_status: null,
      error_text: String(err?.message || err || "Dispatch failed").slice(0, 450),
    };
  }
}

function renderTemplate(tpl: string, vars: Record<string, string>): string {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v);
  }
  return out;
}

export async function runAutoReminderCycle(
  store: Store,
  now = () => new Date(),
  options: { forceDryPreview?: boolean } = {},
) {
  const cfg = await readWebhookConfig(store);
  const currentTime = now();
  const leadMinutes = Math.max(5, Math.min(60, Number(cfg.lead_minutes) || 15));

  const rules = await readStoreValue<any[]>(store, "iom_automation_rules_v1", []);
  const activeClassRule =
    rules.find(
      (r) =>
        r.enabled &&
        (r.trigger === "before_class_15m" ||
          r.id === "rule_class_15m" ||
          r.id === "rule-class-15m" ||
          String(r.title || "").toLowerCase().includes("15 min")),
    ) || null;

  const classes = await store.read((c) =>
    rows(
      c,
      `SELECT cs.id, cs.scheduled_start, cs.scheduled_end, cs.meeting_url, cs.status,
              b.label AS batch_name, co.title AS course_title,
              u.name AS teacher_name
       FROM class_sessions cs
       JOIN batches b ON b.id = cs.batch_id
       JOIN courses co ON co.id = b.course_id
       LEFT JOIN users u ON u.id = COALESCE(cs.actual_teacher_id, b.teacher_id)
       WHERE cs.status IN ('scheduled', 'rescheduled', 'in_progress')
       ORDER BY cs.scheduled_start ASC
       LIMIT 120`,
    ),
  );

  let sentCount = 0;
  let skippedCount = 0;
  const recentDispatches: any[] = [];

  for (const cls of classes) {
    let startMs: number;
    try {
      startMs = +parseLocal(String(cls.scheduled_start));
    } catch {
      continue;
    }
    const diffMins = (startMs - +currentTime) / 60000;
    const isWindowMatch =
      diffMins >= -2 && diffMins <= leadMinutes;
    if (!isWindowMatch && !options.forceDryPreview) continue;
    if (options.forceDryPreview && recentDispatches.length >= 3) break;

    const dispatchKey = options.forceDryPreview
      ? `manual_class_${cls.id}_${currentTime.toISOString().slice(0, 16)}`
      : `class15m_${cls.id}`;

    const existing = await store.read((c) =>
      one(c, "SELECT id FROM auto_reminder_dispatches WHERE dispatch_key = ?", [dispatchKey]),
    );
    if (existing) {
      skippedCount++;
      continue;
    }

    const templateStr =
      activeClassRule?.template_bn ||
      activeClassRule?.template ||
      "আসসালামু আলাইকুম! {course_title} ({batch_name})-এর ক্লাস {time} এ শুরু হবে। টিচার: {teacher}। লিংক: {meeting_url}";
    const dhakaStart = bd(new Date(startMs)).slice(11, 16);
    const body = renderTemplate(templateStr, {
      student: cls.batch_name || "Learner",
      student_name: cls.batch_name || "Learner",
      course: cls.course_title || "Class",
      course_title: cls.course_title || "Class",
      batch: cls.batch_name || "Batch",
      batch_name: cls.batch_name || "Batch",
      teacher: cls.teacher_name || "Ustad",
      time: dhakaStart + " (BDT)",
      meeting_url: cls.meeting_url || "Dashboard > Live Classes",
      amount: "0",
      amount_due: "0",
      month: currentTime.toISOString().slice(0, 7),
      billing_month: currentTime.toISOString().slice(0, 7),
    });

    const ruleChan = String(activeClassRule?.channel || "").toLowerCase();
    const channel =
      ruleChan.includes("telegram") && !ruleChan.includes("whatsapp")
        ? "telegram"
        : ruleChan.includes("whatsapp") && !ruleChan.includes("telegram")
          ? "whatsapp"
          : cfg.whatsapp_access_token
            ? "whatsapp"
            : "telegram";
    const target =
      channel === "telegram"
        ? String(cfg.telegram_default_chat_id || "academy-telegram-channel")
        : String(cfg.whatsapp_default_recipient || "academy-whatsapp-group");

    const res =
      cfg.enabled || options.forceDryPreview
        ? await dispatchExternalMessage(cfg, channel, target, body)
        : { status: "paused", http_status: null, error_text: "Scheduler paused" };

    const at = currentTime.toISOString();
    await store.transaction((c) =>
      write(
        c,
        `INSERT INTO auto_reminder_dispatches(dispatch_key, rule_id, channel, target, message_body, status, http_status, error_text, sent_at)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE status=VALUES(status)`,
        [
          dispatchKey,
          String(activeClassRule?.id || "rule_class_15m"),
          channel,
          target.slice(0, 180),
          body,
          res.status,
          res.http_status,
          res.error_text,
          at,
        ],
      ),
    );
    sentCount++;
    recentDispatches.push({
      dispatch_key: dispatchKey,
      channel,
      target,
      status: res.status,
      sent_at: at,
      message_body: body,
    });
  }

  lastCycleAt = currentTime.toISOString();
  lastCycleSummary = {
    scanned_classes: classes.length,
    sent_count: sentCount,
    skipped_count: skippedCount,
  };

  return {
    scanned_classes: classes.length,
    sent_count: sentCount,
    skipped_count: skippedCount,
    dispatches: recentDispatches,
    checked_at: lastCycleAt,
  };
}

export function startAutoReminderScheduler(store: Store, now = () => new Date()) {
  if (schedulerTimer) return;
  const tick = async () => {
    if (cycleRunning) return;
    cycleRunning = true;
    try {
      await runAutoReminderCycle(store, now);
    } catch {
      // keep background scheduler resilient across transient DB state
    } finally {
      cycleRunning = false;
    }
  };
  schedulerTimer = setInterval(() => {
    void tick();
  }, 60_000);
  schedulerTimer.unref?.();
}

export function publicSanadRouter(store: Store) {
  const r = Router();
  r.get("/public/verify-sanad/:code", async (q, s) => {
    const code = decodeURIComponent(String(q.params.code || "")).trim().toUpperCase();
    if (!code || code.length < 4) {
      s.status(400).json({ detail: "Invalid certificate verification code" });
      return;
    }

    const certs = await readStoreValue<any[]>(store, "iom_digital_certificates_v1", []);
    const branding = await readStoreValue<any>(store, "iom_academy_branding_v1", {
      academy_name: "IOM & Itqaan Academy",
      tagline: "Online Qur'an & Islamic Studies Institute",
      principal_name: "Principal & Muhtamim",
      principal_title: "Principal, IOM & Itqaan Academy",
      contact_phone: "+880 1700-000000",
    });
    const photos = await readStoreValue<Record<string, string>>(
      store,
      "iom_student_photos_v1",
      {},
    );

    const found = certs.find(
      (c) => String(c.verification_code || "").trim().toUpperCase() === code,
    );

    const normalizedBranding = {
      academyName: branding.academyName || branding.academy_name || "IOM Itqaan Academy",
      tagline: branding.tagline || "Online Islamic & Quranic Excellence",
      principalName: branding.principalName || branding.principal_name || "Principal / Muhtamim",
      principalTitle:
        branding.principalTitle || branding.principal_title || "Principal & Central Academic Director",
    };

    if (!found) {
      s.json({
        valid: false,
        code,
        branding: normalizedBranding,
      });
      return;
    }

    s.json({
      valid: true,
      code,
      certificate: {
        id: found.id,
        student_id: found.student_id,
        student_name: found.student_name,
        course_title: found.course_title,
        batch_name: found.batch_name || "",
        grade_label: found.grade_label || found.grade_or_honors || "Completed",
        issue_date: found.issue_date || (found.issued_at ? String(found.issued_at).slice(0, 10) : ""),
        remarks: found.remarks || "",
        verification_code: found.verification_code,
        issued_by: found.issued_by || found.issued_by_name || "Principal",
      },
      photo_data_url: photos[String(found.student_id)] || null,
      branding: normalizedBranding,
    });
  });
  return r;
}

export function autoRemindersAndProofs(store: Store, now = () => new Date()) {
  const r = Router();

  // 1. Automation Scheduler Status, Webhook Configuration & Dispatch Log
  r.get("/automation/status", async (_q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins, "department_supervisor", "zimmadar");
    const cfg = await readWebhookConfig(store);
    const logs = await store.read((c) =>
      rows(
        c,
        "SELECT id, dispatch_key, rule_id, channel, target, message_body, status, http_status, error_text, sent_at FROM auto_reminder_dispatches ORDER BY id DESC LIMIT 40",
      ),
    );
    s.json({
      scheduler_active: Boolean(schedulerTimer),
      poll_interval_seconds: 60,
      last_cycle_at: lastCycleAt,
      last_cycle_summary: lastCycleSummary,
      config: {
        enabled: cfg.enabled,
        lead_minutes: cfg.lead_minutes,
        telegram_default_chat_id: cfg.telegram_default_chat_id || "",
        whatsapp_phone_number_id: cfg.whatsapp_phone_number_id || "",
        whatsapp_default_recipient: cfg.whatsapp_default_recipient || "",
        custom_webhook_url: cfg.custom_webhook_url || "",
        has_telegram_token: Boolean(cfg.telegram_bot_token),
        telegram_token_masked: maskSecret(cfg.telegram_bot_token),
        has_whatsapp_token: Boolean(cfg.whatsapp_access_token),
        whatsapp_token_masked: maskSecret(cfg.whatsapp_access_token),
        has_custom_secret: Boolean(cfg.custom_webhook_secret),
      },
      dispatches: logs,
    });
  });

  r.put("/automation/config", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins);
    const parsed = z
      .object({
        enabled: z.boolean().optional(),
        lead_minutes: z.coerce.number().int().min(5).max(60).optional(),
        telegram_bot_token: z.string().max(240).optional(),
        telegram_default_chat_id: z.string().max(120).optional(),
        whatsapp_phone_number_id: z.string().max(120).optional(),
        whatsapp_access_token: z.string().max(400).optional(),
        whatsapp_default_recipient: z.string().max(60).optional(),
        custom_webhook_url: z.string().max(300).optional(),
        custom_webhook_secret: z.string().max(120).optional(),
      })
      .parse(q.body || {});

    const current = await readStoreValue<Partial<WebhookAutomationConfig>>(
      store,
      "iom_webhook_automation_v1",
      {},
    );
    const at = now().toISOString();
    const nextCfg: WebhookAutomationConfig = {
      ...DEFAULT_WEBHOOK_CONFIG,
      ...current,
      enabled: parsed.enabled ?? current.enabled ?? true,
      lead_minutes: parsed.lead_minutes ?? current.lead_minutes ?? 15,
      telegram_default_chat_id:
        parsed.telegram_default_chat_id ?? current.telegram_default_chat_id ?? "",
      whatsapp_phone_number_id:
        parsed.whatsapp_phone_number_id ?? current.whatsapp_phone_number_id ?? "",
      whatsapp_default_recipient:
        parsed.whatsapp_default_recipient ?? current.whatsapp_default_recipient ?? "",
      custom_webhook_url: parsed.custom_webhook_url ?? current.custom_webhook_url ?? "",
      telegram_bot_token:
        parsed.telegram_bot_token && !parsed.telegram_bot_token.startsWith("****")
          ? parsed.telegram_bot_token.trim()
          : parsed.telegram_bot_token === ""
            ? ""
            : current.telegram_bot_token || "",
      whatsapp_access_token:
        parsed.whatsapp_access_token && !parsed.whatsapp_access_token.startsWith("****")
          ? parsed.whatsapp_access_token.trim()
          : parsed.whatsapp_access_token === ""
            ? ""
            : current.whatsapp_access_token || "",
      custom_webhook_secret:
        parsed.custom_webhook_secret && !parsed.custom_webhook_secret.startsWith("****")
          ? parsed.custom_webhook_secret.trim()
          : parsed.custom_webhook_secret === ""
            ? ""
            : current.custom_webhook_secret || "",
      updated_at: at,
    };

    const payload = JSON.stringify(nextCfg);
    await store.transaction(async (c) => {
      await write(
        c,
        `INSERT INTO super_admin_stores(store_key, payload, updated_by, updated_at)
         VALUES ('iom_webhook_automation_v1', ?, ?, ?)
         ON DUPLICATE KEY UPDATE payload=VALUES(payload), updated_by=VALUES(updated_by), updated_at=VALUES(updated_at)`,
        [payload, u.id, at],
      );
      await audit(c, u, "update_webhook_config", "super_admin_store", 0, {
        enabled: nextCfg.enabled,
        lead_minutes: nextCfg.lead_minutes,
      });
    });

    s.json({ ok: true, updated_at: at });
  });

  r.post("/automation/run-now", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, ...admins, "department_supervisor");
    const forceDryPreview = Boolean(q.body?.force_preview);
    const result = await runAutoReminderCycle(store, now, { forceDryPreview });
    s.json(result);
  });

  // 2. Guardian bKash / Nagad Screenshot & TrxID Self-Submit Portal
  r.get("/guardian/payment-submissions", async (q, s) => {
    const u = s.locals.user;
    requireRole(
      u,
      "central_admin",
      "branch_admin",
      "guardian_primary",
      "guardian_secondary",
    );
    const statusFilter = q.query.status ? String(q.query.status).trim() : undefined;

    const list = await store.read(async (c) => {
      let sql = `
        SELECT gps.*,
               inv.invoice_number, inv.billing_month, inv.amount_due, inv.amount_paid, inv.status AS invoice_status,
               st.full_name AS student_name, st.family_id,
               co.title AS course_title, b.label AS batch_name, d.branch_id,
               usr.name AS submitter_name, usr.email AS submitter_email
        FROM guardian_payment_submissions gps
        JOIN tuition_invoices inv ON inv.id = gps.invoice_id
        JOIN enrollments e ON e.id = inv.enrollment_id
        JOIN students st ON st.id = e.student_id
        JOIN batches b ON b.id = e.batch_id
        JOIN courses co ON co.id = b.course_id
        JOIN departments d ON d.id = co.department_id
        LEFT JOIN users usr ON usr.id = gps.submitted_by
        WHERE 1=1
      `;
      const params: any[] = [];
      if (statusFilter) {
        sql += " AND gps.status = ?";
        params.push(statusFilter);
      }
      if (u.role.startsWith("guardian")) {
        sql +=
          " AND (gps.submitted_by = ? OR st.family_id IN (SELECT family_id FROM family_guardians WHERE user_id = ?))";
        params.push(u.id, u.id);
      } else if (u.role === "branch_admin") {
        sql += " AND d.branch_id = ?";
        params.push(u.branch_id);
      }
      sql += " ORDER BY gps.id DESC LIMIT 100";
      return rows(c, sql, params);
    });
    s.json(list);
  });

  r.post(
    "/guardian/payment-submissions",
    express.json({ limit: "2mb" }),
    async (q, s) => {
      const u = s.locals.user;
      requireRole(
        u,
        "guardian_primary",
        "guardian_secondary",
        "central_admin",
        "branch_admin",
      );
      const parsed = z
        .object({
          invoice_id: idSchema,
          payment_method: z.enum(["bKash", "Nagad", "Rocket", "Bank"]),
          trx_id: z.string().trim().min(4).max(80),
          amount: z.coerce.number().positive(),
          sender_number: z.string().trim().max(30).optional(),
          screenshot_data: z.string().max(1_400_000).optional(),
          notes: z.string().trim().max(500).optional(),
        })
        .parse(q.body);

      if (
        parsed.screenshot_data &&
        !/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(
          parsed.screenshot_data,
        )
      ) {
        fail(400, "Screenshot must be a valid base64 PNG/JPEG/WebP image");
      }

      const result = await store.transaction(async (c) => {
        const inv = await one(
          c,
          `SELECT inv.*, e.student_id, st.family_id, d.branch_id
           FROM tuition_invoices inv
           JOIN enrollments e ON e.id = inv.enrollment_id
           JOIN students st ON st.id = e.student_id
           JOIN batches b ON b.id = e.batch_id
           JOIN courses co ON co.id = b.course_id
           JOIN departments d ON d.id = co.department_id
           WHERE inv.id = ?`,
          [parsed.invoice_id],
        );
        if (!inv) fail(404, "Tuition invoice not found");

        if (u.role.startsWith("guardian")) {
          const link = await one(
            c,
            "SELECT 1 ok FROM family_guardians WHERE user_id = ? AND family_id = ?",
            [u.id, inv.family_id],
          );
          if (!link) fail(403, "Invoice belongs to a different family");
        } else if (u.role === "branch_admin" && inv.branch_id !== u.branch_id) {
          fail(403, "Branch scope mismatch");
        }

        const at = now().toISOString();
        const ins = await write(
          c,
          `INSERT INTO guardian_payment_submissions(
            invoice_id, student_id, submitted_by, payment_method, trx_id, amount,
            sender_number, screenshot_data, notes, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
          [
            parsed.invoice_id,
            inv.student_id,
            u.id,
            parsed.payment_method,
            parsed.trx_id.toUpperCase(),
            parsed.amount,
            parsed.sender_number || null,
            parsed.screenshot_data || null,
            parsed.notes || null,
            at,
          ],
        );

        await audit(c, u, "submit_guardian_payment_proof", "guardian_payment_submissions", ins.insertId, {
          invoice_id: parsed.invoice_id,
          payment_method: parsed.payment_method,
          trx_id: parsed.trx_id.toUpperCase(),
          amount: parsed.amount,
        });

        return {
          id: ins.insertId,
          invoice_id: parsed.invoice_id,
          trx_id: parsed.trx_id.toUpperCase(),
          status: "pending",
          created_at: at,
        };
      });

      s.status(201).json(result);
    },
  );

  r.post("/guardian/payment-submissions/:id/review", async (q, s) => {
    const u = s.locals.user;
    requireRole(u, "central_admin", "branch_admin");
    const subId = idSchema.parse(q.params.id);
    const parsed = z
      .object({
        action: z.enum(["approve", "reject"]),
        review_note: z.string().trim().max(500).optional(),
      })
      .parse(q.body);

    const result = await store.transaction(async (c) => {
      const sub = await one(
        c,
        "SELECT * FROM guardian_payment_submissions WHERE id = ? FOR UPDATE",
        [subId],
      );
      if (!sub) fail(404, "Payment submission not found");
      if (sub.status !== "pending") fail(409, "Submission has already been reviewed");

      const inv = await one(
        c,
        "SELECT * FROM tuition_invoices WHERE id = ? FOR UPDATE",
        [sub.invoice_id],
      );
      if (!inv) fail(404, "Linked invoice not found");

      const en = await obj(c, "enrollments", inv.enrollment_id);
      await batchScope(c, en.batch_id, u, "admin");

      const at = now().toISOString();
      if (parsed.action === "approve") {
        const refCode = `${sub.payment_method}:${sub.trx_id}`.slice(0, 80);
        const newPaid = Number(inv.amount_paid) + Number(sub.amount);
        const newInvStatus = newPaid >= Number(inv.amount_due) ? "paid" : "partially_paid";

        await write(
          c,
          `UPDATE tuition_invoices SET amount_paid = ?, status = ?, payment_reference_code = ? WHERE id = ?`,
          [newPaid, newInvStatus, refCode, inv.id],
        );
        await write(
          c,
          `UPDATE guardian_payment_submissions SET status = 'approved', reviewed_by = ?, review_note = ?, reviewed_at = ? WHERE id = ?`,
          [u.id, parsed.review_note || "Verified via portal screenshot/TrxID", at, subId],
        );
        await audit(c, u, "record_invoice_payment", "tuition_invoices", inv.id, {
          payment_reference_code: refCode,
          amount_paid: Number(sub.amount),
          total_paid: newPaid,
          status: newInvStatus,
          submission_id: subId,
        });
        return {
          id: subId,
          status: "approved",
          invoice_id: inv.id,
          invoice_status: newInvStatus,
          amount_paid: newPaid,
        };
      }

      await write(
        c,
        `UPDATE guardian_payment_submissions SET status = 'rejected', reviewed_by = ?, review_note = ?, reviewed_at = ? WHERE id = ?`,
        [u.id, parsed.review_note || "TrxID / receipt could not be verified", at, subId],
      );
      await audit(c, u, "reject_guardian_payment_proof", "guardian_payment_submissions", subId, {
        review_note: parsed.review_note || "",
      });
      return { id: subId, status: "rejected", invoice_id: inv.id };
    });

    s.json(result);
  });

  return r;
}
