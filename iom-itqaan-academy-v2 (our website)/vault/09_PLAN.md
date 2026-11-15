# PLAN — Sequential Delivery & Gate Registry

**A plan is not build authorization.** D-132 first-version scope is broader than first implementation sprint; do not silently defer approved mandatory features out of first release.

| Gate | Work product | Exit evidence | Current status |
|---|---|---|---|
| G0 | 201 decision reconciliation + approved amendments | 201-row traceability with source refs and resolved critical conflicts | STARTER, incomplete |
| G1 | Functional boundaries + RBAC + workflows | Approved scope, all critical rules and correct states | PENDING |
| G2 | Architecture (ERD, API, integration, stack) | Independent architecture/security review | PENDING |
| G3 | UX wireframes and forms | Guardian/Teacher/Zimmadar/Finance UAT feedback | PENDING |
| G4 | Controlled implementation | Small PRs, tests, human reviews, reversible migrations | NOT STARTED |
| G5 | Data migration + sandbox integrations | Dry run, row counts, source-of-truth reconciliation | NOT STARTED |
| G6 | Department/branch UAT + parallel operation | User guides/training; defect closure; rollback plan | NOT STARTED |
| G7 | Final central live-launch authorization | D-201 approval record, release checklist | NOT STARTED |

## For every sprint/change
1. Approved D-IDs and amendment refs.
2. Screens/actions and data owners.
3. Explicit state transitions/permissions and negative cases.
4. Implementation, tests, PR review, security checks.
5. Sign-off evidence and release note.

## Release invariants
No unresolved critical privacy/authorization defects, no source-of-truth ambiguity, no unsupported legacy write action, no untested recovery or missing D-201 launch approval.

## AM-18 native1:1 direction overlay (v1.7)
Historical as-is/read-only-only future target is superseded for1:1 redesign. See `design/integrated_1to1/PLAN.md`. Reference/legacy access remains controlled;payment portal stays external;stack is still UNSELECTED and gate statuses are not advanced. No live migration/deployment authorized by this planning deliverable.
