# Attendance/follow-up local implementation — 2026-11-04

User requested Parts 4.1–4.7 after explicitly selecting local-first development.
No GitHub push, hosting mutation, live database change or external message delivery
is authorized by this local build. Preserve canonical Vault/baseline/public evidence.

## Explicit new approvals in this chat

- Worker downtime: deliver only the latest currently actionable reminder/escalation;
  skip obsolete, completed/closed and leave-paused jobs. Ambiguous Telegram outcome
  goes to review; no blind automatic resend.
- Late classification uses actual class start. Direct correction cutoff is class
  Bangladesh date +7 calendar days at 23:59:59. Follow-up day 3/6 means 72/144
  elapsed hours. Leave dates cover complete Bangladesh calendar days inclusively.
- Missing attendance holds new low-attendance warnings. Leave retains remaining
  follow-up time. Repeat warning cadence restarts at leave end with seven days;
  missed repeats are not delivered in a burst. Closed cases are not automatically
  reopened after retrospective source changes; expose review evidence instead.
- Assigned Teacher records contact date, Guardian statement and next steps to
  complete first absence contact; only later held classes count toward phase 2.
  Present/Late or leave end starts a fresh absence episode; old tasks/history stay;
  no automatic third absence escalation.

Existing AM-06/09/12/13/14/15/16-C1 and D-053..131 remain authoritative except for
the narrow explicit clarifications above. The original Vault remains byte-preserved;
this append-only implementation overlay records later decisions without rewriting it.

## Still awaiting explicit replies

- Separate Management duty, private-note access after reassignment and terminal
  action-plan/blocker confirmation authority (question already sent).
- Overlapping/extended leave, overdue-before-leave and retrospective approval edge
  behavior (question already sent).
- Guardian urgent warning preference interaction, exact blocker initial SLA anchor
  and other scope not answered by the above must remain explicit, not inferred.

## Delivery boundary

Work on codex/local-attendance-followups using a new academy_test_* DB and synthetic
data. Browser acceptance and actual test results are recorded separately. New SQL
is explicit migration only; no startup DDL. Existing staging stays on PR #10 until
the user reviews the local result and separately requests delivery.
