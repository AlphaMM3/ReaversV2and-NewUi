import {
  DEFAULT_NAV_VISIBILITY_RULES,
  NAV_VISIBILITY_RULES_KEY,
  readStore,
  type NavVisibilityOverrides,
  type PolicyRole,
} from '@/lib/superAdminStore'

// Navigation configuration — role-aware, workflow-ordered sidebar items for IOM Academy
// Cleanly organized into 7 logical operational groups without numeric clutter.

export type NavItem = {
  id: string
  label: string
  icon: string
  route: string
  roles: string[]
  badge?: 'followups' | 'reports' | 'pending' | 'tickets'
  group: NavGroupKey
  keywords?: string[]
  aliases?: string[]
}

export type NavGroupKey =
  | 'OVERVIEW'
  | 'DAILY ACADEMICS'
  | 'STUDENTS'
  | 'SUPERVISION'
  | 'COMMERCIAL & MESSAGING'
  | 'SYSTEM'

export type NavGroupMeta = {
  key: NavGroupKey
  label: string
  subtitle: string
  icon: string
  defaultOpen: boolean
}

const ALL_STAFF = ['central_admin', 'branch_admin', 'department_supervisor', 'zimmadar', 'teacher']
const MANAGERS = ['central_admin', 'branch_admin', 'department_supervisor', 'zimmadar']
const ADMINS = ['central_admin', 'branch_admin']
const GUARDIANS = ['guardian_primary', 'guardian_secondary']
const POLICY_STAFF_ROLES = new Set<string>([
  'branch_admin',
  'department_supervisor',
  'zimmadar',
  'teacher',
])

export const GROUP_META: Record<NavGroupKey, NavGroupMeta> = {
  OVERVIEW: {
    key: 'OVERVIEW',
    label: 'Overview & Insights',
    subtitle: 'অ্যাকাডেমি ড্যাশবোর্ড ও অ্যানালিটিক্স',
    icon: 'LayoutDashboard',
    defaultOpen: true,
  },
  'DAILY ACADEMICS': {
    key: 'DAILY ACADEMICS',
    label: 'Daily Academics',
    subtitle: 'ক্লাস, ১:১ শিডিউল ও হোমওয়ার্ক',
    icon: 'Video',
    defaultOpen: true,
  },
  STUDENTS: {
    key: 'STUDENTS',
    label: 'Students & Care',
    subtitle: 'ভর্তি, শিক্ষার্থী তালিকা ও ছুটি',
    icon: 'Users',
    defaultOpen: false,
  },
  SUPERVISION: {
    key: 'SUPERVISION',
    label: 'Staff & Supervision',
    subtitle: 'মুয়াল্লিম ও তদারকি রিপোর্ট',
    icon: 'CheckSquare',
    defaultOpen: false,
  },
  'COMMERCIAL & MESSAGING': {
    key: 'COMMERCIAL & MESSAGING',
    label: 'Finance & Messaging',
    subtitle: 'টিউশন ফি, ইনভয়েস ও নোটিশ',
    icon: 'Wallet',
    defaultOpen: false,
  },
  SYSTEM: {
    key: 'SYSTEM',
    label: 'Governance & System',
    subtitle: 'পারমিশন, ব্রাঞ্চ ও সেটিংস',
    icon: 'Shield',
    defaultOpen: false,
  },
}

export const NAV_ITEMS: NavItem[] = [
  // ── OVERVIEW & INSIGHTS ───────────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    route: '#/dashboard',
    roles: [...ALL_STAFF, ...GUARDIANS],
    group: 'OVERVIEW',
    keywords: ['home', 'kpi', 'summary', 'live classes', 'smartidara'],
  },
  {
    id: 'guardian-home',
    label: 'My Children Progress',
    icon: 'Heart',
    route: '#/guardian',
    roles: GUARDIANS,
    group: 'OVERVIEW',
    keywords: ['family', 'child', 'parent', 'progress', 'bkash', 'nagad'],
  },
  {
    id: 'leaderboard',
    label: 'Star Students Leaderboard',
    icon: 'Trophy',
    route: '#/leaderboard',
    roles: [...ALL_STAFF, ...GUARDIANS],
    group: 'OVERVIEW',
    keywords: ['leaderboard', 'diamonds', 'honor', 'rankings', 'star student', 'shoutout'],
  },
  {
    id: 'executive',
    label: 'Executive Reports',
    icon: 'TrendingUp',
    route: '#/executive',
    roles: ADMINS,
    group: 'OVERVIEW',
    keywords: ['analytics', 'finance', 'trends', 'board'],
  },

  // ── DAILY ACADEMICS ───────────────────────────────────────
  {
    id: 'classes',
    label: "Today's Classes",
    icon: 'Video',
    route: '#/classes',
    roles: ALL_STAFF,
    group: 'DAILY ACADEMICS',
    keywords: ['live', 'zoom', 'meet', 'session'],
  },
  {
    id: 'routine',
    label: '1:1 Timetable',
    icon: 'Calendar',
    route: '#/routine',
    roles: ALL_STAFF,
    group: 'DAILY ACADEMICS',
    keywords: ['1:1', 'timetable', 'weekly', 'slots', 'batch routine'],
  },
  {
    id: 'homework',
    label: 'Attendance & Homework',
    icon: 'BookOpen',
    route: '#/homework',
    aliases: ['attendance'],
    roles: ALL_STAFF,
    group: 'DAILY ACADEMICS',
    keywords: ['attendance', 'roll call', 'present', 'absent', 'homework', 'pora', 'sabaq', 'assignments'],
  },
  {
    id: 'exams',
    label: 'Exams & Results',
    icon: 'Award',
    route: '#/exams',
    roles: [...ALL_STAFF, ...GUARDIANS],
    group: 'DAILY ACADEMICS',
    keywords: ['exam', 'assessment', 'marks', 'grades', 'results', 'test'],
  },
  {
    id: 'calendar',
    label: 'Academic Calendar',
    icon: 'CalendarDays',
    route: '#/calendar',
    roles: [...ALL_STAFF, ...GUARDIANS],
    group: 'DAILY ACADEMICS',
    keywords: ['schedule', 'holidays', 'events', 'tracker', 'roadmap'],
  },
  {
    id: 'resources',
    label: 'Digital Library',
    icon: 'FolderOpen',
    route: '#/resources',
    roles: [...ALL_STAFF, ...GUARDIANS],
    group: 'DAILY ACADEMICS',
    keywords: ['books', 'pdf', 'recordings', 'materials', 'vault'],
  },

  // ── STUDENTS & CARE ───────────────────────────────────────
  {
    id: 'admissions',
    label: 'Admissions & Enrollments',
    icon: 'UserPlus',
    route: '#/admissions',
    aliases: ['enrollments'],
    roles: MANAGERS,
    group: 'STUDENTS',
    keywords: ['new student', 'intake', 'onboard', 'enrollments', 'batches', 'courses', 'transfers'],
  },
  {
    id: 'students',
    label: 'Students & Families',
    icon: 'Users',
    route: '#/students',
    roles: MANAGERS,
    group: 'STUDENTS',
    keywords: ['student 360', 'profile', 'photo', 'guardian'],
  },
  {
    id: 'oneto1',
    label: '1:1 Packages & Contracts',
    icon: 'User',
    route: '#/oneto1',
    roles: ALL_STAFF,
    group: 'STUDENTS',
    keywords: ['private', 'tutor', 'hifz', 'contracts'],
  },
  {
    id: 'attendance-monthly',
    label: 'Monthly Attendance',
    icon: 'BarChart2',
    route: '#/attendance/monthly',
    roles: MANAGERS,
    group: 'STUDENTS',
    keywords: ['percentage', 'pct', 'register', 'monthly attendance'],
  },
  {
    id: 'followups',
    label: 'Follow-ups',
    icon: 'AlertTriangle',
    route: '#/followups',
    roles: ALL_STAFF,
    badge: 'followups',
    group: 'STUDENTS',
    keywords: ['absent care', 'guardian call', 'alerts'],
  },
  {
    id: 'leaves',
    label: 'Leave Requests',
    icon: 'CalendarOff',
    route: '#/leaves',
    roles: [...MANAGERS, ...GUARDIANS],
    group: 'STUDENTS',
    keywords: ['absence', 'holiday', 'permission', 'student leave'],
  },

  // ── STAFF & SUPERVISION ───────────────────────────────────
  {
    id: 'reports',
    label: 'Class Reports & Missed',
    icon: 'FileText',
    route: '#/reports',
    roles: ALL_STAFF,
    badge: 'reports',
    group: 'SUPERVISION',
    keywords: ['zimmadar', 'submission', 'review', 'missed class', 'overdue'],
  },
  {
    id: 'approvals',
    label: 'Approval Center',
    icon: 'CheckSquare',
    route: '#/approvals',
    roles: [...ADMINS, 'department_supervisor', 'zimmadar'],
    badge: 'pending',
    group: 'SUPERVISION',
    keywords: ['trxid', 'verification', 'requests', 'inbox'],
  },
  {
    id: 'tickets',
    label: 'Support Tickets & Chat (টিকেট ও চ্যাট)',
    icon: 'BellRing',
    route: '#/tickets',
    roles: [...ALL_STAFF, ...GUARDIANS],
    badge: 'tickets',
    group: 'SUPERVISION',
    keywords: ['ticket', 'token', 'escalation', 'help', 'notice', 'attention', 'zimmadar', 'chat'],
  },
  {
    id: 'teachers',
    label: 'Teacher HR & Monitor',
    icon: 'UserCheck',
    route: '#/teachers',
    roles: ALL_STAFF,
    group: 'SUPERVISION',
    keywords: ['ustadh', 'ustadha', 'leave', 'live quality', 'faculty'],
  },
  {
    id: 'payables',
    label: 'Teacher Payroll',
    icon: 'DollarSign',
    route: '#/payables',
    roles: ALL_STAFF,
    group: 'SUPERVISION',
    keywords: ['salary', 'honorarium', 'payout', 'slips'],
  },

  // ── FINANCE & MESSAGING ───────────────────────────────────
  {
    id: 'invoices',
    label: 'Invoices & Payment Notices',
    icon: 'Receipt',
    route: '#/invoices',
    roles: [...ADMINS, 'department_supervisor', 'zimmadar', ...GUARDIANS],
    group: 'COMMERCIAL & MESSAGING',
    keywords: ['fees', 'bkash', 'nagad', 'dues', 'invoice', 'payment notice', 'whatsapp reminder'],
  },
  {
    id: 'expenses',
    label: 'Expenses & P&L',
    icon: 'Wallet',
    route: '#/expenses',
    roles: ADMINS,
    group: 'COMMERCIAL & MESSAGING',
    keywords: ['profit', 'loss', 'accounts', 'ledger'],
  },
  {
    id: 'communications',
    label: 'Batch Notices (Telegram)',
    icon: 'MessageSquare',
    route: '#/communications',
    roles: [...ALL_STAFF, ...GUARDIANS],
    group: 'COMMERCIAL & MESSAGING',
    keywords: ['announcements', 'templates', 'notices', 'telegram', 'whatsapp', 'q&a'],
  },

  // ── GOVERNANCE & SYSTEM ───────────────────────────────────
  {
    id: 'governance',
    label: 'Academic Control & Sanad',
    icon: 'Award',
    route: '#/governance',
    roles: ADMINS,
    group: 'SUPERVISION',
    keywords: ['certificate', 'qr', 'verify', 'principal observer', 'ijazah'],
  },
  {
    id: 'users',
    label: 'Users & Access (ব্যবহারকারী ও এক্সেস)',
    icon: 'Users',
    route: '#/users',
    roles: [...ADMINS, 'department_supervisor', 'zimmadar'],
    group: 'SYSTEM',
    keywords: ['users', 'profile', 'active', 'deactive', 'status', 'jimmadar', 'teacher', 'guardian', 'student', 'fee lock', 'bokeya'],
  },
  {
    id: 'permissions',
    label: 'Roles & Permissions',
    icon: 'KeyRound',
    route: '#/permissions',
    roles: ADMINS,
    group: 'SYSTEM',
    keywords: ['rbac', 'rules', 'teacher access', 'zimmadar access', 'visibility', 'permissions'],
  },
  {
    id: 'system',
    label: 'Automation & Backups',
    icon: 'BellRing',
    route: '#/system',
    roles: ADMINS,
    group: 'SYSTEM',
    keywords: ['cron', 'webhook', 'telegram', 'export json', 'workflows'],
  },
  {
    id: 'settings',
    label: 'Super Admin Settings',
    icon: 'SlidersHorizontal',
    route: '#/settings',
    roles: ADMINS,
    group: 'SYSTEM',
    keywords: ['courses', 'batches', 'users', 'fee plans', 'branches', 'super admin'],
  },
  {
    id: 'audit',
    label: 'Audit Log',
    icon: 'Shield',
    route: '#/audit',
    roles: ['central_admin'],
    group: 'SYSTEM',
    keywords: ['security', 'history', 'logs'],
  },
  {
    id: 'profile',
    label: 'My Account & Credentials',
    icon: 'User',
    route: '#/profile',
    roles: [...ALL_STAFF, ...GUARDIANS],
    group: 'SYSTEM',
    keywords: ['profile', 'password', 'id', 'leave', 'payroll', 'my account'],
  },
]

export const GROUP_ORDER: NavGroupKey[] = [
  'OVERVIEW',
  'DAILY ACADEMICS',
  'STUDENTS',
  'SUPERVISION',
  'COMMERCIAL & MESSAGING',
  'SYSTEM',
]

const ZIMMADAR_ROLES = new Set(['zimmadar', 'department_supervisor'])

const ZIMMADAR_OPERATIONS_IDS = [
  'reports',
  'tickets',
  'approvals',
  'invoices',
  'communications',
  'followups',
  'users',
]

const ZIMMADAR_ACADEMICS_IDS = [
  'classes',
  'admissions',
  'students',
  'routine',
  'homework',
  'exams',
  'leaderboard',
  'calendar',
  'leaves',
  'teachers',
]

const TEACHER_TEACHING_IDS = [
  'dashboard',
  'classes',
  'routine',
  'homework',
  'exams',
  'leaderboard',
  'calendar',
  'resources',
]

const TEACHER_COMMUNICATION_IDS = [
  'communications',
  'tickets',
  'reports',
  'oneto1',
]

const TEACHER_ACCOUNT_IDS = [
  'teachers',
  'payables',
  'profile',
]

const GUARDIAN_ACADEMICS_IDS = [
  'dashboard',
  'guardian-home',
  'leaderboard',
  'exams',
  'calendar',
  'resources',
]

const GUARDIAN_SUPPORT_IDS = [
  'communications',
  'tickets',
  'leaves',
]

const GUARDIAN_ACCOUNT_IDS = [
  'invoices',
  'profile',
]

function resolveRoleGroupKey(item: NavItem, role: string): NavGroupKey {
  if (GUARDIANS.includes(role)) {
    if (GUARDIAN_ACADEMICS_IDS.includes(item.id)) return 'DAILY ACADEMICS'
    if (GUARDIAN_SUPPORT_IDS.includes(item.id)) return 'STUDENTS'
    if (GUARDIAN_ACCOUNT_IDS.includes(item.id)) return 'SUPERVISION'
    return item.group
  }
  if (role === 'teacher') {
    if (TEACHER_TEACHING_IDS.includes(item.id)) return 'DAILY ACADEMICS'
    if (TEACHER_COMMUNICATION_IDS.includes(item.id)) return 'STUDENTS'
    if (TEACHER_ACCOUNT_IDS.includes(item.id)) return 'SUPERVISION'
    return item.group
  }
  if (ZIMMADAR_ROLES.has(role)) {
    if (item.group === 'OVERVIEW') return 'OVERVIEW'
    if (ZIMMADAR_OPERATIONS_IDS.includes(item.id)) return 'SUPERVISION'
    return 'DAILY ACADEMICS'
  }
  return item.group
}

export function getRoleGroupMeta(key: NavGroupKey, role: string): NavGroupMeta {
  const base = GROUP_META[key]
  if (GUARDIANS.includes(role)) {
    if (key === 'DAILY ACADEMICS') {
      return { ...base, label: 'Children & Academics', subtitle: 'Progress, exams, calendar & library', defaultOpen: true }
    }
    if (key === 'STUDENTS') {
      return { ...base, label: 'Help & Communication', subtitle: 'Ask teacher, tickets & leaves', defaultOpen: false }
    }
    if (key === 'SUPERVISION') {
      return { ...base, label: 'Billing & Profile', subtitle: 'Invoices, receipts & password change', defaultOpen: false }
    }
  }
  if (role === 'teacher') {
    if (key === 'DAILY ACADEMICS') {
      return { ...base, label: 'My Teaching Today', subtitle: 'Classes, timetable, homework & exams', defaultOpen: true }
    }
    if (key === 'STUDENTS') {
      return { ...base, label: 'Students & Escalation', subtitle: 'Parent Q&A, tickets & class reports', defaultOpen: true }
    }
    if (key === 'SUPERVISION') {
      return { ...base, label: 'My Account & Profile', subtitle: 'Leave, payroll & ID password change', defaultOpen: false }
    }
  }
  if (key === 'SUPERVISION') {
    if (ZIMMADAR_ROLES.has(role)) {
      return { ...base, label: 'Zimmadar Operations', subtitle: 'Reports, tickets, approvals & billing', defaultOpen: true }
    }
  }
  if (key === 'DAILY ACADEMICS') {
    if (ZIMMADAR_ROLES.has(role)) {
      return { ...base, label: 'Academics & Students', subtitle: 'Classes, admissions, routine & leaves', defaultOpen: false }
    }
  }
  return base
}

export function createDefaultOpenGroups(role: string): Record<NavGroupKey, boolean> {
  if (GUARDIANS.includes(role)) {
    return {
      OVERVIEW: false,
      'DAILY ACADEMICS': true,
      STUDENTS: false,
      SUPERVISION: false,
      'COMMERCIAL & MESSAGING': false,
      SYSTEM: false,
    }
  }
  if (role === 'teacher') {
    return {
      OVERVIEW: false,
      'DAILY ACADEMICS': true,
      STUDENTS: false,
      SUPERVISION: false,
      'COMMERCIAL & MESSAGING': false,
      SYSTEM: false,
    }
  }
  if (ZIMMADAR_ROLES.has(role)) {
    return {
      OVERVIEW: false,
      SUPERVISION: true,
      'DAILY ACADEMICS': false,
      STUDENTS: false,
      'COMMERCIAL & MESSAGING': false,
      SYSTEM: false,
    }
  }
  return {
    OVERVIEW: true,
    'DAILY ACADEMICS': true,
    STUDENTS: false,
    SUPERVISION: false,
    'COMMERCIAL & MESSAGING': false,
    SYSTEM: false,
  }
}

export function isFlatNavRole(_role: string): boolean {
  return false
}

export function isNavItemActive(item: NavItem, activeRoute: string): boolean {
  const cleanActive = activeRoute.replace(/^#\/?/, '') || 'dashboard'
  const cleanRoute = item.route.replace(/^#\/?/, '')
  if (cleanActive === cleanRoute) return true
  return (item.aliases ?? []).includes(cleanActive)
}

export function getMobileQuickNav(role: string, allowedItems: NavItem[]): NavItem[] {
  const preferredIds = GUARDIANS.includes(role)
    ? ['dashboard', 'guardian-home', 'invoices']
    : role === 'teacher'
      ? ['dashboard', 'classes', 'homework']
      : role === 'zimmadar' || role === 'department_supervisor'
        ? ['dashboard', 'reports', 'approvals']
        : ['dashboard', 'classes', 'approvals']

  const picked: NavItem[] = []
  for (const id of preferredIds) {
    const found = allowedItems.find((i) => i.id === id)
    if (found) picked.push(found)
  }
  for (const item of allowedItems) {
    if (picked.length >= 3) break
    if (!picked.some((p) => p.id === item.id)) picked.push(item)
  }
  return picked.slice(0, 3)
}

export function isNavVisibleForRole(
  item: NavItem,
  role: string,
  rules: NavVisibilityOverrides = DEFAULT_NAV_VISIBILITY_RULES,
): boolean {
  if (role === 'central_admin') {
    return item.roles.includes('central_admin')
  }
  if (POLICY_STAFF_ROLES.has(role)) {
    const custom = rules[item.id]?.[role as PolicyRole]
    if (typeof custom === 'boolean') return custom
  }
  return item.roles.includes(role)
}

export function getNavForRole(role: string, customRules?: NavVisibilityOverrides): NavItem[] {
  const rules = customRules ?? readStore<NavVisibilityOverrides>(NAV_VISIBILITY_RULES_KEY, DEFAULT_NAV_VISIBILITY_RULES)
  return NAV_ITEMS.filter((item) => isNavVisibleForRole(item, role, rules))
}

export function getDefaultRouteForRole(role: string, customRules?: NavVisibilityOverrides): string {
  const allowed = getNavForRole(role, customRules)
  return allowed[0]?.route ?? '#/classes'
}

const KNOWN_NAV_PATHS = new Set(
  NAV_ITEMS.flatMap((item) => [item.route.replace(/^#\/?/, ''), ...(item.aliases ?? [])]),
)

export function isKnownNavRoute(route: string): boolean {
  const clean = route === '' ? 'dashboard' : route
  return KNOWN_NAV_PATHS.has(clean)
}

export function canAccessRoute(route: string, role: string, customRules?: NavVisibilityOverrides): boolean {
  const clean = route === '' ? 'dashboard' : route
  if (!KNOWN_NAV_PATHS.has(clean)) return true
  const allowed = getNavForRole(role, customRules)
  return allowed.some(
    (item) => item.route.replace(/^#\/?/, '') === clean || (item.aliases ?? []).includes(clean),
  )
}

export function groupNavItems(
  items: NavItem[],
  role = 'central_admin',
): Array<{ meta: NavGroupMeta; items: NavItem[] }> {
  const result: Array<{ meta: NavGroupMeta; items: NavItem[] }> = []

  if (GUARDIANS.includes(role)) {
    const acadItems = items
      .filter((i) => GUARDIAN_ACADEMICS_IDS.includes(i.id))
      .sort((a, b) => GUARDIAN_ACADEMICS_IDS.indexOf(a.id) - GUARDIAN_ACADEMICS_IDS.indexOf(b.id))
    if (acadItems.length > 0) {
      result.push({ meta: getRoleGroupMeta('DAILY ACADEMICS', role), items: acadItems })
    }

    const supportItems = items
      .filter((i) => GUARDIAN_SUPPORT_IDS.includes(i.id))
      .sort((a, b) => GUARDIAN_SUPPORT_IDS.indexOf(a.id) - GUARDIAN_SUPPORT_IDS.indexOf(b.id))
    if (supportItems.length > 0) {
      result.push({ meta: getRoleGroupMeta('STUDENTS', role), items: supportItems })
    }

    const accountItems = items
      .filter((i) => GUARDIAN_ACCOUNT_IDS.includes(i.id))
      .sort((a, b) => GUARDIAN_ACCOUNT_IDS.indexOf(a.id) - GUARDIAN_ACCOUNT_IDS.indexOf(b.id))
    if (accountItems.length > 0) {
      result.push({ meta: getRoleGroupMeta('SUPERVISION', role), items: accountItems })
    }

    return result
  }

  if (role === 'teacher') {
    const teachingItems = items
      .filter((i) => TEACHER_TEACHING_IDS.includes(i.id))
      .sort((a, b) => TEACHER_TEACHING_IDS.indexOf(a.id) - TEACHER_TEACHING_IDS.indexOf(b.id))
    if (teachingItems.length > 0) {
      result.push({ meta: getRoleGroupMeta('DAILY ACADEMICS', role), items: teachingItems })
    }

    const commItems = items
      .filter((i) => TEACHER_COMMUNICATION_IDS.includes(i.id))
      .sort((a, b) => TEACHER_COMMUNICATION_IDS.indexOf(a.id) - TEACHER_COMMUNICATION_IDS.indexOf(b.id))
    if (commItems.length > 0) {
      result.push({ meta: getRoleGroupMeta('STUDENTS', role), items: commItems })
    }

    const accountItems = items
      .filter((i) => TEACHER_ACCOUNT_IDS.includes(i.id))
      .sort((a, b) => TEACHER_ACCOUNT_IDS.indexOf(a.id) - TEACHER_ACCOUNT_IDS.indexOf(b.id))
    if (accountItems.length > 0) {
      result.push({ meta: getRoleGroupMeta('SUPERVISION', role), items: accountItems })
    }

    return result
  }
  
  if (ZIMMADAR_ROLES.has(role)) {
    const overviewItems = items.filter((i) => i.group === 'OVERVIEW')
    if (overviewItems.length > 0) {
      result.push({ meta: getRoleGroupMeta('OVERVIEW', role), items: overviewItems })
    }

    const opItems = items
      .filter((i) => ZIMMADAR_OPERATIONS_IDS.includes(i.id))
      .sort((a, b) => ZIMMADAR_OPERATIONS_IDS.indexOf(a.id) - ZIMMADAR_OPERATIONS_IDS.indexOf(b.id))
    if (opItems.length > 0) {
      result.push({ meta: getRoleGroupMeta('SUPERVISION', role), items: opItems })
    }

    const acadItems = items
      .filter((i) => ZIMMADAR_ACADEMICS_IDS.includes(i.id))
      .sort((a, b) => ZIMMADAR_ACADEMICS_IDS.indexOf(a.id) - ZIMMADAR_ACADEMICS_IDS.indexOf(b.id))
    if (acadItems.length > 0) {
      result.push({ meta: getRoleGroupMeta('DAILY ACADEMICS', role), items: acadItems })
    }

    return result
  }

  for (const group of GROUP_ORDER) {
    const groupItems = items.filter((i) => i.group === group)
    if (groupItems.length > 0) {
      result.push({ meta: getRoleGroupMeta(group, role), items: groupItems })
    }
  }
  return result
}

export function getRouteBreadcrumb(
  items: NavItem[],
  route: string,
  role = 'central_admin',
): { group?: NavGroupMeta; item?: NavItem } {
  const item = items.find((i) => isNavItemActive(i, route))
  if (!item) return {}
  return { group: getRoleGroupMeta(resolveRoleGroupKey(item, role), role), item }
}
