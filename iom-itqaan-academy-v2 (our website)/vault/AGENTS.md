# Agent working contract — IOM School Maktab

**First read `ACADEMY_MASTER.md` and the unchanged 201-decision source.** This file contains guardrails, not business policy.

## Must do on every task
1. Cite applicable `D-###` and later approved amendment IDs; distinguish `SOURCE_CONFIRMED`, `USER_APPROVED`, `PROPOSED` and `PENDING`.
2. Inspect actual files and dependencies before editing. No imagined API, table, property or approved scope.
3. Document impact across UI / workflow / state / RBAC / schema / events / reports / tests.
4. Keep change isolated and minimal. Never rewrite unrelated files or mutate live systems without scoped authorization. AM-18 permits native1:1 redesign/planning;it does not authorize destructive/live migration or payment-portal writes. Follow explicit per-period source ownership and approval contracts.
5. Run automated checks that exist; log results, known gaps and rollback approach. Never claim unrun tests passed.
6. Never modify `references/` source; amendments need explicit user approval with exact scope.
7. Stop and ask rather than invent policy, bypass approval or broaden external write permissions.
8. Production deployments, migrations and customer data changes require explicit authorization, UAT and D-201 final central approval.

## Human code-review checklist
- Business rule traceability, permission boundary, idempotence, transaction safety, migration reversibility, privacy, report/ledger correctness, tests, audit and recovery.
- Do not auto-approve your own PR; independent human reviewer signs off on sensitive changes.

## Definition of done for a feature
Decision evidence + approved spec + code diff + tests + security/privacy review where applicable + updated docs + reviewer approval. Deployment is a separate gate.
