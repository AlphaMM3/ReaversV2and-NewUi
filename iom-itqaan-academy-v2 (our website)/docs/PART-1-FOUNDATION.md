# Part 1.1–1.5 — staging foundation acceptance

Recorded 2026-11-04. Authority remains the original D-001..201 plus approved
amendments and the later explicit separate Guardian-publication decision.
This checklist implements the five bounded Part 1 items requested by the user;
it is not acceptance of all Blueprint decisions or production readiness.

## 1.1 Project and development setup

| Acceptance | Implementation / evidence |
|---|---|
| Node 24, TypeScript and Express | package.json, locked dependencies, strict tsconfig, src/server.ts |
| Maintainable ownership | src/app.ts HTTP; security.ts auth/scope; catalog.ts people/catalog; academic.ts transitions; policy.ts pure rules; monitor.ts alerts/summaries; progress.ts publication; db.ts transactions; cli.ts/migrations.ts explicit setup |
| Separate maintained frontend | frontend/; public/, baseline/, vault/ and provenance.json remain preserved imports |
| Feature branch and PR delivery | Branch from latest staging; CI then authorized PR integration; never overwrite main |
| Automated verification | npm test; test:mysql; test:upgrade; verify:baseline; original Python tests; parity.yml MySQL 8/MariaDB jobs |
| Hostinger-compatible deploy | GitHub staging auto-deploy, build:hostinger, Node 24/Express, dist/src/server.js, health/ready; no startup DDL |
| Fresh setup usable from UI | Central Admin → Branches → Add branch; then Users, Families, Students and academic setup |

New first-branch UI uses the existing central-admin-only POST /api/branches.
Branch creation is absent from other roles' menus and denied server-side.

## 1.2 Database foundation

- Migrations 001, 002, 003; no new migration for this foundation release.
- 18 InnoDB tables, 29 FK relationships; schema acceptance checks table inventory,
  engines, critical parent/child links and all migration checksums against source.
- People/organization: branches, users, families, family_guardians, students,
  departments, courses, batches and enrollments.
- Academic: class_sessions, attendance, reports and report_revisions.
- Publication/operations: published_progress, report_alert_events, audit_events,
  auth_sessions and schema_migrations.
- Existing uniqueness, FK enforcement, repeat migrations, upgrade row retention,
  concurrent 1:1 enrollment and publication retries have SQL tests.
- Cross-branch business consistency also relies on server-side checks; the schema
  is not claimed to enforce every future composite business invariant by itself.

## 1.3 Login and basic permissions

- Existing PBKDF2 password hashing, hashed sessions, expiry, logout and CSRF guards.
- Six existing roles: central_admin, branch_admin, teacher, zimmadar,
  guardian_primary and guardian_secondary.
- Central/branch/batch and own-family scope checks with denied-path tests.
- Expired session and deactivated-user rejection have real SQL/HTTP acceptance.
- Distinct Primary/Secondary logins; each linked Guardian sees linked children only.

### New basic family-link setup

Authorized admin opens Families → View / link guardians. The dialog lists existing
links and offers only active Guardian accounts from that family's branch that are
not already linked. Primary and Secondary identities remain separate accounts.
The responsive list avoids forcing a wide table inside a phone dialog.

`GET /api/families/:family_id/guardians` returns linked account ID/name/role/active,
not password hashes or session data. Admin role and family branch checks apply.

`POST /api/families/:family_id/guardians` accepts `{ guardian_user_id: number }`.
It requires admin authorization, CSRF, active Guardian role and same branch.
Family/user row locks serialize changes; duplicate retries return
`already_linked: true` without another link or audit event. New links append a
`link_guardian` family audit record. Initial family creation also rejects inactive
Guardian links. GET makes no business-data changes.

Teacher/Zimmadar/Guardian cannot use these admin setup endpoints. Branch admins
cannot act outside their branch. Primary self-service add/edit/remove under D-065,
unlinks, credential recovery and broader family administration are NOT implemented
by this basic admin-setup contract and remain later scope; D-065 is not revoked.

## 1.4 Basic academic operations

- Admin can create family-linked students, departments, courses and batches.
- Regular/single-course department categories and fixed/continuous course duration
  are represented independently from group/one_to_one delivery mode.
- Enrollment preserves student, batch and effective dates; an individual slot
  rejects competing active enrollments under the current basic model.
- Classes can be scheduled; assigned Teacher starts/ends; assigned Zimmadar verifies
  held; Teacher records attendance. Unauthorized role/state repeats are denied.
- Monthly summary uses verified held classes and keeps Unrecorded distinct from
  Absent. Present/Late and enrollment-specific calculations retain approved rules.
- Existing direct-correction window applies; approval beyond that window, leave,
  recurring routines, transfers, substitutes, package/minute ledgers and full
  follow-up automation remain the later Parts already identified in the roadmap.

## 1.5 Reports and Guardian progress

- Teacher saves drafts, loads saved text, submits, revises returned reports and
  resubmits. Zimmadar approves/returns with reason; snapshots remain in revisions.
- Submitted/approved direct overwrite is denied; the new UI submits version tokens.
- Current return reason remains through revision draft saves; review/submission
  status are separate under AM-17. See REPORT-WORKSPACE.md for compatibility limits.
- Assigned Zimmadar explicitly publishes a separate learner-specific progress and
  homework summary. Internal body/review reasons/private notes do not become public.
- Both Guardian roles see their linked children across group and basic 1:1
  enrollments. Guardian internal report/monitor access is denied.
- Published homework text is not the later full assignment/completion module.

## Verification recorded for this change

- npm ci and TypeScript build completed; 26 Node unit/UI tests PASS, including
  differential fixtures from the original Python policy implementation.
- 28 SQL/HTTP tests PASS on a new dedicated local MariaDB 11.4.5 test database;
  migration upgrade/repeat checks PASS. Metadata is sorted in JavaScript to avoid
  making MySQL/MariaDB collation order an accidental acceptance requirement.
- Original Python baseline: 16 PASS, one dependency deprecation warning.
- Baseline/Vault 87 hash checks PASS.
- Fresh-install browser journey: bootstrap admin → create first branch → create
  Teacher/Zimmadar/two Guardian accounts → family/Guardian link → two students →
  department/course/group and basic 1:1 setup → enroll/schedule → class start/end →
  report → held verification → review/publication → attendance → both Guardian
  dashboards. PASS with synthetic local data; no JS exceptions.
- Guardian-link dialog fits 1440/768/390 viewports. Async dialog failures show a
  toast; old-account/navigation responses cannot reopen a family dialog.
- GitHub CI and deployed staging read-back are release gates recorded in the PR
  and dated release evidence. Local results alone do not establish those gates.

UI uses the existing product shell/palette/type and app-screen conventions from
design-taste-frontend. Question: which Guardian accounts can access this family?
Identity is the family label and distinct Guardian roles; no invented metrics or
new design package is installed. The previously shared UX/UI kit is not silently
installed or allowed to replace project instructions.

## Local developer setup (disposable data only)

1. Use Node 24 and a NEW empty local `academy_test_*` database/user. Keep credentials
   outside source. Set ACADEMY_ENV=test, DB_HOST=127.0.0.1, DB_PORT, DB_NAME, DB_USER,
   DB_PASSWORD through a private environment. Never use staging/legacy credentials.
2. Run npm ci, npm run build, npm test and npm run verify:baseline.
3. For upgrade acceptance on an empty test DB: ACADEMY_ALLOW_SETUP=1, then
   npm run test:upgrade, npm run migrate twice, npm run test:mysql. These SQL tests
   create synthetic fixtures; do not use a personal preview DB with important data.
4. For a separate fresh UI preview DB, run migrate, then bootstrap once using
   BOOTSTRAP_EMAIL/BOOTSTRAP_PASSWORD in the private environment. Bootstrap refuses
   an existing user table. Do not bootstrap into the SQL test fixtures.
5. Clear bootstrap secrets and set ACADEMY_ALLOW_SETUP=0. For loopback HTTP only set
   NODE_ENV=development, ACADEMY_SECURE_COOKIES=0 and PORT, then npm start. The server
   binds all interfaces; use firewall/local test isolation. Hosted HTTPS must keep
   NODE_ENV=production and secure cookies enabled.
6. Sign in and follow the first-branch setup sequence above. No secret is supplied
   in this guide; never put passwords into command arguments, Git or screenshots.

## Release, rollback and completion boundary

Code changes use a feature branch/PR into staging; CI on both database engines,
encrypted pre-release backup/isolated restore, deployment source match and live
scoped read-back must pass before reporting staging completion. No migration,
bulk import, production launch, legacy credential linking or Payment Portal write
is part of this release. Roll back application code independently and retain new
family links, reports, publications and audit history.

Part 1 completion refers to the bounded basic staging foundation listed here.
It does not claim the whole Academy is complete or that independent security,
architecture, department UAT and D-201 production approval have been obtained.
