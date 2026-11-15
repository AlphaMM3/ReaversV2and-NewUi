# IOM Academy — isolated staging candidate

Node.js 24 + TypeScript + Express + MySQL port of the supplied Academy Core v0.2 prototype. Repository: **AlphaMM3/Online-Academy-Managment-** (private). This is a review candidate, not a production release or an implementation of all 201 decisions.

## Source and authority

- `baseline/python-v0.2/`: source, tests and known gaps recovered from the downloaded v0.2 full archive; no existing local database/admin credentials were imported.
- `vault/`: unchanged Academy Vault v1.7.1, original 201 decisions, approved amendments, unapproved proposals and pending questions.
- `public/`: unchanged v0.2 browser assets, preserved as import evidence.
- `frontend/`: maintained staging UI; Guardian overview and separately published progress follow the explicit [publication decision and implementation contract](docs/GUARDIAN-PROGRESS.md). The original `public/` stays preserved.
- `provenance.json`: source archive digest and SHA-256 of all 87 imported files. `npm run verify:baseline` checks these and the 201-decision registry.
- New target honors AM-18 native 1:1 direction and AM-19 unified Guardian target. No changes to the existing legacy 1:1 Manager or external Payment Portal.

## Local validation

V1 academic candidate: [implemented scope and explicit V2 backlog](docs/V1-ACADEMIC-SCOPE.md).
Admission, dates/sessions, assignments, weekly scheduling, course report prompts
and per-enrollment status require explicit migration **005** before this runtime.
The live Part 2 release is not evidence that this V1 candidate has deployed.

Part 2 candidate: [architecture, permission matrix, account lifecycle and manual
recovery contract](docs/PART-2-CONTRACTS.md). Migration 004 is required before this
runtime; it is not applied automatically. Backup remains manual by user choice.

See [Part 1 foundation acceptance and setup](docs/PART-1-FOUNDATION.md) for the
bounded 1.1–1.5 checklist, first-branch/Guardian setup, permission boundaries and
evidence requirements. New Branch creation is available to Central Admin;
Family → View / link guardians lets authorized admins attach existing active
Primary/Secondary Guardian accounts from the same branch.

```sh
npm ci
npm test
npm run verify:baseline
python -m pip install -r baseline/python-v0.2/requirements-local-tested.txt
python -m pytest -q baseline/python-v0.2/tests
```

For SQL integration, create a **new empty** `academy_test_*` database and a dedicated user. Supply `ACADEMY_ENV=test`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` through environment variables. Then:

```sh
ACADEMY_ALLOW_SETUP=1 npm run migrate
npm run test:mysql
```

Windows PowerShell: set variables with `$env:NAME='value'` before running commands. Do not paste real passwords into shell history or chat; use a secret manager or interactive secure setup. See `.github/workflows/parity.yml` for disposable MySQL 8 and MariaDB CI services.

## Hostinger staging settings

See [the staging runbook](docs/HOSTINGER_STAGING.md): root `.`, Node 24.x, Hostinger build `build:hostinger`, start `npm start`, entry `dist/src/server.js`. The build script installs the TypeScript compiler explicitly and then prunes dev dependencies. The server uses `PORT` and binds `0.0.0.0`. Schema/bootstrap are command-only; startup performs no DDL. No background polling worker is started; the configured cron invokes the explicit alerts CLI.

Never point this candidate at existing systems. Use a fresh website/subdomain, dedicated database and synthetic data. Do not connect Hostinger auto-deploy to this feature branch; review and merge first, then explicitly authorize the deployment branch and target.

## Review status and limitations

Read [validation evidence](docs/VALIDATION.md), [parity mapping](docs/PARITY.md), [impact/gates](docs/IMPACT.md) and the newer implementation overlays. Leave/follow-up automation, full commercial 1:1 rules, MFA, emailed recovery, automated retention and independent security/UAT gates remain pending. Manual admin-issued reset recovery is in the Part 2 candidate. Guardian publication follows the explicitly approved separate-summary contract, not automatic publication of internal reports. Internal report alert records do not mean Telegram/email messages were sent. No legacy migration or production deployment is included.

The [2026-10-31 technical review](docs/REVIEW_2026-10-31.md) records four corrected findings, 9 unit tests, 17 SQL/HTTP tests and an additive `001 → 002` upgrade regression. `npm run test:upgrade` requires an empty disposable `academy_test_*` database and runs before the other SQL checks in CI. Independent human approval remains pending.
