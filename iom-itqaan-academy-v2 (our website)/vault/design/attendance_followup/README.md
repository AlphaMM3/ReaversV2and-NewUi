# Attendance ও Follow-up — বিস্তারিত নকশা, Review Draft

এই নকশা original D-001–201, AM-01–11, পুনরুদ্ধার করা পুরোনো অনুমোদন এবং এই ধাপে পাওয়া সরাসরি উত্তরের ভিত্তিতে। এটি coding/deployment বা চূড়ান্ত architecture approval নয়। Original source ও unapproved proposals বদলানো হয়নি।

## প্রথমে যা বুঝতে হবে

একটি enrollment-এর জন্য চারটি আলাদা বিষয় থাকবে:

1. **Class সত্যিই অনুষ্ঠিত হয়েছে কি না:** routine-এ থাকা মানেই held নয়; record না পাওয়া মানেই Absent নয়।
2. **Attendance:** Present, Absent, Late। Approved leave আলাদা record; held class-এর Absent মাসিক denominator-এ থাকে।
3. **টানা অননুমোদিত অনুপস্থিতি:** প্রথম সাতটি eligible missed held class-এ প্রথম follow-up; সেটি সম্পন্ন হওয়ার পর পরবর্তী সাতটিতে দ্বিতীয় escalation।
4. **মাসিক কম উপস্থিতি:** current month-এর অন্তত তিনটি held class-এর পর percentage ৭৫%-এর নিচে হলে warning/follow-up। এটি সাত-ক্লাসের counter-এর থেকে আলাদা।

## আগের অনুমোদন পুনরুদ্ধার

২৩ অক্টোবরের চ্যাটের সরাসরি উত্তর এবং পরবর্তী তিনটি সুপারিশে “ok” যাচাই করা হয়েছে। এগুলো নতুন অনুমোদন নয়; আগের Vault-এ বাদ পড়েছিল:

- C-01 / AM-12: ছুটিতে percentage দেখা যাবে, warning/follow-up স্থগিত; pending follow-up-এর অবশিষ্ট সময় ছুটি শেষে চলবে।
- C-02 / AM-13: নতুন মাসের অন্তত তিনটি held class-এর পর সে মাসে percentage >=75 হলে পূর্ববর্তী মাসের pending LOW_ATTENDANCE case auto-close; অন্য kind-এর case/action plan নয়।
- C-05 / AM-14: ছুটি শেষে Present অথবা Late হলে Returned; আলাদা confirmation form/notification নয়।
- C-10 / AM-15: enrollment কার্যকর থাকা সময়ের held class-ই attendance ভিত্তি; exact transfer timestamp ও একই দিনের session boundary এখনও pending।

প্রমাণ: `evidence/RECOVERED_ATTENDANCE_APPROVALS.json` এবং `POLICY_RECONCILIATION.md`। পুরোনো C-03-এর second calendar-day অংশ পরে AM-02/06 দ্বারা superseded; সেটি পুনর্বহাল করা হয়নি।

## নকশার ফাইল

| File | ব্যবহার |
|---|---|
| `STATE_AND_COUNTERS.md` | attendance, leave, streak, monthly warning, case/reopen/reassignment, plan/blocker state |
| `PERMISSIONS.md` | action × actor × scope × time/approval × deny conditions |
| `TIMERS.md` | clock anchor, pause/resume, repeat, escalation recipients |
| `DATA_AND_EVENTS.md` | candidate fields, constraints, data ownership, event/outbox/recalculation contract |
| `SCREENS_AND_WORKFLOWS.md` | form/actions, privacy, correction workflow, audit ও report impact |
| `ACCEPTANCE_SCENARIOS.json` | decision-linked acceptance examples; সব NOT_RUN |
| `QUESTIONS_AND_GATES.md` | এখনও প্রয়োজনীয় সিদ্ধান্ত ও কোন implementation path আটকে আছে |

## গুরুত্বপূর্ণ সীমা

Teacher/Zimmadar/Supervisor/Management আলাদা authority; Central Admin নাম থাকলেই প্রতিটি business approval করার blanket অধিকার নেই। Automation worker কোনো মানব actor-এর approval impersonate করবে না। নতুন permission বা physical SQL schema এই নকশা তৈরি করা দ্বারা অনুমোদিত নয়।

1:1-এর original records কেবল read-only integration-এ; বর্তমান MVP-তে এই attendance engine আছে এমন দাবি নেই। Legacy session না থাকা দিয়ে missed class তৈরি করা নিষিদ্ধ।

প্রস্তাবিত enum, field, event ও idempotency key প্রযুক্তিগত design draft। Source-grounded policy ও pending business choice আলাদা করে লেখা আছে। Unanswered choice-এর ওপর নির্ভরশীল path coding-ready বলা হবে না।

## কাজ শেষ হওয়ার অর্থ

State/RBAC/timer/data/acceptance design-এর draft প্রস্তুত হওয়া মানে implementation-ready নয়। প্রশ্নের নিষ্পত্তি, cross-document review, independent approval, runnable test ও authorised implementation বাকি থাকবে। Original G0–G7 gate-কে complete করা হয়নি।
