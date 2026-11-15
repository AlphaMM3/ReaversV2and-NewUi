# Logical data, invariants and event contracts — REVIEW DRAFT

No physical table,migration,queue,endpoint or framework is created/selected here. Existing schema skeleton remains logical only. Academy owns new academic records;original1:1/payment data stays read-only external authority AM-05. Every candidate relationship is scoped to explicit enrollment/record authority.

## Candidate aggregates and fields

| Candidate | Minimum proposed fields / relationship | Invariant / source |
|---|---|---|
| ClassSession | id,batch_id,scheduled_at,actual_started_at,actual_ended_at,status,held_evidence_ref,version | Dates/timestamps not inferred from missing row;D-040/041/053;held gate AFQ-02 |
| Enrollment | id,student_id,course_id,batch_id,effective_from,effective_to,status,history_ref | AM-09/15;exact interval inclusivity and transfer scope AFQ-08;not unique Student+Month |
| TeacherAssignment | session/batch_id,teacher_id,regular/substitute,valid_interval | D-020/036–039;who actually taught determines own-class edit rights |
| AttendanceEntry | enrollment_id,session_id,status,joined_at,source,verification_actor,verified_at,version | Unique logical enrollment/session;Present/Absent/Late only D-054;provider source not final until verified |
| AttendanceRevision | entry_id,from_version,to_version,before,after,reason,actor_id,at,approval_ref | D-058/080/082;no in-place history erasure;own-class/cutoff authorization |
| CorrectionApproval | record_type,record_id,proposed_change,requested_by,approver_id,status,decision_at | Timer,attendance,note approval types separate D-041/080/091;request UI draft |
| LeaveRequest | child/enrollment coverage,submitted_at,start_date,end_date,status,reviewer_id,decision_at,reason,version | D-067–075;enrollment-specific effective coverage needs AFQ-08;request is not approved coverage |
| LeaveExtension / Coverage | original_request_id,review_ref,supervisor_approval_ref,effective_intervals,covered_session_refs | D-071/075;coverage must respect past-class submission deadline |
| AbsenceProjection | enrollment_id,phase,phase1_count,phase2_count,first_case_id,first_completed_at,pause_ref,last_event_key,calculation_version | D-019/056/057;AM-06/09;counter recomputable from facts;reset versuscase lifecycle AFQ-06 |
| MonthlyAttendance | enrollment_id,month,held,present,late,absent,missing_verified_count,calculation_version | D-084/095/096;AM-15;no unsupported finalized percentage with incomplete facts |
| AttendanceWarning | enrollment_id,month,cycle_key,trigger_snapshot,created_at,recipient_refs,notification_refs | D-085/086/093;repeat cycle key proposal;retain old cases |
| FollowupCase | id,kind,enrollment_id,warning_ref,assigned_teacher_id,lifecycle,cycle_kind,reopen_count,escalation_tier,completed_at,closed_reason,version | D-087–112;absence versus low-attendance kinds separate;D-094 closure only LOW_ATTENDANCE |
| FollowupNote / NoteRevision | case_id,contact_date,guardian_statement,next_steps,submitted_at,editor_id,revision,approval_ref | D-089–092;strictly private;not same as Guardian-visible class notes D-172 |
| DeadlineClock | aggregate_ref,rule_id,anchor,unit,due_at,remaining,paused_intervals,generation,revision,policy_ref | D-087–131/AM-12;calendar and held-count clocks different |
| AssignmentHistory | case/plan/blocker_ref,old_actor,new_actor,changed_by,changed_at,new_deadline,reason,version | D-110–131;new assignment does not overwrite old history |
| ActionPlan / PlanRevision | management_request_ref,author_ref,owner_supervisor,content,status,submitted_at,approval_ref,version | D-113–124;Management self-authored exemption explicit |
| ProgressUpdate | plan_id,overall_status,completed_tasks,pending_tasks,blockers,next_steps,at,actor | D-122–124;update history immutable |
| Blocker / BlockerHistory | plan_ref,status,severity,resolver_id,reported_at,assigned_at,due_at,override_ref,resolution_history,version | D-125–131;resolution authority/clock anchor pending |
| NotificationJob / Delivery | aggregate_ref,rule_ref,cycle_generation,deadline_version,recipient_id,channel,delivery_state,provider_ref | D-060–063/086/088/099/100;outbox retry not proof of delivery |
| AuditLog / Outbox | correlation_id,cause_event_id,actor_id,scope,record_version,policy_refs,occurred_at,payload_classification | D-092/162;private notes not blindly copied into logs/Telegram |

Data type/index/retention/encryption/storage-finalization choices need later schema/stack review. Proposed unique keys must be tested against transfer/makeup/multiple-session rules;do not enforce person/date uniqueness and lose sessions. Amounts/payment confirmation are outside this design.

## Recalculation transaction proposal

Authorize correction -> compare expected record version -> lock relevant enrollment projections -> append revision/approval -> recompute streak and month from current facts -> derive justified pending-case closure -> append case/deadline revisions + notification invalidation/outbox -> commit. After commit worker publishes from durable outbox.

Derived projections never rewrite original attendance/leave history. Completed contact cases do not become “never existed”;unnecessary pending alerts may close per D-082. Already delivered notifications cannot be unsent by deleting a row;retention behavior for retroactive leave is AFQ-03 unless explicitly approved in current answers.

Recalculation must observe enrollment interval,case kind,case lifecycle,leave effective dates,first-follow-up completed_at and source revision. Reprocessing same event/version must not add duplicate alert/case. Corrections that newly CREATE an earlier threshold crossing,or reopen an auto-closed case,are AFQ-06/10;D-082 only explicitly grants recomputation and closing unnecessary pending alerts.

## Candidate event inventory

| Event | Producer / fact | Consumers / constraints |
|---|---|---|
| AttendanceVerified | Assigned Teacher-verified entry | Recompute enrollment/month and eligible streak;held evidence gate first |
| AttendanceCorrected | Authorized revision/approval | Recompute impacted projections;cancel only justified pending work;D-082 |
| LeaveApproved / LeaveEffective / LeaveEnded | Zimmadar/approved extension + effective time | Coverage,percentage preserved,pause/resume and counter reset;AFQ-03/08/09 |
| FirstAbsenceFollowupCompleted | Authorized completion mechanism | Open phase2 cutover only;not triggered by reminder/acknowledgement;AFQ-05 |
| LowAttendanceThresholdEvaluated | Current complete monthly snapshot | Create/repeat/suppress/close LOW_ATTENDANCE only under policy and pause guards |
| FollowupNoteSubmitted | Current assigned authorized Teacher | Complete case;private note payload stays scoped;D-102 |
| FollowupReopened | Authorized time/cap check | New24h generation;cancel old completed-cycle jobs;D-103–106 |
| FollowupNewCaseApproved | Zimmadar decision after request | New linked3-day case;not a third reopen;D-107–109 |
| FollowupReassigned / DeadlineChanged | Supervisor/Management source authority | New assignee/current generation;preserve old version;D-110–113 |
| ActionPlanRequested/Submitted/Returned/Approved | Correct source actor | Timer generations,approval exemption,execution/progress ownership;D-114–124 |
| BlockerReported/Prioritized/Assigned/Resolved | Source-permitted actors;resolution pending | Severity timers/overrides/alerts;D-125–131;no invented resolution actor |
| DeadlineReached | Worker against durable current clock | Recheck terminal,pause,version,assignee,recipient and authorization before send |

Every envelope proposes event_id,aggregate_id,aggregate_version,occurred_at,recorded_at,cause/correlation,policy_refs and scope. External/import occurred_at must have provenance;replay is not permission to issue historical notifications. Final serialization/API transport intentionally unselected.
