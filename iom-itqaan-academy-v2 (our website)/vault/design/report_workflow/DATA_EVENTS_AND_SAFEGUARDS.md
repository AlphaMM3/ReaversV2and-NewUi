# Report data/events and worker safeguards — TECHNICAL DRAFT

Logical entities only;no SQL tables,migrations,endpoints,framework or queue product selected. Exact field types,retention,indexes,required course form fields and permissions require architecture review.

| Candidate | Fields / invariant | Basis |
|---|---|---|
| ClassReport |report_id,session_id,course_id,batch_id,actual_author_teacher_id,lifecycle,current_revision,first_submitted_at,approved_revision | One logical report per actual report obligation;makeup owns separate session;uniqueness must support actual source workflow |
| ReportTemplateVersion |course_id,template_version,field_schema,effective_interval | D-032;required academic field approval pending;past submissions retain template snapshot |
| ReportRevision |report_id,revision_id,parent_revision,content_snapshot,author,recorded_at,submission_time,kind | D-044;Draft save is not submission;each submitted snapshot immutable in proposed model |
| ReportReview |submitted_revision_id,reviewer_role/scope,decision,reason,reviewed_at | D-033/044;Return reason mandatory;approve only current submitted revision |
| ReportDeadline |report_id,deadline_version,basis_rule,class_start/end_snapshot,due_local_date/time,timezone,due_at,policy_refs | AM-04/07/08;actual-end correction needs approved provenance;missing evidence not guessed |
| SubmissionCompliance |first_valid_submission_ref,due_version,on_time_or_late,evaluation_version | AM-17;review status separate;boundary RQ-02;deadline correction historical outcome RQ-06 |
| ReportEscalationJob |report_id,obligation_kind,deadline_version,stage,recipient,channel,delivery_state | AM-08 initial-noon obligation only;returned revision clock is separate RQ-04 |
| ReportAudit/Outbox |actor/scope,old/new state,revision,cause,correlation,occurred_at,recorded_at,policy_refs | D-044/162;no content leakage to broad audit exports/Telegram |

## Event contract candidates

- `ClassEnded` -> stop timer/create or open correct report obligation idempotently;not submit automatically.
- `ReportDraftSaved` -> persist draft version only;deadline/compliance unaffected.
- `ReportSubmitted` -> validate actual author and template,persist immutable revision,first_valid_submission timestamp and AwaitingReview atomically;derive compliance separately.
- `ReportReturned` -> Zimmadar reason + review revision;create revision duty,not delete first submission compliance.
- `ReportResubmitted` -> current returned lineage;review queue for new version;cannot approve old revision accidentally.
- `ReportApproved` -> Zimmadar-reviewed version and audit;does not change actual submission timestamp.
- `ReportDeadlineChanged` -> only from authorized evidence correction with explicit pending policy;retain previous version and deliveries.
- `ReportReminderDue` -> check current actual obligation and deadline revision before sending;timely-submitted awaiting-review skips initial late job AM-17.

Envelope proposal:event_id,aggregate_id,aggregate_version,cause/correlation,scope,actor,occurred_at,recorded_at,policy_refs. Use server-validated durable submission time;client UI click/Telegram timestamp is not automatically authoritative. Offline submission/outage grace RQ-11.

## Idempotence and race handling proposal

Candidate job uniqueness `(report_id,obligation_kind,deadline_version,stage,recipient,channel)`;candidate report submission key+revision prevents duplicate double-click reports. Within transaction authorize/compare expected version,persist revision+review/compliance changes+outbox. Concurrent review must target current submitted revision;stale approval cannot bless later content. Submitted content changed after review requires a new authorized workflow,not in-place mutation.

Before send re-read obligation,current revision/compliance,deadline version,recipient assignment and case policy. Timely valid submission suppresses pending missing-report jobs. Already delivered alerts remain historical facts;late-submission closure/recovery notification policy RQ-05. Exact simultaneous submit/deadline/send precedence RQ-02/07;worker queue order cannot decide policy.

Retry may ensure durable processing with proposed uniqueness;it does not prove exactly-once Telegram delivery. Restart after several missed stages needs RQ-07 catch-up policy;do not blindly send every missed stage in a burst. Channel selection for report/staff alerts needs RQ-12;AM-08 approves actors/times,not necessarily every delivery channel.

## Impact on other domains

- Attendance/correction/leave pause rules do not automatically pause report deadlines. AM-12 is student attendance/follow-up policy,not blanket staff-report exemption.
- Teacher leave/substitute changes actual author responsibility per D-038;postassignment report duty transfer requires RQ-09.
- Manual class-time changes D-041 may affect report deadline and compliance;before enabling recomputation resolve RQ-06.
- Cancelled/unheld class/report necessity,especially cancellation after EndClass,requires RQ-06;no speculative report deletion.
- Student/Guardian data and private follow-up notes remain protected;progress read contract RQ-10.
- Reports must retain source-system provenance for any legacy projection. Academy new workflow cannot write into legacy manager/payment portal.
