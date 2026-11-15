# Known gaps, assumptions & safety gates — v0.1

## Immediate code review concerns (before further development)

- Existing FastAPI/SQLite choice is a **temporary local prototype technology**, not approved production stack or Hostinger deployment validation.
- No confirmed student data or payment info should be entered. Dev session cookies need HTTPS-only setting, stricter login rate limits, recovery/MFA/admin audit and approved privacy/retention policy before deployment.
- Current teacher late join calculation uses **actual recorded Start** as the comparison anchor; actual vs scheduled anchor remains AFQ-04 pending. Do not silently publish as final policy. Manual teacher status may be entered without join evidence, consistent with D-053 fallback but requires operating guidance.
- Attendance correction direct-edit class date +7 23:59 implemented as minute cutoff. Exact second-inclusive boundary is AFQ-07 pending. Editing after cutoff denies; request/approval implementation pending.
- `held_verified` is a pilot technical flag requiring a separate Zimmadar action before attendance. Original held-class evidence semantics remain AFQ-02 pending. There is no provider sync/verification.
- Report deadline `report_due` follows approved AM-04/07 where clearly resolvable. Cross-midnight >24h or contradictory times have no automatically assigned due time. Endpoint precision RQ-02 pending.
- Noon report escalation stages are approved AM-08 but not yet emitted; ordinary 23:59 reminder pattern and review/return revision SLA remain pending RQ-03/04.
- Report edit history is append-only at application level but no audit cryptographic chain; admin/DB owner can change it. Full revision lifecycle edge cases RQ-08/09 pending.
- Secondary Guardian self-management D-065 is not yet implemented; another guardian account requires admin side linkage logic still under construction. Do not label completed.
- First 7 unauthorized held missed classes and second 7 after first follow-up completion AM-06 are **not automated yet**. Approved leave, pending cases, 75% monthly alerts, low attendance and escalations are not coded. D-019/D-056/D-057 are still required.
- OTO 1:1 package minute deductions, credits, carryover, makeup, teacher payments, invoice/payment verification have pending commercial definitions. **Do not write commercial code based on guesses.**
- D-015 existing payment portal is authoritative for collection and verification; any data mirroring will be read-only until approved integration contract. No payment API currently coded.
- No data migration, real 1:1 credentials, WhatsApp/Telegram, exports, high availability, monitoring, or deployment. D-180/201 sign-off not obtained.

## Next engineering increments (not approval promises)

1. Move API routes into domain modules; adopt migrations; improve authentication and family-guardian self-service safely.
2. Implement approved attendance and leave engine with AFQ gates; tests across one enrollment, multiple classes, correction replay and guardian scopes.
3. Add report escalation event/outbox and scheduled worker; never emit notifications for already submitted reports.
4. Implement Academic Exams/Homework, approvals, student progress, and basic staff workflows.
5. After OTO-01..10 policy decisions, introduce contracts/minute ledger/finance as separate audited domains.
6. Host validation, security testing, independent human review and department UAT before live launch.

**Current software version:** v0.1.0 LOCAL-PROTOTYPE. Not all source decisions implemented. Do not promote this to live or present it as approved first-version feature scope.

## v0.2 protection / non-goals
- In-app escalations are internal event records; no notification has been delivered to Teacher, Supervisor or Management outside the app. Supervisor role is absent in v0.1 schema; events explicitly marked `unassigned`.
- Ordinary 23:59 report overdue schedule, reopening/late revision rules, historical alert catch-up and exact minute boundary remain unanswered policy details. Events are emitted only during a 5-minute window of their approved scheduled time and only when initial report submission is still missing.
- Annual/month-end attendance warning automation is not enabled. The percentage data can be inspected but is not sufficient to generate leave-aware follow-up cases. D-19,56,57 and AM-12 stage transitions need approved-leave, official absence tracking and follow-up completion records.
- Existing administrator credentials and SQLite DB must be preserved by upgrading in-place using the included safe updater. New ZIP from scratch does not transfer old local data.
