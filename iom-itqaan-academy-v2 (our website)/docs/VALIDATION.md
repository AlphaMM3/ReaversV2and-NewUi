# Validation evidence — 2026-10-31

Later technical review results supersede the initial test totals below: **9 unit, 17 SQL/HTTP, 16 original Python tests**, plus a retained-data upgrade regression. See [review evidence and remaining gates](REVIEW_2026-10-31.md). The initial evidence below remains historical.

## Completed locally

| Check | Observed result |
| --- | --- |
| Original unmodified v0.2 Python suite | **16 passed**, 1 dependency deprecation warning, 28.41s; FastAPI 0.128.2 / SQLite / Python 3.14.7 |
| TypeScript compilation | PASS, strict TypeScript; Node 24.21.0 |
| Node policy/security tests | **7 passed**; includes 220 original-Python differential deadline/cutoff fixtures |
| Real SQL + HTTP parity and smoke | **14 passed**, 20.33s; isolated MariaDB 11.4.5 / loopback 33119 / synthetic data only |
| Schema initial application | PASS on a new empty disposable database |
| Schema repeat | PASS, checksum recognized; no existing rows changed |
| Imported file integrity | **87/87 SHA-256 checks passed** |
| Original decision registry | PASS, all **201** source decisions in order; original text preserved |
| Dependency install audit | 0 reported vulnerabilities in npm install output; this is not an independent security audit |
| Static/health/cookie smoke | `/health`, `/ready`, original HTML/JS serve; Secure/HttpOnly/SameSite=Strict cookie assertions pass |
| Whitespace review | New implementation checked; imported Vault retains intentional original Markdown trailing spaces |

The final SQL suite covers own-family/branch isolation, unlinked Guardian denial, both delivery modes, CSRF, held verification, lifecycle conflicts/logout, attendance, immutable first report submission, report return/history/review, unique alert retries, submitted-report suppression, approved noon stages and unassigned supervisor, absent vs unknown, invalid month and threshold rules. Original prototype assumptions remain assumptions; pending policies are not treated as completed features.

## Corrections made during validation

- Corrected SQLite-to-MySQL foreign key conversion before final run.
- Login limiter now counts failed attempts rather than successful fixture logins; it remains bounded/process-local, and reverse-proxy/shared-limiter review is pending.
- Windows sandbox initially prevented test DB connections/temp-directory use. Final successful runs used explicitly isolated workspace test storage and permitted loopback access. No legacy/production DB was used.

## GitHub CI verified

At commit `22c435112c8e1b54a78758fd8705a71a1b467635`, [PR run 41208406423](https://github.com/AlphaMM3/Online-Academy-Managment-/actions/runs/41208406423) completed successfully on **MySQL 8.0** and **MariaDB 11.4**. Both jobs passed baseline integrity, TypeScript/unit tests, initial/repeated migration, SQL/HTTP parity and the original Python suite. A later documentation/line-ending-only commit must be checked on its own current CI run before merge.

## Pending / not established by these results

- Recheck the current PR head's GitHub Actions result before merge. Local SQL evidence is MariaDB; MySQL 8 evidence comes from the linked GitHub CI job.
- No Hostinger build, deployment, staging URL, schema installation, cron or environment changes were performed.
- No hosted backup/restore drill, existing SQLite credential/data migration, browser/device UAT, independent review, penetration test or D-180/D-201 production approval.
- No claim that all 201 decisions, follow-up/leave/commercial policies, or all prototype behavior/edge cases are implemented.

## Reproduce

`npm ci`; `npm test`; `npm run verify:baseline`. With a new empty dedicated `academy_test_*` database and environment: `ACADEMY_ALLOW_SETUP=1 npm run migrate` twice, then `npm run test:mysql`. The original Python test commands are in README. Run tests on disposable synthetic data only. All test assertions must fail visibly; do not skip SQL tests because credentials are missing.
