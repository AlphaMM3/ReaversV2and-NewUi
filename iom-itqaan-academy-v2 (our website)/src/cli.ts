import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createStore, rows, write, audit, fail } from "./db.js";
import { hashPassword } from "./security.js";
import { processAlerts } from "./monitor.js";
import { cleanupAccounts } from "./operations.js";
import { processFollowups, deliverTelegram } from "./followup-worker.js";
import { telegramSender } from "./workflow-notifications.js";
import {
  migrateReportClassForeignKey,
  migratePublishedProgress,
  migrateAccounts,
  migrateAcademicOperations,
  migrateAttendanceWorkflows,
  migrateLearningRecords,
  migrateSupportAndFinanceReferences,
  migrateCommercialPackagesAndLedger,
  migrateSuperAdminStores,
  migratePortalProofsAndScheduler,
} from "./migrations.js";
const command = process.argv[2],
  store = createStore();
try {
  if (command === "migrate") {
    if (process.env.ACADEMY_ALLOW_SETUP !== "1")
      throw new Error("Explicit ACADEMY_ALLOW_SETUP=1 required");
    const sql = await readFile("migrations/001_staging_core.sql", "utf8"),
      sha = createHash("sha256").update(sql).digest("hex");
    await store.read(async (c) => {
      // No automatic migration against populated/unrecognized databases.
      const tables = await rows(c, "SHOW TABLES");
      if (tables.length) {
        if (!tables.some((t) => Object.values(t).includes("schema_migrations")))
          throw new Error(
            "Database not empty and has no Academy migration ledger; refusing",
          );
        const applied = await rows(
          c,
          "SELECT checksum FROM schema_migrations WHERE version=?",
          ["001"],
        );
        if (applied[0]?.checksum === sha) {
          console.log("Schema already applied");
          return;
        }
        throw new Error(
          "Incomplete or mismatched schema; review manually, no destructive repair",
        );
      }
      // MySQL DDL auto-commits. On partial failure retain evidence and require review.
      await c.query(
        "CREATE TABLE schema_migrations (version VARCHAR(32) PRIMARY KEY, checksum VARCHAR(64) NOT NULL, applied_at VARCHAR(40) NOT NULL) ENGINE=InnoDB",
      );
      for (const statement of sql
        .replace(/^--.*$/gm, "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean))
        await c.query(statement);
      await write(c, "INSERT INTO schema_migrations VALUES (?,?,?)", [
        "001",
        sha,
        new Date().toISOString(),
      ]);
      console.log("Dedicated staging schema applied");
    });
    await migrateReportClassForeignKey(store);
    await migratePublishedProgress(store);
    await migrateAccounts(store);
    await migrateAcademicOperations(store);
    await migrateAttendanceWorkflows(store);
    await migrateLearningRecords(store);
    await migrateSupportAndFinanceReferences(store);
    await migrateCommercialPackagesAndLedger(store);
    await migrateSuperAdminStores(store);
    await migratePortalProofsAndScheduler(store);
  } else if (command === "bootstrap") {
    if (process.env.ACADEMY_ALLOW_SETUP !== "1")
      throw new Error("Explicit setup gate required");
    const email = process.env.BOOTSTRAP_EMAIL,
      password = process.env.BOOTSTRAP_PASSWORD;
    if (!email || !password)
      throw new Error(
        "Supply bootstrap email/password through environment, never command arguments",
      );
    const h = await hashPassword(password);
    await store.transaction(async (c) => {
      await rows(
        c,
        "SELECT version FROM schema_migrations WHERE version='001' FOR UPDATE",
      );
      if ((await rows(c, "SELECT id FROM users LIMIT 1")).length)
        throw new Error("Bootstrap only permitted on empty users table");
      const v = await write(
        c,
        "INSERT INTO users(email,name,role,password_salt,password_hash,created_at) VALUES (?,?,?,?,?,?)",
        [
          email.toLowerCase(),
          "Staging Administrator",
          "central_admin",
          h.salt,
          h.hash,
          new Date().toISOString(),
        ],
      );
      await audit(c, null, "bootstrap", "user", v.insertId);
      console.log(
        "Staging administrator created; clear bootstrap environment variables now",
      );
    });
  } else if (command === "recover-admin") {
    if (process.env.ACADEMY_ALLOW_SETUP !== "1")
      throw Error("Explicit setup gate required");
    const email = process.env.BOOTSTRAP_EMAIL,
      password = process.env.BOOTSTRAP_PASSWORD;
    if (!email || !password)
      throw Error(
        "Supply recovery email/password through protected environment",
      );
    const next = await hashPassword(password);
    await store.transaction(async (c) => {
      const list = await rows(
        c,
        "SELECT id FROM users WHERE email=? AND role='central_admin' AND active=1 FOR UPDATE",
        [email.trim().toLowerCase()],
      );
      if (!list.length) fail(404, "Active Central Admin not found");
      const uid = list[0].id;
      await write(
        c,
        "UPDATE users SET password_salt=?,password_hash=? WHERE id=?",
        [next.salt, next.hash, uid],
      );
      await write(c, "DELETE FROM auth_sessions WHERE user_id=?", [uid]);
      await write(
        c,
        "UPDATE password_reset_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL",
        [new Date().toISOString(), uid],
      );
      await audit(c, null, "admin_recovered", "user", uid, {
        source: "protected_cli",
      });
    });
    console.log(
      "Central Admin recovered; clear recovery environment variables",
    );
  } else if (command === "followups") {
    let after = 0,
      examined = 0,
      notifications = 0;
    do {
      const result = await processFollowups(store, new Date(), after);
      examined += result.examined;
      notifications += result.notifications;
      after = result.next_after;
    } while (after);
    console.log(
      JSON.stringify({
        examined,
        notifications,
        channel: "in_app; no external send",
      }),
    );
  } else if (command === "telegram") {
    if (
      process.env.ACADEMY_TELEGRAM_SEND !== "1" ||
      !process.env.ACADEMY_TELEGRAM_BOT_TOKEN
    )
      throw Error(
        "Explicit delivery opt-in and private bot configuration required",
      );
    console.log(
      JSON.stringify(
        await deliverTelegram(
          store,
          telegramSender(process.env.ACADEMY_TELEGRAM_BOT_TOKEN),
        ),
      ),
    );
  } else if (command === "alerts") {
    await cleanupAccounts(store);
    console.log(
      JSON.stringify({
        logged_events: await processAlerts(store),
        channel: "in_app_only",
      }),
    );
  } else if (command === "maintenance")
    console.log(JSON.stringify(await cleanupAccounts(store)));
  else throw new Error("Use migrate, bootstrap, alerts or maintenance");
} finally {
  await store.pool.end();
}
