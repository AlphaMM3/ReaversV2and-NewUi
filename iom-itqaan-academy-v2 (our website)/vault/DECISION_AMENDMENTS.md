# Explicit Later Decisions / Amendments (append-only; planning scope)

> **Status:** These entries reflect explicit user statements in the planning conversation dated 2026-10-30. They are **not** evidence that software was implemented. If precision is ambiguous, leave it PENDING.

| Amendment | Affected D-ID(s) | Status | Scope explicitly clarified/approved | Evidence location |
|---|---|---|---|---|
| AM-01 | D-019, D-056 | USER_CLARIFIED | First absence alert after **7 consecutive actually held classes** missed without approved leave/permission; do not count 7 calendar days. | User messages in Oct 30 planning conversation |
| AM-02 | D-057 | USER_APPROVED | Second escalation after **7 more consecutive unauthorized missed held classes after first follow-up**, not 7 calendar days. | Latest user message, 2026-10-30 |
| AM-03 | D-025 | USER_CLARIFIED | Dedicated department/section for fixed-duration group/batch single courses; ordinary group batches and 1:1 sections remain distinct navigation/delivery options. | User planning clarification, 2026-10-30 |
| AM-04 | D-034, D-035, D-043 | USER_APPROVED | Report dates measured in Asia/Dhaka; ordinary class same-day 23:59 deadline; classes ending at/after 23:00 have next-day 12:00 deadline; overdue escalation progresses by 18:00. Exact intermediate steps remain pending. | User planning approval and late-night exception, 2026-10-30 |
| AM-05 | D-167–175 | USER_APPROVED | **Read-only** integration to legacy 1:1 manager. Existing project unchanged; do not overwrite legacy class/contract records. Existing payment portal remains separate source for payment confirmation. | User explicit approval, 2026-10-30 |

## Not approved by inference
- Historical proposal status for intermediate report reminders is superseded only by Q3 / AM-08 below.
- Exact sync interval (e.g., 15 min) is **proposed, not approved**.
- One-to-one account single sign-on is **not** approved; D-169 says separate guardian login.
- Original D-072/073 leave pause/reset remains in force; precise interactions to be tested.
- No change to source decision's original wording or prior approval evidence is implied.

## User selections recorded 2026-10-31 (append-only clarification)

Evidence: user selections Q1=B; Q2=A; Q3=A; Q4=A; Q5=A; Q6=A in referenced chat `6ae1412d-861c-83ee-a05a-2ad6b113b69e`, repeated in this update request. Date above is recording date, not an invented historical approval timestamp. Earlier entries remain historical context; these amendments control the six specific details.

| Amendment | Question / selection | Related decisions | Status | Approved scope |
|---|---|---|---|---|
| AM-06 | Q1=B | D-057 | USER_APPROVED | Second escalation counts the next 7 consecutive unauthorized missed held classes only after the first follow-up is completed. Keep existing approved-leave pause/reset rules; calendar days are not the counter. |
| AM-07 | Q2=A | D-034, D-043 | USER_APPROVED | For a class ending after midnight, the report deadline is 12:00 noon on that same Bangladesh calendar date (Asia/Dhaka). This clarifies AM-04; other established deadline rules remain unchanged. |
| AM-08 | Q3=A | D-035 | USER_APPROVED | Approve the proposed overdue-report schedule: Teacher Reminder 12:05, Batch Zimmadar Alert 14:00, Supervisor Escalation 16:00, Management Escalation 18:00, Asia/Dhaka, after the applicable report deadline. Do not invent an additional schedule for other deadline windows. |
| AM-09 | Q4=A | D-019, D-056, D-057, D-148 | USER_APPROVED | Attendance and absence counters are separate for each course enrollment. Do not merge a student's enrollment counters. |
| AM-10 | Q5=A | D-169, D-170, D-172 | USER_APPROVED | Provide a safe link from the existing 1:1 Guardian Portal to Academy Progress. Preserve the separate guardian login; this does not approve SSO, shared credentials, or legacy writes. |
| AM-11 | Q6=A | D-167–175 | USER_APPROVED | Permission to receive and inspect a safe source-code/database-schema copy for a read-only technical audit. Permission alone is not audit completion, deployment permission, or permission to modify the legacy system. |

## Attendance design reconciliation — recorded2026-10-31

AM-12..15 record EXISTING Oct23 user approvals recovered from the original chat,not approvals inferred from this task. Evidence: `evidence/RECOVERED_ATTENDANCE_APPROVALS.json`. AM-16 and any subsequent entries record explicit current replies only. Original201 source text stays unchanged. Old C-03 second-calendar-day statement is superseded by later AM-02/06 and is NOT restored. No original proposal is approved.

|Amendment|Affected decisions|Status|Effective scope|Evidence|
|---|---|---|---|---|
|AM-12|D-072,D-084,D-085,D-086,D-087,D-088,D-093|USER_APPROVED|C-01:approved leave keeps percentage visible;warning/automatic follow-up/escalation paused;pending low-attendance follow-up resumes remaining time after leave,not full fresh deadline.|Verified Oct23 direct reply user 01a167d1-01be-7521-8841-3154931adbf7 plus context and ok user 01a167d3-6b07-77f2-b91e-24e2c07c6ecc in thread 01a16527-fac5-7042-8337-d2defc08c93d|
|AM-13|D-094,D-095,D-096,D-097|USER_APPROVED|C-02:new month at least3 held classes and attendance>=75% closes previous-month pending LOW_ATTENDANCE follow-ups only;history retained;not absence cases/action plans.|Verified Oct23 direct reply user 01a167d1-01be-7521-8841-3154931adbf7 and immediate context|
|AM-14|D-073,D-077|USER_APPROVED|C-05:postleave verified Present OR Late marks Returned;original Present-only wording preserved as historical source.|Verified Oct23 proposal context plus ok user 01a167d3-6b07-77f2-b91e-24e2c07c6ecc|
|AM-15|D-084,D-095,D-096,D-148,D-157,D-158|USER_APPROVED|C-10:count held classes only while relevant enrollment is effective;transfer instant/overlap/same-day boundary details remain pending.|Verified Oct23 proposal context plus ok user 01a167d3-6b07-77f2-b91e-24e2c07c6ecc|
|AM-16|D-058,D-080|USER_APPROVED|Attendance direct-correction deadline is class-date-based seventh-day23:59 Asia/Dhaka,not elapsed7x24h;after cutoff Zimmadar approval. Exact class-date inclusion example remains pending unless answered below.|Current user answer: ক্লাসের তারিখ ধরে সপ্তম দিনের রাত ১১:৫৯ পর্যন্ত|

## AM-16-C1 — explicit cutoff date inclusion, recorded2026-10-31

- Affected:D-058,D-080;clarifies AM-16 only. Status:USER_APPROVED.
- Exact user answer:“৭ নভেম্বর রাত ১১:৫৯—ক্লাসের পরের দিন থেকে সাত দিন” to the31Oct example.
- Class local date +7 calendar days at23:59 Asia/Dhaka;31 October2026 class ->7 November2026 at23:59. Count starts the day after class;not elapsed168h. After cutoff Zimmadar approval required. Exact endpoint second precision remains AFQ-07.
- AFQ-01B resolved for date inclusion only;no other pending decision or held/retroactive policy approved.

## AM-17 — Report submission versus review, recorded2026-10-31

- Affected:D-033,D-034,D-035,D-043,D-044. Status:USER_APPROVED.
- Exact current user answer:“submission deadline ও review status আলাদা থাকবে”. Question context:timely submission while Zimmadar approval pending should stop Teacher late-report reminders;submission and review treated separately.
- Initial submission deadline and review status are separate. Timely valid Teacher submission must not receive late-report reminders solely because Zimmadar approval remains pending. No review SLA,returned-report deadline or late-arrival closure policy inferred.
- Return+24h proposal remains PENDING;not approved by this reply.

## AM-18 — Native1:1 redesign direction, recorded2026-10-31

- Affected:D-167/168/170/173/174 and AM-05 as-is/read-only-only target restriction. Status:USER_APPROVED_DIRECTION.
- User explicitly withdrew “সেটা যেভাবে আসে সেভাবেই থাকবে” and requested new planning/design/execution plan integrated with main site.
- User withdraws prior requirement to retain existing1:1 application/workflow as-is and requests fresh1:1 design/planning aligned with main Academy plus execution plan. New native module/replacement planning is authorized;read-only integration is no longer the sole target architecture. Existing source remains historical/migration evidence. No automatic permission for destructive/live migration,deployment,payment-portal writes,SSO or unapproved commercial rules.
- Supersession is LIMITED:the old manager need not define the future module implementation/workflow. D-169 separate Guardian login,D-015/171 separate payment collection,Q1–Q6 approved scopes and other approved policies are not broadly revoked. AM-10 legacy-link approach becomes transition-specific,not the sole long-term native progress design. Any new auth decision must be explicit.
- Prior entries/source wording preserved for history;no source reference edited. Plan contents are recommendations until specifically approved.

## AM-19 — One Guardian login/dashboard,recorded2026-10-31

Affected:D-010,D-064,D-066,D-169,D-170,D-172;limited supersession of prior separate1:1 login clauses. Status:USER_APPROVED. Exact user answer:“হ্যাঁ, একটি Guardian login/dashboard” to the explicit question covering all children,Batch and1:1.

New Academy Guardian access uses one login/dashboard across linked children and Batch/1:1 classes/progress. This explicitly supersedes D-169 separate1:1 Guardian login and corresponding AM-05/10/18 preservation language for the NEW target system only. Preserve own-child access,Primary/Secondary distinct identities/permissions,D-090 note privacy and all unrelated approvals. No automatic legacy credential merge,shared password,production migration or SSO implementation approved.
