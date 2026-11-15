# UI & Screens — Minimal Navigation Skeleton

**Goal:** easy to use, task-centered role dashboards; strong backend permission enforcement. Keep menus simple even when workflows are complex.

## Main navigation candidates (not yet finalized)
1. Dashboard / My Tasks / Alerts
2. Academy & Courses / Departments / Batches
3. Admission & Enrollment
4. Routine & Class Operations
5. Academic Progress / Exams / Homework
6. One-to-One (legacy-linked, read-only insights)
7. Students & Families / Leave / Attendance
8. Teachers & Staff / Duties / Reviews
9. Finance (display/reconciliation; payment confirmation remains legacy)
10. Support, Follow-ups & Escalations
11. Reports / Quality / Closing
12. System Settings / RBAC / Audit

## Initial role-specific screens
- Teacher: Today's Class -> Start/End -> Attendance -> Report Draft/Submit -> Pending Tasks.
- Zimmadar: Batch Overview -> Approvals -> Reschedule/Makeup -> Follow-ups -> Class Report Review.
- Guardian: Child Switcher -> Class -> Attendance/Leave -> Homework/Progress -> Support -> Fee Status.
- Central Admin: Academy Scorecard -> Critical Alerts -> Department Performance -> Financial Summary -> Release Governance.

## Mandatory screen spec [TBD for each]
`screen_id`, source `D-ID`, role/scope, form fields (R/O), validations, buttons, displayed states, empty/loading/errors, mobile behavior, notifications, accessibility, tests.

## Example report screen
`SCR-CLASS-REPORT`: D-032..035, D-043..044; Course-Specific Form; Draft/Submit buttons; Zimmadar Approve/Return with reason; Bangladesh-time deadline; approval/revision history; Guardian can view only permitted published fields.

## No UI-driven authorization
Buttons may be hidden for clarity, but every server endpoint must enforce role/scope/state permissions.

## Report design v1.5 — DRAFT
Functional Teacher report form,Zimmadar review/return and separate overdue/review lists: `design/report_workflow/README.md`. No implementation or new unresolved policy approval implied.
