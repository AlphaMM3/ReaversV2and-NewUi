# Report workflow — Review Draft v1.5

Basis:D-032–035/038/040–044/052/137/140/172;AM-04/07/08;current explicit submission/review clarification AM-17. Original201 source wording unchanged. This document specifies policy-grounded behavior and proposed technical states;it is not application implementation,physical schema or final architecture approval.

## 1. Core distinction

There are separate dimensions:

- **Report lifecycle:**Draft -> Submitted -> Approved OR ReturnedWithReason -> RevisedDraft -> Resubmitted -> Approved/ReturnedWithReason.
- **Initial submission compliance:**NotSubmitted/OnTimeSubmitted/LateSubmitted/DeadlineUnresolved. Historical lateness is not erased by later approval.
- **Review obligation:**AwaitingZimmadarReview/ReturnedForTeacherRevision/Reviewed. No approved review SLA exists yet.
- **Escalation:**None/TeacherReminder/ZimmadarAlert/SupervisorEscalation/ManagementEscalation;delivery history separate from lifecycle and compliance.

AM-17 current user answer:“submission deadline ও review status আলাদা থাকবে”. In the question's explicit context,timely valid submission satisfies initial submission duty even while Zimmadar approval is pending. Do not label a Teacher late merely because reviewer has not approved. Draft save,opening form,Telegram message or failed save are not valid submission.

Review/returned-report timing is not silently assigned the initial noon schedule. Current returned-revision choice remains pending unless a later explicit answer is recorded.

## 2. Timezone and deadline rules

All examples are Bangladesh local time Asia/Dhaka. Persist actual source timestamps with timezone/provenance;converting for calculation does not invent teacher location or additional DST policy. Report date and class's nominal scheduled date are separate from actual-end local date.

| Rule | Class actual end | Submission due | Authority |
|---|---|---|---|
| DL-01 | Ordinary class not in approved late-night exception | Same class day's23:59 | AM-04;D-034 |
| DL-02 | At/after23:00 before midnight | Next Bangladesh calendar day's12:00 noon | AM-04 |
| DL-03 | Class crosses midnight and ends e.g.00:30 |12:00 noon on the same local calendar date as actual end | Q2;AM-07 |
| DL-04 | Actual end missing/contradictory or unusual multi-day timing | PENDING review;do not fabricate definitive deadline | RQ-01/06 |

Illustrative dates:

-31Oct22:59 end ->31Oct23:59.
-31Oct23:00 end ->1Nov12:00.
-31Oct23:59 end ->1Nov12:00.
-31Oct start crossing midnight ->1Nov00:30 end ->1Nov12:00,not2Nov noon.

Q2 means after-midnight exception,not an unrestricted rule that every daytime class may wait until noon regardless of start/end context. Sessions ending exactly00:00,crossing noon/multiple dates,and classification of pre-midnight/after-midnight class with missing start require RQ-01. End time correction must use D-041 approval;deadline recomputation/notification treatment RQ-06.

23:59/noon are approved minute-level clock labels. Inclusive final second and acceptance at exactly12:00:00 versus12:00:01 require RQ-02 before executable boundary logic. Do not claim a test at a pending endpoint has an approved expected result.

## 3. Approved noon-window reminders

For the relevant overdue report whose initial submission due is12:00 noon:

| Timer | Local time on DUE DATE | Actor/recipient | Guard |
|---|---|---|---|
| RP-T01 |12:05 |Teacher Reminder |Initial submission still outstanding under applicable policy |
| RP-T02 |14:00 |Batch Zimmadar Alert |Same report obligation still outstanding |
| RP-T03 |16:00 |Department Supervisor Escalation |Same report obligation still outstanding |
| RP-T04 |18:00 |Management Escalation |Same report obligation still outstanding |

Authority:Q3/AM-08. Times are wall-clock times,not12h05m/14h elapsed from deadline. These jobs belong to the deadline date even when the class started the prior date.

Ordinary23:59 deadline reminder schedule remains RQ-03;do not automatically reuse the noon sequence,create a next09:00 reminder,or add unapproved repeat-after18:00 intervals. No Zimmadar approval SLA or reviewer escalation schedule is approved by AM-08.

Timely submitted report must have all pending initial-late jobs suppressed AM-17,even if lifecycle=Submitted/AwaitingReview. Missing-report job sends do not approve/return report. Whether a late submission clears future stages,how already-delivered escalations are resolved,and restart catch-up behavior remain RQ-05/07 unless explicitly resolved.

## 4. Lifecycle transition table

| ID | From/event | Actor/guard | To/effect | Source |
|---|---|---|---|---|
| RP-S01 | Class End |Actual assigned Teacher;valid EndClass action |Timer stops;open course-specific report form;candidate Draft | D-032/043 |
| RP-S02 | Draft save |Assigned Teacher,scope/version check |Draft remains;no submitted_at;initial deadline still runs | D-043 |
| RP-S03 | Draft submit |Assigned actual Teacher;required course fields valid;durable transaction |Submitted,immutable submitted revision,awaiting Zimmadar review;compliance computed independently | D-032/033/043;AM-17 |
| RP-S04 | Submitted approve |Batch Zimmadar for related batch;current revision only |Approved;approval actor/time/revision retained | D-033 |
| RP-S05 | Submitted return |Related Batch Zimmadar;nonempty written reason |ReturnedWithReason;Teacher revision task;do not erase earlier submitted_at | D-044 |
| RP-S06 | Returned edit/save |Authorized actual Teacher;current returned revision |RevisedDraft;preserve rejected/submitted snapshot | D-044 |
| RP-S07 | RevisedDraft resubmit |Valid revised content;expected revision;assigned Teacher |Resubmitted;new immutable version;await review again | D-044 |
| RP-S08 | Resubmitted approve/return |Related Zimmadar on current submitted version |Approved OR ReturnedWithReason;history retained | D-033/044 |
| RP-S09 | Approved direct edit/reopen/delete |No source-approved general path |PENDING RQ-08;do not invent direct overwrite or approval bypass | D-044/162 |
| RP-S10 | Substitute report |Actually assigned Substitute Teacher |Same report workflow;substitute is author,not regular Teacher forced to sign | D-038 |
| RP-S11 | Makeup report |Approved linked makeup session,actual Teacher |Own attendance/hours/report,linked original cancellation;not duplicate report of cancelled session | D-052 |
| RP-S12 | Deadline worker |Current applicable obligation,scope,deadline/version,case guard |Add delivery/escalation event only;no report-state mutation to Approved/Returned | D-035;AM-08/17 |

No arbitrary report author reassignment,withdrawal,review self-approval when Teacher also Zimmadar,approved-report correction,repeated-return cap or resubmission deadline is granted by lifecycle labels. See RQ-04/08/09. Cancellation after a report has been submitted requires explicit conflict handling RQ-06,not deletion of report evidence.

## 5. Permission and screen matrix

All actions require active assigned role,Branch/Department/Batch and record scope,ownership/state,version/time guard;D-022/191. Staff account-management authority is not blanket academic approval authority.

| Screen/action | Actor | Allowed source scope | Deny/pending |
|---|---|---|---|
| Today's class -> End -> form |Actual regular/substitute Teacher |Own assigned session |Unrelated Teacher cannot author;missing/end conflict flagged |
| Draft/Submit/Revise/Resubmit |Actual assigned Teacher |Course form and own report |Guardian/other Teacher cannot submit;required field list still course-design pending |
| Review queue -> Approve/Return |Related Batch Zimmadar |Current submitted version;Return reason required |Teacher cannot self-approve merely via Teacher role;dual-role self-review RQ-09 |
| Overdue reports list |Teacher own reports;Zimmadar batch;Supervisor department;authorized Management |Deadline,submission status,review status,escalation history separate |Broad reports cannot expose unapproved/private content by assumption |
| Reminder/escalation dispatch |Authorized worker candidate |Current outstanding obligation and recipient role |Timely submitted-awaiting-review has no initial late-report reminder |
| Guardian progress/report read |Linked child and approved publication contract |Exact field/publication visibility pending RQ-10 |Draft/returned/private notes not automatically visible |
| Actual timer correction |Teacher request;Zimmadar approval |D-041 audited correction |Attendance calendar7-day permission does not authorize timer edit |

Teacher form displays course/template version,session/date/end time,computed deadline/basis,Draft/Submit buttons and save status. Zimmadar queue displays author/regular-or-substitute,submitted revision,compliance badge,Approve/Return with reason,revision comparison. Returned queue displays review reason and pending revision deadline policy. No invented course scores/required academic fields without approved form specification.

Guardian visibility is an unresolved publication policy,not automatically “all approved reports public”. D-090 private follow-up notes remain separate from class reports/Teacher academic notes and never spill into integrated progress D-172.

## 6. Workload, audit and operational reports

Track actual session hours separately D-040 and report workload D-039/137. Report late submission and reviewer pending are separate metrics;do not impose unapproved scoring weights or disciplinary penalties. Display original due,first valid submission time,on-time/late evidence,current revision/review status,reviewer and reminder history.

Official report/approval/revision resides in Academy Portal D-140. Telegram notification is not report submission or approval. Legacy1:1 data remains read-only AM-05/11;this draft does not assert the supplied MVP has these report states or create legacy write access.

Readiness:core approved noon times and lifecycle mapped;unanswered guards remain pending. No app tests executed,live records changed or gate advanced.
