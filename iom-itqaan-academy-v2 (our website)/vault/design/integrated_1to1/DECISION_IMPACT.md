# AM-18 supersession and impact ledger

| Area | Current effect |
|---|---|
| D-167 old as-is inheritance |Future1:1 may be redesigned natively;old workflow no longer mandatory implementation template |
| AM-05 read-only-only future target |No longer sole target;read-only safeguards still apply to any reference/migration access unless separately authorized |
| D-168 module/dashboard |Native module can use shared Academy data/services;exact physical architecture remains proposal |
| D-170/173/174 old feature parity/assignment/routine inheritance |Redesign permitted;replacement feature/action contract must be specified;do not assume full old system was audited |
| D-169 Guardian separate login |NOT revoked;unified login requires explicit approval |
| AM-10 legacy-to-Academy progress link |Valid transition direction;not sole long-term progress UI for native module;does not itself grant SSO |
| D-015/171 payment collection |Separate portal retained;no new payment gateway/confirmation authority |
| Q1..Q6 and AM-06..17 |Other confirmed details preserved,including safe-copy permission and submitted-versus-review distinction |
| Old INT-GAP-01..20 |Historical evidence remains true for supplied MVP;classify relevance as migration/reference versus new native design rather than silently closing gaps |
| Existing group operations and attendance/report design |Shared reuse proposed;unresolved policies remain pending;no implicit extension/cancellation of approved rules |
| Launch/migration/stack/12 proposals |No automatic gate completion,destructive import,framework selection or proposal approval |

Impact:UI adds native1:1 workspace within existing design;workflow replaces old dependency with explicit new contracts;RBAC uses shared scopes;state separates session/report/contract/minutes/invoices;schema logical entities in PLAN;events/idempotence protect double posting;reports unify projections while preserving privacy;tests require actual regression/access/ledger/migration verification before release. No UI/code/schema edit performed by this documentation change.

## AM-19 — unified Guardian target (v1.7.1,2026-10-31)
New Academy Guardian access uses one login/dashboard across linked children and Batch/1:1 classes/progress. This explicitly supersedes D-169 separate1:1 Guardian login and corresponding AM-05/10/18 preservation language for the NEW target system only. Preserve own-child access,Primary/Secondary distinct identities/permissions,D-090 note privacy and all unrelated approvals. No automatic legacy credential merge,shared password,production migration or SSO implementation approved. OTO-06 target-login choice RESOLVED;technical authentication,migration and account-linking design remain pending. Earlier separate-login statements in this document are historical and superseded only for the new target system.
