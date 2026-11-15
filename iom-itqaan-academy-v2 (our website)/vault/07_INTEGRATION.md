# INTEGRATION — Read-Only Legacy Integration Contract Skeleton

**Approved policy:** existing 1:1 manager stays unchanged; Academy may READ approved records; no writes. Existing payment portal remains payment confirmation source D-015/D-167..175 and AM-05.

## Proposed data flow
`Legacy 1:1 manager (READ ONLY) -> adapter -> validation -> legacy ID map -> academy projection -> dashboard`.
`Payment portal (READ ONLY) -> adapter -> verified-payment mirror -> finance summary`.

## Non-negotiable
- No stored legacy credentials in source control or vault.
- No direct cross-database UPDATE/DELETE/INSERT in old systems.
- No duplication of payment confirmation or legacy contract accounting; mirrored records include source, external ID, retrieved time and last sync.
- Sync failure must not block existing 1:1 classes or payment processing.
- Guardian 1:1 separate login remains D-169; no inferred SSO.

## Technical feasibility audit [REQUIRES SANITIZED SOURCE / AUTHORIZED READ ACCESS]
1. Hosting/runtime/framework versions, existing API/export surface and DB read permission.
2. Legacy data entities, keys, student/guardian identity mapping, teacher mapping.
3. Source of truth for 1:1 report, schedule, contract minutes, payment status.
4. Security and child/guardian privacy: minimize fields and scope.
5. Polling frequency/cursor, retry, checksum, pagination, clock skew and conflict reporting.
6. Reconciliation of sample records and no sensitive data exposure.

## Proposed V1 approach
Start with export-based or scoped read-only adapter after feasibility review. **Sync interval e.g., 15 minutes is a proposal, not approved**. Dashboard displays `last_synced_at` and `data_stale` marker. Provide a **link out** to legacy for edits, no writes.

## Mapping sample (no real data)
`academy_student_id: STU-001` ↔ `source_system: itqaan_1to1` ↔ `external_student_id: LEGACY-XX`.
This is illustration only. Validate all real IDs before merging profiles.

## Open questions
Where hosted? PHP version/framework? MySQL structure? Export/API? Is the separate payment portal integrated via API, export or other mechanism? Who owns access approval? Is external guardian email/account identity reliable? See `OPEN_QUESTIONS.md`.

## Supplied-copy evidence review v1.6
Five-file PHP/MySQL MVP statically re-inspected;manifest and20 evidence gaps: `design/legacy_1to1/README.md`. Current deployed parity,Guardian Portal and read interface remain unverified. Q6 is inspection permission,not completed full audit. No final adapter/auth/sync contract approved.

## AM-18 native1:1 direction overlay (v1.7)
Historical as-is/read-only-only future target is superseded for1:1 redesign. See `design/integrated_1to1/PLAN.md`. Reference/legacy access remains controlled;payment portal stays external;stack is still UNSELECTED and gate statuses are not advanced. No live migration/deployment authorized by this planning deliverable.
