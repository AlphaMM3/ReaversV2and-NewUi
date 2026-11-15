# Change impact and release gates

Authorization: user requested execution of Step 2 (2026-10-31), selected `AlphaMM3/Online-Academy-Managment-` after account verification, authorized feature branch/PR and Hostinger-compatible staging preparation. This does not authorize replacing any hosted site or importing customer data.

| Concern | Change / boundary |
| --- | --- |
| Decisions | D-001..201 source, AM-01..19 and pending questions retained byte-for-byte in Vault; draft mappings stay draft |
| Workflow | v0.2 login, catalog, group/native 1:1 enrollment, class start/end, held verification, attendance, report draft/submit/return/review, monitor and monthly summary ported |
| RBAC | Central/branch admins, assigned teacher/Zimmadar and linked-family Guardians checked server-side. Internal reports remain private; learner-specific Guardian publications follow the explicit 2026-11-01 contract in GUARDIAN-PROGRESS.md (D-090, AM-19). |
| State | Explicit report/class transitions, original submission timestamp preserved, no silent submitted/approved overwrite; post-cutoff correction refuses pending approval workflow (AM-16-C1) |
| Schema | New versioned additive InnoDB schema; foreign keys, unique attendance/report/outbox keys; setup refuses unrecognized populated databases |
| Transactions | Row locks serialize class transitions, report submission/review, 1:1 slot claims and alert/submission race; no automatic schema mutation on server start |
| Security | PBKDF2-SHA256 400k preserved; random opaque session tokens stored hashed; CSRF; HTTPS cookie default; failed-login limiter; bounded JSON/input validation; errors omit SQL/secret values |
| API / UI | Existing routes/response keys retained; original UI assets unchanged and hash-checked. `/ready` added; no redesigned forms or product-policy additions |
| Events | AM-08 noon stages retained; unique durable internal event records, supervisor unassigned; cron replaces prototype background loop; no external delivery claim |
| Reports | D-034 / AM-04/07 first submission deadline independent from review; D-084 / AM-09 attendance per enrollment and missing attendance separate from absence |
| Legacy / payments | D-015 payment collection/verification external. AM-18/19 new native target accepted; legacy app, data, sessions and credentials untouched |
| Tests | Original Python suite retained, TypeScript boundary tests and real SQL/HTTP parity scenarios; MySQL 8 and MariaDB CI prepared |

## Remaining inherited gaps

See `baseline/python-v0.2/docs/KNOWN_GAPS.md` and `vault/OPEN_QUESTIONS.md`. These remain open: approved leave and first/second seven-held-class follow-up engine; precise attendance/held evidence and correction endpoint policy; secondary Guardian management and account linking; ordinary report reminder/revision SLA/catch-up policy; guardian publication; commercial packages/minutes/payments; recovery/MFA, audit tamper resistance, privacy/retention and multi-instance rate limiting. The current login limiter is process-local and uses the direct peer address; validate reverse proxy behavior and a shared limiter before broader exposure.

This port preserves the prototype's conservative 1:1 slot allocation rule; it does not implement commercial scheduling/overlap policy. Teacher reassignment and substitute-teacher behavior retains prototype scope limitations. All SQL reads remain parameterized; dynamic identifiers come from fixed internal allowlists.

## Completion gates

Feature branch and draft PR are for review. Do not self-approve/merge. Browser UAT, independent security/architecture review, backup/restore, staging target setup and live deployment are separate pending work. Department/branch testing and Central Management approval D-180/D-201 precede production. Application rollback is a code revert, never a destructive DB reset.
