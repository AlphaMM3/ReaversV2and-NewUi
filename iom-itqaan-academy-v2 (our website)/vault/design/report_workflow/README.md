# Report workflow — নকশা v1.5

Q2/AM-07 অনুযায়ী after-midnight class end-এর একই বাংলাদেশ তারিখের দুপুর12টা deadline। Q3/AM-08 অনুযায়ী noon-window overdue reminder12:05 Teacher,14:00 Zimmadar,16:00 Supervisor,18:00 Management। আগে অনুমোদিত ordinary23:59 ও late-night23:00 rule AM-04 অনুযায়ী থাকে।

এই ধাপের উত্তর AM-17:submission deadline ও review status আলাদা;সময়মতো জমা হলে approval বাকি থাকার কারণে Teacher late-report reminder পাবেন না। Return-এর পর revision deadline এখনও pending;24h প্রস্তাব অনুমোদন করা হয়নি।

- `WORKFLOW_STATES_DEADLINES.md`:class end,draft,submit,review,return,resubmit,approval,deadline/reminder,permission/screen/report impact।
- `DATA_EVENTS_AND_SAFEGUARDS.md`:logical fields/events,outbox,concurrent revision,idempotence ও privacy review draft।
- `ACCEPTANCE_SCENARIOS.json`:decision-linked expected examples;সব NOT_RUN;pending boundary cases আলাদা।
- `QUESTIONS_AND_GATES.md`:unresolved policy/implementation branches;original questions/approvals preserved।

Ordinary23:59 deadline reminder schedule,Zimmadar review SLA,late-arrival escalation closure,revision deadline,publication/required course fields,unusual timestamp cases এবং precise cutoff seconds এখনও অনুমান করা হয়নি। All detailed labels/fields are proposals,not running tables/APIs. Existing attendance design remains byte-identical. No app code,data import,live deployment,application test or gate completion claimed.
