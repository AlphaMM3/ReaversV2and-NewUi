import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { once } from "node:events";
import { createApp } from "../src/app.js";
import type { Store } from "../src/db.js";

test("HTTP serves the maintained UI and its mobile assets", async () => {
  const server = createApp({} as Store).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const home = await fetch(base);
    assert.equal(home.status, 200);
    const html = await home.text();
    assert.ok(html.includes('id="menuToggle"'));
    assert.ok(html.includes("Staging · Test environment"));
    assert.ok(!html.includes("Local only"));
    const css = await fetch(base + "/static/style.css");
    assert.equal(css.status, 200);
    assert.ok((await css.text()).includes("minmax(0,1fr)"));
    assert.equal(
      (await fetch(base + "/static/../provenance.json")).status,
      404,
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("oversized JSON returns 413 with security headers before any storage access", async () => {
  const server = createApp({} as Store).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "x".repeat(40000) }),
    });
    assert.equal(response.status, 413);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), {
      detail: "Request body exceeds 32 KB",
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

function ui() {
  const elements = new Map<string, any>();
  const element = (id: string) => {
    if (!elements.has(id))
      elements.set(id, {
        innerHTML: "",
        textContent: "",
        onclick: null,
        replaceChildren() {
          this.innerHTML = "";
        },
        classList: {
          add() {},
          remove() {},
          toggle() {
            return false;
          },
        },
        setAttribute() {},
        reset() {},
      });
    return elements.get(id);
  };
  const context: any = {
    document: { querySelector: element, querySelectorAll: () => [] },
    fetch: () => Promise.reject(new Error("No session")),
    setTimeout,
    console,
    Intl,
    Date,
  };
  // Suppress only the automatic session probe; exercise the actual UI functions.
  const source =
    readFileSync("frontend/guardian.js", "utf8") +
    "\n" +
    readFileSync("frontend/attendance-workspace.js", "utf8") + "\n" + readFileSync("frontend/academic-operations.js", "utf8") +
    "\n" +
    readFileSync("frontend/accounts.js", "utf8") +
    "\n" +
    readFileSync("frontend/app.js", "utf8").replace(/initial\(\);\s*$/, "");
  runInNewContext(
    source +
      "\nthis.api={state,menus,render,navigate,clearView,actionClick,accountAction,academicAction,resetPasswordModal,createModal,familyGuardiansModal,reportModal,guardianOverview,publicationCards,progressPublishModal,homeworkPanel,assessmentsPanel,resourcesPanel,announcementsPanel,paymentsPanel,packagesContractsPanel,invoicesPanel,teacherPayablesPanel,setModal:fn=>{modal=fn;}};",
    context,
  );
  return { context, element, api: context.api };
}

test("admission dialog cannot open after account change during option loading", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "guardian_primary" };
  let resolve!: (v: any) => void,
    opened = false;
  context.fetch = () =>
    new Promise((r) => {
      resolve = r;
    });
  api.setModal(() => {
    opened = true;
  });
  const pending = api.academicAction("ops-apply", "");
  api.state.me = { id: 2, role: "guardian_primary" };
  resolve({ ok: true, json: async () => ({ families: [], courses: [] }) });
  await assert.rejects(pending, /view changed/);
  assert.equal(opened, false);
});
test("new course report prompt is escaped and used only before the first report exists", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "teacher" };
  let fields = "";
  api.setModal((_t: string, f: string) => {
    fields = f;
  });
  context.fetch = async () => ({
    ok: true,
    json: async () => ({
      report: null,
      history: [],
      latest_history_id: 0,
      template: { version: 1, prompt: "DEMO <script>lesson</script>" },
    }),
  });
  await api.reportModal(10);
  assert.ok(fields.includes("&lt;script&gt;lesson&lt;/script&gt;"));
  assert.ok(!fields.includes("<script>lesson"));
});
test("an older view response cannot replace a newer navigation result", async () => {
  const { context, element, api } = ui();
  let resolveOld!: (value: any) => void;
  const oldResponse = new Promise((resolve) => {
    resolveOld = resolve;
  });
  context.fetch = (url: string) =>
    url.endsWith("/students")
      ? oldResponse
      : Promise.resolve({ ok: true, json: async () => [] });
  api.state.me = { role: "guardian_primary" };
  api.state.nav = "students";
  const oldRender = api.render();
  api.state.nav = "enrollments";
  await api.render();
  const current = element("#content").innerHTML;
  resolveOld({
    ok: true,
    json: async () => [{ full_name: "OLD ACCOUNT DATA" }],
  });
  await oldRender;
  assert.equal(element("#content").innerHTML, current);
  assert.ok(!current.includes("OLD ACCOUNT DATA"));
});

test("Part 1.1 Branch setup is discoverable only for central admin and posts to the existing API", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "central_admin" };
  assert.ok(api.menus().some((x: any) => x[0] === "branches"));
  let fields = "",
    save: any,
    sent: any;
  api.setModal((_title: string, html: string, submit: any) => {
    fields = html;
    save = submit;
  });
  context.fetch = async (url: string, options: any) => {
    if (options.method === "POST")
      sent = { url, body: JSON.parse(options.body) };
    return { ok: true, json: async () => [] };
  };
  await api.createModal("branches");
  assert.ok(fields.includes("Branch name"));
  await save({ name: "Synthetic New Branch" });
  assert.deepEqual(sent, {
    url: "/api/branches",
    body: { name: "Synthetic New Branch" },
  });
  for (const role of [
    "branch_admin",
    "teacher",
    "guardian_primary",
    "guardian_secondary",
  ]) {
    api.state.me = { role };
    assert.ok(!api.menus().some((x: any) => x[0] === "branches"));
  }
});

test("Part 1.3 guardian setup lists escaped identities and offers only unlinked same-branch Guardians", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "central_admin" };
  let fields = "",
    save: any,
    sent: any;
  api.setModal((_title: string, html: string, submit: any) => {
    fields = html;
    save = submit;
  });
  context.fetch = async (url: string, options: any) => {
    if (options.method === "POST") {
      sent = { url, body: JSON.parse(options.body) };
      return { ok: true, json: async () => ({ ok: true }) };
    }
    const data = url.endsWith("/families")
      ? [{ id: 4, branch_id: 2, name: "Synthetic Family" }]
      : url.endsWith("/users")
        ? [
            { id: 7, name: "Linked", role: "guardian_primary", branch_id: 2 },
            {
              id: 8,
              name: "Secondary",
              role: "guardian_secondary",
              branch_id: 2,
            },
            {
              id: 9,
              name: "Other branch private name",
              role: "guardian_secondary",
              branch_id: 3,
            },
            { id: 10, name: "Not a Guardian", role: "teacher", branch_id: 2 },
          ]
        : [
            {
              id: 7,
              name: "<script>bad()</script>",
              role: "guardian_primary",
              active: 1,
            },
          ];
    return { ok: true, json: async () => data };
  };
  await api.familyGuardiansModal(4);
  assert.ok(fields.includes("&lt;script&gt;"));
  assert.ok(!fields.includes("<script>"));
  assert.ok(fields.includes("Secondary"));
  assert.ok(!fields.includes("Other branch private name"));
  assert.ok(!fields.includes("Not a Guardian"));
  await save({ guardian_user_id: "8" });
  assert.deepEqual(sent, {
    url: "/api/families/4/guardians",
    body: { guardian_user_id: 8 },
  });
  api.state.me = { id: 2, role: "guardian_secondary" };
  await assert.rejects(
    save({ guardian_user_id: "8" }),
    /Account or view changed/,
  );
});

test("a pending family Guardian dialog cannot expose previous-account data", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "central_admin" };
  let opened = false;
  // Resolve all three requests together using one shared pending response.
  let release!: (value: any) => void;
  const response = new Promise((r) => {
    release = r;
  });
  context.fetch = () => response;
  api.setModal(() => {
    opened = true;
  });
  const pending = api.familyGuardiansModal(4);
  api.clearView();
  release({ ok: true, json: async () => [] });
  await pending;
  assert.equal(opened, false);
});

test("failed async foundation dialogs display an error instead of an unhandled rejection", async () => {
  for (const action of ["family-guardians", "report", "publish-progress"]) {
    const { api, context, element } = ui();
    api.state.me = { id: 1, role: "central_admin" };
    context.fetch = async () => ({
      ok: false,
      json: async () => ({ detail: "Synthetic request failed" }),
    });
    await api.actionClick({
      target: { closest: () => ({ dataset: { action, id: "4" } }) },
    });
    assert.equal(element("#toast").textContent, "Synthetic request failed");
  }
});

test("clearing the account view invalidates pending responses", async () => {
  const { context, element, api } = ui();
  let resolveOld!: (value: any) => void;
  context.fetch = () =>
    new Promise((resolve) => {
      resolveOld = resolve;
    });
  api.state.me = { role: "guardian_primary" };
  api.state.nav = "students";
  element("#content").innerHTML = "previous account";
  const pending = api.render();
  api.clearView();
  assert.equal(element("#content").innerHTML, "");
  resolveOld({
    ok: true,
    json: async () => [{ full_name: "previous account" }],
  });
  await pending;
  assert.equal(element("#content").innerHTML, "");
});

test("report return uses a required reason dialog rather than native prompt", async () => {
  const { context, api } = ui();
  let fields = "",
    submit: any;
  api.setModal((_title: string, html: string, save: any) => {
    fields = html;
    submit = save;
  });
  await api.actionClick({
    target: { closest: () => ({ dataset: { action: "return", id: "3" } }) },
  });
  assert.ok(fields.includes('name="reason" required'));
  await assert.rejects(submit({ reason: "  " }), /reason is required/);
  let sent: any;
  context.fetch = async (url: string, options: any) => {
    sent = { url, ...options };
    return { ok: true, json: async () => ({ ok: true }) };
  };
  api.state.csrf = "synthetic-test-token";
  await submit({ reason: " SAMPLE needs detail " });
  assert.equal(sent.url, "/api/reports/3/review");
  assert.equal(sent.headers["x-csrf-token"], "synthetic-test-token");
  assert.deepEqual(JSON.parse(sent.body), {
    action: "return_report",
    reason: "SAMPLE needs detail",
  });
});

test("Guardian overview groups own children, both enrollment modes and honest missing attendance", async () => {
  const { context, api } = ui();
  api.state.me = { role: "guardian_primary" };
  const data: any = {
    "/students": [
      { id: 1, full_name: "Child A" },
      { id: 2, full_name: "Child B" },
    ],
    "/enrollments": [
      {
        student_id: 1,
        course_title: "Group Course",
        batch_name: "Group",
        delivery_mode: "group",
        start_date: "2026-01-01",
        status: "active",
      },
      {
        student_id: 1,
        course_title: "Individual Course",
        batch_name: "Individual",
        delivery_mode: "one_to_one",
        start_date: "2026-01-01",
        status: "active",
      },
    ],
    "/attendance/monthly": [
      {
        student_id: 1,
        course_title: "Group Course",
        batch_name: "Group",
        held_classes: 1,
        present: 0,
        late: 0,
        absent: 0,
        unrecorded: 1,
        attendance_percent: null,
      },
    ],
    "/guardian/attendance": [
      {
        student_id: 1,
        course_title: "Group Course",
        batch_name: "Group",
        scheduled_start: "2026-11-01T12:00:00+06:00",
        attendance_status: null,
      },
    ],
    "/progress": [
      {
        id: 1,
        student_id: 1,
        student_name: "Child A",
        course_title: "Group Course",
        batch_name: "Group",
        delivery_mode: "group",
        title: "Family update",
        progress_summary: "Sample progress",
        homework_summary: "Sample homework",
      },
    ],
  };
  context.fetch = async (url: string) => ({
    ok: true,
    json: async () => data[url.slice(4).split("?")[0]],
  });
  let html = await api.guardianOverview();
  for (const expected of [
    "Child A",
    "Child B",
    "one_to_one",
    "group",
    "Unrecorded",
    "Sample progress",
    "Sample homework",
  ])
    assert.ok(html.includes(expected), expected);
  api.state.guardianChild = "1";
  html = await api.guardianOverview();
  assert.equal((html.match(/class="panel guardian-child"/g) || []).length, 1);
  assert.ok(!html.includes("<h2>Child B</h2>"));
});

test("published summary display escapes text and ignores unrelated internal fields", () => {
  const { api } = ui();
  const html = api.publicationCards([
    {
      title: "<script>bad()</script>",
      student_name: "<img src=x>",
      progress_summary: "<b>plain text</b>",
      homework_summary: "<svg onload=bad()>",
      body: "SECRET INTERNAL NOTE",
    },
  ]);
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("<svg"));
  assert.ok(html.includes("&lt;b&gt;plain text&lt;/b&gt;"));
  assert.ok(!html.includes("SECRET INTERNAL NOTE"));
});

test("pending publish form does not reopen with previous-account learner data", async () => {
  const { api, context } = ui();
  let resolve!: (v: any) => void,
    opened = false;
  context.fetch = () =>
    new Promise((r) => {
      resolve = r;
    });
  api.state.me = { id: 7, role: "zimmadar" };
  api.setModal(() => {
    opened = true;
  });
  const pending = api.progressPublishModal();
  api.state.me = { id: 8, role: "guardian_primary" };
  resolve({
    ok: true,
    json: async () => [{ id: 99, student_name: "PRIVATE PREVIOUS ACCOUNT" }],
  });
  await pending;
  assert.equal(opened, false);
});

test("report editor prefills escaped returned text and sends its version token", async () => {
  const { api, context } = ui();
  api.state.me = { id: 3, role: "teacher" };
  let fields = "",
    submit: any,
    sent: any;
  api.setModal((_title: string, html: string, save: any) => {
    fields = html;
    submit = save;
  });
  context.fetch = async (url: string, options: any) => {
    if (options.method === "POST") {
      sent = { url, ...options };
      return { ok: true, json: async () => ({}) };
    }
    return {
      ok: true,
      json: async () => ({
        report: {
          id: 7,
          status: "returned",
          body: "</textarea><script>bad()</script>",
          revision: 1,
          review_reason: "Add lesson detail",
        },
        history: [
          {
            id: 10,
            revision: 1,
            event: "submit",
            body: "Old <b>text</b>",
            actor_id: 3,
          },
        ],
        latest_history_id: 10,
      }),
    };
  };
  await api.reportModal(2);
  assert.ok(fields.includes("&lt;/textarea&gt;&lt;script&gt;"));
  assert.ok(!fields.includes("<script>"));
  assert.ok(fields.includes("Add lesson detail"));
  assert.ok(fields.includes("Old &lt;b&gt;text&lt;/b&gt;"));
  await submit({ body: "Revised", submit: "true" });
  assert.equal(sent.url, "/api/classes/2/report");
  assert.deepEqual(JSON.parse(sent.body), {
    body: "Revised",
    submit: true,
    expected_history_id: 10,
  });
});

test("report review requires return reason and targets the displayed revision", async () => {
  const { api, context } = ui();
  api.state.me = { id: 4, role: "zimmadar" };
  let save: any, sent: any;
  api.setModal((_title: string, _fields: string, submit: any) => {
    save = submit;
  });
  context.fetch = async (url: string, options: any) => {
    if (options.method === "POST")
      sent = { url, body: JSON.parse(options.body) };
    return {
      ok: true,
      json: async () => ({
        report: {
          id: 7,
          status: "submitted",
          body: "Internal lesson",
          revision: 2,
        },
        history: [],
        latest_history_id: 12,
      }),
    };
  };
  await api.reportModal(2);
  await assert.rejects(
    save({ action: "return_report", reason: "  " }),
    /reason is required/,
  );
  assert.equal(Boolean(sent), false);
  await save({ action: "return_report", reason: " More detail " });
  assert.deepEqual(sent, {
    url: "/api/reports/7/review",
    body: {
      action: "return_report",
      reason: "More detail",
      expected_history_id: 12,
    },
  });
});

test("submitted and approved reports are read-only for their Teacher", async () => {
  for (const status of ["submitted", "approved"]) {
    const { api, context } = ui();
    api.state.me = { id: 3, role: "teacher" };
    let save: any,
      fields = "";
    api.setModal((_title: string, html: string, submit: any) => {
      fields = html;
      save = submit;
    });
    context.fetch = async () => ({
      ok: true,
      json: async () => ({
        report: { status, body: "Frozen content" },
        history: [],
      }),
    });
    await api.reportModal(2);
    assert.equal(save, null);
    assert.ok(fields.includes("Frozen content"));
    assert.ok(!fields.includes('name="body"'));
  }
});

test("a delayed report cannot reopen after account or navigation changes", async () => {
  for (const change of ["account", "navigation"]) {
    const { api, context } = ui();
    api.state.me = { id: 3, role: "teacher" };
    let resolve!: (value: any) => void,
      opened = false;
    context.fetch = () =>
      new Promise((r) => {
        resolve = r;
      });
    api.setModal(() => {
      opened = true;
    });
    const pending = api.reportModal(2);
    if (change === "account")
      api.state.me = { id: 4, role: "guardian_primary" };
    else api.clearView();
    resolve({
      ok: true,
      json: async () => ({ report: null, history: [], latest_history_id: 0 }),
    });
    await pending;
    assert.equal(opened, false);
  }
});

test("password form validates confirmation and never submits an old-account callback", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "teacher" };
  let save: any, sent: any;
  api.setModal((_title: string, _fields: string, fn: any) => {
    save = fn;
  });
  context.fetch = async (url: string, options: any) => {
    sent = { url, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ sign_in_required: true }) };
  };
  await api.accountAction("password", "");
  await assert.rejects(
    save({ password: "one", confirm: "two" }),
    /do not match/,
  );
  assert.equal(Boolean(sent), false);
  const response = await save({
    current_password: "synthetic-old",
    password: "synthetic-new",
    confirm: "synthetic-new",
  });
  assert.equal(response.sign_in_required, true);
  assert.equal(sent.body.current_password, "synthetic-old");
  assert.ok(!("confirm" in sent.body));
  api.clearView();
  await assert.rejects(
    save({ password: "same", confirm: "same" }),
    /view changed/,
  );
});

test("ending a class opens its report form after refreshing the class list", async () => {
  const { api, context } = ui();
  api.state.me = { id: 3, role: "teacher" };
  api.state.nav = "classes";
  let opened = "";
  api.setModal((title: string) => {
    opened = title;
  });
  context.fetch = async (url: string) => ({
    ok: true,
    json: async () =>
      url.endsWith("/classes")
        ? []
        : url.endsWith("/report")
          ? { report: null, history: [], latest_history_id: 0 }
          : { ok: true },
  });
  await api.actionClick({
    target: { closest: () => ({ dataset: { action: "end", id: "2" } }) },
  });
  assert.equal(opened, "Class report — Class #2");
});

test("M4/M5 learning and support navigation items are correctly role-scoped", () => {
  const { api } = ui();
  // Central admin has homework, assessments, resources, announcements, payments
  api.state.me = { id: 1, role: "central_admin" };
  const adminMenus = api.menus().map((m: any) => m[0]);
  assert.ok(adminMenus.includes("homework"));
  assert.ok(adminMenus.includes("assessments"));
  assert.ok(adminMenus.includes("resources"));
  assert.ok(adminMenus.includes("announcements"));
  assert.ok(adminMenus.includes("payments"));

  // Teacher has homework, assessments, resources, announcements (no payments)
  api.state.me = { id: 2, role: "teacher" };
  const teacherMenus = api.menus().map((m: any) => m[0]);
  assert.ok(teacherMenus.includes("homework"));
  assert.ok(teacherMenus.includes("assessments"));
  assert.ok(teacherMenus.includes("resources"));
  assert.ok(teacherMenus.includes("announcements"));
  assert.ok(!teacherMenus.includes("payments"));

  // Guardian has homework, resources, announcements (no assessments management or admin payments)
  api.state.me = { id: 3, role: "guardian_primary" };
  const guardianMenus = api.menus().map((m: any) => m[0]);
  assert.ok(guardianMenus.includes("homework"));
  assert.ok(!guardianMenus.includes("assessments"));
  assert.ok(guardianMenus.includes("resources"));
  assert.ok(guardianMenus.includes("announcements"));
  assert.ok(!guardianMenus.includes("payments"));
});

test("homeworkPanel renders assignments table, escapes content and provides assign action", async () => {
  const { api, context } = ui();
  api.state.me = { id: 2, role: "teacher" };
  context.fetch = async () => ({
    ok: true,
    json: async () => [
      {
        id: 10,
        title: "Memorize Surah Al-Mulk <script>",
        course_title: "Hifz 101",
        batch_name: "Batch Alpha",
        due_date: "2026-11-15",
        teacher_name: "Ustadz Ahmad",
      },
    ],
  });
  const html = await api.homeworkPanel();
  assert.ok(html.includes("Assign homework"));
  assert.ok(html.includes("Memorize Surah Al-Mulk &lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("data-action=\"ops-hw-submissions\""));
});

test("assessmentsPanel displays status tags, max marks and publication action for Zimmadar", async () => {
  const { api, context } = ui();
  api.state.me = { id: 4, role: "zimmadar" };
  context.fetch = async () => ({
    ok: true,
    json: async () => [
      {
        id: 5,
        title: "Midterm Oral Test",
        course_title: "Quran Recitation",
        batch_name: "Morning Slot",
        assessment_type: "oral_practical",
        max_marks: 50,
        assessment_date: "2026-11-20",
        status: "draft",
      },
    ],
  });
  const html = await api.assessmentsPanel();
  assert.ok(html.includes("Midterm Oral Test"));
  assert.ok(html.includes("50"));
  assert.ok(html.includes("data-action=\"ops-assessment-publish\""));
});

test("paymentsPanel displays external payment governance notice and records", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "central_admin" };
  context.fetch = async () => ({
    ok: true,
    json: async () => [
      {
        id: 1,
        student_name: "Zayd Mahmud",
        course_title: "Maktab Core",
        batch_name: "Batch A",
        billing_month: "2026-11",
        reference_code: "TXN-987654",
        payment_status: "paid",
        verified_at: "2026-11-01T10:00:00Z",
        notes: "Portal verified",
      },
    ],
  });
  const html = await api.paymentsPanel();
  assert.ok(html.includes("D-015 / D-141: External Payment Portal"));
  assert.ok(html.includes("TXN-987654"));
  assert.ok(html.includes("Record payment reference"));
});

test("ops-status dialog supports course completion with last active date and reason", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "central_admin" };
  let modalTitle = "",
    modalContent = "";
  api.setModal((title: string, content: string) => {
    modalTitle = title;
    modalContent = content;
  });
  context.fetch = async (url: string) => {
    if (url.includes("/enrollments/10/status-history")) {
      return {
        ok: true,
        json: async () => [
          {
            at: "2026-10-01T08:00:00Z",
            to_status: "active",
            reason: "Initial enrollment",
          },
        ],
      };
    }
    return {
      ok: true,
      json: async () => [
        {
          id: 10,
          student_name: "Ahmad",
          course_title: "Quran Recitation",
          batch_name: "Batch 1",
          status: "active",
          end_date: null,
        },
      ],
    };
  };
  await api.academicAction("ops-status", "10");
  assert.equal(modalTitle, "Enrollment status");
  assert.ok(modalContent.includes('value="completed"'));
  assert.ok(modalContent.includes("Last active date"));
  assert.ok(modalContent.includes("Initial enrollment"));
});

test("announcementsPanel and resourcesPanel render scoped lists and action buttons", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "central_admin" };
  context.fetch = async (url: string) => {
    if (url.includes("/announcements")) {
      return {
        ok: true,
        json: async () => [
          {
            id: 1,
            title: "Ramadan Schedule Update",
            audience: "branch",
            branch_id: 1,
            created_at: "2026-11-01T08:00:00Z",
            body: "Class timings will be updated for Ramadan.",
          },
        ],
      };
    }
    if (url.includes("/resources")) {
      return {
        ok: true,
        json: async () => [
          {
            id: 2,
            title: "Tajweed Reference PDF",
            course_title: "Quran Recitation",
            batch_name: "Batch A",
            url: "https://example.com/tajweed.pdf",
            created_at: "2026-11-01T08:00:00Z",
          },
        ],
      };
    }
    return { ok: true, json: async () => [] };
  };
  const annHtml = await api.announcementsPanel();
  assert.ok(annHtml.includes("Ramadan Schedule Update"));
  assert.ok(annHtml.includes("Post announcement"));
  assert.ok(annHtml.includes("ops-new-announcement"));

  const resHtml = await api.resourcesPanel();
  assert.ok(resHtml.includes("Tajweed Reference PDF"));
  assert.ok(resHtml.includes("https://example.com/tajweed.pdf"));
  assert.ok(resHtml.includes("Add resource"));
  assert.ok(resHtml.includes("ops-new-resource"));
});

test("packagesContractsPanel renders 1:1 contracts, minute progress, package catalog, and minute ledger action", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "central_admin" };
  context.fetch = async (url: string) => {
    if (url.includes("/one-to-one/contracts")) {
      return {
        ok: true,
        json: async () => [
          {
            id: 1,
            student_name: "Abdullah al Mahdi",
            package_name: "Monthly 8-Class Solo",
            batch_name: "1:1 Solo Hifz Slot",
            billing_period: "2026-11",
            allocated_minutes: 360,
            used_minutes: 90,
            remaining_minutes: 270,
            fee_amount: "5000.00",
            currency: "BDT",
            status: "active",
          },
        ],
      };
    }
    if (url.includes("/one-to-one/packages")) {
      return {
        ok: true,
        json: async () => [
          {
            id: 1,
            name: "Monthly 8-Class Solo",
            code: "SOLO-8",
            total_classes: 8,
            total_minutes: 360,
            fee_amount: "5000.00",
            currency: "BDT",
            validity_days: 30,
            active: 1,
          },
        ],
      };
    }
    return { ok: true, json: async () => [] };
  };

  const html = await api.packagesContractsPanel();
  assert.ok(html.includes("Commercial 1:1 Packages &amp; Contracts"));
  assert.ok(html.includes("Abdullah al Mahdi"));
  assert.ok(html.includes("SOLO-8"));
  assert.ok(html.includes("90m used"));
  assert.ok(html.includes("270m left"));
  assert.ok(html.includes("data-action=\"ops-view-ledger\""));
  assert.ok(html.includes("data-action=\"ops-new-contract\""));
});

test("invoicesPanel renders tuition invoices, fee amounts, payment reference matching, and payment recording", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "central_admin" };
  context.fetch = async () => ({
    ok: true,
    json: async () => [
      {
        id: 1,
        invoice_number: "INV-202611-4-1001",
        student_name: "Abdullah al Mahdi",
        course_title: "Quran Recitation",
        batch_name: "1:1 Solo",
        billing_month: "2026-11",
        amount_due: "5000.00",
        amount_paid: "5000.00",
        due_date: "2026-11-05",
        status: "paid",
        payment_reference_code: "TRX-BKASH-89214710",
      },
      {
        id: 2,
        invoice_number: "INV-202611-2-1003",
        student_name: "Mariam Binte Rafiq",
        course_title: "Noorani Qaida",
        batch_name: "Batch B",
        billing_month: "2026-11",
        amount_due: "2500.00",
        amount_paid: "0.00",
        due_date: "2026-11-15",
        status: "unpaid",
        payment_reference_code: null,
      },
    ],
  });

  const html = await api.invoicesPanel();
  assert.ok(html.includes("Tuition Invoices &amp; Fee Billing"));
  assert.ok(html.includes("INV-202611-4-1001"));
  assert.ok(html.includes("TRX-BKASH-89214710"));
  assert.ok(html.includes("Mariam Binte Rafiq"));
  assert.ok(html.includes("data-action=\"ops-record-invoice-payment\""));
  assert.ok(html.includes("data-action=\"ops-new-invoice\""));
});

test("teacherPayablesPanel renders session compensation, hourly rate, and calculate payable action", async () => {
  const { api, context } = ui();
  api.state.me = { id: 1, role: "central_admin" };
  context.fetch = async () => ({
    ok: true,
    json: async () => [
      {
        id: 1,
        teacher_id: 5,
        teacher_name: "Hafez Mahmud Hasan",
        teacher_email: "teacher2@academy.test",
        class_session_id: 2,
        course_title: "Hifzul Quran 1:1",
        billing_month: "2026-11",
        conducted_minutes: 45,
        hourly_rate: "400.00",
        payable_amount: "300.00",
        status: "verified",
        calculated_at: "2026-11-06T18:00:00Z",
      },
    ],
  });

  const html = await api.teacherPayablesPanel();
  assert.ok(html.includes("Teacher Compensation &amp; Payables"));
  assert.ok(html.includes("Hafez Mahmud Hasan"));
  assert.ok(html.includes("#CLS-0002"));
  assert.ok(html.includes("300"));
  assert.ok(html.includes("data-action=\"ops-calc-payable\""));
});

test("Commercial & Finance navigation items are properly role-scoped", () => {
  const { api } = ui();

  // Central Admin sees packages, invoices, payables
  api.state.me = { id: 1, role: "central_admin" };
  const adminMenus = api.menus().map((m: any) => m[0]);
  assert.ok(adminMenus.includes("packages-contracts"));
  assert.ok(adminMenus.includes("invoices"));
  assert.ok(adminMenus.includes("teacher-payables"));

  // Teacher sees packages, payables (not invoices)
  api.state.me = { id: 2, role: "teacher" };
  const teacherMenus = api.menus().map((m: any) => m[0]);
  assert.ok(teacherMenus.includes("packages-contracts"));
  assert.ok(teacherMenus.includes("teacher-payables"));
  assert.ok(!teacherMenus.includes("invoices"));

  // Guardian sees packages, invoices (not teacher-payables)
  api.state.me = { id: 4, role: "guardian_primary" };
  const guardianMenus = api.menus().map((m: any) => m[0]);
  assert.ok(guardianMenus.includes("packages-contracts"));
  assert.ok(guardianMenus.includes("invoices"));
  assert.ok(!guardianMenus.includes("teacher-payables"));
});

test("staff dashboards are tailored per role (teacher, zimmadar, central_admin) and handle data-nav", async () => {
  const { api, context, element } = ui();
  const mockFetch = (url: string) => {
    const path = url.replace(/^\/api/, "").split("?")[0];
    const data: Record<string, any> = {
      "/summary": { students: 3, enrollments: 4, classes: 5, group_enrollments: 3, one_to_one_enrollments: 1 },
      "/classes": [
        { id: 11, course_title: "Quran Tajweed", batch_name: "Batch A", delivery_mode: "group", scheduled_start: "2026-11-11T09:00:00+06:00", scheduled_end: "2026-11-11T10:00:00+06:00", status: "ended", held_verified: 0 },
      ],
      "/reports": [
        { id: 21, class_id: 9, course_title: "Quran Tajweed", batch_name: "Batch A", status: "submitted", first_submitted_at: "2026-11-10T12:00:00Z" },
        { id: 22, class_id: 10, course_title: "Fiqh", batch_name: "Batch B", status: "returned", review_reason: "Add summary", updated_at: "2026-11-10T13:00:00Z" },
      ],
      "/report-monitor": [
        { class_id: 11, course_title: "Quran Tajweed", batch_name: "Batch A", submission_outstanding: true, overdue: false, due_at: "2026-11-11T23:59:00+06:00" },
      ],
      "/homework": [{ id: 1, title: "Surah Mulk" }],
      "/leaves": [{ id: 31, student_name: "Anas", course_title: "Quran Tajweed", start_date: "2026-11-12", end_date: "2026-11-13", reason: "Travel", status: "pending" }],
      "/followups": { items: [{ id: 41, student_name: "Mariyam", course_title: "Fiqh", reason: "3 absences", status: "pending" }] },
    };
    return Promise.resolve({ ok: true, json: async () => data[path] ?? [] });
  };
  context.fetch = mockFetch;

  // Teacher dashboard
  api.state.me = { id: 2, role: "teacher" };
  api.state.nav = "dashboard";
  await api.render();
  const teacherHtml = element("#content").innerHTML;
  assert.ok(teacherHtml.includes("My Teaching Tasks"));
  assert.ok(teacherHtml.includes("Reports To Submit"));
  assert.ok(teacherHtml.includes("Revise Report"));
  assert.ok(teacherHtml.includes("Write Report"));
  assert.ok(teacherHtml.includes("My Homework"));
  assert.ok(!teacherHtml.includes("Course Enrollments"));
  assert.ok(!teacherHtml.includes("Export CSV"));
  assert.ok(!teacherHtml.includes("+ Schedule Class"));
  assert.ok(!teacherHtml.includes("View Weekly Routine"));

  // Zimmadar dashboard
  api.state.me = { id: 3, role: "zimmadar" };
  api.state.nav = "dashboard";
  await api.render();
  const zimmadarHtml = element("#content").innerHTML;
  assert.ok(zimmadarHtml.includes("Zimmadar Review &amp; Care Queue"));
  assert.ok(zimmadarHtml.includes("Reports To Review"));
  assert.ok(zimmadarHtml.includes("Held Verification"));
  assert.ok(zimmadarHtml.includes("Verify held"));
  assert.ok(zimmadarHtml.includes("Publish Progress"));
  assert.ok(zimmadarHtml.includes("View Weekly Routine"));
  assert.ok(!zimmadarHtml.includes("Course Enrollments"));
  assert.ok(!zimmadarHtml.includes("Export CSV"));

  // Central Admin dashboard
  api.state.me = { id: 1, role: "central_admin" };
  api.state.nav = "dashboard";
  await api.render();
  const adminHtml = element("#content").innerHTML;
  assert.ok(adminHtml.includes("Active Learners"));
  assert.ok(adminHtml.includes("Course Enrollments"));
  assert.ok(adminHtml.includes("Academic Action Center"));
  assert.ok(adminHtml.includes("Export CSV"));

  // [data-nav] inside #content navigates cleanly
  await api.actionClick({
    target: {
      closest: (sel: string) => (sel === "[data-nav]" ? { dataset: { nav: "homework" } } : null),
    },
  });
  assert.equal(api.state.nav, "homework");
});

test("dashboards surface partial load errors, UTC-to-Dhaka today matching, and overflow indicators", async () => {
  const { api, context, element } = ui();
  const bdToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  const utcEveningPrior = new Date(new Date(bdToday + "T01:00:00+06:00").getTime()).toISOString();

  context.fetch = (url: string) => {
    const path = url.replace(/^\/api/, "").split("?")[0];
    if (path === "/reports") return Promise.reject(new Error("Reports unavailable"));
    const data: Record<string, any> = {
      "/summary": { students: 2, enrollments: 2, classes: 1, group_enrollments: 2, one_to_one_enrollments: 0, active_enrollments: 2 },
      "/classes": [{ id: 55, course_title: "Hadith", batch_name: "Dawn", delivery_mode: "group", scheduled_start: utcEveningPrior, scheduled_end: utcEveningPrior, status: "scheduled", held_verified: 0 }],
      "/leaves": [],
      "/followups": { items: [{ id: 1, student_name: "S", course_title: "Hadith", status: "pending" }], next_before: 99 },
    };
    return Promise.resolve({ ok: true, json: async () => data[path] ?? [] });
  };

  api.state.me = { id: 3, role: "zimmadar" };
  api.state.nav = "dashboard";
  await api.render();
  const html = element("#content").innerHTML;
  assert.ok(html.includes("Some dashboard metrics could not be loaded (Reports)"), "should surface degraded state");
  assert.ok(html.includes("Hadith"), "UTC timestamp falling on Asia/Dhaka today must appear in Today's Sessions");
  assert.ok(html.includes("1+"), "truncated followups with next_before should display + suffix");
});

test("HTTP serves modern React UI at /app alongside classic UI at / and returns structured 422 fields", async () => {
  const server = createApp({} as Store).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;

    const modernRes = await fetch(base + "/app");
    assert.equal(modernRes.status, 200);
    const modernHtml = await modernRes.text();
    assert.ok(modernHtml.includes('id="root"'));
    assert.ok(modernHtml.includes("/app/assets/"));

    const classicRes = await fetch(base + "/");
    assert.equal(classicRes.status, 200);
    assert.ok((await classicRes.text()).includes('id="menuToggle"'));

    const zodRes = await fetch(base + "/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: 123 }),
    });
    assert.equal(zodRes.status, 422);
    const zodJson = await zodRes.json();
    assert.equal(zodJson.detail, "Invalid input");
    assert.ok(zodJson.fields && typeof zodJson.fields === "object");
    assert.ok(zodJson.fields.email);
    assert.ok(zodJson.fields.password);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});



