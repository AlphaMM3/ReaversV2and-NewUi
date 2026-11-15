# SCHEMA — Proposed Logical Data Model (NO migration authorization)

**Status: SKELETON.** No actual database tables have been created/inspected. Names and fields are proposals subject to independent review.

| Module | Candidate entities | Non-negotiable relationships |
|---|---|---|
| Organization | Branch, Department, Program, Course, Batch | Scoped branch/department ownership |
| Identity | User, Role, RoleAssignment, ScopeGrant | Multiple roles, role switcher, staff branch constraints D-187..191 |
| Guardian | Family, Guardian, FamilyMembership, GuardianPreference | Multiple children; primary/secondary roles D-010, D-060..066 |
| Academic | Student, Enrollment, Transfer, Assessment, Result | Multiple course enrollments D-148, transfers D-157 |
| Classes | Routine, ClassSession, TeacherAssignment, AttendanceEntry | Actual held sessions; precise timestamps; late boundary D-055 |
| Reports | ClassReport, ReportRevision, Homework, FollowupNote | Course form, Zimmadar approval, history D-032..044 |
| Leave & follow-up | LeaveRequest, LeaveExtension, AttendanceWarning, FollowupCase, ActionPlan, Blocker | Multi-state escalation D-067..131 |
| Finance | FeePlan, Invoice, InvoiceLine, PaymentMirror, TeacherPayable, Expense | Payment confirmation remains legacy source D-015, D-141 |
| Legacy mapping | LegacyIdentityMap, SyncCursor, SyncRun, ExternalReference | Read-only 1:1 and payment portal adapters |
| Governance | AuditLog, ChangeRequest, DecisionTrace, EventOutbox, NotificationJob | Immutable evidence + retries + versioned decisions |

## Source-of-truth rules
- `Academy DB`: regular group/fixed short-course academic and staff records, local enrollment, academic grades, guardian family linkage.
- `Legacy 1:1`: original 1:1 sessions, contract and hours; **read-only source** for new platform.
- `Legacy payment portal`: authoritative payment collection/confirmation. No confirmation writes from academy.
- Cross-system mapping uses immutable external IDs with `(source_system, external_id)` uniqueness. Reconcile rather than create duplicated master data.

## Required technical safeguards [before build]
Primary/foreign keys; branch and record access checks; idempotency unique constraints; UTC timestamps with timezone rules; atomic transactions; audited revisions; point-in-time or tested backup recovery; versioned reversible migration strategy; indexing and data retention policy.

## Data dictionary [TBD]
For each entity: column, type, required, validation, index, unique key, FK, sensitivity, owner, retention, events, decision IDs, tests.

## Attendance design v1.4
Candidate attendance aggregates/fields/constraints/events: `design/attendance_followup/DATA_AND_EVENTS.md`. No physical schema or migration created.

## Report design v1.5 — DRAFT
Logical report revision/deadline/compliance/outbox fields: `design/report_workflow/README.md`. No implementation or new unresolved policy approval implied.
