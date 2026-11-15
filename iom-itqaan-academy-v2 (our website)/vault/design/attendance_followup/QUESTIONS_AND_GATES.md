# Attendance design — unanswered choices and implementation gates

এই তালিকা original OPEN_QUESTIONS-এর status পরিবর্তন করে না। Existing approval দিয়ে মেটানো যায় এমন বিষয় আবার অনুমোদনের জন্য তোলা হয়নি। Source-grounded core rules এবং এখানে অনির্ধারিত boundary আলাদা। Parent case বা worker-এর কোনো default branch দিয়ে pending সিদ্ধান্ত পাশ কাটানো যাবে না।

| ID | Scope / question | Current evidence / suggested direction | Blocked path |
|---|---|---|---|
| AFQ-01 | Attendance correction clock | USER_APPROVED:class date ধরে সপ্তমদিন23:59 Bangladesh;not elapsed168h AM-16. Day inclusion example answer stored separately AFQ-01B | Calendar correction cutoff |
| AFQ-01B | 31Oct class ->6Nov or7Nov23:59? | USER_APPROVED AM-16-C1:31Oct ->7Nov23:59 Asia/Dhaka;class date+7 calendar days | RESOLVED date inclusion;second precision remains AFQ-07 |
| AFQ-02 | Held-class evidence and edge failures | Proposed:Teacher End Class+report/attendance evidence;discrepancy Zimmadar review. Alternative every-class Zimmadar confirmation. Await user;relates original Q-11 | Eligibility,denominator,absence counter |
| AFQ-03 | Timely submitted leave approved later | Proposed:keep Absent,recalculate,close unnecessary pending alerts,retain delivered history. Await user;does not settle withdrawn approval or restored closed case | Retroactive leave replay |
| AFQ-04 | D-055 class-start and provider join anchor | Scheduled start vs actual teacher start;join evidence validity and exact clock. No approved choice found | Automatic Late classification |
| AFQ-05 | First absence follow-up completion and cross-kind rules | AM-06 requires completed first contact. Proposal:assigned Teacher valid contact note emits completion;D-102 explicitly low-attendance,not automatic proof for every absence case. Reopen effect on phase2 also pending | Phase2 activation/reopen after activation |
| AFQ-06 | Present/Late/leave/correction after first completion | Streak resets/breaks known;which phase/case survives,third escalation behavior and retrospective newly crossed thresholds not fully specified | Phase reset/case regeneration branch |
| AFQ-07 | Exact deadline anchors and inclusive equality | Day3/6 calendar vs elapsed hours;24h reopen/edit boundaries;blocker clock reported vs assigned;same-instant event ordering | SLA date arithmetic,boundary races |
| AFQ-08 | Enrollment/session/leave interval boundaries | AM-15 interval rule approved;exact transfer instant,overlap,makeup/multiple sessions,date-range inclusivity pending | Session coverage at transfer/leave edges |
| AFQ-09 | Pause implementation edges | AM-12 remaining-time resume approved;repeat7-day cadence,already-overdue leave,overlapping/retro leave and advanced plan/blocker scope pending | Repeat cadence and special pause behavior |
| AFQ-10 | Incomplete/recomputed monthly snapshots | No missing->Absent. Final percentage publication with missing verification,new threshold after correction and closed-case restoration unspecified | Official summary publication and correction-driven new alerts |
| AFQ-11 | Manual close/plan completion/blocker resolution | Source caps bulk closure but does not define all manual reasons or finish authorities. Auto-close low-attendance does not close plan/blocker | Manual terminal actions |
| AFQ-12 | Reassignment and private historical notes | D-090 restricts related Teacher;current/former Teacher and new assignee historical-note access needs exact scope | Note access after reassignment/exit |
| AFQ-13 | Guardian warning versus attendance preference | Instant/Daily/Weekly attendance preference known;mandatory low-attendance warning timing relative to preference not specified | Guardian warning scheduling |

## Ready as source-grounded rule,not implementation

Separate enrollment counters,Present/Absent/Late and strict>15 rule;seventh eligible first alert;second count only after first completion;approved leave Absent denominator/pause/reset;new month minimum3 and>=75 previous low-attendance closure;Late also Returned;Teacher own-class and Zimmadar correction approval;private notes;reopen cap2;stated escalation durations/actors.

## Approval evidence recovered,not pending questions

AM-12/13/14/15 record past verified choices. Do not ask the user to reapprove them or silently restore old Present-only Returned/indefinite prior-month case behavior. C-03's old second7calendar-day note is superseded by AM-02/06.

## Gate status

Design draft can be reviewed now. Independent review/remaining policy resolutions still required. G0/G1/G2 and implementation/release gates remain as previous version;no final freeze,no live code/database changes. Proposed next bounded deliverable after review:resolve high-impact pending branches,then full report deadline/state design. Current task does not authorize implementation of unresolved choices.

## Resolved cutoff example — AM-16-C1 (v1.4.1)
Class local date +7 calendar days at23:59 Asia/Dhaka;31 October2026 class ->7 November2026 at23:59. Count starts the day after class;not elapsed168h. After cutoff Zimmadar approval required. Exact endpoint second precision remains AFQ-07. AFQ-01B is RESOLVED;supersedes earlier pending-example wording in this document only. Other pending questions remain unchanged.
