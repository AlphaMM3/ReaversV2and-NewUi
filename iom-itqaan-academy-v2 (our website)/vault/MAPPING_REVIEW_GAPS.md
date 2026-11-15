# Mapping review gaps — observed/proposed, not new approvals

## Existing unresolved questions preserved
- Q-02: retroactive approved leave and attendance correction interactions;normal leave pause/reset remains approved.
- Q-05: safe-copy inspection permission granted;current source/export/API capability and full Guardian Portal remain unverified.
- Q-06: verified-payment read interface/authorization still pending;MVP local payment rows are not verification authority.
- Q-08: named approval roles for final design/policies remain pending;Central launch authority D-201 already exists.
- Q-10: exact sync cadence remains unapproved;do not infer15min.
- Q-11: held-class edge cases require definition;missing legacy session row cannot prove a missed held class.
- Q-12: all12 proposals remain unapproved;not necessary to approve proposals just to map original decisions.

## Observed stale skeleton text — do not implement literally
1. `05_STATE.md` diagram FirstAlert -> Monitoring2 says follow-up starts. AM-06 requires first follow-up COMPLETION before second seven starts. Same file says multiple-enrollment policy needs approval;AM-09 now grants independent enrollment counters.
2. `10_TESTING_QA.md` AT-RPT-02 still calls intermediate times pending;AM-08 has approved the noon-window schedule. AT-057-01 needs completion precondition explicit. New AT-MAP-035/057/148 capture effective approved direction;old test definitions are retained historical draft evidence,not approval.
3. `registries/RISK_CONFLICT_REGISTER.csv` R-14 describes old intermediate-time uncertainty. AM-08 resolves the noon schedule only;ordinary-cutoff follow-on scheduling still needs design. Original risk status left unchanged;closing a risk requires review.
4. `06_SCHEMA.md` and `07_INTEGRATION.md` pre-inspection wording does not record the later limited five-file MVP inspection. The earlier inspection is static only and does not establish live/complete system parity. Q6 permission is not audit completion.

## Detailed design needed before code
- D-034/035: ordinary23:59 report overdue schedule must not be invented from approved noon exception.
- D-072/073/080/082: retroactive leave/correction,seven-day timestamp anchor,and closure/recalculation audit need deterministic specification.
- D-093..097: preserve previous-month pending cases while defining recalculation and auto-close conditions;month/sample transition must not erase history.
- D-090/172: private follow-up notes must not leak into Guardian progress aggregation;class teacher notes and private follow-up notes are distinct record types.
- D-013/147/160/161: actual fee/pay rates,waiver/discount powers and financial approvals unspecified;unapproved proposal6 cannot fill these by assumption.
- D-026/027/156: age/level placement and promotion criteria need approved parameters,not hard-coded guesses.
- D-149: certificate issue authority,eligibility/layout/signatory require design;no invented certifier identity.
- D-153/177: source identity matching,dry-run counts,duplicate handling,authorization,rollback depend on actual input schema/data.
- D-167..175: current Guardian Portal,assignment/rescheduling rules,stable identity keys and read-only interface must be inspected;supplied MVP has no data dump or Guardian implementation.
- D-178: hosting/runtime verification and final stack selection remain pending;no deployment implied.
- D-196..199: review metric weights/quarter cycle anchor and private review access require explicit detailed design.

## Next bounded work
First expand WF-11/WF-22 and attendance corrections into a detailed state/RBAC/timer specification using approved rules and open items above. Then report workflow and cross-system contracts. This is a proposed sequence,not implementation/release authorization. Do not mark G0 complete until independent mapping review and critical conflict handling are done.

## v1.4 reconciliation overlay
AM-12..15 recover verified historical answers for leave remaining-time pause/resume,prior-month minimum3/75% closure,Late Returned and effective-enrollment periods. These supersede earlier uncertainty only for those exact scopes. `05_STATE.md` completion gate and enrollment wording corrected. Remaining retroactive/clock/transfer/case-lifecycle edges stay pending in attendance design.
