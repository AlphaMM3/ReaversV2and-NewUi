# Screen/action ও end-to-end workflow — DRAFT

Source: D-053–131;AM-06/09/12–16। This is a functional specification,not a rendered UI redesign. Menu names are candidates;no site code changed.

## Teacher — class attendance

- Context:course,batch,actual session,teacher assignment,enrollment roster,held-evidence status. Show incomplete evidence separately,not auto-Absent.
- Inputs:Present/Absent/Late;join time/evidence where available;source/provider/manual provenance. Exactly15min Present,>15min Late;class-start anchor pending AFQ-04.
- Submit verifies attendance;server checks assigned class/active scope/version. Draft UX must not claim data saved until durable response.
- Correction shows existing value,new value,recorded reason/history,deadline and whether Zimmadar approval required. AM-16 correction clock is class-date-based,seventh day23:59 Bangladesh;date inclusion example pending until explicit reply.
- For expired cutoff,request approval mechanism is a technical proposal;the Teacher cannot silently change final attendance by editing request payload.
- Separate timer correction approval path D-041;do not reuse attendance cutoff to allow timer changes.

## Guardian — attendance/leave

- Child switcher scopes every query to authorized family membership;Primary/Secondary limits D-064–066.
- Attendance view:monthly percentage,held count,data completeness,calendar,class-wise history,approved leave D-083. Approved-leave Absent remains visible in denominator D-084.
- Notification preference per child:Instant/Daily/Weekly;optional secure Telegram link;Portal delivery remains when unlinked D-060–063.
- Official leave form:child,enrollment/class coverage,start/end,notice/emergency submission context;extra sensitive fields are not required merely by this draft.
- Validate14-calendar-day cap and individual past-class24h emergency window. Reject response shows Zimmadar's written reason;resubmit retains same notice history.
- Extension shows Zimmadar review and Supervisor final decision. Do not display a requested extension as effective approved leave.
- Leave-end Present OR Late -> Returned status;no separate return confirmation form or notification AM-14/D-078.
- Guardian contacts Class Teacher for wrong attendance;no dedicated Guardian correction request form D-079. Updated value/history appears on dashboard,no separate correction notification D-081.
- Guardian never sees private follow-up notes D-090. Academic progress integration cannot use a generic unfiltered “all notes” response.

## Zimmadar — review/absence cases

- Own-batch queues:leave review,attendance late corrections,first seven-class alerts,monthly follow-ups,overdue tasks.
- Case cards distinguish ABSENCE_STREAK vs LOW_ATTENDANCE,source month,enrollment,assignee,completion status,escalation,pause and deadline. Do not show a single ambiguous red “Absent” count across all courses.
- First absence case shows follow-up completion gate;additional misses while pending are factual attendance but not second-stage increments AM-06.
- Monthly dashboard Pending/Overdue/Completed/Escalated filters D-098;these views may overlap as derived dimensions and must not duplicate one case in totals.
- Bulk action:Teacher Reminder only D-099;Complete/Close must not have bulk action. Valid single-case manual-close authority/reasons still pending AFQ-11.
- Note privacy restricted;late edit approval must show before/after/version. Do not expose note body in broad notification previews.
- Post-cap new case requests and after24h reopen permission handled separately;reopen count2 guard server-side D-103–109.

## Supervisor and Management — escalation/plan/blocker

- Supervisor:escalated cases,remind/reassign,48h reassigned task,leave-extension final review,action-plan execution/progress,blocker resolver/priority assignment.
- Management:missed supervisor deadlines,plan request/review/return,self-authored plan exemption,reassignment/deadline overrides,blocker intervention.
- Actions show correct actor,current state,source decision,due-clock basis and audit reason. No blanket “Admin can do everything” control.
- Progress form fields:overall status,completed,pending,problems/blockers,next steps D-124.
- Blocker card:priority,resolver,due,override history,severity-specific escalation;reassigned escalated due is Management-chosen D-131.
- Plan/blocker finish actions remain disabled in spec until AFQ-11 defines acceptance authority;percentage recovery never closes these automatically.

## Flow A — seven missed held classes

Verified held enrollment attendance -> qualifying unauthorized sequence -> seventh threshold -> Zimmadar alert/designated contact -> completion evidence -> phase2 zero -> subsequent seven qualifying misses -> second escalation. Approved leave pauses/reset and correction replay are separate guards. First completion mechanism and post-break phase behavior remain explicit pending branches.

## Flow B — monthly warning and leave pause

Current-month enrolled held classes -> denominator includes approved-leave Absent -> at least3 and<75 -> warning to Guardian/Teacher/Zimmadar +3-day contact task -> leave effective:percentage stays visible,warning/case automation pauses,save remaining deadline -> leave ends:resume remaining -> contact notes submit:Completed. New-month at least3 held and>=75 closes only old pending LOW_ATTENDANCE,with history.

## Flow C — correction and race-safe update

Teacher selects own class -> server evaluates calendar cutoff -> within:versioned correction /after:Zimmadar-approved change -> recalculate affected month/streak -> close only unnecessary pending alerts -> invalidate stale pending jobs -> show Guardian corrected dashboard without separate correction notice. Retroactive approval/reopening/newly reached thresholds are gated by AFQ-03/06/10. Delivered notifications remain delivery evidence,not mutable truth.

## Flow D — reopen through blocker intervention

Completed low-attendance case -> valid authorized reopen(max2) ->24h task -> after cap request/new Zimmadar-approved3-day case ->3/6-day escalation -> Supervisor reassign48h -> further24h Management -> plan24h/reassigned12h/revision12h -> approved execution updates24h -> blocker Critical6h/High12h/Normal24h and respective escalation -> Management intervention. Every timer belongs to current assignment/cycle generation;old jobs cannot notify stale assignee.

## Audit/report output

Operational reports expose counts/status/deadlines/source snapshot and authorized assignment history;private note content requires D-090 permission independently. Monthly summary separates raw Held/Present/Late/Absent,approved leave coverage,missing verification,calculation version and enrollment. Reopen/assignment/override/pause history must explain why due time changed. Report/export permission remains separate D-059/186/191. No student/guardian identifiers are included in documentation examples.

## Resolved cutoff example — AM-16-C1 (v1.4.1)
Class local date +7 calendar days at23:59 Asia/Dhaka;31 October2026 class ->7 November2026 at23:59. Count starts the day after class;not elapsed168h. After cutoff Zimmadar approval required. Exact endpoint second precision remains AFQ-07. AFQ-01B is RESOLVED;supersedes earlier pending-example wording in this document only. Other pending questions remain unchanged.
