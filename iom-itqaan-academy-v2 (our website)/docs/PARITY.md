# v0.2 parity evidence map

Original test sources remain in `baseline/python-v0.2/tests/`; they are not rewritten to pass the Node port. Python tests exercise the original FastAPI/SQLite implementation. TypeScript tests exercise this port through HTTP against an isolated SQL database; a pass is scoped to these scenarios, not all 201 decisions.

| Original test | Port test |
| --- | --- |
| `test_policy_late_boundary` | `policy.test.ts`: exact 15 minute boundary |
| `test_report_deadlines_bd` | `policy.test.ts`: report deadlines/calendar cutoff |
| `test_absence_streak_helper` | `policy.test.ts`: absence helper |
| `test_csrf_and_admin_scoping` | `mysql.integration.ts`: CSRF/admin |
| `test_guardian_access_is_family_scoped` | guardian family isolation: own-family-only reads plus unlinked Guardian scenario |
| `test_teacher_attendance_report_and_zimmadar_approval` | teacher attendance/Zimmadar verification/approval |
| `test_one_to_one_same_student_may_have_group_enrollment` | guardian both modes + concurrent slot test |
| `test_guardian_sees_own_child_both_modes_not_other_children` | Guardian isolation/AM-19 both modes |
| `test_branch_scope_rejects_cross_branch_student_creation` | cross-branch/privilege rejection |
| `test_report_return_requires_reason_and_preserves_submission` | returned revision/first submission/history |
| `test_alert_idempotent_and_no_submitted_report` | alert idempotence/submission suppression |
| `test_no_historic_catchup_or_unapproved_evening_schedule` | no historic/evening alerts |
| `test_noon_alert_stages_and_supervisor_unassigned` | stages/unassigned supervisor |
| `test_attendance_per_enrollment_and_not_as_false_absence` | missing attendance/invalid month |
| `test_guardian_cannot_view_staff_report_monitor` | staff-only monitor/alerts |
| `test_three_held_classes_threshold_and_enrollment_isolation` | threshold/per-enrollment summary |

Additional assertions cover password hashing compatibility, unresolved long/invalid class intervals, migration repeat/checksum behavior, and SQL concurrency. Test-only clocks avoid changing production time. Synthetic fixtures are the only records created. Pending policy is not marked passed merely because a helper exists.

Review regressions additionally cover invalid calendar inputs, exact millisecond join evidence (D-055), a submission committed between monitor snapshot and alert lock (AM-17), enforced report/class FK metadata and orphan rejection on each SQL engine. `test:upgrade` checks published `001` to additive `002` with an existing synthetic row retained. Inputs finer than milliseconds now fail explicitly; Python microsecond input support is not claimed as parity.
