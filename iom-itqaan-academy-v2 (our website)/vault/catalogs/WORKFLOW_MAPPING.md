# Workflow mapping catalog — DRAFT, NOT APPROVED

All family/leaf IDs below are design references,not existing routes or running processes. Source/amendments win over old skeleton language. One leaf anchors one source decision;compound requirements may need several implementation workflows/tests.

## Family index

|Family|Candidate area|Source decisions|
|---|---|---|
| WF-01 | Admission | D-005, D-139, D-165, D-166 |
| WF-02 | Admission assessment and placement | D-026, D-155 |
| WF-03 | Enrollment and student lifecycle | D-020, D-148, D-157, D-158 |
| WF-04 | Routine and calendar | D-016, D-030, D-146 |
| WF-05 | Staff leave and substitute | D-036, D-037, D-045, D-046, D-047, D-194, D-195 |
| WF-06 | Class session and timer | D-040, D-041, D-042 |
| WF-07 | Attendance capture and view | D-017, D-018, D-053, D-054, D-055, D-059, D-083 |
| WF-08 | Class reports and homework | D-006, D-028, D-029, D-032, D-033, D-034, D-035, D-038, D-043, D-044, D-135 |
| WF-09 | Schedule change and makeup | D-048, D-049, D-050, D-051, D-052 |
| WF-10 | Assessment and promotion | D-009, D-027, D-134, D-156 |
| WF-11 | Unauthorized absence streak | D-019, D-056, D-057, D-072, D-073 |
| WF-12 | Legacy 1:1 read integration | D-167, D-168, D-169, D-170, D-171, D-172, D-173, D-174, D-175 |
| WF-13 | Academy finance | D-011, D-013, D-141, D-147, D-160, D-161 |
| WF-14 | External payment reconciliation | D-012, D-014, D-015 |
| WF-15 | Support and complaints | D-164, D-184 |
| WF-16 | Staff/teacher performance | D-008, D-039, D-137, D-196, D-197, D-198, D-199 |
| WF-17 | Record-specific correction | D-058, D-079, D-080, D-081, D-082, D-091, D-092 |
| WF-18 | Release and data governance | D-132, D-176, D-179, D-180, D-185, D-201 |
| WF-19 | Organization and academic catalog | D-001, D-002, D-003, D-004, D-021, D-023, D-024, D-025, D-142, D-163 |
| WF-20 | Guardian family and notifications | D-010, D-060, D-061, D-062, D-063, D-064, D-065, D-066, D-133 |
| WF-21 | Student leave and return | D-067, D-068, D-069, D-070, D-071, D-074, D-075, D-076, D-077, D-078 |
| WF-22 | Monthly attendance follow-up | D-084, D-085, D-086, D-087, D-088, D-089, D-090, D-093, D-094, D-095, D-096, D-097, D-098, D-099, D-100, D-101, D-102, D-103, D-104, D-105, D-106, D-107, D-108, D-109 |
| WF-23 | Academic progress and communication | D-007, D-136, D-140, D-159 |
| WF-24 | Identity access and security | D-022, D-162, D-188, D-189, D-190, D-191 |
| WF-25 | Learning resource library | D-031, D-150 |
| WF-26 | Escalated follow-up intervention | D-110, D-111, D-112, D-113 |
| WF-27 | Action plans and progress | D-114, D-115, D-116, D-117, D-118, D-119, D-120, D-121, D-122, D-123, D-124 |
| WF-28 | Blocker resolution | D-125, D-126, D-127, D-128, D-129, D-130, D-131 |
| WF-29 | Reporting and Management dashboard | D-138, D-200 |
| WF-30 | Public website and app platform | D-143, D-144, D-145 |
| WF-31 | Course certificates | D-149 |
| WF-32 | Archive export and portability | D-151, D-186 |
| WF-33 | Staff account lifecycle | D-152, D-187, D-192, D-193 |
| WF-34 | Import and migration | D-153, D-177 |
| WF-35 | Central task workspace | D-154 |
| WF-36 | Technical operations | D-178, D-181, D-182 |
| WF-37 | Training and user guides | D-183 |

## Per-decision mapping

<a id="wf-19-d001"></a>
### WF-19.D001 — D-001

- **Basis:** `D-001`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Online international academy scope is documented.
- **Screen / actor:** `SCR-ACADEMY`; Governance owner pending. Pending actor titles are not permission grants.
- **Logical entities:** Academy. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Configuration within centrally permitted bounds; exact admin matrix pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Organization/catalog settings.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-001` — Online international academy scope is documented. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-19-d002"></a>
### WF-19.D002 — D-002

- **Basis:** `D-002`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Both group and read-only legacy 1:1 delivery represented.
- **Screen / actor:** `SCR-COURSES`; Academic owner pending. Pending actor titles are not permission grants.
- **Logical entities:** Course;Batch;LegacyIdentityMap. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Configuration within centrally permitted bounds; exact admin matrix pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Organization/catalog settings.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-002` — Both group and read-only legacy 1:1 delivery represented. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-19-d003"></a>
### WF-19.D003 — D-003

- **Basis:** `D-003`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Fixed-duration and continuous courses supported separately.
- **Screen / actor:** `SCR-COURSES`; Academic owner pending. Pending actor titles are not permission grants.
- **Logical entities:** Course. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Configuration within centrally permitted bounds; exact admin matrix pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Organization/catalog settings.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-003` — Fixed-duration and continuous courses supported separately. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-19-d004"></a>
### WF-19.D004 — D-004

- **Basis:** `D-004`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Central oversight and country/branch operations coexist.
- **Screen / actor:** `SCR-ORG`; Central Management;Branch administration. Pending actor titles are not permission grants.
- **Logical entities:** Branch;Department. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Configuration within centrally permitted bounds; exact admin matrix pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Organization/catalog settings.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-08.
- **Acceptance:** `AT-MAP-004` — Central oversight and country/branch operations coexist. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-01-d005"></a>
### WF-01.D005 — D-005

- **Basis:** `D-005`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Direct and assessed admission paths both supported.
- **Screen / actor:** `SCR-ADMISSIONS`; Admission operator pending. Pending actor titles are not permission grants.
- **Logical entities:** AdmissionApplication;Assessment;Enrollment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Application/status and seat review. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-005;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Admission status summary.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-005` — Direct and assessed admission paths both supported. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-08-d006"></a>
### WF-08.D006 — D-006

- **Basis:** `D-006`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Telegram reporting is context;D-140 governs future official records.
- **Screen / actor:** `SCR-REPORTS`; Teacher;current-practice context only. Pending actor titles are not permission grants.
- **Logical entities:** ClassReport;ExternalReference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Draft -> submitted -> approved or returned/revised; homework separate. Per-action guards/timestamps still need full design.
- **Events:** N/A: historical context;no new automatic event authorized.
- **Report/view impact:** Report compliance and homework.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-006` — Telegram reporting is context;D-140 governs future official records. **NOT RUN**.
- **Remaining design:** Current-practice observation only; do not implement duplicate Telegram/Sheets master from this statement.

<a id="wf-23-d007"></a>
### WF-23.D007 — D-007

- **Basis:** `D-007`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Weekly/monthly guardian progress updates represented;publication details pending.
- **Screen / actor:** `SCR-PROGRESS`; Guardian own children;publisher pending. Pending actor titles are not permission grants.
- **Logical entities:** ProgressReport;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Authorized academic inputs -> own-child progress/communication; publication pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-007;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Student progress and communication.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-007` — Weekly/monthly guardian progress updates represented;publication details pending. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-16-d008"></a>
### WF-16.D008 — D-008

- **Basis:** `D-008`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Teacher monitoring includes assigned task completion.
- **Screen / actor:** `SCR-PERFORMANCE`; Monitoring authority pending. Pending actor titles are not permission grants.
- **Logical entities:** PerformanceReview;Task. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Collect role metrics -> related Supervisor review; private visibility. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-008;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Role-based private review.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-008` — Teacher monitoring includes assigned task completion. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-10-d009"></a>
### WF-10.D009 — D-009

- **Basis:** `D-009`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Exam and continuous assessment both represented.
- **Screen / actor:** `SCR-ASSESSMENTS`; Academic assessor scope pending. Pending actor titles are not permission grants.
- **Logical entities:** Assessment;Result. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Assessment evidence -> eligibility -> final academic approval. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-009;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Assessment/results/promotion.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-009` — Exam and continuous assessment both represented. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-20-d010"></a>
### WF-20.D010 — D-010

- **Basis:** `D-010`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** One family account supports multiple linked children.
- **Screen / actor:** `SCR-FAMILY`; Guardian linked family. Pending actor titles are not permission grants.
- **Logical entities:** Family;FamilyMembership;Student. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Separate identities -> linked children -> per-child preferences. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-010;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Family/notification configuration.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-010` — One family account supports multiple linked children. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-13-d011"></a>
### WF-13.D011 — D-011

- **Basis:** `D-011`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Fixed course fee and monthly tuition distinguished.
- **Screen / actor:** `SCR-FEES`; Finance permissions pending. Pending actor titles are not permission grants.
- **Logical entities:** FeePlan;Invoice. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Accounting states require further design; external confirmation remains separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-011;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Branch/department finance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-011` — Fixed course fee and monthly tuition distinguished. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-14-d012"></a>
### WF-14.D012 — D-012

- **Basis:** `D-012`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** International payment methods remain external;no new gateway.
- **Screen / actor:** `SCR-PAYMENT-MIRROR`; Existing payment portal authority. Pending actor titles are not permission grants.
- **Logical entities:** PaymentMirror;ExternalReference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** External confirmed evidence -> read-only mirror; feasibility pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-012;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Payment source reconciliation.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-06.
- **Acceptance:** `AT-MAP-012` — International payment methods remain external;no new gateway. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-13-d013"></a>
### WF-13.D013 — D-013

- **Basis:** `D-013`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Domestic/expatriate/foreign and schedule-related fee differences supported;rates pending.
- **Screen / actor:** `SCR-FEES`; Fee policy authority pending. Pending actor titles are not permission grants.
- **Logical entities:** FeePlan;FeeAdjustment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Accounting states require further design; external confirmation remains separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-013;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Branch/department finance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-013` — Domestic/expatriate/foreign and schedule-related fee differences supported;rates pending. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Rates, fee adjustments, discount/waiver/refund powers not granted by this mapping; proposal6 stays unapproved.

<a id="wf-14-d014"></a>
### WF-14.D014 — D-014

- **Basis:** `D-014`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Multiple collection/verification methods retain authoritative external provenance.
- **Screen / actor:** `SCR-PAYMENT-MIRROR`; External verification authority. Pending actor titles are not permission grants.
- **Logical entities:** PaymentMirror;ExternalReference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** External confirmed evidence -> read-only mirror; feasibility pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-014;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Payment source reconciliation.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-06.
- **Acceptance:** `AT-MAP-014` — Multiple collection/verification methods retain authoritative external provenance. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-14-d015"></a>
### WF-14.D015 — D-015

- **Basis:** `D-015`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Academy cannot collect/confirm payments in a duplicate gateway.
- **Screen / actor:** `SCR-PAYMENT-MIRROR`; Existing payment portal only confirms. Pending actor titles are not permission grants.
- **Logical entities:** PaymentMirror;SyncRun. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** External confirmed evidence -> read-only mirror; feasibility pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-015;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Payment source reconciliation.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-06.
- **Acceptance:** `AT-MAP-015` — Academy cannot collect/confirm payments in a duplicate gateway. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-04-d016"></a>
### WF-04.D016 — D-016

- **Basis:** `D-016`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Existing fixed batch routine retained as context;no invented scheduling authority.
- **Screen / actor:** `SCR-ROUTINE`; Current practice;routine editor pending. Pending actor titles are not permission grants.
- **Logical entities:** Routine. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Publish scheduled class context; held status separately verified. Per-action guards/timestamps still need full design.
- **Events:** N/A: historical context;no new automatic event authorized.
- **Report/view impact:** Routine/calendar.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-016` — Existing fixed batch routine retained as context;no invented scheduling authority. **NOT RUN**.
- **Remaining design:** Current-practice observation only; do not implement duplicate Telegram/Sheets master from this statement.

<a id="wf-07-d017"></a>
### WF-07.D017 — D-017

- **Basis:** `D-017`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Multiple current reporting sources remain distinguishable during reconciliation.
- **Screen / actor:** `SCR-ATTENDANCE`; Current practice;Teacher verifies future input. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceEntry;AttendanceImport. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Input -> Teacher verification -> attendance; revision separate. Per-action guards/timestamps still need full design.
- **Events:** N/A: historical context;no new automatic event authorized.
- **Report/view impact:** Class/child attendance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-017` — Multiple current reporting sources remain distinguishable during reconciliation. **NOT RUN**.
- **Remaining design:** Current-practice observation only; do not implement duplicate Telegram/Sheets master from this statement.

<a id="wf-07-d018"></a>
### WF-07.D018 — D-018

- **Basis:** `D-018`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Attendance and designated family contact have accountable staff.
- **Screen / actor:** `SCR-ATTENDANCE`; Teacher records;Zimmadar supervises contact. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceEntry;FollowupCase. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Input -> Teacher verification -> attendance; revision separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-018;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Class/child attendance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-018` — Attendance and designated family contact have accountable staff. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-11-d019"></a>
### WF-11.D019 — D-019

- **Basis:** `D-019`; approved references `AM-01;AM-09`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** 6 consecutive unauthorized held misses no alert;7th alert;per enrollment.
- **Screen / actor:** `SCR-ABSENCE`; Zimmadar;designated Teacher. Pending actor titles are not permission grants.
- **Logical entities:** Enrollment;AbsenceCounter;FollowupCase. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Per enrollment; second count after first follow-up COMPLETED; no calendar-day substitute. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-019;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Unauthorized absence cases.
- **Dependencies:** D-018;D-054;D-056;D-072;D-073;D-148.
- **Open question references:** Q-02;Q-11.
- **Acceptance:** `AT-MAP-019` — 6 consecutive unauthorized held misses no alert;7th alert;per enrollment. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-03-d020"></a>
### WF-03.D020 — D-020

- **Basis:** `D-020`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** One or multiple teachers can be assigned to a batch.
- **Screen / actor:** `SCR-BATCH`; Assignment authority pending. Pending actor titles are not permission grants.
- **Logical entities:** Batch;TeacherAssignment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Per-course lifecycle; preserve transfer history. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-020;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Enrollment history.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-020` — One or multiple teachers can be assigned to a batch. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-19-d021"></a>
### WF-19.D021 — D-021

- **Basis:** `D-021`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Batch/department/management oversight separated.
- **Screen / actor:** `SCR-ORG`; Zimmadar;Supervisor;Management. Pending actor titles are not permission grants.
- **Logical entities:** ScopeGrant;Department;Batch. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Configuration within centrally permitted bounds; exact admin matrix pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Organization/catalog settings.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-08.
- **Acceptance:** `AT-MAP-021` — Batch/department/management oversight separated. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-24-d022"></a>
### WF-24.D022 — D-022

- **Basis:** `D-022`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Hierarchical server authorization checks role and record scope.
- **Screen / actor:** `SCR-ACCESS`; Central rule owner;scoped assignments. Pending actor titles are not permission grants.
- **Logical entities:** Role;RoleAssignment;ScopeGrant. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Authorize active role/scope/record; deny otherwise; recovery evidence separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Authorization/audit/recovery evidence.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-08.
- **Acceptance:** `AT-MAP-022` — Hierarchical server authorization checks role and record scope. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-19-d023"></a>
### WF-19.D023 — D-023

- **Basis:** `D-023`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Multiple academic departments represented.
- **Screen / actor:** `SCR-ORG`; Department administration authority pending. Pending actor titles are not permission grants.
- **Logical entities:** Department. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Configuration within centrally permitted bounds; exact admin matrix pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Organization/catalog settings.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-023` — Multiple academic departments represented. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-19-d024"></a>
### WF-19.D024 — D-024

- **Basis:** `D-024`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Retain all source course names/durations/options;no invented fees.
- **Screen / actor:** `SCR-COURSES`; Academic catalog owner pending. Pending actor titles are not permission grants.
- **Logical entities:** Course;Program. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Configuration within centrally permitted bounds; exact admin matrix pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Organization/catalog settings.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-024` — Retain all source course names/durations/options;no invented fees. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-19-d025"></a>
### WF-19.D025 — D-025

- **Basis:** `D-025`; approved references `AM-03`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** AM-03 dedicated single-course department;delivery and duration separate.
- **Screen / actor:** `SCR-ORG`; Department authority pending. Pending actor titles are not permission grants.
- **Logical entities:** Department;Course. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Configuration within centrally permitted bounds; exact admin matrix pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Organization/catalog settings.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-025` — AM-03 dedicated single-course department;delivery and duration separate. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-02-d026"></a>
### WF-02.D026 — D-026

- **Basis:** `D-026`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Placement uses age and academic level;criteria details pending.
- **Screen / actor:** `SCR-PLACEMENT`; Academic placement authority pending. Pending actor titles are not permission grants.
- **Logical entities:** Assessment;Enrollment;Batch. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Assessment evidence to authorized placement. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-026;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Placement evidence.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-026` — Placement uses age and academic level;criteria details pending. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-10-d027"></a>
### WF-10.D027 — D-027

- **Basis:** `D-027`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Exam/continuous evidence feeds promotion with final academic approval.
- **Screen / actor:** `SCR-PROMOTION`; Authorized Academic Staff per D-156. Pending actor titles are not permission grants.
- **Logical entities:** Assessment;Result;PromotionDecision. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Assessment evidence -> eligibility -> final academic approval. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-027;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Assessment/results/promotion.
- **Dependencies:** D-009;D-156.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-027` — Exam/continuous evidence feeds promotion with final academic approval. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Promotion eligibility criteria must be defined before implementing calculation.

<a id="wf-08-d028"></a>
### WF-08.D028 — D-028

- **Basis:** `D-028`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Telegram homework is context;not a competing official master.
- **Screen / actor:** `SCR-HOMEWORK`; Teacher;current-practice context only. Pending actor titles are not permission grants.
- **Logical entities:** Homework;ExternalReference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Draft -> submitted -> approved or returned/revised; homework separate. Per-action guards/timestamps still need full design.
- **Events:** N/A: historical context;no new automatic event authorized.
- **Report/view impact:** Report compliance and homework.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-028` — Telegram homework is context;not a competing official master. **NOT RUN**.
- **Remaining design:** Current-practice observation only; do not implement duplicate Telegram/Sheets master from this statement.

<a id="wf-08-d029"></a>
### WF-08.D029 — D-029

- **Basis:** `D-029`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Portal homework coexists with Telegram communication.
- **Screen / actor:** `SCR-HOMEWORK`; Teacher assigned course;Guardian own children. Pending actor titles are not permission grants.
- **Logical entities:** Homework;HomeworkCompletion. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Draft -> submitted -> approved or returned/revised; homework separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-029;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Report compliance and homework.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-029` — Portal homework coexists with Telegram communication. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-04-d030"></a>
### WF-04.D030 — D-030

- **Basis:** `D-030`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Zoom and Meet supported without assuming provider APIs.
- **Screen / actor:** `SCR-ROUTINE`; Meeting-link editor pending. Pending actor titles are not permission grants.
- **Logical entities:** Routine;ClassSession;MeetingReference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Publish scheduled class context; held status separately verified. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-030;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Routine/calendar.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-030` — Zoom and Meet supported without assuming provider APIs. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-25-d031"></a>
### WF-25.D031 — D-031

- **Basis:** `D-031`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Recording/material access can differ by course/batch;publication details pending.
- **Screen / actor:** `SCR-MATERIALS`; Course/batch access policy pending. Pending actor titles are not permission grants.
- **Logical entities:** LearningResource;ResourceAccess. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Publish/read under yet-to-be-designed resource permissions. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-031;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Resource catalog.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-031` — Recording/material access can differ by course/batch;publication details pending. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-08-d032"></a>
### WF-08.D032 — D-032

- **Basis:** `D-032`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Different courses resolve course-specific report forms.
- **Screen / actor:** `SCR-CLASS-REPORT`; Teacher assigned class;template owner pending. Pending actor titles are not permission grants.
- **Logical entities:** ReportTemplate;ClassReport. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Draft -> submitted -> approved or returned/revised; homework separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-032;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Report compliance and homework.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-032` — Different courses resolve course-specific report forms. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-08-d033"></a>
### WF-08.D033 — D-033

- **Basis:** `D-033`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Zimmadar approval required;timely Teacher submission satisfies initial duty independently from pending review AM-17.
- **Screen / actor:** `SCR-CLASS-REPORT`; Batch Zimmadar approves. Pending actor titles are not permission grants.
- **Logical entities:** ClassReport;ReportRevision. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Draft -> submitted -> approved or returned/revised; homework separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-033;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Report compliance and homework.
- **Dependencies:** D-032;D-044.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-033` — Zimmadar approval required;timely Teacher submission satisfies initial duty independently from pending review AM-17. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-08-d034"></a>
### WF-08.D034 — D-034

- **Basis:** `D-034`; approved references `AM-04;AM-07`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** 22:59 ordinary same-day23:59;23:00 next-day noon;after-midnight00:30 same actual-end-date noon Asia/Dhaka. Submission separate from review AM-17.
- **Screen / actor:** `SCR-CLASS-REPORT`; Teacher submits;deadline worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** ClassReport;ReportDeadline. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Draft -> submitted -> approved or returned/revised; homework separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-034;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Report compliance and homework.
- **Dependencies:** D-035;D-043.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-034` — 22:59 ordinary same-day23:59;23:00 next-day noon;after-midnight00:30 same actual-end-date noon Asia/Dhaka. Submission separate from review AM-17. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-08-d035"></a>
### WF-08.D035 — D-035

- **Basis:** `D-035`; approved references `AM-04;AM-08`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Noon due date12:05 Teacher,14:00 Zimmadar,16:00 Supervisor,18:00 Management. Timely submitted AwaitingReview has no initial late reminder AM-17;ordinary schedule pending.
- **Screen / actor:** `SCR-REPORT-OVERDUE`; Teacher;Zimmadar;Supervisor;Management recipients. Pending actor titles are not permission grants.
- **Logical entities:** ClassReport;NotificationJob;EscalationEvent. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Draft -> submitted -> approved or returned/revised; homework separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-035;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Report compliance and homework.
- **Dependencies:** D-034;D-043.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-035` — Noon due date12:05 Teacher,14:00 Zimmadar,16:00 Supervisor,18:00 Management. Timely submitted AwaitingReview has no initial late reminder AM-17;ordinary schedule pending. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Approved times tied to noon exception; ordinary 23:59 deadline follow-on schedule not settled.

<a id="wf-05-d036"></a>
### WF-05.D036 — D-036

- **Basis:** `D-036`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Substitute can conduct regular teacher's class during absence.
- **Screen / actor:** `SCR-TEACHER-LEAVE`; Regular/Substitute Teacher;assignment D-037. Pending actor titles are not permission grants.
- **Logical entities:** TeacherLeave;TeacherAssignment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Notice/request -> authorized assignment/approval. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-036;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave and substitute coverage.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-036` — Substitute can conduct regular teacher's class during absence. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-05-d037"></a>
### WF-05.D037 — D-037

- **Basis:** `D-037`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Regular seeks substitute first;Zimmadar handles failure.
- **Screen / actor:** `SCR-SUBSTITUTES`; Regular Teacher first;Zimmadar fallback. Pending actor titles are not permission grants.
- **Logical entities:** TeacherAssignment;SubstituteAssignment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Notice/request -> authorized assignment/approval. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-037;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave and substitute coverage.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-037` — Regular seeks substitute first;Zimmadar handles failure. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-08-d038"></a>
### WF-08.D038 — D-038

- **Basis:** `D-038`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Actual substitute submits own report for approval.
- **Screen / actor:** `SCR-CLASS-REPORT`; Assigned Substitute submits;Zimmadar approves. Pending actor titles are not permission grants.
- **Logical entities:** ClassReport;TeacherAssignment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Draft -> submitted -> approved or returned/revised; homework separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-038;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Report compliance and homework.
- **Dependencies:** D-033;D-037;D-044.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-038` — Actual substitute submits own report for approval. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-16-d039"></a>
### WF-16.D039 — D-039

- **Basis:** `D-039`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Count,hours,regular/substitute,reports,duties distinguished.
- **Screen / actor:** `SCR-WORKLOAD`; Teacher records;viewers pending. Pending actor titles are not permission grants.
- **Logical entities:** TeacherAssignment;ClassSession;ClassReport;Task. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Collect role metrics -> related Supervisor review; private visibility. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-039;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Role-based private review.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-039` — Count,hours,regular/substitute,reports,duties distinguished. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-06-d040"></a>
### WF-06.D040 — D-040

- **Basis:** `D-040`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Actual start/end determine hours;scheduled count stored separately.
- **Screen / actor:** `SCR-CLASS-SESSION`; Teacher assigned class. Pending actor titles are not permission grants.
- **Logical entities:** ClassSession;TimerEvent. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Scheduled -> started -> ended; correction approval distinct. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-040;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Actual hours and scheduled count.
- **Dependencies:** D-041;D-042;D-043.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-040` — Actual start/end determine hours;scheduled count stored separately. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-06-d041"></a>
### WF-06.D041 — D-041

- **Basis:** `D-041`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Manual timer correction requires approval and audit.
- **Screen / actor:** `SCR-CLASS-SESSION`; Teacher start/end;Zimmadar correction approval. Pending actor titles are not permission grants.
- **Logical entities:** ClassSession;TimerCorrection;AuditLog. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Scheduled -> started -> ended; correction approval distinct. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-041;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Actual hours and scheduled count.
- **Dependencies:** D-040.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-041` — Manual timer correction requires approval and audit. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-06-d042"></a>
### WF-06.D042 — D-042

- **Basis:** `D-042`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Start begins timer and opens configured link;not provider attendance proof.
- **Screen / actor:** `SCR-CLASS-SESSION`; Teacher assigned class. Pending actor titles are not permission grants.
- **Logical entities:** ClassSession;MeetingReference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Scheduled -> started -> ended; correction approval distinct. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-042;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Actual hours and scheduled count.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-042` — Start begins timer and opens configured link;not provider attendance proof. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-08-d043"></a>
### WF-08.D043 — D-043

- **Basis:** `D-043`; approved references `AM-04;AM-07`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** End stops timer and opens course form;Draft not submission;timely valid submission independent of Zimmadar review AM-17.
- **Screen / actor:** `SCR-CLASS-REPORT`; Teacher assigned class. Pending actor titles are not permission grants.
- **Logical entities:** ClassSession;ClassReport;ReportDeadline. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Draft -> submitted -> approved or returned/revised; homework separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-043;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Report compliance and homework.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-043` — End stops timer and opens course form;Draft not submission;timely valid submission independent of Zimmadar review AM-17. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-08-d044"></a>
### WF-08.D044 — D-044

- **Basis:** `D-044`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Return requires reason;Teacher revises/resubmits with immutable history. Initial submission record retained;revision deadline not yet approved.
- **Screen / actor:** `SCR-CLASS-REPORT`; Zimmadar returns;Teacher revises. Pending actor titles are not permission grants.
- **Logical entities:** ClassReport;ReportRevision. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Draft -> submitted -> approved or returned/revised; homework separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-044;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Report compliance and homework.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-044` — Return requires reason;Teacher revises/resubmits with immutable history. Initial submission record retained;revision deadline not yet approved. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-05-d045"></a>
### WF-05.D045 — D-045

- **Basis:** `D-045`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Ordinary notice records12h lead;emergency handled separately.
- **Screen / actor:** `SCR-TEACHER-LEAVE`; Teacher notifies Zimmadar. Pending actor titles are not permission grants.
- **Logical entities:** TeacherLeave;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Notice/request -> authorized assignment/approval. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-045;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave and substitute coverage.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-045` — Ordinary notice records12h lead;emergency handled separately. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-05-d046"></a>
### WF-05.D046 — D-046

- **Basis:** `D-046`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Prompt emergency notice;no invented fixed emergency SLA.
- **Screen / actor:** `SCR-TEACHER-LEAVE`; Teacher urgent notice;Zimmadar assigns substitute. Pending actor titles are not permission grants.
- **Logical entities:** TeacherLeave;SubstituteAssignment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Notice/request -> authorized assignment/approval. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-046;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave and substitute coverage.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-046` — Prompt emergency notice;no invented fixed emergency SLA. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-05-d047"></a>
### WF-05.D047 — D-047

- **Basis:** `D-047`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Same time/link -> no separate Guardian/Student substitute notification.
- **Screen / actor:** `SCR-SUBSTITUTES`; Notification worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** SubstituteAssignment;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Notice/request -> authorized assignment/approval. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-047;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave and substitute coverage.
- **Dependencies:** D-037;D-048;D-049.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-047` — Same time/link -> no separate Guardian/Student substitute notification. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-09-d048"></a>
### WF-09.D048 — D-048

- **Basis:** `D-048`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Teacher cannot finalize reschedule/cancel without Zimmadar.
- **Screen / actor:** `SCR-RESCHEDULE`; Teacher requests;Zimmadar final authority. Pending actor titles are not permission grants.
- **Logical entities:** ScheduleChange;ClassSession. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Teacher request -> Zimmadar decision; makeup Supervisor approval first. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-048;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Schedule change/makeup history.
- **Dependencies:** D-049;D-050;D-051.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-048` — Teacher cannot finalize reschedule/cancel without Zimmadar. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-09-d049"></a>
### WF-09.D049 — D-049

- **Basis:** `D-049`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Reschedule/cancel updates routine and sends Telegram notice.
- **Screen / actor:** `SCR-RESCHEDULE`; Zimmadar decision;worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** Routine;ScheduleChange;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Teacher request -> Zimmadar decision; makeup Supervisor approval first. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-049;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Schedule change/makeup history.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-049` — Reschedule/cancel updates routine and sends Telegram notice. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-09-d050"></a>
### WF-09.D050 — D-050

- **Basis:** `D-050`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Makeup necessity approval precedes approved makeup scheduling.
- **Screen / actor:** `SCR-MAKEUP`; Department Supervisor approves necessity. Pending actor titles are not permission grants.
- **Logical entities:** MakeupRequest;ClassSession. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Teacher request -> Zimmadar decision; makeup Supervisor approval first. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-050;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Schedule change/makeup history.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-050` — Makeup necessity approval precedes approved makeup scheduling. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-09-d051"></a>
### WF-09.D051 — D-051

- **Basis:** `D-051`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** After approval,Zimmadar sets coordinated makeup time.
- **Screen / actor:** `SCR-MAKEUP`; Zimmadar coordinates Teacher/Guardian. Pending actor titles are not permission grants.
- **Logical entities:** MakeupRequest;Routine. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Teacher request -> Zimmadar decision; makeup Supervisor approval first. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-051;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Schedule change/makeup history.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-051` — After approval,Zimmadar sets coordinated makeup time. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-09-d052"></a>
### WF-09.D052 — D-052

- **Basis:** `D-052`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Makeup links cancelled original;own attendance,hours,report retained.
- **Screen / actor:** `SCR-MAKEUP`; Assigned Teacher;Zimmadar oversight. Pending actor titles are not permission grants.
- **Logical entities:** ClassSession;AttendanceEntry;ClassReport. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Teacher request -> Zimmadar decision; makeup Supervisor approval first. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-052;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Schedule change/makeup history.
- **Dependencies:** D-050;D-051;D-053.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-052` — Makeup links cancelled original;own attendance,hours,report retained. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-07-d053"></a>
### WF-07.D053 — D-053

- **Basis:** `D-053`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Provider input only if feasible;manual path remains;Teacher verifies.
- **Screen / actor:** `SCR-ATTENDANCE`; Teacher verifies;provider capability pending. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceImport;AttendanceEntry. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Input -> Teacher verification -> attendance; revision separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-053;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Class/child attendance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-053` — Provider input only if feasible;manual path remains;Teacher verifies. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-07-d054"></a>
### WF-07.D054 — D-054

- **Basis:** `D-054`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Only Present,Absent,Late final statuses;leave stored separately.
- **Screen / actor:** `SCR-ATTENDANCE`; Teacher own class. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceEntry. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Input -> Teacher verification -> attendance; revision separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-054;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Class/child attendance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-054` — Only Present,Absent,Late final statuses;leave stored separately. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-07-d055"></a>
### WF-07.D055 — D-055

- **Basis:** `D-055`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Exactly15min Present;15min01s Late.
- **Screen / actor:** `SCR-ATTENDANCE`; Teacher verifies;classification rule. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceEntry;ClassSession. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Input -> Teacher verification -> attendance; revision separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-055;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Class/child attendance.
- **Dependencies:** D-040;D-053;D-054.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-055` — Exactly15min Present;15min01s Late. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-11-d056"></a>
### WF-11.D056 — D-056

- **Basis:** `D-056`; approved references `AM-01;AM-09`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** First alert7 consecutive unauthorized held misses;not calendar days;per enrollment.
- **Screen / actor:** `SCR-ABSENCE`; Zimmadar alert;designated Teacher contacts. Pending actor titles are not permission grants.
- **Logical entities:** Enrollment;AbsenceCounter;FollowupCase. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Per enrollment; second count after first follow-up COMPLETED; no calendar-day substitute. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-056;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Unauthorized absence cases.
- **Dependencies:** D-019;D-057;D-072;D-073;D-148.
- **Open question references:** Q-02;Q-11.
- **Acceptance:** `AT-MAP-056` — First alert7 consecutive unauthorized held misses;not calendar days;per enrollment. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-11-d057"></a>
### WF-11.D057 — D-057

- **Basis:** `D-057`; approved references `AM-02;AM-06;AM-09`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Second count starts after first completion;6 no second escalation;7 triggers.
- **Screen / actor:** `SCR-ABSENCE`; Zimmadar reminder;Supervisor escalation. Pending actor titles are not permission grants.
- **Logical entities:** AbsenceCounter;FollowupCase;FollowupNote. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Per enrollment; second count after first follow-up COMPLETED; no calendar-day substitute. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-057;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Unauthorized absence cases.
- **Dependencies:** D-056;D-072;D-073;D-102;D-148.
- **Open question references:** Q-02;Q-11.
- **Acceptance:** `AT-MAP-057` — Second count starts after first completion;6 no second escalation;7 triggers. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-17-d058"></a>
### WF-17.D058 — D-058

- **Basis:** `D-058`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Authorized final attendance edits retain full history.
- **Screen / actor:** `SCR-ATTENDANCE-CORRECTION`; Teacher own class within D-080 limits. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceEntry;AttendanceRevision;AuditLog. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Record-specific window -> direct edit or authorized approval -> audited revision. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-058;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Revision audit.
- **Dependencies:** D-080;D-081;D-082.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-058` — Authorized final attendance edits retain full history. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-07-d059"></a>
### WF-07.D059 — D-059

- **Basis:** `D-059`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Deny cross-family access;staff need authorized record scope.
- **Screen / actor:** `SCR-ATTENDANCE`; Authorized scoped staff;Guardian own child. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceEntry;FamilyMembership. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Input -> Teacher verification -> attendance; revision separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-059;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Class/child attendance.
- **Dependencies:** D-010;D-064;D-066;D-191.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-059` — Deny cross-family access;staff need authorized record scope. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-20-d060"></a>
### WF-20.D060 — D-060

- **Basis:** `D-060`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Instant,daily,weekly attendance notification preferences selectable.
- **Screen / actor:** `SCR-NOTIFICATIONS`; Guardian own children. Pending actor titles are not permission grants.
- **Logical entities:** GuardianPreference;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Separate identities -> linked children -> per-child preferences. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-060;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Family/notification configuration.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-060` — Instant,daily,weekly attendance notification preferences selectable. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-20-d061"></a>
### WF-20.D061 — D-061

- **Basis:** `D-061`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Portal and linked personal Telegram attendance notices supported.
- **Screen / actor:** `SCR-NOTIFICATIONS`; Guardian own child recipient. Pending actor titles are not permission grants.
- **Logical entities:** NotificationJob;TelegramLink. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Separate identities -> linked children -> per-child preferences. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-061;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Family/notification configuration.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-061` — Portal and linked personal Telegram attendance notices supported. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-20-d062"></a>
### WF-20.D062 — D-062

- **Basis:** `D-062`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Changing one child's frequency leaves sibling preference unchanged.
- **Screen / actor:** `SCR-NOTIFICATIONS`; Guardian linked family. Pending actor titles are not permission grants.
- **Logical entities:** GuardianPreference;FamilyMembership. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Separate identities -> linked children -> per-child preferences. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-062;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Family/notification configuration.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-062` — Changing one child's frequency leaves sibling preference unchanged. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-20-d063"></a>
### WF-20.D063 — D-063

- **Basis:** `D-063`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Secure optional linking;portal notices work without Telegram.
- **Screen / actor:** `SCR-TELEGRAM-LINK`; Guardian authorized account. Pending actor titles are not permission grants.
- **Logical entities:** TelegramLink;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Separate identities -> linked children -> per-child preferences. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-063;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Family/notification configuration.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-063` — Secure optional linking;portal notices work without Telegram. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-20-d064"></a>
### WF-20.D064 — D-064

- **Basis:** `D-064`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Two guardian roles use distinct login identities.
- **Screen / actor:** `SCR-FAMILY`; Primary/Secondary Guardian separate logins. Pending actor titles are not permission grants.
- **Logical entities:** User;Guardian;FamilyMembership. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Separate identities -> linked children -> per-child preferences. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-064;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Family/notification configuration.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-064` — Two guardian roles use distinct login identities. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-20-d065"></a>
### WF-20.D065 — D-065

- **Basis:** `D-065`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Primary manages secondary without admin approval;secondary denied management.
- **Screen / actor:** `SCR-FAMILY`; Primary only;no admin approval. Pending actor titles are not permission grants.
- **Logical entities:** Guardian;FamilyMembership;AuditLog. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Separate identities -> linked children -> per-child preferences. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-065;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Family/notification configuration.
- **Dependencies:** D-064;D-066.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-065` — Primary manages secondary without admin approval;secondary denied management. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-20-d066"></a>
### WF-20.D066 — D-066

- **Basis:** `D-066`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Academic,communication,absence,homework permitted;family administration denied.
- **Screen / actor:** `SCR-FAMILY`; Secondary linked children;no family administration. Pending actor titles are not permission grants.
- **Logical entities:** FamilyMembership;ScopeGrant. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Separate identities -> linked children -> per-child preferences. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-066;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Family/notification configuration.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-066` — Academic,communication,absence,homework permitted;family administration denied. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-21-d067"></a>
### WF-21.D067 — D-067

- **Basis:** `D-067`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Telegram message alone is not official absence notice.
- **Screen / actor:** `SCR-STUDENT-LEAVE`; Guardian submits through portal. Pending actor titles are not permission grants.
- **Logical entities:** LeaveRequest;ExternalReference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Portal request -> Zimmadar decision; extension Supervisor final; return from attendance. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-067;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave coverage and return.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-067` — Telegram message alone is not official absence notice. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-21-d068"></a>
### WF-21.D068 — D-068

- **Basis:** `D-068`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Teacher/Guardian cannot approve student absence notice.
- **Screen / actor:** `SCR-STUDENT-LEAVE`; Batch Zimmadar only approves/rejects. Pending actor titles are not permission grants.
- **Logical entities:** LeaveRequest;ApprovalRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Portal request -> Zimmadar decision; extension Supervisor final; return from attendance. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-068;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave coverage and return.
- **Dependencies:** D-067;D-069;D-070.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-068` — Teacher/Guardian cannot approve student absence notice. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-21-d069"></a>
### WF-21.D069 — D-069

- **Basis:** `D-069`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Written rejection reason and resubmission history required.
- **Screen / actor:** `SCR-STUDENT-LEAVE`; Zimmadar reason;Guardian resubmits. Pending actor titles are not permission grants.
- **Logical entities:** LeaveRequest;LeaveRevision. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Portal request -> Zimmadar decision; extension Supervisor final; return from attendance. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-069;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave coverage and return.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-069` — Written rejection reason and resubmission history required. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-21-d070"></a>
### WF-21.D070 — D-070

- **Basis:** `D-070`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Preclass allowed;emergency submission within class-end+24h.
- **Screen / actor:** `SCR-STUDENT-LEAVE`; Guardian;deadline guard candidate. Pending actor titles are not permission grants.
- **Logical entities:** LeaveRequest;ClassSession. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Portal request -> Zimmadar decision; extension Supervisor final; return from attendance. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-070;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave coverage and return.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-070` — Preclass allowed;emergency submission within class-end+24h. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-21-d071"></a>
### WF-21.D071 — D-071

- **Basis:** `D-071`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Range covers scheduled classes;past classes retain individual deadline checks.
- **Screen / actor:** `SCR-STUDENT-LEAVE`; Guardian own child;Zimmadar approval. Pending actor titles are not permission grants.
- **Logical entities:** LeaveRequest;LeaveClassCoverage. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Portal request -> Zimmadar decision; extension Supervisor final; return from attendance. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-071;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave coverage and return.
- **Dependencies:** D-070;D-074;D-075.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-071` — Range covers scheduled classes;past classes retain individual deadline checks. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-11-d072"></a>
### WF-11.D072 — D-072

- **Basis:** `D-072`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Approved leave keeps held Absent in denominator/visible percentage but pauses warning/follow-up;resume saved remaining time AM-12.
- **Screen / actor:** `SCR-ABSENCE`; Approved leave effect;approval D-068. Pending actor titles are not permission grants.
- **Logical entities:** LeaveRequest;AttendanceEntry;AbsenceCounter. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Per enrollment; second count after first follow-up COMPLETED; no calendar-day substitute. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-072;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Unauthorized absence cases.
- **Dependencies:** D-068;D-073;D-084.
- **Open question references:** Q-02;Q-11.
- **Acceptance:** `AT-MAP-072` — Approved leave keeps held Absent in denominator/visible percentage but pauses warning/follow-up;resume saved remaining time AM-12. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Retroactive leave/correction effect and exact correction timestamp boundary require review; no new rule assumed.

<a id="wf-11-d073"></a>
### WF-11.D073 — D-073

- **Basis:** `D-073`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Leave end resets absence counter;first postleave Present OR Late marks Returned AM-14;history retained.
- **Screen / actor:** `SCR-ABSENCE`; Counter worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** LeaveRequest;AbsenceCounter;AuditLog. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Per enrollment; second count after first follow-up COMPLETED; no calendar-day substitute. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-073;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Unauthorized absence cases.
- **Dependencies:** D-072;D-082.
- **Open question references:** Q-02;Q-11.
- **Acceptance:** `AT-MAP-073` — Leave end resets absence counter;first postleave Present OR Late marks Returned AM-14;history retained. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Retroactive leave/correction effect and exact correction timestamp boundary require review; no new rule assumed.

<a id="wf-21-d074"></a>
### WF-21.D074 — D-074

- **Basis:** `D-074`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Single notice maximum14 calendar days.
- **Screen / actor:** `SCR-STUDENT-LEAVE`; Guardian own child. Pending actor titles are not permission grants.
- **Logical entities:** LeaveRequest. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Portal request -> Zimmadar decision; extension Supervisor final; return from attendance. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-074;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave coverage and return.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-074` — Single notice maximum14 calendar days. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-21-d075"></a>
### WF-21.D075 — D-075

- **Basis:** `D-075`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Beyond14 days requires extension with review and final approval.
- **Screen / actor:** `SCR-LEAVE-EXTENSION`; Guardian requests;Zimmadar reviews;Supervisor final. Pending actor titles are not permission grants.
- **Logical entities:** LeaveExtension;ApprovalRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Portal request -> Zimmadar decision; extension Supervisor final; return from attendance. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-075;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave coverage and return.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-075` — Beyond14 days requires extension with review and final approval. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-21-d076"></a>
### WF-21.D076 — D-076

- **Basis:** `D-076`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Regular return;no mandatory special recovery plan imposed.
- **Screen / actor:** `SCR-STUDENT-RETURN`; Student return;academic actor pending. Pending actor titles are not permission grants.
- **Logical entities:** LeaveRequest;Enrollment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Portal request -> Zimmadar decision; extension Supervisor final; return from attendance. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-076;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave coverage and return.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-076` — Regular return;no mandatory special recovery plan imposed. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-21-d077"></a>
### WF-21.D077 — D-077

- **Basis:** `D-077`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** First verified postleave Present OR Late automatically marks Returned without confirmation form AM-14.
- **Screen / actor:** `SCR-STUDENT-RETURN`; Attendance worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceEntry;LeaveRequest;ReturnRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Portal request -> Zimmadar decision; extension Supervisor final; return from attendance. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-077;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave coverage and return.
- **Dependencies:** D-054;D-076;D-078.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-077` — First verified postleave Present OR Late automatically marks Returned without confirmation form AM-14. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-21-d078"></a>
### WF-21.D078 — D-078

- **Basis:** `D-078`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Status update without separate return confirmation notice.
- **Screen / actor:** `SCR-STUDENT-RETURN`; Portal status worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** ReturnRecord;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Portal request -> Zimmadar decision; extension Supervisor final; return from attendance. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-078;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave coverage and return.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-078` — Status update without separate return confirmation notice. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-17-d079"></a>
### WF-17.D079 — D-079

- **Basis:** `D-079`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** No separate guardian correction-request form imposed.
- **Screen / actor:** `SCR-ATTENDANCE-CORRECTION`; Guardian contacts Class Teacher. Pending actor titles are not permission grants.
- **Logical entities:** MessageThread;AttendanceRevision. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Record-specific window -> direct edit or authorized approval -> audited revision. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-079;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Revision audit.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-079` — No separate guardian correction-request form imposed. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-17-d080"></a>
### WF-17.D080 — D-080

- **Basis:** `D-080`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Calendar class-date seventh-day23:59 Bangladesh cutoff;later attendance correction needs Zimmadar approval AM-16;exact date inclusion follows answered example.
- **Screen / actor:** `SCR-ATTENDANCE-CORRECTION`; Teacher own class <=7d;later Zimmadar approval. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceEntry;AttendanceRevision;ApprovalRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Record-specific window -> direct edit or authorized approval -> audited revision. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-080;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Revision audit.
- **Dependencies:** D-058;D-079;D-081;D-082.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-080` — Calendar class-date seventh-day23:59 Bangladesh cutoff;later attendance correction needs Zimmadar approval AM-16;exact date inclusion follows answered example. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Retroactive leave/correction effect and exact correction timestamp boundary require review; no new rule assumed.

<a id="wf-17-d081"></a>
### WF-17.D081 — D-081

- **Basis:** `D-081`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Correction shown on dashboard;no separate correction notice.
- **Screen / actor:** `SCR-ATTENDANCE-CORRECTION`; Guardian own child view. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceRevision;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Record-specific window -> direct edit or authorized approval -> audited revision. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-081;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Revision audit.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-02.
- **Acceptance:** `AT-MAP-081` — Correction shown on dashboard;no separate correction notice. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-17-d082"></a>
### WF-17.D082 — D-082

- **Basis:** `D-082`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Recalculate counters;close unnecessary pending alerts;retain history.
- **Screen / actor:** `SCR-ATTENDANCE-CORRECTION`; Recalculation worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceRevision;AbsenceCounter;FollowupCase. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Record-specific window -> direct edit or authorized approval -> audited revision. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-082;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Revision audit.
- **Dependencies:** D-019;D-056;D-057;D-072;D-073;D-094.
- **Open question references:** Q-02;Q-11.
- **Acceptance:** `AT-MAP-082` — Recalculate counters;close unnecessary pending alerts;retain history. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Retroactive leave/correction effect and exact correction timestamp boundary require review; no new rule assumed.

<a id="wf-07-d083"></a>
### WF-07.D083 — D-083

- **Basis:** `D-083`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Summary,percentage,monthly calendar,class history,approved leave shown.
- **Screen / actor:** `SCR-ATTENDANCE-SUMMARY`; Guardian own child. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceEntry;LeaveRequest;AttendanceSummary. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Input -> Teacher verification -> attendance; revision separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-083;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Class/child attendance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-083` — Summary,percentage,monthly calendar,class history,approved leave shown. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d084"></a>
### WF-22.D084 — D-084

- **Basis:** `D-084`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Percentage=(Present+Late)/Held*100 over effective enrollment;leave Absent denominator;percentage visible during pause AM-12/15.
- **Screen / actor:** `SCR-LOW-ATTENDANCE`; Authorized viewers;calculation worker. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceEntry;AttendanceSummary. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-084;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** D-054;D-072;D-085;D-095;D-096.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-084` — Percentage=(Present+Late)/Held*100 over effective enrollment;leave Absent denominator;percentage visible during pause AM-12/15. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d085"></a>
### WF-22.D085 — D-085

- **Basis:** `D-085`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Below75% warns;exact75% no warning;month/sample conditions apply.
- **Screen / actor:** `SCR-LOW-ATTENDANCE`; Warning worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceSummary;AttendanceWarning. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-085;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** D-084;D-086;D-093;D-094;D-095;D-096.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-085` — Below75% warns;exact75% no warning;month/sample conditions apply. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Prior-month pending closure versus new-month sample/recalculation requires explicit state model.

<a id="wf-22-d086"></a>
### WF-22.D086 — D-086

- **Basis:** `D-086`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** All3 authorized recipient types notified.
- **Screen / actor:** `SCR-LOW-ATTENDANCE`; Guardian;Class Teacher;Zimmadar recipients. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceWarning;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-086;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-086` — All3 authorized recipient types notified. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d087"></a>
### WF-22.D087 — D-087

- **Basis:** `D-087`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Contact notes due3 days from warning;approved-leave pause saves and resumes remaining time AM-12;day arithmetic pending.
- **Screen / actor:** `SCR-FOLLOWUP`; Assigned Class Teacher contacts Guardian. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceWarning;FollowupCase;FollowupNote. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-087;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** D-086;D-088;D-089;D-090;D-091;D-092;D-102.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-087` — Contact notes due3 days from warning;approved-leave pause saves and resumes remaining time AM-12;day arithmetic pending. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d088"></a>
### WF-22.D088 — D-088

- **Basis:** `D-088`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** At3 days Teacher/Zimmadar then another3 days Supervisor;approved-leave remaining-time pause AM-12.
- **Screen / actor:** `SCR-FOLLOWUP`; Teacher/Zimmadar/Supervisor recipients. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-088;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** D-087.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-088` — At3 days Teacher/Zimmadar then another3 days Supervisor;approved-leave remaining-time pause AM-12. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d089"></a>
### WF-22.D089 — D-089

- **Basis:** `D-089`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Free text includes contact date,guardian statement,next steps.
- **Screen / actor:** `SCR-FOLLOWUP-NOTES`; Assigned Teacher writes. Pending actor titles are not permission grants.
- **Logical entities:** FollowupNote. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-089;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-089` — Free text includes contact date,guardian statement,next steps. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d090"></a>
### WF-22.D090 — D-090

- **Basis:** `D-090`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Guardian/unrelated Teacher/unapproved staff denied private notes.
- **Screen / actor:** `SCR-FOLLOWUP-NOTES`; Related Teacher;Zimmadar;Supervisor;Authorized Management. Pending actor titles are not permission grants.
- **Logical entities:** FollowupNote;ScopeGrant. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-090;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-090` — Guardian/unrelated Teacher/unapproved staff denied private notes. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-17-d091"></a>
### WF-17.D091 — D-091

- **Basis:** `D-091`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Within24h teacher edit;after window approval;exact boundary design pending.
- **Screen / actor:** `SCR-FOLLOWUP-NOTES`; Teacher24h window;later Zimmadar approval. Pending actor titles are not permission grants.
- **Logical entities:** FollowupNote;FollowupNoteRevision;ApprovalRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Record-specific window -> direct edit or authorized approval -> audited revision. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-091;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Revision audit.
- **Dependencies:** D-089;D-090;D-092.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-091` — Within24h teacher edit;after window approval;exact boundary design pending. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-17-d092"></a>
### WF-17.D092 — D-092

- **Basis:** `D-092`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Before/after,editor,time,approval history retained.
- **Screen / actor:** `SCR-FOLLOWUP-NOTES`; Authorized editor/approver. Pending actor titles are not permission grants.
- **Logical entities:** FollowupNoteRevision;AuditLog. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Record-specific window -> direct edit or authorized approval -> audited revision. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-092;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Revision audit.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-092` — Before/after,editor,time,approval history retained. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d093"></a>
### WF-22.D093 — D-093

- **Basis:** `D-093`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** While below75%,new warning/follow-up every7 days;approved-leave warnings paused;cadence-resume detail pending AM-12.
- **Screen / actor:** `SCR-LOW-ATTENDANCE`; Warning worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceWarning;FollowupCase. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-093;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** D-085;D-094;D-095;D-096;D-097.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-093` — While below75%,new warning/follow-up every7 days;approved-leave warnings paused;cadence-resume detail pending AM-12. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Prior-month pending closure versus new-month sample/recalculation requires explicit state model.

<a id="wf-22-d094"></a>
### WF-22.D094 — D-094

- **Basis:** `D-094`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** At>=75% close applicable pending LOW_ATTENDANCE cases;prior-month closure needs new month>=3 held;not absence/action-plan AM-13.
- **Screen / actor:** `SCR-LOW-ATTENDANCE`; Closure worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceSummary;FollowupCase. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-094;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** D-084;D-093;D-097.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-094` — At>=75% close applicable pending LOW_ATTENDANCE cases;prior-month closure needs new month>=3 held;not absence/action-plan AM-13. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Prior-month pending closure versus new-month sample/recalculation requires explicit state model.

<a id="wf-22-d095"></a>
### WF-22.D095 — D-095

- **Basis:** `D-095`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Current Bangladesh calendar month only;include relevant held classes during effective enrollment AM-15.
- **Screen / actor:** `SCR-LOW-ATTENDANCE`; Calculation worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceSummary;ClassSession. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-095;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-095` — Current Bangladesh calendar month only;include relevant held classes during effective enrollment AM-15. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d096"></a>
### WF-22.D096 — D-096

- **Basis:** `D-096`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Below3 new-month held no warning or prior-month recovery closure;at least3 enables relevant rules AM-13/15.
- **Screen / actor:** `SCR-LOW-ATTENDANCE`; Warning worker candidate. Pending actor titles are not permission grants.
- **Logical entities:** AttendanceSummary;AttendanceWarning. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-096;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-096` — Below3 new-month held no warning or prior-month recovery closure;at least3 enables relevant rules AM-13/15. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d097"></a>
### WF-22.D097 — D-097

- **Basis:** `D-097`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Rollover preserves prior pending;auto-close only after new month>=3 held and>=75%,LOW_ATTENDANCE kind only AM-13.
- **Screen / actor:** `SCR-FOLLOWUP`; Assigned Teacher;Zimmadar oversight. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;AttendanceWarning. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-097;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** D-093;D-094;D-095.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-097` — Rollover preserves prior pending;auto-close only after new month>=3 held and>=75%,LOW_ATTENDANCE kind only AM-13. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Prior-month pending closure versus new-month sample/recalculation requires explicit state model.

<a id="wf-22-d098"></a>
### WF-22.D098 — D-098

- **Basis:** `D-098`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Pending,Overdue,Completed,Escalated filters respect batch scope.
- **Screen / actor:** `SCR-FOLLOWUP`; Zimmadar own batches. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-098;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-098` — Pending,Overdue,Completed,Escalated filters respect batch scope. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d099"></a>
### WF-22.D099 — D-099

- **Basis:** `D-099`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Bulk reminder allowed;Complete/Close individually only.
- **Screen / actor:** `SCR-FOLLOWUP`; Zimmadar bulk reminder only. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-099;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** D-098;D-100;D-101;D-102.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-099` — Bulk reminder allowed;Complete/Close individually only. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d100"></a>
### WF-22.D100 — D-100

- **Basis:** `D-100`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Portal reminders plus personal Telegram when linked.
- **Screen / actor:** `SCR-FOLLOWUP`; Assigned Teacher recipient. Pending actor titles are not permission grants.
- **Logical entities:** NotificationJob;TelegramLink. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-100;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-100` — Portal reminders plus personal Telegram when linked. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d101"></a>
### WF-22.D101 — D-101

- **Basis:** `D-101`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Acknowledgement not mandatory and not itself completion.
- **Screen / actor:** `SCR-FOLLOWUP`; Teacher optional acknowledgement. Pending actor titles are not permission grants.
- **Logical entities:** ReminderAcknowledgement;FollowupCase. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-101;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-101` — Acknowledgement not mandatory and not itself completion. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d102"></a>
### WF-22.D102 — D-102

- **Basis:** `D-102`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Notes submission automatically completes follow-up.
- **Screen / actor:** `SCR-FOLLOWUP`; Assigned Teacher submits notes. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;FollowupNote. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-102;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** D-089;D-090;D-091;D-103;D-106.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-102` — Notes submission automatically completes follow-up. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d103"></a>
### WF-22.D103 — D-103

- **Basis:** `D-103`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Time-window permission enforced;D-106 cap also applies.
- **Screen / actor:** `SCR-FOLLOWUP-REOPEN`; Teacher24h after completion;later Zimmadar permission. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;ReopenRequest;ApprovalRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-103;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** D-102;D-104;D-105;D-106;D-107.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-103` — Time-window permission enforced;D-106 cap also applies. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d104"></a>
### WF-22.D104 — D-104

- **Basis:** `D-104`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Reopened follow-up due24h from reopen.
- **Screen / actor:** `SCR-FOLLOWUP-REOPEN`; Assigned Teacher. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;FollowupDeadline. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-104;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-104` — Reopened follow-up due24h from reopen. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d105"></a>
### WF-22.D105 — D-105

- **Basis:** `D-105`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Incomplete reopened case after24h triggers both.
- **Screen / actor:** `SCR-FOLLOWUP-REOPEN`; Teacher reminder;Zimmadar alert. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-105;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-105` — Incomplete reopened case after24h triggers both. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d106"></a>
### WF-22.D106 — D-106

- **Basis:** `D-106`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Two reopens allowed;third rejected.
- **Screen / actor:** `SCR-FOLLOWUP-REOPEN`; Reopen guard candidate. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;ReopenHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-106;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-106` — Two reopens allowed;third rejected. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d107"></a>
### WF-22.D107 — D-107

- **Basis:** `D-107`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** After cap,new follow-up requires request and Zimmadar review/approval.
- **Screen / actor:** `SCR-FOLLOWUP-REOPEN`; Teacher requests;Zimmadar reviews/creates/approves. Pending actor titles are not permission grants.
- **Logical entities:** FollowupRequest;FollowupCase. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-107;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** D-106;D-108;D-109.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-107` — After cap,new follow-up requires request and Zimmadar review/approval. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d108"></a>
### WF-22.D108 — D-108

- **Basis:** `D-108`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** New approved follow-up due3 days after approval.
- **Screen / actor:** `SCR-FOLLOWUP`; Assigned Teacher. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;ApprovalRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-108;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-108` — New approved follow-up due3 days after approval. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-22-d109"></a>
### WF-22.D109 — D-109

- **Basis:** `D-109`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Pending3d Teacher+Zimmadar;6d Supervisor for new approved case.
- **Screen / actor:** `SCR-FOLLOWUP`; Teacher;Zimmadar;Supervisor recipients. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Monthly calculation separate from streak; notes complete case; reopen capped2. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-109;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Pending/overdue/completed/escalated cases.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-109` — Pending3d Teacher+Zimmadar;6d Supervisor for new approved case. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-26-d110"></a>
### WF-26.D110 — D-110

- **Basis:** `D-110`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Supervisor can remind or reassign escalated case.
- **Screen / actor:** `SCR-ESCALATIONS`; Department Supervisor. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;AssignmentHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Escalated -> reassigned -> 48h due -> further24h Management. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-110;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Reassignment and overdue work.
- **Dependencies:** D-109;D-111;D-112.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-110` — Supervisor can remind or reassign escalated case. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-26-d111"></a>
### WF-26.D111 — D-111

- **Basis:** `D-111`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Reassigned follow-up due48h after reassignment.
- **Screen / actor:** `SCR-ESCALATIONS`; New assigned Teacher. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;AssignmentHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Escalated -> reassigned -> 48h due -> further24h Management. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-111;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Reassignment and overdue work.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-111` — Reassigned follow-up due48h after reassignment. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-26-d112"></a>
### WF-26.D112 — D-112

- **Basis:** `D-112`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Pending48h Teacher+Supervisor;another24h Management.
- **Screen / actor:** `SCR-ESCALATIONS`; Teacher;Supervisor;Management recipients. Pending actor titles are not permission grants.
- **Logical entities:** FollowupCase;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Escalated -> reassigned -> 48h due -> further24h Management. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-112;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Reassignment and overdue work.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-112` — Pending48h Teacher+Supervisor;another24h Management. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-26-d113"></a>
### WF-26.D113 — D-113

- **Basis:** `D-113`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Management first requests Supervisor plan;may reassign or change deadline.
- **Screen / actor:** `SCR-ESCALATIONS`; Management. Pending actor titles are not permission grants.
- **Logical entities:** ManagementRequest;FollowupCase. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Escalated -> reassigned -> 48h due -> further24h Management. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-113;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Reassignment and overdue work.
- **Dependencies:** D-112;D-114;D-118.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-113` — Management first requests Supervisor plan;may reassign or change deadline. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-27-d114"></a>
### WF-27.D114 — D-114

- **Basis:** `D-114`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Submit plan24h after Management request.
- **Screen / actor:** `SCR-ACTION-PLAN`; Department Supervisor. Pending actor titles are not permission grants.
- **Logical entities:** ActionPlan;ManagementRequest. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request24h -> reassignment12h; approval/revision12h; progress24h. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-114;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Plan and progress status.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-114` — Submit plan24h after Management request. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-27-d115"></a>
### WF-27.D115 — D-115

- **Basis:** `D-115`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** No plan24h alerts Management;another Supervisor/Staff can be assigned.
- **Screen / actor:** `SCR-ACTION-PLAN`; Management alert;reassignment authority source context. Pending actor titles are not permission grants.
- **Logical entities:** ActionPlan;AssignmentHistory;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request24h -> reassignment12h; approval/revision12h; progress24h. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-115;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Plan and progress status.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-115` — No plan24h alerts Management;another Supervisor/Staff can be assigned. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-27-d116"></a>
### WF-27.D116 — D-116

- **Basis:** `D-116`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Reassigned plan due12h after assignment.
- **Screen / actor:** `SCR-ACTION-PLAN`; New assigned Supervisor/Staff. Pending actor titles are not permission grants.
- **Logical entities:** ActionPlan;AssignmentHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request24h -> reassignment12h; approval/revision12h; progress24h. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-116;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Plan and progress status.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-116` — Reassigned plan due12h after assignment. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-27-d117"></a>
### WF-27.D117 — D-117

- **Basis:** `D-117`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** No plan12h permits Management plan/reassignment/emergency action.
- **Screen / actor:** `SCR-ACTION-PLAN`; Management. Pending actor titles are not permission grants.
- **Logical entities:** ActionPlan;ManagementIntervention. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request24h -> reassignment12h; approval/revision12h; progress24h. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-117;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Plan and progress status.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-117` — No plan12h permits Management plan/reassignment/emergency action. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-27-d118"></a>
### WF-27.D118 — D-118

- **Basis:** `D-118`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Staff-authored approval required;Management-authored no second approval.
- **Screen / actor:** `SCR-ACTION-PLAN`; Management approval;Management author exempt. Pending actor titles are not permission grants.
- **Logical entities:** ActionPlan;ApprovalRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request24h -> reassignment12h; approval/revision12h; progress24h. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-118;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Plan and progress status.
- **Dependencies:** D-114;D-119;D-120;D-121.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-118` — Staff-authored approval required;Management-authored no second approval. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-27-d119"></a>
### WF-27.D119 — D-119

- **Basis:** `D-119`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Returned plan revision due12h with history.
- **Screen / actor:** `SCR-ACTION-PLAN`; Management returns;assigned author revises. Pending actor titles are not permission grants.
- **Logical entities:** ActionPlan;PlanRevision. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request24h -> reassignment12h; approval/revision12h; progress24h. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-119;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Plan and progress status.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-119` — Returned plan revision due12h with history. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-27-d120"></a>
### WF-27.D120 — D-120

- **Basis:** `D-120`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Missing revision12h alerts Management;amend/reassign/emergency intervention available.
- **Screen / actor:** `SCR-ACTION-PLAN`; Management. Pending actor titles are not permission grants.
- **Logical entities:** ActionPlan;NotificationJob;AssignmentHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request24h -> reassignment12h; approval/revision12h; progress24h. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-120;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Plan and progress status.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-120` — Missing revision12h alerts Management;amend/reassign/emergency intervention available. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-27-d121"></a>
### WF-27.D121 — D-121

- **Basis:** `D-121`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Approved plan execution responsibility remains Supervisor.
- **Screen / actor:** `SCR-ACTION-PLAN`; Department Supervisor implements. Pending actor titles are not permission grants.
- **Logical entities:** ActionPlan;PlanTask. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request24h -> reassignment12h; approval/revision12h; progress24h. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-121;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Plan and progress status.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-121` — Approved plan execution responsibility remains Supervisor. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-27-d122"></a>
### WF-27.D122 — D-122

- **Basis:** `D-122`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Until completed,update at least every24h.
- **Screen / actor:** `SCR-PLAN-PROGRESS`; Department Supervisor. Pending actor titles are not permission grants.
- **Logical entities:** ActionPlan;ProgressUpdate. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request24h -> reassignment12h; approval/revision12h; progress24h. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-122;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Plan and progress status.
- **Dependencies:** D-121;D-123;D-124;D-125.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-122` — Until completed,update at least every24h. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-27-d123"></a>
### WF-27.D123 — D-123

- **Basis:** `D-123`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** No update24h triggers both.
- **Screen / actor:** `SCR-PLAN-PROGRESS`; Supervisor reminder;Management alert. Pending actor titles are not permission grants.
- **Logical entities:** ProgressUpdate;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request24h -> reassignment12h; approval/revision12h; progress24h. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-123;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Plan and progress status.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-123` — No update24h triggers both. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-27-d124"></a>
### WF-27.D124 — D-124

- **Basis:** `D-124`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Overall status,completed/pending tasks,blockers,next steps all present.
- **Screen / actor:** `SCR-PLAN-PROGRESS`; Responsible Supervisor. Pending actor titles are not permission grants.
- **Logical entities:** ProgressUpdate. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request24h -> reassignment12h; approval/revision12h; progress24h. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-124;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Plan and progress status.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-124` — Overall status,completed/pending tasks,blockers,next steps all present. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-28-d125"></a>
### WF-28.D125 — D-125

- **Basis:** `D-125`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Reported blocker alerts Management;status,resolver,resolution tracked.
- **Screen / actor:** `SCR-BLOCKERS`; Management alerted;resolver below. Pending actor titles are not permission grants.
- **Logical entities:** Blocker;BlockerHistory;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Critical6h/High12h/Normal24h; severity-specific escalation; Management override. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-125;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Blocker resolution history.
- **Dependencies:** D-126;D-127;D-128;D-129;D-130;D-131.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-125` — Reported blocker alerts Management;status,resolver,resolution tracked. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-28-d126"></a>
### WF-28.D126 — D-126

- **Basis:** `D-126`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Resolver assignment and overrides retain history.
- **Screen / actor:** `SCR-BLOCKERS`; Supervisor assigns;Management overrides. Pending actor titles are not permission grants.
- **Logical entities:** Blocker;AssignmentHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Critical6h/High12h/Normal24h; severity-specific escalation; Management override. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-126;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Blocker resolution history.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-126` — Resolver assignment and overrides retain history. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-28-d127"></a>
### WF-28.D127 — D-127

- **Basis:** `D-127`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Critical6h;High12h;Normal24h;Management changes recorded.
- **Screen / actor:** `SCR-BLOCKERS`; Supervisor priority;Management deadline override. Pending actor titles are not permission grants.
- **Logical entities:** Blocker;BlockerDeadline. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Critical6h/High12h/Normal24h; severity-specific escalation; Management override. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-127;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Blocker resolution history.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-127` — Critical6h;High12h;Normal24h;Management changes recorded. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-28-d128"></a>
### WF-28.D128 — D-128

- **Basis:** `D-128`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Priority changes require source-authorized actor.
- **Screen / actor:** `SCR-BLOCKERS`; Supervisor priority;Management overrides. Pending actor titles are not permission grants.
- **Logical entities:** Blocker;BlockerHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Critical6h/High12h/Normal24h; severity-specific escalation; Management override. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-128;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Blocker resolution history.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-128` — Priority changes require source-authorized actor. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-28-d129"></a>
### WF-28.D129 — D-129

- **Basis:** `D-129`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Critical overdue all3 immediately;High/Normal first2 then Management+6h.
- **Screen / actor:** `SCR-BLOCKERS`; Resolver;Supervisor;Management conditional recipients. Pending actor titles are not permission grants.
- **Logical entities:** Blocker;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Critical6h/High12h/Normal24h; severity-specific escalation; Management override. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-129;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Blocker resolution history.
- **Dependencies:** D-127;D-128;D-130;D-131.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-129` — Critical overdue all3 immediately;High/Normal first2 then Management+6h. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-28-d130"></a>
### WF-28.D130 — D-130

- **Basis:** `D-130`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Escalated blocker supports instruction,reassign,new deadline,direct intervention.
- **Screen / actor:** `SCR-BLOCKERS`; Management. Pending actor titles are not permission grants.
- **Logical entities:** Blocker;ManagementIntervention. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Critical6h/High12h/Normal24h; severity-specific escalation; Management override. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-130;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Blocker resolution history.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-130` — Escalated blocker supports instruction,reassign,new deadline,direct intervention. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-28-d131"></a>
### WF-28.D131 — D-131

- **Basis:** `D-131`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Reassigned escalated blocker needs explicit Management deadline;no invented fixed SLA.
- **Screen / actor:** `SCR-BLOCKERS`; Management sets reassigned deadline. Pending actor titles are not permission grants.
- **Logical entities:** Blocker;AssignmentHistory;BlockerDeadline. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Critical6h/High12h/Normal24h; severity-specific escalation; Management override. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-131;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Blocker resolution history.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-131` — Reassigned escalated blocker needs explicit Management deadline;no invented fixed SLA. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-18-d132"></a>
### WF-18.D132 — D-132

- **Basis:** `D-132`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** All source-listed first-version academic features retained despite staged sequence.
- **Screen / actor:** `SCR-RELEASE-SCOPE`; Release owner pending;Central approval gate. Pending actor titles are not permission grants.
- **Logical entities:** ReleaseScope;DecisionTrace. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Department/Branch tests -> Central approval; no automatic release. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Release and ownership evidence.
- **Dependencies:** D-133;D-134;D-135;D-136;D-137;D-138;D-179;D-180;D-201.
- **Open question references:** Q-08.
- **Acceptance:** `AT-MAP-132` — All source-listed first-version academic features retained despite staged sequence. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-20-d133"></a>
### WF-20.D133 — D-133

- **Basis:** `D-133`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** No separate Student login/dashboard in first version.
- **Screen / actor:** `SCR-FAMILY`; Guardian login;no Student login v1. Pending actor titles are not permission grants.
- **Logical entities:** User;Guardian;FamilyMembership. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Separate identities -> linked children -> per-child preferences. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-133;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Family/notification configuration.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-133` — No separate Student login/dashboard in first version. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-10-d134"></a>
### WF-10.D134 — D-134

- **Basis:** `D-134`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Oral/practical,written/MCQ,teacher-entered marks/results supported.
- **Screen / actor:** `SCR-EXAMS`; Academic assessor scope pending. Pending actor titles are not permission grants.
- **Logical entities:** Assessment;ExamAttempt;Result. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Assessment evidence -> eligibility -> final academic approval. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-134;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Assessment/results/promotion.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-134` — Oral/practical,written/MCQ,teacher-entered marks/results supported. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-08-d135"></a>
### WF-08.D135 — D-135

- **Basis:** `D-135`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** No mandatory online homework submission/marking imposed.
- **Screen / actor:** `SCR-HOMEWORK`; Teacher assigns/completes;Guardian views. Pending actor titles are not permission grants.
- **Logical entities:** Homework;HomeworkCompletion. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Draft -> submitted -> approved or returned/revised; homework separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-135;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Report compliance and homework.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-135` — No mandatory online homework submission/marking imposed. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-23-d136"></a>
### WF-23.D136 — D-136

- **Basis:** `D-136`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Exam,evaluation,attendance,homework jointly feed progress.
- **Screen / actor:** `SCR-PROGRESS`; Authorized academics;Guardian own child. Pending actor titles are not permission grants.
- **Logical entities:** StudentProgress;Result;AttendanceSummary;HomeworkCompletion. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Authorized academic inputs -> own-child progress/communication; publication pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-136;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Student progress and communication.
- **Dependencies:** D-084;D-134;D-135;D-148.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-136` — Exam,evaluation,attendance,homework jointly feed progress. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-16-d137"></a>
### WF-16.D137 — D-137

- **Basis:** `D-137`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Teacher metrics attendance,hours,reports,tasks;student-results score not mandatory v1.
- **Screen / actor:** `SCR-PERFORMANCE`; Authorized performance viewers pending. Pending actor titles are not permission grants.
- **Logical entities:** PerformanceReview;ClassSession;ClassReport;Task. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Collect role metrics -> related Supervisor review; private visibility. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-137;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Role-based private review.
- **Dependencies:** D-039;D-040;D-196;D-199.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-137` — Teacher metrics attendance,hours,reports,tasks;student-results score not mandatory v1. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-29-d138"></a>
### WF-29.D138 — D-138

- **Basis:** `D-138`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Student,Teacher,Batch,Department,Academy reports and management dashboard represented.
- **Screen / actor:** `SCR-REPORTS`; Authorized branch/department/record viewers. Pending actor titles are not permission grants.
- **Logical entities:** ReportDefinition;ReportRun. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Read authorized projections; never leak private source details. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-138;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Scoped consolidated reports.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-138` — Student,Teacher,Batch,Department,Academy reports and management dashboard represented. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-01-d139"></a>
### WF-01.D139 — D-139

- **Basis:** `D-139`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Guardian online and Admin manual admission both supported.
- **Screen / actor:** `SCR-ADMISSIONS`; Guardian applies;Admin manually enrolls. Pending actor titles are not permission grants.
- **Logical entities:** AdmissionApplication;Enrollment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Application/status and seat review. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-139;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Admission status summary.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-139` — Guardian online and Admin manual admission both supported. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-23-d140"></a>
### WF-23.D140 — D-140

- **Basis:** `D-140`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Official records/requests live in Portal;Telegram communication/notification only.
- **Screen / actor:** `SCR-MESSAGING`; Authorized academic participants. Pending actor titles are not permission grants.
- **Logical entities:** MessageThread;NotificationJob;ExternalReference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Authorized academic inputs -> own-child progress/communication; publication pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-140;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Student progress and communication.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-140` — Official records/requests live in Portal;Telegram communication/notification only. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-13-d141"></a>
### WF-13.D141 — D-141

- **Basis:** `D-141`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Fees,teacher pay,expenses,reports;collection remains separate portal.
- **Screen / actor:** `SCR-FINANCE`; Finance scope pending;external collection authority. Pending actor titles are not permission grants.
- **Logical entities:** Invoice;TeacherPayable;Expense;PaymentMirror. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Accounting states require further design; external confirmation remains separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-141;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Branch/department finance.
- **Dependencies:** D-015;D-147;D-160;D-161;D-171.
- **Open question references:** Q-06.
- **Acceptance:** `AT-MAP-141` — Fees,teacher pay,expenses,reports;collection remains separate portal. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-19-d142"></a>
### WF-19.D142 — D-142

- **Basis:** `D-142`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Shared system permits branch autonomy without cross-scope leakage.
- **Screen / actor:** `SCR-ORG`; Branch operations;Central oversight. Pending actor titles are not permission grants.
- **Logical entities:** Branch;ScopeGrant. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Configuration within centrally permitted bounds; exact admin matrix pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Organization/catalog settings.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-142` — Shared system permits branch autonomy without cross-scope leakage. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-30-d143"></a>
### WF-30.D143 — D-143

- **Basis:** `D-143`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Public catalog/admission and Admin/Teacher/Guardian logins coexist.
- **Screen / actor:** `SCR-PUBLIC-COURSES`; Public admission/catalog;authenticated staff/Guardian. Pending actor titles are not permission grants.
- **Logical entities:** Course;AdmissionApplication;User. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Public content separate from authenticated records; language preference. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Public catalog/app readiness.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-143` — Public catalog/admission and Admin/Teacher/Guardian logins coexist. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-30-d144"></a>
### WF-30.D144 — D-144

- **Basis:** `D-144`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Responsive mobile/desktop PWA;native mobile app not mandatory v1.
- **Screen / actor:** `SCR-APP-SHELL`; All authorized users. Pending actor titles are not permission grants.
- **Logical entities:** ApplicationManifest;UiPreference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Public content separate from authenticated records; language preference. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Public catalog/app readiness.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-144` — Responsive mobile/desktop PWA;native mobile app not mandatory v1. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-30-d145"></a>
### WF-30.D145 — D-145

- **Basis:** `D-145`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Bangla/English interface selection preserves academic records.
- **Screen / actor:** `SCR-LANGUAGE`; User own preference. Pending actor titles are not permission grants.
- **Logical entities:** UiPreference;TranslationCatalog. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Public content separate from authenticated records; language preference. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Public catalog/app readiness.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-145` — Bangla/English interface selection preserves academic records. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-04-d146"></a>
### WF-04.D146 — D-146

- **Basis:** `D-146`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Course/batch start/end,exam periods,schedules can differ.
- **Screen / actor:** `SCR-CALENDAR`; Academic scheduling authority pending. Pending actor titles are not permission grants.
- **Logical entities:** AcademicCalendar;Course;Batch. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Publish scheduled class context; held status separately verified. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-146;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Routine/calendar.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-146` — Course/batch start/end,exam periods,schedules can differ. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-13-d147"></a>
### WF-13.D147 — D-147

- **Basis:** `D-147`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Class-count/hour bases both supported;rates/approval rules pending.
- **Screen / actor:** `SCR-TEACHER-PAY`; Payroll authority pending. Pending actor titles are not permission grants.
- **Logical entities:** TeacherPayable;PayBasis;ClassSession. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Accounting states require further design; external confirmation remains separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-147;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Branch/department finance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-11.
- **Acceptance:** `AT-MAP-147` — Class-count/hour bases both supported;rates/approval rules pending. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Rates, fee adjustments, discount/waiver/refund powers not granted by this mapping; proposal6 stays unapproved.

<a id="wf-03-d148"></a>
### WF-03.D148 — D-148

- **Basis:** `D-148`; approved references `AM-09`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Concurrent enrollments have separate attendance/progress;count held classes only while relevant enrollment effective AM-09/15.
- **Screen / actor:** `SCR-ENROLLMENTS`; Enrollment authority pending;Guardian own child. Pending actor titles are not permission grants.
- **Logical entities:** Student;Enrollment;StudentProgress;AbsenceCounter. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Per-course lifecycle; preserve transfer history. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-148;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Enrollment history.
- **Dependencies:** D-019;D-056;D-057;D-136;D-157;D-158.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-148` — Concurrent enrollments have separate attendance/progress;count held classes only while relevant enrollment effective AM-09/15. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-31-d149"></a>
### WF-31.D149 — D-149

- **Basis:** `D-149`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Completion certificate generate/store/download;eligibility/signatory details pending.
- **Screen / actor:** `SCR-CERTIFICATES`; Issuer authority pending. Pending actor titles are not permission grants.
- **Logical entities:** Certificate;Enrollment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Completion evidence -> authorized issue; issuer/criteria design pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-149;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Certificate record.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-149` — Completion certificate generate/store/download;eligibility/signatory details pending. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-25-d150"></a>
### WF-25.D150 — D-150

- **Basis:** `D-150`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** PDF,notes,video,audio organized by department/course.
- **Screen / actor:** `SCR-MATERIALS`; Authorized course/department readers;publisher pending. Pending actor titles are not permission grants.
- **Logical entities:** LearningResource;ResourceAccess. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Publish/read under yet-to-be-designed resource permissions. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-150;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Resource catalog.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-150` — PDF,notes,video,audio organized by department/course. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-32-d151"></a>
### WF-32.D151 — D-151

- **Basis:** `D-151`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Year/session records remain accessible to authorized users.
- **Screen / actor:** `SCR-ARCHIVE`; Authorized historical readers. Pending actor titles are not permission grants.
- **Logical entities:** AcademicSession;ArchiveIndex. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Archive and read under access rules; export Admin authorized. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-151;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Archive/export/backup index.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-151` — Year/session records remain accessible to authorized users. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-33-d152"></a>
### WF-33.D152 — D-152

- **Basis:** `D-152`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Teacher,Admin,Supervisor,other staff profiles/roles/tasks/status represented.
- **Screen / actor:** `SCR-STAFF`; Authorized staff administrators. Pending actor titles are not permission grants.
- **Logical entities:** StaffProfile;RoleAssignment;Task. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Create/assign -> Central-approved transfer -> inactive with reassigned duties. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-152;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Staff history and assignments.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-152` — Teacher,Admin,Supervisor,other staff profiles/roles/tasks/status represented. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-34-d153"></a>
### WF-34.D153 — D-153

- **Basis:** `D-153`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Student,Guardian,Teacher,Batch import reconciles records;no unsafe automatic identity merge.
- **Screen / actor:** `SCR-IMPORT`; Authorized import operator pending. Pending actor titles are not permission grants.
- **Logical entities:** ImportRun;ImportRow;Student;Guardian;StaffProfile;Batch. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Dry-run/reconcile -> authorized import; identity/rollback design pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-153;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Counts, errors and reconciliation.
- **Dependencies:** D-177;D-186.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-153` — Student,Guardian,Teacher,Batch import reconciles records;no unsafe automatic identity merge. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-35-d154"></a>
### WF-35.D154 — D-154

- **Basis:** `D-154`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Central workflow view includes tasks,progress,approvals,follow-ups.
- **Screen / actor:** `SCR-MY-TASKS`; Teacher;Admin;Zimmadar;Supervisor scoped tasks. Pending actor titles are not permission grants.
- **Logical entities:** Task;ApprovalRecord;FollowupCase. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Show assigned tasks and existing domain states; no new permission source. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-154;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** My tasks and pending approvals.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-154` — Central workflow view includes tasks,progress,approvals,follow-ups. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-02-d155"></a>
### WF-02.D155 — D-155

- **Basis:** `D-155`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Course may use oral,written/MCQ,Teacher evaluation.
- **Screen / actor:** `SCR-PLACEMENT`; Admission assessor scope pending. Pending actor titles are not permission grants.
- **Logical entities:** Assessment;ExamAttempt;Result. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Assessment evidence to authorized placement. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-155;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Placement evidence.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-155` — Course may use oral,written/MCQ,Teacher evaluation. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-10-d156"></a>
### WF-10.D156 — D-156

- **Basis:** `D-156`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Eligibility alone cannot auto-promote without final academic approval.
- **Screen / actor:** `SCR-PROMOTION`; System eligibility;Authorized Academic Staff final. Pending actor titles are not permission grants.
- **Logical entities:** PromotionDecision;Assessment;Result. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Assessment evidence -> eligibility -> final academic approval. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-156;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Assessment/results/promotion.
- **Dependencies:** D-027;D-134.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-156` — Eligibility alone cannot auto-promote without final academic approval. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Promotion eligibility criteria must be defined before implementing calculation.

<a id="wf-03-d157"></a>
### WF-03.D157 — D-157

- **Basis:** `D-157`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Transfer preserves profile/history;attendance follows effective enrollment interval;exact transfer instant pending AM-15.
- **Screen / actor:** `SCR-TRANSFER`; Transfer authority pending. Pending actor titles are not permission grants.
- **Logical entities:** StudentTransfer;Enrollment;AcademicHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Per-course lifecycle; preserve transfer history. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-157;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Enrollment history.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-157` — Transfer preserves profile/history;attendance follows effective enrollment interval;exact transfer instant pending AM-15. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-03-d158"></a>
### WF-03.D158 — D-158

- **Basis:** `D-158`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Per-course lifecycle history preserved;attendance uses effective enrollment interval;status coverage boundaries pending AM-15.
- **Screen / actor:** `SCR-ENROLLMENTS`; Lifecycle operator authority pending. Pending actor titles are not permission grants.
- **Logical entities:** Enrollment;EnrollmentStatusHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Per-course lifecycle; preserve transfer history. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-158;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Enrollment history.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-158` — Per-course lifecycle history preserved;attendance uses effective enrollment interval;status coverage boundaries pending AM-15. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-23-d159"></a>
### WF-23.D159 — D-159

- **Basis:** `D-159`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Academic portal messaging coexists Telegram;cross-family reads denied.
- **Screen / actor:** `SCR-MESSAGING`; Guardian own child;related Teacher. Pending actor titles are not permission grants.
- **Logical entities:** MessageThread;Message;NotificationJob. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Authorized academic inputs -> own-child progress/communication; publication pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-159;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Student progress and communication.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-159` — Academic portal messaging coexists Telegram;cross-family reads denied. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-13-d160"></a>
### WF-13.D160 — D-160

- **Basis:** `D-160`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Fees,due,history,scholarship,discount,waiver,partial/installment supported;external confirmation only.
- **Screen / actor:** `SCR-FEES`; Fee administration authority pending. Pending actor titles are not permission grants.
- **Logical entities:** FeePlan;Invoice;FeeAdjustment;Installment;PaymentMirror. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Accounting states require further design; external confirmation remains separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-160;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Branch/department finance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-06.
- **Acceptance:** `AT-MAP-160` — Fees,due,history,scholarship,discount,waiver,partial/installment supported;external confirmation only. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Rates, fee adjustments, discount/waiver/refund powers not granted by this mapping; proposal6 stays unapproved.

<a id="wf-13-d161"></a>
### WF-13.D161 — D-161

- **Basis:** `D-161`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Scoped income,expenses,teacher pay,reports represented.
- **Screen / actor:** `SCR-FINANCE`; Authorized Finance/Management branch/department. Pending actor titles are not permission grants.
- **Logical entities:** Expense;TeacherPayable;Invoice;FinancialReport. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Accounting states require further design; external confirmation remains separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-161;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Branch/department finance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-06.
- **Acceptance:** `AT-MAP-161` — Scoped income,expenses,teacher pay,reports represented. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design. Rates, fee adjustments, discount/waiver/refund powers not granted by this mapping; proposal6 stays unapproved.

<a id="wf-24-d162"></a>
### WF-24.D162 — D-162

- **Basis:** `D-162`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Secure login,RBAC,privacy,audit,automated backups and verified recovery required.
- **Screen / actor:** `SCR-SECURITY`; Security/backup operator authority pending. Pending actor titles are not permission grants.
- **Logical entities:** User;ScopeGrant;AuditLog;BackupRun;RecoveryRun. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Authorize active role/scope/record; deny otherwise; recovery evidence separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Authorization/audit/recovery evidence.
- **Dependencies:** D-022;D-185;D-186;D-191;D-199.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-162` — Secure login,RBAC,privacy,audit,automated backups and verified recovery required. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-19-d163"></a>
### WF-19.D163 — D-163

- **Basis:** `D-163`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Local changes cannot exceed approved central bounds.
- **Screen / actor:** `SCR-SETTINGS`; Central policy owner;delegated Branch/Department. Pending actor titles are not permission grants.
- **Logical entities:** PolicyVersion;ScopedSetting. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Configuration within centrally permitted bounds; exact admin matrix pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Organization/catalog settings.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-08.
- **Acceptance:** `AT-MAP-163` — Local changes cannot exceed approved central bounds. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-15-d164"></a>
### WF-15.D164 — D-164

- **Basis:** `D-164`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Feedback/complaint assigned,tracked,resolved with authorized visibility.
- **Screen / actor:** `SCR-COMPLAINTS`; Guardian submits;Admin/Supervisor handles. Pending actor titles are not permission grants.
- **Logical entities:** SupportTicket;TicketAssignment;TicketHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Submit -> assigned -> tracked -> resolved; exact labels draft. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-164;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Scoped ticket status.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-164` — Feedback/complaint assigned,tracked,resolved with authorized visibility. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-01-d165"></a>
### WF-01.D165 — D-165

- **Basis:** `D-165`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Course,batch availability,application/status supported;applicant status private.
- **Screen / actor:** `SCR-PUBLIC-ADMISSIONS`; Public applicant;Admin processing. Pending actor titles are not permission grants.
- **Logical entities:** Course;Batch;AdmissionApplication. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Application/status and seat review. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-165;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Admission status summary.
- **Dependencies:** D-139;D-155;D-166.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-165` — Course,batch availability,application/status supported;applicant status private. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-01-d166"></a>
### WF-01.D166 — D-166

- **Basis:** `D-166`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Full batch waiting list;vacant seat triggers Admin review,not automatic enrollment.
- **Screen / actor:** `SCR-WAITING-LIST`; Applicant;Admin seat review. Pending actor titles are not permission grants.
- **Logical entities:** WaitingListEntry;Batch;AdmissionApplication. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Application/status and seat review. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-166;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Admission status summary.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-166` — Full batch waiting list;vacant seat triggers Admin review,not automatic enrollment. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-12-d167"></a>
### WF-12.D167 — D-167

- **Basis:** `D-167`; approved references `AM-05`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Legacy unchanged;full workflow parity unverified from supplied MVP.
- **Screen / actor:** `SCR-LEGACY-OVERVIEW`; Legacy authority;Academy read only. Pending actor titles are not permission grants.
- **Logical entities:** LegacyIdentityMap;LegacySnapshot;ExternalReference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Read -> validate -> map -> Academy projection; no legacy writes. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-167;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Legacy-linked dashboard with provenance.
- **Dependencies:** D-168;D-169;D-170;D-171;D-172;D-173;D-174;D-175.
- **Open question references:** Q-05;Q-10.
- **Acceptance:** `AT-MAP-167` — Legacy unchanged;full workflow parity unverified from supplied MVP. **NOT RUN**.
- **Remaining design:** Supplied MVP lacks Guardian Portal/full workflow evidence and real data dump; current-system schema/API/identity contracts pending. Q6 permission is not completion.

<a id="wf-12-d168"></a>
### WF-12.D168 — D-168

- **Basis:** `D-168`; approved references `AM-05`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Dedicated dashboard reads linked data,not a second editable master.
- **Screen / actor:** `SCR-LEGACY-OVERVIEW`; Scoped Academy users;details pending. Pending actor titles are not permission grants.
- **Logical entities:** LegacySnapshot;LegacyIdentityMap. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Read -> validate -> map -> Academy projection; no legacy writes. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-168;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Legacy-linked dashboard with provenance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-05;Q-10.
- **Acceptance:** `AT-MAP-168` — Dedicated dashboard reads linked data,not a second editable master. **NOT RUN**.
- **Remaining design:** Supplied MVP lacks Guardian Portal/full workflow evidence and real data dump; current-system schema/API/identity contracts pending. Q6 permission is not completion.

<a id="wf-12-d169"></a>
### WF-12.D169 — D-169

- **Basis:** `D-169`; approved references `AM-05;AM-10`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** One Academy Guardian login/dashboard shows linked children Batch and1:1 classes/progress;Primary/Secondary separate identities and permissions retained;no cross-family access AM-19.
- **Screen / actor:** `SCR-LEGACY-GUARDIAN`; Admin/Teacher Academy;Guardian separate legacy login. Pending actor titles are not permission grants.
- **Logical entities:** LegacyIdentityMap;User;FamilyMembership. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Read -> validate -> map -> Academy projection; no legacy writes. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-169;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Legacy-linked dashboard with provenance.
- **Dependencies:** D-064;D-133;D-170;D-172.
- **Open question references:** Q-05;Q-10.
- **Acceptance:** `AT-MAP-169` — One Academy Guardian login/dashboard shows linked children Batch and1:1 classes/progress;Primary/Secondary separate identities and permissions retained;no cross-family access AM-19. **NOT RUN**.
- **Remaining design:** Supplied MVP lacks Guardian Portal/full workflow evidence and real data dump; current-system schema/API/identity contracts pending. Q6 permission is not completion.

<a id="wf-12-d170"></a>
### WF-12.D170 — D-170

- **Basis:** `D-170`; approved references `AM-05;AM-10`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Feature parity needs current Guardian Portal evidence;MVP has none.
- **Screen / actor:** `SCR-LEGACY-GUARDIAN`; 1:1 Guardian own child. Pending actor titles are not permission grants.
- **Logical entities:** LegacySnapshot;LegacyIdentityMap. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Read -> validate -> map -> Academy projection; no legacy writes. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-170;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Legacy-linked dashboard with provenance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-05;Q-10.
- **Acceptance:** `AT-MAP-170` — Feature parity needs current Guardian Portal evidence;MVP has none. **NOT RUN**.
- **Remaining design:** Supplied MVP lacks Guardian Portal/full workflow evidence and real data dump; current-system schema/API/identity contracts pending. Q6 permission is not completion.

<a id="wf-12-d171"></a>
### WF-12.D171 — D-171

- **Basis:** `D-171`; approved references `AM-05`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Hours/fees link Academy finance;collection stays separate portal.
- **Screen / actor:** `SCR-LEGACY-FINANCE`; Scoped Finance/Management;external confirmation. Pending actor titles are not permission grants.
- **Logical entities:** LegacySnapshot;PaymentMirror;FinancialReport. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Read -> validate -> map -> Academy projection; no legacy writes. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-171;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Legacy-linked dashboard with provenance.
- **Dependencies:** D-015;D-141;D-147.
- **Open question references:** Q-05;Q-06;Q-10.
- **Acceptance:** `AT-MAP-171` — Hours/fees link Academy finance;collection stays separate portal. **NOT RUN**.
- **Remaining design:** Supplied MVP lacks Guardian Portal/full workflow evidence and real data dump; current-system schema/API/identity contracts pending. Q6 permission is not completion.

<a id="wf-12-d172"></a>
### WF-12.D172 — D-172

- **Basis:** `D-172`; approved references `AM-05;AM-10`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Authorized link joins legacy reports with Academy progress;private follow-up notes not exposed.
- **Screen / actor:** `SCR-LEGACY-PROGRESS`; Guardian own child;authorized Academic Staff. Pending actor titles are not permission grants.
- **Logical entities:** LegacyIdentityMap;StudentProgress;Result;Homework;ClassReport. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Read -> validate -> map -> Academy projection; no legacy writes. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-172;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Legacy-linked dashboard with provenance.
- **Dependencies:** D-090;D-133;D-134;D-135;D-136;D-148;D-169.
- **Open question references:** Q-05;Q-10.
- **Acceptance:** `AT-MAP-172` — Authorized link joins legacy reports with Academy progress;private follow-up notes not exposed. **NOT RUN**.
- **Remaining design:** Supplied MVP lacks Guardian Portal/full workflow evidence and real data dump; current-system schema/API/identity contracts pending. Q6 permission is not completion.

<a id="wf-12-d173"></a>
### WF-12.D173 — D-173

- **Basis:** `D-173`; approved references `AM-05`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Read-only assignment parity pending;free-text teacher field insufficient proof.
- **Screen / actor:** `SCR-LEGACY-ASSIGNMENT`; Existing legacy assignment authority. Pending actor titles are not permission grants.
- **Logical entities:** LegacySnapshot;TeacherAssignment;ExternalReference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Read -> validate -> map -> Academy projection; no legacy writes. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-173;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Legacy-linked dashboard with provenance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-05;Q-10.
- **Acceptance:** `AT-MAP-173` — Read-only assignment parity pending;free-text teacher field insufficient proof. **NOT RUN**.
- **Remaining design:** Supplied MVP lacks Guardian Portal/full workflow evidence and real data dump; current-system schema/API/identity contracts pending. Q6 permission is not completion.

<a id="wf-12-d174"></a>
### WF-12.D174 — D-174

- **Basis:** `D-174`; approved references `AM-05`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Schedule/reschedule/tracking legacy-owned;current workflow verification pending.
- **Screen / actor:** `SCR-LEGACY-ROUTINE`; Existing legacy scheduling authority. Pending actor titles are not permission grants.
- **Logical entities:** LegacySnapshot;ClassSession;ExternalReference. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Read -> validate -> map -> Academy projection; no legacy writes. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-174;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Legacy-linked dashboard with provenance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-05;Q-10.
- **Acceptance:** `AT-MAP-174` — Schedule/reschedule/tracking legacy-owned;current workflow verification pending. **NOT RUN**.
- **Remaining design:** Supplied MVP lacks Guardian Portal/full workflow evidence and real data dump; current-system schema/API/identity contracts pending. Q6 permission is not completion.

<a id="wf-12-d175"></a>
### WF-12.D175 — D-175

- **Basis:** `D-175`; approved references `AM-05`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Legacy views enforce corresponding managerial scope.
- **Screen / actor:** `SCR-LEGACY-OVERVIEW`; Branch/Department Management;Central oversight. Pending actor titles are not permission grants.
- **Logical entities:** LegacyIdentityMap;ScopeGrant. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Read -> validate -> map -> Academy projection; no legacy writes. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-175;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Legacy-linked dashboard with provenance.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-05;Q-10.
- **Acceptance:** `AT-MAP-175` — Legacy views enforce corresponding managerial scope. **NOT RUN**.
- **Remaining design:** Supplied MVP lacks Guardian Portal/full workflow evidence and real data dump; current-system schema/API/identity contracts pending. Q6 permission is not completion.

<a id="wf-18-d176"></a>
### WF-18.D176 — D-176

- **Basis:** `D-176`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Parallel old/new operation until verification and authorized switch.
- **Screen / actor:** `SCR-PARALLEL-LAUNCH`; Release authority;Central final gate. Pending actor titles are not permission grants.
- **Logical entities:** ParallelRun;ReconciliationRun;ReleaseRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Department/Branch tests -> Central approval; no automatic release. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Release and ownership evidence.
- **Dependencies:** D-177;D-180;D-201.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-176` — Parallel old/new operation until verification and authorized switch. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-34-d177"></a>
### WF-34.D177 — D-177

- **Basis:** `D-177`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Available academic/basic records migrate with reconciliation;no invented data.
- **Screen / actor:** `SCR-MIGRATION`; Migration owner pending. Pending actor titles are not permission grants.
- **Logical entities:** MigrationRun;MigrationRow;AcademicHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Dry-run/reconcile -> authorized import; identity/rollback design pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-177;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Counts, errors and reconciliation.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-177` — Available academic/basic records migrate with reconciliation;no invented data. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-36-d178"></a>
### WF-36.D178 — D-178

- **Basis:** `D-178`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Reuse hosting only after actual capability check;stack remains unselected.
- **Screen / actor:** `SCR-HOSTING-CHECK`; Technical Team;hosting approval pending. Pending actor titles are not permission grants.
- **Logical entities:** HostingAssessment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request -> Central approval -> Technical execution; hosting verified first. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Technical/change evidence.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-08.
- **Acceptance:** `AT-MAP-178` — Reuse hosting only after actual capability check;stack remains unselected. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-18-d179"></a>
### WF-18.D179 — D-179

- **Basis:** `D-179`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Academic-first order retains mandatory first-version scope.
- **Screen / actor:** `SCR-RELEASE-SCOPE`; Planning owner;Central launch gate. Pending actor titles are not permission grants.
- **Logical entities:** ReleaseScope;Milestone;DecisionTrace. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Department/Branch tests -> Central approval; no automatic release. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Release and ownership evidence.
- **Dependencies:** D-132;D-180;D-201.
- **Open question references:** Q-08.
- **Acceptance:** `AT-MAP-179` — Academic-first order retains mandatory first-version scope. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-18-d180"></a>
### WF-18.D180 — D-180

- **Basis:** `D-180`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Real module UAT and Central approval required.
- **Screen / actor:** `SCR-UAT`; Department/Branch tests;Central Management approves. Pending actor titles are not permission grants.
- **Logical entities:** UatRecord;ApprovalRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Department/Branch tests -> Central approval; no automatic release. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Release and ownership evidence.
- **Dependencies:** D-176;D-201.
- **Open question references:** Q-08.
- **Acceptance:** `AT-MAP-180` — Real module UAT and Central approval required. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-36-d181"></a>
### WF-36.D181 — D-181

- **Basis:** `D-181`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Maintenance/bugs/updates assigned Central Technical Team.
- **Screen / actor:** `SCR-MAINTENANCE`; Central Technical Team. Pending actor titles are not permission grants.
- **Logical entities:** MaintenanceTask;Incident;ChangeRequest. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request -> Central approval -> Technical execution; hosting verified first. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Technical/change evidence.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-181` — Maintenance/bugs/updates assigned Central Technical Team. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-36-d182"></a>
### WF-36.D182 — D-182

- **Basis:** `D-182`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Request submission alone cannot authorize implementation.
- **Screen / actor:** `SCR-CHANGE-REQUEST`; Branch/Department requests;Central approves;Technical executes. Pending actor titles are not permission grants.
- **Logical entities:** ChangeRequest;ApprovalRecord;ChangeHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Request -> Central approval -> Technical execution; hosting verified first. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Technical/change evidence.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** Q-08.
- **Acceptance:** `AT-MAP-182` — Request submission alone cannot authorize implementation. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-37-d183"></a>
### WF-37.D183 — D-183

- **Basis:** `D-183`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Live training,tutorial video,written guide included.
- **Screen / actor:** `SCR-TRAINING`; Trainer/learner assignments pending. Pending actor titles are not permission grants.
- **Logical entities:** TrainingSession;TrainingResource. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Prepare approved materials and assigned training; detailed delivery design pending. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Training resource index.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-183` — Live training,tutorial video,written guide included. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-15-d184"></a>
### WF-15.D184 — D-184

- **Basis:** `D-184`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Portal support tracks accountable handling and private visibility.
- **Screen / actor:** `SCR-SUPPORT`; Authenticated user;support assignment pending. Pending actor titles are not permission grants.
- **Logical entities:** SupportTicket;TicketAssignment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Submit -> assigned -> tracked -> resolved; exact labels draft. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-184;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Scoped ticket status.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-184` — Portal support tracks accountable handling and private visibility. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-18-d185"></a>
### WF-18.D185 — D-185

- **Basis:** `D-185`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** All listed academic/personal/financial data Academy-owned.
- **Screen / actor:** `SCR-DATA-GOVERNANCE`; Academy ownership;Central administrative control. Pending actor titles are not permission grants.
- **Logical entities:** DataOwnershipRecord;PolicyVersion. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Department/Branch tests -> Central approval; no automatic release. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Release and ownership evidence.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-185` — All listed academic/personal/financial data Academy-owned. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-32-d186"></a>
### WF-32.D186 — D-186

- **Basis:** `D-186`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Excel/CSV/PDF exports and full data/file portability;unauthorized export denied.
- **Screen / actor:** `SCR-EXPORT`; Authorized Admin only. Pending actor titles are not permission grants.
- **Logical entities:** ExportRun;BackupRun;ArchiveIndex. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Archive and read under access rules; export Admin authorized. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-186;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Archive/export/backup index.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-186` — Excel/CSV/PDF exports and full data/file portability;unauthorized export denied. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-33-d187"></a>
### WF-33.D187 — D-187

- **Basis:** `D-187`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Delegated admin cannot create/manage out-of-scope accounts.
- **Screen / actor:** `SCR-STAFF-ACCOUNTS`; Central Admin all;delegated Branch/Department Admin. Pending actor titles are not permission grants.
- **Logical entities:** User;StaffProfile;RoleAssignment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Create/assign -> Central-approved transfer -> inactive with reassigned duties. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-187;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Staff history and assignments.
- **Dependencies:** D-188;D-189;D-191.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-187` — Delegated admin cannot create/manage out-of-scope accounts. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-24-d188"></a>
### WF-24.D188 — D-188

- **Basis:** `D-188`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Delegated admins cannot invent rules or assign disallowed roles.
- **Screen / actor:** `SCR-ACCESS`; Central Admin rules;delegated Admin allowed roles. Pending actor titles are not permission grants.
- **Logical entities:** Role;Permission;RoleAssignment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Authorize active role/scope/record; deny otherwise; recovery evidence separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Authorization/audit/recovery evidence.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-188` — Delegated admins cannot invent rules or assign disallowed roles. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-24-d189"></a>
### WF-24.D189 — D-189

- **Basis:** `D-189`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Single login supports multiple assigned roles;no unassigned role grants.
- **Screen / actor:** `SCR-ROLE-SWITCH`; Staff own approved roles. Pending actor titles are not permission grants.
- **Logical entities:** User;RoleAssignment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Authorize active role/scope/record; deny otherwise; recovery evidence separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Authorization/audit/recovery evidence.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-189` — Single login supports multiple assigned roles;no unassigned role grants. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-24-d190"></a>
### WF-24.D190 — D-190

- **Basis:** `D-190`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Role switch selects dashboard;server validates chosen role/scope.
- **Screen / actor:** `SCR-ROLE-SWITCH`; Staff own assigned roles. Pending actor titles are not permission grants.
- **Logical entities:** RoleAssignment;ActiveRoleContext. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Authorize active role/scope/record; deny otherwise; recovery evidence separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Authorization/audit/recovery evidence.
- **Dependencies:** D-188;D-189;D-191.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-190` — Role switch selects dashboard;server validates chosen role/scope. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-24-d191"></a>
### WF-24.D191 — D-191

- **Basis:** `D-191`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** General Staff cross-scope denied;Central authority requires assignment.
- **Screen / actor:** `SCR-ACCESS`; General Staff single scope;Central multiscope. Pending actor titles are not permission grants.
- **Logical entities:** ScopeGrant;RoleAssignment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Authorize active role/scope/record; deny otherwise; recovery evidence separate. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Authorization/audit/recovery evidence.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-191` — General Staff cross-scope denied;Central authority requires assignment. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-33-d192"></a>
### WF-33.D192 — D-192

- **Basis:** `D-192`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Transfer requires Central approval/completion;prior history retained.
- **Screen / actor:** `SCR-STAFF-TRANSFER`; Branch/Department requests;Central Admin completes. Pending actor titles are not permission grants.
- **Logical entities:** StaffTransfer;RoleAssignment;AuditLog. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Create/assign -> Central-approved transfer -> inactive with reassigned duties. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-192;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Staff history and assignments.
- **Dependencies:** D-187;D-188;D-191;D-193.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-192` — Transfer requires Central approval/completion;prior history retained. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-33-d193"></a>
### WF-33.D193 — D-193

- **Basis:** `D-193`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Inactive login denied;duties reassigned;history retained.
- **Screen / actor:** `SCR-STAFF-EXIT`; Exit operator authority pending. Pending actor titles are not permission grants.
- **Logical entities:** StaffProfile;User;Task;AssignmentHistory. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Create/assign -> Central-approved transfer -> inactive with reassigned duties. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-193;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Staff history and assignments.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-193` — Inactive login denied;duties reassigned;history retained. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-05-d194"></a>
### WF-05.D194 — D-194

- **Basis:** `D-194`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Leave calendar/substitution/reassignment preserves Teacher absence rules.
- **Screen / actor:** `SCR-STAFF-LEAVE`; Staff requests;approval D-195. Pending actor titles are not permission grants.
- **Logical entities:** StaffLeave;SubstituteAssignment;Task. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Notice/request -> authorized assignment/approval. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-194;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave and substitute coverage.
- **Dependencies:** D-036;D-037;D-045;D-046;D-195.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-194` — Leave calendar/substitution/reassignment preserves Teacher absence rules. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-05-d195"></a>
### WF-05.D195 — D-195

- **Basis:** `D-195`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Unrelated Supervisor denied approval;Central records visible as authorized.
- **Screen / actor:** `SCR-STAFF-LEAVE`; Related Supervisor approves;Central views. Pending actor titles are not permission grants.
- **Logical entities:** StaffLeave;ApprovalRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Notice/request -> authorized assignment/approval. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-195;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Leave and substitute coverage.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-195` — Unrelated Supervisor denied approval;Central records visible as authorized. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-16-d196"></a>
### WF-16.D196 — D-196

- **Basis:** `D-196`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Attendance,tasks,reports,duties metrics represented;weights not invented.
- **Screen / actor:** `SCR-STAFF-REVIEW`; Reviewer D-197;role-specific metrics. Pending actor titles are not permission grants.
- **Logical entities:** PerformanceReview;Task;DutyRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Collect role metrics -> related Supervisor review; private visibility. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-196;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Role-based private review.
- **Dependencies:** D-137;D-197;D-198;D-199.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-196` — Attendance,tasks,reports,duties metrics represented;weights not invented. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-16-d197"></a>
### WF-16.D197 — D-197

- **Basis:** `D-197`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Unrelated reviewer denied;Central authorized reports visible.
- **Screen / actor:** `SCR-STAFF-REVIEW`; Related Supervisor evaluates;Central views. Pending actor titles are not permission grants.
- **Logical entities:** PerformanceReview;ReviewerAssignment. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Collect role metrics -> related Supervisor review; private visibility. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-197;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Role-based private review.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-197` — Unrelated reviewer denied;Central authorized reports visible. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-16-d198"></a>
### WF-16.D198 — D-198

- **Basis:** `D-198`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Every3 months;cycle anchor/details remain design question.
- **Screen / actor:** `SCR-STAFF-REVIEW`; Related Supervisor;scheduler candidate. Pending actor titles are not permission grants.
- **Logical entities:** PerformanceReview;ReviewPeriod. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Collect role metrics -> related Supervisor review; private visibility. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-198;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Role-based private review.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-198` — Every3 months;cycle anchor/details remain design question. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-16-d199"></a>
### WF-16.D199 — D-199

- **Basis:** `D-199`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Other Staff/Guardian cannot view private evaluations.
- **Screen / actor:** `SCR-STAFF-REVIEW`; Related Supervisor;Authorized Management only. Pending actor titles are not permission grants.
- **Logical entities:** PerformanceReview;ScopeGrant. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Collect role metrics -> related Supervisor review; private visibility. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-199;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Role-based private review.
- **Dependencies:** Shared authorization/audit and corresponding family specification;no extra source dependency asserted.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-199` — Other Staff/Guardian cannot view private evaluations. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-29-d200"></a>
### WF-29.D200 — D-200

- **Basis:** `D-200`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** Combined academics,finance,staff,1:1,approvals,alerts respect privacy/source owners.
- **Screen / actor:** `SCR-MANAGEMENT-DASHBOARD`; Central Management authorized summary. Pending actor titles are not permission grants.
- **Logical entities:** ReportRun;DashboardProjection. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Read authorized projections; never leak private source details. Per-action guards/timestamps still need full design.
- **Events:** Candidate notification/recalculation/audit effects for D-200;specific recipients,guards and delivery defined by source/amendments;contract TBD.
- **Report/view impact:** Scoped consolidated reports.
- **Dependencies:** D-138;D-161;D-175;D-199.
- **Open question references:** No original unanswered question explicitly linked;review still pending.
- **Acceptance:** `AT-MAP-200` — Combined academics,finance,staff,1:1,approvals,alerts respect privacy/source owners. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

<a id="wf-18-d201"></a>
### WF-18.D201 — D-201

- **Basis:** `D-201`; approved references `none in original matrix`. Full scope: source text in traceability; AM-05/11 govern all legacy-copy work.
- **Trigger/action expectation:** No live switch before Department/Branch testing and Central final approval;parallel strategy retained.
- **Screen / actor:** `SCR-LAUNCH-APPROVAL`; Central Management final authority. Pending actor titles are not permission grants.
- **Logical entities:** ReleaseRecord;UatRecord;ApprovalRecord. Candidate Academy model only;legacy data remains externally owned.
- **State family (candidate):** Department/Branch tests -> Central approval; no automatic release. Per-action guards/timestamps still need full design.
- **Events:** Candidate audit/readiness/configuration effect only;event contract TBD,not an existing API.
- **Report/view impact:** Release and ownership evidence.
- **Dependencies:** D-176;D-179;D-180.
- **Open question references:** Q-08.
- **Acceptance:** `AT-MAP-201` — No live switch before Department/Branch testing and Central final approval;parallel strategy retained. **NOT RUN**.
- **Remaining design:** Full fields, action authorization, state guards, transaction/idempotence, notification/publication rules and runnable tests need detailed design.

## Attendance reconciliation v1.4
Affected attendance expectations above follow AM-12..16. Full current state/RBAC/timer/guard design: `design/attendance_followup/README.md`. Historical leaf amendment lists may predate recovered approvals;current traceability and amendment register govern. Unanswered branches are not coding-ready.

## Report workflow v1.5
Current report design: `design/report_workflow/README.md`. AM-17 separates initial submission compliance from review;no returned-revision or ordinary reminder SLA inferred.

## AM-19 — unified Guardian target (v1.7.1,2026-10-31)
New Academy Guardian access uses one login/dashboard across linked children and Batch/1:1 classes/progress. This explicitly supersedes D-169 separate1:1 Guardian login and corresponding AM-05/10/18 preservation language for the NEW target system only. Preserve own-child access,Primary/Secondary distinct identities/permissions,D-090 note privacy and all unrelated approvals. No automatic legacy credential merge,shared password,production migration or SSO implementation approved. OTO-06 target-login choice RESOLVED;technical authentication,migration and account-linking design remain pending. Earlier separate-login statements in this document are historical and superseded only for the new target system.
