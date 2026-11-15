# Candidate screen/entity index — DRAFT

These are logical allocation names,not existing routes,tables,UI designs or finalized menus. Visibility/action permissions still need detailed RBAC. Multiple source decisions intentionally share screens/entities.

## Screens

|Screen candidate|Source decisions|
|---|---|
| SCR-ABSENCE | D-019, D-056, D-057, D-072, D-073 |
| SCR-ACADEMY | D-001 |
| SCR-ACCESS | D-022, D-188, D-191 |
| SCR-ACTION-PLAN | D-114, D-115, D-116, D-117, D-118, D-119, D-120, D-121 |
| SCR-ADMISSIONS | D-005, D-139 |
| SCR-APP-SHELL | D-144 |
| SCR-ARCHIVE | D-151 |
| SCR-ASSESSMENTS | D-009 |
| SCR-ATTENDANCE | D-017, D-018, D-053, D-054, D-055, D-059 |
| SCR-ATTENDANCE-CORRECTION | D-058, D-079, D-080, D-081, D-082 |
| SCR-ATTENDANCE-SUMMARY | D-083 |
| SCR-BATCH | D-020 |
| SCR-BLOCKERS | D-125, D-126, D-127, D-128, D-129, D-130, D-131 |
| SCR-CALENDAR | D-146 |
| SCR-CERTIFICATES | D-149 |
| SCR-CHANGE-REQUEST | D-182 |
| SCR-CLASS-REPORT | D-032, D-033, D-034, D-038, D-043, D-044 |
| SCR-CLASS-SESSION | D-040, D-041, D-042 |
| SCR-COMPLAINTS | D-164 |
| SCR-COURSES | D-002, D-003, D-024 |
| SCR-DATA-GOVERNANCE | D-185 |
| SCR-ENROLLMENTS | D-148, D-158 |
| SCR-ESCALATIONS | D-110, D-111, D-112, D-113 |
| SCR-EXAMS | D-134 |
| SCR-EXPORT | D-186 |
| SCR-FAMILY | D-010, D-064, D-065, D-066, D-133 |
| SCR-FEES | D-011, D-013, D-160 |
| SCR-FINANCE | D-141, D-161 |
| SCR-FOLLOWUP | D-087, D-088, D-097, D-098, D-099, D-100, D-101, D-102, D-108, D-109 |
| SCR-FOLLOWUP-NOTES | D-089, D-090, D-091, D-092 |
| SCR-FOLLOWUP-REOPEN | D-103, D-104, D-105, D-106, D-107 |
| SCR-HOMEWORK | D-028, D-029, D-135 |
| SCR-HOSTING-CHECK | D-178 |
| SCR-IMPORT | D-153 |
| SCR-LANGUAGE | D-145 |
| SCR-LAUNCH-APPROVAL | D-201 |
| SCR-LEAVE-EXTENSION | D-075 |
| SCR-LEGACY-ASSIGNMENT | D-173 |
| SCR-LEGACY-FINANCE | D-171 |
| SCR-LEGACY-GUARDIAN | D-169, D-170 |
| SCR-LEGACY-OVERVIEW | D-167, D-168, D-175 |
| SCR-LEGACY-PROGRESS | D-172 |
| SCR-LEGACY-ROUTINE | D-174 |
| SCR-LOW-ATTENDANCE | D-084, D-085, D-086, D-093, D-094, D-095, D-096 |
| SCR-MAINTENANCE | D-181 |
| SCR-MAKEUP | D-050, D-051, D-052 |
| SCR-MANAGEMENT-DASHBOARD | D-200 |
| SCR-MATERIALS | D-031, D-150 |
| SCR-MESSAGING | D-140, D-159 |
| SCR-MIGRATION | D-177 |
| SCR-MY-TASKS | D-154 |
| SCR-NOTIFICATIONS | D-060, D-061, D-062 |
| SCR-ORG | D-004, D-021, D-023, D-025, D-142 |
| SCR-PARALLEL-LAUNCH | D-176 |
| SCR-PAYMENT-MIRROR | D-012, D-014, D-015 |
| SCR-PERFORMANCE | D-008, D-137 |
| SCR-PLACEMENT | D-026, D-155 |
| SCR-PLAN-PROGRESS | D-122, D-123, D-124 |
| SCR-PROGRESS | D-007, D-136 |
| SCR-PROMOTION | D-027, D-156 |
| SCR-PUBLIC-ADMISSIONS | D-165 |
| SCR-PUBLIC-COURSES | D-143 |
| SCR-RELEASE-SCOPE | D-132, D-179 |
| SCR-REPORT-OVERDUE | D-035 |
| SCR-REPORTS | D-006, D-138 |
| SCR-RESCHEDULE | D-048, D-049 |
| SCR-ROLE-SWITCH | D-189, D-190 |
| SCR-ROUTINE | D-016, D-030 |
| SCR-SECURITY | D-162 |
| SCR-SETTINGS | D-163 |
| SCR-STAFF | D-152 |
| SCR-STAFF-ACCOUNTS | D-187 |
| SCR-STAFF-EXIT | D-193 |
| SCR-STAFF-LEAVE | D-194, D-195 |
| SCR-STAFF-REVIEW | D-196, D-197, D-198, D-199 |
| SCR-STAFF-TRANSFER | D-192 |
| SCR-STUDENT-LEAVE | D-067, D-068, D-069, D-070, D-071, D-074 |
| SCR-STUDENT-RETURN | D-076, D-077, D-078 |
| SCR-SUBSTITUTES | D-037, D-047 |
| SCR-SUPPORT | D-184 |
| SCR-TEACHER-LEAVE | D-036, D-045, D-046 |
| SCR-TEACHER-PAY | D-147 |
| SCR-TELEGRAM-LINK | D-063 |
| SCR-TRAINING | D-183 |
| SCR-TRANSFER | D-157 |
| SCR-UAT | D-180 |
| SCR-WAITING-LIST | D-166 |
| SCR-WORKLOAD | D-039 |

## Logical entities

All candidate Academy entities below require field/type/FK/index/retention/ownership design;none was created as a physical table by this work. LegacySnapshot/PaymentMirror are proposed projections,not new authoritative records. FamilyMembership/ScopeGrant joins require authorized relationships,not contact-based identity guessing.

|Entity candidate|Source decisions|
|---|---|
| AbsenceCounter | D-019, D-056, D-057, D-072, D-073, D-082, D-148 |
| AcademicCalendar | D-146 |
| AcademicHistory | D-157, D-177 |
| AcademicSession | D-151 |
| Academy | D-001 |
| ActionPlan | D-114, D-115, D-116, D-117, D-118, D-119, D-120, D-121, D-122 |
| ActiveRoleContext | D-190 |
| AdmissionApplication | D-005, D-139, D-143, D-165, D-166 |
| ApplicationManifest | D-144 |
| ApprovalRecord | D-068, D-075, D-080, D-091, D-103, D-108, D-118, D-154, D-180, D-182, D-195, D-201 |
| ArchiveIndex | D-151, D-186 |
| Assessment | D-005, D-009, D-026, D-027, D-134, D-155, D-156 |
| AssignmentHistory | D-110, D-111, D-115, D-116, D-120, D-126, D-131, D-193 |
| AttendanceEntry | D-017, D-018, D-052, D-053, D-054, D-055, D-058, D-059, D-072, D-077, D-080, D-083, D-084 |
| AttendanceImport | D-017, D-053 |
| AttendanceRevision | D-058, D-079, D-080, D-081, D-082 |
| AttendanceSummary | D-083, D-084, D-085, D-094, D-095, D-096, D-136 |
| AttendanceWarning | D-085, D-086, D-087, D-093, D-096, D-097 |
| AuditLog | D-041, D-058, D-065, D-073, D-092, D-162, D-192 |
| BackupRun | D-162, D-186 |
| Batch | D-002, D-020, D-021, D-026, D-146, D-153, D-165, D-166 |
| Blocker | D-125, D-126, D-127, D-128, D-129, D-130, D-131 |
| BlockerDeadline | D-127, D-131 |
| BlockerHistory | D-125, D-128 |
| Branch | D-004, D-142 |
| Certificate | D-149 |
| ChangeHistory | D-182 |
| ChangeRequest | D-181, D-182 |
| ClassReport | D-006, D-032, D-033, D-034, D-035, D-038, D-039, D-043, D-044, D-052, D-137, D-172 |
| ClassSession | D-030, D-039, D-040, D-041, D-042, D-043, D-048, D-050, D-052, D-055, D-070, D-095, D-137, D-147, D-174 |
| Course | D-002, D-003, D-024, D-025, D-143, D-146, D-165 |
| DashboardProjection | D-200 |
| DataOwnershipRecord | D-185 |
| DecisionTrace | D-132, D-179 |
| Department | D-004, D-021, D-023, D-025 |
| DutyRecord | D-196 |
| Enrollment | D-005, D-019, D-026, D-056, D-076, D-139, D-148, D-149, D-157, D-158 |
| EnrollmentStatusHistory | D-158 |
| EscalationEvent | D-035 |
| ExamAttempt | D-134, D-155 |
| Expense | D-141, D-161 |
| ExportRun | D-186 |
| ExternalReference | D-006, D-012, D-014, D-028, D-067, D-140, D-167, D-173, D-174 |
| Family | D-010 |
| FamilyMembership | D-010, D-059, D-062, D-064, D-065, D-066, D-133, D-169 |
| FeeAdjustment | D-013, D-160 |
| FeePlan | D-011, D-013, D-160 |
| FinancialReport | D-161, D-171 |
| FollowupCase | D-018, D-019, D-056, D-057, D-082, D-087, D-088, D-093, D-094, D-097, D-098, D-099, D-101, D-102, D-103, D-104, D-105, D-106, D-107, D-108, D-109, D-110, D-111, D-112, D-113, D-154 |
| FollowupDeadline | D-104 |
| FollowupNote | D-057, D-087, D-089, D-090, D-091, D-102 |
| FollowupNoteRevision | D-091, D-092 |
| FollowupRequest | D-107 |
| Guardian | D-064, D-065, D-133, D-153 |
| GuardianPreference | D-060, D-062 |
| Homework | D-028, D-029, D-135, D-172 |
| HomeworkCompletion | D-029, D-135, D-136 |
| HostingAssessment | D-178 |
| ImportRow | D-153 |
| ImportRun | D-153 |
| Incident | D-181 |
| Installment | D-160 |
| Invoice | D-011, D-141, D-160, D-161 |
| LearningResource | D-031, D-150 |
| LeaveClassCoverage | D-071 |
| LeaveExtension | D-075 |
| LeaveRequest | D-067, D-068, D-069, D-070, D-071, D-072, D-073, D-074, D-076, D-077, D-083 |
| LeaveRevision | D-069 |
| LegacyIdentityMap | D-002, D-167, D-168, D-169, D-170, D-172, D-175 |
| LegacySnapshot | D-167, D-168, D-170, D-171, D-173, D-174 |
| MaintenanceTask | D-181 |
| MakeupRequest | D-050, D-051 |
| ManagementIntervention | D-117, D-130 |
| ManagementRequest | D-113, D-114 |
| MeetingReference | D-030, D-042 |
| Message | D-159 |
| MessageThread | D-079, D-140, D-159 |
| MigrationRow | D-177 |
| MigrationRun | D-177 |
| Milestone | D-179 |
| NotificationJob | D-007, D-035, D-045, D-047, D-049, D-060, D-061, D-063, D-078, D-081, D-086, D-088, D-099, D-100, D-105, D-109, D-112, D-115, D-120, D-123, D-125, D-129, D-140, D-159 |
| ParallelRun | D-176 |
| PayBasis | D-147 |
| PaymentMirror | D-012, D-014, D-015, D-141, D-160, D-171 |
| PerformanceReview | D-008, D-137, D-196, D-197, D-198, D-199 |
| Permission | D-188 |
| PlanRevision | D-119 |
| PlanTask | D-121 |
| PolicyVersion | D-163, D-185 |
| Program | D-024 |
| ProgressReport | D-007 |
| ProgressUpdate | D-122, D-123, D-124 |
| PromotionDecision | D-027, D-156 |
| ReconciliationRun | D-176 |
| RecoveryRun | D-162 |
| ReleaseRecord | D-176, D-201 |
| ReleaseScope | D-132, D-179 |
| ReminderAcknowledgement | D-101 |
| ReopenHistory | D-106 |
| ReopenRequest | D-103 |
| ReportDeadline | D-034, D-043 |
| ReportDefinition | D-138 |
| ReportRevision | D-033, D-044 |
| ReportRun | D-138, D-200 |
| ReportTemplate | D-032 |
| ResourceAccess | D-031, D-150 |
| Result | D-009, D-027, D-134, D-136, D-155, D-156, D-172 |
| ReturnRecord | D-077, D-078 |
| ReviewPeriod | D-198 |
| ReviewerAssignment | D-197 |
| Role | D-022, D-188 |
| RoleAssignment | D-022, D-152, D-187, D-188, D-189, D-190, D-191, D-192 |
| Routine | D-016, D-030, D-049, D-051 |
| ScheduleChange | D-048, D-049 |
| ScopeGrant | D-021, D-022, D-066, D-090, D-142, D-162, D-175, D-191, D-199 |
| ScopedSetting | D-163 |
| StaffLeave | D-194, D-195 |
| StaffProfile | D-152, D-153, D-187, D-193 |
| StaffTransfer | D-192 |
| Student | D-010, D-148, D-153 |
| StudentProgress | D-136, D-148, D-172 |
| StudentTransfer | D-157 |
| SubstituteAssignment | D-037, D-046, D-047, D-194 |
| SupportTicket | D-164, D-184 |
| SyncRun | D-015 |
| Task | D-008, D-039, D-137, D-152, D-154, D-193, D-194, D-196 |
| TeacherAssignment | D-020, D-036, D-037, D-038, D-039, D-173 |
| TeacherLeave | D-036, D-045, D-046 |
| TeacherPayable | D-141, D-147, D-161 |
| TelegramLink | D-061, D-063, D-100 |
| TicketAssignment | D-164, D-184 |
| TicketHistory | D-164 |
| TimerCorrection | D-041 |
| TimerEvent | D-040 |
| TrainingResource | D-183 |
| TrainingSession | D-183 |
| TranslationCatalog | D-145 |
| UatRecord | D-180, D-201 |
| UiPreference | D-144, D-145 |
| User | D-064, D-133, D-143, D-162, D-169, D-187, D-189, D-193 |
| WaitingListEntry | D-166 |
