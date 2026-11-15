function careTabs(activeTab) {
  const guardian = state.me.role.startsWith("guardian");
  return (
    '<div class="inline-actions care-tabs mb-md">' +
    [
      ["summary", "Summary"],
      ...(!guardian
        ? [
            ["followups", "Follow-ups"],
            ["corrections", "Corrections"],
          ]
        : []),
      ["leave", "Leave"],
      ["notifications", "Notifications"],
    ]
      .map(([id, label]) => `<button class="btn sm ${activeTab === id ? 'primary' : ''}" data-action="care-tab" data-id="${escapeHtml(id)}">${escapeHtml(label)}</button>`)
      .join("") +
    "</div>"
  );
}
async function attendanceWorkspace() {
  const guardian = state.me.role.startsWith("guardian"),
    tab =
      guardian && !["leave", "notifications"].includes(state.careTab)
        ? "leave"
        : state.careTab || (guardian ? "leave" : "summary");
  let content = "";
  if (tab === "summary") {
    const [followups, leaves, corrections] = await Promise.all([
      request("/followups?status=pending").catch(() => ({ items: [] })),
      request("/leaves").catch(() => []),
      request("/attendance-corrections").catch(() => []),
    ]);
    const pendingLeaves = (Array.isArray(leaves) ? leaves : []).filter(l => ["requested", "supervisor_review"].includes(l.status));
    const pendingCorrections = (Array.isArray(corrections) ? corrections : []).filter(c => c.status === "pending");
    const pendingCases = followups.items || [];
    const streaks = pendingCases.filter(c => c.kind.includes("streak") || c.kind.includes("consecutive") || c.kind.includes("seven"));

    content = `
      <div class="cards">
        <div class="card"><div class="glyph">⚠</div><div class="big">${pendingCases.length}</div><small>Pending Follow-up Cases</small></div>
        <div class="card"><div class="glyph">✉</div><div class="big">${pendingLeaves.length}</div><small>Pending Leave Requests</small></div>
        <div class="card"><div class="glyph">✎</div><div class="big">${pendingCorrections.length}</div><small>Pending Corrections</small></div>
        <div class="card"><div class="glyph">▦</div><div class="big">${streaks.length}</div><small>Active Absence Streaks</small></div>
      </div>
      <div class="page-note">
        <b>D-019 / D-055 / AM-08 Attendance & Care Engine Rules:</b><br>
        • Join time: 15:00 BD cutoff (Present) vs 15:01 (Late). Serialized with millisecond evidence.<br>
        • Teacher direct correction allowed within 7 days; past cutoff requires Zimmadar review.<br>
        • 7 consecutive held class absences trigger Phase 1 contact task; second seven held absences trigger Phase 2 supervisor escalation.<br>
        • Low attendance (&lt;75%) requires ≥ 3 held classes with complete recorded attendance.<br>
        • Approved leave pauses follow-up deadlines; remaining time is preserved upon return.
      </div>
      <div class="panel">
        <div class="panel-title"><h3>Care Navigation & Queues</h3></div>
        <div class="inline-actions">
          ${btn("Absence Follow-up Tasks (" + pendingCases.length + ")", "care-tab", "followups")}
          ${btn("Student Leave Requests (" + pendingLeaves.length + ")", "care-tab", "leave")}
          ${btn("Attendance Corrections (" + pendingCorrections.length + ")", "care-tab", "corrections")}
          ${btn("Monthly Attendance Matrix", "care-open-monthly", "")}
        </div>
      </div>
    `;
  } else if (tab === "followups") {
    const page = await request(
      "/followups" +
        (state.followupStatus
          ? "?status=" + encodeURIComponent(state.followupStatus)
          : "") +
        (state.followupBefore
          ? (state.followupStatus ? "&" : "?") +
            "before=" +
            state.followupBefore
          : ""),
    );
    content =
      '<form id="followupFilters" class="guardian-filters">' +
      chosen(
        "Status",
        "status",
        [
          ["", "All"],
          ["pending", "Pending"],
          ["completed", "Completed"],
          ["closed", "Closed"],
        ],
        state.followupStatus,
        false,
      ) +
      '<button class="btn" type="submit">View</button></form>' +
      table(
        ["Student / course", "Kind", "State", "Due", ""],
        page.items.map(
          (f) =>
            `<tr>${item(f.student_name + " · " + f.course_title)}${item(f.kind.replaceAll("_", " "))}<td>${tag(f.paused ? "Paused" : f.escalated ? "Escalated" : f.overdue ? "Overdue" : f.status)}</td>${item(formatDate(f.due_at))}<td>${btn("Open", "care-case", f.id)}</td></tr>`,
        ),
      ) +
      '<div class="inline-actions">' +
      (state.followupBefore ? btn("First page", "care-first", "") : "") +
      (page.next_before ? btn("Next", "care-next", page.next_before) : "") +
      (["central_admin", "zimmadar"].includes(state.me.role)
        ? btn("Recalculate learner", "care-recalculate", "")
        : "") +
      "</div>";
  } else if (tab === "leave") {
    const data = await request("/leaves");
    content =
      (guardian
        ? '<div class="inline-actions">' +
          btn("Request leave", "care-leave-new", "") +
          "</div>"
        : "") +
      table(
        ["Student / course", "Dates", "Status", "Return", ""],
        data.map(
          (l) =>
            `<tr>${item(l.student_name + " · " + l.course_title)}${item(l.start_date + "–" + l.end_date)}<td>${tag(l.status)}</td>${item(l.returned_class_id ? "Returned" : "—")}<td>${btn("History", "care-leave-history", l.id)}${guardian && l.status === "rejected" ? btn("Resubmit", "care-leave-resubmit", l.id) : ""}${guardian && l.status === "approved" ? btn("Extend", "care-leave-extend", l.id) : ""}${(state.me.role === "zimmadar" && l.status === "requested") || (state.me.role === "department_supervisor" && l.status === "supervisor_review") ? btn("Review", "care-leave-review", l.id) : ""}</td></tr>`,
        ),
      );
  } else if (tab === "corrections") {
    const data = await request("/attendance-corrections");
    content = table(
      ["Student", "Class", "Proposed status", "State", ""],
      data.map(
        (r) =>
          `<tr>${item(r.student_name)}${item(r.class_id)}${item(r.new_status)}<td>${tag(r.status)}</td><td>${state.me.role === "zimmadar" && r.status === "pending" ? btn("Review", "care-correction", r.id) : ""}</td></tr>`,
      ),
    );
  } else if (tab === "notifications") {
    const [list, deliveries, link] = await Promise.all([
      request("/notifications"),
      request("/notification-deliveries"),
      request("/telegram"),
    ]);
    content =
      '<div class="inline-actions">' +
      (link.linked
        ? btn("Unlink Telegram", "care-unlink", "")
        : link.configuration_required
          ? '<span class="muted">Telegram not connected</span>'
          : btn("Link Telegram", "care-link", "")) +
      "</div>" +
      table(
        ["Notification", "At", "Telegram", ""],
        list.map(
          (n) =>
            `<tr>${item(n.title)}${item(formatDate(n.created_at))}${item(n.delivery_status || "Not linked")}<td>${n.read_at ? "Read" : btn("Mark read", "care-read", n.id)}</td></tr>`,
        ),
      ) +
      "<h3>Delivery history</h3>" +
      table(
        ["Message", "State", "Attempts", ""],
        deliveries.map(
          (d) =>
            `<tr>${item(d.title)}<td>${tag(d.status)}</td>${item(d.attempt_count)}<td>${["unknown", "failed"].includes(d.status) ? btn("Review retry", "care-retry", d.id) : ""}</td></tr>`,
        ),
      );
  }
  return (
    careTabs(tab) +
    wrap(
      tab === "leave"
        ? "Student leave"
        : tab === "corrections"
          ? "Attendance corrections"
          : tab === "notifications"
            ? "Notifications"
            : tab === "summary"
              ? "Attendance & care overview"
              : "Follow-ups",
      null,
      content,
    )
  );
}
async function attendanceWorkspaceModal(id) {
  const owner = state.me,
    version = state.renderVersion,
    data = await request(`/classes/${id}/attendance`);
  if (state.me !== owner || state.renderVersion !== version) return;
  opsDialog(
    "Class attendance",
    table(
      ["Student", "Status", "Join time", ""],
      data.map(
        (r) =>
          `<tr>${item(r.full_name)}<td>${tag(r.status)}</td>${item(formatDate(r.join_time))}<td>${owner.role === "teacher" ? btn(r.id ? "Correct" : "Record", "care-attendance-edit", id + ":" + r.enrollment_id) : ""}${r.id ? btn("History", "care-attendance-history", id + ":" + r.enrollment_id) : ""}</td></tr>`,
      ),
    ),
    null,
  );
}
async function careAction(action, id) {
  const actor = state.me,
    version = state.renderVersion;
  const ensure = () => {
    if (actor !== state.me || version !== state.renderVersion)
      throw Error("Account or view changed");
  };
  const read = async (path) => {
    const data = await request(path);
    ensure();
    return data;
  };
  const post = (path, data) => {
    ensure();
    return request(path, { method: "POST", body: data });
  };
  const closeDialogs = () =>
    document.querySelectorAll(".modalback").forEach((el) => el.remove());
  if (action === "care-open-monthly") return navigate("attendance-monthly");
  if (action === "care-tab") {
    state.careTab = id;
    state.followupBefore = null;
    return render();
  }
  if (action === "care-open-leave") {
    state.careTab = "leave";
    return navigate("attendance-workspace");
  }
  if (action === "care-next") {
    state.followupBefore = id;
    return render();
  }
  if (action === "care-first") {
    state.followupBefore = null;
    return render();
  }
  if (action === "care-read") {
    await post("/notifications/" + id + "/read", {});
    return render();
  }
  if (action === "care-link") {
    const data = await post("/telegram/link-token", {});
    return opsDialog(
      "Link personal Telegram",
      '<a class="btn" href="' +
        escapeHtml(data.url) +
        '" target="_blank" rel="noopener noreferrer">Open Telegram</a>',
      null,
    );
  }
  if (action === "care-unlink")
    return opsDialog(
      "Unlink Telegram",
      "",
      () => post("/telegram/unlink", {}),
      "Unlink",
    );
  if (action === "care-retry")
    return opsDialog(
      "Retry unconfirmed delivery",
      '<p class="wide">The earlier message may already have arrived. Retrying can send a duplicate.</p>',
      () =>
        post("/notification-deliveries/" + id + "/retry", {
          confirm_possible_duplicate: true,
        }),
      "Retry once",
    );
  if (action === "care-attendance-edit") {
    const [cl, eid] = id.split(":"),
      row = (await read(`/classes/${cl}/attendance`)).find(
        (r) => r.enrollment_id == eid,
      );
    if (!row) throw Error("Learner unavailable");
    const req = crypto.randomUUID();
    closeDialogs();
    return opsDialog(
      "Attendance · " + row.full_name,
      chosen(
        "Status",
        "status",
        [
          ["Present", "Present"],
          ["Late", "Late"],
          ["Absent", "Absent"],
        ],
        row.status === "Unrecorded" ? "Present" : row.status,
      ) +
        '<label>Join time<input type="datetime-local" name="join_time" step="0.001" value="'+escapeHtml((row.join_time||'').replace(/\+06:00$/,''))+'"></label>' +
        (row.id ? field("Correction reason", "reason") : ""),
      (d) =>
        post(`/classes/${cl}/attendance`, {
          ...d,
          enrollment_id: Number(eid),
          expected_revision: row.revision,
          request_id: req,
        }),
    );
  }
  if (action === "care-attendance-history") {
    const [cl, eid] = id.split(":"),
      data = await read(`/classes/${cl}/attendance/${eid}/history`);
    closeDialogs();
    return opsDialog(
      "Attendance history",
      table(
        ["At", "Old", "New", "Actor", "Approved by"],
        data.map(
          (v) =>
            `<tr>${item(formatDate(v.at))}${item(v.old_status || "Unrecorded")}${item(v.new_status)}${item(v.actor_id)}${item(v.approved_by)}</tr>`,
        ),
      ),
      null,
    );
  }
  if (action === "care-correction") {
    const req = (await read("/attendance-corrections")).find((r) => r.id == id);
    return opsDialog(
      "Review correction",
      '<div class="wide report-text">' +
        escapeHtml(req.reason) +
        "</div>" +
        select("Decision", "action", [
          ["approve", "Approve"],
          ["reject", "Reject"],
        ]) +
        field("Review reason", "reason"),
      (d) => post(`/attendance-corrections/${id}/review`, d),
    );
  }
  if (
    ["care-leave-new", "care-leave-resubmit", "care-leave-extend"].includes(
      action,
    )
  ) {
    const existing =
        action === "care-leave-new"
          ? null
          : (await read("/leaves")).find((l) => l.id == id),
      enrollments = await read("/enrollments"),
      req = crypto.randomUUID();
    const fields =
      (existing
        ? ""
        : select(
            "Enrollment",
            "enrollment_id",
            enrollments
              .filter((e) => e.status === "active")
              .map((e) => [
                e.id,
                e.student_name + " · " + e.course_title + " / " + e.batch_name,
              ]),
          )) +
      dateInput("From", "start_date", existing?.start_date) +
      dateInput("Until", "end_date", existing?.end_date) +
      '<label class="wide">Reason<textarea name="reason" required maxlength="2000">' +
      escapeHtml(action === "care-leave-resubmit" ? existing.reason : "") +
      "</textarea></label>";
    return opsDialog(
      action === "care-leave-extend"
        ? "Extend approved leave"
        : action === "care-leave-resubmit"
          ? "Resubmit leave"
          : "Request leave",
      fields,
      (d) =>
        action === "care-leave-resubmit"
          ? post(`/leaves/${id}/resubmit`, {
              ...d,
              expected_revision: existing.revision,
            })
          : post("/leaves", {
              ...d,
              enrollment_id: existing
                ? existing.enrollment_id
                : Number(d.enrollment_id),
              extension_of: action === "care-leave-extend" ? Number(id) : null,
              request_id: req,
            }),
    );
  }
  if (action === "care-leave-review") {
    const l = (await read("/leaves")).find((l) => l.id == id);
    return opsDialog(
      "Review leave",
      '<div class="wide report-text">' +
        escapeHtml(l.reason) +
        "</div>" +
        select("Decision", "action", [
          ["approve", "Approve"],
          ["reject", "Reject"],
        ]) +
        '<label class="wide">Review reason<textarea name="reason" maxlength="2000"></textarea></label>',
      (d) =>
        post(`/leaves/${id}/review`, { ...d, expected_revision: l.revision }),
    );
  }
  if (action === "care-leave-history") {
    const data = await read(`/leaves/${id}/history`);
    return opsDialog(
      "Leave history",
      table(
        ["At", "Action", "Actor"],
        data.map(
          (h) =>
            `<tr>${item(formatDate(h.at))}${item(h.event)}${item(h.actor_id)}</tr>`,
        ),
      ),
      null,
    );
  }
  if (action === "care-case") {
    const data = await read("/followups/" + id),
      f = data.case;
    const commands =
      (actor.role === "teacher" &&
      f.assignee_id === actor.id &&
      ["pending", "completed"].includes(f.status)
        ? btn(
            f.status === "pending" ? "Record contact" : "Edit contact",
            "care-note",
            id,
          )
        : "") +
      (actor.role === "teacher" &&
      f.kind === "low_attendance" &&
      f.status === "completed"
        ? f.reopen_count < 2
          ? btn("Reopen", "care-reopen", id)
          : btn("Request new follow-up", "care-new-case", id)
        : "") +
      (actor.role === "department_supervisor" &&
      f.kind === "low_attendance" &&
      f.status === "pending" &&
      f.escalation_at &&
      +new Date(f.escalation_at) < Date.now()
        ? btn("Reassign", "care-reassign", id)
        : "");
    return opsDialog(
      "Follow-up #" + id,
      '<div class="wide inline-actions">' +
        commands +
        "</div>" +
        data.notes
          .map(
            (n) =>
              '<details class="wide"><summary>' +
              escapeHtml(n.contact_date) +
              " · Staff #" +
              escapeHtml(n.author_id) +
              '</summary><h3>Guardian statement</h3><div class="report-text">' +
              escapeHtml(n.guardian_statement) +
              '</div><h3>Next steps</h3><div class="report-text">' +
              escapeHtml(n.next_steps) +
              '</div><div class="report-text">' +
              escapeHtml(n.note) +
              "</div></details>",
          )
          .join("") +
        data.requests
          .filter((r) => r.status === "pending")
          .map(
            (r) =>
              '<div class="wide">' +
              escapeHtml(r.kind.replaceAll("_", " ")) +
              " " +
              (actor.role === "zimmadar"
                ? btn("Review", "care-request-review", r.id)
                : "Pending approval") +
              "</div>",
          )
          .join("") +
        '<div class="wide">' +
        table(
          ["At", "Action", "Actor"],
          data.events.map(
            (e) =>
              `<tr>${item(formatDate(e.at))}${item(e.event)}${item(e.actor_id)}</tr>`,
          ),
        ) +
        "</div>",
      null,
    );
  }
  if (action === "care-note") {
    const data = await read("/followups/" + id),
      latest = data.notes[0],
      req = crypto.randomUUID();
    closeDialogs();
    return opsDialog(
      "Guardian contact",
      dateInput(
        "Contact date",
        "contact_date",
        latest?.contact_date || new Date().toISOString().slice(0, 10),
      ) +
        '<label class="wide">Guardian statement<textarea name="guardian_statement" required maxlength="5000">' +
        escapeHtml(latest?.guardian_statement || "") +
        '</textarea></label><label class="wide">Next steps<textarea name="next_steps" required maxlength="5000">' +
        escapeHtml(latest?.next_steps || "") +
        '</textarea></label><label class="wide">Private notes<textarea name="note" maxlength="5000">' +
        escapeHtml(latest?.note || "") +
        "</textarea></label>",
      (d) =>
        post(`/followups/${id}/note`, {
          ...d,
          expected_revision: data.case.revision,
          request_id: req,
        }),
      "Submit contact",
    );
  }
  if (action === "care-reopen" || action === "care-new-case") {
    const data = await read("/followups/" + id),
      req = crypto.randomUUID();
    closeDialogs();
    return opsDialog(
      action === "care-reopen" ? "Reopen follow-up" : "Request new follow-up",
      action === "care-new-case" ? field("Reason", "reason") : "",
      (d) =>
        post(
          `/followups/${id}/${action === "care-reopen" ? "reopen" : "new-request"}`,
          { ...d, expected_revision: data.case.revision, request_id: req },
        ),
    );
  }
  if (action === "care-request-review") {
    const found = await read("/followup-requests/" + id),
      payload = JSON.parse(found.payload);
    closeDialogs();
    return opsDialog(
      "Review " + found.kind.replaceAll("_", " "),
      '<div class="wide report-text">' +
        escapeHtml(
          [
            payload.contact_date,
            payload.guardian_statement,
            payload.next_steps,
            payload.reason,
          ]
            .filter(Boolean)
            .join("\n"),
        ) +
        "</div>" +
        select("Decision", "action", [
          ["approve", "Approve"],
          ["reject", "Reject"],
        ]) +
        field("Review reason", "reason"),
      (d) => post(`/followup-requests/${id}/review`, d),
    );
  }
  if (action === "care-reassign") {
    const data = await read("/followups/" + id),
      users = await read("/users");
    closeDialogs();
    return opsDialog(
      "Reassign follow-up",
      select(
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
      ) + field("Reason", "reason"),
      (d) =>
        post("/followups/" + id + "/reassign", {
          ...d,
          teacher_id: Number(d.teacher_id),
          expected_revision: data.case.revision,
        }),
    );
  }
  if (action === "care-recalculate") {
    const ens = await read("/enrollments");
    return opsDialog(
      "Recalculate learner",
      select(
        "Enrollment",
        "enrollment_id",
        ens.map((e) => [e.id, e.student_name + " · " + e.course_title]),
      ),
      (d) => post("/attendance-status/" + d.enrollment_id + "/recalculate", {}),
    );
  }
}
