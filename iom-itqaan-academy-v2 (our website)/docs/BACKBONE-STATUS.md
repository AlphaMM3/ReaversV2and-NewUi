# Backbone implementation overlay — 2026-11-03

## Part 2 candidate overlay — 2026-11-04

See `PART-2-CONTRACTS.md` for the 2.1–2.5 implementation, action matrix and exact
pending boundaries. Account lifecycle, scoped Supervisor read access, session role
switching, paged audit and safe CSV export are local candidates. Schema 004 adds
four tables and one nullable users column; expected inventory is 22 tables / 37
FKs. The older schema and missing-feature statements below describe earlier
releases. They do not certify this candidate as deployed. MFA and automated
backup remain deferred; the user explicitly selected manual backup.

## Part 1 foundation overlay — 2026-11-04

The bounded 1.1–1.5 staging foundation has a concrete acceptance checklist in
`PART-1-FOUNDATION.md`. First-branch creation and admin linking of existing active
Primary/Secondary Guardians now have UI/API flows; schema, session denial and full
group/basic-1:1 academic journeys have additional acceptance tests. PR #7's report
workspace release was verified on staging. The older next-action list below is
historical; continue with the Part 1 release gates and then Part 2 RBAC/reliability.
Completion of this bounded foundation does not complete the five broader backbone
workstreams below, D-065 Guardian self-service or all 201 Blueprint decisions.

Authority: original D-001..201, approved amendments and the later explicit Guardian
publication decision. This file tracks implementation, not new policy approval.

## Architecture currently implemented

Node 24 / TypeScript / Express serves a plain JS/CSS frontend and JSON API.
`app.ts` owns HTTP/session/CSRF/error boundaries; `security.ts` owns authentication
and role/branch/batch checks; `catalog.ts` owns people/catalog/enrollment;
`academic.ts` owns class, attendance and report transitions; `policy.ts` owns pure
approved calendar/attendance rules; `monitor.ts` owns summaries/internal alert
events; `progress.ts` owns explicitly published Guardian-safe summaries;
`db.ts` owns prepared SQL/transaction helpers; `migrations.ts` and `cli.ts` own
explicit setup/migration/alert commands. Startup performs no DDL.

Live staging was audited as MariaDB; MySQL 8 and MariaDB are CI compatibility
targets. The schema remains migrations 001..003, 18 InnoDB tables. No new schema
is needed for the internal report workspace. Source remains in Git; credentials,
private backups and staging configuration remain outside it.

## Five readiness workstreams

| Workstream | Current status | Remaining acceptance |
|---|---|---|
| Architecture/module boundaries | Implemented owners documented above; partial overall | Full approved department/multi-role/native 1:1 model, API conventions and independent review |
| Authentication/RBAC | Existing session/CSRF/branch/batch model; report matrix and denial tests added | Recovery/MFA decisions, supervisor/department/multi-role grants, broader adversarial acceptance |
| Main academic workflow | Existing lifecycle/held attendance/Guardian publication; report read/edit/review workspace added | Full course templates, assignment changes, uncommon state/time boundaries and department UAT |
| Bugs/security gaps | Oversized-body 500 corrected to 413; new UI uses stale-report tokens | Full audit backlog, limiter/proxy policy, operational security and independent review |
| Delivery/recovery/traceability | Feature branch/PR/CI and staging Git deploy path; preserved Vault and local test isolation | Current release/rollback evidence, backup automation/retention/RPO/RTO, continuing decision coverage |

No row means the entire workstream is complete. Detailed report change impact,
permission tests, compatibility limits and rollback are in `REPORT-WORKSPACE.md`.
The 2026-11-01 handover remains the earlier audit snapshot, not a current release
manifest or proof that all 201 decisions are complete.

## Next bounded work

1. Complete report release checks and verify deployed staging code without real-data
   migration. Record deployed commit/build and actual test results.
2. Extend explicit API/RBAC acceptance coverage before introducing broader roles.
3. Triage the remaining audit backlog; resolve business-policy questions before
   implementing dependent features. Do not invent reminder schedules or 1:1 fees.

Preserve immutable Vault/baseline/public imports, own-family Guardian access and
separate published summaries. No credential merge, SSO, production migration,
legacy 1:1 database access or Payment Portal writes are included.
