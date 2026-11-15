import { supportTickets } from "./support-tickets.js";
import express from "express";
import { existsSync } from "node:fs";
import { z, ZodError } from "zod";
import { type Store, HttpError, one, write } from "./db.js";
import {
  cookieName,
  sessionUser,
  safeEqual,
  verifyPassword,
  createSession,
  tokenHash,
} from "./security.js";
import { catalog } from "./catalog.js";
import { academic } from "./academic.js";
import { monitor } from "./monitor.js";
import { progress } from "./progress.js";
import { InvalidDateTimeError } from "./policy.js";
import { accounts, claimLogin, resetPassword } from "./accounts.js";
import { randomUUID } from "node:crypto";
import { operations } from "./operations.js";
import { admissions } from "./admissions.js";
import { planning } from "./planning.js";
import { reportTemplates } from "./report-templates.js";
import { attendance } from "./attendance.js";
import { studentLeave } from "./student-leave.js";
import { followups } from "./followups.js";
import { learning } from "./learning.js";
import { supportAndFinance } from "./support-and-finance.js";
import { commercialLedger } from "./commercial-ledger.js";
import { superAdminStores } from "./super-admin-stores.js";
import {
  publicSanadRouter,
  autoRemindersAndProofs,
  startAutoReminderScheduler,
} from "./auto-reminders.js";
import {
  workflowNotifications,
  telegramWebhook,
} from "./workflow-notifications.js";
export function createApp(
  store: Store,
  {
    secureCookies = true,
    now = () => new Date(),
    telegramSecret = process.env.ACADEMY_TELEGRAM_WEBHOOK_SECRET,
    telegramBot = process.env.ACADEMY_TELEGRAM_BOT_USERNAME,
  }: {
    secureCookies?: boolean;
    now?: () => Date;
    telegramSecret?: string;
    telegramBot?: string;
  } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use((_q, s, next) => {
    s.locals.requestId = randomUUID();
    s.set("X-Request-ID", s.locals.requestId);
    s.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "same-origin",
      "Cache-Control": "no-store",
    });
    next();
  });
  app.use("/api/super-admin", express.json({ limit: "2mb" }));
  app.use("/api/guardian/payment-submissions", express.json({ limit: "2mb" }));
  app.use("/api/support/tickets", express.json({ limit: "2mb" }));
  app.use(express.json({ limit: "32kb" }));
  app.use("/api", publicSanadRouter(store));
  app.use("/api", telegramWebhook(store, telegramSecret, now));
  app.get("/health", (_q, s) =>
    s.json({
      status: "ok",
      version: "0.3.0-staging.1",
      environment: "staging-candidate",
    }),
  );
  app.get("/ready", async (_q, s) => {
    await store.read((c) => one(c, "SELECT 1 FROM users LIMIT 1"));
    s.json({ status: "ready" });
  });
  app.use("/static", express.static("frontend"));
  app.use("/app", express.static("dist/web"));
  app.get(/^\/app(\/.*)?$/, (_q, s) => {
    if (!existsSync("dist/web/index.html")) {
      s.status(404).json({ detail: "Modern UI not built" });
      return;
    }
    s.sendFile("index.html", { root: "dist/web" });
  });
  app.get("/", (_q, s) => s.sendFile("index.html", { root: "frontend" }));
  // Bounded process-local limiter; no trust of attacker-supplied forwarding headers.
  const attempts = new Map<string, { n: number; until: number }>();
  app.post("/api/login", async (q, s) => {
    const key =
        (q.socket.remoteAddress || "unknown") +
        "|" +
        String(q.body?.email || "")
          .trim()
          .toLowerCase()
          .slice(0, 254),
      nowMs = Date.now();
    for (const [k, v] of attempts) if (v.until < nowMs) attempts.delete(k);
    let a = attempts.get(key);
    if (!a) {
      if (attempts.size >= 10000) {
        s.status(429).json({ detail: "Try later" });
        return;
      }
      a = { n: 0, until: nowMs + 900000 };
      attempts.set(key, a);
    }
    if (a.n >= 30) {
      s.status(429).json({ detail: "Too many login attempts" });
      return;
    }
    const d = z
      .object({ email: z.string().max(254), password: z.string().max(256) })
      .parse(q.body);
    a.n++;
    const bucket = await claimLogin(store, d.email);
    const result = await store.transaction(async (c) => {
      const u = await one(
        c,
        "SELECT * FROM users WHERE email=? AND active=1 FOR UPDATE",
        [d.email.trim()],
      );
      // Same PBKDF2 work for unknown emails; no account enumeration by trivial timing.
      const valid = await verifyPassword(
        d.password,
        u?.password_salt || "00".repeat(16),
        u?.password_hash || "00".repeat(32),
      );
      if (!u || !valid) {
        throw new HttpError(401, "Invalid login");
      }
      return { u, ...(await createSession(c, u.id)) };
    });
    await store.transaction((c) =>
      write(c, "DELETE FROM login_throttles WHERE bucket=?", [bucket]),
    );
    attempts.delete(key);
    s.cookie(cookieName, result.token, {
      httpOnly: true,
      sameSite: "strict",
      secure: secureCookies,
      maxAge: 43200000,
      path: "/",
    });
    s.json({
      ok: true,
      csrf: result.csrf,
      user: { id: result.u.id, name: result.u.name, role: result.u.role },
    });
  });
  app.post("/api/password/reset", async (q, s) => {
    await resetPassword(store, q.body);
    s.json({ ok: true });
  });
  app.use("/api", async (q, s, next) => {
    const token =
      (q.headers.cookie || "")
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith(cookieName + "="))
        ?.slice(cookieName.length + 1) || "";
    const u = await store.read((c) => sessionUser(c, token));
    if (!u) throw new HttpError(401, "Please sign in");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(q.method) &&
      !safeEqual(String(q.headers["x-csrf-token"] || ""), u.csrf)
    )
      throw new HttpError(403, "Invalid CSRF token");
    s.locals.user = u;
    s.locals.token = token;
    next();
  });
  app.get("/api/me", (_q, s) => {
    const u = s.locals.user;
    s.json(
      Object.fromEntries(
        [
          "id",
          "name",
          "email",
          "role",
          "branch_id",
          "department_id",
          "base_role",
          "csrf",
        ].map((k) => [k, u[k]]),
      ),
    );
  });
  app.post("/api/logout", async (_q, s) => {
    await store.transaction((c) =>
      write(c, "DELETE FROM auth_sessions WHERE token_hash=?", [
        tokenHash(s.locals.token),
      ]),
    );
    s.clearCookie(cookieName, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: secureCookies,
    });
    s.json({ ok: true });
  });
  app.use(
    "/api",
    accounts(store),
    operations(store),
    attendance(store, now),
    studentLeave(store, now),
    followups(store, now),
    workflowNotifications(store, now, telegramBot),
    admissions(store, now),
    planning(store, now),
    reportTemplates(store),
    catalog(store),
    academic(store, now),
    monitor(store, now),
    progress(store, now),
    learning(store, now),
    supportAndFinance(store, now),
    commercialLedger(store, now),
    supportTickets(store, now),
    superAdminStores(store, now),
    autoRemindersAndProofs(store, now),
  );
  if (process.env.NODE_ENV !== "test") {
    startAutoReminderScheduler(store, now);
  }
  app.use((_q, s) => s.status(404).json({ detail: "Not found" }));
  app.use(
    (
      e: any,
      _q: express.Request,
      s: express.Response,
      _next: express.NextFunction,
    ) => {
      const status =
        e instanceof HttpError
          ? e.status
          : e.type === "entity.too.large"
            ? 413
            : e instanceof ZodError
              ? 422
              : e.code === "ER_DUP_ENTRY"
                ? 409
                : e.code === "ER_NO_REFERENCED_ROW_2"
                  ? 400
                  : e instanceof SyntaxError ||
                      e instanceof InvalidDateTimeError
                    ? 400
                    : 500;
      if (status === 500)
        console.error("Request failed", {
          code: e.code || e.name,
          request_id: s.locals.requestId,
          path: _q.path,
          method: _q.method,
        });
      const fields =
        e instanceof ZodError
          ? Object.fromEntries(
              e.issues.map((iss) => [
                iss.path.length ? iss.path.join(".") : "_form",
                iss.message,
              ]),
            )
          : undefined;
      s.status(status).json({
        detail:
          e instanceof HttpError
            ? e.message
            : e instanceof ZodError
              ? "Invalid input"
              : status === 413
                ? "Request body exceeds 32 KB"
                : status === 409
                  ? "Duplicate record"
                  : status === 400
                    ? "Invalid request"
                    : "Internal server error",
        ...(fields ? { fields } : {}),
      });
    },
  );
  return app;
}
