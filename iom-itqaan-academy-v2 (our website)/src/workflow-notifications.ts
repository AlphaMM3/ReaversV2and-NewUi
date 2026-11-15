import { Router } from "express";
import { z } from "zod";
import { randomBytes } from "node:crypto";
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
import { tokenHash, safeEqual, requireRole } from "./security.js";
import {
  notificationCurrent,
  processFollowups,
  type DeliveryOutcome,
} from "./followup-worker.js";
import { workflowContext, recipients } from "./followup-notifications.js";
import { enrollmentAccess } from "./attendance-data.js";
import { reconcileEnrollment } from "./followup-engine.js";
const id = z.number().int().positive();
export function telegramWebhook(
  store: Store,
  secret?: string,
  now = () => new Date(),
) {
  const r = Router();
  r.post("/telegram/webhook", async (q, s) => {
    if (!secret || secret.length < 32)
      fail(503, "Telegram linking is not configured");
    if (
      !safeEqual(
        String(q.headers["x-telegram-bot-api-secret-token"] || ""),
        secret,
      )
    )
      fail(403, "Invalid webhook authentication");
    const message = q.body?.message;
    if (
      message?.chat?.type !== "private" ||
      String(message?.chat?.id) !== String(message?.from?.id)
    )
      fail(400, "Personal Telegram chat required");
    const text = String(message.text || ""),
      match = /^\/start(?:@\w+)? ([A-Za-z0-9_-]{40,100})$/.exec(text);
    if (!match) {
      s.json({ ok: true });
      return;
    }
    const chat = String(message.chat.id);
    if (!/^[1-9]\d{0,19}$/.test(chat)) fail(400, "Invalid personal chat");
    await store.transaction(async (c) => {
      const peek = await one(
        c,
        "SELECT user_id FROM telegram_link_tokens WHERE token_hash=?",
        [tokenHash(match[1])],
      );
      if (!peek) fail(400, "Invalid or expired link");
      const user = await obj(c, "users", peek.user_id, true),
        token = await one(
          c,
          "SELECT * FROM telegram_link_tokens WHERE token_hash=? FOR UPDATE",
          [tokenHash(match[1])],
        );
      if (
        token?.used_at &&
        user.active &&
        (await one(
          c,
          "SELECT 1 FROM telegram_connections WHERE user_id=? AND chat_id=?",
          [user.id, chat],
        ))
      )
        return;
      if (
        !user.active ||
        !token ||
        token.used_at ||
        token.expires_at <= now().toISOString()
      )
        fail(400, "Invalid or expired link");
      const existing = await one(
        c,
        "SELECT user_id FROM telegram_connections WHERE chat_id=?",
        [chat],
      );
      if (existing && existing.user_id !== user.id)
        fail(409, "Personal chat already linked");
      const own = await one(
        c,
        "SELECT user_id FROM telegram_connections WHERE user_id=? FOR UPDATE",
        [user.id],
      );
      if (own)
        await write(
          c,
          "UPDATE telegram_connections SET chat_id=?,linked_at=? WHERE user_id=?",
          [chat, now().toISOString(), user.id],
        );
      else
        await write(
          c,
          "INSERT INTO telegram_connections(user_id,chat_id,linked_at) VALUES (?,?,?)",
          [user.id, chat, now().toISOString()],
        );
      await write(
        c,
        "UPDATE telegram_link_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL",
        [now().toISOString(), user.id],
      );
      await audit(c, user, "telegram_linked", "user", user.id);
    });
    s.json({ ok: true });
  });
  return r;
}
export function workflowNotifications(
  store: Store,
  now = () => new Date(),
  botUsername?: string,
) {
  const r = Router();
  r.get("/notifications", async (_q, s) => {
    const u = s.locals.user;
    s.json(
      await store.read(async (c) => {
        const list = await rows(
          c,
          "SELECT n.id,n.event_key,n.enrollment_id,n.case_id,n.route,n.stage,n.title,n.created_at,n.read_at,(SELECT t.status FROM workflow_notifications t WHERE t.user_id=n.user_id AND t.event_key=n.event_key AND t.channel='telegram') delivery_status FROM workflow_notifications n WHERE n.user_id=? AND n.channel='in_app' ORDER BY n.id DESC LIMIT 200",
          [u.id],
        );
        const visible = [];
        for (const n of list) {
          const context = await workflowContext(c, n.enrollment_id);
          const f = n.case_id
            ? await one(
                c,
                "SELECT assignee_id FROM followup_cases WHERE id=?",
                [n.case_id],
              )
            : null;
          const role =
            n.route === "guardian"
              ? u.role.startsWith("guardian")
              : n.route === "supervisor"
                ? u.role === "department_supervisor"
                : n.route === u.role;
          if (
            context &&
            role &&
            (await recipients(c, context, n.route, f?.assignee_id)).includes(
              u.id,
            )
          )
            visible.push(n);
        }
        return visible;
      }),
    );
  });
  r.post("/notifications/:id/read", async (q, s) => {
    const uid = id.parse(Number(q.params.id));
    await store.transaction((c) =>
      write(
        c,
        "UPDATE workflow_notifications SET read_at=? WHERE id=? AND user_id=? AND channel='in_app'",
        [now().toISOString(), uid, s.locals.user.id],
      ),
    );
    s.json({ ok: true });
  });
  r.get("/notification-deliveries", async (_q, s) => {
    const u = s.locals.user;
    s.json(
      await store.read((c) =>
        rows(
          c,
          "SELECT id,event_key,enrollment_id,case_id,route,stage,title,status,attempt_count,attempted_at,created_at,delivered_at,error_code FROM workflow_notifications WHERE user_id=? AND channel='telegram' ORDER BY id DESC LIMIT 200",
          [u.id],
        ),
      ),
    );
  });
  r.post("/notification-deliveries/:id/retry", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    z.object({ confirm_possible_duplicate: z.literal(true) }).parse(q.body);
    await store.transaction(async (c) => {
      const peek = await one(
        c,
        "SELECT enrollment_id FROM workflow_notifications WHERE id=? AND user_id=?",
        [uid, u.id],
      );
      if (!peek) fail(404, "Delivery not found");
      await obj(c, "enrollments", peek.enrollment_id, true);
      const n = await one(
        c,
        "SELECT * FROM workflow_notifications WHERE id=? FOR UPDATE",
        [uid],
      );
      if (
        n!.user_id !== u.id ||
        !["unknown", "failed"].includes(n!.status) ||
        !(await notificationCurrent(c, n!, now()))
      )
        fail(409, "Delivery is not currently retryable");
      await write(
        c,
        "UPDATE workflow_notifications SET status='queued',next_attempt_at=?,error_code=NULL WHERE id=?",
        [now().toISOString(), uid],
      );
      await audit(c, u, "manual_delivery_retry", "notification", uid, {
        possible_duplicate_acknowledged: true,
      });
    });
    s.json({ ok: true });
  });
  r.get("/telegram", async (_q, s) => {
    s.json({
      linked: Boolean(
        await store.read((c) =>
          one(c, "SELECT user_id FROM telegram_connections WHERE user_id=?", [
            s.locals.user.id,
          ]),
        ),
      ),
      configuration_required: !botUsername,
    });
  });
  r.post("/telegram/link-token", async (_q, s) => {
    if (!botUsername || !/^[A-Za-z0-9_]{5,32}$/.test(botUsername))
      fail(503, "Bot username must be configured privately");
    const u = s.locals.user,
      token = randomBytes(36).toString("base64url");
    await store.transaction(async (c) => {
      await obj(c, "users", u.id, true);
      await write(
        c,
        "UPDATE telegram_link_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL",
        [now().toISOString(), u.id],
      );
      await write(
        c,
        "INSERT INTO telegram_link_tokens(token_hash,user_id,expires_at) VALUES (?,?,?)",
        [tokenHash(token), u.id, new Date(+now() + 600000).toISOString()],
      );
    });
    s.json({
      url: "https://t.me/" + botUsername + "?start=" + token,
      expires_in_seconds: 600,
    });
  });
  r.post("/telegram/unlink", async (_q, s) => {
    const u = s.locals.user;
    await store.transaction(async (c) => {
      await obj(c, "users", u.id, true);
      await write(c, "DELETE FROM telegram_connections WHERE user_id=?", [
        u.id,
      ]);
      await write(
        c,
        "UPDATE telegram_link_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL",
        [now().toISOString(), u.id],
      );
      await write(
        c,
        "UPDATE workflow_notifications SET status='skipped',error_code='unlinked' WHERE user_id=? AND channel='telegram' AND status IN ('queued','retry')",
        [u.id],
      );
      await audit(c, u, "telegram_unlinked", "user", u.id);
    });
    s.json({ ok: true });
  });
  r.get("/attendance-status/:id", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    s.json(
      await store.read(async (c) => {
        await enrollmentAccess(c, uid, u);
        const data = await one(
          c,
          "SELECT data_json,calculated_at,revision FROM attendance_projections WHERE enrollment_id=?",
          [uid],
        );
        if (!data) return { calculated: false };
        const value = JSON.parse(data.data_json);
        return u.role.startsWith("guardian")
          ? {
              calculated: true,
              month: value.month,
              leave_active: value.leave_active,
              absence: {
                first_count: value.absence.first_count,
                second_count: value.absence.second_count,
                paused: value.absence.paused,
              },
              calculated_at: data.calculated_at,
            }
          : {
              ...value,
              calculated_at: data.calculated_at,
              revision: data.revision,
            };
      }),
    );
  });
  r.post("/attendance-status/:id/recalculate", async (q, s) => {
    const uid = id.parse(Number(q.params.id)),
      u = s.locals.user;
    requireRole(u, "central_admin", "zimmadar");
    s.json(
      await store.transaction(async (c) => {
        const { b } = await enrollmentAccess(c, uid, u);
        if (u.role === "zimmadar" && b.zimmadar_id !== u.id)
          fail(403, "Assigned Batch Zimmadar only");
        return reconcileEnrollment(c, uid, now(), "manual");
      }),
    );
  });
  r.post("/workflow/run", async (q, s) => {
    requireRole(s.locals.user, "central_admin");
    const d = z
      .object({ after_id: z.number().int().nonnegative().default(0) })
      .parse(q.body || {});
    s.json(await processFollowups(store, now(), d.after_id));
  });
  return r;
}
export function telegramSender(token: string) {
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token))
    throw Error("Valid private bot configuration required");
  return async (chat: string, text: string): Promise<DeliveryOutcome> => {
    try {
      const response = await fetch(
        "https://api.telegram.org/bot" + token + "/sendMessage",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: chat, text }),
          signal: AbortSignal.timeout(15000),
        },
      );
      const body = (await response.json()) as any;
      if (response.ok && body.ok && body.result?.message_id)
        return { outcome: "sent", messageId: String(body.result.message_id) };
      if (response.status === 429 && Number(body.parameters?.retry_after) > 0)
        return {
          outcome: "retry",
          afterMs: Number(body.parameters.retry_after) * 1000,
        };
      if ([400, 403].includes(response.status))
        return { outcome: "failed", code: "provider_rejected" };
      return { outcome: "unknown", code: "provider_ambiguous" };
    } catch {
      return { outcome: "unknown", code: "transport_ambiguous" };
    }
  };
}
