// Real SQL/HTTP tests; refuses to connect without an explicitly named disposable test database.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createStore, Store, rows, write } from "../src/db.js";
import type { PoolConnection } from "mysql2/promise";
import { createApp } from "../src/app.js";
import { hashPassword } from "../src/security.js";
import { processAlerts } from "../src/monitor.js";
import { claimLogin } from "../src/accounts.js";
import { cleanupAccounts } from "../src/operations.js";
import { reconcileEnrollment } from "../src/followup-engine.js";
if (
  process.env.ACADEMY_ENV !== "test" ||
  !/^academy_test_[a-z0-9_]+$/.test(process.env.DB_NAME || "")
)
  throw new Error("Dedicated academy_test_* database required");
const store = createStore(),
  clock = { now: new Date("2026-11-01T12:05:00+06:00") };
const server = createApp(store, {
  secureCookies: false,
  now: () => clock.now,
}).listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string") throw new Error("No server");
const base = `http://127.0.0.1:${address.port}`;
after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await store.pool.end();
});
class Client {
  cookie = "";
  csrf = "";
  async call(
    path: string,
    body?: any,
    opts: { csrf?: boolean; expected?: number } = {},
  ) {
    const response = await fetch(base + "/api" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: this.cookie,
        ...(opts.csrf === false ? {} : { "x-csrf-token": this.csrf }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = response.headers.get("set-cookie");
    if (set) this.cookie = set.split(";")[0];
    const data = await response.json();
    assert.equal(
      response.status,
      opts.expected || 200,
      `${path}: ${JSON.stringify(data)}`,
    );
    return data;
  }
  async login(email: string, password: string) {
    const v = await this.call("/login", { email, password });
    this.csrf = v.csrf;
    return this;
  }
}
let sequence = 0;
test("V1 regular reassignment can update future sessions while preserving historical teacher reports", async () => {
  const f = await fixture();
  await f.finish();
  await f.t.call(`/classes/${f.classid}/report`, {
    body: "DEMO old teacher history",
    submit: true,
  });
  const sub = await f.post("/users", {
    name: "DEMO new teacher",
    email: `replace-${f.suffix}@example.test`,
    role: "teacher",
    branch_id: f.branch,
    password: f.pass,
  });
  const future = await f.post("/classes", {
    batch_id: f.batch,
    scheduled_start: "2026-11-02T10:00",
    scheduled_end: "2026-11-02T10:45",
  });
  await f.admin.call(`/batches/${f.batch}/assignments`, {
    teacher_id: sub,
    zimmadar_id: f.zimm,
    expected_teacher_id: f.teacher,
    expected_zimmadar_id: f.zimm,
    reason: "DEMO future assignment",
    update_scheduled: true,
  });
  const list = await f.admin.call("/classes");
  assert.equal(list.find((cl: any) => cl.id === future).actual_teacher_id, sub);
  assert.equal(
    list.find((cl: any) => cl.id === f.classid).actual_teacher_id,
    f.teacher,
  );
  assert.equal(
    (await f.t.call(`/classes/${f.classid}/report`)).report.body,
    "DEMO old teacher history",
  );
  assert.equal(
    (await f.z.call(`/classes/${future}/schedule-history`)).length,
    1,
  );
});
test("V1 academic dates are branch-scoped and cannot hide held enrollment history", async () => {
  const f = await fixture(),
    other = await fixture();
  await f.finish();
  const session = await f.admin.call("/academic-sessions", {
    branch_id: f.branch,
    label: "DEMO 2026 " + f.suffix,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
  });
  await f.admin.call(`/courses/${f.course}/settings`, {
    start_date: "2026-01-01",
    end_date: "2026-12-31",
  });
  await f.admin.call(
    `/batches/${other.batch}/settings`,
    {
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      academic_session_id: session.id,
    },
    { expected: 400 },
  );
  await f.admin.call(`/batches/${f.batch}/settings`, {
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    academic_session_id: session.id,
  });
  await f.admin.call(
    "/classes",
    {
      batch_id: f.batch,
      scheduled_start: "2027-01-01T10:00",
      scheduled_end: "2027-01-01T11:00",
    },
    { expected: 409 },
  );
  await f.admin.call(
    `/enrollments/${f.enr}/status`,
    {
      status: "completed",
      expected_status: "active",
      end_date: "2026-10-30",
      reason: "DEMO invalid backdate",
    },
    { expected: 409 },
  );
  await f.admin.call(
    `/courses/${f.course}/settings`,
    { start_date: "2026-01-01", end_date: "2026-10-31" },
    { expected: 409 },
  );
});
test("V1 Guardian admission is own-family, assessment-gated and accepted once into enrollment", async () => {
  const f = await fixture(),
    other = await fixture();
  const payload = {
    family_id: f.fam,
    course_id: f.course,
    student_name: "DEMO New Applicant",
    birth_date: "2016-01-01",
    academic_level: "Beginner",
    contact_phone: "DEMO phone only",
    country: "Bangladesh",
    method: "assessment",
    request_id: randomUUID(),
  };
  await other.g.call("/admissions", payload, { expected: 403 });
  const a = await f.g.call("/admissions", payload);
  assert.equal((await f.g.call("/admissions", payload)).id, a.id);
  await f.g.call(
    "/admissions",
    { ...payload, student_name: "Changed request" },
    { expected: 409 },
  );
  const accept = {
    batch_id: f.batch,
    start_date: "2026-01-01",
    placement_note: "Age and level manually reviewed",
    expected_revision: 1,
  };
  await f.g.call(`/admissions/${a.id}/accept`, accept, { expected: 403 });
  await f.admin.call(`/admissions/${a.id}/accept`, accept, { expected: 400 });
  const results = await Promise.all([
    f.admin.call(`/admissions/${a.id}/accept`, {
      ...accept,
      assessment_note: "Approved oral assessment recorded",
    }),
    f.admin.call(`/admissions/${a.id}/accept`, {
      ...accept,
      assessment_note: "Approved oral assessment recorded",
    }),
  ]);
  assert.equal(results[0].enrollment_id, results[1].enrollment_id);
  assert.ok(
    (await f.g.call("/enrollments")).some(
      (e: any) => e.id === results[0].enrollment_id,
    ),
  );
  assert.ok(
    !(await other.g.call("/admissions")).some((r: any) => r.id === a.id),
  );
  assert.ok(!("assessment_note" in (await f.g.call("/admissions"))[0]));
});
test("V1 weekly multi-slot generation is retry-safe after reschedule/cancel and rejects conflicts", async () => {
  const f = await fixture();
  const routine = await f.admin.call("/routines", {
    batch_id: f.batch,
    weekday: 1,
    start_time: "10:00",
    end_time: "10:45",
    from_date: "2026-11-02",
    until_date: "2026-11-09",
  });
  const range = { from_date: "2026-11-02", until_date: "2026-11-09" };
  const generated = await f.admin.call(
    `/routines/${routine.id}/generate`,
    range,
  );
  assert.equal(generated.created, 2);
  assert.equal(
    (await f.admin.call(`/routines/${routine.id}/generate`, range)).existing,
    2,
  );
  const cl = (await f.z.call("/classes")).find(
    (c: any) => c.routine_id === routine.id,
  );
  await f.t.call(
    `/classes/${cl.id}/cancel`,
    { reason: "DEMO absence", expected_start: cl.scheduled_start },
    { expected: 403 },
  );
  await f.admin.call(
    `/classes/${cl.id}/cancel`,
    { reason: "DEMO absence", expected_start: cl.scheduled_start },
    { expected: 403 },
  );
  await f.z.call(`/classes/${cl.id}/reschedule`, {
    reason: "DEMO agreed time",
    expected_start: cl.scheduled_start,
    scheduled_start: "2026-11-10T10:00",
    scheduled_end: "2026-11-10T10:45",
  });
  assert.equal(
    (await f.admin.call(`/routines/${routine.id}/generate`, range)).created,
    0,
  );
  await f.admin.call(
    "/classes",
    {
      batch_id: f.batch,
      scheduled_start: "2026-11-10T10:15",
      scheduled_end: "2026-11-10T11:00",
    },
    { expected: 409 },
  );
  const changed = (await f.z.call("/classes")).find((c: any) => c.id === cl.id);
  await f.z.call(`/classes/${cl.id}/cancel`, {
    reason: "DEMO cancelled",
    expected_start: changed.scheduled_start,
    expected_revision: changed.schedule_revision,
  });
  assert.equal(
    (await f.admin.call(`/routines/${routine.id}/generate`, range)).created,
    0,
  );
  assert.equal(
    (await f.z.call(`/classes/${cl.id}/schedule-history`)).length,
    2,
  );
  await f.admin.call(`/routines/${routine.id}/stop`, {});
  await f.admin.call(`/routines/${routine.id}/generate`, range, {
    expected: 409,
  });
});
test("V1 substitute owns its session/report and assignment change preserves old teaching ownership", async () => {
  const f = await fixture();
  const teacher2 = await f.post("/users", {
    email: `sub-${f.suffix}@example.test`,
    name: "DEMO Substitute",
    password: f.pass,
    role: "teacher",
    branch_id: f.branch,
  });
  const sub = await new Client().login(`sub-${f.suffix}@example.test`, f.pass);
  const cl = (await f.z.call("/classes")).find((c: any) => c.id === f.classid);
  await f.z.call(`/classes/${cl.id}/substitute`, {
    teacher_id: teacher2,
    reason: "DEMO regular teacher absent",
    expected_start: cl.scheduled_start,
  });
  await f.z.call(
    `/classes/${cl.id}/substitute`,
    {
      teacher_id: f.teacher,
      reason: "DEMO stale substitute",
      expected_start: cl.scheduled_start,
      expected_revision: 0,
    },
    { expected: 409 },
  );
  assert.ok((await sub.call("/enrollments")).some((e: any) => e.id === f.enr));
  await f.t.call(`/classes/${cl.id}/start`, {}, { expected: 403 });
  await sub.call(`/classes/${cl.id}/start`, {});
  await sub.call(`/classes/${cl.id}/end`, {});
  await sub.call(`/classes/${cl.id}/report`, {
    body: "DEMO substitute report",
    submit: true,
  });
  await f.admin.call(`/batches/${f.batch}/assignments`, {
    teacher_id: teacher2,
    zimmadar_id: f.zimm,
    expected_teacher_id: f.teacher,
    expected_zimmadar_id: f.zimm,
    reason: "DEMO regular reassignment",
  });
  assert.equal(
    (await sub.call(`/classes/${cl.id}/report`)).report.body,
    "DEMO substitute report",
  );
  assert.equal(
    (await f.admin.call(`/batches/${f.batch}/assignments`)).length,
    1,
  );
  await f.admin.call(
    `/batches/${f.batch}/assignments`,
    {
      teacher_id: f.teacher,
      zimmadar_id: f.zimm,
      expected_teacher_id: f.teacher,
      expected_zimmadar_id: f.zimm,
      reason: "Stale change",
    },
    { expected: 409 },
  );
});
test("V1 course template versions bind to first report and terminal lifecycle keeps academic history", async () => {
  const f = await fixture();
  await f.finish();
  await f.admin.call(`/courses/${f.course}/report-templates`, {
    prompt: "DEMO lesson:\nHomework:",
    expected_version: 0,
  });
  assert.equal(
    (await f.t.call(`/classes/${f.classid}/report`)).template.version,
    1,
  );
  await f.t.call(`/classes/${f.classid}/report`, {
    body: "DEMO lesson completed",
    submit: true,
  });
  await f.admin.call(`/courses/${f.course}/report-templates`, {
    prompt: "DEMO new form",
    expected_version: 1,
  });
  let detail = await f.z.call(`/classes/${f.classid}/report`);
  await f.z.call(`/reports/${detail.report.id}/review`, {
    action: "return_report",
    reason: "Add homework",
  });
  await f.t.call(`/classes/${f.classid}/report`, {
    body: "DEMO lesson and homework",
    submit: true,
  });
  detail = await f.t.call(`/classes/${f.classid}/report`);
  assert.equal(detail.template.version, 1);
  assert.equal(detail.history.length, 3);
  await f.admin.call(
    `/enrollments/${f.enr}/status`,
    {
      status: "completed",
      expected_status: "active",
      end_date: null,
      reason: "DEMO course completed",
    },
    { expected: 400 },
  );
  await f.admin.call(`/enrollments/${f.enr}/status`, {
    status: "completed",
    expected_status: "active",
    end_date: "2026-11-01",
    reason: "DEMO course completed",
  });
  assert.equal(
    (await f.g.call("/enrollments")).find((e: any) => e.id === f.enr).status,
    "completed",
  );
  assert.equal(
    (await f.t.call(`/classes/${f.classid}/report`)).report.body,
    "DEMO lesson and homework",
  );
  assert.equal(
    (await f.admin.call(`/enrollments/${f.enr}/status-history`)).length,
    1,
  );
});
test("Hostinger LiteSpeed require() loader can start and gracefully stop the ESM server", async () => {
  const child = spawn(
    process.execPath,
    [
      "-e",
      "require('./dist/src/server.js'); process.on('message', m => { if (m === 'stop') process.emit('SIGTERM'); });",
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: "production",
        ACADEMY_SECURE_COOKIES: "1",
        PORT: "0",
      },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    },
  );
  let output = "",
    errors = "";
  child.stderr!.on("data", (chunk) => {
    errors += chunk;
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Server did not start: " + errors)),
        10000,
      );
      child.stdout!.on("data", (chunk) => {
        output += chunk;
        if (output.includes("Academy staging server started")) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.once("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
      child.once("exit", (code) => {
        clearTimeout(timer);
        if (!output.includes("Academy staging server started"))
          reject(new Error(`Loader exited ${code}: ${errors}`));
      });
    });
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      const exit = once(child, "exit");
      if (output.includes("Academy staging server started")) child.send("stop");
      else child.kill();
      await exit;
    }
  }
  assert.equal(child.exitCode, 0);
});
test("D-055 timestamp validation and millisecond evidence survive HTTP writes", async () => {
  const f = await fixture();
  await f.admin.call(
    "/classes",
    {
      batch_id: f.batch,
      scheduled_start: "2026-02-30T18:00",
      scheduled_end: "2026-03-02T19:00",
    },
    { expected: 400 },
  );
  await f.finish("2026-10-31T18:00:00+06:00", "2026-10-31T18:50:00+06:00");
  const attendance = await f.t.call(`/classes/${f.classid}/attendance`, {
    enrollment_id: f.enr,
    status: "Present",
    join_time: "2026-10-31T18:15:00.001",
  });
  assert.equal(attendance.status, "Late");
  const saved = await store.read((c) =>
    rows(c, "SELECT join_time FROM attendance WHERE id=?", [attendance.id]),
  );
  assert.equal(saved[0].join_time, "2026-10-31T18:15:00.001+06:00");
  await f.t.call(
    `/classes/${f.classid}/attendance`,
    {
      enrollment_id: f.enr,
      status: "Present",
      join_time: "2026-10-31T18:15:00.000001",
    },
    { expected: 400 },
  );
});
test("AM-08 no alert after a submission commits between snapshot and class lock", async () => {
  const f = await fixture();
  await f.finish();
  let reached!: () => void, resume!: () => void;
  const snapshotTaken = new Promise<void>((r) => (reached = r)),
    release = new Promise<void>((r) => (resume = r));
  class PausedStore extends Store {
    override transaction<T>(fn: (c: PoolConnection) => Promise<T>): Promise<T> {
      return store.transaction((c) =>
        fn(
          new Proxy(c, {
            get(target, key) {
              if (key === "execute")
                return async (sql: string, args: any[]) => {
                  const result = await target.execute(sql, args);
                  if (sql.startsWith("SELECT s.id class_id")) {
                    reached();
                    await release;
                  }
                  return result;
                };
              const v = Reflect.get(target, key);
              return typeof v === "function" ? v.bind(target) : v;
            },
          }),
        ),
      );
    }
  }
  const pending = processAlerts(
    new PausedStore(store.pool),
    new Date("2026-11-01T12:05:00+06:00"),
  );
  try {
    await snapshotTaken;
    await f.t.call(`/classes/${f.classid}/report`, {
      body: "Submitted before alert lock",
      submit: true,
    });
  } finally {
    resume();
  }
  assert.equal(
    (await pending).filter((v) => v.class_id === f.classid).length,
    0,
  );
});
test("reports.class_id has an enforced foreign key on the running SQL engine", async () => {
  const keys = await store.read((c) =>
    rows(
      c,
      "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='reports' AND COLUMN_NAME='class_id' AND REFERENCED_TABLE_NAME='class_sessions' AND REFERENCED_COLUMN_NAME='id'",
    ),
  );
  assert.ok(
    keys.length,
    "Report-to-class foreign key must be enforced, not merely parsed",
  );
  const f = await fixture();
  await assert.rejects(
    () =>
      store.transaction((c) =>
        write(
          c,
          "INSERT INTO reports(class_id,author_id,body,status,updated_at) VALUES (?,?,?,?,?)",
          [
            -1,
            f.teacher,
            "Synthetic orphan attempt",
            "draft",
            new Date().toISOString(),
          ],
        ),
      ),
    (e: any) => e.code === "ER_NO_REFERENCED_ROW_2",
  );
  assert.deepEqual(
    (
      await store.read((c) =>
        rows(c, "SELECT version FROM schema_migrations ORDER BY version"),
      )
    ).map((v) => v.version),
    ["001", "002", "003", "004", "005", "006", "007", "008", "009"],
  );
});
async function fixture() {
  const suffix = ++sequence,
    pass = "Synthetic password 123456!",
    email = `admin${suffix}@example.test`,
    h = await hashPassword(pass);
  await store.transaction((c) =>
    write(
      c,
      "INSERT INTO users(email,name,role,password_salt,password_hash,created_at) VALUES (?,?,?,?,?,?)",
      [
        email,
        "Test Admin",
        "central_admin",
        h.salt,
        h.hash,
        new Date().toISOString(),
      ],
    ),
  );
  const admin = await new Client().login(email, pass),
    post = async (path: string, d: any) => (await admin.call(path, d)).id;
  const branch = await post("/branches", { name: `Test Branch ${suffix}` });
  const teacher = await post("/users", {
    email: `teacher${suffix}@example.test`,
    name: "Test Teacher",
    role: "teacher",
    branch_id: branch,
    password: pass,
  });
  const zimm = await post("/users", {
    email: `zimm${suffix}@example.test`,
    name: "Test Zimmadar",
    role: "zimmadar",
    branch_id: branch,
    password: pass,
  });
  const guardian = await post("/users", {
    email: `guardian${suffix}@example.test`,
    name: "Test Guardian",
    role: "guardian_primary",
    branch_id: branch,
    password: pass,
  });
  const fam = await post("/families", {
      name: "Synthetic Family",
      branch_id: branch,
      guardian_user_id: guardian,
    }),
    student = await post("/students", {
      full_name: "Sample Child",
      family_id: fam,
    });
  const dep = await post("/departments", { branch_id: branch, name: "Nazera" }),
    course = await post("/courses", {
      department_id: dep,
      title: "Test Course",
      duration_type: "continuous",
    });
  const batch = await post("/batches", {
      course_id: course,
      label: "Group A",
      teacher_id: teacher,
      zimmadar_id: zimm,
    }),
    enr = await post("/enrollments", {
      student_id: student,
      batch_id: batch,
      start_date: "2026-01-01",
    });
  const classid = await post("/classes", {
    batch_id: batch,
    scheduled_start: "2026-10-31T18:00",
    scheduled_end: "2026-10-31T19:00",
  });
  const t = await new Client().login(`teacher${suffix}@example.test`, pass),
    z = await new Client().login(`zimm${suffix}@example.test`, pass),
    g = await new Client().login(`guardian${suffix}@example.test`, pass);
  const finish = async (
    start = "2026-10-31T22:50:00+06:00",
    end = "2026-10-31T23:10:00+06:00",
    held = 1,
  ) => {
    await store.transaction((c) =>
      write(
        c,
        "UPDATE class_sessions SET status='ended',actual_start=?,actual_end=?,held_verified=? WHERE id=?",
        [start, end, held, classid],
      ),
    );
  };
  return {
    admin,
    post,
    branch,
    teacher,
    zimm,
    guardian,
    fam,
    student,
    dep,
    course,
    batch,
    enr,
    classid,
    t,
    z,
    g,
    finish,
    pass,
    suffix,
  };
}
test("Part 1.2 schema inventory, engines, foreign keys and migration checksums match source", async () => {
  const actual = await store.read((c) =>
    rows(
      c,
      "SELECT TABLE_NAME name,ENGINE engine FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME",
    ),
  );
  assert.deepEqual(
    actual.map((r) => r.name).sort(),
    [
      "academic_sessions",
      "absence_escalations",
      "admission_applications",
      "announcements",
      "assessments",
      "assessment_marks",
      "assessment_mark_history",
      "attendance",
      "attendance_revisions",
      "attendance_corrections",
      "attendance_projections",
      "audit_events",
      "auth_sessions",
      "batches",
      "batch_assignment_history",
      "branches",
      "class_sessions",
      "class_schedule_events",
      "course_report_templates",
      "course_resources",
      "courses",
      "departments",
      "enrollments",
      "enrollment_status_history",
      "families",
      "family_guardians",
      "followup_cases",
      "followup_notes",
      "followup_requests",
      "followup_events",
      "homework",
      "login_throttles",
      "one_to_one_contracts",
      "one_to_one_packages",
      "package_minute_ledger",
      "password_reset_tokens",
      "payment_references",
      "published_progress",
      "report_alert_events",
      "report_revisions",
      "report_template_bindings",
      "reports",
      "schema_migrations",
      "session_role_bindings",
      "student_homework",
      "students",
      "student_leaves",
      "student_leave_history",
      "telegram_connections",
      "telegram_link_tokens",
      "teacher_payables",
      "tuition_invoices",
      "user_role_assignments",
      "users",
      "weekly_routines",
      "workflow_notifications",
    ].sort(),
  );
  assert.ok(actual.every((r) => r.engine === "InnoDB"));
  const keys = await store.read((c) =>
    rows(
      c,
      "SELECT TABLE_NAME table_name,COLUMN_NAME column_name,REFERENCED_TABLE_NAME parent FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL",
    ),
  );
  assert.equal(keys.length, 133);
  for (const [table, column, parent] of [
    ["students", "family_id", "families"],
    ["family_guardians", "user_id", "users"],
    ["enrollments", "student_id", "students"],
    ["enrollments", "batch_id", "batches"],
    ["attendance", "enrollment_id", "enrollments"],
    ["reports", "class_id", "class_sessions"],
    ["published_progress", "enrollment_id", "enrollments"],
    ["one_to_one_contracts", "enrollment_id", "enrollments"],
    ["one_to_one_contracts", "package_id", "one_to_one_packages"],
    ["package_minute_ledger", "contract_id", "one_to_one_contracts"],
    ["tuition_invoices", "contract_id", "one_to_one_contracts"],
    ["teacher_payables", "class_session_id", "class_sessions"],
  ])
    assert.ok(
      keys.some(
        (k) =>
          k.table_name === table &&
          k.column_name === column &&
          k.parent === parent,
      ),
      `${table}.${column}`,
    );
  const ledger = await store.read((c) =>
    rows(c, "SELECT version,checksum FROM schema_migrations ORDER BY version"),
  );
  const files = [
    "001_staging_core.sql",
    "002_report_class_foreign_key.sql",
    "003_published_progress.sql",
    "004_accounts_and_scopes.sql",
    "005_academic_operations.sql",
    "006_attendance_workflows.sql",
    "007_learning_records.sql",
    "008_support_and_finance_references.sql",
    "009_commercial_packages_and_ledger.sql",
  ];
  assert.deepEqual(
    ledger.map((r) => r.version),
    ["001", "002", "003", "004", "005", "006", "007", "008", "009"],
  );
  ledger.forEach((r, i) =>
    assert.equal(
      r.checksum,
      createHash("sha256")
        .update(readFileSync("migrations/" + files[i]))
        .digest("hex"),
    ),
  );
});

test("account status, password change and reset revoke sessions without changing academic records", async () => {
  const f = await fixture();
  await f.g.call(
    `/users/${f.teacher}/status`,
    { active: false, expected_active: true },
    { expected: 403 },
  );
  await f.admin.call(`/users/${f.teacher}/status`, {
    active: false,
    expected_active: true,
  });
  await f.t.call("/me", undefined, { expected: 401 });
  await f.admin.call(`/users/${f.teacher}/status`, {
    active: true,
    expected_active: false,
  });
  await f.t.login(`teacher${f.suffix}@example.test`, f.pass);
  await f.t.call(
    "/account/password",
    { current_password: "incorrect", password: "New synthetic password 123!" },
    { expected: 400 },
  );
  await f.t.call("/account/password", {
    current_password: f.pass,
    password: "New synthetic password 123!",
  });
  await f.t.call("/me", undefined, { expected: 401 });
  await f.t.login(
    `teacher${f.suffix}@example.test`,
    "New synthetic password 123!",
  );
  const reset = await f.admin.call(`/users/${f.teacher}/reset-link`, {});
  const resetResponse = await fetch(base + "/api/password/reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: reset.token, password: f.pass }),
  });
  assert.equal(resetResponse.status, 200);
  await f.t.call("/me", undefined, { expected: 401 });
  assert.equal(
    (
      await fetch(base + "/api/password/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: reset.token, password: f.pass }),
      })
    ).status,
    400,
  );
  await f.t.login(`teacher${f.suffix}@example.test`, f.pass);
  assert.equal(
    (await f.admin.call("/students")).find((s: any) => s.id === f.student)
      .family_id,
    f.fam,
  );
  const audit = await store.read((c) =>
    rows(
      c,
      "SELECT details FROM audit_events WHERE entity='user' AND entity_id=?",
      [f.teacher],
    ),
  );
  assert.ok(!JSON.stringify(audit).includes(reset.token));
  assert.ok(!JSON.stringify(audit).includes(f.pass));
  const me = await f.admin.call("/me");
  await f.admin.call(
    `/users/${me.id}/status`,
    { active: false, expected_active: true },
    { expected: 409 },
  );
});

test("department supervisor and role switch isolate same-branch departments and revoke active role sessions", async () => {
  const f = await fixture();
  await f.finish();
  await f.t.call(`/classes/${f.classid}/report`, {
    body: "Department-only report",
  });
  const dep2 = await f.post("/departments", {
    branch_id: f.branch,
    name: "Synthetic second department",
  });
  const course2 = await f.post("/courses", {
    department_id: dep2,
    title: "Synthetic second course",
  });
  const batch2 = await f.post("/batches", {
    course_id: course2,
    label: "Synthetic second batch",
    teacher_id: f.teacher,
    zimmadar_id: f.zimm,
  });
  const cl2 = await f.post("/classes", {
    batch_id: batch2,
    scheduled_start: "2026-11-01T18:00",
    scheduled_end: "2026-11-01T19:00",
  });
  const email = `supervisor${f.suffix}@example.test`;
  await f.post("/users", {
    email,
    name: "Synthetic Supervisor",
    role: "department_supervisor",
    branch_id: f.branch,
    department_id: f.dep,
    password: f.pass,
  });
  const supervisor = await new Client().login(email, f.pass);
  assert.deepEqual(
    (await supervisor.call("/departments")).map((d: any) => d.id),
    [f.dep],
  );
  assert.deepEqual(
    (await supervisor.call("/courses")).map((d: any) => d.id),
    [f.course],
  );
  assert.deepEqual(
    (await supervisor.call("/classes")).map((d: any) => d.id),
    [f.classid],
  );
  assert.equal((await supervisor.call("/reports")).length, 1);
  assert.equal(
    (await supervisor.call(`/classes/${f.classid}/report`)).report.body,
    "Department-only report",
  );
  await supervisor.call(`/classes/${cl2}/report`, undefined, { expected: 403 });
  await supervisor.call(
    `/classes/${f.classid}/verify-held`,
    {},
    { expected: 403 },
  );
  await supervisor.call("/users", {}, { expected: 403 });
  const grant = {
    role: "department_supervisor",
    branch_id: f.branch,
    department_id: f.dep,
  };
  await f.admin.call(`/users/${f.teacher}/roles`, grant);
  await f.admin.call(`/users/${f.teacher}/roles`, grant);
  const assignments = await f.admin.call(`/users/${f.teacher}/roles`);
  assert.equal(assignments.length, 1);
  const switched = await f.t.call("/account/role", {
    assignment_id: assignments[0].id,
  });
  f.t.csrf = switched.csrf;
  assert.equal((await f.t.call("/me")).role, "department_supervisor");
  assert.equal((await f.t.call("/classes")).length, 1);
  await f.admin.call(
    `/users/${f.teacher}/roles/${assignments[0].id}/revoke`,
    {},
  );
  await f.t.call("/me", undefined, { expected: 401 });
  await f.t.login(`teacher${f.suffix}@example.test`, f.pass);
  assert.equal((await f.t.call("/me")).role, "teacher");
});

test("Branch Admin cannot reset or disable a staff identity holding an additional privileged role", async () => {
  const f = await fixture();
  const email = `branch-account-${f.suffix}@example.test`;
  await f.post("/users", {
    email,
    name: "Synthetic Branch Admin",
    role: "branch_admin",
    branch_id: f.branch,
    password: f.pass,
  });
  const branch = await new Client().login(email, f.pass);
  const priorReset = await branch.call(`/users/${f.teacher}/reset-link`, {});
  await f.admin.call(`/users/${f.teacher}/roles`, {
    role: "central_admin",
    branch_id: null,
    department_id: null,
  });
  await branch.call(`/users/${f.teacher}/reset-link`, {}, { expected: 403 });
  assert.equal(
    (
      await fetch(base + "/api/password/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: priorReset.token, password: f.pass }),
      })
    ).status,
    400,
  );
  await branch.call(
    `/users/${f.teacher}/status`,
    { active: false, expected_active: true },
    { expected: 403 },
  );
  assert.equal((await f.t.call("/me")).role, "teacher");
});

test("durable login throttles and bounded cleanup work across requests", async () => {
  const email = `synthetic-throttle-${randomUUID()}@example.test`;
  for (let i = 0; i < 30; i++) await claimLogin(store, email, 1000);
  await assert.rejects(
    claimLogin(store, email, 1001),
    (e: any) => e.status === 429,
  );
  await claimLogin(store, email, 901001);
  const f = await fixture();
  const expired = "2000-01-01T00:00:00.000Z";
  await store.transaction((c) =>
    write(c, "UPDATE auth_sessions SET expires_at=? WHERE user_id=?", [
      expired,
      f.teacher,
    ]),
  );
  const cleaned = await cleanupAccounts(store);
  assert.ok(cleaned.sessions >= 1);
  assert.ok(cleaned.throttles >= 1);
  assert.ok((await f.admin.call("/me")).id);
  await f.t.call("/me", undefined, { expected: 401 });
});

test("scoped CSV export escapes spreadsheet formulas and audit pages exclude sensitive details", async () => {
  const f = await fixture();
  await f.post("/students", { family_id: f.fam, full_name: "=1+1" });
  const response = await fetch(base + "/api/exports/students.csv", {
    headers: { Cookie: f.admin.cookie },
  });
  assert.equal(response.status, 200);
  const csv = await response.text();
  assert.ok(csv.includes("'=1+1"));
  assert.ok(!csv.includes(f.pass));
  assert.equal(
    (
      await fetch(base + "/api/exports/students.csv", {
        headers: { Cookie: f.g.cookie },
      })
    ).status,
    403,
  );
  const p1 = await f.admin.call("/audit/page?limit=2");
  assert.equal(p1.items.length, 2);
  assert.ok(p1.next_before);
  assert.ok(p1.items.every((e: any) => !("details" in e)));
  const p2 = await f.admin.call("/audit/page?limit=2&before=" + p1.next_before);
  assert.ok(
    p2.items.every((e: any) => !p1.items.some((a: any) => a.id === e.id)),
  );
});

test("Part 1.3 expired sessions and deactivated accounts cannot authenticate", async () => {
  const f = await fixture();
  await store.transaction((c) =>
    write(
      c,
      "UPDATE auth_sessions SET expires_at='2000-01-01T00:00:00.000Z' WHERE user_id=?",
      [f.teacher],
    ),
  );
  await f.t.call("/me", undefined, { expected: 401 });
  await store.transaction((c) =>
    write(c, "UPDATE users SET active=0 WHERE id=?", [f.guardian]),
  );
  await f.g.call("/me", undefined, { expected: 401 });
  await new Client().call(
    "/login",
    { email: `guardian${f.suffix}@example.test`, password: f.pass },
    { expected: 401 },
  );
});

test("Part 1.3 family guardian linking is scoped, active-role checked and retry safe", async () => {
  const f = await fixture(),
    other = await fixture();
  const path = `/families/${f.fam}/guardians`;
  for (const client of [f.t, f.z, f.g]) {
    await client.call(path, undefined, { expected: 403 });
    await client.call(
      path,
      { guardian_user_id: f.guardian },
      { expected: 403 },
    );
  }
  await f.admin.call(path, { guardian_user_id: f.teacher }, { expected: 400 });
  await f.admin.call(
    path,
    { guardian_user_id: other.guardian },
    { expected: 400 },
  );
  const email = `secondary-setup-${f.suffix}@example.test`;
  const secondary = await f.post("/users", {
    email,
    name: "Synthetic Secondary",
    role: "guardian_secondary",
    branch_id: f.branch,
    password: f.pass,
  });
  await f.admin.call(
    path,
    { guardian_user_id: secondary },
    { csrf: false, expected: 403 },
  );
  const linked = await Promise.all([
    f.admin.call(path, { guardian_user_id: secondary }),
    f.admin.call(path, { guardian_user_id: secondary }),
  ]);
  assert.deepEqual(linked.map((r) => r.already_linked).sort(), [false, true]);
  assert.equal((await f.admin.call(path)).length, 2);
  const audit = await store.read((c) =>
    rows(
      c,
      "SELECT id FROM audit_events WHERE entity='family' AND entity_id=? AND action='link_guardian'",
      [f.fam],
    ),
  );
  assert.equal(audit.length, 1);
  const secondaryClient = await new Client().login(email, f.pass);
  assert.deepEqual(
    (await secondaryClient.call("/students")).map((s: any) => s.id),
    [f.student],
  );
  await secondaryClient.call(
    path,
    { guardian_user_id: f.guardian },
    { expected: 403 },
  );
  const baEmail = `family-ba-${f.suffix}@example.test`;
  await f.post("/users", {
    email: baEmail,
    name: "Synthetic Branch Admin",
    role: "branch_admin",
    branch_id: f.branch,
    password: f.pass,
  });
  const ba = await new Client().login(baEmail, f.pass);
  assert.equal((await ba.call(path)).length, 2);
  await ba.call(`/families/${other.fam}/guardians`, undefined, {
    expected: 403,
  });
  await ba.call(
    `/families/${other.fam}/guardians`,
    { guardian_user_id: other.guardian },
    { expected: 403 },
  );
  await ba.call("/branches", { name: "Forbidden branch" }, { expected: 403 });
  await store.transaction((c) =>
    write(c, "UPDATE users SET active=0 WHERE id=?", [secondary]),
  );
  await f.admin.call(path, { guardian_user_id: secondary }, { expected: 400 });
  await f.admin.call(
    "/families",
    {
      name: "Inactive link rejected",
      branch_id: f.branch,
      guardian_user_id: secondary,
    },
    { expected: 400 },
  );
});

test("Part 1.4–1.5 complete group and basic 1:1 academic journey reaches own-family Guardian summaries", async () => {
  const f = await fixture(),
    priorClock = clock.now;
  try {
    const child2 = await f.post("/students", {
      full_name: "Synthetic Second Child",
      family_id: f.fam,
    });
    const individual = await f.post("/batches", {
      course_id: f.course,
      label: "Synthetic Individual",
      delivery_mode: "one_to_one",
      teacher_id: f.teacher,
      zimmadar_id: f.zimm,
    });
    const enrollment2 = await f.post("/enrollments", {
      student_id: child2,
      batch_id: individual,
      start_date: "2026-01-01",
    });
    const class2 = await f.post("/classes", {
      batch_id: individual,
      scheduled_start: "2026-10-31T19:00",
      scheduled_end: "2026-10-31T19:45",
    });
    for (const [index, [classId, enrollment]] of [
      [f.classid, f.enr],
      [class2, enrollment2],
    ].entries()) {
      clock.now = new Date(`2026-10-31T${18 + index}:00:00+06:00`);
      await f.t.call(`/classes/${classId}/start`, {});
      clock.now = new Date(`2026-10-31T${18 + index}:45:00+06:00`);
      await f.t.call(`/classes/${classId}/end`, {});
      await f.z.call(`/classes/${classId}/verify-held`, {});
      await f.t.call(`/classes/${classId}/attendance`, {
        enrollment_id: enrollment,
        status: "Present",
      });
      await f.t.call(`/classes/${classId}/report`, {
        body: "INTERNAL ONLY: synthetic teaching evidence",
        expected_history_id: 0,
      });
      const draft = await f.t.call(`/classes/${classId}/report`);
      const submitted = await f.t.call(`/classes/${classId}/report`, {
        body: "INTERNAL ONLY: synthetic teaching evidence",
        submit: true,
        expected_history_id: draft.latest_history_id,
      });
      const detail = await f.z.call(`/classes/${classId}/report`);
      await f.z.call(`/reports/${submitted.id}/review`, {
        action: "approve",
        expected_history_id: detail.latest_history_id,
      });
      await f.z.call("/progress", {
        enrollment_id: enrollment,
        request_id: randomUUID(),
        title: "Synthetic family update",
        progress_summary: "Synthetic practice completed",
        homework_summary: "Synthetic practice task",
      });
    }
    assert.equal((await f.g.call("/students")).length, 2);
    assert.deepEqual(
      new Set(
        (await f.g.call("/enrollments")).map((e: any) => e.delivery_mode),
      ),
      new Set(["group", "one_to_one"]),
    );
    const attendance = await f.g.call("/attendance/monthly?month=2026-10");
    assert.equal(attendance.length, 2);
    assert.ok(
      attendance.every(
        (a: any) =>
          a.held_classes === 1 &&
          a.present === 1 &&
          a.attendance_percent === 100,
      ),
    );
    const summaries = await f.g.call("/progress");
    assert.equal(summaries.length, 2);
    assert.ok(!JSON.stringify(summaries).includes("INTERNAL ONLY"));
    assert.deepEqual(await f.g.call("/reports"), []);
    await f.g.call(`/classes/${f.classid}/report`, undefined, {
      expected: 403,
    });
  } finally {
    clock.now = priorClock;
  }
});

test("V1 single-course fixed-duration complete academic journey through completion lifecycle", async () => {
  const f = await fixture(),
    priorClock = clock.now;
  try {
    const singleDep = await f.post("/departments", {
      branch_id: f.branch,
      name: `Single Course Dept ${f.suffix}`,
      category: "single_course",
    });
    const singleCourse = await f.post("/courses", {
      department_id: singleDep,
      title: `Short Tajweed Workshop ${f.suffix}`,
      duration_type: "fixed",
    });
    await f.admin.call(`/courses/${singleCourse}/settings`, {
      start_date: "2026-11-01",
      end_date: "2026-11-30",
    });
    const singleBatch = await f.post("/batches", {
      course_id: singleCourse,
      label: `Workshop Batch 1 ${f.suffix}`,
      teacher_id: f.teacher,
      zimmadar_id: f.zimm,
    });
    await f.admin.call(`/batches/${singleBatch}/settings`, {
      start_date: "2026-11-01",
      end_date: "2026-11-30",
    });
    await f.admin.call(`/courses/${singleCourse}/report-templates`, {
      prompt: "Tajweed criteria:\n1. Pronunciation\n2. Rules applied\n3. Fluency",
      expected_version: 0,
    });
    const app = await f.g.call("/admissions", {
      family_id: f.fam,
      student_id: f.student,
      course_id: singleCourse,
      student_name: "Sample Child",
      birth_date: "2015-05-10",
      academic_level: "Intermediate",
      contact_phone: "+8801700000000",
      country: "Bangladesh",
      method: "direct",
      request_id: randomUUID(),
    });
    const enrolled = await f.admin.call(`/admissions/${app.id}/accept`, {
      batch_id: singleBatch,
      start_date: "2026-11-01",
      end_date: "2026-11-30",
      placement_note: "Direct entry for fixed-term workshop",
      expected_revision: 1,
    });
    assert.ok(enrolled.enrollment_id);
    const routine = await f.admin.call("/routines", {
      batch_id: singleBatch,
      weekday: 0,
      start_time: "10:00",
      end_time: "11:00",
      from_date: "2026-11-01",
      until_date: "2026-11-15",
    });
    const gen = await f.admin.call(`/routines/${routine.id}/generate`, {
      from_date: "2026-11-01",
      until_date: "2026-11-15",
    });
    assert.ok(gen.created >= 2);
    const classes = (await f.admin.call("/classes")).filter(
      (c: any) => c.batch_id === singleBatch,
    );
    assert.ok(classes.length >= 2);
    const firstClass = classes[0];
    clock.now = new Date("2026-11-01T10:00:00+06:00");
    await f.t.call(`/classes/${firstClass.id}/start`, {});
    clock.now = new Date("2026-11-01T11:00:00+06:00");
    await f.t.call(`/classes/${firstClass.id}/end`, {});
    await f.z.call(`/classes/${firstClass.id}/verify-held`, {});
    await f.t.call(`/classes/${firstClass.id}/attendance`, {
      enrollment_id: enrolled.enrollment_id,
      status: "Present",
    });
    const reportData = await f.t.call(`/classes/${firstClass.id}/report`);
    assert.ok(reportData.template?.prompt?.includes("Tajweed criteria"));
    const submitted = await f.t.call(`/classes/${firstClass.id}/report`, {
      body: "Tajweed criteria:\n1. Pronunciation: Good\n2. Rules applied: Makharij verified\n3. Fluency: Steady",
      submit: true,
      expected_history_id: reportData.latest_history_id,
    });
    const reviewDetail = await f.z.call(`/classes/${firstClass.id}/report`);
    await f.z.call(`/reports/${submitted.id}/review`, {
      action: "approve",
      expected_history_id: reviewDetail.latest_history_id,
    });
    await f.z.call("/progress", {
      enrollment_id: enrolled.enrollment_id,
      request_id: randomUUID(),
      title: "Workshop Progress Update",
      progress_summary: "Mastered fundamental makharij",
      homework_summary: "Review surah Al-Fatiha verses 1-4 with tajweed rules",
    });
    const guardianEnrollments = await f.g.call("/enrollments");
    const workshopEnrollment = guardianEnrollments.find(
      (e: any) => e.id === enrolled.enrollment_id,
    );
    assert.ok(workshopEnrollment);
    assert.equal(workshopEnrollment.batch_name, `Workshop Batch 1 ${f.suffix}`);
    const guardianProgress = await f.g.call("/progress");
    assert.ok(
      guardianProgress.some(
        (p: any) =>
          p.enrollment_id === enrolled.enrollment_id &&
          p.title === "Workshop Progress Update",
      ),
    );
    await f.admin.call(`/enrollments/${enrolled.enrollment_id}/status`, {
      status: "completed",
      expected_status: "active",
      end_date: "2026-11-30",
      reason: "Workshop curriculum successfully concluded",
    });
    const finalEnrollments = await f.admin.call("/enrollments");
    const completedEnr = finalEnrollments.find(
      (e: any) => e.id === enrolled.enrollment_id,
    );
    assert.equal(completedEnr.status, "completed");
    const postProgress = await f.g.call("/progress");
    assert.ok(
      postProgress.some(
        (p: any) => p.enrollment_id === enrolled.enrollment_id,
      ),
    );
  } finally {
    clock.now = priorClock;
  }
});

test("V1 attendance: join-time verification, 15-minute boundary, direct correction vs Zimmadar review past 7-day cutoff", async () => {
  const f = await fixture(),
    priorClock = clock.now;
  try {
    const cl = await f.post("/classes", {
      batch_id: f.batch,
      scheduled_start: "2026-11-01T10:00",
      scheduled_end: "2026-11-01T11:00",
    });
    clock.now = new Date("2026-11-01T10:00:00+06:00");
    await f.t.call(`/classes/${cl}/start`, {});
    clock.now = new Date("2026-11-01T11:00:00+06:00");
    await f.t.call(`/classes/${cl}/end`, {});
    await f.z.call(`/classes/${cl}/verify-held`, {});

    // 1. Join time before start -> rejected with 400
    await f.t.call(
      `/classes/${cl}/attendance`,
      {
        enrollment_id: f.enr,
        status: "Present",
        join_time: "2026-11-01T09:59:59+06:00",
      },
      { expected: 400 },
    );

    // 2. Join time at exactly 15:00 after start -> Present
    clock.now = new Date("2026-11-01T11:05:00+06:00");
    const exact15 = await f.t.call(`/classes/${cl}/attendance`, {
      enrollment_id: f.enr,
      status: "Present",
      join_time: "2026-11-01T10:15:00+06:00",
      request_id: randomUUID(),
    });
    assert.equal(exact15.status, "Present");

    // 3. Direct correction within 7 days: Teacher corrects to Late with reason
    clock.now = new Date("2026-11-03T12:00:00+06:00");
    const directCorr = await f.t.call(`/classes/${cl}/attendance`, {
      enrollment_id: f.enr,
      status: "Late",
      join_time: "2026-11-01T10:16:00+06:00",
      reason: "Correcting join time according to logs",
      expected_revision: exact15.revision,
      request_id: randomUUID(),
    });
    assert.equal(directCorr.status, "Late");
    assert.equal(directCorr.corrected, true);

    // 4. Past 7 calendar days cutoff (class is 2026-11-01, cutoff is 2026-11-08 23:59:59 BD):
    clock.now = new Date("2026-11-09T10:00:00+06:00");
    const cutoffReq = await f.t.call(`/classes/${cl}/attendance`, {
      enrollment_id: f.enr,
      status: "Present",
      reason: "Late correction request after 7-day cutoff window",
      expected_revision: directCorr.revision,
      request_id: randomUUID(),
    });
    assert.equal(cutoffReq.pending_approval, true);

    // 5. Zimmadar reviews and approves correction
    const corrections = await f.z.call("/attendance-corrections");
    assert.ok(
      corrections.some(
        (c: any) => c.id === cutoffReq.id && c.status === "pending",
      ),
    );
    await f.z.call(`/attendance-corrections/${cutoffReq.id}/review`, {
      action: "approve",
      reason: "Approved late attendance correction evidence",
    });

    // 6. Verification: Attendance is updated
    const roster = await f.t.call(`/classes/${cl}/attendance`);
    const studentAtt = roster.find((a: any) => a.enrollment_id === f.enr);
    assert.equal(studentAtt.status, "Present");
  } finally {
    clock.now = priorClock;
  }
});

test("V1 student leave lifecycle: Guardian notice, Zimmadar review, extension supervisor approval, and retrospective/overlap gating", async () => {
  const f = await fixture(),
    priorClock = clock.now;
  try {
    // 1. Guardian submits leave notice for own child
    const reqId1 = randomUUID();
    const leave1 = await f.g.call("/leaves", {
      enrollment_id: f.enr,
      start_date: "2026-11-10",
      end_date: "2026-11-15",
      reason: "Family travel to village",
      request_id: reqId1,
    });
    assert.ok(leave1.id);

    // Replay with same request_id -> idempotent
    const replay = await f.g.call("/leaves", {
      enrollment_id: f.enr,
      start_date: "2026-11-10",
      end_date: "2026-11-15",
      reason: "Family travel to village",
      request_id: reqId1,
    });
    assert.equal(replay.already_requested, true);

    // 2. More than 14 days without extension -> rejected with 400
    await f.g.call(
      "/leaves",
      {
        enrollment_id: f.enr,
        start_date: "2026-11-10",
        end_date: "2026-11-28",
        reason: "Extended medical treatment",
        request_id: randomUUID(),
      },
      { expected: 400 },
    );

    // 3. Zimmadar reviews and approves regular leave
    const reviewRes = await f.z.call(`/leaves/${leave1.id}/review`, {
      action: "approve",
      reason: "Approved family leave",
      expected_revision: 1,
    });
    assert.equal(reviewRes.status, "approved");

    // 4. Overlapping leave -> rejected with 409 because overlappingAndRetroactiveLeave is gated
    await f.g.call("/leaves", {
      enrollment_id: f.enr,
      start_date: "2026-11-12",
      end_date: "2026-11-18",
      reason: "Overlapping notice",
      request_id: randomUUID(),
    });
    const allLeaves = await f.z.call("/leaves");
    const pendingOverlap = allLeaves.find(
      (l: any) => l.reason === "Overlapping notice",
    );
    await f.z.call(
      `/leaves/${pendingOverlap.id}/review`,
      {
        action: "approve",
        reason: "Trying to approve overlap",
        expected_revision: 1,
      },
      { expected: 409 },
    );

    // 5. Valid extension of approved leave from original start date:
    const extReq = await f.g.call("/leaves", {
      enrollment_id: f.enr,
      start_date: "2026-11-10",
      end_date: "2026-11-20",
      extension_of: leave1.id,
      reason: "Trip extended due to urgent family matters",
      request_id: randomUUID(),
    });
    assert.ok(extReq.id);

    // Zimmadar approves extension -> status becomes supervisor_review
    const zimmExt = await f.z.call(`/leaves/${extReq.id}/review`, {
      action: "approve",
      reason: "Zimmadar recommends extension",
      expected_revision: 1,
    });
    assert.equal(zimmExt.status, "supervisor_review");

    // Department supervisor approves extension
    const supervisor = await f.post("/users", {
      email: `sup${f.suffix}@example.test`,
      name: "Dept Supervisor",
      role: "department_supervisor",
      branch_id: f.branch,
      department_id: f.dep,
      password: f.pass,
    });
    const supClient = await new Client().login(
      `sup${f.suffix}@example.test`,
      f.pass,
    );
    // Department supervisor approval of overlapping extension is gated pending policy (409)
    await supClient.call(
      `/leaves/${extReq.id}/review`,
      {
        action: "approve",
        reason: "Supervisor approval attempted",
        expected_revision: 2,
      },
      { expected: 409 },
    );

    // 6. Guardian views own child's leaves (including approved leave1 and supervisor_review extension)
    const guardianLeaves = await f.g.call("/leaves");
    assert.ok(
      guardianLeaves.some(
        (l: any) => l.id === leave1.id && l.status === "approved",
      ),
    );
    assert.ok(
      guardianLeaves.some(
        (l: any) => l.id === extReq.id && l.status === "supervisor_review",
      ),
    );
  } finally {
    clock.now = priorClock;
  }
});

test("V1 absence streak follow-up: 7 consecutive absences create teacher task, contact note completes it, and second seven escalates", async () => {
  const f = await fixture(),
    priorClock = clock.now;
  try {
    for (let day = 1; day <= 7; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const cl = await f.post("/classes", {
        batch_id: f.batch,
        scheduled_start: `2026-11-${dayStr}T10:00`,
        scheduled_end: `2026-11-${dayStr}T11:00`,
      });
      clock.now = new Date(`2026-11-${dayStr}T10:00:00+06:00`);
      await f.t.call(`/classes/${cl}/start`, {});
      clock.now = new Date(`2026-11-${dayStr}T11:00:00+06:00`);
      await f.t.call(`/classes/${cl}/end`, {});
      await f.z.call(`/classes/${cl}/verify-held`, {});
      await f.t.call(`/classes/${cl}/attendance`, {
        enrollment_id: f.enr,
        status: "Absent",
      });
    }

    const followups = await f.t.call("/followups");
    const absenceCase = followups.items.find(
      (c: any) => c.enrollment_id === f.enr && c.kind === "absence",
    );
    assert.ok(absenceCase, "7 absences must create an absence followup case");
    assert.equal(absenceCase.status, "pending");
    assert.equal(absenceCase.assignee_id, f.teacher);

    clock.now = new Date("2026-11-08T12:00:00+06:00");
    await f.t.call(`/followups/${absenceCase.id}/note`, {
      contact_date: "2026-11-08",
      guardian_statement: "Guardian mentioned illness in the family",
      next_steps: "Student will resume attending tomorrow",
      note: "Followed up via phone call",
      expected_revision: absenceCase.revision,
      request_id: randomUUID(),
    });

    const updated = await f.t.call(`/followups/${absenceCase.id}`);
    assert.equal(updated.case.status, "completed");
    assert.equal(updated.notes.length, 1);
    assert.equal(
      updated.notes[0].guardian_statement,
      "Guardian mentioned illness in the family",
    );

    for (let day = 9; day <= 15; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const cl = await f.post("/classes", {
        batch_id: f.batch,
        scheduled_start: `2026-11-${dayStr}T10:00`,
        scheduled_end: `2026-11-${dayStr}T11:00`,
      });
      clock.now = new Date(`2026-11-${dayStr}T10:00:00+06:00`);
      await f.t.call(`/classes/${cl}/start`, {});
      clock.now = new Date(`2026-11-${dayStr}T11:00:00+06:00`);
      await f.t.call(`/classes/${cl}/end`, {});
      await f.z.call(`/classes/${cl}/verify-held`, {});
      await f.t.call(`/classes/${cl}/attendance`, {
        enrollment_id: f.enr,
        status: "Absent",
      });
    }

    const [escalation] = await store.read((c) =>
      rows(
        c,
        "SELECT * FROM absence_escalations WHERE enrollment_id=? AND active=1",
        [f.enr],
      ),
    );
    assert.ok(
      escalation,
      "Second seven absences must trigger active escalation",
    );
    assert.equal(escalation.first_case_id, absenceCase.id);

    const resetClass = await f.post("/classes", {
      batch_id: f.batch,
      scheduled_start: "2026-11-16T10:00",
      scheduled_end: "2026-11-16T11:00",
    });
    clock.now = new Date("2026-11-16T10:00:00+06:00");
    await f.t.call(`/classes/${resetClass}/start`, {});
    clock.now = new Date("2026-11-16T11:00:00+06:00");
    await f.t.call(`/classes/${resetClass}/end`, {});
    await f.z.call(`/classes/${resetClass}/verify-held`, {});
    await f.t.call(`/classes/${resetClass}/attendance`, {
      enrollment_id: f.enr,
      status: "Present",
    });

    const [afterReset] = await store.read((c) =>
      rows(
        c,
        "SELECT * FROM absence_escalations WHERE enrollment_id=? AND active=1",
        [f.enr],
      ),
    );
    assert.equal(
      afterReset,
      undefined,
      "Present attendance deactivates absence escalation",
    );
  } finally {
    clock.now = priorClock;
  }
});

test("V1 low attendance (<75%): 3 held class threshold, missing-data hold, leave deadline pause and resume", async () => {
  const f = await fixture(),
    priorClock = clock.now;
  try {
    for (let i = 1; i <= 2; i++) {
      const cl = await f.post("/classes", {
        batch_id: f.batch,
        scheduled_start: `2026-11-0${i}T10:00`,
        scheduled_end: `2026-11-0${i}T11:00`,
      });
      clock.now = new Date(`2026-11-0${i}T10:00:00+06:00`);
      await f.t.call(`/classes/${cl}/start`, {});
      clock.now = new Date(`2026-11-0${i}T11:00:00+06:00`);
      await f.t.call(`/classes/${cl}/end`, {});
      await f.z.call(`/classes/${cl}/verify-held`, {});
      await f.t.call(`/classes/${cl}/attendance`, {
        enrollment_id: f.enr,
        status: i === 1 ? "Present" : "Absent",
      });
    }
    let cases = await f.t.call("/followups");
    assert.ok(
      !cases.items.some((c: any) => c.kind === "low_attendance"),
      "2 classes must not trigger low attendance",
    );

    const cl3 = await f.post("/classes", {
      batch_id: f.batch,
      scheduled_start: "2026-11-03T10:00",
      scheduled_end: "2026-11-03T11:00",
    });
    clock.now = new Date("2026-11-03T10:00:00+06:00");
    await f.t.call(`/classes/${cl3}/start`, {});
    clock.now = new Date("2026-11-03T11:00:00+06:00");
    await f.t.call(`/classes/${cl3}/end`, {});
    await f.z.call(`/classes/${cl3}/verify-held`, {});

    cases = await f.t.call("/followups");
    assert.ok(
      !cases.items.some((c: any) => c.kind === "low_attendance"),
      "Unrecorded attendance holds low attendance case creation",
    );

    clock.now = new Date("2026-11-03T12:00:00+06:00");
    await f.t.call(`/classes/${cl3}/attendance`, {
      enrollment_id: f.enr,
      status: "Absent",
    });
    cases = await f.t.call("/followups");
    const lowCase = cases.items.find(
      (c: any) => c.kind === "low_attendance" && c.enrollment_id === f.enr,
    );
    assert.ok(
      lowCase,
      "1 Present / 2 Absent out of 3 held must trigger low_attendance case",
    );
    assert.equal(lowCase.status, "pending");
    assert.ok(lowCase.due_at, "Must have due_at");
    assert.ok(lowCase.escalation_at, "Must have escalation_at");

    clock.now = new Date("2026-11-04T10:00:00+06:00");
    const leave = await f.g.call("/leaves", {
      enrollment_id: f.enr,
      start_date: "2026-11-04",
      end_date: "2026-11-10",
      reason: "Emergency recovery leave",
      request_id: randomUUID(),
    });
    await f.z.call(`/leaves/${leave.id}/review`, {
      action: "approve",
      reason: "Approved medical leave",
      expected_revision: 1,
    });
    const pausedCase = (await f.t.call("/followups")).items.find(
      (c: any) => c.id === lowCase.id,
    );
    assert.equal(
      pausedCase.paused,
      1,
      "Active leave must pause pending low attendance case",
    );

    clock.now = new Date("2026-11-11T10:00:00+06:00");
    await store.transaction((c) => reconcileEnrollment(c, f.enr, clock.now));
    const resumedCase = (await f.t.call("/followups")).items.find(
      (c: any) => c.id === lowCase.id,
    );
    assert.equal(resumedCase.paused, 0, "Case resumes after leave ends");

    await f.t.call(`/followups/${lowCase.id}/note`, {
      contact_date: "2026-11-11",
      guardian_statement:
        "Guardian confirmed student will attend all upcoming classes",
      next_steps: "Monitoring weekly attendance",
      note: "Counseling provided",
      expected_revision: resumedCase.revision,
      request_id: randomUUID(),
    });

    const reopened = await f.t.call(`/followups/${lowCase.id}/reopen`, {
      expected_revision: resumedCase.revision + 1,
      request_id: randomUUID(),
    });
    assert.equal(reopened.ok, true);
    const postReopen = (await f.t.call("/followups")).items.find(
      (c: any) => c.id === lowCase.id,
    );
    assert.equal(postReopen.status, "pending");
    assert.equal(postReopen.reopen_count, 1);
  } finally {
    clock.now = priorClock;
  }
});

test("report detail exposes body/history only to authorized staff, never Guardians", async () => {
  const f = await fixture(),
    other = await fixture();
  await f.finish();
  const empty = await f.t.call(`/classes/${f.classid}/report`);
  assert.equal(empty.report, null);
  assert.equal(empty.latest_history_id, 0);
  await f.t.call(`/classes/${f.classid}/report`, {
    body: "Private lesson draft",
    expected_history_id: 0,
  });
  const detail = await f.t.call(`/classes/${f.classid}/report`);
  assert.equal(detail.report.body, "Private lesson draft");
  assert.equal(detail.history.length, 1);
  assert.equal(detail.history[0].event, "draft");
  assert.equal(detail.latest_history_id, detail.history[0].id);
  for (const client of [f.admin, f.z])
    assert.equal(
      (await client.call(`/classes/${f.classid}/report`)).report.body,
      "Private lesson draft",
    );
  for (const client of [f.g, other.t, other.z])
    await client.call(`/classes/${f.classid}/report`, undefined, {
      expected: 403,
    });
  const branchAdminEmail = `branch-report-${f.suffix}@example.test`;
  await f.post("/users", {
    email: branchAdminEmail,
    name: "Synthetic Branch Admin",
    role: "branch_admin",
    branch_id: f.branch,
    password: f.pass,
  });
  const ba = await new Client().login(branchAdminEmail, f.pass);
  assert.equal(
    (await ba.call(`/classes/${f.classid}/report`)).report.body,
    "Private lesson draft",
  );
  await ba.call(`/classes/${other.classid}/report`, undefined, {
    expected: 403,
  });
  for (const [role, email] of [
    ["teacher", `unassigned-report-${f.suffix}@example.test`],
    ["zimmadar", `unassigned-zimm-report-${f.suffix}@example.test`],
    ["guardian_secondary", `secondary-report-${f.suffix}@example.test`],
  ]) {
    await f.post("/users", {
      email,
      name: "Synthetic denied account",
      role,
      branch_id: f.branch,
      password: f.pass,
    });
    const client = await new Client().login(email, f.pass);
    await client.call(`/classes/${f.classid}/report`, undefined, {
      expected: 403,
    });
  }
  await f.t.call("/classes/not-a-number/report", undefined, { expected: 422 });
  await new Client().call(`/classes/${f.classid}/report`, undefined, {
    expected: 401,
  });
});

test("report version tokens reject stale drafts, creation and reviews without losing history", async () => {
  const f = await fixture();
  await f.finish();
  const path = `/classes/${f.classid}/report`;
  await f.t.call(path, { body: "First draft", expected_history_id: 0 });
  await f.t.call(
    path,
    { body: "Stale create", expected_history_id: 0 },
    { expected: 409 },
  );
  const first = await f.t.call(path);
  await f.t.call(path, {
    body: "Submitted content",
    submit: true,
    expected_history_id: first.latest_history_id,
  });
  const submitted = await f.z.call(path);
  await f.z.call(
    `/reports/${submitted.report.id}/review`,
    { action: "approve", expected_history_id: first.latest_history_id },
    { expected: 409 },
  );
  await f.z.call(`/reports/${submitted.report.id}/review`, {
    action: "return_report",
    reason: "Add detail",
    expected_history_id: submitted.latest_history_id,
  });
  const returned = await f.t.call(path);
  assert.equal(returned.report.review_reason, "Add detail");
  await f.t.call(path, {
    body: "Revised draft",
    expected_history_id: returned.latest_history_id,
  });
  await f.t.call(
    path,
    {
      body: "Old tab overwrite",
      expected_history_id: returned.latest_history_id,
    },
    { expected: 409 },
  );
  const draft = await f.t.call(path);
  assert.equal(draft.report.review_reason, "Add detail");
  await f.t.call(path, {
    body: "Final revision",
    submit: true,
    expected_history_id: draft.latest_history_id,
  });
  const resubmitted = await f.z.call(path);
  await f.z.call(
    `/reports/${submitted.report.id}/review`,
    { action: "approve", expected_history_id: submitted.latest_history_id },
    { expected: 409 },
  );
  await f.z.call(`/reports/${submitted.report.id}/review`, {
    action: "approve",
    expected_history_id: resubmitted.latest_history_id,
  });
  const approved = await f.t.call(path);
  assert.equal(approved.report.status, "approved");
  assert.equal(approved.report.body, "Final revision");
  assert.equal(
    approved.report.first_submitted_at,
    submitted.report.first_submitted_at,
  );
  assert.deepEqual(
    approved.history.map((h: any) => h.event),
    ["draft", "submit", "return_report", "draft", "submit", "approve"],
  );
  await f.t.call(
    path,
    {
      body: "Forbidden approved edit",
      expected_history_id: approved.latest_history_id,
    },
    { expected: 409 },
  );
});

test("concurrent report edits with the same history token accept exactly one writer", async () => {
  const f = await fixture();
  await f.finish();
  const path = `/classes/${f.classid}/report`;
  await f.t.call(path, { body: "Original", expected_history_id: 0 });
  const initial = await f.t.call(path);
  const responses = await Promise.all(
    ["Tab A", "Tab B"].map((body) =>
      fetch(base + "/api" + path, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Cookie: f.t.cookie,
          "x-csrf-token": f.t.csrf,
        },
        body: JSON.stringify({
          body,
          expected_history_id: initial.latest_history_id,
        }),
      }),
    ),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  const saved = await f.t.call(path);
  assert.equal(saved.history.length, 2);
  assert.ok(["Tab A", "Tab B"].includes(saved.report.body));
});

test("published progress requires assigned Zimmadar and retries do not duplicate publication/audit", async () => {
  const f = await fixture(),
    other = await fixture();
  const payload = {
    enrollment_id: f.enr,
    request_id: randomUUID(),
    title: "Weekly update",
    progress_summary: "Guardian-safe progress",
    homework_summary: "Practice sample exercise",
  };
  for (const client of [f.admin, f.t, f.g, other.z])
    await client.call("/progress", payload, { expected: 403 });
  await f.z.call("/progress", payload, { csrf: false, expected: 403 });
  await f.z.call(
    "/progress",
    { ...payload, progress_summary: " " },
    { expected: 422 },
  );
  const [a, b] = await Promise.all([
    f.z.call("/progress", payload),
    f.z.call("/progress", payload),
  ]);
  assert.equal(a.id, b.id);
  await f.z.call(
    "/progress",
    { ...payload, title: "Changed retry" },
    { expected: 409 },
  );
  assert.equal(
    (
      await store.read((c) =>
        rows(
          c,
          "SELECT id FROM audit_events WHERE entity='published_progress' AND entity_id=?",
          [a.id],
        ),
      )
    ).length,
    1,
  );
  await f.finish();
  await f.t.call(`/classes/${f.classid}/report`, {
    body: "PRIVATE INTERNAL REPORT AND FOLLOW-UP",
    submit: true,
  });
  const publications = await f.g.call("/progress");
  assert.equal(publications.length, 1);
  assert.equal(publications[0].progress_summary, payload.progress_summary);
  assert.ok(!JSON.stringify(publications).includes("PRIVATE INTERNAL"));
  assert.deepEqual(
    Object.keys(publications[0]).sort(),
    [
      "id",
      "enrollment_id",
      "title",
      "progress_summary",
      "homework_summary",
      "published_at",
      "student_id",
      "student_name",
      "batch_name",
      "delivery_mode",
      "course_title",
    ].sort(),
  );
  assert.deepEqual(await f.g.call("/reports"), []);
  assert.deepEqual(await other.g.call("/progress"), []);
});

test("published summaries isolate same-batch families and support both Guardian roles and group/1:1", async () => {
  const f = await fixture();
  const otherFamily = await f.post("/families", {
    name: "Unlinked family",
    branch_id: f.branch,
  });
  const otherStudent = await f.post("/students", {
    full_name: "Other same-batch child",
    family_id: otherFamily,
  });
  const otherEnrollment = await f.post("/enrollments", {
    student_id: otherStudent,
    batch_id: f.batch,
    start_date: "2026-01-01",
  });
  const individual = await f.post("/batches", {
    course_id: f.course,
    label: "Individual",
    delivery_mode: "one_to_one",
    teacher_id: f.teacher,
    zimmadar_id: f.zimm,
  });
  const individualEnrollment = await f.post("/enrollments", {
    student_id: f.student,
    batch_id: individual,
    start_date: "2026-01-01",
  });
  for (const en of [f.enr, individualEnrollment, otherEnrollment])
    await f.z.call("/progress", {
      enrollment_id: en,
      request_id: randomUUID(),
      title: "Published",
      progress_summary:
        en === otherEnrollment ? "OTHER CHILD PRIVATE" : "Own child",
    });
  const seen = await f.g.call("/progress");
  assert.equal(seen.length, 2);
  assert.deepEqual(
    new Set(seen.map((p: any) => p.delivery_mode)),
    new Set(["group", "one_to_one"]),
  );
  assert.deepEqual(
    await f.g.call("/progress?enrollment_id=" + otherEnrollment),
    [],
  );
  assert.ok(!JSON.stringify(seen).includes("OTHER CHILD PRIVATE"));
  const secondary = await f.post("/users", {
    email: `secondary${f.suffix}@example.test`,
    name: "Secondary Guardian",
    role: "guardian_secondary",
    branch_id: f.branch,
    password: f.pass,
  });
  await store.transaction((c) =>
    write(c, "INSERT INTO family_guardians(family_id,user_id) VALUES (?,?)", [
      f.fam,
      secondary,
    ]),
  );
  const second = await new Client().login(
    `secondary${f.suffix}@example.test`,
    f.pass,
  );
  assert.equal((await second.call("/progress")).length, 2);
  await second.call(
    "/progress",
    {
      enrollment_id: f.enr,
      request_id: randomUUID(),
      title: "Forbidden",
      progress_summary: "No",
    },
    { expected: 403 },
  );
});

test("Guardian attendance history is own-family, effective enrollment and verified-held only", async () => {
  const f = await fixture();
  await f.finish("2026-10-31T18:00:00+06:00", "2026-10-31T18:40:00+06:00");
  const otherFamily = await f.post("/families", {
    name: "Other history family",
    branch_id: f.branch,
  });
  const student = await f.post("/students", {
    full_name: "Unlinked classmate",
    family_id: otherFamily,
  });
  await f.post("/enrollments", {
    student_id: student,
    batch_id: f.batch,
    start_date: "2026-01-01",
  });
  const history = await f.g.call("/guardian/attendance?month=2026-10");
  assert.equal(history.length, 1);
  assert.equal(history[0].student_id, f.student);
  assert.equal(
    (await f.g.call("/attendance/monthly?month=2026-10"))[0].student_id,
    f.student,
  );
  assert.equal(history[0].attendance_status, null);
  await f.t.call(`/classes/${f.classid}/attendance`, {
    enrollment_id: f.enr,
    status: "Late",
  });
  assert.equal(
    (await f.g.call("/guardian/attendance?month=2026-10"))[0].attendance_status,
    "Late",
  );
  await f.t.call("/guardian/attendance?month=2026-10", undefined, {
    expected: 403,
  });
  await f.g.call("/guardian/attendance?month=2026-13", undefined, {
    expected: 422,
  });
  await store.transaction((c) =>
    write(c, "UPDATE class_sessions SET held_verified=0 WHERE id=?", [
      f.classid,
    ]),
  );
  assert.deepEqual(await f.g.call("/guardian/attendance?month=2026-10"), []);
});

test("baseline CSRF and admin scoping", async () => {
  const f = await fixture();
  await f.admin.call(
    "/students",
    { full_name: "Another child", family_id: f.fam },
    { csrf: false, expected: 403 },
  );
  await f.admin.call("/students", {
    full_name: "Another child",
    family_id: f.fam,
  });
});
test("baseline guardian family isolation and AM-19 both delivery modes", async () => {
  const f = await fixture(),
    b = await f.post("/batches", {
      course_id: f.course,
      label: "Individual",
      delivery_mode: "one_to_one",
      teacher_id: f.teacher,
      zimmadar_id: f.zimm,
    });
  await f.post("/enrollments", {
    student_id: f.student,
    batch_id: b,
    start_date: "2026-01-01",
  });
  const other = await f.post("/families", {
    name: "Unlinked",
    branch_id: f.branch,
  });
  await f.post("/students", { full_name: "Unlinked Child", family_id: other });
  assert.deepEqual(
    (await f.g.call("/students")).map((s: any) => s.full_name),
    ["Sample Child"],
  );
  assert.deepEqual(
    new Set((await f.g.call("/enrollments")).map((s: any) => s.delivery_mode)),
    new Set(["group", "one_to_one"]),
  );
  assert.deepEqual(await f.g.call("/reports"), []);
  await f.g.call(
    "/students",
    { full_name: "Invalid child", family_id: other },
    { expected: 403 },
  );
  await f.post("/users", {
    email: `unlinked${f.suffix}@example.test`,
    name: "Unlinked Guardian",
    role: "guardian_primary",
    branch_id: f.branch,
    password: f.pass,
  });
  const unlinked = await new Client().login(
    `unlinked${f.suffix}@example.test`,
    f.pass,
  );
  for (const route of ["/students", "/enrollments", "/classes"])
    assert.deepEqual(await unlinked.call(route), []);
});
test("class lifecycle rejects repeats and logout revokes session", async () => {
  const f = await fixture();
  await f.g.call(`/classes/${f.classid}/start`, {}, { expected: 403 });
  await f.t.call(`/classes/${f.classid}/start`, {});
  await f.t.call(`/classes/${f.classid}/start`, {}, { expected: 409 });
  await f.t.call(`/classes/${f.classid}/end`, {});
  await f.t.call(`/classes/${f.classid}/end`, {}, { expected: 409 });
  await f.t.call("/logout", {});
  await f.t.call("/me", undefined, { expected: 401 });
});
test("staging health/static entry and HTTPS cookie defaults", async () => {
  const f = await fixture(),
    httpsApp = createApp(store).listen(0, "127.0.0.1");
  await once(httpsApp, "listening");
  const a = httpsApp.address();
  if (!a || typeof a === "string") throw new Error("No listener");
  const url = `http://127.0.0.1:${a.port}`;
  try {
    assert.equal((await fetch(url + "/health")).status, 200);
    assert.equal((await fetch(url + "/ready")).status, 200);
    const html = await (await fetch(url)).text();
    assert.ok(html.includes("/static/app.js"));
    assert.equal((await fetch(url + "/static/app.js")).status, 200);
    const res = await fetch(url + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `admin${f.suffix}@example.test`,
        password: f.pass,
      }),
    });
    assert.equal(res.status, 200);
    const cookie = res.headers.get("set-cookie") || "";
    for (const flag of ["HttpOnly", "Secure", "SameSite=Strict"])
      assert.ok(cookie.includes(flag));
  } finally {
    await new Promise<void>((resolve) => httpsApp.close(() => resolve()));
  }
});
test("baseline teacher attendance + Zimmadar held verification + report approval", async () => {
  const f = await fixture();
  await f.finish("2026-10-31T18:00:00+06:00", "2026-10-31T18:50:00+06:00", 0);
  await f.z.call(`/classes/${f.classid}/verify-held`, {});
  const a = await f.t.call(`/classes/${f.classid}/attendance`, {
    enrollment_id: f.enr,
    status: "Present",
    join_time: "2026-10-31T18:15",
  });
  assert.equal(a.status, "Present");
  const rep = await f.t.call(`/classes/${f.classid}/report`, {
    body: "Completed lesson",
    submit: true,
  });
  await f.t.call(
    `/reports/${rep.id}/review`,
    { action: "approve" },
    { expected: 403 },
  );
  assert.equal(
    (await f.z.call(`/reports/${rep.id}/review`, { action: "approve" })).status,
    "approved",
  );
  await f.z.call(
    `/reports/${rep.id}/review`,
    { action: "approve" },
    { expected: 409 },
  );
});
test("baseline one-to-one concurrent slot rejects duplicate enrollment", async () => {
  const f = await fixture(),
    b = await f.post("/batches", {
      course_id: f.course,
      label: "Individual",
      delivery_mode: "one_to_one",
      teacher_id: f.teacher,
      zimmadar_id: f.zimm,
    });
  const result = await Promise.all(
    ["2026-01-01", "2026-02-01"].map((start_date) =>
      fetch(base + "/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: f.admin.cookie,
          "x-csrf-token": f.admin.csrf,
        },
        body: JSON.stringify({
          student_id: f.student,
          batch_id: b,
          start_date,
        }),
      }),
    ),
  );
  assert.deepEqual(result.map((r) => r.status).sort(), [200, 409]);
  const saved = await store.read((c) =>
    rows(c, "SELECT id FROM enrollments WHERE batch_id=?", [b]),
  );
  assert.equal(saved.length, 1);
});
test("baseline branch scope prevents cross-branch student and privileged account writes", async () => {
  const f = await fixture(),
    b = await f.post("/branches", { name: `Other branch ${f.suffix}` });
  await f.post("/users", {
    email: `branch${f.suffix}@example.test`,
    name: "Branch Manager",
    role: "branch_admin",
    branch_id: b,
    password: f.pass,
  });
  const user = await new Client().login(
    `branch${f.suffix}@example.test`,
    f.pass,
  );
  assert.deepEqual(await user.call("/students"), []);
  await user.call(
    "/students",
    { full_name: "Wrong Branch", family_id: f.fam },
    { expected: 403 },
  );
  await user.call(
    "/users",
    {
      email: "cross@example.test",
      name: "Invalid Admin",
      role: "central_admin",
      password: f.pass,
    },
    { expected: 403 },
  );
});
test("baseline report return requires reason, preserves first submission and append-only revision history", async () => {
  const f = await fixture();
  await f.finish("2026-10-31T23:00:00+06:00", "2026-11-01T00:25:00+06:00");
  const rep = await f.t.call(`/classes/${f.classid}/report`, {
    body: "Lesson",
    submit: true,
  });
  assert.equal(rep.due_at, "2026-11-01T12:00:00+06:00");
  await f.z.call(
    `/reports/${rep.id}/review`,
    { action: "return_report" },
    { expected: 400 },
  );
  await f.z.call(`/reports/${rep.id}/review`, {
    action: "return_report",
    reason: "Missing detail",
  });
  await f.t.call(`/classes/${f.classid}/report`, {
    body: "Correction",
    submit: false,
  });
  await f.t.call(`/classes/${f.classid}/report`, {
    body: "Final",
    submit: true,
  });
  const r = await store.read((c) =>
    rows(c, "SELECT * FROM reports WHERE id=?", [rep.id]),
  );
  assert.equal(r[0].revision, 2);
  assert.ok(r[0].first_submitted_at);
  const events = await store.read((c) =>
    rows(
      c,
      "SELECT event FROM report_revisions WHERE report_id=? ORDER BY id",
      [rep.id],
    ),
  );
  assert.deepEqual(
    events.map((x) => x.event),
    ["submit", "return_report", "draft", "submit"],
  );
});
test("baseline alerts idempotent and submitted report stops later alerts", async () => {
  const f = await fixture();
  await f.finish();
  const now = new Date("2026-11-01T12:05:00+06:00");
  const first = await processAlerts(store, now);
  assert.equal(first.filter((v) => v.class_id === f.classid).length, 1);
  assert.deepEqual(await processAlerts(store, now), []);
  await f.t.call(`/classes/${f.classid}/report`, {
    body: "Submitted",
    submit: true,
  });
  assert.equal(
    (await processAlerts(store, new Date("2026-11-01T14:00:00+06:00"))).filter(
      (v) => v.class_id === f.classid,
    ).length,
    0,
  );
  const m = await f.t.call("/report-monitor");
  assert.equal(
    m.find((v: any) => v.class_id === f.classid).submission_outstanding,
    false,
  );
});
test("baseline no historic catchup, no unapproved evening alerts", async () => {
  const f = await fixture();
  await f.finish();
  assert.equal(
    (await processAlerts(store, new Date("2026-11-02T14:00:00+06:00"))).length,
    0,
  );
  await f.finish("2026-10-31T18:00:00+06:00", "2026-10-31T18:50:00+06:00");
  assert.equal(
    (await processAlerts(store, new Date("2026-10-31T23:59:00+06:00"))).length,
    0,
  );
});
test("baseline noon stages and honest unassigned supervisor status", async () => {
  const f = await fixture();
  await f.finish();
  for (const [time, stage] of [
    ["14:00", "zimmadar"],
    ["16:00", "supervisor"],
    ["18:00", "management"],
  ]) {
    const v = (
      await processAlerts(store, new Date(`2026-11-01T${time}:00+06:00`))
    ).find((x) => x.class_id === f.classid);
    assert.equal(v?.stage, stage);
    if (stage === "supervisor") assert.equal(v?.delivery_status, "unassigned");
  }
  assert.equal(
    (await f.t.call("/report-alerts")).filter(
      (v: any) => v.class_id === f.classid,
    ).length,
    3,
  );
});
test("baseline unknown attendance is not false absence; invalid month rejected", async () => {
  const f = await fixture();
  await f.finish("2026-10-31T18:00:00+06:00", "2026-10-31T18:40:00+06:00");
  const r = (await f.g.call("/attendance/monthly?month=2026-10"))[0];
  assert.equal(r.held_classes, 1);
  assert.equal(r.unrecorded, 1);
  assert.equal(r.absent, 0);
  assert.equal(r.low_attendance_evaluable, false);
  await f.g.call("/attendance/monthly?month=2026-13", undefined, {
    expected: 400,
  });
});
test("baseline guardian cannot view staff monitor/alerts or invoke checks", async () => {
  const f = await fixture();
  await f.g.call("/report-monitor", undefined, { expected: 403 });
  await f.g.call("/report-alerts", undefined, { expected: 403 });
  await f.g.call("/report-alerts/check-now", {}, { expected: 403 });
});
test("baseline three held threshold and per-enrollment isolation", async () => {
  const f = await fixture();
  await f.finish("2026-10-31T18:00:00+06:00", "2026-10-31T18:40:00+06:00");
  for (const [day, status] of [
    [31, "Absent"],
    [28, "Absent"],
    [29, "Present"],
  ] as const) {
    let cid = f.classid;
    if (day !== 31)
      cid = await f.post("/classes", {
        batch_id: f.batch,
        scheduled_start: `2026-10-${day}T18:00`,
        scheduled_end: `2026-10-${day}T19:00`,
      });
    await store.transaction(async (c) => {
      await write(
        c,
        "UPDATE class_sessions SET status='ended',held_verified=1 WHERE id=?",
        [cid],
      );
      await write(
        c,
        "INSERT INTO attendance(class_id,enrollment_id,status,verified_by,verified_at) VALUES (?,?,?,?,?)",
        [cid, f.enr, status, f.teacher, new Date().toISOString()],
      );
    });
  }
  const r = (await f.g.call("/attendance/monthly?month=2026-10"))[0];
  assert.equal(r.held_classes, 3);
  assert.equal(r.attendance_percent, 33.33);
  assert.equal(r.below_75_percent, true);
  assert.equal(r.warning_sent, false);
});

test("V1 homework lifecycle: Teacher assignment, batch and learner scoping, submission status, teacher feedback, and Guardian view", async () => {
  const f = await fixture(),
    other = await fixture();
  // 1. Teacher creates batch-wide homework
  const reqId = randomUUID();
  const hw = await f.t.call("/homework", {
    batch_id: f.batch,
    title: "Surah Al-Fatiha Memorization & Tajweed Rules",
    instructions: "Recite verses 1-7 with proper Madd and Qalqalah rules.",
    due_date: "2026-11-15",
    request_id: reqId,
  });
  assert.ok(hw.id);

  // Idempotent retry with same request_id
  const replay = await f.t.call("/homework", {
    batch_id: f.batch,
    title: "Surah Al-Fatiha Memorization & Tajweed Rules",
    instructions: "Recite verses 1-7 with proper Madd and Qalqalah rules.",
    due_date: "2026-11-15",
    request_id: reqId,
  });
  assert.equal(replay.already_created, true);

  // Unauthorized teacher from other batch cannot assign homework (403)
  await other.t.call(
    "/homework",
    {
      batch_id: f.batch,
      title: "Cross-batch unauthorized homework",
      instructions: "Should fail",
      due_date: "2026-11-15",
      request_id: randomUUID(),
    },
    { expected: 403 },
  );

  // 2. Staff views homework
  const staffList = await f.t.call(`/homework?batch_id=${f.batch}`);
  assert.ok(staffList.some((h: any) => h.id === hw.id));

  // 3. Guardian views own child's homework
  const guardianList = await f.g.call("/homework");
  const studentHw = guardianList.find((h: any) => h.id === hw.id);
  assert.ok(studentHw);
  assert.equal(studentHw.student_id, f.student);
  assert.equal(studentHw.status, "assigned");

  // Other family guardian cannot see this learner's homework
  const otherHw = await other.g.call("/homework");
  assert.ok(!otherHw.some((h: any) => h.id === hw.id));

  // 4. Teacher updates homework status and leaves feedback
  const updateRes = await f.t.call(
    `/student-homework/${studentHw.student_homework_id}`,
    {
      status: "completed",
      teacher_feedback:
        "Excellent recitation and clear pronunciation of Harf.",
      expected_revision: 1,
    },
  );
  assert.equal(updateRes.status, "completed");

  // Stale revision retry fails with 409
  await f.t.call(
    `/student-homework/${studentHw.student_homework_id}`,
    {
      status: "completed",
      teacher_feedback: "Stale update",
      expected_revision: 1,
    },
    { expected: 409 },
  );

  // Guardian re-checks homework and sees updated status & feedback
  const updatedHw = await f.g.call("/homework");
  const refreshedItem = updatedHw.find((h: any) => h.id === hw.id);
  assert.equal(refreshedItem.status, "completed");
  assert.equal(
    refreshedItem.teacher_feedback,
    "Excellent recitation and clear pronunciation of Harf.",
  );
});

test("V1 assessments and marks: Oral/practical exam, teacher-entered marks, Zimmadar explicit publication, mark correction history", async () => {
  const f = await fixture();

  // 1. Teacher creates oral practical assessment
  const reqId = randomUUID();
  const assess = await f.t.call("/assessments", {
    batch_id: f.batch,
    title: "Mid-Term Oral Quranic Recitation & Hifz",
    assessment_type: "oral_practical",
    max_marks: 100,
    pass_marks: 50,
    assessment_date: "2026-11-12",
    request_id: reqId,
  });
  assert.ok(assess.id);

  // 2. Teacher records draft marks
  await f.t.call(`/assessments/${assess.id}/marks`, {
    marks: [
      {
        enrollment_id: f.enr,
        obtained_marks: 88,
        teacher_remarks:
          "Internal: Strong retention, needs minor practice on verse 4 stop.",
        guardian_feedback:
          "MashaAllah, outstanding performance in oral recitation.",
      },
    ],
  });

  // Marks exceeding max_marks (100) are rejected with 400
  await f.t.call(
    `/assessments/${assess.id}/marks`,
    {
      marks: [
        {
          enrollment_id: f.enr,
          obtained_marks: 105,
        },
      ],
    },
    { expected: 400 },
  );

  // 3. Prior to publication: Marks are draft; Guardian cannot see them
  const prePubGuardian = await f.g.call("/assessments");
  assert.ok(!prePubGuardian.some((a: any) => a.assessment_id === assess.id));

  // Staff can inspect draft marks
  const staffMarks = await f.t.call(`/assessments/${assess.id}/marks`);
  assert.equal(staffMarks.length, 1);
  assert.equal(staffMarks[0].status, "draft");
  assert.equal(Number(staffMarks[0].obtained_marks), 88);

  // 4. Zimmadar explicitly publishes assessment results
  const pubRes = await f.z.call(`/assessments/${assess.id}/publish`, {});
  assert.equal(pubRes.published_count, 1);

  // 5. Guardian can now view published assessment results (with safe guardian_feedback, no internal remarks)
  const postPubGuardian = await f.g.call("/assessments");
  const childAssessment = postPubGuardian.find(
    (a: any) => a.assessment_id === assess.id,
  );
  assert.ok(childAssessment);
  assert.equal(Number(childAssessment.obtained_marks), 88);
  assert.equal(
    childAssessment.guardian_feedback,
    "MashaAllah, outstanding performance in oral recitation.",
  );
  assert.equal(childAssessment.teacher_remarks, undefined);

  // 6. Teacher or Zimmadar submits correction with reason
  const markId = staffMarks[0].id;
  const corrRes = await f.t.call(
    `/assessments/${assess.id}/marks/${markId}/correction`,
    {
      new_marks: 92,
      reason:
        "Re-evaluated Makhaarij accuracy for Ayah 6 upon listening to session audio record",
      expected_revision: 1,
    },
  );
  assert.equal(corrRes.obtained_marks, 92);

  // Verify correction history in audit / database
  const historyRows = await store.read((c) =>
    rows(
      c,
      "SELECT * FROM assessment_mark_history WHERE mark_id = ? ORDER BY id DESC",
      [markId],
    ),
  );
  assert.equal(historyRows.length, 1);
  assert.equal(Number(historyRows[0].old_marks), 88);
  assert.equal(Number(historyRows[0].new_marks), 92);
  assert.equal(historyRows[0].actor_id, f.teacher);
});

test("V1 unified progress view: attendance, homework, published results, and honest missing state", async () => {
  const f = await fixture(),
    other = await fixture();

  // 1. Initially without homework or assessments: Guardian gets honest empty/missing state
  const initialProg = await f.g.call(
    `/guardian/learners/${f.student}/progress-summary`,
  );
  assert.equal(initialProg.student_id, f.student);
  assert.equal(initialProg.enrollments.length, 1);
  const enSummary = initialProg.enrollments[0];
  assert.equal(enSummary.homework.total_assigned, 0);
  assert.equal(enSummary.assessments, null); // honest missing state, no fake zeros

  // Cross-family Guardian access denied (403)
  await other.g.call(
    `/guardian/learners/${f.student}/progress-summary`,
    undefined,
    {
      expected: 403,
    },
  );

  // 2. Add homework, hold classes, and publish assessment
  const hw = await f.t.call("/homework", {
    batch_id: f.batch,
    title: "Weekly Practice",
    instructions: "Complete exercise",
    due_date: "2026-11-20",
    request_id: randomUUID(),
  });
  const gHw = await f.g.call("/homework");
  const sh = gHw.find((h: any) => h.id === hw.id);
  await f.t.call(`/student-homework/${sh.student_homework_id}`, {
    status: "completed",
    teacher_feedback: "Well done!",
    expected_revision: 1,
  });

  // Create & publish assessment
  const assess = await f.t.call("/assessments", {
    batch_id: f.batch,
    title: "Progress Evaluation 1",
    max_marks: 100,
    assessment_date: "2026-11-18",
    request_id: randomUUID(),
  });
  await f.t.call(`/assessments/${assess.id}/marks`, {
    marks: [
      {
        enrollment_id: f.enr,
        obtained_marks: 95,
        guardian_feedback: "Top score in batch",
      },
    ],
  });
  await f.z.call(`/assessments/${assess.id}/publish`, {});

  // 3. Guardian fetches unified progress summary
  const populatedProg = await f.g.call(
    `/guardian/learners/${f.student}/progress-summary`,
  );
  const populatedEn = populatedProg.enrollments[0];
  assert.equal(populatedEn.homework.total_assigned, 1);
  assert.equal(populatedEn.homework.completed, 1);
  assert.equal(populatedEn.homework.recent[0].teacher_feedback, "Well done!");
  assert.ok(populatedEn.assessments);
  assert.equal(Number(populatedEn.assessments[0].obtained_marks), 95);
  assert.equal(
    populatedEn.assessments[0].guardian_feedback,
    "Top score in batch",
  );
});

test("V1 external payment portal reference & status view: honest unknown state, admin record, and Guardian view", async () => {
  const f = await fixture(),
    other = await fixture();

  // 1. Initial state before reference recorded: returns honest 'unknown' status, never fake balances
  const preStatus = await f.g.call(
    `/payments/status?enrollment_id=${f.enr}&month=2026-11`,
  );
  assert.equal(preStatus.payment_status, "unknown");
  assert.equal(preStatus.reference_code, null);
  assert.ok(preStatus.external_authority_notice);

  // Other family guardian denied access (403)
  await other.g.call(
    `/payments/status?enrollment_id=${f.enr}&month=2026-11`,
    undefined,
    { expected: 403 },
  );

  // Cross-branch Branch Admin denied write (403)
  const otherBAEmail = `other-ba-${other.suffix}@example.test`;
  await other.post("/users", {
    email: otherBAEmail,
    name: "Other Branch Admin",
    role: "branch_admin",
    branch_id: other.branch,
    password: other.pass,
  });
  const otherBA = await new Client().login(otherBAEmail, other.pass);
  await otherBA.call(
    "/payments/references",
    {
      enrollment_id: f.enr,
      billing_month: "2026-11",
      reference_code: "TXN-9999",
      payment_status: "paid",
    },
    { expected: 403 },
  );

  // 2. Branch admin records confirmed payment reference from external payment portal
  const recRes = await f.admin.call("/payments/references", {
    enrollment_id: f.enr,
    billing_month: "2026-11",
    reference_code: "TXN-20261101-ABCD",
    payment_status: "paid",
    notes: "Verified via external portal batch settlement report",
  });
  assert.equal(recRes.ok, true);
  assert.equal(recRes.payment_status, "paid");

  // 3. Guardian views verified payment status
  const postStatus = await f.g.call(
    `/payments/status?enrollment_id=${f.enr}&month=2026-11`,
  );
  assert.equal(postStatus.payment_status, "paid");
  assert.equal(postStatus.reference_code, "TXN-20261101-ABCD");

  // 4. Guardian views list of all child payment references
  const guardianPayments = await f.g.call("/guardian/payments");
  assert.ok(
    guardianPayments.some(
      (p: any) =>
        p.enrollment_id === f.enr &&
        p.reference_code === "TXN-20261101-ABCD" &&
        p.payment_status === "paid",
    ),
  );
});

test("V1 controlled announcements and manual support path: scoped delivery and contact info", async () => {
  const f = await fixture(),
    other = await fixture();

  // 1. Admin posts branch announcement
  const reqId1 = randomUUID();
  const ann1 = await f.admin.call("/announcements", {
    branch_id: f.branch,
    title: "Upcoming Academic Session Schedule",
    body: "Please note updated morning class hours starting from next week.",
    priority: "normal",
    request_id: reqId1,
  });
  assert.ok(ann1.id);

  // Idempotent retry
  const replay = await f.admin.call("/announcements", {
    branch_id: f.branch,
    title: "Upcoming Academic Session Schedule",
    body: "Please note updated morning class hours starting from next week.",
    priority: "normal",
    request_id: reqId1,
  });
  assert.equal(replay.already_created, true);

  // 2. Zimmadar posts batch-specific announcement
  const ann2 = await f.z.call("/announcements", {
    branch_id: f.branch,
    batch_id: f.batch,
    title: "Batch Quran Recitation Revision",
    body: "All learners please prepare Surah Al-Mulk for tomorrow.",
    priority: "urgent",
    request_id: randomUUID(),
  });
  assert.ok(ann2.id);

  // 3. Guardian views relevant announcements
  const gAnnouncements = await f.g.call("/announcements");
  assert.ok(gAnnouncements.some((a: any) => a.id === ann1.id));
  assert.ok(gAnnouncements.some((a: any) => a.id === ann2.id));

  // Other branch guardian does not see branch 1's announcement
  const otherAnnouncements = await other.g.call("/announcements");
  assert.ok(!otherAnnouncements.some((a: any) => a.id === ann1.id));

  // 4. Manual support path retrieval
  const support = await f.g.call("/support/info");
  assert.ok(support.helpline);
  assert.ok(support.whatsapp_url);
  assert.ok(support.office_hours);
  assert.ok(support.instructions);
});

test("V1 course resource links: Teacher/Admin creation, URL validation, and Guardian access", async () => {
  const f = await fixture(),
    other = await fixture();

  // 1. Teacher creates course resource
  const reqId = randomUUID();
  const res1 = await f.t.call("/resources", {
    course_id: f.course,
    batch_id: f.batch,
    title: "Tajweed Rules Reference PDF",
    url: "https://resources.academy.local/materials/tajweed-rules.pdf",
    category: "book",
    description:
      "Official course recitation and grammar rules reference guide",
    request_id: reqId,
  });
  assert.ok(res1.id);

  // Idempotent retry
  const replay = await f.t.call("/resources", {
    course_id: f.course,
    batch_id: f.batch,
    title: "Tajweed Rules Reference PDF",
    url: "https://resources.academy.local/materials/tajweed-rules.pdf",
    category: "book",
    request_id: reqId,
  });
  assert.equal(replay.already_created, true);

  // Invalid URL rejected with 422
  await f.t.call(
    "/resources",
    {
      course_id: f.course,
      title: "Bad link",
      url: "not-a-valid-url",
      request_id: randomUUID(),
    },
    { expected: 422 },
  );

  // 2. Staff views course resources
  const staffResources = await f.t.call(`/resources?course_id=${f.course}`);
  assert.ok(staffResources.some((r: any) => r.id === res1.id));

  // 3. Enrolled learner's Guardian views course resources
  const guardianResources = await f.g.call("/resources");
  assert.ok(guardianResources.some((r: any) => r.id === res1.id));

  // Other course guardian cannot view this resource
  const otherResources = await other.g.call("/resources");
  assert.ok(!otherResources.some((r: any) => r.id === res1.id));
});

test("commercial-ledger RBAC, cross-tenant isolation, session ownership, and actor_id audit integrity", async () => {
  const f = await fixture(),
    other = await fixture();

  // Create branch_admin in `other` branch to verify branch-level isolation
  const otherBranchAdminId = await other.post("/users", {
    email: `badmin${other.suffix}@example.test`,
    name: "Other Branch Admin",
    role: "branch_admin",
    branch_id: other.branch,
    password: other.pass,
  });
  const otherBranchAdmin = await new Client().login(
    `badmin${other.suffix}@example.test`,
    other.pass,
  );
  assert.ok(otherBranchAdminId);

  // Create 1:1 batch, enrollment, and class session in `f`
  const oneToOneBatch = await f.post("/batches", {
    course_id: f.course,
    label: "1:1 Individual A",
    delivery_mode: "one_to_one",
    teacher_id: f.teacher,
    zimmadar_id: f.zimm,
  });
  const oneToOneEnr = await f.post("/enrollments", {
    student_id: f.student,
    batch_id: oneToOneBatch,
    start_date: "2026-01-01",
  });
  const oneToOneClass = await f.post("/classes", {
    batch_id: oneToOneBatch,
    scheduled_start: "2026-10-31T15:00",
    scheduled_end: "2026-10-31T16:00",
  });

  // 1. Package creation: only central_admin allowed; actor_id must be recorded
  await otherBranchAdmin.call(
    "/one-to-one/packages",
    {
      name: "Unauthorized Pkg",
      code: `UNAUTH-${f.suffix}`,
      total_classes: 8,
      total_minutes: 360,
      fee_amount: 4000,
    },
    { expected: 403 },
  );
  const pkg = await f.admin.call("/one-to-one/packages", {
    name: "Standard 1:1 8h",
    code: `PKG-${f.suffix}`,
    total_classes: 8,
    total_minutes: 480,
    fee_amount: 4800,
  });
  assert.ok(pkg.id);

  // 2. Contract creation: other branch / zimmadar blocked (403); assigned zimmadar allowed
  await otherBranchAdmin.call(
    "/one-to-one/contracts",
    {
      enrollment_id: oneToOneEnr,
      package_id: pkg.id,
      billing_period: "2026-10",
      start_date: "2026-10-01",
      end_date: "2026-10-31",
    },
    { expected: 403 },
  );
  await other.z.call(
    "/one-to-one/contracts",
    {
      enrollment_id: oneToOneEnr,
      package_id: pkg.id,
      billing_period: "2026-10",
      start_date: "2026-10-01",
      end_date: "2026-10-31",
    },
    { expected: 403 },
  );
  const contract = await f.z.call("/one-to-one/contracts", {
    enrollment_id: oneToOneEnr,
    package_id: pkg.id,
    billing_period: "2026-10",
    start_date: "2026-10-01",
    end_date: "2026-10-31",
  });
  assert.ok(contract.id);

  // 3. Read isolation on contracts & ledger
  assert.ok(!(await other.g.call("/one-to-one/contracts")).some((c: any) => c.id === contract.id));
  assert.ok(!(await otherBranchAdmin.call("/one-to-one/contracts")).some((c: any) => c.id === contract.id));
  assert.ok(!(await other.t.call("/one-to-one/contracts")).some((c: any) => c.id === contract.id));
  await otherBranchAdmin.call(`/one-to-one/contracts/${contract.id}/ledger`, undefined, { expected: 403 });
  await other.g.call(`/one-to-one/contracts/${contract.id}/ledger`, undefined, { expected: 403 });
  assert.equal((await f.g.call(`/one-to-one/contracts/${contract.id}/ledger`)).length, 1);

  // 4. Minute adjustments & session consumption ownership checks
  await otherBranchAdmin.call(
    `/one-to-one/contracts/${contract.id}/adjust`,
    { minutes: 60, entry_type: "rollover_credit", notes: "Cross-branch tamper" },
    { expected: 403 },
  );
  await f.t.call(
    `/one-to-one/contracts/${contract.id}/adjust`,
    { minutes: 60, entry_type: "rollover_credit", notes: "Teacher not permitted" },
    { expected: 403 },
  );
  const adjusted = await f.z.call(`/one-to-one/contracts/${contract.id}/adjust`, {
    minutes: 30,
    entry_type: "rollover_credit",
    notes: "Carry-over approved",
  });
  assert.equal(adjusted.balance_after, 510);

  // Cross-batch class session on same contract must fail (400 same-branch wrong batch; 403 cross-branch)
  await f.t.call(
    `/one-to-one/contracts/${contract.id}/consume-session`,
    { class_session_id: f.classid, minutes: 45 },
    { expected: 400 },
  );
  await other.t.call(
    `/one-to-one/contracts/${contract.id}/consume-session`,
    { class_session_id: oneToOneClass, minutes: 45 },
    { expected: 403 },
  );
  const consumed = await f.t.call(`/one-to-one/contracts/${contract.id}/consume-session`, {
    class_session_id: oneToOneClass,
    minutes: 60,
  });
  assert.equal(consumed.balance_after, 450);

  // 5. Invoices RBAC & branch isolation
  await f.t.call("/invoices", undefined, { expected: 403 });
  await f.z.call("/invoices", undefined, { expected: 403 });
  const inv = await f.admin.call("/invoices", {
    enrollment_id: oneToOneEnr,
    contract_id: contract.id,
    billing_month: "2026-10",
    amount_due: 4800,
    due_date: "2026-10-15",
  });
  assert.ok(inv.id);
  assert.ok(!(await otherBranchAdmin.call("/invoices")).some((x: any) => x.id === inv.id));
  assert.ok(!(await other.g.call("/invoices")).some((x: any) => x.id === inv.id));
  assert.ok((await f.g.call("/invoices")).some((x: any) => x.id === inv.id));
  await otherBranchAdmin.call(
    `/invoices/${inv.id}/record-payment`,
    { payment_reference_code: "REF-CROSS", amount_paid: 4800 },
    { expected: 403 },
  );
  const paid = await f.admin.call(`/invoices/${inv.id}/record-payment`, {
    payment_reference_code: "BKASH-778899",
    amount_paid: 4800,
  });
  assert.equal(paid.status, "paid");

  // 6. Teacher payables RBAC, calculation scope, and billing_period filtering
  await f.g.call("/finance/teacher-payables", undefined, { expected: 403 });
  await f.finish();
  await otherBranchAdmin.call(
    "/finance/teacher-payables/calculate",
    { class_session_id: f.classid, hourly_rate: 600 },
    { expected: 403 },
  );
  const payable = await f.z.call("/finance/teacher-payables/calculate", {
    class_session_id: f.classid,
    hourly_rate: 600,
  });
  assert.ok(payable.id);
  const teacherPayables = await f.t.call("/finance/teacher-payables?billing_period=2026-10");
  assert.ok(teacherPayables.some((p: any) => p.id === payable.id));
  assert.equal((await f.t.call("/finance/teacher-payables?billing_period=2026-12")).length, 0);
  assert.ok(!(await otherBranchAdmin.call("/finance/teacher-payables")).some((p: any) => p.id === payable.id));

  // 7. Verify all 7 audit_events entries recorded non-null actor_id
  const audits = await store.read((c) =>
    rows(
      c,
      `SELECT action, actor_id, entity, entity_id FROM audit_events
       WHERE (entity='one_to_one_packages' AND entity_id=?)
          OR (entity='one_to_one_contracts' AND entity_id=?)
          OR (entity='tuition_invoices' AND entity_id=?)
          OR (entity='teacher_payables' AND entity_id=?)
       ORDER BY id ASC`,
      [pkg.id, contract.id, inv.id, payable.id],
    ),
  );
  assert.equal(audits.length, 7);
  for (const row of audits) {
    assert.ok(Number.isInteger(row.actor_id) && row.actor_id > 0, `Missing actor_id for ${row.action}`);
  }
  const byAction = Object.fromEntries(audits.map((a) => [a.action, a.actor_id]));
  assert.equal(byAction.create_contract, f.zimm);
  assert.equal(byAction.adjust_minutes, f.zimm);
  assert.equal(byAction.deduct_class_minutes, f.teacher);
  assert.equal(byAction.calculate_teacher_payable, f.zimm);
});

test("Wave 1 hardening: http(s) URL validation, cross-batch marks/homework IDOR, announcement scope & 409 parity", async () => {
  const f = await fixture();
  const other = await fixture();

  // BE-03: Reject non-http(s) URLs in /resources and /payments/references
  await f.t.call(
    "/resources",
    {
      course_id: f.course,
      batch_id: f.batch,
      title: "XSS Attempt",
      url: "javascript:alert(1)",
      category: "link",
      request_id: "req-xss-res-" + randomUUID(),
    },
    { expected: 422 },
  );
  await f.admin.call(
    "/payments/references",
    {
      enrollment_id: f.enr,
      billing_month: "2026-10",
      reference_code: "REF-XSS",
      payment_status: "paid",
      portal_url: "javascript:alert(1)",
    },
    { expected: 422 },
  );

  // BE-04: Reject cross-batch enrollment_id and class_id on homework and assessment marks
  await f.t.call(
    "/homework",
    {
      batch_id: f.batch,
      enrollment_id: other.enr,
      title: "Cross-batch homework",
      instructions: "Should reject",
      due_date: "2026-11-15",
      request_id: "req-hw-cross-enr-" + randomUUID(),
    },
    { expected: 400 },
  );
  await f.t.call(
    "/homework",
    {
      batch_id: f.batch,
      class_id: other.classid,
      title: "Cross-batch class homework",
      instructions: "Should reject",
      due_date: "2026-11-15",
      request_id: "req-hw-cross-cls-" + randomUUID(),
    },
    { expected: 400 },
  );
  const assess = await f.t.call("/assessments", {
    batch_id: f.batch,
    title: "Midterm",
    assessment_type: "oral_practical",
    max_marks: 100,
    assessment_date: "2026-11-05",
    request_id: "req-assess-be04-" + randomUUID(),
  });
  await f.t.call(
    `/assessments/${assess.id}/marks`,
    {
      marks: [{ enrollment_id: other.enr, obtained_marks: 90 }],
    },
    { expected: 400 },
  );

  // BE-05: Announcement branch-wide restriction, 409 idempotency mismatch, and /resources filter + department scoping
  await f.z.call(
    "/announcements",
    {
      branch_id: f.branch,
      title: "Zimmadar Branch-Wide",
      body: "Not allowed without batch",
      priority: "normal",
      request_id: "req-zimm-bw-" + randomUUID(),
    },
    { expected: 403 },
  );
  const annReqId = "req-ann-parity-" + randomUUID();
  await f.admin.call("/announcements", {
    branch_id: f.branch,
    title: "Original Notice",
    body: "Original Body",
    priority: "normal",
    request_id: annReqId,
  });
  await f.admin.call(
    "/announcements",
    {
      branch_id: f.branch,
      title: "Tampered Replay",
      body: "Original Body",
      priority: "normal",
      request_id: annReqId,
    },
    { expected: 409 },
  );

  const validRes = await f.t.call("/resources", {
    course_id: f.course,
    batch_id: f.batch,
    title: "Tajweed Sheet",
    url: "https://example.test/tajweed.pdf",
    category: "material",
    request_id: "req-valid-res-" + randomUUID(),
  });
  assert.ok(validRes.id);
  assert.equal((await f.g.call("/resources?course_id=999999")).length, 0);

  const otherDept = await f.post("/departments", {
    branch_id: f.branch,
    name: "Hifz",
  });
  await f.post("/users", {
    email: `sup${f.suffix}@example.test`,
    name: "Other Dept Supervisor",
    role: "department_supervisor",
    branch_id: f.branch,
    department_id: otherDept,
    password: f.pass,
  });
  const sup = await new Client().login(`sup${f.suffix}@example.test`, f.pass);
  const supResources = await sup.call("/resources");
  assert.ok(!supResources.some((r: any) => r.id === validRes.id));
});
