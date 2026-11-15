# Staging deployment record — 2026-10-31

## Authorization and source

The user explicitly closed the human-review step and authorized the next staging work. PR #1 was retargeted and merged to `staging` at `8e286ec370f132564f3f2e1f7f7f9c8e93e4d220`; `main` remains the initialization README. No independent-human approval is claimed. Production, customer-data migration and D-180/D-201 gates remain separate.

Target selected by the user: `onlineacademymanagement.savarshops.com`. The user separately approved removing only its newly created PHP subdomain entry and recreating the same hostname as an independent Node.js website. No other website, email service, legacy 1:1 or Payment Portal was removed or changed.

## Observed preflight and recovery material

- Previous root was a subfolder of savarshops.com; it contained only `default.php` (42,559 bytes), with no assigned database.
- The placeholder and DNS/SSL preflight were backed up outside this repository in the local `academy-staging-preflight` folder; placeholder SHA-256 `b379ec4e1a18e7b2daaf905a693cd26d6bb117050e9de0ec29a5076ce67f6bef`.
- DNS snapshot before the conversion: `193061657`. Existing MX/SPF/DKIM/DMARC records were inspected. No deliberate DNS-record replacement was made by this task.
- Website setup completed as an independent addon at `/home/u910665429/domains/onlineacademymanagement.savarshops.com/public_html`.
- A new dedicated database/user `u910665429_academy_stage` was created through Hostinger's generated-secret setup. Credentials live in protected site environment configuration; no database password is stored here or in chat.
- Existing Hostinger SSH access and the provider Node runtime were verified. No existing customer database was accessed.

## Hosted build correction

Initial Git build `01a1927a-7fcd-73e5-9c2a-8ae242b3fabf` cloned the correct `staging` merge commit but failed with `tsc: command not found`. The host's `NODE_ENV=production` installation omitted devDependencies, including TypeScript and type declarations.

Use package script **`build:hostinger`**: locked `npm ci --include=dev`, TypeScript compilation, then `npm prune --omit=dev`. The ordinary local `build` remains `tsc`. CI now explicitly tests the production-mode hosting build after parity tests. Node 24.x, Express entry `dist/src/server.js`, root `.`, npm package manager. Runtime binds the host-provided `PORT` on `0.0.0.0`.

## Setup and verification contract

Run `migrate` and `bootstrap` explicitly via SSH using the **new site's protected environment**, with command-only `ACADEMY_ALLOW_SETUP=1`; leave the persisted runtime setup flag disabled. Startup itself does not mutate schema. Initialize only this fresh dedicated database. Bootstrap creates an administrator only on an empty users table and never imports legacy credentials.

Before calling deployment complete, read back the successful build ID/commit, HTTPS/cookie status, `/health` and `/ready`, and verify synthetic login/role-boundary/browser flows. Configure scheduled internal alert processing only against this target. Backups of new staged data must remain private outside public_html and require a restore drill before any real data is considered.

At the time this record was written: website/database/Git connection existed; the first build failed as described; corrected hosted build, schema/admin setup, cron and browser UAT were still pending. Subsequent actual results must be read from the deployment status and task handoff, not inferred from this preparation record.

## Runtime compatibility correction

Build `01a19281-ef16-7343-8219-cf91f85df37b` at staging merge `00d74443472ea54a25f904e7a4e93840e504bd93` completed successfully with `build:hostinger`. Published server files live under `hbuilds/current/nodejs/`, not directly under `hbuilds/current/`. Explicit migrations 001/002 were applied successfully to the fresh dedicated staging database. The generated protected environment's DB_HOST was corrected from localhost to 127.0.0.1 without changing other values.

Runtime logs then showed LiteSpeed's CommonJS `require()` loader rejecting the entry module's top-level await (`ERR_REQUIRE_ASYNC_MODULE`). Wrap asynchronous readiness/startup in an async function so the ESM import graph itself is synchronous, retain readiness checks/graceful shutdown, and add a real SQL-backed production-mode `require()` startup regression. CLI setup remains explicit; no schema initialization was added to server startup.
