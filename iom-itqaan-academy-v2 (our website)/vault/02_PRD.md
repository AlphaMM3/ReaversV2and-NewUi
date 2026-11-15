# Product Requirements Document — Skeleton

**Status: DRAFT, not signed off.**

## Problem / vision
Minimal and mobile-first international online academy with centralized oversight and delegated academic operations; trace each requested capability to original D-IDs.

## Confirmed first-version requirements (reference, not exhaustive)
- Public website and admission; guardian + staff access; no separate student login in v1: D-132..145.
- Batch + 1:1 and fixed + continuous courses: D-002..003, D-024..025, D-167..175.
- Attendance, teacher reports, assessments, progress, homework, department and finance reporting: D-132..141.
- Staff multiple roles, scoped delegated admin, central approvals: D-187..201.

## User personas
Central Admin; Branch/Country Admin; Department Supervisor; Batch Zimmadar; Teacher/Substitute; Guardian Primary/Secondary; Finance; Support; Academic Assessor. **Exact permissions: `04_RBAC.md` pending.**

## Product sections
1. Group / regular batches
2. Fixed-duration single course department (batch/group delivery)
3. Read-only integrated 1:1 area (legacy application retained)
4. Cross-cutting admissions, academic, guardian, finance, staff, quality, reporting

## Scope / non-scope
**Scope** = only approved D-IDs and accepted amendments. 12 original proposals remain unapproved. No new payment gateway. No modification to legacy manager. Do not infer a unified 1:1 guardian login.

## Success measures [PENDING]
Academic correctness; zero privilege cross-over in tests; report and guardian tasks; class and fee reconciliation; page usability; restored backups; independent audit sign-off. Set targets after product/management approval.

## Acceptance criteria [TBD]
Create an explicit link to `registries/201_DECISION_TRACEABILITY.csv` for every feature; no unlinked requirements accepted into the release plan.
