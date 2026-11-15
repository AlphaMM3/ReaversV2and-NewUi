# IOM School Maktab — Decision Reference Audit & Blueprint Reconciliation
**Audit version:** 1.1-DRAFT  
**Audit date:** 2026-10-30 (Asia/Dhaka)  
**Primary source:** `IOM-School-Maktab-Reference-v1.0.md` (2026-10-23)  
**Basis:** Source's 201 numbered Confirmed decisions and 12 explicitly Unapproved proposals.  
**Scope:** Review reference, identify conflicts/gaps in recent 18-main/60-sub-workflow design. No policy has been amended or newly approved in this audit.

## 1. Integrity & Provenance

- Verified 201 distinct sequential decision IDs, 1–201; zero missing or duplicate IDs.
- 12 sections cover decisions 1–200 plus separate decision 201.
- 12 Proposed Enhancements remain unapproved. Their proposed MVP/Phase 2 priority is also unapproved.
- Reference originates from a supplied pasted text, not an independently retrieved original conversation transcript.
- Original decision-by-decision approval timestamps and meeting evidence are absent. “Confirmed” is the supplied reference's status, not independently verified sign-off.
- Previous architecture's 14 technical baseline items and 18 pending policy decisions are *later design proposals*, not part of original 201.

## 2. Required Corrections to Earlier Blueprint

| Audit ID | Severity | Original decision(s) | Source rule | Earlier blueprint problem | Required correction |
|---|---|---|---|---|---|
| A-01 | Critical | 55 | More than 15 minutes late => Late; exactly 15 minutes => Present | Blueprint sometimes said 15 minutes **or more** => Late | Use `join_delay_minutes > 15`, test boundary exactly 15 |
| A-02 | Critical | 32–35, 38, 43–44 | Course-specific forms; Zimmadar approval; revisions returned with reason and history; same-day submission | WF-08.3 sometimes treated verification as optional | Require Zimmadar approval and revision cycle for submitted reports |
| A-03 | High | 47 | Substitute change with same class time & meeting URL => no separate Guardian substitute notification | Blueprint sent unconditional Guardian notifications | Conditional substitute notifications |
| A-04 | Critical | 41, 44, 58, 80, 91–92 | Different correction authorities and deadlines for timer, attendance, report revision, follow-up notes | One generic WF-17 allowed Teacher/Super Admin final correction for all records | Record-type-specific correction policy matrix |
| A-05 | Critical | 15, 141, 160–161, 171 | Collection and confirmation are handled via existing secure separate portal; Academy must handle financial information, statements, teachers' payments, expenses | WF-14 had new Academy-side manual payment verification/confirmation | Integrate verified statuses from existing portal; avoid duplicating confirmation authority |
| A-06 | Critical | 64–77, 79–84 | Primary/Secondary Guardian, portal-only absence notice, approval, 14-day limit, extensions, return rules, correction windows | Missing from 60 sub-workflow catalog | Add family/leave/attendance-specific workflows |
| A-07 | Critical | 84–96 | Monthly Held Class denominator includes Approved Leave absent classes; low-attendance threshold <75%, minimum three held sessions | WF-11 lacked exact math/time window and minimum class check | Formal attendance calculation, leave handling and warning engine |
| A-08 | Critical | 87–131 | Multi-tier precise follow-up deadlines, repeat, reopen, reassignment, management action plan, blocker escalation | WF-11 three generic steps severely underspecify operational automation | Detailed follow-up & escalation state machines |
| A-09 | High | 60–63 | Per-child Instant/Daily/Weekly notification; personal Telegram optional secure linking | Notification rules were generic | Add preference/child/channel resolution rules |
| A-10 | High | 132–166 | First version has exams, homework, finance, PWA, bilingual, public website, certificates, library, import, staff, transfer etc. | Phase plans deferred or did not map several confirmed MVP features | Make first-version scope traceable to each decision |
| A-11 | Critical | 167–175 | 1:1 uses legacy rules, separate module; shared admin/teacher login and separate 1:1 guardian login; finance in central dashboard | Family/guardian login may have been implicitly unified | Respect separate 1:1 Guardian login, explicit cross-system identity mapping |
| A-12 | High | 187–201 | Staff lifecycle, scoped delegation, multiple roles, switcher, transfers, 3-month performance, Central sign-off | WF-16 only teacher performance, no staff lifecycle; governance gate incomplete | Add staff management and launch approval workflows |
| A-13 | Medium | 35 | Late report escalation sequence confirmed; exact time intervals undecided | Previous draft proposed precise time without approval | Keep exact delay as pending configurable policy |
| A-14 | High | 72–73, 77–78, 82 | Approved leave pauses follow-up but is still Absent; after leave counter resets; first Present triggers Returned; correction recomputes counter | Prior generic absence model omitted state conditions | Build leave/absence/return state model |
| A-15 | High | 133, 139, 143–145 | First release: Guardian only (no student login), manual + online admission, public website+portal, responsive PWA, Bangla/English | Prior menu map underspecified these channels | Add explicit interface and access requirements |
| A-16 | High | 176–186, 201 | Migration, hosting suitability, department testing, central approval, parallel launch, data ownership/export | Earlier roadmap lacked fully linked governance and migration tests | Separate release readiness and migration gates |

## 3. Source-Decided vs Still Pending

**Already fixed by original decisions:** `>15` late boundary (#55); Zimmadar report approval (#33); timer manual correction approval (#41); substitute notification exception (#47); absence approval, 14-day maximum and extension (#67–75); attendance calculations and minimum sessions (#84–96); multiple follow-up and blocker deadlines (#87–131); 1:1 separate guardian login (#169); quarterly staff review (#198); final launch approval (#201).

**Still unresolved, even after reviewing original 201:** report reminder exact SLA (#35), interpretation of “one week absent” when classes are irregular (#19/#56), full child safeguarding policy (proposal 1), detailed finance adjustment/refund and reconciliation policy (proposal 6), timezone & DST handling (proposal 2), precise contract-crediting semantics with legacy integration, hosting feasibility (#178), system/API/data migration compatibility, and explicit acceptance evidence for each source decision.

**Not a decision change:** Source says “Confirmed,” but lacks individual approval dates. Do not automatically convert technical assumptions into Confirmed decisions.

## 4. Functional Gaps in the Prior 18/60 Catalog

| Gap ID | Original decision range | Missing / underspecified modules |
|---|---|---|
| G-01 | 61–77 | Guardian role management, preferences, official student leave request and approval, extension, return |
| G-02 | 78–131 | Attendance formulas, low-attendance workflows, follow-up reopen, escalation, action plans, blockers |
| G-03 | 132–166 | PWA, bilingual, manual enrollment, course materials, certificates, import, waitlist, transfers, records archive |
| G-04 | 141,147,160–161 | Teacher payroll, expenses, partial payment, installments, scholarships, branch financial reporting |
| G-05 | 167–175 | Legacy 1:1 integration, login separation, authority and reconciliation interface |
| G-06 | 187–199 | Staff profiles, account permissions, role switcher, multi-role/branch, transfer, exit, leave and quarterly reviews |
| G-07 | 176–186,201 | Migration, backup and portability validation, training, department UAT, central live-launch sign-off |

The 18 top-level workflows remain useful **as a preliminary core process model**, but the 60 sub-workflows are not an exhaustive implementation scope. Do not freeze their count as the final total. Extend and re-estimate only after a complete decision-by-decision traceability pass.

## 5. Proposed Review Process

1. Preserve unmodified source `IOM-School-Maktab-Reference-v1.0.md`; treat it as source reference.
2. Create one traceability row for each ID 1–201, mapped to: module, workflow, screen, authority, policy rule, data entity, tests, status and evidence.
3. Create 12 separate proposal rows. Do not mark a proposal accepted because it has an MVP label.
4. Convert discrepancies A-01–A-16 into tracked change requests against the v1.2 draft architecture.
5. Reconcile functional scope vs existing `WF-01–WF-18`, and expand the sub-workflow inventory as needed.
6. Design record-specific authorization, privacy, financial source of truth, independent audit and period locking.
7. Approve policy decisions and full traceability, then review ERD/API/contracts; only after architecture approval proceed to repository development.
8. Set manual human audit gates at architecture, PR, security, migration/UAT, and launch. Record evidence.

## 6. Status Summary

| Deliverable | Audit status |
|---|---|
| File structure, 201 decision IDs | Verified |
| 12 proposals' unapproved classification | Verified |
| Detailed approval evidence per individual decision | Not available in this source |
| Previous 18 main workflow model | Useful draft; not complete scope |
| Previous 60 sub-workflow model | Needs corrections and expansion |
| Original academy rules | Unchanged |
| Implementation authorization | Not granted by this audit |
| Existing 1:1 Manager / payment portal | No changes made |

**Review conclusion:** Source is structurally complete and a strong requirement reference, but recent design drafts must be corrected and extended before being called fully developer-ready. The next essential deliverable is a 201-row traceability and conflict register, not additional application code.
