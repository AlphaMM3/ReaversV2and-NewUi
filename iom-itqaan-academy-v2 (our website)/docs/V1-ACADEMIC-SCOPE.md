# V1 academic operations / V2 deferrals

Implementation started 2026-11-04 on codex/academy-v1-academic-operations.
This is a scope/impact record, not a claim of deployment or passing tests.
The user authorized V1-first delivery and explicitly delegated V2 deferrals.

Keep one Express app, one SQL database and the maintained plain frontend.
Preserve imported Vault/baseline/public/provenance, history and legacy boundaries.

| Part | V1 acceptance | V2 / unresolved scope |
|---|---|---|
| Admission D-005/026/139/155/165 | Existing Primary Guardian submits for linked family; admin manual intake, review notes, direct or manually assessed admission, explicit placement, accept once into enrollment | Public signup/invitations, anonymous applications, oral/video scheduling, written/MCQ engine, automatic scoring/placement, payment integration |
| Setup D-003/023/025/146/151 | Existing branch/department/course creation; academic session and optional course/batch date settings | Holidays/exam-period automation, archive UI, course portfolio content entry |
| Assignment D-020/036..038 | Admin changes regular Teacher/Zimmadar with history; explicit option updates future unstarted regular sessions after conflict checks, preserving historical and explicit substitute ownership; Zimmadar assigns substitute to an unstarted class | Multiple simultaneous regular teachers, automatic substitute search/workload/absence-request routing |
| Routine D-016/048/049 | Weekly multi-slot routines, explicit bounded generation, Teacher/batch conflicts, Zimmadar reschedule/cancel with reason and history, Portal shows new schedule | Telegram delivery, Teacher absence/request approval, Supervisor makeup approval and original/makeup linkage D-045..052 |
| Reports D-032/043/044 | Course-specific editable prompt template, immutable template versions bound at first report save, retained report/revision bodies and return flow | Dynamic typed field builder, mandatory academic field schemas and scoring until each course approves its fields |
| Lifecycle D-148/151/157/158 | Admin updates per-enrollment status with reason/history, terminal status requires end date; old attendance/report/publication stays readable | Batch/branch transfer pending exact effective/overlap rules (AM-15), retroactive status periods, automatic progression/reactivation/follow-up/fee effects |

V1 capacity preserves the existing 1:1 one-student guard. Group capacity/waitlist
automation is deferred until actual capacity/overlap rules are configured/approved;
no invented global seat count. Admission does not create an account or change fees.
Admin manual intake uses existing family/account setup; online intake starts from
an authenticated Primary Guardian account, with own-family isolation.

Account/RBAC remains shared security.ts; admissions.ts owns intake/acceptance;
planning.ts owns dates, assignment, routine/schedule and lifecycle operations;
report-templates.ts owns immutable prompt versions/bindings. Academic transitions
remain academic.ts. No automatic DDL or scheduled routine generator.

Migration 005 must be applied explicitly after backup/restore verification before
new runtime deployment. Existing 001–004 files and data are retained. Application
rollback retains additive schema; do not delete historical rows. Feature PR and
actual tests/browser/CI evidence are required. A separate merge/deploy approval
must respect the current repository/reviewer rules; PR #9's specific approval is
not represented as approval of a future PR.

Lifecycle status is operational; it is not an approved leave interval. Monthly
historical totals retain enrollment effective dates and verified held evidence;
V1 does not apply automatic fee, absence-counter or historical attendance changes
when status changes. Transfers and pause-period eligibility need the deferred rules.

## API and integrity contract

All routes below are under /api. All writes use existing authentication/CSRF and
SQL transactions; role/scope is enforced server-side. No API mutates legacy/payment
systems. New migration 005 adds eight tables, date/session columns and routine
identity/revision columns: expected total **30 tables / 62 foreign keys**.

| Endpoint | Access / behavior |
|---|---|
| GET /admission-options | Admin or Primary Guardian, scoped family/course choices |
| GET /admissions | Admin branch or Guardian own family; Guardian response excludes internal assessment/placement notes |
| POST /admissions | Admin manual / Primary Guardian own-family; per-creator request ID, mismatch retry denied |
| POST /admissions/:id/review | Scoped admin, expected revision, review/reject; reject reason required |
| POST /admissions/:id/accept | Scoped admin, manual age/level placement, assessment outcome if applicable; one transaction creates learner/enrollment; locked retry returns same enrollment |
| GET/POST /academic-sessions | Scoped admins, date range and branch checked |
| POST /courses/:id/settings, /batches/:id/settings | Scoped admins; dates/session branch validated, existing class/history protected |
| GET/POST /batches/:id/assignments | Scoped staff read; admin write, expected teacher/Zimmadar, reason and retained history |
| GET/POST /routines | Admin or assigned Zimmadar; one row per weekly slot, Bangladesh time |
| POST /routines/:id/generate | Explicit maximum 31 calendar days; teacher/batch locks, overlap checks, immutable occurrence identity prevents regeneration after reschedule/cancel |
| POST /routines/:id/stop | Admin or assigned Zimmadar, stops future generation; existing classes retained |
| POST /classes/:id/reschedule, /cancel, /substitute | Assigned Batch Zimmadar only; unstarted class, expected start/revision, reason and before/after history |
| GET /classes/:id/schedule-history | Scoped staff only, latest 100; no Guardian internal notes |
| GET/POST /courses/:id/report-templates | Scoped admins, expected version, append-only prompt version |
| GET/POST /classes/:id/report | Existing academic routes; initial save binds template version, returned edits retain it; old reports without template remain unchanged |
| POST /enrollments/:id/status | Scoped admin, expected status/end date, reason; terminal status needs last-active date and cannot hide prior held-class evidence |
| GET /enrollments/:id/status-history | Scoped admin, retained history |

No automatic class regeneration, external notification delivery or typed report
field validation is claimed. Prompt headings are configured by authorized staff;
the existing required general report body remains. Capacity stays the approved
existing 1:1 guard; no group seat limit is invented.

## Verification record

- 31 Node unit/UI tests passed, including stale admission callbacks and escaped
  course template prompts. Existing account/report/Guardian tests retained.
- Original Python suite: 16 passed, one dependency deprecation warning.
- Isolated SQL suite and migration upgrade/repeat checks run against a fresh
  academy_test_* database. Record the final count/remote CI separately.
- Synthetic browser journey passed admission/review/accept, session/date setup,
  weekly generation, Zimmadar reschedule/cancel/substitute, substitute report and
  returned revision, assignment history, enrollment status and Guardian privacy.
  Old foundation browser journey passed. Widths 1440/768/390 had no page overflow
  or console errors; admission actions remain directly visible on phones.
- Manual encrypted snapshot 20261104_115047_85e4a4 restored 22 tables / 337 rows /
  37 FKs, authenticated/tamper checked, then upgraded only in the new local copy
  to 30 tables / 62 FKs. Original-column checksums retained, restored Admin login,
  Guardian and branch isolation passed. Keys/private snapshots stay outside Git.
- Staging migration 005, merge and deployment are pending until separately recorded.

The previously scheduled duplicate development session is paused because the user
brought this work forward. Backup remains manual; no scheduler/deletion added.
