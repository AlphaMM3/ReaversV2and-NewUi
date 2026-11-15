# Decision Registry — Skeleton (NOT a rewrite of original 201)

**Canonical source:** `references/IOM-School-Maktab-Reference-v1.0.md`  
**Verified file SHA-256:** `9cd4e5cb15b7e3c2dfd73d968f1ec83069cf02b3f75642453a51a684d17bde96`  
**Reference status:** 201 numbered source-confirmed entries; independent per-decision historical approval evidence absent.

## Where to find decisions
- `references/IOM-School-Maktab-Reference-v1.0.md` — unchanged D-001 through D-201 and 12 unapproved enhancements.
- `registries/201_DECISION_TRACEABILITY.csv` — exactly 201 rows containing **verbatim source decision text**, with initial domain classification. Workflow/screen/test mappings are `TBD` until audited.
- `DECISION_AMENDMENTS.md` — later explicit user decisions; do not alter original text.
- `OPEN_QUESTIONS.md` — unresolved details; no inferred approvals.

## Decision lifecycle
`SOURCE_CONFIRMED` -> (may receive `USER_CLARIFIED` or `USER_APPROVED` amendment) -> `DESIGNED` -> `IMPLEMENTED` -> `TESTED` -> `RELEASED` (each transition requires real evidence).  
`PROPOSED` enhancements do not enter implementation scope without explicit approval.

## Amendment method
1. Preserve original D-ID and exact wording in `references/`.
2. Add amendment ID (e.g., `A-20261030-01`) with affected D-IDs, original context, **exact new scope**, approval evidence and date.
3. Add/update decision matrix references to the amendment ID.
4. Identify collisions with other D-IDs, UI, state, RBAC and tests.
5. Update `CHANGELOG.md` and request sign-off for implementation scope separately.

## Strong invariant
**No missing or duplicated D-ID; no silent new rule; no invented approval; no decision text copied into multiple competing master files.**

## v1.3 mapping draft
201 decisions now have candidate workflow/screen/role/entity/acceptance links;see `MAPPING_README.md`. Mapping status is explicitly draft. Source status,wording,amendment evidence and all proposal approvals are unchanged.
