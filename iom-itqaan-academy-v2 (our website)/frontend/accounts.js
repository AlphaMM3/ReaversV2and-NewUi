async function accountPanel() {
  const data = await request("/account/roles");
  const user = state.me || {};
  const profileCard = `
    <div class="card mb-md">
      <div class="profile-row">
        <div class="avatar-circle">
          ${escapeHtml((user.name || user.email || 'U')[0].toUpperCase())}
        </div>
        <div>
          <div class="profile-name">${escapeHtml(user.name || 'User')}</div>
          <div class="profile-meta">${escapeHtml(user.email || '—')} · <span class="pill sm">${escapeHtml(user.role || '—')}</span></div>
        </div>
      </div>
    </div>
  `;
  return wrap(
    "Account & security",
    null,
    profileCard +
    '<div class="inline-actions">' +
      btn("Change password", "password", "") +
      btn("Sign out everywhere", "signout-all", "") +
      (data.assignments.length ? btn("Switch role", "switch-role", "") : "") +
    "</div>"
  );
}
function passwordFields(current) {
  return (
    (current
      ? field(
          "Current password",
          "current_password",
          "password",
          'autocomplete="current-password"',
        )
      : "") +
    field(
      "New password",
      "password",
      "password",
      'minlength="12" maxlength="256" autocomplete="new-password"',
    ) +
    field(
      "Confirm password",
      "confirm",
      "password",
      'minlength="12" maxlength="256" autocomplete="new-password"',
    )
  );
}
function matchingPassword(d) {
  if (d.password !== d.confirm) throw Error("Passwords do not match");
}
function roleLabel(r) {
  return (
    r.role.replaceAll("_", " ") +
    (r.department_name
      ? " · " + r.department_name
      : r.branch_name
        ? " · " + r.branch_name
        : "")
  );
}
function resetPasswordModal(token) {
  modal(
    "Reset password",
    passwordFields(false),
    async (d) => {
      matchingPassword(d);
      await request("/password/reset", {
        method: "POST",
        body: { token, password: d.password },
      });
      history.replaceState(null, "", location.pathname + location.search);
      return { sign_in_required: true };
    },
    "Reset password",
  );
}
async function accountAction(action, id) {
  const owner = state.me,
    view = state.renderVersion;
  const ensure = () => {
    if (state.me !== owner || state.renderVersion !== view)
      throw Error("Account or view changed");
  };
  if (action === "password")
    return modal(
      "Change password",
      passwordFields(true),
      async (d) => {
        ensure();
        matchingPassword(d);
        return request("/account/password", {
          method: "POST",
          body: { current_password: d.current_password, password: d.password },
        });
      },
      "Change password",
    );
  if (action === "signout-all")
    return modal(
      "Sign out everywhere",
      "",
      () => {
        ensure();
        return request("/account/revoke-sessions", { method: "POST" });
      },
      "Sign out",
    );
  if (action === "account-status") {
    const [uid, active] = id.split(":");
    return modal(
      Number(active) ? "Deactivate account" : "Activate account",
      "",
      () => {
        ensure();
        return request(`/users/${uid}/status`, {
          method: "POST",
          body: {
            active: !Number(active),
            expected_active: Boolean(Number(active)),
          },
        });
      },
      Number(active) ? "Deactivate" : "Activate",
    );
  }
  if (action === "reset-link") {
    const result = await request(`/users/${id}/reset-link`, { method: "POST" });
    if (state.me !== owner || state.renderVersion !== view) return;
    const link =
      location.origin + "/#reset=" + encodeURIComponent(result.token);
    return modal(
      "Reset link",
      '<label class="wide">One-time link<input readonly value="' +
        escapeHtml(link) +
        '"></label>',
      null,
    );
  }
  if (action === "switch-role") {
    const actor = state.me,
      version = state.renderVersion,
      data = await request("/account/roles");
    if (state.me !== actor || state.renderVersion !== version) return;
    return modal(
      "Switch role",
      select("Role", "assignment_id", [
        ["", data.base.role.replaceAll("_", " ")],
        ...data.assignments.map((r) => [r.id, roleLabel(r)]),
      ]).replace(
        `value="${escapeHtml(data.active_assignment_id || "")}"`,
        `value="${escapeHtml(data.active_assignment_id || "")}" selected`,
      ),
      async (d) => {
        if (state.me !== actor || state.renderVersion !== version)
          throw Error("Account changed");
        const result = await request("/account/role", {
          method: "POST",
          body: {
            assignment_id: d.assignment_id ? Number(d.assignment_id) : null,
          },
        });
        state.csrf = result.csrf;
        state.me = await request("/me");
        showApp();
      },
      "Switch",
    );
  }
  if (action === "roles") {
    const actor = state.me,
      version = state.renderVersion;
    const [assigned, branches, departments] = await Promise.all([
      request(`/users/${id}/roles`),
      request("/branches"),
      request("/departments"),
    ]);
    if (state.me !== actor || state.renderVersion !== version) return;
    const list = assigned
      .filter((r) => r.active)
      .map(
        (r) =>
          `<li>${escapeHtml(roleLabel(r))} ${btn("Revoke", "revoke-role", id + ":" + r.id)}</li>`,
      )
      .join("");
    const fields =
      '<ul class="wide guardian-links">' +
      list +
      "</ul>" +
      select(
        "Role",
        "role",
        [
          "teacher",
          "zimmadar",
          "department_supervisor",
          "branch_admin",
          "central_admin",
        ].map((r) => [r, r.replaceAll("_", " ")]),
      ) +
      select(
        "Branch",
        "branch_id",
        [["", "—"], ...branches.map((b) => [b.id, b.name])],
        false,
      ) +
      select(
        "Department",
        "department_id",
        [["", "—"], ...departments.map((d) => [d.id, d.name])],
        false,
      );
    return modal(
      "Roles",
      fields,
      async (d) => {
        if (state.me !== actor || state.renderVersion !== version)
          throw Error("Account changed");
        await request(`/users/${id}/roles`, {
          method: "POST",
          body: {
            role: d.role,
            branch_id: d.branch_id ? Number(d.branch_id) : null,
            department_id: d.department_id ? Number(d.department_id) : null,
          },
        });
      },
      "Assign",
    );
  }
  if (action === "revoke-role") {
    const [uid, aid] = id.split(":");
    await request(`/users/${uid}/roles/${aid}/revoke`, { method: "POST" });
    clearView();
    return render();
  }
}
