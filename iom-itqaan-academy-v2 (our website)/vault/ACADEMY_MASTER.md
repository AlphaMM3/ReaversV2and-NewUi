# ACADEMY_MASTER — Single Router & Project Control Hub

> **READ FIRST** · Version 1.7.1 · 2026-10-31 · Status: PLANNING / ARCHITECTURE NOT FROZEN

## 1. Mission
Build an international online Islamic academy operations platform that is easy for staff/guardians, maintainable for independent engineers, secure for children/families, and auditable back to each original decision.

## 2. Provenance & authority hierarchy
1. User-provided exact source: `references/IOM-School-Maktab-Reference-v1.0.md` — D-001..D-201 (SOURCE_CONFIRMED). Original 12 enhancements remain UNAPPROVED.
2. Explicit later decisions: `DECISION_AMENDMENTS.md` (date, affected Decision IDs, scope, user confirmation evidence in conversation).
3. Open unresolved questions: `OPEN_QUESTIONS.md` — NEVER silently decide.
4. Draft models: `02_PRD.md`, `03_WORKFLOW_MATRIX.md`, etc. — proposals, not approval evidence.
5. Existing code/database and deployed system are implementation evidence **only after inspection**; do not assume their current behaviour matches policy.

**If policies disagree:** do not auto-overwrite. Record a conflict in `registries/RISK_CONFLICT_REGISTER.csv`, stop affected implementation, request authorized resolution and append a decision amendment. Preserve both original and new evidence.

## 3. Scope
- Public course website + admissions; responsive PWA; Bengali and English UI (D-143..145).
- Group batches; fixed-duration single courses; 1:1 (native redesign authorized AM-18;legacy retained as migration/reference evidence), academic/guardian/finance/staff/workflows.
- Central governance, branch/department-scoped operations (D-004, D-021..023, D-142, D-163).
- Existing secure payment portal remains the payment collection and confirmation authority (D-015; D-141, D-171).
- AM-18 authorizes native1:1 redesign within main Academy;read-only integration is no longer the sole future architecture. Actual legacy migration/live writes/deployment remain separately scoped authorized actions;the payment portal boundary remains unchanged.

## 4. Locked clarifications known from user
- D-019/D-056: **7 consecutive actually held, unauthorized missed classes**, not calendar days. Begin counting at first qualifying missed class; canceled/unheld class does not count. Approved-leave treatment must retain D-072..073.
- D-057: after first follow-up, **another 7 consecutive unauthorized missed held classes** trigger second escalation; do not replace with 7 calendar days. The second count starts after first follow-up completion (Q1 / AM-06); other crossing/leave details remain in open questions.
- D-025: fixed-duration, batch-based single/short courses have their own dedicated department/section; delivery mode and course duration are separate dimensions.
- D-034..035: Bangladesh timezone; ordinary same-day report cutoff at 23:59; for class ending at/after 23:00, report due next day at 12:00 Bangladesh time; progressive overdue escalation completed by 18:00. For after-midnight class ends, noon means the same Bangladesh date as the actual end (Q2 / AM-07). Approved noon-deadline escalation: 12:05 Teacher, 14:00 Zimmadar, 16:00 Supervisor, 18:00 Management (Q3 / AM-08).
- D-167..175: historical as-is/read-only-only target is superseded by AM-18 native redesign direction. AM-19 now supersedes separate1:1 Guardian login for the new system:one Academy Guardian login/dashboard;payment collection stays external.

- Q4 / AM-09: attendance and absence counts are per enrollment.
- Q5 / AM-10:historical transition link direction;AM-19 now approves unified Guardian target. Existing credential/session migration remains a technical design question.
- Q6 / AM-11: permission to inspect safe code/schema copies read-only; not evidence of audit completion.

## 5. Document router (one owner per concern)
| File | Sole responsibility | Current status |
|---|---|---|
| `01_DECISIONS.md` | Decision index, amendments, source precedence | STARTER |
| `02_PRD.md` | Business purpose, exact scope, acceptance | DRAFT |
| `03_WORKFLOW_MATRIX.md` | Operational triggers, actions and dependencies | 201 decision links drafted; detailed flows PENDING |
| `04_RBAC.md` | Roles, scopes, approval, record-specific edits | Attendance detail DRAFT;other domains skeleton |
| `05_STATE.md` | State transitions, guard conditions and timers | Attendance detail DRAFT;unresolved guards explicit |
| `06_SCHEMA.md` | Logical entities, constraints and source of truth | SKELETON |
| `07_INTEGRATION.md` | Read-only legacy adapters, payment integration | Supplied-copy static evidence reviewed;current/full integration pending |
| `08_STACK.md` | Selected versions, deployment requirements | UNSELECTED |
| `09_PLAN.md` | Milestones, dependencies and quality gates | DRAFT |
| `10_TESTING_QA.md` | Decision-linked tests and review evidence | SKELETON |
| `11_UI_SCREENS.md` | Minimal role-based UI/form design | SKELETON |
| `12_TOKENS.md` | Design tokens and components | OPTIONAL SKELETON |

## 6. Non-negotiable engineering process
- No code/deploy action while requirements/architecture approval is missing; planning only unless explicitly authorized.
- Do not edit canonical `references/` files. Record a separate amendment instead.
- No undocumented business rule, hidden permission, direct production DB mutation or destructive migration.
- Before a change: read linked Decision IDs + RBAC + Workflow + State + Schema + tests, then write impact analysis.
- Implement small focused changes with tests, migrations, git diff, peer review and rollback notes.
- Every critical event is idempotent; preserve audit log and source of truth.
- Human security/architecture reviews and department UAT precede final central-management launch approval D-180/D-201.

## 7. Current next action
Six selected answers are recorded in `OPEN_QUESTIONS.md`; all other questions retain their existing pending scope. 201/201 first-pass draft mapping is in `MAPPING_README.md` and `registries/201_DECISION_TRACEABILITY.csv`. Review `MAPPING_REVIEW_GAPS.md`; detailed record-specific RBAC/state/schema/API design, current legacy integration verification and independent design approval remain pending. No implementation or gate completion is implied.

## Draft mapping router (v1.3)
`MAPPING_README.md` -> `catalogs/WORKFLOW_MAPPING.md` -> `catalogs/SCREEN_ENTITY_INDEX.md` -> `registries/201_ACCEPTANCE_SCENARIOS.csv`; impact matrix: `registries/201_IMPACT_MAPPING.csv`. All new mappings are proposals. Source/amendments remain authoritative.

## Attendance design router (v1.4)
`design/attendance_followup/README.md` -> state/counters,RBAC,timers,data/events,workflow and acceptance scenarios. `POLICY_RECONCILIATION.md` records historical approvals recovered from exact user replies;AM-12..15 restore those details,AM-16 records current correction choice. Unresolved boundaries remain in `design/attendance_followup/QUESTIONS_AND_GATES.md`. Design not frozen;no gate or implementation advanced.

## Resolved cutoff example — AM-16-C1 (v1.4.1)
Class local date +7 calendar days at23:59 Asia/Dhaka;31 October2026 class ->7 November2026 at23:59. Count starts the day after class;not elapsed168h. After cutoff Zimmadar approval required. Exact endpoint second precision remains AFQ-07. AFQ-01B is RESOLVED;supersedes earlier pending-example wording in this document only. Other pending questions remain unchanged.

## Report design router v1.5
`design/report_workflow/README.md` -> workflow/states/deadlines,RBAC/screens,logical data/events,acceptance scenarios and pending questions. AM-17 separates initial submission from review. No new review SLA,ordinary reminder schedule or returned-revision deadline inferred. Existing gates remain unchanged.

## 1:1 evidence gap router v1.6
`design/legacy_1to1/README.md` ->20-gap register,input manifest,observed field mapping and safe next-input checklist. This is bounded static evidence review only. Current Guardian/auth/schema/interface verification remains pending;no policy approval or gate completion inferred.

## Native1:1 planning router v1.7
`design/integrated_1to1/PLAN.md` -> architecture/policies/migration and `EXECUTION_PLAN.csv`;`DECISION_IMPACT.md` details limited supersession. Latest AM-18 prevails over historical as-is instructions. This is a concrete reviewable execution plan,not full policy freeze or live implementation.

## AM-19 — unified Guardian target (v1.7.1,2026-10-31)
New Academy Guardian access uses one login/dashboard across linked children and Batch/1:1 classes/progress. This explicitly supersedes D-169 separate1:1 Guardian login and corresponding AM-05/10/18 preservation language for the NEW target system only. Preserve own-child access,Primary/Secondary distinct identities/permissions,D-090 note privacy and all unrelated approvals. No automatic legacy credential merge,shared password,production migration or SSO implementation approved. OTO-06 target-login choice RESOLVED;technical authentication,migration and account-linking design remain pending. Earlier separate-login statements in this document are historical and superseded only for the new target system.
