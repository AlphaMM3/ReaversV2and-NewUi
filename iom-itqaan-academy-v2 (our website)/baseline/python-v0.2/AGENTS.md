# Academy Agent / Engineer Rules — read first

1. **Do not edit the authoritative original 201 decisions.** Reference: `reference/Academy_Four_Workstreams_v1.7.1.zip`, including `00_Shared_Decisions/DECISION_AMENDMENTS.md`; AM-18/19 supersede only scoped older 1:1 policies. Do not invent an approval for pending commercial terms.
2. **One owner per domain**: `app/security.py` authentication/permission primitives, `app/policy.py` pure approved business rules, `app/db.py` database source, `app/main.py` prototype API, `app/static/` UI, `tests/` tests. Before expanding use appropriate module structure; avoid growing `main.py` endlessly.
3. **No production or legacy writes.** Existing Class Manager and Payment Portal are entirely outside this repo. No database credential in source. New native one-to-one is a separate future module; financial operations are explicitly blocked pending policy.
4. **Changes require impact review**: linked Decision IDs, amendments, role/branch/guardian scopes, state, DB, API, UI, test and backwards compatibility. Respect `docs/KNOWN_GAPS.md`.
5. **Use idempotent and auditable writes**, explicit transaction, scope checks in server code (never only hide UI buttons). An unrecognized, conflicted or unapproved rule should reject/fail safe, not guess.
6. **Never rewrite historical attendance, class report, hours or money without audited correction authority.** Avoid mass UPDATE/DELETE, DROP TABLE and destructive migrations. Use additive versioned migrations after v0.1.
7. **Small focused commits + tests + human reviewer.** Run `python -m pytest -q tests`, API permission cases and a UAT smoke run. Add a decision-linked test whenever implementing policy; do not forge passed results.
8. **Do not mark app ready for children’s production data** until security assessment, backup+restore, testing/UAT, host capability review and D-201 approval. This is local-only software.
9. **Privacy first:** Guardian only own linked family; Teacher only own assigned classes; Zimmadar only own batch; branch roles cannot cross branch; follow-up notes excluded from Guardian content.
10. **Keep UI minimal, architecture maintainable.** Reuse consistent API and data contracts. Distinguish original confirmed rule, later approved amendment, implementation assumption and open question in documentation.
