# IOM Academy — দুই version ও V1/V2 কাজের পরিকল্পনা

তারিখ: 2026-11-04 · এটি delivery proposal ও source handoff; নতুন business-policy approval নয়।

## মূল সিদ্ধান্ত

**একটি সহজ online academy app**: একই জায়গায় batch course, single course ও native basic 1:1; admission, routine, class, attendance/report, homework এবং Guardian progress। এক Node/TypeScript/Express app, MySQL/MariaDB-compatible database, maintained plain JS/CSS frontend। Microservices, নতুন framework, generic workflow builder বা architecture rewrite এখন নয়।

**V1 = দৈনন্দিন operation-এর complete ছোট release। V2 = তার ওপর উন্নত automation/commercial/analytics।** V1-এ কিছু রাখা মানে ইতিমধ্যে কাজ হয়ে গেছে নয়। V2-তে নেওয়া মানে Master Blueprint-এর অনুমোদিত decision বাতিল নয়; release scope defer করা। যেটি বাস্তব launch-এ অপরিহার্য বলে UAT-এ বের হবে সেটি V1-এ ফেরাতে হবে।

## দুইটি স্বাধীন development track

| Track | Folder | Local web / DB | দায়িত্ব |
|---|---|---|---|
| A — Codex | `iom-academy-management` | 3010 / 33129; `academy_test_local_demo_v1` | এই chat-এ আমি V1 তারপর approved V2 পর্যন্ত implementation, tests, UX, documentation চালাব; production release আলাদা gate |
| B — Antigravity/other AI | `iom-academy-antigravity` | 3020 / 33139; `academy_test_antigravity_demo_v1` | আপনি অন্য tool-এ এই folder-টাই open করবেন; একই starting source ও plan থেকে independent implementation |

বর্তমান Codex folder rename/move করা হয়নি; চলমান local URL/data অক্ষত। Track B clean source snapshot: credentials, actual local DB, backups, sessions, node_modules, dist এবং original `.git` নেই। Track B-তে প্রথম run আলাদা synthetic DB বানাবে। এই প্রস্তুতিতে Track B server চালানো হয়নি।

দুই codebase এখন fork-এর মতো স্বাধীন। একটির schema/DB/source অন্যটিতে copy-paste করে overwrite নয়। পরে ভালো feature নেওয়া দরকার হলে নির্দিষ্ট diff review + migration collision review + regression tests দিয়ে port করতে হবে। Shared data synchronization নেই। একই GitHub `staging` branch থেকে দুই ভিন্ন complete product auto-deploy নয়।

## প্রকৃত বর্তমান অবস্থা

- VERIFIED this preparation: source branch/head/status ও local launcher isolation inspected; clean-source hashes ও exclusion manifest generated।
- Prior local evidence (আগের run, এই planning step-এ rerun নয়): 31 unit/UI tests; চার role login/read API smoke; restart smoke; 87 imported hashes pass। এটি complete Part 4 acceptance নয়।
- Source present / bounded implementation: Parts 1–3 foundation/auth/academic modules; scope limits `docs/PART-1-FOUNDATION.md`, `PART-2-CONTRACTS.md`, `V1-ACADEMIC-SCOPE.md`-তে। Source উপস্থিতি সব requirement pass প্রমাণ নয়।
- PARTIAL: local Part 4 attendance/correction/leave/follow-up code + migration006; full SQL/browser/UAT regression pending।
- PLANNED / not established as complete: full native paid 1:1 ledger, homework/results system, finance/payroll, messaging, transfer automation ও remaining Blueprint।
- UNKNOWN in this preparation: live GitHub/staging deployment drift, complete D-001..201 coverage, production readiness। কোনো live account inspect করা হয়নি। পুরোনো handover numbers historical।

## কীভাবে V1 শেষ করব — dependency order

1. **M0 Freeze baseline:** safe copies, decision registry, current tests এবং known gaps। এই source snapshot আছে; পূর্ণ বর্তমান test gate বাকি।
2. **M1 Daily academic journey:** Parts 1–3-এর gaps যাচাই/repair; manual admission → placement → enrollment → recurring routine → class/report → published progress; group/single/1:1 তিন journey।
3. **M2 Attendance/care:** বর্তমান Part 4 stabilize; correction/leave/recalculation/first-and-second-seven/low-attendance tests। Pending policy ছাড়া gated actions enable নয়।
4. **M3 Native 1:1:** individual assignment/routine/duration/report/Guardian view complete; commercial deduction বাদ যতক্ষণ নিয়ম অনুমোদিত নয়।
5. **M4 Learning:** simple homework, Teacher feedback, approved marks/result publication, manual completion।
6. **M5 Supporting daily work:** basic resources, scoped export, external payment-status contract/manual approved reference; operational queues।
7. **M6 Release:** whole-app role UX/mobile polish, all required tests/UAT, restore drill, release notes; তারপর আলাদা staging/production approval। UX ও safety প্রতিটি milestone-এই চলবে।

V2 order: approved package/ledger যদি business needs হয় আগে → finance reconciliation → exam/certificate → communications/resources/import → advanced automation/PWA/analytics → separately authorized legacy migration। Package ছাড়া operation সম্ভব না হলে 5.2/5.4 V1 launch blocker হবে; policy resolve করে scope আনতে হবে।

## Status ও priority পড়ার নিয়ম

- **V1:** minimal daily release-এর কাজ; এই তালিকা priority, implementation status নয়।
- **V1-GATE:** V1-এ দরকার হতে পারে, কিন্তু unanswered rule/authority আগে resolve করতে হবে।
- **V2:** daily V1 চালু রেখে পরে করা যায়।
- **V2-GATE:** পরে করলেও rule/authority approval ছাড়া implementation নয়।

আগের ৮-part-এর percentage ছিল rough weighting; verified completion percentage নয়। নতুন plan-এ misleading percent না দিয়ে accepted journey/test evidence দিয়ে progress মাপব। একই acceptance row দুই track-এ আলাদা status পাবে: NOT_STARTED / PARTIAL / IMPLEMENTED_UNTESTED / VERIFIED / BLOCKED_POLICY / DEFERRED_V2।

## বিস্তারিত breakdown

### ১ — Foundation

| ID | Release | কাজ | শেষ হওয়ার প্রমাণ |
|---|---|---|---|
| 1.1.1 | V1 | এক Express app, TypeScript build, frontend/backend ownership | Build, run ও module map; নতুন framework/rewrite দরকার নেই |
| 1.1.2 | V1 | প্রতি version-এর আলাদা branch, local URL, database ও test evidence | দুই app একসঙ্গে চললেও একটির data অন্যটিতে যাবে না |
| 1.1.3 | V1 | CI, migration command এবং staging release procedure | পরীক্ষা পাসের পরে অনুমোদিত release; local test মানেই deployed নয় |
| 1.2.1 | V1 | Branch → department → course → batch → enrollment সম্পর্ক | Invalid relationship ও duplicate enrollment SQL/API-তে প্রত্যাখ্যান |
| 1.2.2 | V1 | Family → Guardian → student; class → attendance/report/progress | Guardian শুধু own-family record দেখেন |
| 1.2.3 | V1 | Versioned migration, indexes ও history preservation | খালি demo setup এবং পুরোনো schema upgrade/restore দুটো যাচাই |
| 1.3.1 | V1 | Login/logout, session expiry, CSRF ও current role context | Unauthorized write, expired session ও cross-family tests |
| 1.4.1 | V1 | Student/family linking, batch/group ও individual enrollment | এক Guardian-এর একাধিক সন্তান ও course ঠিকভাবে দেখা |
| 1.4.2 | V1 | Class schedule/start/end/held verification | Held না হলে attendance/follow-up count না বাড়ে |
| 1.5.1 | V1 | Draft → submit → review → return/resubmit → approve | পুরোনো revision ও stale edit conflict সংরক্ষিত |
| 1.5.2 | V1 | Learner-specific Zimmadar summary publish | Guardian API-তে private report/follow-up note নেই |

### ২ — Backbone ও reliability

| ID | Release | কাজ | শেষ হওয়ার প্রমাণ |
|---|---|---|---|
| 2.1.1 | V1 | Module/API contract, validation/error shape ও Asia/Dhaka clock | একই সময় নিয়ম সব workflow-এ; approved decision mapping |
| 2.2.1 | V1 | Read/create/edit/review/approve/export action matrix | Role + branch + department + batch + learner scope পরীক্ষা |
| 2.2.2 | V1 | Teacher/Zimmadar/Supervisor duty ও multi-role switching | Role switch-এ পুরোনো dialog/data পরিষ্কার; escalation authority স্পষ্ট |
| 2.3.1 | V1 | Activate/deactivate, password change ও admin-issued reset | Reset token one-use; deactivate/revoke-এ পুরোনো session অকার্যকর |
| 2.3.2 | V1 | Login abuse control, session cleanup ও privileged-access review | Rate limit tested; MFA decision/risk documented before launch |
| 2.3.3 | V2 | Optional wider MFA / self-service email recovery | Delivery provider ও recovery policy অনুমোদনের পরে; launch risk থাকলে MFA আগে |
| 2.4.1 | V1 | Revision token, locking, duplicate-request prevention | একই submit দুইবারেও এক record/এক deduction; concurrent edit conflict |
| 2.4.2 | V1 | Audit allowlist, private data access, limits/pagination | Secret/Guardian-private note audit/export-এ leak না হওয়া |
| 2.5.1 | V1 | Manual backup → isolated restore → rollback drill | Recovery evidence থাকতে হবে; user এখন manual backup বেছে নিয়েছেন |
| 2.5.2 | V1 | Config/secrets separation, health/readiness ও operational logs | Source/ZIP-এ credentials নেই; logs দিয়ে failure বোঝা যায় |
| 2.5.3 | V2 | Automated backup, retention automation ও proactive monitoring | আলাদা অনুমতি ও storage policy ছাড়া scheduling/deletion নয় |

### ৩ — Admission ও academics

| ID | Release | কাজ | শেষ হওয়ার প্রমাণ |
|---|---|---|---|
| 3.1.1 | V1 | Admin manual admission এবং existing Guardian online application | নিজের family-র আবেদন; required student/Guardian fields validated |
| 3.1.2 | V1 | Application review, manual assessment/placement ও accept | Accept retry-এ দ্বিতীয় enrollment নয়; reviewer history |
| 3.1.3 | V2 | Public signup/invitation, assessment booking, scoring/placement automation | Admission policy/identity verification আগে নির্ধারণ |
| 3.2.1 | V1 | Branch/department, regular/fixed/continuous course ও session dates | তারিখের conflict এবং invalid course/batch dates আটকানো |
| 3.2.2 | V2 | Holiday/calendar automation এবং academic session archive UI | Historic record access রেখে archive |
| 3.3.1 | V1 | Batch create, Teacher/Zimmadar assignment ও substitution | Change history; পুরোনো class-এর actual teacher ownership থাকবে |
| 3.3.2 | V1 | 1:1 one-learner restriction; configured capacity হলে তার enforcement | Invented global seat count নয়; required capacity policy pending হলে gated |
| 3.3.3 | V2 | Waitlist, auto substitute search ও workload balancing | Capacity/availability policy থেকে deterministic result |
| 3.4.1 | V1 | Multi-slot recurring routine ও bounded class generation | Teacher এবং batch conflict; rerun-এ duplicate class নয় |
| 3.4.2 | V1 | Manual reschedule/cancel reason ও history | UI নতুন সময় দেখায়; actual held history অপরিবর্তিত |
| 3.4.3 | V1-GATE | প্রয়োজনীয় makeup linkage ও teacher-absence manual routing | Makeup/cancellation entitlement policy অনুমোদন হলে minimum flow |
| 3.4.4 | V2 | Automatic makeup recommendation ও absence-driven rescheduling | Manual decisions ছাড়া unapproved credit/deduction নয় |
| 3.5.1 | V1 | Course report prompt/version, returned revision ও required agreed fields | পুরোনো report-এ নতুন template চাপানো হয় না |
| 3.5.2 | V2 | Dynamic typed form builder ও academic scoring schema | প্রতি course field/schema sign-off আগে |
| 3.6.1 | V1 | Active/on-hold/withdrawn/completed/inactive ও effective dates | Reason/history; historical attendance/report readable |
| 3.6.2 | V1-GATE | দরকারি manual batch/branch transfer | Effective date, overlap ও historical access rule আগে অনুমোদন |
| 3.6.3 | V2 | Bulk/automatic promotion ও retroactive lifecycle periods | Fee, eligibility ও follow-up impact আগে স্পষ্ট |

### ৪ — Attendance ও student care

| ID | Release | কাজ | শেষ হওয়ার প্রমাণ |
|---|---|---|---|
| 4.1.1 | V1 | Class roster: Present/Late/Absent/Unrecorded; join-time validation | Actual start anchor; 15:00 বনাম 15:01 boundary এবং effective enrollment |
| 4.1.2 | V1 | Held-class eligibility, monthly summary ও class history | Cancelled/unverified/future class গণনা নয়; exact ratio থেকে warning |
| 4.2.1 | V1 | Teacher correction cutoff এবং পরে Zimmadar approval | সপ্তম দিন 23:59:59 BD; old/new/actor/reviewer ও stale revision |
| 4.2.2 | V1 | Correction পরে counters/percentage recalculation | Closed case auto-reopen নয়; review evidence |
| 4.3.1 | V1 | Leave request/review, dates, extension ও Guardian visibility | Approval scope ও inclusive BD dates; leave ≠ enrollment on-hold |
| 4.3.2 | V1-GATE | Overlapping/retroactive leave, overdue pause ও extension edge cases | Pending explicit policy resolve না হলে gated থাকবে; silent acceptance নয় |
| 4.3.3 | V1 | Automation pause/resume ও Present/Late return detection | Remaining time preserved; no missed-reminder burst |
| 4.4.1 | V1 | Enrollment-wise first seven actually-held absences | Present/Late/approved leave treatment; Unrecorded আলাদা |
| 4.4.2 | V1 | Contact completion-এর পর second seven; history survives reset | Contact date + Guardian statement + next steps; automatic third escalation নয় |
| 4.5.1 | V1 | Current-month <75%, minimum sample, missing-data hold | তিন eligible held class ও complete attendance; rounding থেকে decision নয় |
| 4.5.2 | V1 | Teacher contact task/private notes ও 72/144h deadline | Guardian summary/private notes আলাদা; scoped reviewer |
| 4.5.3 | V1 | Repeat cadence, recovery closure ও previous-month pending cases | Leave শেষে fresh cadence; closed case retained |
| 4.6.1 | V1 | Reopen limit/approval, Zimmadar/Supervisor review ও handoff | Unauthorized reopen/reassignment denied; নতুন deadline/history |
| 4.6.2 | V1-GATE | Management duty, terminal authority, minimum action/blocker handling | Pending role/privacy/terminal/SLA decisions resolve; V1-এ manual queue allowed only with accepted scope |
| 4.6.3 | V2 | Rich action-plan revisions, blocker dashboards ও advanced SLA automation | Approved escalation প্রয়োজনীয় অংশ V1 থেকে বাদ নয়; richer tooling পরে |
| 4.7.1 | V1 | Pending/overdue/completed/escalated queues, filters ও in-app notification | Scope-safe pagination; no private note in notifications |
| 4.7.2 | V1 | Idempotent jobs, bounded catch-up ও downtime/retry evidence | Latest actionable only; ambiguous external outcome review |
| 4.7.3 | V2 | Real Telegram rollout ও advanced bulk reminders | Guardian preference policy + credentials + consent/approval + delivery tests আগে |

### ৫ — Native One-to-One

| ID | Release | কাজ | শেষ হওয়ার প্রমাণ |
|---|---|---|---|
| 5.1.1 | V1 | Individual enrollment, Teacher/Zimmadar assignment ও routine | এক learner slot; group ও 1:1 একই simple navigation |
| 5.3.1 | V1 | 1:1 schedule/start/end, actual duration, attendance ও report | Guardian own-child view; duration evidence preserved |
| 5.3.2 | V1-GATE | 1:1 cancel/reschedule/substitute/session correction | Approved minimum rules; no invented paid entitlement effect |
| 5.5.1 | V1 | Same login-এ সব সন্তানের group/1:1 schedule ও progress | Internal report/private note inaccessible |
| 5.2.1 | V2-GATE | Package contract, validity, renewal/expiry rules | Duration/class/minute terms ও commercial rules এখনও explicit approval প্রয়োজন |
| 5.4.1 | V2-GATE | Entitled/used/remaining ledger ও reconciliation | Rules approved হওয়ার পর atomic idempotent posting; balances financial truth নয় |
| 5.5.2 | V2 | Approved package/ledger Guardian summary | Ledger tested and authorized হলে only allowlisted summary |
| 5.6.1 | V2-GATE | Legacy mapping, dry-run, reconciliation ও actual migration | Separate approval/backup; credential/session merge নয়; legacy untouched |

### ৬ — Homework ও progress

| ID | Release | কাজ | শেষ হওয়ার প্রমাণ |
|---|---|---|---|
| 6.1.1 | V1 | Teacher homework: learner/batch, due date ও instructions | Guardian sees own-child published assignment; no mandatory upload |
| 6.1.2 | V1 | Manual completion status ও Teacher feedback | Authorized change/history; Guardian-safe wording |
| 6.2.1 | V1 | Simple oral/practical assessment ও Teacher-entered marks | Course-approved criteria/range; no invented grading thresholds |
| 6.3.1 | V1 | Result review, correction history ও explicit publication | Unpublished marks/private comments Guardian পাবে না |
| 6.4.1 | V1 | Attendance/homework/result plus published evaluation per enrollment | সব required data না থাকলে honest missing state |
| 6.5.1 | V1 | Authorized manual course completion record | Reason/date/history; automatic promotion নয় |
| 6.2.2 | V2 | Online written/MCQ exam engine ও question bank | Attempt/time/review policy, accessibility ও anti-abuse tests |
| 6.4.2 | V2 | Trend analytics ও cross-term comparison | Available historical data থেকে; invented prediction নয় |
| 6.5.2 | V2 | Automatic eligibility, promotion ও generated certificates | Course criteria, final approver ও certificate format approved |

### ৭ — Finance ও support

| ID | Release | কাজ | শেষ হওয়ার প্রমাণ |
|---|---|---|---|
| 7.1.1 | V1 | Existing Payment Portal-এর approved reference/status view | Portal-ই collection/confirmation authority; disconnected হলে clearly unknown |
| 7.1.2 | V2-GATE | Invoices, partial/installment, waiver/scholarship reconciliation | Authority/data contract ও fees rules approval ছাড়া balance calculation নয় |
| 7.2.1 | V2-GATE | Teacher payable/payroll, expense approval ও financial reports | Count/hour/rate/adjustment rules আলাদা অনুমোদন |
| 7.3.1 | V1 | Staff profile/role/assignment/status এবং operational queues | Existing duties দিয়ে কাজ; separate enterprise task system নয় |
| 7.3.2 | V2 | General task management, performance/workload analytics | Metrics/visibility approved; punitive score invention নয় |
| 7.4.1 | V1 | Controlled announcement/in-app notification; manual support path | Guardian communication শুরু করতে কোন action নিতে হবে পরিষ্কার |
| 7.4.2 | V2 | Academic chat, complaint ticket routing ও resolution history | Retention/moderation/privacy policy আগে |
| 7.5.1 | V1 | Course resource links এবং basic organization | Authorized scope; private file public URL-এ নয় |
| 7.5.2 | V2 | Private file storage/audio/video library ও media processing | Storage/access limits এবং backup পরিকল্পনা |
| 7.6.1 | V1 | Scoped CSV export ও essential student/batch/attendance reports | Formula injection neutralized; permission/size limits |
| 7.6.2 | V2 | Import preview/dry-run/error report ও bulk operations | No direct raw SQL import; duplicate handling ও audit |

### ৮ — Simple UX ও launch

| ID | Release | কাজ | শেষ হওয়ার প্রমাণ |
|---|---|---|---|
| 8.1.1 | V1 | Shared buttons/forms/table/dialog/status plus loading/empty/error | বর্তমান plain frontend evolve; tagline/helper-label clutter কমানো |
| 8.2.1 | V1 | Teacher Today, Zimmadar Review, Guardian Children, Admin Setup | Most frequent task ১–২ clear actions; unnecessary menu বাদ |
| 8.3.1 | V1 | Mobile, keyboard, focus, readable contrast ও zoom | Real browser desktop/mobile walkthrough; no hidden required action |
| 8.4.1 | V1 | Readable Bengali names, consistent labels/BD dates ও number display | UTF-8 এবং understandable language; mixed accidental strings নয় |
| 8.4.2 | V2 | Full Bengali-English switch, PWA install/update ও limited offline | Offline sensitive-data cache/write নিষিদ্ধ যতক্ষণ conflict/privacy design নেই |
| 8.5.1 | V1 | Role-wise end-to-end, boundary/privacy/concurrency tests | দুই version-এর জন্য একই acceptance checklist; passing count ≠ full readiness |
| 8.5.2 | V1 | Security/performance review, UAT ও manual restore/rollback drill | Critical/high-risk defects fixed before launch; real staff sign-off |
| 8.5.3 | V1 | Setup/user/handover guide ও separately approved staging/production release | No push/deploy/migration inferred from planning or local permission |
| 8.5.4 | V2 | Wider performance scale, analytics and extended integrations | V1 measured bottleneck থাকলে প্রয়োজনীয় fix V1-এ এগিয়ে আনতে হবে |

## V1 release gate — কোনোটিই শুধু demo screenshot দিয়ে complete নয়

1. Admin: student/family/admission → enrollment → assignment/routine; Teacher: held class → attendance/report/homework; Zimmadar: review/correction/publish; Guardian: own children only; Supervisor: scoped escalation।
2. Group, fixed/single এবং basic 1:1-এর end-to-end cases; inactive/transfer/late correction/leave edge conditions অনুমোদিত scope অনুযায়ী।
3. Cross-branch/family/private-note denial; stale edits; duplicate requests; simultaneous approvals; expired/revoked sessions।
4. Existing `npm test`, isolated SQL/upgrade tests, baseline verification ও original Python tests; meaningful new module tests। MySQL and MariaDB compatibility evidence release-এর আগে।
5. Real browser desktop/mobile, keyboard/error/empty states, user UAT; security and restore/rollback checks।
6. Secret scan/sanitized bundle, known bugs/deferrals, deploy commit/migration IDs ও rollback notes। Authorized production/data migration আলাদা।

## দুই version-এর Git ও release নিয়ম

- Track A current feature branch বজায় থাকবে; latest base plus uncommitted source snapshot-এর manifest রাখা হয়েছে। এখন commit/push/merge/deploy করা হয়নি।
- Track B-তে আলাদা local Git history, branch `other-ai/base-20261104`; কোনো remote attached নয়। প্রথম snapshot commit তৈরি হলে hash manifest-এ লেখা হবে। আলাদা remote চাইলে পরে আলাদা private repo connect করা যাবে।
- প্রতিটি ছোট module/feature-এর জন্য branch + commit + test evidence। আলাদা tool একই Track B-তে একসঙ্গে overlapping files edit করবে না; module owner আলাদা রাখবেন।
- Auth/RBAC, API shape ও migration numbering একজন integrator review করবেন। একসঙ্গে দুই agent একই migration number allocate করবে না।
- Track B remote কখনো সরাসরি existing staging deployment target নয়। Codex track-এর release-ও current local-only boundary মেনে চলবে।
- Canonical `vault/`, `baseline/`, `public/`, `provenance.json` preserve। New confirmed decisions implementation overlay-তে; original history rewrite নয়।
- Legacy Itqaan 1:1 / Payment Portal / production DB, credentials, sessions, backups অন্য agent-কে দেবেন না। Payment confirmation external authority বজায় থাকবে।

## Pending decisions — দুটো track-এই একই blocker

`docs/ATTENDANCE-LOCAL-POLICY.md`-এ latest confirmations ও unanswered items আছে। Management duty/terminal authority/private-note handoff, overlapping/retrospective leave, Guardian urgent Telegram preference এবং blocker SLA anchor unresolved। Package/minute posting/cancellation/makeup/carry-over/refund/proration rules approved না হলে ledger তৈরি/charge deduction নয়। Plan এগুলো নিজে approve করে না।

## শুরু করার practical নিয়ম

Codex-এর কাজ এখানেই current source-এ চলবে; পরের bounded implementation হবে M1 verification এবং M2-এর existing Part 4 gaps/test completion। এই planning request-এ নতুন feature implementation শুরু করা হয়নি।

অন্য tool-এ শুধু `iom-academy-antigravity` open → `OTHER-AI-START-HERE.md` পড়তে দিন → read-only baseline/test report → ছোট একটি milestone নির্বাচন → implementation → evidence → next milestone। পুরো parent workspace open নয়। User চাইলে এই track-টিও সব V1/V2 scope শেষ করবে, তবে একেকবার একটি acceptance slice।

কোনো AI-কে deadline/100% promise দেওয়া হয়নি। Completion মানে selected release acceptance pass; source files বেশি হওয়া নয়।
