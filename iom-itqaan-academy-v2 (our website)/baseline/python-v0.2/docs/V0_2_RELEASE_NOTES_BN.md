# IOM Academy Core v0.2.0 — Local prototype update

## নতুন
- **Report Monitor:** staff-only class report obligation queue; current deadline, first submission, review status, approved noon-escalation stage preview.
- **In-app Alert Events:** Due at 12:00 class reports -> 12:05 Teacher, 14:00 Zimmadar, 16:00 Supervisor, 18:00 Management. Only when first submission is missing; event log is idempotent.
- **Monthly Attendance:** Verified held class count, Present, Late, Absent, Unrecorded, per-enrollment percentage; original D-84 formula.

## যা এখনো তৈরি নয়
- Telegram / email / SMS sending, supervisor role mapping, legacy 1:1 API sync, income/payment posting.
- Approved leave and seven-consecutive-missed-class follow-up; live low-attendance warning dispatch.
- Historical catch-up alert policy; general 23:59 report escalation schedule.

## Safety
- Original 201 decision reference and v1.7.1 archive untouched.
- Existing students/users/class data not migrated or reset. Only an additive SQLite table via IF NOT EXISTS.
- Never overwrite your old local project folder with a fresh ZIP to update live data. Stop server, back up, run the **in-place update script**.
- Local development only, do not put real children's personal data yet.
