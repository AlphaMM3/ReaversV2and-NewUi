import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { type Store, one, rows, write } from "./db.js";

export async function migratePortalProofsAndScheduler(store: Store) {
  const sql = await readFile("migrations/011_portal_proofs_and_scheduler.sql", "utf8"),
    checksum = createHash("sha256").update(sql).digest("hex");
  const tables = [...sql.matchAll(/CREATE TABLE (\w+)/g)].map((m) => m[1]);
  const expectedRefs = [...sql.matchAll(/FOREIGN KEY\(/g)].length;
  await store.read(async (c) => {
    const db = await one(c, "SELECT DATABASE() name");
    const lock =
      "academy_proofsch_" +
      createHash("sha256").update(db!.name).digest("hex").slice(0, 28);
    if ((await one(c, "SELECT GET_LOCK(?,10) ok", [lock]))?.ok !== 1)
      throw Error("Portal proofs and scheduler migration lock unavailable");
    try {
      const applied = await one(
          c,
          "SELECT checksum FROM schema_migrations WHERE version='011'",
        ),
        existing = await rows(
          c,
          "SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()",
        );
      if (applied) {
        if (
          applied.checksum !== checksum ||
          !tables.every((t) => existing.some((v) => v.name === t))
        )
          throw Error("Migration 011 checksum/schema drift");
        const refs = await rows(
          c,
          "SELECT TABLE_NAME t FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL",
        );
        if (refs.filter((v) => tables.includes(v.t)).length !== expectedRefs)
          throw Error("Migration 011 relationship drift");
        return;
      }
      if (tables.some((t) => existing.some((v) => v.name === t)))
        throw Error(
          "Unrecorded portal proofs/scheduler schema; retain partial DDL and review manually",
        );
      for (const statement of sql
        .replace(/^--.*$/gm, "")
        .split(";")
        .map((v) => v.trim())
        .filter(Boolean))
        await c.query(statement);
      await write(c, "INSERT INTO schema_migrations VALUES (?,?,?)", [
        "011",
        checksum,
        new Date().toISOString(),
      ]);
      console.log("Additive portal proofs and scheduler migration 011 applied");
    } finally {
      await one(c, "SELECT RELEASE_LOCK(?)", [lock]);
    }
  });
}

export async function migrateSuperAdminStores(store: Store) {
  const sql = await readFile("migrations/010_super_admin_stores.sql", "utf8"),
    checksum = createHash("sha256").update(sql).digest("hex");
  const tables = [...sql.matchAll(/CREATE TABLE (\w+)/g)].map((m) => m[1]);
  const expectedRefs = [...sql.matchAll(/FOREIGN KEY\(/g)].length;
  await store.read(async (c) => {
    const db = await one(c, "SELECT DATABASE() name");
    const lock =
      "academy_superadm_" +
      createHash("sha256").update(db!.name).digest("hex").slice(0, 30);
    if ((await one(c, "SELECT GET_LOCK(?,10) ok", [lock]))?.ok !== 1)
      throw Error("Super admin stores migration lock unavailable");
    try {
      const applied = await one(
          c,
          "SELECT checksum FROM schema_migrations WHERE version='010'",
        ),
        existing = await rows(
          c,
          "SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()",
        );
      if (applied) {
        if (
          applied.checksum !== checksum ||
          !tables.every((t) => existing.some((v) => v.name === t))
        )
          throw Error("Migration 010 checksum/schema drift");
        const refs = await rows(
          c,
          "SELECT TABLE_NAME t FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL",
        );
        if (refs.filter((v) => tables.includes(v.t)).length !== expectedRefs)
          throw Error("Migration 010 relationship drift");
        return;
      }
      if (tables.some((t) => existing.some((v) => v.name === t)))
        throw Error(
          "Unrecorded super admin stores schema; retain partial DDL and review manually",
        );
      for (const statement of sql
        .replace(/^--.*$/gm, "")
        .split(";")
        .map((v) => v.trim())
        .filter(Boolean))
        await c.query(statement);
      await write(c, "INSERT INTO schema_migrations VALUES (?,?,?)", [
        "010",
        checksum,
        new Date().toISOString(),
      ]);
      console.log("Additive super admin stores migration 010 applied");
    } finally {
      await one(c, "SELECT RELEASE_LOCK(?)", [lock]);
    }
  });
}

export async function migrateCommercialPackagesAndLedger(store: Store) {
  const sql = await readFile("migrations/009_commercial_packages_and_ledger.sql", "utf8"),
    checksum = createHash("sha256").update(sql).digest("hex");
  const tables = [...sql.matchAll(/CREATE TABLE (\w+)/g)].map((m) => m[1]);
  const expectedRefs = [...sql.matchAll(/FOREIGN KEY\(/g)].length;
  await store.read(async (c) => {
    const db = await one(c, "SELECT DATABASE() name");
    const lock =
      "academy_commlg_" +
      createHash("sha256").update(db!.name).digest("hex").slice(0, 30);
    if ((await one(c, "SELECT GET_LOCK(?,10) ok", [lock]))?.ok !== 1)
      throw Error("Commercial ledger migration lock unavailable");
    try {
      const applied = await one(
          c,
          "SELECT checksum FROM schema_migrations WHERE version='009'",
        ),
        existing = await rows(
          c,
          "SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()",
        );
      if (applied) {
        if (
          applied.checksum !== checksum ||
          !tables.every((t) => existing.some((v) => v.name === t))
        )
          throw Error("Migration 009 checksum/schema drift");
        const refs = await rows(
          c,
          "SELECT TABLE_NAME t FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL",
        );
        if (refs.filter((v) => tables.includes(v.t)).length !== expectedRefs)
          throw Error("Migration 009 relationship drift");
        return;
      }
      if (tables.some((t) => existing.some((v) => v.name === t)))
        throw Error(
          "Unrecorded commercial ledger schema; retain partial DDL and review manually",
        );
      for (const statement of sql
        .replace(/^--.*$/gm, "")
        .split(";")
        .map((v) => v.trim())
        .filter(Boolean))
        await c.query(statement);
      await write(c, "INSERT INTO schema_migrations VALUES (?,?,?)", [
        "009",
        checksum,
        new Date().toISOString(),
      ]);
      console.log("Additive commercial packages and ledger migration 009 applied");
    } finally {
      await one(c, "SELECT RELEASE_LOCK(?)", [lock]);
    }
  });
}

export async function migrateSupportAndFinanceReferences(store: Store) {
  const sql = await readFile("migrations/008_support_and_finance_references.sql", "utf8"),
    checksum = createHash("sha256").update(sql).digest("hex");
  const tables = [...sql.matchAll(/CREATE TABLE (\w+)/g)].map((m) => m[1]);
  const expectedRefs = [...sql.matchAll(/FOREIGN KEY\(/g)].length;
  await store.read(async (c) => {
    const db = await one(c, "SELECT DATABASE() name");
    const lock =
      "academy_suppref_" +
      createHash("sha256").update(db!.name).digest("hex").slice(0, 30);
    if ((await one(c, "SELECT GET_LOCK(?,10) ok", [lock]))?.ok !== 1)
      throw Error("Support references migration lock unavailable");
    try {
      const applied = await one(
          c,
          "SELECT checksum FROM schema_migrations WHERE version='008'",
        ),
        existing = await rows(
          c,
          "SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()",
        );
      if (applied) {
        if (
          applied.checksum !== checksum ||
          !tables.every((t) => existing.some((v) => v.name === t))
        )
          throw Error("Migration 008 checksum/schema drift");
        const refs = await rows(
          c,
          "SELECT TABLE_NAME t FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL",
        );
        if (refs.filter((v) => tables.includes(v.t)).length !== expectedRefs)
          throw Error("Migration 008 relationship drift");
        return;
      }
      if (tables.some((t) => existing.some((v) => v.name === t)))
        throw Error(
          "Unrecorded support references schema; retain partial DDL and review manually",
        );
      for (const statement of sql
        .replace(/^--.*$/gm, "")
        .split(";")
        .map((v) => v.trim())
        .filter(Boolean))
        await c.query(statement);
      await write(c, "INSERT INTO schema_migrations VALUES (?,?,?)", [
        "008",
        checksum,
        new Date().toISOString(),
      ]);
      console.log("Additive support and finance references migration 008 applied");
    } finally {
      await one(c, "SELECT RELEASE_LOCK(?)", [lock]);
    }
  });
}

export async function migrateLearningRecords(store: Store) {
  const sql = await readFile("migrations/007_learning_records.sql", "utf8"),
    checksum = createHash("sha256").update(sql).digest("hex");
  const tables = [...sql.matchAll(/CREATE TABLE (\w+)/g)].map((m) => m[1]);
  const expectedRefs = [...sql.matchAll(/FOREIGN KEY\(/g)].length;
  await store.read(async (c) => {
    const db = await one(c, "SELECT DATABASE() name");
    const lock =
      "academy_learning_" +
      createHash("sha256").update(db!.name).digest("hex").slice(0, 30);
    if ((await one(c, "SELECT GET_LOCK(?,10) ok", [lock]))?.ok !== 1)
      throw Error("Learning migration lock unavailable");
    try {
      const applied = await one(
          c,
          "SELECT checksum FROM schema_migrations WHERE version='007'",
        ),
        existing = await rows(
          c,
          "SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()",
        );
      if (applied) {
        if (
          applied.checksum !== checksum ||
          !tables.every((t) => existing.some((v) => v.name === t))
        )
          throw Error("Migration 007 checksum/schema drift");
        const refs = await rows(
          c,
          "SELECT TABLE_NAME t FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL",
        );
        if (refs.filter((v) => tables.includes(v.t)).length !== expectedRefs)
          throw Error("Migration 007 relationship drift");
        return;
      }
      if (tables.some((t) => existing.some((v) => v.name === t)))
        throw Error(
          "Unrecorded learning schema; retain partial DDL and review manually",
        );
      for (const statement of sql
        .replace(/^--.*$/gm, "")
        .split(";")
        .map((v) => v.trim())
        .filter(Boolean))
        await c.query(statement);
      await write(c, "INSERT INTO schema_migrations VALUES (?,?,?)", [
        "007",
        checksum,
        new Date().toISOString(),
      ]);
      console.log("Additive learning records migration 007 applied");
    } finally {
      await one(c, "SELECT RELEASE_LOCK(?)", [lock]);
    }
  });
}

export async function migrateAttendanceWorkflows(store: Store) {
  const sql = await readFile("migrations/006_attendance_workflows.sql", "utf8"),
    checksum = createHash("sha256").update(sql).digest("hex");
  const tables = [...sql.matchAll(/CREATE TABLE (\w+)/g)].map((m) => m[1]);
  const expectedRefs = [...sql.matchAll(/FOREIGN KEY\(/g)].length;
  await store.read(async (c) => {
    const db = await one(c, "SELECT DATABASE() name");
    const lock =
      "academy_attendance_" +
      createHash("sha256").update(db!.name).digest("hex").slice(0, 30);
    if ((await one(c, "SELECT GET_LOCK(?,10) ok", [lock]))?.ok !== 1)
      throw Error("Attendance migration lock unavailable");
    try {
      const applied = await one(
          c,
          "SELECT checksum FROM schema_migrations WHERE version='006'",
        ),
        existing = await rows(
          c,
          "SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()",
        );
      if (applied) {
        if (
          applied.checksum !== checksum ||
          !tables.every((t) => existing.some((v) => v.name === t))
        )
          throw Error("Migration 006 checksum/schema drift");
        const refs = await rows(
          c,
          "SELECT TABLE_NAME t FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL",
        );
        if (refs.filter((v) => tables.includes(v.t)).length !== expectedRefs)
          throw Error("Migration 006 relationship drift");
        return;
      }
      if (tables.some((t) => existing.some((v) => v.name === t)))
        throw Error(
          "Unrecorded attendance schema; retain partial DDL and review manually",
        );
      for (const statement of sql
        .replace(/^--.*$/gm, "")
        .split(";")
        .map((v) => v.trim())
        .filter(Boolean))
        await c.query(statement);
      await write(c, "INSERT INTO schema_migrations VALUES (?,?,?)", [
        "006",
        checksum,
        new Date().toISOString(),
      ]);
      console.log("Additive attendance workflows migration 006 applied");
    } finally {
      await one(c, "SELECT RELEASE_LOCK(?)", [lock]);
    }
  });
}

export async function migrateAcademicOperations(store: Store) {
  const sql = await readFile("migrations/005_academic_operations.sql", "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  const tables = [
    "academic_sessions",
    "admission_applications",
    "batch_assignment_history",
    "weekly_routines",
    "class_schedule_events",
    "course_report_templates",
    "report_template_bindings",
    "enrollment_status_history",
  ];
  await store.read(async (c) => {
    const db = await one(c, "SELECT DATABASE() name");
    const lock =
      "academy_ops_" +
      createHash("sha256").update(db!.name).digest("hex").slice(0, 30);
    if ((await one(c, "SELECT GET_LOCK(?,10) ok", [lock]))?.ok !== 1)
      throw Error("Academic migration lock unavailable");
    try {
      const applied = await one(
        c,
        "SELECT checksum FROM schema_migrations WHERE version='005'",
      );
      const existing = await rows(
        c,
        "SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()",
      );
      if (applied) {
        if (
          applied.checksum !== checksum ||
          !tables.every((t) => existing.some((v) => v.name === t))
        )
          throw Error("Migration 005 checksum/schema drift");
        const columns = await rows(
          c,
          "SELECT TABLE_NAME t,COLUMN_NAME col FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('courses','batches','class_sessions')",
        );
        for (const [t, col] of [
          ["courses", "start_date"],
          ["courses", "end_date"],
          ["batches", "start_date"],
          ["batches", "end_date"],
          ["batches", "academic_session_id"],
          ["class_sessions", "routine_id"],
          ["class_sessions", "routine_occurrence"],
          ["class_sessions", "schedule_revision"],
        ])
          if (!columns.some((v) => v.t === t && v.col === col))
            throw Error("Migration 005 column drift");
        const refs = await rows(
          c,
          "SELECT TABLE_NAME t,COLUMN_NAME col FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL",
        );
        if (
          refs.filter(
            (v) =>
              tables.includes(v.t) ||
              (v.t === "batches" && v.col === "academic_session_id") ||
              (v.t === "class_sessions" && v.col === "routine_id"),
          ).length !== 25
        )
          throw Error("Migration 005 relationship drift");
        const unique = await rows(
          c,
          "SELECT COLUMN_NAME col FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='class_sessions' AND INDEX_NAME='uq_routine_occurrence' AND NON_UNIQUE=0 ORDER BY SEQ_IN_INDEX",
        );
        if (
          unique.map((v) => v.col).join(",") !== "routine_id,routine_occurrence"
        )
          throw Error("Migration 005 routine uniqueness drift");
        return;
      }
      if (tables.some((t) => existing.some((v) => v.name === t)))
        throw Error(
          "Unrecorded academic operations schema; retain partial DDL and review manually",
        );
      for (const statement of sql
        .replace(/^--.*$/gm, "")
        .split(";")
        .map((v) => v.trim())
        .filter(Boolean))
        await c.query(statement);
      await write(c, "INSERT INTO schema_migrations VALUES (?,?,?)", [
        "005",
        checksum,
        new Date().toISOString(),
      ]);
      console.log("Additive academic operations migration 005 applied");
    } finally {
      await one(c, "SELECT RELEASE_LOCK(?)", [lock]);
    }
  });
}

export async function migrateAccounts(store: Store) {
  const sql = await readFile("migrations/004_accounts_and_scopes.sql", "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  await store.read(async (c) => {
    const db = await one(c, "SELECT DATABASE() name");
    const lock =
      "academy_accounts_" +
      createHash("sha256").update(db!.name).digest("hex").slice(0, 30);
    if (
      (await one(c, "SELECT GET_LOCK(?,10) acquired", [lock]))?.acquired !== 1
    )
      throw Error("Account migration lock unavailable");
    try {
      const applied = await one(
        c,
        "SELECT checksum FROM schema_migrations WHERE version='004'",
      );
      const verify = async () => {
        const required: Record<string, string[]> = {
          users: ["department_id"],
          user_role_assignments: [
            "id",
            "user_id",
            "role",
            "branch_id",
            "department_id",
            "scope_key",
            "active",
            "created_at",
          ],
          session_role_bindings: ["token_hash", "assignment_id"],
          password_reset_tokens: [
            "token_hash",
            "user_id",
            "issued_by",
            "expires_at",
            "used_at",
            "created_at",
          ],
          login_throttles: ["bucket", "attempts", "expires_ms"],
        };
        for (const [table, columns] of Object.entries(required)) {
          const actual = await rows(
            c,
            "SELECT COLUMN_NAME name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?",
            [table],
          );
          if (!columns.every((name) => actual.some((v) => v.name === name)))
            throw Error("Migration 004 schema drift: " + table);
        }
        const links = await rows(
          c,
          "SELECT TABLE_NAME t,COLUMN_NAME col,REFERENCED_TABLE_NAME rt,REFERENCED_COLUMN_NAME rc FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL",
        );
        for (const [t, col, rt, rc] of [
          ["users", "department_id", "departments", "id"],
          ["user_role_assignments", "user_id", "users", "id"],
          ["user_role_assignments", "branch_id", "branches", "id"],
          ["user_role_assignments", "department_id", "departments", "id"],
          [
            "session_role_bindings",
            "token_hash",
            "auth_sessions",
            "token_hash",
          ],
          [
            "session_role_bindings",
            "assignment_id",
            "user_role_assignments",
            "id",
          ],
          ["password_reset_tokens", "user_id", "users", "id"],
          ["password_reset_tokens", "issued_by", "users", "id"],
        ])
          if (
            !links.some(
              (v) => v.t === t && v.col === col && v.rt === rt && v.rc === rc,
            )
          )
            throw Error("Migration 004 relationship drift: " + t + "." + col);
        const unique = await rows(
          c,
          "SELECT COLUMN_NAME col FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='user_role_assignments' AND INDEX_NAME='uq_user_role_scope' AND NON_UNIQUE=0 ORDER BY SEQ_IN_INDEX",
        );
        if (unique.map((v) => v.col).join(",") !== "user_id,scope_key")
          throw Error("Migration 004 assignment uniqueness drift");
      };
      if (applied) {
        if (applied.checksum !== checksum)
          throw Error("Migration 004 checksum mismatch");
        await verify();
        return;
      }
      const maria = String(
        (await one(c, "SELECT VERSION() version"))?.version,
      ).includes("MariaDB");
      const roleChecks = await rows(
        c,
        "SELECT tc.CONSTRAINT_NAME name,cc.CHECK_CLAUSE clause_text FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME WHERE tc.TABLE_SCHEMA=DATABASE() AND tc.TABLE_NAME='users' AND tc.CONSTRAINT_TYPE='CHECK'",
      );
      const quote = (v: string) => "`" + v.replaceAll("`", "``") + "`";
      const expression =
        "role IN ('central_admin','branch_admin','teacher','zimmadar','guardian_primary','guardian_secondary','department_supervisor')";
      if (maria)
        await c.query(
          "ALTER TABLE users MODIFY COLUMN role VARCHAR(255) NOT NULL CHECK(" +
            expression +
            ")",
        );
      else {
        for (const check of roleChecks.filter((v) =>
          /\brole\b/i.test(v.clause_text),
        ))
          await c.query("ALTER TABLE users DROP CHECK " + quote(check.name));
        await c.query(
          "ALTER TABLE users ADD CONSTRAINT chk_user_role_v4 CHECK(" +
            expression +
            ")",
        );
      }
      for (const statement of sql
        .replace(/^--.*$/gm, "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)) {
        if (statement.startsWith("ALTER TABLE users ADD COLUMN")) {
          if (
            (
              await rows(
                c,
                "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='department_id'",
              )
            ).length
          )
            continue;
        } else if (statement.startsWith("ALTER TABLE users ADD CONSTRAINT")) {
          if (
            (
              await rows(
                c,
                "SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='department_id' AND REFERENCED_TABLE_NAME='departments'",
              )
            ).length
          )
            continue;
        } else if (statement.startsWith("CREATE INDEX")) {
          const m = /CREATE INDEX (\w+) ON (\w+)/.exec(statement)!;
          if (
            (
              await rows(
                c,
                "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?",
                [m[2], m[1]],
              )
            ).length
          )
            continue;
        }
        await c.query(statement);
      }
      await verify();
      await write(c, "INSERT INTO schema_migrations VALUES (?,?,?)", [
        "004",
        checksum,
        new Date().toISOString(),
      ]);
      console.log("Account lifecycle and scoped roles migration 004 applied");
    } finally {
      await one(c, "SELECT RELEASE_LOCK(?)", [lock]);
    }
  });
}

// Keep published 001 immutable. Add the missing enforced relationship separately.
export async function migrateReportClassForeignKey(store: Store) {
  const sql = await readFile(
    "migrations/002_report_class_foreign_key.sql",
    "utf8",
  );
  const checksum = createHash("sha256").update(sql).digest("hex");
  await store.read(async (c) => {
    const db = await one(c, "SELECT DATABASE() AS name");
    const lock =
      "academy_schema_" +
      createHash("sha256").update(db!.name).digest("hex").slice(0, 40);
    if (
      (await one(c, "SELECT GET_LOCK(?,10) AS acquired", [lock]))?.acquired !==
      1
    )
      throw new Error("Another schema setup is active");
    try {
      const applied = await one(
        c,
        "SELECT checksum FROM schema_migrations WHERE version=?",
        ["002"],
      );
      if (applied && applied.checksum !== checksum)
        throw new Error("Migration 002 checksum mismatch; review manually");
      const existing = await rows(
        c,
        "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reports' AND COLUMN_NAME='class_id' AND REFERENCED_TABLE_NAME='class_sessions' AND REFERENCED_COLUMN_NAME='id'",
      );
      if (applied) {
        if (!existing.length)
          throw new Error("Migration 002 schema drift; review manually");
        console.log("Report foreign key migration already applied");
        return;
      }
      if (!existing.length) await c.query(sql.replace(/^--.*$/gm, ""));
      await write(
        c,
        "INSERT INTO schema_migrations(version,checksum,applied_at) VALUES (?,?,?)",
        ["002", checksum, new Date().toISOString()],
      );
      console.log(
        "Report-to-class foreign key verified; migration 002 recorded",
      );
    } finally {
      await one(c, "SELECT RELEASE_LOCK(?)", [lock]);
    }
  });
}

export async function migratePublishedProgress(store: Store) {
  const sql = await readFile("migrations/003_published_progress.sql", "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  await store.read(async (c) => {
    const db = await one(c, "SELECT DATABASE() AS name");
    const lock =
      "academy_schema_" +
      createHash("sha256").update(db!.name).digest("hex").slice(0, 40);
    if (
      (await one(c, "SELECT GET_LOCK(?,10) AS acquired", [lock]))?.acquired !==
      1
    )
      throw new Error("Another schema setup is active");
    try {
      const applied = await one(
        c,
        "SELECT checksum FROM schema_migrations WHERE version='003'",
      );
      const columns = await rows(
        c,
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='published_progress' ORDER BY ORDINAL_POSITION",
      );
      if (applied) {
        if (
          applied.checksum !== checksum ||
          columns.map((v) => v.COLUMN_NAME).join(",") !==
            "id,enrollment_id,publisher_id,request_id,title,progress_summary,homework_summary,published_at"
        )
          throw new Error(
            "Migration 003 checksum/schema drift; review manually",
          );
        console.log("Published progress migration already applied");
        return;
      }
      if (columns.length)
        throw new Error(
          "Unrecorded published_progress table; retain evidence and review manually",
        );
      await c.query(sql.replace(/^--.*$/gm, ""));
      await write(
        c,
        "INSERT INTO schema_migrations(version,checksum,applied_at) VALUES (?,?,?)",
        ["003", checksum, new Date().toISOString()],
      );
      console.log("Additive published progress migration 003 applied");
    } finally {
      await one(c, "SELECT RELEASE_LOCK(?)", [lock]);
    }
  });
}
