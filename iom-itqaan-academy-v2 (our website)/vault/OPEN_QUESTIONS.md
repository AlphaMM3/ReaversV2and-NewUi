# Open Questions — To be answered by Product Owner / Management

**Questions are not approvals. Do not write code assuming answers.**

| Q-ID | Priority | Question | Safe recommended option (not approved) | Affected decisions |
|---|---|---|---|---|
| Q-01 | P0 | After the first 7 missed sessions, does second 7 count on the **next held class** even if teacher has not yet submitted first follow-up notes? | **USER_APPROVED AM-06** — Resolved: second seven qualifying missed held classes count only after first follow-up completion. (Historical recommendation superseded where different.) | D-019/D-056/D-057 |
| Q-02 | P0 | If an approved leave interrupts a 7-miss run, reset immediately when leave ends, or preserve prior streak pending later status? | Follow D-072/D-073: pause during leave; reset at end. Confirm any special handling when leave was approved retroactively. | D-072/D-073/D-080 |
| Q-03 | P0 | Which cutoff applies when a class **ends after midnight** Bangladesh time (e.g., 00:30)? | **USER_APPROVED AM-07** — Resolved: after-midnight class ends -> noon on that same Bangladesh date. (Historical recommendation superseded where different.) | D-034/D-035 + AM-04 |
| Q-04 | P0 | Report intermediate escalation times after next-day noon due? | **USER_APPROVED AM-08** — Resolved: 12:05 Teacher; 14:00 Zimmadar; 16:00 Supervisor; 18:00 Management, Asia/Dhaka. (Historical recommendation superseded where different.) | D-035 + AM-04 |
| Q-05 | P0 | Which source/export/API access does the existing 1:1 Manager provide? Are sanitized source/schema files available for **read-only** review? | **USER_APPROVED AM-11** — Permission approved for read-only inspection of a safe code/schema copy; actual export/API capabilities remain unverified. Audit completion is not implied. (Historical recommendation superseded where different.) | D-167..175 + AM-05 |
| Q-06 | P0 | How does the existing separate Payment Portal expose **verified status**? Can a read-only export/API be authorized? | Verified reference only; no Academy payment confirmation writes. | D-015/D-141/D-171 |
| Q-07 | P1 | Where should 1:1 guardians view **new academy exams and progress** while maintaining separate login? | **USER_APPROVED AM-10** — Resolved direction: safe link from existing 1:1 Guardian Portal to Academy Progress; technical authorization/link implementation still requires design. (Historical recommendation superseded where different.) | D-169/D-170/D-172 |
| Q-08 | P1 | Who signs off final pending policies and architecture (named role, not personal information)? | Central Management for cross-branch rules, designated Academic/Finance owners for their domains. | D-021/D-163/D-180/D-201 |
| Q-09 | P1 | Are separate batch and course enrollments independently counted for absentee streaks? | **USER_APPROVED AM-09** — Resolved: count attendance and absence independently per enrollment. (Historical recommendation superseded where different.) | D-019/D-056/D-148 |
| Q-10 | P1 | Is an automated read-only sync every 15 min acceptable? | Only after legacy audit proves feasibility, show last sync and stale-data flags. | D-167..175 |
| Q-11 | P1 | What marks a class as **Held** in edge cases (teacher absent, wrong Zoom link, 1:1 meeting not started)? | Only verified actually held class (not scheduled-only or cancelled); manual correction audited. | D-040/D-053/D-084 |
| Q-12 | P1 | Which proposed enhancements (1–12) are accepted and which release phase? | Keep all unapproved unless individually approved; especially safeguarding and time zones. | Proposal 1–12 |

## Answer log template
`Q-ID | Date | User answer (exact) | Affected D-ID | Approved status | New amendment ID | Tests updated | Reviewer`

## Six-selection answer log — recorded 2026-10-31

Chat Q1..Q6 are NOT the original Vault Q-01..Q-06. Mapping below prevents accidental closure of the leave and payment questions. Original question text retained for history.

| Chat selection | Vault question | Approved amendment | Scope/status |
|---|---|---|---|
| Q1=B | Q-01 | AM-06 | Resolved: second seven qualifying missed held classes count only after first follow-up completion. |
| Q2=A | Q-03 | AM-07 | Resolved: after-midnight class ends -> noon on that same Bangladesh date. |
| Q3=A | Q-04 | AM-08 | Resolved: 12:05 Teacher; 14:00 Zimmadar; 16:00 Supervisor; 18:00 Management, Asia/Dhaka. |
| Q4=A | Q-09 | AM-09 | Resolved: count attendance and absence independently per enrollment. |
| Q5=A | Q-07 | AM-10 | Resolved direction: safe link from existing 1:1 Guardian Portal to Academy Progress; technical authorization/link implementation still requires design. |
| Q6=A | Q-05 | AM-11 | Permission approved for read-only inspection of a safe code/schema copy; actual export/API capabilities remain unverified. Audit completion is not implied. |

Q-02, Q-06, Q-08, Q-10, Q-11 and Q-12 remain unanswered/pending exactly as before. Q-05 permission is answered only; source/export/API capability assessment is still pending. No proposed enhancement is approved. Q6 is permission, not a completed audit.

## Attendance detailed-design supplement (v1.4)
See `design/attendance_followup/QUESTIONS_AND_GATES.md` for AFQ-specific answered/pending branches. Previously unanswered original question rows retain statuses;AM-12..15 recover prior scoped approvals,not blanket resolution of Q-02/Q-11. Current direct correction answer is AM-16.

### v1.4.1 cutoff answer
AFQ-01B resolved by AM-16-C1:class local date+7 calendar days,23:59 Asia/Dhaka;31Oct ->7Nov. All unrelated original questions retain prior status.

## Report workflow v1.5 supplement
`design/report_workflow/QUESTIONS_AND_GATES.md` lists RQ-01..12. AM-17 answers timely submission versus pending review;ordinary reminder times and returned-revision deadline remain PENDING. Original question rows/statuses are retained.

## AM-19 — unified Guardian target (v1.7.1,2026-10-31)
New Academy Guardian access uses one login/dashboard across linked children and Batch/1:1 classes/progress. This explicitly supersedes D-169 separate1:1 Guardian login and corresponding AM-05/10/18 preservation language for the NEW target system only. Preserve own-child access,Primary/Secondary distinct identities/permissions,D-090 note privacy and all unrelated approvals. No automatic legacy credential merge,shared password,production migration or SSO implementation approved. OTO-06 target-login choice RESOLVED;technical authentication,migration and account-linking design remain pending. Earlier separate-login statements in this document are historical and superseded only for the new target system.
