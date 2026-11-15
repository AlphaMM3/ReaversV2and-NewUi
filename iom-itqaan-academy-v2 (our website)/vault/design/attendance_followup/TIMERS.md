# Deadline and reminder registry — DRAFT

Policy labels distinguish calendar days,held-class counts and duration-hours. No use of24h×7 for AM-16 correction cutoff. No conversion of D-057 into calendar days. Bangladesh calendar is used for calendar month/correction rule;storage timestamp/worker choice remains technical design.

| ID | Clock / anchor | Deadline / recipient / escalation | Pause/terminal guard | Source |
|---|---|---|---|---|
| TM-01 | Phase1 eligible held-class sequence |7th consecutive unauthorized miss -> Zimmadar alert/designated Teacher task | No increment on leave/unheld/cancelled;per enrollment | D-019/056;AM-01/09 |
| TM-02 | Phase2 sequence AFTER first follow-up completion |7 subsequent consecutive qualifying misses -> Zimmadar reminder/Supervisor escalation | No phase2 increment while first follow-up pending;leave/reset/case phase AFQ-06 | D-057;AM-02/06 |
| TM-03 | Attendance correction from class DATE | Seventh calendar day23:59 Asia/Dhaka,not elapsed168h | Exact class-day inclusion example AFQ-01B if unanswered;after cutoff Zimmadar approval | D-080;AM-16 |
| TM-04 | Emergency absence notice from class end | Within24h submission | Notice creation deadline,not guaranteed approval completion deadline | D-070/071 |
| TM-05 | Single leave notice date range | Maximum14 calendar days | Extension process for longer;inclusive date-range detail AFQ-08 | D-074/075 |
| TM-06 | LOW_ATTENDANCE warning_at | Contact/notes within3 days;at3 days Teacher reminder+Zimmadar;another3 days Supervisor | AM-12 pause;exact day versus hours and boundary AFQ-07 | D-087/088 |
| TM-07 | Warning repeat cadence | Every7 days while<75% and sample>=3 | Effective leave suppresses warnings;cadence resume/missed cycles AFQ-09 | D-093/096;AM-12 |
| TM-08 | Current month Bangladesh calendar | At least3 held before warning;current month percentage | Enrollment effective interval AM-15;prior pending preserved | D-095–097 |
| TM-09 | New-month closure eligibility | New month>=3 held and>=75% -> prior-month pending LOW_ATTENDANCE close | Not absence/action-plan/blocker case;history kept | AM-13 |
| TM-10 | Note submitted_at | Teacher edit within24h;later Zimmadar approval | Submitted history preserved;exact inclusive boundary AFQ-07 | D-091/092 |
| TM-11 | Case completed_at | Teacher direct reopen within24h;later permission;cap2 | Closed auto-closure is not automatically same as Completed for reopen | D-103/106;AFQ-11 |
| TM-12 | Reopened_at | Complete within24h;overdue Teacher reminder+Zimmadar alert | Current active cycle only;AM-12 applicability to low-attendance case | D-104/105 |
| TM-13 | New approved case approved_at | Complete3 days;at3d Teacher+Zimmadar;6d Supervisor | Linked new case,not third reopen | D-108/109 |
| TM-14 | Follow-up reassigned_at |48h Teacher+Supervisor;another24h Management | Old cycle jobs invalidated;AM-12 for relevant case;precise clock replay AFQ-09 | D-111/112 |
| TM-15 | Management plan requested_at | Supervisor plan24h;missing -> Management alert/reassignment | No invented student-leave pause | D-114/115 |
| TM-16 | Reassigned plan assignment_at | New Supervisor/Staff plan12h;failure -> Management intervention | New assignment generation;no inherited old assignee notification | D-116/117 |
| TM-17 | Plan returned_at | Revision12h;failure -> Management alert | Superseded revision jobs stale | D-119/120 |
| TM-18 | Approved plan/update cycle | Progress at least every24h until plan finished | No invented end-state approval;AFQ-11 | D-122/123 |
| TM-19 | Blocker reported/assigned anchor | Critical6h,High12h,Normal24h;Management can override | Precise initial clock anchor and reprioritization behavior AFQ-07/09 | D-127/128 |
| TM-20 | Blocker due_at | Critical overdue immediately Resolver+Supervisor+Management | Current unresolved blocker/version only | D-129 |
| TM-21 | High/Normal blocker due_at | Due -> Resolver reminder+Supervisor;another6h Management | Reassignment/resolution/current generation checks | D-129 |
| TM-22 | Escalated blocker reassignment | New due chosen explicitly by Management | Never default6h/12h/24h against Management choice | D-130/131 |

## Pause/resume model (technical proposal implementing AM-12)

For relevant pending LOW_ATTENDANCE follow-up deadline,save `remaining_duration` at effective pause start and `paused_at`;resume at leave end with saved remaining,not original full3 days. Example illustrative: a3-day contact clock has1 day left at leave start;after leave it still has1 day,not3. D-072 separately pauses absence escalation and D-073 resets its counter;never convert held-class counter into remaining hours.

Technical fields may use seconds for hour durations and a calendar-rule object for calendar units;exact day-unit interpretation must be resolved before calculating3/6-day dates. Store policy version,original anchor,original deadline,current deadline,pause periods and revision cause.

Do not assume pause makes a completed/closed case pending again. Overdue-before-leave behavior,repeat warning cadence,overlapping extensions,retroactive approvals and whether already escalated Management-stage plan clocks pause are AFQ-03/09. No leap from a student's leave to globally pausing all blocker/action-plan deadlines.

## Worker safeguards — proposed mechanism

1. Durable job key `(aggregate_id,cycle_generation,rule_id,deadline_version,recipient,channel)` or equivalent reviewed uniqueness;NOT just Student ID.
2. Immediately before send,read current account/scope,case lifecycle,pause,assignee,deadline revision and applicable calculation revision.
3. Completed/closed/stale/superseded jobs are recorded as skipped/cancelled;do not delete delivered audit history.
4. Event/outbox transaction and retry make processing idempotent locally. Exactly-once external Telegram delivery is not promised;provider acknowledgements/retry ambiguity require integration design.
5. Near-deadline completion/correction and same-time worker race need transaction/locking and boundary rule;an arbitrary worker arrival order cannot decide business policy.
6. Recipient/channel preferences for attendance summaries (D-060–063) do not suppress mandatory staff escalations. Whether urgent Guardian low-attendance warning bypasses Daily/Weekly preference remains AFQ-13.

## Resolved cutoff example — AM-16-C1 (v1.4.1)
Class local date +7 calendar days at23:59 Asia/Dhaka;31 October2026 class ->7 November2026 at23:59. Count starts the day after class;not elapsed168h. After cutoff Zimmadar approval required. Exact endpoint second precision remains AFQ-07. AFQ-01B is RESOLVED;supersedes earlier pending-example wording in this document only. Other pending questions remain unchanged.
