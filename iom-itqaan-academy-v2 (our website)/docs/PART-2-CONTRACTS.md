# Part 2.1–2.5 implementation contract

Candidate recorded 2026-11-04. This is a local feature-branch implementation,
not evidence of a pushed PR, CI result, deployed migration or production readiness.
Original decisions remain unchanged. Read this overlay alongside Part 1 and Vault.

## Architecture and ownership (2.1)

One Express process, one MySQL database, plain JavaScript frontend. No new service,
queue, generic permission engine or frontend framework.

| Owner                  | Contract                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| app.ts                 | HTTP, public authentication, authenticated middleware, CSRF, request IDs, error boundary |
| security.ts            | Password/session primitives, effective role, branch/department/batch authorization       |
| accounts.ts            | Account lifecycle, role assignments, manual reset capability, durable login throttle     |
| catalog.ts             | Organization, people, course/batch/enrollment read and setup                             |
| academic.ts            | Class, attendance and report state transitions and history                               |
| progress.ts            | Separate learner-specific publication to Guardians; internal reports stay private        |
| monitor.ts             | Scoped summaries, monthly views and internal alert events                                |
| operations.ts          | Central audit pagination/detail, scoped CSV export, expired authentication cleanup       |
| policy.ts              | Approved pure date/attendance/deadline rules; no storage or HTTP                         |
| db.ts                  | Configuration, prepared queries, transactions and audit append                           |
| migrations.ts / cli.ts | Explicit setup/upgrade/recovery/maintenance; no startup DDL                              |
| frontend/              | Maintained UI; imported public/ stays immutable                                          |

Storage functions use one transaction connection for related writes. Academic
modules depend on common authorization and policy, never on frontend visibility.
Account roles do not create enrollments, change payment status or link legacy data.

API remains `/api/<plural-resource>` and explicit POST action subpaths. Zod rejects
invalid input; errors use `{detail: string}`. 400 = invalid input, 401 = no active
session, 403 = forbidden role/scope/CSRF, 404 = unavailable object, 409 = stale or
invalid transition, 429 = login throttle, 500 = opaque internal failure. Every
response has X-Request-ID; unexpected logs contain request ID/path/method/code,
not submitted passwords, tokens or request bodies. Hidden objects can still differ
between 403/404; no claim of universal resource-existence concealment.

Persist explicit ISO offsets: existing academic evidence uses +06:00; authentication
and operational timestamps use UTC. Compare parsed instants and display Bangladesh
time via existing UI formatters. Do not compare mixed-offset strings as instants.
Date-only enrollment/month fields remain calendar
dates, not UTC-midnight conversions. Existing approved Asia/Dhaka deadline helpers
and exact 15-minute attendance boundary remain authoritative. Never parse a
browser-local timestamp without the existing explicit offset conversion.

Decision mapping: D-187/188 management and Central role administration;
D-189/190 same-login multiple duties with explicit session role switch;
D-191 branch/department boundaries. Existing branch-wide primary staff identities
are retained; newly granted department scopes restrict the selected assignment.
Supervisor receives scoped academic read access only: future Supervisor review,
staff-exit, Finance and Department Admin workflows are not silently granted.
The later explicit Guardian publication decision remains implemented by progress.ts.

## Authorization matrix (2.2)

Effective role is one primary role OR one active assignment per session, never the
union of all privileges. Central alone grants/revokes additional staff assignments.
Role switch rotates CSRF; revocation deletes sessions bound to that assignment.
Guardians cannot be converted into staff through the assignment endpoint.

| Action                                          | Central                   | Branch Admin                     | Teacher                              | Zimmadar                      | Dept Supervisor   | Guardians                       |
| ----------------------------------------------- | ------------------------- | -------------------------------- | ------------------------------------ | ----------------------------- | ----------------- | ------------------------------- |
| Academic read                                   | All                       | Own branch                       | Assigned batch, optional dept        | Assigned batch, optional dept | Own branch + dept | Linked children's allowed views |
| Organization/people create                      | Yes                       | Own branch, existing constraints | No                                   | No                            | No                | No                              |
| Start/end class, attendance, report edit/submit | Existing Central override; report author rule applies | No implicit Teacher duty | Own assigned class and allowed state | No | No | No |
| Held verification/report review                 | No implicit Zimmadar duty | No implicit Zimmadar duty        | No                                   | Own assigned batch/state      | No                | No                              |
| Publish learner summary                         | No implicit Zimmadar duty | No implicit Zimmadar duty        | No                                   | Own enrollment/batch          | No                | No                              |
| Activate/deactivate / issue reset               | Non-self eligible account | Own branch, no privileged target | No                                   | No                            | No                | No                              |
| Grant/revoke roles                              | Yes                       | No                               | No                                   | No                            | No                | No                              |
| Export students                                 | All                       | Own branch                       | No                                   | No                            | No                | No                              |
| Audit list/detail                               | Yes                       | No                               | No                                   | No                            | No                | No                              |
| Change own password / revoke own sessions       | Yes                       | Yes                              | Yes                                  | Yes                           | Yes               | Yes                             |

Read/create/edit/review/approve/export are independently guarded routes, not a
generic permission editor. Broader department/finance permissions remain pending
their actual modules. Learner scope follows enrollment -> batch -> course ->
department/branch plus existing teacher/Zimmadar assignment or Guardian-family link.
Additional general staff scopes cannot cross their primary branch or approved
department; Central identities may hold broader assignments. Staff reassignment
on deactivation remains manual: history and existing duty references are retained.

## Account lifecycle (2.3)

- Creation remains active account + securely delivered initial password; there is
  no email invitation or public signup. Admin UI can deactivate/reactivate with
  an expected_active concurrency token. Self-deactivation and loss of the last
  active primary Central Admin are rejected.
- Password change requires current password and 12–256-character new password.
  Password change/reset deactivates all sessions and outstanding reset capabilities.
- Admin-issued random, 30-minute one-use reset link: SHA-256 token stored in SQL,
  raw token shown once to the issuing admin, passed in URL fragment, manually
  delivered through a trusted private channel. It is never stored in audit details.
  A replacement link invalidates previous unused links. No SMTP or public
  email-based recovery is claimed. Protected `recover-admin` CLI is emergency
  hosting-owner recovery only; never put password in arguments or logs.
- Existing hashed, expiring, HttpOnly/Secure/SameSite sessions remain. Deactivated
  accounts and revoked assignments cannot authenticate new requests. Already
  authorized in-flight work is not claimed to be instantly cancelled.
- Durable per-normalized-account login attempt window plus process IP/account
  limiter; 30 attempts / 15 minutes, successful authentication clears the bucket.
  Reverse-proxy header trust was not expanded. Distributed edge/WAF protection
  and bot challenges are outside this candidate.
- Expired sessions/reset tokens/throttles are cleaned in bounded 1000-row batches
  by maintenance, also invoked by existing alerts CLI. This is unrelated to backup.
- **MFA deferred**: user delegated scope choice; this release adds no partial MFA.
  Central Admin TOTP/WebAuthn with recovery/lockout handling is future work. No
  MFA claim or MFA-required production security sign-off.

## Data integrity and audit (2.4)

Migration 004 adds users.department_id, user_role_assignments,
session_role_bindings, password_reset_tokens and login_throttles. Existing users,
academic rows and imported source remain retained. 22 tables / 37 FKs expected
after 001–004. Added indexes cover batch/enrollment status, class date/status,
report update, audit date/id and session expiry. Schema does not replace all
application-level cross-branch checks.

User locks serialize password/reset/status/role lifecycle; unique role scope prevents
duplicate assignments. Existing report revision tokens, locked state transitions,
attendance uniqueness, publication request IDs and enrollment guards remain.
No global idempotency-key promise for every create endpoint.

Audit appends account/role/export events with IDs and safe metadata. Existing report
revision history remains separate. Central audit list uses bounded 1–100 keyset
pagination; details load only on explicit Central access. Student CSV neutralizes
spreadsheet formulas and is admin-scoped. It currently buffers the selected rows;
not every catalogue/monitor query is paginated or optimized for large institutions.

## Delivery and recovery (2.5)

1. Run locked dependency installation, TypeScript/unit/UI tests, preserved baseline
   checks, original Python tests, dual-engine SQL CI and repeat/upgrade tests.
   Browser-check synthetic accounts, password/reset/status/switch/revoke and mobile
   rendering. Tests only target a new `academy_test_*` database.
2. Review candidate feature PR against staging. Keep main/import evidence unchanged.
3. Manually take encrypted staging backup, authenticate/hash-check it, test tamper
   rejection and restore in a new local database. Keep recovery key outside repo,
   web root and snapshot folder. Never print/copy credentials into release notes.
4. Upgrade a restored old snapshot to 004 and verify retained pre-upgrade rows.
   MySQL DDL auto-commits; partial failure retains evidence for manual review.
5. Apply ONLY reviewed 004 to the exact authorized staging DB before deploying new
   runtime (new session lookup requires its tables). No bootstrap or legacy access.
   Old runtime tolerates additive schema; do not add new Supervisor data before
   successful new-runtime deployment.
6. Merge the reviewed feature PR into staging; GitHub auto-deploys Hostinger.
   Record exact commit/build and verify source read-back, HTTPS, health/ready and
   scoped checks before calling it deployed. Never infer deploy from a Git push.
7. Manual post-release encrypted backup/restore; preserve pre-release snapshot.

Rollback: redeploy last verified application commit first, keep additive schema
and all business/audit data. If old runtime cannot interpret newly created roles,
restrict those accounts until forward repair; never DELETE roles/data to make a
rollback appear clean. Full DB restore requires a separately reviewed outage/data
loss plan and is not automatic application rollback.

**Backup choice: manual only**, explicitly selected by user on 2026-11-04. No new
Windows task, daily download, retention deletion or external copy is enabled.
Existing private helper: workspace `academy-staging-preflight/backup-staging.py
--verify-restore`; keys/access files stay outside this repository. Review snapshots
older than 30 days manually; keep last known good, pre-upgrade and off-device copy
before any separately authorized deletion. PC-local copy alone is not disaster
recovery. Daily automated backups are PLANNED, not implemented.

Environment stays in protected hosting configuration with setup disabled normally;
Git receives placeholders only. `/health` is liveness, `/ready` verifies DB access,
not full migration drift or all business workflows. Hosting runtime logs and request
IDs support manual diagnosis. No new uptime monitor, paging service or guaranteed
alert delivery is claimed. Remaining critical audit findings require concrete
reproduction and verification; this candidate is not an independent security audit.

## Acceptance evidence and remaining boundaries

Local unit/UI suite: 29 passed (HTTP needs loopback permission).
SQL/HTTP suite: 33 passed on isolated MariaDB 11.4.5; original Python 16 passed;
preserved baseline 87 hashes passed. Old foundation browser journey passed after
004. Account browser journey passed status, reset, password change, sign-out,
scoped Supervisor role switch/revoke and Central audit detail with no console
errors; 1440/768/390px had no horizontal overflow. Same-tab reset navigation was
corrected. Role elevation invalidates older reset links; Branch Admin cannot reset
or disable identities carrying privileged additional roles. SQL regression covers
both restrictions. Pre-upgrade encrypted snapshot `20261104_012735_9f4369`
authenticated and restored, then upgraded locally without overwriting staging.
Remote MySQL CI/deploy must be recorded separately when completed.

Pending: MFA, emailed invites/recovery, bulk migration, custom permission editor,
broader department/finance workflows, every-list pagination, streaming export,
automated backups/off-device verification, independent security review and
department UAT. No invented package/minute/payment/cancellation/refund policy.
