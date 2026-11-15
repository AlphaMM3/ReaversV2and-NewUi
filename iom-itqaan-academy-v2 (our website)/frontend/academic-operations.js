function chosen(label, name, options, value, required = true) {
  return select(label, name, options, required).replace(
    `value="${escapeHtml(value ?? "")}"`,
    `value="${escapeHtml(value ?? "")}" selected`,
  );
}
function dateInput(label, name, value = "", required = true) {
  return `<label>${escapeHtml(label)}<input type="date" name="${name}" value="${escapeHtml(value || "")}" ${required ? "required" : ""}></label>`;
}
function opsDialog(title, fields, save, label = "Save") {
  const actor = state.me,
    version = state.renderVersion;
  return modal(
    title,
    fields,
    save
      ? async (d) => {
          if (actor !== state.me || version !== state.renderVersion)
            throw Error("Account or view changed");
          return save(d);
        }
      : null,
    label,
  );
}
async function admissionsPanel() {
  const raw = await request("/admissions");
  const data = Array.isArray(raw) ? raw : [];
  const submittedCount = data.filter(a => a.status === 'submitted').length;
  const reviewingCount = data.filter(a => a.status === 'reviewing').length;
  const acceptedCount = data.filter(a => a.status === 'accepted' || a.status === 'enrolled').length;

  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${data.length}</span>
        <span class="deck-kpi-label">Total Applications</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num${submittedCount > 0 ? ' warn' : ''}">${submittedCount}</span>
        <span class="deck-kpi-label">Pending Review</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${reviewingCount}</span>
        <span class="deck-kpi-label">Under Review</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num ok">${acceptedCount}</span>
        <span class="deck-kpi-label">Accepted / Enrolled</span>
      </div>
    </div>
  `;

  return wrap(
    "Admissions & applications",
    admin() || state.me.role === "guardian_primary"
      ? btn(admin() ? "Add application" : "Apply", "ops-apply", "")
      : "",
    summaryStrip +
      (data.length
        ? '<div class="admission-list">' +
          data
            .map(
              (a) =>
                `<article class="admission-row"><div class="admission-main"><strong>${escapeHtml(a.student_name)}</strong><span>${escapeHtml(a.course_title)}</span></div><div class="admission-state">${tag(a.status)}<span>${escapeHtml(a.method)}</span></div><div class="inline-actions">${admin() && ["submitted", "reviewing"].includes(a.status) ? btn("Review", "ops-review", a.id) + btn("Accept / enroll", "ops-accept", a.id) : escapeHtml(a.review_reason || "")}</div></article>`,
            )
            .join("") +
          "</div>"
        : '<div class="empty">No applications yet.</div>')
  );
}

async function sessionsPanel() {
  const raw = await request("/academic-sessions");
  const data = Array.isArray(raw) ? raw : [];
  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${data.length}</span>
        <span class="deck-kpi-label">Academic Sessions</span>
      </div>
    </div>
  `;
  return wrap(
    "Academic sessions",
    btn("Add session", "ops-session", ""),
    summaryStrip +
    tableSearchToolbar("sessions-tbl", "Search sessions...") +
    table(
      ["Session", "Branch", "Start", "End"],
      data.map(
        (r) =>
          `<tr>${item(r.label)}${item(r.branch_id)}${item(r.start_date)}${item(r.end_date)}</tr>`,
      ),
      "sessions-tbl"
    ),
  );
}
async function routinesPanel() {
  const raw = await request("/routines");
  const data = Array.isArray(raw) ? raw : [];
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const byDay = Array.from({ length: 7 }, () => []);
  let activeCount = 0;
  const batchesSet = new Set();

  data.forEach((r) => {
    const dayIdx = Number(r.weekday);
    if (dayIdx >= 0 && dayIdx < 7) {
      byDay[dayIdx].push(r);
    }
    if (r.active) activeCount++;
    if (r.batch_name) batchesSet.add(r.batch_name);
  });

  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${data.length}</span>
        <span class="deck-kpi-label">Weekly Slots</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${activeCount}</span>
        <span class="deck-kpi-label">Active Routines</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${batchesSet.size}</span>
        <span class="deck-kpi-label">Covered Batches</span>
      </div>
    </div>
  `;

  let gridHtml = '<div class="routine-grid">';
  for (let i = 0; i < 7; i++) {
    const daySlots = byDay[i];
    const hasSlots = daySlots.length > 0;
    gridHtml += `
      <div class="routine-day-card">
        <div class="routine-day-header">
          <span>${days[i]}</span>
          <span class="routine-day-badge${hasSlots ? " has-slots" : ""}">${daySlots.length} slot${daySlots.length === 1 ? "" : "s"}</span>
        </div>
        <div class="routine-slots-list">
          ${
            hasSlots
              ? daySlots
                  .map((r) => {
                    const timeRange = escapeHtml(r.start_time + " – " + r.end_time);
                    const dateRange = escapeHtml(r.from_date + " to " + r.until_date);
                    const actions = r.active
                      ? btn("Generate classes", "ops-generate", r.id) +
                        btn("Stop slot", "ops-stop-routine", r.id)
                      : '<span class="pill muted">Inactive</span>';
                    return `
                      <div class="routine-slot-item${r.active ? "" : " inactive"}">
                        <div class="routine-slot-top">
                          <span class="routine-slot-batch">${escapeHtml(r.batch_name)}</span>
                          <span class="routine-slot-time">${timeRange}</span>
                        </div>
                        <div class="routine-slot-dates">Effective: ${dateRange}</div>
                        <div class="routine-slot-actions">${actions}</div>
                      </div>
                    `;
                  })
                  .join("")
              : '<div class="routine-empty-day">No recurring slots</div>'
          }
        </div>
      </div>
    `;
  }
  gridHtml += "</div>";

  return wrap(
    "Weekly Routine & Timetable",
    btn("+ Add Weekly Slot", "ops-routine", ""),
    summaryStrip + gridHtml
  );
}
async function homeworkPanel() {
  const raw = await request("/homework");
  const data = Array.isArray(raw) ? raw : [];
  const canAssign = admin() || state.me.role === "teacher";
  const filterOpts = [
    ["", "All statuses"],
    ["assigned", "Assigned"],
    ["submitted", "Submitted"],
    ["reviewed", "Reviewed"],
  ];
  if (!staff()) {
    const assignedCount = data.filter(h => h.status === 'assigned').length;
    const submittedCount = data.filter(h => h.status === 'submitted').length;
    const reviewedCount = data.filter(h => h.status === 'reviewed').length;
    const summaryStrip = `
      <div class="deck-kpi-strip">
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${data.length}</span>
          <span class="deck-kpi-label">Total Assignments</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num${assignedCount > 0 ? ' warn' : ''}">${assignedCount}</span>
          <span class="deck-kpi-label">To Complete</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num">${submittedCount}</span>
          <span class="deck-kpi-label">Submitted</span>
        </div>
        <div class="deck-kpi-item">
          <span class="deck-kpi-num ok">${reviewedCount}</span>
          <span class="deck-kpi-label">Reviewed</span>
        </div>
      </div>
    `;
    return wrap(
      "Homework",
      "",
      summaryStrip +
      tableSearchToolbar("hw-tbl", "Search homework by title, course...", filterOpts) +
      table(
        ["Assignment", "Student", "Course / Batch", "Due date", "Status", "Feedback"],
        data.map(
          (h) =>
            `<tr>${item(h.title)}${item(h.student_name)}${item(h.course_title + " / " + h.batch_name)}${item(h.due_date)}<td>${tag(h.status)}</td>${item(h.teacher_feedback || "—")}</tr>`,
        ),
        "hw-tbl",
      ),
    );
  }
  const coursesCount = new Set(data.map(h => h.course_title).filter(Boolean)).size;
  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${data.length}</span>
        <span class="deck-kpi-label">Active Tasks</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${coursesCount}</span>
        <span class="deck-kpi-label">Covered Courses</span>
      </div>
    </div>
  `;
  return wrap(
    "Homework assignments",
    canAssign ? btn("Assign homework", "ops-new-homework", "") : "",
    summaryStrip +
    tableSearchToolbar("hw-tbl", "Search assignments by title, course, teacher...") +
    table(
      ["ID", "Title", "Course / Batch", "Due date", "Teacher", "Actions"],
      data.map(
        (h) =>
          `<tr>${item(h.id)}${item(h.title)}${item(h.course_title + " / " + h.batch_name)}${item(h.due_date)}${item(h.teacher_name || "—")}<td>${btn("Submissions", "ops-hw-submissions", h.id)}</td></tr>`,
      ),
      "hw-tbl",
    ),
  );
}
async function assessmentsPanel() {
  const raw = await request("/assessments");
  const data = Array.isArray(raw) ? raw : [];
  const canCreate = admin() || state.me.role === "teacher";
  const canPublish = admin() || state.me.role === "zimmadar";
  const filterOpts = [
    ["", "All statuses"],
    ["draft", "Draft"],
    ["published", "Published"],
  ];
  const draftsCount = data.filter(a => a.status === 'draft').length;
  const publishedCount = data.filter(a => a.status === 'published').length;
  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${data.length}</span>
        <span class="deck-kpi-label">Total Examinations</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num${draftsCount > 0 ? ' warn' : ''}">${draftsCount}</span>
        <span class="deck-kpi-label">Pending Drafts</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num ok">${publishedCount}</span>
        <span class="deck-kpi-label">Published</span>
      </div>
    </div>
  `;
  return wrap(
    "Assessments & examination",
    canCreate ? btn("New assessment", "ops-new-assessment", "") : "",
    summaryStrip +
    tableSearchToolbar("assessments-tbl", "Search assessments by title, course...", filterOpts) +
    table(
      ["ID", "Title", "Course / Batch", "Type", "Max marks", "Date", "Status", "Actions"],
      data.map((a) => {
        let actions = "";
        if (canCreate) actions += btn("Marks", "ops-assessment-marks", a.id);
        if (canPublish && a.status === "draft") actions += btn("Publish", "ops-assessment-publish", a.id);
        else if (a.status === "published") actions += btn("View / Correct", "ops-assessment-marks", a.id);
        return `<tr>${item(a.id)}${item(a.title)}${item(a.course_title + " / " + a.batch_name)}${item(a.assessment_type)}${item(a.max_marks)}${item(a.assessment_date)}<td>${tag(a.status)}</td><td>${actions || "—"}</td></tr>`;
      }),
      "assessments-tbl",
    ),
  );
}
async function resourcesPanel() {
  const raw = await request("/resources");
  const data = Array.isArray(raw) ? raw : [];
  const canAdd = admin() || state.me.role === "teacher" || state.me.role === "zimmadar";
  const coursesCount = new Set(data.map(r => r.course_title).filter(Boolean)).size;
  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${data.length}</span>
        <span class="deck-kpi-label">Digital Resources</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${coursesCount}</span>
        <span class="deck-kpi-label">Courses Covered</span>
      </div>
    </div>
  `;
  return wrap(
    "Course resources & materials",
    canAdd ? btn("Add resource", "ops-new-resource", "") : "",
    summaryStrip +
    tableSearchToolbar("resources-tbl", "Search resources by title, category, course...") +
    table(
      ["Title", "Course / Batch", "Category", "Link", "Description", "Created"],
      data.map(
        (r) =>
          `<tr>${item(r.title)}${item(r.course_title + (r.batch_name ? " / " + r.batch_name : ""))}${item(r.category)}<td><a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" class="muted-link">Open</a></td>${item(r.description || "—")}${item(formatDate(r.created_at))}</tr>`,
      ),
      "resources-tbl",
    ),
  );
}
async function announcementsPanel() {
  const raw = await request("/announcements");
  const data = Array.isArray(raw) ? raw : [];
  const canPost = admin() || state.me.role === "department_supervisor" || state.me.role === "zimmadar";
  const urgentCount = data.filter(a => a.priority === "urgent").length;
  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${data.length}</span>
        <span class="deck-kpi-label">Active Notices</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num${urgentCount > 0 ? ' danger' : ''}">${urgentCount}</span>
        <span class="deck-kpi-label">Urgent Notices</span>
      </div>
    </div>
  `;
  return wrap(
    "Notice board & announcements",
    canPost ? btn("Post announcement", "ops-new-announcement", "") : "",
    summaryStrip +
    tableSearchToolbar("announcements-tbl", "Search announcements by title, scope...") +
    table(
      ["Title", "Scope", "Priority", "Message", "Expires", "Created"],
      data.map(
        (a) =>
          `<tr>${item(a.title)}${item(a.batch_name || a.department_name || (a.branch_id ? "Branch" : "All"))}<td>${a.priority === "urgent" ? '<span class="pill danger">Urgent</span>' : '<span class="pill">Normal</span>'}</td><td class="report-text">${escapeHtml(a.body || a.message || "")}</td>${item(a.expires_at ? formatDate(a.expires_at) : "No expiry")}${item(formatDate(a.created_at))}</tr>`,
      ),
      "announcements-tbl",
    ),
  );
}
async function paymentsPanel() {
  const raw = await request("/payments/references");
  const data = Array.isArray(raw) ? raw : [];
  const filterOpts = [
    ["", "All payment statuses"],
    ["recorded", "Recorded"],
    ["verified", "Verified"],
    ["disputed", "Disputed"],
    ["rejected", "Rejected"],
  ];
  const recordedCount = data.filter(p => p.payment_status === 'recorded').length;
  const verifiedCount = data.filter(p => p.payment_status === 'verified').length;
  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${data.length}</span>
        <span class="deck-kpi-label">Audit References</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num${recordedCount > 0 ? ' warn' : ''}">${recordedCount}</span>
        <span class="deck-kpi-label">Awaiting Verification</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num ok">${verifiedCount}</span>
        <span class="deck-kpi-label">Verified</span>
      </div>
    </div>
  `;
  return wrap(
    "External payment references",
    admin() ? btn("Record payment reference", "ops-new-payment-ref", "") : "",
    '<div class="page-note">D-015 / D-141: External Payment Portal is the sole payment collection and confirmation authority. Academy records external transaction references for administrative auditing.</div>' +
      summaryStrip +
      tableSearchToolbar("payments-tbl", "Search reference code, student, course...", filterOpts) +
      table(
        ["Student", "Course / Batch", "Billing month", "Reference code", "Status", "Recorded at", "Notes"],
        data.map(
          (p) =>
            `<tr>${item(p.student_name)}${item(p.course_title + " / " + p.batch_name)}${item(p.billing_month)}${item(p.reference_code)}<td>${tag(p.payment_status)}</td>${item(formatDate(p.verified_at))}${item(p.notes || "—")}</tr>`,
        ),
        "payments-tbl",
      ),
  );
}
function classPlanButtons(c) {
  return state.me.role === "zimmadar" && c.status === "scheduled"
    ? btn("Reschedule", "ops-reschedule", c.id) +
        btn("Substitute", "ops-substitute", c.id) +
        btn("Cancel", "ops-cancel", c.id)
    : "";
}
async function academicAction(action, id) {
  const actor = state.me,
    version = state.renderVersion;
  const guard = () => {
    if (actor !== state.me || version !== state.renderVersion)
      throw Error("Account or view changed");
  };
  const read = async (path) => {
    const result = await request(path);
    guard();
    return result;
  };
  const post = (path, body) => {
    guard();
    return request(path, { method: "POST", body });
  };
  if (action === "ops-apply") {
    const data = await read("/admission-options"),
      students = await read("/students");
    const requestId = crypto.randomUUID();
    return opsDialog(
      "Admission application",
      select(
        "Family",
        "family_id",
        data.families.map((f) => [f.id, f.name]),
      ) +
        select(
          "Course",
          "course_id",
          data.courses.map((c) => [c.id, c.title + " · " + c.department]),
        ) +
        select(
          "Existing student",
          "student_id",
          [["", "New student"], ...students.map((s) => [s.id, s.full_name])],
          false,
        ) +
        field("Student name", "student_name") +
        dateInput("Birth date", "birth_date") +
        field("Academic level", "academic_level") +
        field("Guardian phone", "contact_phone", "tel") +
        field("Country", "country") +
        select("Admission", "method", [
          ["direct", "Direct"],
          ["assessment", "Assessment"],
        ]),
      (d) =>
        post("/admissions", {
          ...d,
          family_id: Number(d.family_id),
          course_id: Number(d.course_id),
          student_id: d.student_id ? Number(d.student_id) : null,
          request_id: requestId,
        }),
      "Submit",
    );
  }
  if (["ops-review", "ops-accept"].includes(action)) {
    const a = (await read("/admissions")).find((a) => a.id == id);
    if (!a) throw Error("Application unavailable");
    const notes =
      '<label class="wide">Assessment outcome<textarea name="assessment_note" maxlength="5000">' +
      escapeHtml(a.assessment_note || "") +
      "</textarea></label>";
    if (action === "ops-review")
      return opsDialog(
        "Review " + a.student_name,
        select("Status", "status", [
          ["reviewing", "Reviewing"],
          ["rejected", "Rejected"],
        ]) +
          notes +
          '<label class="wide">Reason<textarea name="review_reason" maxlength="2000"></textarea></label>',
        (d) =>
          post(`/admissions/${id}/review`, {
            ...d,
            expected_revision: a.revision,
          }),
      );
    const batches = (await read("/batches")).filter(
      (b) => b.course_id === a.course_id,
    );
    return opsDialog(
      "Accept " + a.student_name,
      select(
        "Batch",
        "batch_id",
        batches.map((b) => [b.id, b.label]),
      ) +
        dateInput("Start", "start_date") +
        dateInput("End", "end_date", "", false) +
        notes +
        '<label class="wide">Age / level placement decision<textarea name="placement_note" required maxlength="5000"></textarea></label>',
      (d) =>
        post(`/admissions/${id}/accept`, {
          ...d,
          batch_id: Number(d.batch_id),
          end_date: d.end_date || null,
          expected_revision: a.revision,
        }),
      "Accept / enroll",
    );
  }
  if (action === "ops-session") {
    const branches = await read("/branches");
    return opsDialog(
      "Academic session",
      field("Session", "label") +
        select(
          "Branch",
          "branch_id",
          branches.map((b) => [b.id, b.name]),
        ) +
        dateInput("Start", "start_date") +
        dateInput("End", "end_date"),
      (d) =>
        post("/academic-sessions", { ...d, branch_id: Number(d.branch_id) }),
    );
  }
  if (action === "ops-course-dates" || action === "ops-batch-dates") {
    const batch = action === "ops-batch-dates",
      path = batch ? "/batches" : "/courses",
      row = (await read(path)).find((r) => r.id == id);
    if (!row) throw Error("Record unavailable");
    const sessions = batch ? await read("/academic-sessions") : [];
    return opsDialog(
      "Dates",
      dateInput("Start", "start_date", row.start_date, false) +
        dateInput("End", "end_date", row.end_date, false) +
        (batch
          ? chosen(
              "Academic session",
              "academic_session_id",
              [["", "—"], ...sessions.map((s) => [s.id, s.label])],
              row.academic_session_id,
              false,
            )
          : ""),
      (d) =>
        post(path + "/" + id + "/settings", {
          start_date: d.start_date || null,
          end_date: d.end_date || null,
          ...(batch
            ? {
                academic_session_id: d.academic_session_id
                  ? Number(d.academic_session_id)
                  : null,
              }
            : {}),
        }),
    );
  }
  if (action === "ops-template") {
    const versions = await read(`/courses/${id}/report-templates`),
      latest = versions[0];
    return opsDialog(
      "Course report form",
      '<label class="wide">Report fields / headings<textarea name="prompt" required maxlength="8000">' +
        escapeHtml(latest?.prompt || "") +
        "</textarea></label>" +
        versions
          .map(
            (v) =>
              '<details class="wide"><summary>Version ' +
              escapeHtml(v.version) +
              '</summary><div class="report-text">' +
              escapeHtml(v.prompt) +
              "</div></details>",
          )
          .join(""),
      (d) =>
        post(`/courses/${id}/report-templates`, {
          prompt: d.prompt,
          expected_version: latest?.version || 0,
        }),
      "Save new version",
    );
  }
  if (action === "ops-assign") {
    const batch = (await read("/batches")).find((b) => b.id == id),
      users = await read("/users"),
      history = await read(`/batches/${id}/assignments`);
    const eligible = (role) => [
      ["", "—"],
      ...users
        .filter(
          (u) =>
            u.active &&
            (u.role === role ||
              (u.assigned_roles || "").split(",").includes(role)),
        )
        .map((u) => [u.id, u.name]),
    ];
    return opsDialog(
      "Batch assignments",
      chosen(
        "Teacher",
        "teacher_id",
        eligible("teacher"),
        batch.teacher_id,
        false,
      ) +
        chosen(
          "Zimmadar",
          "zimmadar_id",
          eligible("zimmadar"),
          batch.zimmadar_id,
          false,
        ) +
        select("Scheduled regular classes", "scheduled_choice", [
          ["keep", "Keep current teachers"],
          ["replace", "Assign new regular teacher"],
        ]) +
        field("Reason", "reason") +
        '<div class="wide">' +
        table(
          ["At", "Teacher", "Zimmadar", "Reason"],
          history.map(
            (h) =>
              `<tr>${item(formatDate(h.at))}${item(h.new_teacher)}${item(h.new_zimmadar)}${item(h.reason)}</tr>`,
          ),
        ) +
        "</div>",
      (d) =>
        post(`/batches/${id}/assignments`, {
          teacher_id: d.teacher_id ? Number(d.teacher_id) : null,
          zimmadar_id: d.zimmadar_id ? Number(d.zimmadar_id) : null,
          expected_teacher_id: batch.teacher_id,
          expected_zimmadar_id: batch.zimmadar_id,
          update_scheduled: d.scheduled_choice === "replace",
          reason: d.reason,
        }),
    );
  }
  if (action === "ops-routine") {
    const batches = await read("/batches");
    return opsDialog(
      "Weekly slot",
      select(
        "Batch",
        "batch_id",
        batches.map((b) => [b.id, b.label]),
      ) +
        select(
          "Day",
          "weekday",
          [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ].map((d, i) => [i, d]),
        ) +
        field("Start time", "start_time", "time") +
        field("End time", "end_time", "time") +
        dateInput("From", "from_date") +
        dateInput("Until", "until_date") +
        '<label>Meeting link<input name="meeting_url" type="url"></label>',
      (d) =>
        post("/routines", {
          ...d,
          batch_id: Number(d.batch_id),
          weekday: Number(d.weekday),
          meeting_url: d.meeting_url || null,
        }),
    );
  }
  if (action === "ops-stop-routine")
    return opsDialog(
      "Stop weekly slot",
      "",
      () => post(`/routines/${id}/stop`, {}),
      "Stop slot",
    );
  if (action === "ops-generate") {
    const row = (await read("/routines")).find((r) => r.id == id);
    const until = new Date(row.from_date + "T00:00:00Z");
    until.setUTCDate(until.getUTCDate() + 30);
    const end = [row.until_date, until.toISOString().slice(0, 10)].sort()[0];
    return opsDialog(
      "Generate classes",
      dateInput("From", "from_date", row.from_date) +
        dateInput("Until", "until_date", end),
      (d) => post(`/routines/${id}/generate`, d),
      "Generate",
    );
  }
  if (["ops-reschedule", "ops-substitute", "ops-cancel"].includes(action)) {
    const cl = (await read("/classes")).find((c) => c.id == id);
    if (!cl) throw Error("Class unavailable");
    let fields = field("Reason", "reason");
    if (action === "ops-reschedule")
      fields +=
        field("New start", "scheduled_start", "datetime-local") +
        field("New end", "scheduled_end", "datetime-local");
    if (action === "ops-substitute") {
      const users = await read("/users");
      fields += select(
        "Teacher",
        "teacher_id",
        users
          .filter(
            (u) =>
              u.active &&
              (u.role === "teacher" ||
                (u.assigned_roles || "").split(",").includes("teacher")),
          )
          .map((u) => [u.id, u.name]),
      );
    }
    return opsDialog(
      action.replace("ops-", "").replace(/^./, (c) => c.toUpperCase()) +
        " class",
      fields,
      (d) =>
        post(`/classes/${id}/${action.replace("ops-", "")}`, {
          ...d,
          ...(d.teacher_id ? { teacher_id: Number(d.teacher_id) } : {}),
          expected_start: cl.scheduled_start,
          expected_revision: cl.schedule_revision,
        }),
    );
  }
  if (action === "ops-status") {
    const en = (await read("/enrollments")).find((e) => e.id == id),
      history = await read(`/enrollments/${id}/status-history`);
    return opsDialog(
      "Enrollment status",
      chosen(
        "Status",
        "status",
        ["active", "on_hold", "withdrawn", "completed", "inactive"].map((s) => [
          s,
          s.replaceAll("_", " "),
        ]),
        en.status,
      ) +
        dateInput("Last active date", "end_date", en.end_date, false) +
        field("Reason", "reason") +
        '<div class="wide">' +
        table(
          ["At", "Status", "Reason"],
          history.map(
            (h) =>
              `<tr>${item(formatDate(h.at))}${item(h.to_status)}${item(h.reason)}</tr>`,
          ),
        ) +
        "</div>",
      (d) =>
        post(`/enrollments/${id}/status`, {
          status: d.status,
          expected_status: en.status,
          expected_end_date: en.end_date,
          end_date: d.end_date || null,
          reason: d.reason,
        }),
    );
  }
  if (action === "ops-new-homework") {
    const batches = await read("/batches");
    const requestId = crypto.randomUUID();
    return opsDialog(
      "Assign homework",
      select(
        "Batch",
        "batch_id",
        batches.map((b) => [b.id, `${b.course_title} / ${b.label} (${b.delivery_mode})`]),
      ) +
        field("Assignment title", "title") +
        '<label class="wide">Instructions<textarea name="instructions" required maxlength="10000"></textarea></label>' +
        dateInput("Due date", "due_date"),
      (d) =>
        post("/homework", {
          ...d,
          batch_id: Number(d.batch_id),
          request_id: requestId,
        }),
      "Assign",
    );
  }
  if (action === "ops-hw-submissions") {
    const subs = await read(`/homework/${id}/submissions`);
    if (!subs.length) {
      return modal(
        "Homework submissions",
        '<p class="empty">No learner enrollments registered for this homework yet.</p>',
        null,
      );
    }
    const fields =
      '<div class="table-wrap"><table><thead><tr><th>Student</th><th>Status</th><th>Teacher feedback</th><th>Action</th></tr></thead><tbody>' +
      subs
        .map(
          (s) =>
            `<tr><td>${escapeHtml(s.student_name)}</td><td>${tag(s.status)}</td><td>${escapeHtml(s.teacher_feedback || "—")}</td><td>${btn("Review / grade", "ops-grade-submission", s.id)}</td></tr>`,
        )
        .join("") +
      "</tbody></table></div>";
    return modal("Submissions (" + subs.length + ")", fields, null);
  }
  if (action === "ops-grade-submission") {
    const sh = await read(`/student-homework/${id}`);
    return opsDialog(
      `Grade submission — ${sh.student_name}`,
      select(
        "Status",
        "status",
        [
          ["completed", "Completed"],
          ["submitted", "Submitted"],
          ["incomplete", "Incomplete"],
          ["assigned", "Assigned"],
        ],
        true,
      ).replace(`value="${sh.status}"`, `value="${sh.status}" selected`) +
        `<label class="wide">Teacher feedback (visible to Guardian)<textarea name="teacher_feedback" maxlength="5000">${escapeHtml(sh.teacher_feedback || "")}</textarea></label>`,
      (d) =>
        post(`/student-homework/${id}`, {
          status: d.status,
          teacher_feedback: d.teacher_feedback || null,
          expected_revision: sh.revision,
        }),
      "Save feedback",
    );
  }
  if (action === "ops-new-assessment") {
    const batches = await read("/batches");
    const requestId = crypto.randomUUID();
    return opsDialog(
      "New assessment",
      select(
        "Batch",
        "batch_id",
        batches.map((b) => [b.id, `${b.course_title} / ${b.label} (${b.delivery_mode})`]),
      ) +
        field("Title", "title") +
        select("Type", "assessment_type", [
          ["oral_practical", "Oral & Practical"],
          ["continuous", "Continuous"],
        ]) +
        field("Max marks", "max_marks", "number", 'min="1" max="1000" value="100"') +
        '<label>Pass marks (optional)<input name="pass_marks" type="number" min="0" max="1000"></label>' +
        dateInput("Assessment date", "assessment_date"),
      (d) =>
        post("/assessments", {
          ...d,
          batch_id: Number(d.batch_id),
          max_marks: Number(d.max_marks),
          pass_marks: d.pass_marks ? Number(d.pass_marks) : undefined,
          request_id: requestId,
        }),
      "Create assessment",
    );
  }
  if (action === "ops-assessment-marks") {
    const [assessments, marksList] = await Promise.all([
      read("/assessments"),
      read(`/assessments/${id}/marks`),
    ]);
    const a = assessments.find((x) => x.id == id);
    if (!a) throw Error("Assessment not found");
    const isPublished = a.status === "published";
    const canCorrect = (admin() || state.me.role === "zimmadar") && isPublished;
    let content = "";
    if (!marksList.length) {
      const enrollments = (await read("/enrollments")).filter(
        (e) => e.batch_id === a.batch_id && ["active", "enrolled"].includes(e.status),
      );
      if (!enrollments.length) {
        return modal("Assessment marks", '<p class="empty">No active learners enrolled in this batch.</p>', null);
      }
      content =
        '<div class="wide"><p class="help">Enter marks out of ' +
        escapeHtml(a.max_marks) +
        ' for each learner. Marks will remain in draft state until published by the Zimmadar.</p>' +
        enrollments
          .map(
            (e, idx) =>
              `<div class="card mb-sm"><b>${escapeHtml(e.student_name)}</b><input type="hidden" name="enrollment_id_${idx}" value="${escapeHtml(e.id)}"><div class="form-grid mt-sm"><label>Marks obtained<input type="number" name="obtained_marks_${idx}" min="0" max="${escapeHtml(a.max_marks)}" required></label><label>Teacher remarks (staff only)<input type="text" name="teacher_remarks_${idx}" maxlength="2000"></label><label class="wide">Guardian feedback (visible upon publish)<input type="text" name="guardian_feedback_${idx}" maxlength="2000"></label></div></div>`,
          )
          .join("") +
        "</div>";
      return opsDialog(
        `Enter marks — ${a.title}`,
        content,
        async (d) => {
          const marks = [];
          for (let i = 0; i < enrollments.length; i++) {
            if (d[`enrollment_id_${i}`] && d[`obtained_marks_${i}`] !== undefined) {
              marks.push({
                enrollment_id: Number(d[`enrollment_id_${i}`]),
                obtained_marks: Number(d[`obtained_marks_${i}`]),
                teacher_remarks: d[`teacher_remarks_${i}`] || undefined,
                guardian_feedback: d[`guardian_feedback_${i}`] || undefined,
              });
            }
          }
          if (!marks.length) throw Error("Please enter marks for at least one learner");
          return post(`/assessments/${id}/marks`, { marks });
        },
        "Save draft marks",
      );
    }
    content =
      '<div class="table-wrap"><table><thead><tr><th>Student</th><th>Marks / ' +
      escapeHtml(a.max_marks) +
      '</th><th>Status</th><th>Guardian feedback</th>' +
      (canCorrect ? "<th>Action</th>" : "") +
      "</tr></thead><tbody>" +
      marksList
        .map(
          (m) =>
            `<tr><td>${escapeHtml(m.student_name)}</td><td><b>${escapeHtml(m.obtained_marks)}</b></td><td>${tag(m.status)}</td><td>${escapeHtml(m.guardian_feedback || "—")}</td>${canCorrect ? `<td>${btn("Correct", "ops-correct-mark", `${id}:${m.id}:${m.revision}`)}</td>` : ""}</tr>`,
        )
        .join("") +
      "</tbody></table></div>";
    return modal(`Marks — ${a.title} (${tag(a.status)})`, content, null);
  }
  if (action === "ops-correct-mark") {
    const [assessId, markId, rev] = id.split(":");
    return opsDialog(
      "Correct published mark",
      field("New marks obtained", "new_marks", "number", 'min="0" max="1000"') +
        '<label class="wide">Reason for correction (required by policy)<textarea name="reason" required maxlength="1000"></textarea></label>',
      (d) =>
        post(`/assessments/${assessId}/marks/${markId}/correction`, {
          new_marks: Number(d.new_marks),
          reason: d.reason.trim(),
          expected_revision: Number(rev),
        }),
      "Apply correction",
    );
  }
  if (action === "ops-assessment-publish") {
    return opsDialog(
      "Publish assessment marks",
      '<p class="wide">Publishing makes assessment results and feedback visible to linked Guardians immediately. Have you reviewed all marks?</p>',
      () => post(`/assessments/${id}/publish`, {}),
      "Publish results",
    );
  }
  if (action === "ops-new-resource") {
    const [courses, batches] = await Promise.all([
      read("/courses"),
      read("/batches"),
    ]);
    const requestId = crypto.randomUUID();
    return opsDialog(
      "Add course resource",
      select(
        "Course",
        "course_id",
        courses.map((c) => [c.id, `${c.title} (${c.department})`]),
      ) +
        select(
          "Batch (optional)",
          "batch_id",
          [["", "All batches in course"], ...batches.map((b) => [b.id, `${b.course_title} / ${b.label}`])],
          false,
        ) +
        field("Resource title", "title") +
        field("Resource URL", "url", "url", 'placeholder="https://..."') +
        select("Category", "category", [
          ["material", "Study material"],
          ["syllabus", "Syllabus"],
          ["book", "Book / PDF"],
          ["link", "Reference link"],
        ]) +
        '<label class="wide">Description (optional)<textarea name="description" maxlength="2000"></textarea></label>',
      (d) =>
        post("/resources", {
          ...d,
          course_id: Number(d.course_id),
          batch_id: d.batch_id ? Number(d.batch_id) : null,
          request_id: requestId,
        }),
      "Add resource",
    );
  }
  if (action === "ops-new-announcement") {
    const branches = await read("/branches");
    const departments = await read("/departments");
    const batches = await read("/batches");
    const requestId = crypto.randomUUID();
    return opsDialog(
      "Post announcement",
      select(
        "Branch",
        "branch_id",
        branches.map((b) => [b.id, b.name]),
      ) +
        select(
          "Department (optional)",
          "department_id",
          [["", "All departments"], ...departments.map((d) => [d.id, `${d.name} (${d.category})`])],
          false,
        ) +
        select(
          "Batch (optional)",
          "batch_id",
          [["", "All batches"], ...batches.map((b) => [b.id, `${b.course_title} / ${b.label}`])],
          false,
        ) +
        select("Priority", "priority", [
          ["normal", "Normal"],
          ["urgent", "Urgent"],
        ]) +
        field("Title", "title") +
        '<label class="wide">Message<textarea name="body" required maxlength="10000"></textarea></label>' +
        dateInput("Expires at (optional)", "expires_at", "", false),
      (d) =>
        post("/announcements", {
          ...d,
          branch_id: Number(d.branch_id),
          department_id: d.department_id ? Number(d.department_id) : null,
          batch_id: d.batch_id ? Number(d.batch_id) : null,
          expires_at: d.expires_at ? d.expires_at + "T23:59:59+06:00" : null,
          request_id: requestId,
        }),
      "Post announcement",
    );
  }
  if (action === "ops-new-payment-ref") {
    const enrollments = await read("/enrollments");
    return opsDialog(
      "Record external payment reference",
      select(
        "Enrollment",
        "enrollment_id",
        enrollments.map((e) => [e.id, `${e.student_name} — ${e.course_title} / ${e.batch_name}`]),
      ) +
        field("Billing month (YYYY-MM)", "billing_month", "text", 'placeholder="2026-11" pattern="^\\d{4}-(0[1-9]|1[0-2])$"') +
        field("External reference code", "reference_code", "text", 'placeholder="Portal receipt / TxID"') +
        select("Payment status", "payment_status", [
          ["paid", "Paid"],
          ["due", "Due"],
          ["waived", "Waived"],
          ["unknown", "Unknown"],
        ]) +
        '<label>Portal URL (optional)<input type="url" name="portal_url" placeholder="https://portal..."></label>' +
        '<label class="wide">Notes<textarea name="notes" maxlength="1000"></textarea></label>',
      (d) =>
        post("/payments/references", {
          ...d,
          enrollment_id: Number(d.enrollment_id),
        }),
      "Save reference",
    );
  }
  if (action === "ops-new-package") {
    return opsDialog(
      "Create 1:1 Package",
      field("Package Name", "name", "text", 'placeholder="e.g. মাসিক ৮-ক্লাস সোলো"') +
        field("Code", "code", "text", 'placeholder="SOLO-8"') +
        field("Total Classes", "total_classes", "number", 'value="8" min="1"') +
        field("Total Minutes", "total_minutes", "number", 'value="360" min="1"') +
        field("Fee Amount (BDT)", "fee_amount", "number", 'value="5000" min="1" step="0.01"') +
        field("Validity Days", "validity_days", "number", 'value="30" min="1"'),
      (d) =>
        post("/one-to-one/packages", {
          name: d.name,
          code: d.code,
          total_classes: Number(d.total_classes),
          total_minutes: Number(d.total_minutes),
          fee_amount: Number(d.fee_amount),
          currency: "BDT",
          validity_days: Number(d.validity_days),
        }),
      "Create Package"
    );
  }
  if (action === "ops-new-contract") {
    const [enrollments, packages] = await Promise.all([
      read("/enrollments"),
      read("/one-to-one/packages")
    ]);
    const oneToOneEnrollments = (enrollments || []).filter(e => e.delivery_mode === 'one_to_one' || e.batch_delivery_mode === 'one_to_one');
    const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Dhaka'}).format(new Date());
    const month = today.slice(0, 7);

    return opsDialog(
      "Create 1:1 Learner Contract",
      select(
        "1:1 Student Enrollment",
        "enrollment_id",
        (oneToOneEnrollments.length ? oneToOneEnrollments : enrollments).map(e => [e.id, `${e.student_name} — ${e.course_title} / ${e.batch_name}`])
      ) +
        select(
          "Package",
          "package_id",
          packages.map(p => [p.id, `${p.name} (${p.total_classes} classes, ${p.total_minutes}m, ${p.fee_amount} ৳)`])
        ) +
        field("Billing Period (YYYY-MM)", "billing_period", "text", `value="${month}" pattern="^\\d{4}-(0[1-9]|1[0-2])$"`) +
        dateInput("Start Date", "start_date", today) +
        dateInput("End Date", "end_date", today),
      (d) =>
        post("/one-to-one/contracts", {
          enrollment_id: Number(d.enrollment_id),
          package_id: Number(d.package_id),
          billing_period: d.billing_period,
          start_date: d.start_date,
          end_date: d.end_date,
        }),
      "Activate Contract"
    );
  }
  if (action === "ops-view-ledger") {
    const ledger = await read(`/one-to-one/contracts/${id}/ledger`);
    const historyList = (ledger || []).map(entry => {
      const isCredit = entry.minutes > 0;
      return `
        <div class="ledger-entry-card">
          <div>
            <div class="ledger-entry-type">${escapeHtml(entry.entry_type.replaceAll('_', ' '))}</div>
            <div class="ledger-entry-meta">
              ${escapeHtml(formatDate(entry.recorded_at))} · Recorded by: ${escapeHtml(entry.recorded_by_name || 'Staff #' + entry.recorded_by)}
              ${entry.notes ? `<br><i>${escapeHtml(entry.notes)}</i>` : ''}
            </div>
          </div>
          <div class="text-right">
            <div class="ledger-entry-diff ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : ''}${entry.minutes}m</div>
            <div class="ledger-entry-meta">Balance: <b>${entry.balance_after}m</b></div>
          </div>
        </div>
      `;
    }).join('');

    return modal(
      "Contract Minute Ledger — #" + id,
      `<div class="ledger-timeline">${historyList || '<p class="help">No ledger records found.</p>'}</div>`,
      null,
      "Close"
    );
  }
  if (action === "ops-adjust-minutes") {
    return opsDialog(
      "Adjust Contract Minutes",
      select("Adjustment Type", "entry_type", [
        ["rollover_credit", "Rollover Credit (+)"],
        ["reversal_adjustment", "Correction / Reversal Adjustment (+/-)"]
      ]) +
        field("Minutes (+ to add, - to deduct)", "minutes", "number", 'value="45"') +
        '<label class="wide">Reason / Audit Notes<textarea name="notes" required maxlength="500" placeholder="Explanation for administrative adjustment..."></textarea></label>',
      (d) =>
        post(`/one-to-one/contracts/${id}/adjust`, {
          minutes: Number(d.minutes),
          entry_type: d.entry_type,
          notes: d.notes,
        }),
      "Apply Adjustment"
    );
  }
  if (action === "ops-new-invoice") {
    const enrollments = await read("/enrollments");
    const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Dhaka'}).format(new Date());
    const month = today.slice(0, 7);

    return opsDialog(
      "Create Tuition Invoice",
      select(
        "Student Enrollment",
        "enrollment_id",
        enrollments.map(e => [e.id, `${e.student_name} — ${e.course_title} / ${e.batch_name}`])
      ) +
        field("Billing Month (YYYY-MM)", "billing_month", "text", `value="${month}" pattern="^\\d{4}-(0[1-9]|1[0-2])$"`) +
        field("Amount Due (BDT)", "amount_due", "number", 'value="2500" min="1" step="0.01"') +
        dateInput("Due Date", "due_date", today) +
        '<label class="wide">Notes (optional)<textarea name="notes" maxlength="500"></textarea></label>',
      (d) =>
        post("/invoices", {
          enrollment_id: Number(d.enrollment_id),
          billing_month: d.billing_month,
          amount_due: Number(d.amount_due),
          due_date: d.due_date,
          notes: d.notes || undefined,
        }),
      "Generate Invoice"
    );
  }
  if (action === "ops-record-invoice-payment") {
    return opsDialog(
      "Record Invoice Payment",
      field("External Payment Reference (TxID)", "payment_reference_code", "text", 'placeholder="e.g. TRX-BKASH-XXXXX" required') +
        field("Amount Paid (BDT)", "amount_paid", "number", 'min="1" step="0.01" required'),
      (d) =>
        post(`/invoices/${id}/record-payment`, {
          payment_reference_code: d.payment_reference_code,
          amount_paid: Number(d.amount_paid),
        }),
      "Confirm Payment"
    );
  }
  if (action === "ops-calc-payable") {
    const classes = await read("/classes");
    const endedClasses = (classes || []).filter(c => c.status === 'ended');

    return opsDialog(
      "Calculate Teacher Session Payable",
      select(
        "Ended Class Session",
        "class_session_id",
        endedClasses.map(c => [c.id, `#CLS-${String(c.id).padStart(4, '0')} — ${c.course_title} (${c.batch_name}) · ${formatDate(c.scheduled_start)}`])
      ) +
        field("Teacher Hourly Rate (BDT)", "hourly_rate", "number", 'value="400" min="100" step="10"'),
      (d) =>
        post("/finance/teacher-payables/calculate", {
          class_session_id: Number(d.class_session_id),
          hourly_rate: Number(d.hourly_rate),
        }),
      "Calculate Payable"
    );
  }
}

// ----------------------------------------------------------------------------
// COMMERCIAL 1:1 PACKAGES & MINUTE LEDGER (AM-18, 5.2.1, 5.4.1)
// ----------------------------------------------------------------------------
async function packagesContractsPanel() {
  const [contractsRaw, packagesRaw] = await Promise.all([
    request("/one-to-one/contracts").catch(() => []),
    request("/one-to-one/packages").catch(() => [])
  ]);
  const contracts = Array.isArray(contractsRaw) ? contractsRaw : [];
  const packages = Array.isArray(packagesRaw) ? packagesRaw : [];

  const activeContracts = contracts.filter(c => c.status === "active").length;
  const totalAllocated = contracts.reduce((sum, c) => sum + (c.allocated_minutes || 0), 0);
  const totalRemaining = contracts.reduce((sum, c) => sum + (c.remaining_minutes || 0), 0);

  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num ok">${activeContracts}</span>
        <span class="deck-kpi-label">Active 1:1 Contracts</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${packages.length}</span>
        <span class="deck-kpi-label">Packages in Catalog</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${Math.round(totalAllocated / 60)}h</span>
        <span class="deck-kpi-label">Allocated Hours</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num${totalRemaining < 60 ? ' warn' : ''}">${Math.round(totalRemaining / 60)}h</span>
        <span class="deck-kpi-label">Remaining Balance</span>
      </div>
    </div>
  `;

  const topActions = admin() || state.me.role === 'zimmadar'
    ? '<div class="inline-actions">' +
      btn("New 1:1 Contract", "ops-new-contract", "") +
      (state.me.role === 'central_admin' ? btn("New Package", "ops-new-package", "") : "") +
      '</div>'
    : '';

  const contractsToolbar = tableSearchToolbar("contracts-tbl", "Search learner, package, batch...", [
    ["", "All Contract Statuses"],
    ["active", "Active"],
    ["completed", "Completed"],
    ["depleted", "Depleted"],
    ["cancelled", "Cancelled"]
  ]);

  const contractsTable = table(
    ["Learner", "Package / Batch", "Period", "Minutes Progress", "Fee", "Status", "Actions"],
    contracts.map(c => {
      const pct = c.allocated_minutes > 0
        ? Math.min(100, Math.max(0, Math.round(((c.used_minutes || 0) / c.allocated_minutes) * 100)))
        : 0;
      const fillClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : '';
      const progressHtml = `
        <div class="pkg-progress-wrap">
          <div class="pkg-progress-bar">
            <div class="pkg-progress-fill ${fillClass}" style="width:${pct}%"></div>
          </div>
          <div class="pkg-progress-meta">
            <span>${c.used_minutes || 0}m used</span>
            <span><b>${c.remaining_minutes || 0}m left</b></span>
          </div>
        </div>
      `;
      const actionBtns = btn("Minute Ledger", "ops-view-ledger", c.id) +
        (admin() || state.me.role === 'zimmadar' ? btn("Adjust", "ops-adjust-minutes", c.id) : "");
      return `<tr>
        ${item(c.student_name)}
        <td><b>${escapeHtml(c.package_name)}</b><br><small class="muted">${escapeHtml(c.batch_name || c.course_title || '')}</small></td>
        ${item(c.billing_period)}
        <td>${progressHtml}</td>
        <td class="money-cell">${escapeHtml(c.fee_amount)} ${escapeHtml(c.currency || 'BDT')}</td>
        <td>${tag(c.status)}</td>
        <td>${actionBtns}</td>
      </tr>`;
    }),
    "contracts-tbl"
  );

  const packagesToolbar = tableSearchToolbar("packages-tbl", "Search package name or code...");
  const packagesTable = table(
    ["Package Name", "Code", "Classes", "Total Duration", "Fee", "Validity", "Status"],
    packages.map(p => `<tr>
      <td><b>${escapeHtml(p.name)}</b></td>
      ${item(p.code)}
      ${item(p.total_classes + " classes")}
      ${item(p.total_minutes + " mins (" + Math.round(p.total_minutes / 60) + "h)")}
      <td class="money-cell">${escapeHtml(p.fee_amount)} ${escapeHtml(p.currency || 'BDT')}</td>
      ${item(p.validity_days + " days")}
      <td>${tag(p.active ? 'active' : 'inactive')}</td>
    </tr>`),
    "packages-tbl"
  );

  return wrap(
    "Commercial 1:1 Packages & Contracts",
    topActions,
    '<div class="page-note">AM-18 / 5.2.1 / 5.4.1: Commercial 1:1 learner minutes ledger tracking. Classes deduct minutes automatically upon verification; adjustments are audited.</div>' +
    summaryStrip +
    '<h3 class="mt-lg mb-xs">Active 1:1 Learner Contracts</h3>' +
    contractsToolbar +
    contractsTable +
    '<h3 class="mt-xl mb-xs">Package Catalog</h3>' +
    packagesToolbar +
    packagesTable
  );
}

// ----------------------------------------------------------------------------
// TUITION INVOICES (D-011, D-015, D-141)
// ----------------------------------------------------------------------------
async function invoicesPanel() {
  const raw = await request("/invoices");
  const data = Array.isArray(raw) ? raw : [];

  const paidCount = data.filter(i => i.status === "paid").length;
  const unpaidCount = data.filter(i => i.status === "unpaid").length;
  const totalBilled = data.reduce((sum, i) => sum + Number(i.amount_due || 0), 0);
  const totalCollected = data.reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);

  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num ok">${totalCollected.toLocaleString()} ৳</span>
        <span class="deck-kpi-label">Total Collected</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num${unpaidCount > 0 ? ' warn' : ''}">${(totalBilled - totalCollected).toLocaleString()} ৳</span>
        <span class="deck-kpi-label">Outstanding Due</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num ok">${paidCount}</span>
        <span class="deck-kpi-label">Paid Invoices</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num${unpaidCount > 0 ? ' danger' : ''}">${unpaidCount}</span>
        <span class="deck-kpi-label">Unpaid Invoices</span>
      </div>
    </div>
  `;

  const topAction = admin()
    ? btn("Create Tuition Invoice", "ops-new-invoice", "")
    : "";

  const filterOpts = [
    ["", "All Invoices"],
    ["unpaid", "Unpaid"],
    ["paid", "Paid"],
    ["partially_paid", "Partially Paid"]
  ];

  const toolbar = tableSearchToolbar("invoices-tbl", "Search invoice #, learner, course, ref...", filterOpts);

  const tbl = table(
    ["Invoice #", "Learner", "Course / Batch", "Month", "Amount Due", "Amount Paid", "Due Date", "Status", "Payment Reference", "Actions"],
    data.map(inv => {
      const actions = admin() && inv.status !== 'paid'
        ? btn("Record Payment", "ops-record-invoice-payment", inv.id)
        : '—';
      return `<tr>
        <td><b>${escapeHtml(inv.invoice_number)}</b></td>
        ${item(inv.student_name)}
        ${item(inv.course_title + " / " + (inv.batch_name || ''))}
        ${item(inv.billing_month)}
        <td class="money-cell">${Number(inv.amount_due).toLocaleString()} ৳</td>
        <td class="money-cell ok">${Number(inv.amount_paid).toLocaleString()} ৳</td>
        ${item(inv.due_date)}
        <td>${tag(inv.status)}</td>
        ${item(inv.payment_reference_code || '—')}
        <td>${actions}</td>
      </tr>`;
    }),
    "invoices-tbl"
  );

  return wrap(
    "Tuition Invoices & Fee Billing",
    topAction,
    '<div class="page-note">D-015 / D-141: External payment gateways collect payments. Academy records external transaction reference IDs and matches them to student tuition invoices.</div>' +
    summaryStrip +
    toolbar +
    tbl
  );
}

// ----------------------------------------------------------------------------
// TEACHER PAYABLES & COMPENSATION (D-025, 7.2.1)
// ----------------------------------------------------------------------------
async function teacherPayablesPanel() {
  const raw = await request("/finance/teacher-payables");
  const data = Array.isArray(raw) ? raw : [];

  const totalPayable = data.reduce((sum, p) => sum + Number(p.payable_amount || 0), 0);
  const totalMins = data.reduce((sum, p) => sum + Number(p.conducted_minutes || 0), 0);
  const verifiedCount = data.filter(p => p.status === 'verified').length;
  const pendingCount = data.filter(p => p.status === 'pending').length;

  const summaryStrip = `
    <div class="deck-kpi-strip">
      <div class="deck-kpi-item">
        <span class="deck-kpi-num navy">${totalPayable.toLocaleString()} ৳</span>
        <span class="deck-kpi-label">Total Compensation</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num">${Math.round(totalMins / 60)}h ${totalMins % 60}m</span>
        <span class="deck-kpi-label">Conducted Hours</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num ok">${verifiedCount}</span>
        <span class="deck-kpi-label">Verified Sessions</span>
      </div>
      <div class="deck-kpi-item">
        <span class="deck-kpi-num${pendingCount > 0 ? ' warn' : ''}">${pendingCount}</span>
        <span class="deck-kpi-label">Pending Verification</span>
      </div>
    </div>
  `;

  const topAction = admin() || state.me.role === 'zimmadar'
    ? btn("Calculate Session Payable", "ops-calc-payable", "")
    : "";

  const toolbar = tableSearchToolbar("payables-tbl", "Search teacher, class ID, month...");

  const tbl = table(
    ["Teacher", "Class Session", "Month", "Duration", "Hourly Rate", "Payable", "Status", "Calculated At"],
    data.map(p => `<tr>
      <td><b>${escapeHtml(p.teacher_name || 'Staff #' + p.teacher_id)}</b><br><small class="muted">${escapeHtml(p.teacher_email || '')}</small></td>
      <td><b>#CLS-${String(p.class_session_id).padStart(4, '0')}</b><br><small class="muted">${escapeHtml(p.course_title || '')}</small></td>
      ${item(p.billing_month)}
      ${item(p.conducted_minutes + " mins")}
      <td class="money-cell">${Number(p.hourly_rate).toLocaleString()} ৳/hr</td>
      <td class="money-cell ok">${Number(p.payable_amount).toLocaleString()} ৳</td>
      <td>${tag(p.status)}</td>
      ${item(formatDate(p.calculated_at))}
    </tr>`),
    "payables-tbl"
  );

  return wrap(
    "Teacher Compensation & Payables",
    topAction,
    '<div class="page-note">D-025 / 7.2.1: Teacher compensation calculation based on verified conducted class minutes and hourly rate contract.</div>' +
    summaryStrip +
    toolbar +
    tbl
  );
}
