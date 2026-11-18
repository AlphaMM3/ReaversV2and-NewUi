// ── 1. RBAC Policy Matrix ────────────────────────────────────────────────────
export type PolicyRole = 'central_admin' | 'branch_admin' | 'department_supervisor' | 'zimmadar' | 'teacher'

export interface RolePermissionSpec {
  id: string
  label: string
  description: string
  enforcedByBackend: boolean
  roles: Record<PolicyRole, boolean>
}

export const RBAC_STORAGE_KEY = 'iom_rbac_policy_v1'

export type NavVisibilityOverrides = Record<string, Partial<Record<PolicyRole, boolean>>>
export const NAV_VISIBILITY_RULES_KEY = 'iom_nav_visibility_rules_v1'
export const DEFAULT_NAV_VISIBILITY_RULES: NavVisibilityOverrides = {}

export const DEFAULT_RBAC_PERMISSIONS: RolePermissionSpec[] = [
  {
    id: 'manage_branches_roles',
    label: 'Create Branches & Multi-Role Assignments',
    description: 'Central Admin only in backend API; Principal governs branch structure.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: false, department_supervisor: false, zimmadar: false, teacher: false },
  },
  {
    id: 'manage_staff_courses',
    label: 'Create Users, Departments, Courses & Batches',
    description: 'Onboard teachers/staff and organize online courses & delivery modes.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: false, zimmadar: false, teacher: false },
  },
  {
    id: 'manage_admissions_fees',
    label: 'Admissions, Enrollments, Fee Plans & Invoices',
    description: 'Finance and operational control over student fees and enrollments.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: false, zimmadar: false, teacher: false },
  },
  {
    id: 'manage_routine_calendar',
    label: 'Schedule Classes & Academic Calendar',
    description: 'Manage class timetables, holidays, and exam dates across branches.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: true, zimmadar: false, teacher: false },
  },
  {
    id: 'assign_teachers_batches',
    label: 'Assign Teachers to Batches & 1:1 Slots',
    description: 'Supervisors and Zimmadars pair teachers with student cohorts.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: true, zimmadar: true, teacher: false },
  },
  {
    id: 'conduct_class_attendance',
    label: 'Conduct Online Classes & Take Digital Attendance',
    description: 'Teachers mark live class presence and record Quranic recitation progress.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: true, zimmadar: true, teacher: true },
  },
  {
    id: 'submit_class_reports',
    label: 'Draft & Submit Daily Class Reports',
    description: 'Teachers submit sabaq/dour progress reports after each online session.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: true, zimmadar: true, teacher: true },
  },
  {
    id: 'review_approve_reports',
    label: 'Review, Return or Approve Class Reports',
    description: 'Zimmadars verify student progress quality and approve teacher reports.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: true, zimmadar: true, teacher: false },
  },
  {
    id: 'manage_followups_leaves',
    label: 'Follow-ups, Warning Notices & Student Leave Processing',
    description: 'Track student attendance concerns and approve absence leaves.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: true, zimmadar: true, teacher: false },
  },
  {
    id: 'view_executive_reports',
    label: 'Executive Reports, Audit Log & Financial Analytics',
    description: 'View macro KPIs, teacher hours, student retention and revenue totals.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: false, zimmadar: false, teacher: false },
  },
  {
    id: 'manage_support_tickets',
    label: 'Support Tickets & Cross-Role Escalations',
    description: 'Respond to guardian inquiries and teacher escalations across departments.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: true, zimmadar: true, teacher: true },
  },
  {
    id: 'view_guardian_portal',
    label: 'Access Guardian Portal & Student 360',
    description: 'View fee dues, digital receipts, class recordings and children progress.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: false, zimmadar: false, teacher: false },
  },
  {
    id: 'manage_user_status_suspension',
    label: 'Manage User Accounts & ID Fee Suspension',
    description: 'Deactivate user IDs, impose fee-hold suspensions, or restore access for overdue tuition.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: false, zimmadar: true, teacher: false },
  },
]
