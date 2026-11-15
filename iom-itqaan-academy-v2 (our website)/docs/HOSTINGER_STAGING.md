# Hostinger staging runbook

## Part 2 candidate — 2026-11-04

The new runtime requires migration 004 before deployment. Follow
`PART-2-CONTRACTS.md` for manual encrypted backup, restore/upgrade validation,
additive staging migration and code-first rollback. Do not bootstrap existing data.
No backup scheduler or retention deletion is enabled. Record verified release
commit/build separately; the historical 001–003 statements below remain prior
release context.

## Prior implementation overlay — 2026-11-04

The authorized staging target is `onlineacademymanagement.savarshops.com`.
GitHub `staging` auto-deploy is configured; feature branches do not deploy.
PR #7 deployed merge `40c0fcd759b86da9fd8a7483fd93d12c9f0eb372` in build
`01a1a1e9-0351-73e6-8695-08452ce6c1dd`; this is the prior verified release,
not evidence that a later release deployed. Record every new commit/build and
live read-back separately. Node 24 / Express uses `build:hostinger` and
`dist/src/server.js`; protected environment and database remain outside Git.

The existing schema is migrations 001, 002 and 003 (18 tables), including separate
published progress. Part 1 foundation changes require NO new migration or bootstrap.
Never reinitialize the deployed database or rerun initial-account setup to update UI.
Keep `ACADEMY_ALLOW_SETUP=0` for normal operation. Back up before a release, verify
the backup in a new local restore database and use a code-only rollback when no
schema changed. No legacy 1:1/Payment Portal changes are included.

## Historical initial setup notes — 2026-10-31

The initial inventory/selection statements below are preserved historical context;
the current target, deployed status and three-migration scope are described above.

Verified official documentation on 2026-10-31:

- https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/

Business Web Hosting supports managed Node.js and GitHub import. Use Node 24.x and the available patched runtime. MySQL runs at `127.0.0.1:3306` from the deployed app. The account read-only website inventory was available; no Academy target was selected and no hosting writes were performed.

## Deployment contract

| Setting | Value |
| --- | --- |
| Repository | `AlphaMM3/Online-Academy-Managment-` |
| Review branch | `codex/academy-v02-hostinger-staging` |
| Deployment branch | `staging`, created only after review/merge authorization |
| Root | `.` |
| Framework | Express |
| Node | 24.x |
| Install | `npm ci` (dev dependencies needed for TypeScript build) |
| Build | `npm run build:hostinger` (Hostinger script selector: `build:hostinger`) |
| Start | `npm start` |
| Entry | `dist/src/server.js` |
| Port | Host-provided `PORT`; binds `0.0.0.0` |
| Health | `/health` liveness; `/ready` database readiness |

1. Complete independent PR review and CI. Confirm a fresh staging website/subdomain and dedicated database. Do not replace existing sites.
2. Set `NODE_ENV=production`, `ACADEMY_ENV=staging`, `ACADEMY_SECURE_COOKIES=1` and the five `DB_*` keys through Hostinger environment variables. Use the full database/user name including hosting prefix. Secrets stay out of Git.
3. Back up any target data before upgrades; for this initial candidate the DB must be new and empty. With explicit setup authorization, run `ACADEMY_ALLOW_SETUP=1 npm run migrate` from the app root. It refuses unknown populated schemas, checks migration checksum on repeat and never executes DROP/DELETE. MySQL DDL auto-commits: a partial migration stops for manual review rather than pretending rollback succeeded.
4. Supply `BOOTSTRAP_EMAIL`/`BOOTSTRAP_PASSWORD` securely and run `ACADEMY_ALLOW_SETUP=1 npm run bootstrap` once on an empty user table. Remove these keys and restore `ACADEMY_ALLOW_SETUP=0`. Existing accounts are never overwritten.
5. Build/start with the settings above. Confirm HTTPS, real login content, secure session cookie, `/ready`, own-family/branch tests and synthetic attendance/report flows. Browser UAT remains required.
6. If enabled, run `node dist/src/cli.js alerts` every minute with the same protected environment and working directory. No public cron URL, external notification or persistent worker. Events only occur during the inherited five-minute stage window; historical catch-up remains pending policy.
7. Connect GitHub in hPanel, select the approved deployment branch and enable auto-deploy only after target review. A GitHub PR alone does not deploy. Record build ID, commit, URL and read-back status before claiming success.

## Rollback and data boundary

Current setup verifies unchanged `001` and then additive `002_report_class_foreign_key.sql`. Migration `002` recognizes an existing equivalent MariaDB FK or adds the missing enforced relationship on MySQL 8. It retains rows and refuses checksum drift or invalid orphan records. It is applied only by the explicit setup CLI, never by server startup. See the technical review for the millisecond timestamp input limit.

- Keep the original v0.2 ZIP and existing SQLite installation untouched. No SQLite import or password migration is implemented.
- Revert the application commit through PR and redeploy the last verified build. Do not delete the database as application rollback.
- Before schema upgrades, export a private encrypted backup outside the public website root, verify restore into a separate disposable DB, and retain a separate-device copy. This task did not create or verify a hosted backup.
- Local validation uses a fresh MariaDB data directory on loopback port 33119, completely separate from any prior local/hosted database. It contains synthetic fixtures only.
- Credentials, production records, legacy/payment database connections and live account linking are absent.

Pending: target/domain selection, fresh hosting DB and credentials, independent review, actual MySQL 8 CI result, hosted build, cron configuration, backup/restore verification and browser UAT. Production needs D-180/D-201 gates.

## Authorized staging run in progress — 2026-10-31

The later user instruction closed the staging human-review gate and selected `onlineacademymanagement.savarshops.com`. PR #1 merged into `staging`, target recreated independently with explicit permission, and a dedicated generated-secret database was created. See `STAGING_DEPLOYMENT_2026-10-31.md` for observed build failure/correction and exact pending verification. Earlier pending lists describe the original preparation snapshot; they do not override that later authorization. Production gates remain unchanged.
