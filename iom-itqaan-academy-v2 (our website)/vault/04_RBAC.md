# RBAC — Permission & Scope Skeleton

**Status:** Decision-grounded baseline; full action matrix PENDING. Never authorize based on hidden UI buttons alone.

## Core roles (exact permissions from source or amendments)
- **Central Management/Admin:** Academy standards and oversight; final launch approval D-201; central roles D-187..191.
- **Country/Branch/Department Staff:** scoped authority and approved local flexibility D-004, D-142, D-163, D-187..191.
- **Batch Zimmadar:** approve/return class report D-033/D-044; reschedule/cancel D-048; schedule approved makeup D-051; attendance older-than-7-day correction approval D-080.
- **Department Supervisor:** makeup necessity approval D-050; leave extension final approval D-075; escalations D-112..131.
- **Teacher:** own sessions, attendance, reports, authorized corrections; 1:1 substitute rules D-038, D-058/D-080.
- **Primary Guardian:** manages secondary guardians without admin approval D-064..066; only linked children D-059.
- **Secondary Guardian:** academic view, teacher communication, student absence notice, homework; no guardian or main family administration D-066.
- **Finance:** financial reports and authorized reconciliation; payment collection/confirmation lives in separate existing portal D-015/D-141.
- **1:1 Guardian:** separate legacy login D-169; do not unify by assumption.

## Access decision function
`authorize(actor, permission, branch_id, department_id, record_id, current_state, policy_version)`
Must check active role assignment, scope, record ownership, state and time window. Refuse otherwise; audit permitted sensitive changes.

## Record-specific edits
| Record | Source | Baseline |
|---|---|---|
| Class timer | D-041 | Zimmadar approval for manual correction; audit required |
| Attendance within 7 days | D-058/D-080 | Teacher may correct own class; audit |
| Attendance after 7 days | D-080 | Zimmadar approval |
| Class report submitted | D-033/D-044 | Zimmadar may return with reason; teacher revises and resubmits; revision history |
| Follow-up notes | D-091/D-092 | Teacher edit <=24h; later Zimmadar approval, version history |
| Financial confirmation | D-015 | Existing secure payment portal, NOT new Academy write |

## Authorization test matrix [TBD]
Action × Role × Branch × Department × Record ownership × State × Time = allow/deny. Require explicit evidence for each rule before implementation.

## Attendance design v1.4
Action/actor/scope/time/deny matrix: `design/attendance_followup/PERMISSIONS.md`. Pending privileges are not grants.

## Report design v1.5 — DRAFT
Report actor/scope/state authority matrix: `design/report_workflow/README.md`. No implementation or new unresolved policy approval implied.

## AM-19 — unified Guardian target (v1.7.1,2026-10-31)
New Academy Guardian access uses one login/dashboard across linked children and Batch/1:1 classes/progress. This explicitly supersedes D-169 separate1:1 Guardian login and corresponding AM-05/10/18 preservation language for the NEW target system only. Preserve own-child access,Primary/Secondary distinct identities/permissions,D-090 note privacy and all unrelated approvals. No automatic legacy credential merge,shared password,production migration or SSO implementation approved. OTO-06 target-login choice RESOLVED;technical authentication,migration and account-linking design remain pending. Earlier separate-login statements in this document are historical and superseded only for the new target system.
