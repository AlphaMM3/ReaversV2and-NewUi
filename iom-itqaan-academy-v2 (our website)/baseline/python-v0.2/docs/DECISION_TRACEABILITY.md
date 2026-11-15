# v0.1 Implemented Decision Traceability (NOT full 201-row implementation)

| Source IDs | Implemented subset | Code | Test | Status |
|---|---|---|---|---|
| D-002, D-025, D-148; AM-03, AM-18 | `group` and `one_to_one` batch/enrollment with per-course student membership | `db.py` + `/api/enrollments` | `test_one_to_one_same_student_may_have_group_enrollment` | Partial: academic structure only |
| D-010, D-064, D-066; AM-19 | one Guardian login sees linked children including both enrollments | `family_guardians`, `/api/students`, `/api/enrollments` | `test_guardian_access_is_family_scoped` | Partial: primary/secondary management and legacy credential migration missing |
| D-022, D-142, D-191 | authorization by role+branch, teacher batch and Guardian family | `security.py`, `batch_scope`, `class_scope` | `test_csrf_and_admin_scoping`, `test_guardian_access_is_family_scoped` | Partial: full RBAC needs role-specific scenarios |
| D-030, D-040, D-042–043 | scheduled class meeting link, actual Start/End, report form | `/api/classes` | API tests | Partial: real Zoom/Meet launch button and attendance API not integrated |
| D-053, D-054, D-055; AM-09 | Teacher-verified Present/Absent/Late per class+enrollment; late >15, exact15 Present | `/api/classes/{id}/attendance`, `policy.late_from_join` | `test_policy_late_boundary` | Partial: actual class start anchor is technical pilot assumption pending AFQ-04 |
| D-058, D-080; AM-16, AM-16-C1 | Teacher can directly correct within class BD date +7 23:59; later edit blocked pending approved path | `correction_cutoff`, attendance API | `test_report_deadlines_bd` | Partial: post-window Zimmadar correction workflow missing |
| D-032, D-033, D-034, D-038, D-043, D-044; AM-04/07/17 | Report draft, submit, return, revised submit, approve and separated first-submission/review | `/api/classes/{id}/report`, `/api/reports/{id}/review` | `test_teacher_attendance_report_and_zimmadar_approval`, `test_report_deadlines_bd` | Partial: full course-specific templates and publication missing |
| D-162 | Audited writes, password hashes and CSRF/session safeguards | `audit_events`, `security.py` | Basic tests | Partial: no formal security audit or backup/restore |

**Rules not coded ≠ unapproved.** Source baseline has 201 confirmed IDs and 12 separate unapproved enhancements. This is a deliberately narrow first coding increment, not scope reduction of the eventual first version.

## v0.2 additions (partial, read-only / in-app)

| Source | Implemented subset | Source | Tests | Boundary |
|---|---|---|---|---|
| D-035; AM-08/17 | In-app initial-submission stage events 12:05,14:00,16:00,18:00 for **noon** deadline | `app/report_monitor.py`, `/api/report-monitor`, `/api/report-alerts` | `test_monitor.py` | No external provider delivery, no Supervisor actor, no 23:59 escalation schedule or retroactive catch-up. |
| D-084/095/096; Q4 | Per-enrollment Bangladesh-month verified held class denominator, Present+Late numerator, >=3 sample informational flag | `app/attendance_summary.py`, `/api/attendance/monthly` | `test_monitor.py` | No leave tracking, low-attendance warning creation, 7-class absence stage, or follow-up engine. |
