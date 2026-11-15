# TESTING & REVIEW — Decision-linked Quality Skeleton

**No test execution claimed.** Candidate acceptance tests below are requirements to write, not results.

| Test ID | Decision | Scenario / expected |
|---|---|---|
| AT-055-A | D-055 | Exactly 15 min late => Present |
| AT-055-B | D-055 | More than 15 min (e.g., 15m01s) => Late |
| AT-019-01 | D-019/D-056 + AM-01 | 6 consecutive unauthorized held misses => no 7-class alert; 7th => alert |
| AT-057-01 | D-057 + AM-02 | After first follow-up, 6 additional consecutive held misses => no second escalation; 7th => escalation |
| AT-072-01 | D-072..073 | Approved leave pauses absence follow-up and resets counter after leave, yet held class remains Absent in monthly attendance denominator |
| AT-084-01 | D-084..096 | Attendance=(Present+Late)/Held; warning only with >=3 held classes and <75% |
| AT-033-01 | D-033/D-044 | Submitted class report must receive Zimmadar approval or returned reason, revision history retained |
| AT-047-01 | D-047 | Substitute on unchanged time/link => no separate guardian substitute notification |
| AT-080-01 | D-058/D-080 | Teacher may edit attendance <=7d, late edit needs Zimmadar approval, all audited |
| AT-065-01 | D-064..066 | Primary guardian can manage secondary; secondary cannot manage guardians |
| AT-015-01 | D-015/D-141 | Academy cannot confirm or mutate payment record in legacy payment system |
| AT-169-01 | D-169 | Separate 1:1 guardian login retained |
| AT-RPT-01 | D-034/D-035 + AM-04 | Ends 22:59 => normal same-day deadline; ends 23:00 => next-day noon; BD timezone |
| AT-RPT-02 | D-035 + AM-04 | Noon overdue report:12:05 Teacher,14:00 Zimmadar,16:00 Supervisor,18:00 Management (AM-08);timely submission separate from review (AM-17) |
| AT-201-01 | D-180/D-201 | No production live release without department UAT and central approval |

## Additional test suites to prepare
Role/branch scope, malicious ID swapping, file access privacy, event idempotency, duplicate payment import, DST scheduling, retry/failure, schema migration rollback, restore backup, performance, manual human UAT.

## Quality gates
- Every feature PR links D-ID(s) and affected document references.
- Independent reviewer checks authorization, sensitive data exposure, idempotence, concurrency, ledger correctness and migrations.
- CI executes tests, lint, type/static checks, security/dependency scanning as chosen for stack.
- Stage/parallel release captures UAT and approved launch records.

## Attendance design v1.4
Attendance candidate scenarios: `design/attendance_followup/ACCEPTANCE_SCENARIOS.json`;all NOT_RUN. AM-06 completion prerequisite and recovered AM-12..15 govern related old examples;AT-RPT-02 old pending wording remains superseded by AM-08,not changed by this attendance task.

## Report design v1.5 — DRAFT
Report candidate scenarios;all NOT_RUN: `design/report_workflow/README.md`. No implementation or new unresolved policy approval implied.
