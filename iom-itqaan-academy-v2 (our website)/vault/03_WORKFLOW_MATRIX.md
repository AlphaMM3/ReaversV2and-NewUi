# Workflow Matrix — Draft Skeleton

**IMPORTANT:** Previous 18 main / 60 sub-workflow breakdown is **incomplete**, not a scope ceiling. Source Decisions 61–131 and 132–201 require additional functions.

## Preliminary 18 process groups (not yet final mapping)
| WF | Process |
|---|---|
| WF-01 | Admission application |
| WF-02 | Assessment and placement |
| WF-03 | Enrollment and batch assignment |
| WF-04 | Routine publishing |
| WF-05 | Teacher leave and substitute |
| WF-06 | Session start/end |
| WF-07 | Attendance |
| WF-08 | Class reports and homework |
| WF-09 | Reschedule and makeup |
| WF-10 | Academic assessment |
| WF-11 | Student absence and follow-up (requires major expansion) |
| WF-12 | Monthly 1:1 contract hours (read-only legacy integration) |
| WF-13 | Tuition invoices |
| WF-14 | Payment data reconciliation with legacy portal (NOT payment confirmation duplication) |
| WF-15 | Guardian support |
| WF-16 | Teacher/staff performance (requires expansion) |
| WF-17 | Record-type-specific correction and audit |
| WF-18 | Monthly closing and governance |

## Required additional workflow families (not all represented by 60)
- Guardian primary/secondary roles, per-child notification preference, Telegram linking (D-060..066)
- Student leave, 14-day limit, extension, leave return (D-067..078)
- Attendance corrections, formula, minimum class sample, low attendance warnings, follow-up notes (D-079..096)
- Follow-up reopen/reassign and detailed escalation/action plan/blocker engines (D-097..131)
- Import, waiting list, transfers, certificates, library, messaging, teacher compensation, expenses (D-132..166)
- Legacy 1:1 identity integration and separate guardian login (D-167..175)
- Staff lifecycle/role switcher/quarterly reviews, migration and release gates (D-176..201)

## Workflow specification template (copy per approved subflow)
| Field | Value |
|---|---|
| Workflow ID | WF-XX.yy (allocate only after unique check) |
| Source D-ID | D-### + approved amendment ID if applicable |
| Trigger | [TBD] |
| Precondition | [TBD] |
| Responsible Actor | [TBD] |
| Branch/Department/Record Scope | [TBD] |
| UI screen/action | [TBD] |
| Input / Required fields | [TBD] |
| Legal state transitions | [TBD] |
| Database write/read | [TBD] |
| Emitted event / consumer | [TBD] |
| Notification / exceptions | [TBD] |
| Deadline / SLA | [TBD] |
| Duplicate prevention / idempotence | [TBD] |
| Audit evidence | [TBD] |
| Acceptance test IDs | [TBD] |
| Status | DRAFT |

## Cross-cutting rule: unauthorized absence
- First alarm after 7 **consecutive held**, missed, unauthorized sessions.
- After first follow-up, another 7 consecutive held unauthorized misses lead to D-057 escalation (approved clarification).
- Approved leave suspends follow-up and resets after leave D-072–073; protect the original Attendance status and monthly attendance rules D-084..096.
- Never use calendar-date difference as a substitute for held class counts.

## v1.3 decision mapping extension
`catalogs/WORKFLOW_MAPPING.md` retains WF-01..18 and proposes additional WF-19..37 families with201 decision leaf references. This supersedes the earlier incomplete linkage count only;it does not approve detailed flows. `MAPPING_REVIEW_GAPS.md` identifies stale skeleton rules;approved amendments control.

## Attendance design v1.4
Attendance/leave/correction/case/plan/blocker flows: `design/attendance_followup/SCREENS_AND_WORKFLOWS.md`. Full state and timer details in linked design;not approved implementation.

## Report design v1.5 — DRAFT
Report End/Draft/Submit/Approve/Return/Resubmit lifecycle and noon escalation: `design/report_workflow/README.md`. No implementation or new unresolved policy approval implied.
