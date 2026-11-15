// Disposable schema-upgrade regression. Never run against a staging/production DB.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import mysql from "mysql2/promise";
if (
  process.env.ACADEMY_ENV !== "test" ||
  !/^academy_test_[a-z0-9_]+$/.test(process.env.DB_NAME || "")
)
  throw new Error("Disposable academy_test_* database required");
const c = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
try {
  const [tables] = await c.query("SHOW TABLES");
  assert.equal(
    tables.length,
    0,
    "Upgrade regression needs an EMPTY disposable DB",
  );
  const sql = await readFile("migrations/001_staging_core.sql", "utf8");
  await c.query(
    "CREATE TABLE schema_migrations(version VARCHAR(32) PRIMARY KEY, checksum VARCHAR(64) NOT NULL, applied_at VARCHAR(40) NOT NULL) ENGINE=InnoDB",
  );
  for (const statement of sql
    .replace(/^--.*$/gm, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean))
    await c.query(statement);
  await c.execute("INSERT INTO schema_migrations VALUES (?,?,?)", [
    "001",
    createHash("sha256").update(sql).digest("hex"),
    new Date().toISOString(),
  ]);
  const [sentinel] = await c.execute("INSERT INTO branches(name) VALUES (?)", [
    "Synthetic upgrade sentinel",
  ]);
  for (let n = 0; n < 2; n++)
    execFileSync(process.execPath, ["dist/src/cli.js", "migrate"], {
      env: { ...process.env, ACADEMY_ALLOW_SETUP: "1" },
      stdio: "inherit",
    });
  const [after] = await c.execute("SELECT name FROM branches WHERE id=?", [
    sentinel.insertId,
  ]);
  assert.equal(after[0].name, "Synthetic upgrade sentinel");
  const [versions] = await c.query(
    "SELECT version FROM schema_migrations ORDER BY version",
  );
  assert.deepEqual(
    versions.map((v) => v.version),
    ["001", "002", "003", "004", "005", "006", "007", "008", "009"],
  );
  const [keys] = await c.query(
    "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reports' AND COLUMN_NAME='class_id' AND REFERENCED_TABLE_NAME='class_sessions'",
  );
  assert.ok(keys.length);
  console.log(
    "PASS: unchanged 001 upgraded through 009, repeat safe, existing synthetic row retained",
  );
} finally {
  await c.end();
}
