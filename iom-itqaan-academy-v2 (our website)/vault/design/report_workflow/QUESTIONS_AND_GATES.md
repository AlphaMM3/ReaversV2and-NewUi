# Report workflow pending choices — REVIEW, not approval

Original OPEN_QUESTIONS statuses remain unchanged;these report-specific details extend design review. Source-grounded behavior is not blocked from documentation by unanswered implementation edges;dependent executable paths remain blocked.

| ID | Question / scope | Status / approved boundary | Blocked path |
|---|---|---|---|
| RQ-01 | Midnight boundary,missing start/end and multi-day/noon-crossing sessions | Ordinary22:59,late23:00,and actual after-midnight00:30 examples settled by AM-04/07;exact00:00/unusual cases not auto-inferred | Unusual deadline classification |
| RQ-02 | Exact last minute/second and simultaneous submission | Minute labels23:59/12:00 approved;inclusive second/click vs durable server timestamp and race precision pending | Exact cutoff equality |
| RQ-03 | Ordinary23:59 overdue reminder/escalation schedule | Noon12:05/14:00/16:00/18:00 approved;ordinary-case schedule NOT approved | Ordinary deadline reminder dispatch |
| RQ-04 | Returned report resubmission deadline and its escalation | User asked:Return+24h OR Zimmadar-selected deadline. Unanswered choice remains PENDING;no new revision clock invented | Revision SLA/reminders |
| RQ-05 | Late submission after reminders/escalation | Timely submission separates review and suppresses initial late reminders AM-17. Late-arrival future-job stop,resolution state and optional recovery notification need policy | Postlate-submission escalation closure |
| RQ-06 | Timer correction,cancellation,unheld/makeup and deadline recomputation | D-041 correction approval and D-052 linked makeup known;new compliance evaluation/delivered-alert treatment not fully specified | Evidence-changing replay |
| RQ-07 | Worker downtime/catch-up/repeat | Approved4 noon stages only;no approved repeated-after18:00 or burst catch-up | Restart/failure behavior |
| RQ-08 | Approved-report edit/withdrawal/reopen and repeated returns | Return/resubmit history required;direct overwrite not authorized | Postapproval changes |
| RQ-09 | Dual-role self-review,author reassignment and unavailable reviewer | Actual substitute authors known D-038;approval is Zimmadar D-033. Self-review/fallback authority unspecified | Conflict-of-interest/fallback actions |
| RQ-10 | Guardian publication/required course form fields | Course-specific form required;approved report field visibility/template content not finalized;D-090 private notes protected | Form validation/publication |
| RQ-11 | Offline drafts,server outage and grace | No approved extension/backdated submission just from client click or network failure | Offline/outage exception |
| RQ-12 | Report reminder channels and reviewer SLA | Recipient/times approved for noon;specific Portal/Telegram delivery contract and Zimmadar review deadline pending | Channels/reviewer overdue timer |

## Current answered choice

AM-17 user answer:“submission deadline ও review status আলাদা থাকবে”. In question context:timely submission satisfies Teacher initial submission duty while approval remains pending;no Teacher late reminder caused solely by reviewer backlog. This grants no new Zimmadar review SLA and does not choose returned-report24h proposal.

## Gate and rollback

This is report-design draft,not implementation approval. Existing G0–G7 statuses,attendance unresolved questions,all12 proposals and immutable201 source remain unchanged. Baseline v1.4.1 remains in separate folder/ZIP;discard v1.5 to roll back documentation. No runtime/database changes occurred.
