# IOM Academy engineering contract

Read `vault/ACADEMY_MASTER.md`, original `vault/references/IOM-School-Maktab-Reference-v1.0.md`, and approved `vault/DECISION_AMENDMENTS.md` first. The current user has authorized the Node.js/TypeScript + MySQL staging port. This does not freeze pending business policy or authorize production migration.

- Preserve D-001..201 and approved amendments, including AM-18/19. Keep the 12 unapproved proposals and unresolved questions explicitly pending.
- `vault/`, `baseline/`, `public/` and `provenance.json` preserve imported evidence. Do not silently rewrite imported decisions, historical tests or the original UI. New decisions need explicit evidence.
- No access to legacy 1:1 or payment databases, credentials or sessions. Payment collection/verification remains external. No automatic legacy account linking or credential import.
- Owners: `security.ts` auth/scope; `policy.ts` approved pure rules; `catalog.ts` people/catalog/enrollment; `academic.ts` class/attendance/report transitions; `monitor.ts` summaries/outbox; `db.ts` storage/transactions; `cli.ts` explicit setup/cron.
- Cite decisions/amendments and document workflow, RBAC, state, schema, API/UI, audit and test impact. Do not implement unresolved policy by guessing.
- All writes require server-side scope/CSRF checks, transactions and audit where applicable. Lock state transitions and enforce uniqueness in SQL. Internal outbox events are not delivered messages.
- Use a feature branch and PR; never force-push, overwrite main, self-approve or auto-merge. Independent human review, department UAT and D-201 approval remain gates.
- Run `npm ci`, `npm test`, `npm run test:mysql`, `npm run verify:baseline` and the original Python tests. Integration tests require a dedicated `academy_test_*` database; never aim tests at staging/production data.
- Do not commit secrets, `.env`, database dumps, private student/guardian records or dependency/build caches. `.env.example` contains placeholders only.
- No automatic DDL at startup. New dedicated staging schema only via explicit migration command; MySQL DDL may auto-commit. Partial failures require review. Rollback application code independently; retain DB evidence and backups.
- Report completed vs pending accurately. A local MariaDB pass does not prove MySQL 8 CI, Hostinger deployment, browser UAT or production readiness.

## Explicit staging authorization — 2026-10-31

The user also authorized SAMPLE browser UAT and fixes through a feature branch and PR. The maintained staging UI is now `frontend/`, initially copied from `public/`. `public/` remains byte-preserved import evidence alongside `baseline/`, `vault/` and `provenance.json`; the original verification is unchanged. Evolve `frontend/` for authorized UI fixes, without rewriting the imported UI.

The user explicitly closed the human-review step and authorized continuation to staging. PR #1 was merged into `staging`; `main` stays unchanged. This is user authorization, not independent human approval. The selected staging target is `onlineacademymanagement.savarshops.com`. The user explicitly approved removal of only its newly created PHP subdomain entry (placeholder backed up; no assigned database) and recreation as an independent Node.js website. Do not repeat the closed human-review gate for this staging run. Production, real-data migration and all unrelated D-180/D-201 gates remain unchanged.
