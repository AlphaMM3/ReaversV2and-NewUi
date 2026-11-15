# Attendance/Follow-up permission matrix — source-grounded DRAFT

Every action also checks active account,active assigned role,current Branch/Department/Batch scope,record relationship,state,and policy version. Server authorization required even if button hidden. D-022/059/090/187–191 apply. “Automation” executes approved deterministic rules,not a human approval.

`PENDING` is not allow. Central Admin account-management power is not blanket Zimmadar/Supervisor academic authority. Broad Management titles require explicit scope assignment. Separate legacy Guardian login remains AM-05/10;no new legacy write path.

| Action | Actor / record scope | Time/state/approval guard | Denied / pending | Basis |
|---|---|---|---|---|
| Record/verify attendance | Assigned Teacher for own class | Verified eligible session;Present/Absent/Late | Guardian cannot write;unrelated Teacher denied | D-053/054/058 |
| Direct attendance correction | Teacher own class | AM-16 calendar-date cutoff;versioned before/after | Later requires Zimmadar;cutoff date inclusion example pending if unanswered | D-058/080;AM-16 |
| Approve late attendance correction | Batch Zimmadar of record | Teacher correction proposal;validated approval audit | Direct Guardian/Teacher bypass denied;approval UI is draft | D-080 |
| Manual timer correction | Teacher requests;Batch Zimmadar approves | Separate record and approval even when attendance edit allowed | Attendance7-day direct-edit permission does not bypass timer approval | D-041 |
| Read child attendance/leave summary | Primary/Secondary Guardian linked child | Active family relationship;only permitted fields | Other family denied;private notes never included | D-059/066/083/090 |
| Read staff attendance reports | Authorized Staff/Management in scope | Explicit report permission and hierarchy | Mere role title not sufficient;export permission separately checked | D-059/186/191 |
| Configure attendance notices | Guardian per child | Instant/Daily/Weekly;Telegram optional | Sibling settings independent;Secondary configuration authority pending if not covered by approved family policy | D-060–063/066 |
| Manage Secondary Guardian | Primary Guardian own family | Add/Edit/Remove without Admin approval | Secondary/other family denied | D-064–066 |
| Submit official student absence | Primary/Secondary Guardian linked child | Portal only;class-before or emergency<=24h after end;range<=14days | Telegram message alone denied as official request | D-066–074 |
| Approve/Reject student absence | Batch Zimmadar only | Record in assigned batch;rejection reason required | Teacher/Supervisor cannot substitute for this approval solely by title | D-068/069 |
| Review leave extension | Related Batch Zimmadar | >14days extension request | Not final approval by this review | D-075 |
| Final approve extension | Related Department Supervisor | Zimmadar-reviewed extension | Guardian/Teacher/Zimmadar cannot finalize alone | D-075 |
| Mark Returned | Automation from verified attendance | After leave,Present OR Late | No separate confirmation form or return notification | D-077/078;AM-14 |
| Send seven-class first alert | Rule worker candidate | Eligible enrollment threshold and no leave pause | No calendar-day substitute;one eligibility snapshot per emitted crossing | D-019/056;AM-01/09 |
| Contact Guardian for absence | Designated Teacher under Zimmadar oversight | Relevant case/enrollment | First-case completion mechanism AFQ-05;no auto-completion just from reminder | D-018/056;AM-06 |
| Submit LOW_ATTENDANCE follow-up note | Current assigned Class Teacher | Contact date,Guardian statement,next steps | Unrelated Teacher/Guardian cannot submit on behalf | D-087/089/102 |
| Read private follow-up note | Related Teacher,Zimmadar,Supervisor,Authorized Management | Branch/Department/record relationship | Guardian,unrelated Staff,Finance-only denied | D-090 |
| Edit submitted follow-up note | Authorized Teacher of case | Within24h submission;later Zimmadar approval | Never overwrite old version;exact inclusive boundary AFQ-07 | D-091/092 |
| Send bulk Teacher reminder | Batch Zimmadar | Selected cases within authorized batches;one delivery per current job key | No bulk Complete/Close | D-099/100 |
| Acknowledge reminder | Assigned Teacher | Optional | Not a prerequisite to completing follow-up | D-101 |
| Reopen completed LOW_ATTENDANCE case | Teacher within24h completion;later Zimmadar permission | Reopen_count<2;Completed case;source cycle policy | Third reopen denied;cross-kind extension AFQ-05 | D-103–106 |
| Request new case after reopen cap | Teacher | Linked old case with2 reopens | Teacher request is not creation approval | D-107 |
| Create/Approve requested new case | Related Batch Zimmadar | Review request;new linked case3-day due | No bulk case completion implied | D-107–109 |
| Reassign escalated follow-up | Related Department Supervisor | Escalated case;new Teacher scope checked | Preserve assignment history;old assignee note visibility AFQ-12 | D-110–112 |
| Request plan / change deadline / reassign at Management stage | Authorized Management | Management intervention evidence;source scope | Central Admin without Management authority not automatically allowed | D-113 |
| Submit/revise action plan | Assigned Supervisor/Staff |24h initial /12h reassigned or revision as applicable | Wrong assignee or wrong plan state denied | D-114–120 |
| Approve/Return staff-authored plan | Authorized Management | Return reason/version proposed;Staff-authored plan requires approval | Author cannot self-approve merely because Supervisor | D-118/119 |
| Management-authored plan | Authorized Management | Own plan does not need separate approval | Action remains audited | D-117/118 |
| Execute approved plan / progress updates | Responsible Department Supervisor | Approved/in-progress;updates at least24h | Completion acceptance authority AFQ-11 | D-121–124 |
| Assign blocker resolver / priority | Related Department Supervisor | Existing blocker;authorized target identity | Management override separately audited | D-125/126/128 |
| Override blocker / change deadline / direct intervention | Authorized Management | Record justification and prior value in audit draft | No hard-coded reassigned SLA when source calls for Management choice | D-127/130/131 |
| Resolve blocker / manually close case / finalize plan | PENDING precise actor/reason matrix | AFQ-11 | D-099 bulk constraint alone is not a blanket manual-close grant | D-099/121/125 |
| Recalculate derived counters/cases | Authorized rule worker candidate | Source revision/leave policy/event version | No worker may invent missing attendance or approve leave | D-082/094;AM-12/13;AFQ-03 |

Privacy: notification payloads contain task/status/context only;private note text is not copied into Guardian notifications,Telegram messages or broad Management summaries. Exact minimal payload fields and Telegram identity binding are design review items,not newly approved channel policy. Reassigned/outgoing staff access must be explicitly reconciled with D-090 and active record responsibility (AFQ-12).

## Resolved cutoff example — AM-16-C1 (v1.4.1)
Class local date +7 calendar days at23:59 Asia/Dhaka;31 October2026 class ->7 November2026 at23:59. Count starts the day after class;not elapsed168h. After cutoff Zimmadar approval required. Exact endpoint second precision remains AFQ-07. AFQ-01B is RESOLVED;supersedes earlier pending-example wording in this document only. Other pending questions remain unchanged.
