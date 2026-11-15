import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toArray } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import {
  COURSE_TRACKER_PLANS_KEY,
  DEFAULT_NAV_VISIBILITY_RULES,
  DEFAULT_RBAC_PERMISSIONS,
  exportAllSuperAdminData,
  importAllSuperAdminData,
  NAV_VISIBILITY_RULES_KEY,
  RBAC_STORAGE_KEY,
  type CourseTrackerPlan,
  type NavVisibilityOverrides,
  type PolicyRole,
  type RolePermissionSpec,
  useLocalStore,
} from '@/lib/superAdminStore'
import {
  GROUP_META,
  GROUP_ORDER,
  isNavVisibleForRole,
  NAV_ITEMS,
} from '@/features/layout/navConfig'
import {
  Settings, Plus, Users, ShieldCheck, KeyRound, Power, Calendar,
  UserCog, Building2, Layers, BookOpen, GraduationCap, Copy, Check, X, RotateCcw,
  Download, Upload,
} from 'lucide-react'

type SetupTab = 'branches' | 'departments' | 'courses' | 'batches' | 'users' | 'permissions'

interface BranchRow {
  id: number
  name: string
}

interface DepartmentRow {
  id: number
  branch_id: number
  name: string
  category?: string
}

interface CourseRow {
  id: number
  department_id: number
  title: string
  duration_type: 'fixed' | 'continuous'
  department?: string
  branch_id?: number
  start_date?: string | null
  end_date?: string | null
}

interface BatchRow {
  id: number
  course_id: number
  label: string
  delivery_mode: 'group' | 'one_to_one'
  teacher_id?: number | null
  zimmadar_id?: number | null
  teacher_name?: string | null
  zimmadar_name?: string | null
  course_title?: string
  branch_id?: number
  start_date?: string | null
  end_date?: string | null
  academic_session_id?: number | null
}

interface UserRow {
  id: number
  name: string
  email: string
  role: string
  branch_id?: number | null
  department_id?: number | null
  active: number | boolean
  assigned_roles?: string | null
}

interface RoleAssignmentRow {
  id: number
  role: string
  branch_id: number | null
  department_id: number | null
  active: number | boolean
  branch_name?: string | null
  department_name?: string | null
}

interface AcademicSessionRow {
  id: number
  branch_id: number
  label: string
  start_date: string
  end_date: string
}

const ALL_USER_ROLES = [
  'teacher',
  'zimmadar',
  'department_supervisor',
  'branch_admin',
  'central_admin',
  'guardian_primary',
  'guardian_secondary',
] as const

const ASSIGNABLE_STAFF_ROLES: PolicyRole[] = [
  'teacher',
  'zimmadar',
  'department_supervisor',
  'branch_admin',
  'central_admin',
]

const POLICY_ROLE_COLS: Array<{ key: PolicyRole; label: string }> = [
  { key: 'central_admin', label: 'Principal / Central' },
  { key: 'branch_admin', label: 'Branch Admin' },
  { key: 'department_supervisor', label: 'Dept Supervisor' },
  { key: 'zimmadar', label: 'Zimmadar' },
  { key: 'teacher', label: 'Teacher' },
]

function generateStrongPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
  let out = 'Itqaan!'
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export default function SettingsPage({
  role = 'central_admin',
  initialTab,
}: {
  role?: string
  initialTab?: SetupTab
}) {
  const isCentral = role === 'central_admin'
  const [tab, setTab] = useState<SetupTab>(initialTab ?? 'branches')
  const [saving, setSaving] = useState(false)
  const qc = useQueryClient()
  const toast = useToast()
  const backupFileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (initialTab) setTab(initialTab)
  }, [initialTab])

  function handleExportJsonBackup() {
    const json = exportAllSuperAdminData()
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iom-academy-policy-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Policy, fee plans & expenses JSON backup downloaded')
  }

  function handleImportJsonBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const res = importAllSuperAdminData(String(reader.result || ''))
        toast.success(`Restored & synced ${res.restoredKeys} configuration store(s) to database`)
      } catch (err) {
        toast.error(err, 'Invalid backup JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Queries
  const [includeInactive, setIncludeInactive] = useState(false)
  const { data: branches = [], isLoading: lb } = useQuery<BranchRow[]>({
    queryKey: ['branches'],
    queryFn: () => api.get<BranchRow[] | { items?: BranchRow[] }>('/branches').then(toArray),
  })
  const { data: sessions = [], isLoading: ls } = useQuery<AcademicSessionRow[]>({
    queryKey: ['academic-sessions'],
    queryFn: () =>
      api.get<AcademicSessionRow[] | { items?: AcademicSessionRow[] }>('/academic-sessions').then(toArray).catch(() => []),
  })
  const { data: departments = [], isLoading: ld } = useQuery<DepartmentRow[]>({
    queryKey: ['departments'],
    queryFn: () => api.get<DepartmentRow[] | { items?: DepartmentRow[] }>('/departments').then(toArray),
  })
  const { data: courses = [], isLoading: lc } = useQuery<CourseRow[]>({
    queryKey: ['courses'],
    queryFn: () => api.get<CourseRow[] | { items?: CourseRow[] }>('/courses').then(toArray),
  })
  const { data: batches = [], isLoading: lbt } = useQuery<BatchRow[]>({
    queryKey: ['batches'],
    queryFn: () => api.get<BatchRow[] | { items?: BatchRow[] }>('/batches').then(toArray),
  })
  const { data: users = [], isLoading: lu } = useQuery<UserRow[]>({
    queryKey: ['users', includeInactive],
    queryFn: () =>
      api
        .get<UserRow[] | { items?: UserRow[] }>(`/users${includeInactive ? '?include_inactive=1' : ''}`)
        .then(toArray),
  })

  // Branch + Session forms
  const [branchName, setBranchName] = useState('')
  const [sessBranchId, setSessBranchId] = useState('')
  const [sessLabel, setSessLabel] = useState('')
  const [sessStart, setSessStart] = useState('')
  const [sessEnd, setSessEnd] = useState('')

  // Department form
  const [depBranchId, setDepBranchId] = useState('')
  const [depName, setDepName] = useState('')
  const [depCategory, setDepCategory] = useState<'regular' | 'single_course' | 'other'>('regular')

  // Course form + Date window modal
  const [courseDepId, setCourseDepId] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDuration, setCourseDuration] = useState<'fixed' | 'continuous'>('fixed')
  const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null)
  const [courseStartDate, setCourseStartDate] = useState('')
  const [courseEndDate, setCourseEndDate] = useState('')

  // Batch form + Assignment modal
  const [trackerPlans, setTrackerPlans] = useLocalStore<CourseTrackerPlan[]>(COURSE_TRACKER_PLANS_KEY, [])
  const [batchCourseId, setBatchCourseId] = useState('')
  const [batchLabel, setBatchLabel] = useState('')
  const [batchMode, setBatchMode] = useState<'group' | 'one_to_one'>('group')
  const [batchTeacherId, setBatchTeacherId] = useState('')
  const [batchZimmadarId, setBatchZimmadarId] = useState('')
  const [batchStartDate, setBatchStartDate] = useState('')
  const [batchEndDate, setBatchEndDate] = useState('')
  const [batchExamDate, setBatchExamDate] = useState('')
  const [batchGenderTrack, setBatchGenderTrack] = useState<'all' | 'male' | 'female'>('all')
  const [batchProgramTrack, setBatchProgramTrack] = useState<'other' | 'hifz' | 'najera'>('other')
  const [batchMilestoneNote, setBatchMilestoneNote] = useState('')
  const [assignBatch, setAssignBatch] = useState<BatchRow | null>(null)
  const [assignTeacherId, setAssignTeacherId] = useState('')
  const [assignZimmadarId, setAssignZimmadarId] = useState('')
  const [assignStartDate, setAssignStartDate] = useState('')
  const [assignEndDate, setAssignEndDate] = useState('')
  const [assignExamDate, setAssignExamDate] = useState('')
  const [assignGenderTrack, setAssignGenderTrack] = useState<'all' | 'male' | 'female'>('all')
  const [assignProgramTrack, setAssignProgramTrack] = useState<'other' | 'hifz' | 'najera'>('other')
  const [assignMilestoneNote, setAssignMilestoneNote] = useState('')
  const [assignUpdateScheduled, setAssignUpdateScheduled] = useState(true)
  const [assignReason, setAssignReason] = useState('Staffing update by Principal/Admin')

  const { data: batchHistory = [] } = useQuery<any[]>({
    queryKey: ['batch-assignments', assignBatch?.id],
    queryFn: () =>
      api.get<any[] | { items?: any[] }>(`/batches/${assignBatch!.id}/assignments`).then(toArray).catch(() => []),
    enabled: Boolean(assignBatch?.id),
  })

  // Staff / User creation + roles + reset link
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<string>('teacher')
  const [newUserBranchId, setNewUserBranchId] = useState('')
  const [newUserDeptId, setNewUserDeptId] = useState('')
  const [newUserPassword, setNewUserPassword] = useState(() => generateStrongPassword())

  const [resetResult, setResetResult] = useState<{ userName: string; token: string; expires_at: string } | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)

  const [roleUser, setRoleUser] = useState<UserRow | null>(null)
  const [extraRole, setExtraRole] = useState<PolicyRole>('teacher')
  const [extraBranchId, setExtraBranchId] = useState('')
  const [extraDeptId, setExtraDeptId] = useState('')

  const { data: userRoles = [] } = useQuery<RoleAssignmentRow[]>({
    queryKey: ['user-roles', roleUser?.id],
    queryFn: () =>
      api.get<RoleAssignmentRow[] | { items?: RoleAssignmentRow[] }>(`/users/${roleUser!.id}/roles`).then(toArray),
    enabled: Boolean(roleUser?.id) && isCentral,
  })

  // RBAC Policy Matrix & Dynamic Menu Visibility Rules
  const [rbacPolicy, setRbacPolicy] = useLocalStore<RolePermissionSpec[]>(
    RBAC_STORAGE_KEY,
    DEFAULT_RBAC_PERMISSIONS,
  )
  const [navRules, setNavRules] = useLocalStore<NavVisibilityOverrides>(
    NAV_VISIBILITY_RULES_KEY,
    DEFAULT_NAV_VISIBILITY_RULES,
  )

  const teachers = users.filter((u) => u.active && (u.role === 'teacher' || (u.assigned_roles || '').includes('teacher')))
  const zimmadars = users.filter((u) => u.active && (u.role === 'zimmadar' || (u.assigned_roles || '').includes('zimmadar')))

  const branchNameById = (id?: number | null) =>
    branches.find((b) => b.id === id)?.name || (id ? `Branch #${id}` : 'Global')

  const defaultBranchId = branches[0]?.id ? String(branches[0].id) : ''

  // Handlers
  async function addBranch(e: React.FormEvent) {
    e.preventDefault()
    if (!branchName.trim()) return
    setSaving(true)
    try {
      await api.post('/branches', { name: branchName.trim() })
      setBranchName('')
      toast.success('Branch created')
      qc.invalidateQueries({ queryKey: ['branches'] })
    } catch (err) {
      toast.error(err, 'Failed to create branch')
    } finally {
      setSaving(false)
    }
  }

  async function addSession(e: React.FormEvent) {
    e.preventDefault()
    const bId = Number(sessBranchId || defaultBranchId)
    if (!bId || !sessLabel.trim() || !sessStart || !sessEnd) return
    setSaving(true)
    try {
      await api.post('/academic-sessions', {
        branch_id: bId,
        label: sessLabel.trim(),
        start_date: sessStart,
        end_date: sessEnd,
      })
      setSessLabel('')
      setSessStart('')
      setSessEnd('')
      toast.success('Academic session created')
      qc.invalidateQueries({ queryKey: ['academic-sessions'] })
      qc.invalidateQueries({ queryKey: ['dashboard-academic-sessions'] })
    } catch (err) {
      toast.error(err, 'Failed to create session')
    } finally {
      setSaving(false)
    }
  }

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault()
    const bId = Number(depBranchId || defaultBranchId)
    if (!bId || !depName.trim()) return
    setSaving(true)
    try {
      await api.post('/departments', {
        branch_id: bId,
        name: depName.trim(),
        category: depCategory,
      })
      setDepName('')
      toast.success('Department created')
      qc.invalidateQueries({ queryKey: ['departments'] })
    } catch (err) {
      toast.error(err, 'Failed to create department')
    } finally {
      setSaving(false)
    }
  }

  async function addCourse(e: React.FormEvent) {
    e.preventDefault()
    const dId = Number(courseDepId || departments[0]?.id)
    if (!dId || !courseTitle.trim()) return
    setSaving(true)
    try {
      await api.post('/courses', {
        department_id: dId,
        title: courseTitle.trim(),
        duration_type: courseDuration,
      })
      setCourseTitle('')
      toast.success('Course created')
      qc.invalidateQueries({ queryKey: ['courses'] })
    } catch (err) {
      toast.error(err, 'Failed to create course')
    } finally {
      setSaving(false)
    }
  }

  async function saveCourseDates(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCourse) return
    setSaving(true)
    try {
      await api.post(`/courses/${editingCourse.id}/settings`, {
        start_date: courseStartDate || null,
        end_date: courseEndDate || null,
      })
      toast.success(`Updated dates for ${editingCourse.title}`)
      setEditingCourse(null)
      qc.invalidateQueries({ queryKey: ['courses'] })
    } catch (err) {
      toast.error(err, 'Failed to update course dates')
    } finally {
      setSaving(false)
    }
  }

  function upsertBatchTrackerPlan(
    targetBatchId: number,
    payload: {
      start_date: string
      end_date: string
      exam_date?: string
      gender_track?: 'all' | 'male' | 'female'
      program_track?: 'hifz' | 'najera' | 'other'
      milestone_note?: string
    },
  ) {
    setTrackerPlans((prev) => [
      ...prev.filter((p) => p.batch_id !== targetBatchId),
      {
        batch_id: targetBatchId,
        start_date: payload.start_date,
        end_date: payload.end_date,
        exam_date: payload.exam_date || undefined,
        gender_track: payload.gender_track || 'all',
        program_track: payload.program_track || 'other',
        milestone_note: payload.milestone_note?.trim() || undefined,
      },
    ])
  }

  async function addBatch(e: React.FormEvent) {
    e.preventDefault()
    const cId = Number(batchCourseId || courses[0]?.id)
    if (!cId || !batchLabel.trim()) return
    if (batchStartDate && batchEndDate && batchEndDate < batchStartDate) {
      toast.warning('End date cannot be earlier than start date')
      return
    }
    setSaving(true)
    try {
      const created = await api.post<{ id?: number }>('/batches', {
        course_id: cId,
        label: batchLabel.trim(),
        delivery_mode: batchMode,
        teacher_id: batchTeacherId ? Number(batchTeacherId) : null,
        zimmadar_id: batchZimmadarId ? Number(batchZimmadarId) : null,
        start_date: batchStartDate || null,
        end_date: batchEndDate || null,
      })
      if (created?.id && (batchStartDate || batchEndDate || batchExamDate || batchGenderTrack !== 'all' || batchProgramTrack !== 'other' || batchMilestoneNote.trim())) {
        const yr = new Date().getFullYear()
        upsertBatchTrackerPlan(created.id, {
          start_date: batchStartDate || `${yr}-01-01`,
          end_date: batchEndDate || `${yr}-12-31`,
          exam_date: batchExamDate || undefined,
          gender_track: batchGenderTrack,
          program_track: batchProgramTrack,
          milestone_note: batchMilestoneNote,
        })
      }
      setBatchLabel('')
      setBatchTeacherId('')
      setBatchZimmadarId('')
      setBatchStartDate('')
      setBatchEndDate('')
      setBatchExamDate('')
      setBatchGenderTrack('all')
      setBatchProgramTrack('other')
      setBatchMilestoneNote('')
      toast.success('Batch created')
      qc.invalidateQueries({ queryKey: ['batches'] })
      qc.invalidateQueries({ queryKey: ['batches-for-calendar'] })
    } catch (err) {
      toast.error(err, 'Failed to create batch')
    } finally {
      setSaving(false)
    }
  }

  async function submitBatchAssignment(e: React.FormEvent) {
    e.preventDefault()
    if (!assignBatch) return
    if (assignStartDate && assignEndDate && assignEndDate < assignStartDate) {
      toast.warning('End date cannot be earlier than start date')
      return
    }
    setSaving(true)
    try {
      await api.post(`/batches/${assignBatch.id}/assignments`, {
        teacher_id: assignTeacherId ? Number(assignTeacherId) : null,
        zimmadar_id: assignZimmadarId ? Number(assignZimmadarId) : null,
        expected_teacher_id: assignBatch.teacher_id ?? null,
        expected_zimmadar_id: assignBatch.zimmadar_id ?? null,
        update_scheduled: assignUpdateScheduled,
        reason: assignReason.trim() || 'Batch staff assignment updated',
      })
      if (assignStartDate || assignEndDate || assignExamDate || assignGenderTrack !== 'all' || assignProgramTrack !== 'other' || assignMilestoneNote.trim()) {
        const yr = new Date().getFullYear()
        upsertBatchTrackerPlan(assignBatch.id, {
          start_date: assignStartDate || assignBatch.start_date?.slice(0, 10) || `${yr}-01-01`,
          end_date: assignEndDate || assignBatch.end_date?.slice(0, 10) || `${yr}-12-31`,
          exam_date: assignExamDate || undefined,
          gender_track: assignGenderTrack,
          program_track: assignProgramTrack,
          milestone_note: assignMilestoneNote,
        })
      }
      toast.success(`Updated batch settings for ${assignBatch.label}`)
      setAssignBatch(null)
      qc.invalidateQueries({ queryKey: ['batches'] })
      qc.invalidateQueries({ queryKey: ['batches-for-calendar'] })
      qc.invalidateQueries({ queryKey: ['classes'] })
    } catch (err) {
      toast.error(err, 'Failed to update batch assignment')
    } finally {
      setSaving(false)
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newUserName.trim() || !newUserEmail.trim() || newUserPassword.length < 12) {
      toast.error(new Error('Password must be at least 12 characters long'))
      return
    }
    const bId = newUserRole === 'central_admin' ? null : Number(newUserBranchId || defaultBranchId)
    setSaving(true)
    try {
      await api.post('/users', {
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
        branch_id: bId,
        department_id: newUserDeptId ? Number(newUserDeptId) : null,
        password: newUserPassword,
      })
      toast.success(`User "${newUserName.trim()}" created`)
      setNewUserName('')
      setNewUserEmail('')
      setNewUserPassword(generateStrongPassword())
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['dashboard-users'] })
    } catch (err) {
      toast.error(err, 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  async function toggleUserStatus(u: UserRow) {
    const currentlyActive = Boolean(u.active)
    try {
      await api.post(`/users/${u.id}/status`, {
        active: !currentlyActive,
        expected_active: currentlyActive,
      })
      toast.success(`${u.name} ${currentlyActive ? 'suspended' : 'activated'}`)
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['dashboard-users'] })
    } catch (err) {
      toast.error(err, 'Failed to update user status')
    }
  }

  async function issueResetLink(u: UserRow) {
    try {
      const res = await api.post<{ token: string; expires_at: string }>(`/users/${u.id}/reset-link`, {})
      setResetResult({ userName: u.name, token: res.token, expires_at: res.expires_at })
      setCopiedToken(false)
      toast.success(`Reset token generated for ${u.name}`)
    } catch (err) {
      toast.error(err, 'Failed to generate reset link')
    }
  }

  async function assignExtraRole(e: React.FormEvent) {
    e.preventDefault()
    if (!roleUser) return
    setSaving(true)
    try {
      await api.post(`/users/${roleUser.id}/roles`, {
        role: extraRole,
        branch_id: extraRole === 'central_admin' ? null : Number(extraBranchId || roleUser.branch_id || defaultBranchId),
        department_id: extraRole === 'central_admin' || extraRole === 'branch_admin'
          ? null
          : extraDeptId
            ? Number(extraDeptId)
            : null,
      })
      toast.success(`Assigned ${extraRole} to ${roleUser.name}`)
      qc.invalidateQueries({ queryKey: ['user-roles', roleUser.id] })
      qc.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      toast.error(err, 'Failed to assign role')
    } finally {
      setSaving(false)
    }
  }

  async function revokeExtraRole(assignmentId: number) {
    if (!roleUser) return
    try {
      await api.post(`/users/${roleUser.id}/roles/${assignmentId}/revoke`, {})
      toast.success('Role assignment revoked')
      qc.invalidateQueries({ queryKey: ['user-roles', roleUser.id] })
      qc.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      toast.error(err, 'Failed to revoke role')
    }
  }

  function togglePermissionCell(permId: string, colRole: PolicyRole) {
    setRbacPolicy((prev) =>
      prev.map((p) => {
        if (p.id !== permId || p.enforcedByBackend || colRole === 'central_admin') return p
        return { ...p, roles: { ...p.roles, [colRole]: !p.roles[colRole] } }
      }),
    )
    toast.success('Operational guardrail updated')
  }

  function toggleMenuRule(navId: string, colRole: PolicyRole) {
    if (colRole === 'central_admin') return
    const item = NAV_ITEMS.find((i) => i.id === navId)
    if (!item) return
    const currentlyVisible = isNavVisibleForRole(item, colRole, navRules)
    setNavRules((prev) => ({
      ...prev,
      [navId]: {
        ...(prev[navId] ?? {}),
        [colRole]: !currentlyVisible,
      },
    }))
    toast.success(`Updated sidebar access for ${colRole.replace('_', ' ')}`)
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter
    const q = userSearch.trim().toLowerCase()
    const matchesSearch =
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    return matchesRole && matchesSearch
  })

  const tabItems: Array<{ id: SetupTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'branches', label: 'Branches & Sessions', icon: Building2 },
    { id: 'departments', label: 'Departments', icon: Layers },
    { id: 'courses', label: 'Courses & Dates', icon: BookOpen },
    { id: 'batches', label: 'Batches & Staff', icon: GraduationCap },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'permissions', label: 'Roles & Permissions', icon: KeyRound },
  ]

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading flex items-center gap-2">
            {tab === 'permissions' ? (
              <>
                <KeyRound className="w-5 h-5 text-primary-700" /> Roles &amp; Permissions Rules
              </>
            ) : (
              <>
                <Settings className="w-5 h-5 text-primary-700" /> Super Admin Settings &amp; Academy Setup
              </>
            )}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {tab === 'permissions'
              ? 'Control exactly which pages & actions Teachers, Zimmadars, Department Supervisors, and Branch Admins can view or execute'
              : 'Super Admin workspace — Branches, Sessions, Departments, Online Courses, Batches, Staff Multi-Roles & JSON Backups'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="primary">
            {users.length} users · {courses.length} courses · {batches.length} batches
          </Badge>
          <input
            ref={backupFileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportJsonBackup}
          />
          <Button size="sm" variant="outline" onClick={handleExportJsonBackup}>
            <Download className="w-3.5 h-3.5" /> Export JSON
          </Button>
          <Button size="sm" variant="outline" onClick={() => backupFileRef.current?.click()}>
            <Upload className="w-3.5 h-3.5" /> Restore JSON
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === id
                ? 'bg-primary-700 text-white shadow-sm'
                : 'bg-surface border border-border text-body hover:bg-bg'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: BRANCHES & ACADEMIC SESSIONS */}
      {tab === 'branches' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Academy Branches ({branches.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCentral && (
                <form onSubmit={addBranch} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      label="New Branch Name"
                      placeholder="Global Online Girls Branch"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                    />
                  </div>
                  <Button type="submit" loading={saving}>
                    <Plus className="w-4 h-4" /> Add Branch
                  </Button>
                </form>
              )}
              {lb ? (
                <Skeleton className="h-24" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="iom-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Branch Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map((b) => (
                        <tr key={b.id}>
                          <td className="font-mono text-xs">#{b.id}</td>
                          <td className="font-semibold text-heading">{b.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-700" /> Academic Sessions / Terms ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addSession} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Branch</label>
                  <select
                    value={sessBranchId || defaultBranchId}
                    onChange={(e) => setSessBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Session Label"
                  placeholder="2026-2027 Academic Year"
                  value={sessLabel}
                  onChange={(e) => setSessLabel(e.target.value)}
                  required
                />
                <Input
                  label="Start Date"
                  type="date"
                  value={sessStart}
                  onChange={(e) => setSessStart(e.target.value)}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={sessEnd}
                  onChange={(e) => setSessEnd(e.target.value)}
                  required
                />
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" loading={saving}>
                    <Plus className="w-4 h-4" /> Create Academic Session
                  </Button>
                </div>
              </form>

              {ls ? (
                <Skeleton className="h-20" />
              ) : sessions.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No academic sessions created yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="iom-table">
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>Branch</th>
                        <th>Dates</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => (
                        <tr key={s.id}>
                          <td className="font-semibold text-heading">{s.label}</td>
                          <td className="text-xs">{branchNameById(s.branch_id)}</td>
                          <td className="text-xs font-mono">
                            {s.start_date} → {s.end_date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {tab === 'departments' && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Create New Department</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addDepartment} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Branch</label>
                  <select
                    value={depBranchId || defaultBranchId}
                    onChange={(e) => setDepBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Department Name"
                  placeholder="Hifzul Quran (Online)"
                  value={depName}
                  onChange={(e) => setDepName(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Category</label>
                  <select
                    value={depCategory}
                    onChange={(e) => setDepCategory(e.target.value as 'regular' | 'single_course' | 'other')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    <option value="regular">Regular Academy</option>
                    <option value="single_course">Single Course</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Button type="submit" loading={saving}>
                  <Plus className="w-4 h-4" /> Create Department
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Departments ({departments.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {ld ? (
                <Skeleton className="h-24 m-4" />
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Department</th>
                      <th>Category</th>
                      <th>Branch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d) => (
                      <tr key={d.id}>
                        <td className="font-mono text-xs">#{d.id}</td>
                        <td className="font-semibold text-heading">{d.name}</td>
                        <td>
                          <Badge variant="primary">{d.category || 'regular'}</Badge>
                        </td>
                        <td className="text-xs">{branchNameById(d.branch_id)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: COURSES & DATE SETTINGS */}
      {tab === 'courses' && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Create Online Course</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addCourse} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Department</label>
                  <select
                    value={courseDepId || String(departments[0]?.id || '')}
                    onChange={(e) => setCourseDepId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({branchNameById(d.branch_id)})
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Course Title"
                  placeholder="Tajweed & Makhraj Foundation"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Duration Type</label>
                  <select
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(e.target.value as 'fixed' | 'continuous')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    <option value="fixed">Fixed Term</option>
                    <option value="continuous">Continuous (Ongoing)</option>
                  </select>
                </div>
                <Button type="submit" loading={saving}>
                  <Plus className="w-4 h-4" /> Create Course
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Courses Catalog ({courses.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {lc ? (
                <Skeleton className="h-24 m-4" />
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Course Title</th>
                      <th>Duration Type</th>
                      <th>Department</th>
                      <th>Active Window</th>
                      <th className="text-right">Configure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c) => (
                      <tr key={c.id}>
                        <td className="font-mono text-xs">#{c.id}</td>
                        <td className="font-semibold text-heading">{c.title}</td>
                        <td>
                          <Badge variant="secondary">{c.duration_type}</Badge>
                        </td>
                        <td className="text-xs">{c.department || `Dept #${c.department_id}`}</td>
                        <td className="text-xs font-mono">
                          {c.start_date || c.end_date ? `${c.start_date || '—'} → ${c.end_date || '—'}` : 'Open-ended'}
                        </td>
                        <td className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCourse(c)
                              setCourseStartDate(c.start_date || '')
                              setCourseEndDate(c.end_date || '')
                            }}
                          >
                            <Calendar className="w-3.5 h-3.5" /> Dates
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: BATCHES & TEACHER/ZIMMADAR ASSIGNMENTS */}
      {tab === 'batches' && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Create Batch & Assign Teaching Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addBatch} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-heading mb-1">Course</label>
                  <select
                    value={batchCourseId || String(courses[0]?.id || '')}
                    onChange={(e) => setBatchCourseId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Batch Label"
                  placeholder="Evening Batch B2"
                  value={batchLabel}
                  onChange={(e) => setBatchLabel(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Delivery</label>
                  <select
                    value={batchMode}
                    onChange={(e) => setBatchMode(e.target.value as 'group' | 'one_to_one')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    <option value="group">Group Live Class</option>
                    <option value="one_to_one">1:1 Private</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Teacher</label>
                  <select
                    value={batchTeacherId}
                    onChange={(e) => setBatchTeacherId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    <option value="">Unassigned</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" loading={saving}>
                  <Plus className="w-4 h-4" /> Create Batch
                </Button>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-heading mb-1">Zimmadar (Optional)</label>
                  <select
                    value={batchZimmadarId}
                    onChange={(e) => setBatchZimmadarId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    <option value="">Unassigned</option>
                    {zimmadars.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Start Date"
                  type="date"
                  value={batchStartDate}
                  onChange={(e) => setBatchStartDate(e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={batchEndDate}
                  onChange={(e) => setBatchEndDate(e.target.value)}
                />
                <Input
                  label="Exam Date (Optional)"
                  type="date"
                  value={batchExamDate}
                  onChange={(e) => setBatchExamDate(e.target.value)}
                />
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Gender Wing</label>
                  <select
                    value={batchGenderTrack}
                    onChange={(e) => setBatchGenderTrack(e.target.value as 'all' | 'male' | 'female')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    <option value="all">All / Combined</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Program Track</label>
                  <select
                    value={batchProgramTrack}
                    onChange={(e) => setBatchProgramTrack(e.target.value as 'other' | 'hifz' | 'najera')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    <option value="other">Auto / General</option>
                    <option value="hifz">Hifz</option>
                    <option value="najera">Najera</option>
                  </select>
                </div>
                <div className="md:col-span-5">
                  <Input
                    label="Milestone / Exam Note (Optional)"
                    placeholder="e.g. 1.5-Year Hifz Batch — Annual Exam & Revision"
                    value={batchMilestoneNote}
                    onChange={(e) => setBatchMilestoneNote(e.target.value)}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Batches & Assignments ({batches.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {lbt ? (
                <Skeleton className="h-24 m-4" />
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Batch Label</th>
                      <th>Mode</th>
                      <th>Course</th>
                      <th>Teacher</th>
                      <th>Zimmadar</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.id}>
                        <td className="font-mono text-xs">#{b.id}</td>
                        <td className="font-semibold text-heading">{b.label}</td>
                        <td>
                          <Badge variant={b.delivery_mode === 'one_to_one' ? 'secondary' : 'primary'}>
                            {b.delivery_mode}
                          </Badge>
                        </td>
                        <td className="text-xs">{b.course_title || `Course #${b.course_id}`}</td>
                        <td className="text-xs font-medium">{b.teacher_name || <span className="text-muted">—</span>}</td>
                        <td className="text-xs font-medium">{b.zimmadar_name || <span className="text-muted">—</span>}</td>
                        <td className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const plan = trackerPlans.find((p) => p.batch_id === b.id)
                              setAssignBatch(b)
                              setAssignTeacherId(b.teacher_id ? String(b.teacher_id) : '')
                              setAssignZimmadarId(b.zimmadar_id ? String(b.zimmadar_id) : '')
                              setAssignStartDate(plan?.start_date || b.start_date?.slice(0, 10) || '')
                              setAssignEndDate(plan?.end_date || b.end_date?.slice(0, 10) || '')
                              setAssignExamDate(plan?.exam_date || '')
                              setAssignGenderTrack(plan?.gender_track || 'all')
                              setAssignProgramTrack(plan?.program_track || 'other')
                              setAssignMilestoneNote(plan?.milestone_note || '')
                            }}
                          >
                            <UserCog className="w-3.5 h-3.5" /> Assign / Timeline
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: STAFF & USERS LIFECYCLE */}
      {tab === 'users' && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Onboard Staff / Academy User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                <Input
                  label="Full Name"
                  placeholder="Ustadh Ahmad Karim"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="ahmad@iomacademy.org"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Primary Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    {ALL_USER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Branch</label>
                  <select
                    disabled={newUserRole === 'central_admin'}
                    value={newUserRole === 'central_admin' ? '' : newUserBranchId || defaultBranchId}
                    onChange={(e) => setNewUserBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg disabled:opacity-50"
                  >
                    {newUserRole === 'central_admin' && <option value="">Central (All)</option>}
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Department (Opt.)</label>
                  <select
                    disabled={!['teacher', 'zimmadar', 'department_supervisor'].includes(newUserRole)}
                    value={newUserDeptId}
                    onChange={(e) => setNewUserDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg disabled:opacity-50"
                  >
                    <option value="">All / None</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-heading">Password (12+ chars)</label>
                    <button
                      type="button"
                      onClick={() => setNewUserPassword(generateStrongPassword())}
                      className="text-[10px] font-semibold text-primary-700 hover:underline"
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    minLength={12}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-border bg-bg"
                  />
                </div>
                <div className="md:col-span-3 lg:col-span-6 flex justify-end">
                  <Button type="submit" loading={saving}>
                    <Plus className="w-4 h-4" /> Create Staff / User Account
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {resetResult && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs">
                <p className="font-bold text-amber-900">
                  Password Reset Token Issued for {resetResult.userName} (valid 30 min)
                </p>
                <p className="font-mono text-amber-800 mt-1 break-all">{resetResult.token}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(resetResult.token)
                    setCopiedToken(true)
                    toast.success('Reset token copied')
                  }}
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />} Copy Token
                </Button>
                <button type="button" onClick={() => setResetResult(null)} className="text-amber-700 hover:text-amber-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3 w-full">
                <CardTitle>Staff & Academy Directory ({filteredUsers.length})</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="search"
                    placeholder="Search name or email…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border bg-bg"
                  />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-bg"
                  >
                    <option value="all">All Roles</option>
                    {ALL_USER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeInactive}
                      onChange={(e) => setIncludeInactive(e.target.checked)}
                    />
                    Show Inactive
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {lu ? (
                <Skeleton className="h-28 m-4" />
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Primary & Extra Roles</th>
                      <th>Branch</th>
                      <th>Status</th>
                      <th className="text-right">Super Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const active = Boolean(u.active)
                      return (
                        <tr key={u.id}>
                          <td className="font-mono text-xs">#{u.id}</td>
                          <td>
                            <p className="font-semibold text-heading">{u.name}</p>
                            <p className="text-xs text-muted">{u.email}</p>
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="primary">{u.role}</Badge>
                              {u.assigned_roles
                                ?.split(',')
                                .filter(Boolean)
                                .map((ar, idx) => (
                                  <Badge key={`${ar}-${idx}`} variant="secondary">
                                    +{ar}
                                  </Badge>
                                ))}
                            </div>
                          </td>
                          <td className="text-xs">{branchNameById(u.branch_id)}</td>
                          <td>
                            <Badge variant={active ? 'approved' : 'ended'}>{active ? 'active' : 'suspended'}</Badge>
                          </td>
                          <td>
                            <div className="flex justify-end gap-1.5">
                              {isCentral && !u.role.startsWith('guardian') && (
                                <Button size="sm" variant="outline" onClick={() => setRoleUser(u)}>
                                  <ShieldCheck className="w-3.5 h-3.5" /> Roles
                                </Button>
                              )}
                              {active && (
                                <Button size="sm" variant="outline" onClick={() => issueResetLink(u)}>
                                  <KeyRound className="w-3.5 h-3.5" /> Reset Link
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant={active ? 'outline' : 'primary'}
                                onClick={() => toggleUserStatus(u)}
                              >
                                <Power className="w-3.5 h-3.5" /> {active ? 'Suspend' : 'Activate'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 6: PERMISSION MATRIX (MENU VISIBILITY RULES + RBAC GOVERNANCE) */}
      {tab === 'permissions' && (
        <div className="space-y-5">
          {/* Card 1: Sidebar Page & Section Access Control (Teachers / Zimmadars / Supervisors / Branch Admins) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2 w-full">
                <div>
                  <CardTitle>Sidebar Menu &amp; Page Access Rules (Teachers &amp; Zimmadars)</CardTitle>
                  <p className="text-xs text-muted mt-0.5">
                    Toggle which sections &amp; modules Teachers, Zimmadars, Supervisors, and Branch Admins see in their navigation menu. Changes apply immediately.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNavRules(DEFAULT_NAV_VISIBILITY_RULES)
                    toast.success('Menu visibility rules reset to role defaults')
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Menu Defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="iom-table">
                <thead>
                  <tr>
                    <th>Section · Page</th>
                    {POLICY_ROLE_COLS.map((c) => (
                      <th key={c.key} className="text-center">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GROUP_ORDER.flatMap((groupKey) => {
                    const groupItems = NAV_ITEMS.filter(
                      (item) => item.group === groupKey && item.id !== 'guardian-home',
                    )
                    return groupItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <p className="font-semibold text-heading">{item.label}</p>
                          <p className="text-[11px] text-muted">{GROUP_META[groupKey].label} · {item.route}</p>
                        </td>
                        {POLICY_ROLE_COLS.map((col) => {
                          const visible = isNavVisibleForRole(item, col.key, navRules)
                          const locked = col.key === 'central_admin'
                          return (
                            <td key={col.key} className="text-center">
                              <button
                                type="button"
                                disabled={locked}
                                onClick={() => toggleMenuRule(item.id, col.key)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                                  visible
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                } ${locked ? 'opacity-75 cursor-not-allowed' : 'hover:ring-2 hover:ring-primary-200 cursor-pointer'}`}
                              >
                                {visible ? 'Visible' : 'Hidden'}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Card 2: Action & API Capability Policy Matrix */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2 w-full">
                <div>
                  <CardTitle>Capability &amp; Action Policy Matrix (RBAC Governance)</CardTitle>
                  <p className="text-xs text-muted mt-0.5">
                    Core API capabilities are enforced in backend policy; Operational Guardrails can be customized by Super Admin / Principal.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRbacPolicy(DEFAULT_RBAC_PERMISSIONS)
                    toast.success('Permissions reset to defaults')
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="iom-table">
                <thead>
                  <tr>
                    <th>Capability / Policy</th>
                    <th>Enforcement</th>
                    {POLICY_ROLE_COLS.map((c) => (
                      <th key={c.key} className="text-center">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rbacPolicy.map((perm) => (
                    <tr key={perm.id}>
                      <td>
                        <p className="font-semibold text-heading">{perm.label}</p>
                        <p className="text-[11px] text-muted">{perm.description}</p>
                      </td>
                      <td>
                        <Badge variant={perm.enforcedByBackend ? 'primary' : 'secondary'}>
                          {perm.enforcedByBackend ? 'Backend Locked' : 'UI Guardrail'}
                        </Badge>
                      </td>
                      {POLICY_ROLE_COLS.map((col) => {
                        const allowed = perm.roles[col.key]
                        const locked = perm.enforcedByBackend || col.key === 'central_admin'
                        return (
                          <td key={col.key} className="text-center">
                            <button
                              type="button"
                              disabled={locked}
                              onClick={() => togglePermissionCell(perm.id, col.key)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                                allowed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              } ${locked ? 'opacity-80 cursor-not-allowed' : 'hover:ring-2 hover:ring-primary-200 cursor-pointer'}`}
                            >
                              {allowed ? 'Allowed' : 'Denied'}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL: COURSE DATES */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-heading">Course Active Dates — {editingCourse.title}</h3>
              <button type="button" onClick={() => setEditingCourse(null)} className="text-muted hover:text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveCourseDates} className="space-y-3">
              <Input label="Start Date" type="date" value={courseStartDate} onChange={(e) => setCourseStartDate(e.target.value)} />
              <Input label="End Date" type="date" value={courseEndDate} onChange={(e) => setCourseEndDate(e.target.value)} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingCourse(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save Dates
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BATCH ASSIGNMENT + HISTORY */}
      {assignBatch && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-heading">Batch Staff Assignment — {assignBatch.label}</h3>
                <p className="text-xs text-muted">{assignBatch.course_title}</p>
              </div>
              <button type="button" onClick={() => setAssignBatch(null)} className="text-muted hover:text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitBatchAssignment} className="space-y-3 border-b border-border pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Teacher</label>
                  <select
                    value={assignTeacherId}
                    onChange={(e) => setAssignTeacherId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    <option value="">Unassigned</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Zimmadar</label>
                  <select
                    value={assignZimmadarId}
                    onChange={(e) => setAssignZimmadarId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    <option value="">Unassigned</option>
                    {zimmadars.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Input
                label="Assignment Reason"
                required
                value={assignReason}
                onChange={(e) => setAssignReason(e.target.value)}
              />
              <div className="pt-2 border-t border-border space-y-3">
                <p className="text-xs font-bold text-heading">Roadmap Timeline, Exam Date &amp; Track</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <Input
                    label="Start Date"
                    type="date"
                    value={assignStartDate}
                    onChange={(e) => setAssignStartDate(e.target.value)}
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={assignEndDate}
                    onChange={(e) => setAssignEndDate(e.target.value)}
                  />
                  <Input
                    label="Exam Date"
                    type="date"
                    value={assignExamDate}
                    onChange={(e) => setAssignExamDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-heading mb-1">Gender Wing</label>
                    <select
                      value={assignGenderTrack}
                      onChange={(e) => setAssignGenderTrack(e.target.value as 'all' | 'male' | 'female')}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                    >
                      <option value="all">All / Combined</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-heading mb-1">Program Track</label>
                    <select
                      value={assignProgramTrack}
                      onChange={(e) => setAssignProgramTrack(e.target.value as 'other' | 'hifz' | 'najera')}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                    >
                      <option value="other">Auto / General</option>
                      <option value="hifz">Hifz</option>
                      <option value="najera">Najera</option>
                    </select>
                  </div>
                </div>
                <Input
                  label="Milestone / Exam Note"
                  placeholder="e.g. Half-Yearly Exam on 2026-12-10"
                  value={assignMilestoneNote}
                  onChange={(e) => setAssignMilestoneNote(e.target.value)}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignUpdateScheduled}
                  onChange={(e) => setAssignUpdateScheduled(e.target.checked)}
                />
                Also reassign all upcoming scheduled classes in this batch
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAssignBatch(null)}>
                  Close
                </Button>
                <Button type="submit" loading={saving}>
                  Save Assignment
                </Button>
              </div>
            </form>

            <div>
              <p className="text-xs font-bold text-heading mb-2">Assignment History</p>
              {batchHistory.length === 0 ? (
                <p className="text-xs text-muted">No assignment history recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {batchHistory.map((h: any) => (
                    <div key={h.id} className="p-2.5 rounded-lg bg-bg border border-border text-xs">
                      <p className="font-semibold text-heading">
                        Teacher: {h.old_teacher || '—'} → {h.new_teacher || '—'} | Zimmadar: {h.old_zimmadar || '—'} →{' '}
                        {h.new_zimmadar || '—'}
                      </p>
                      <p className="text-muted mt-0.5">{h.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: USER MULTI-ROLE MANAGER (CENTRAL ADMIN) */}
      {roleUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-heading">Multi-Role Assignments — {roleUser.name}</h3>
                <p className="text-xs text-muted">
                  Base Role: {roleUser.role} · {branchNameById(roleUser.branch_id)}
                </p>
              </div>
              <button type="button" onClick={() => setRoleUser(null)} className="text-muted hover:text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={assignExtraRole} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border-b border-border pb-4">
              <div>
                <label className="block text-xs font-semibold text-heading mb-1">Add Role</label>
                <select
                  value={extraRole}
                  onChange={(e) => setExtraRole(e.target.value as PolicyRole)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-border bg-bg"
                >
                  {ASSIGNABLE_STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-heading mb-1">Branch</label>
                <select
                  disabled={extraRole === 'central_admin'}
                  value={extraRole === 'central_admin' ? '' : extraBranchId || String(roleUser.branch_id || defaultBranchId)}
                  onChange={(e) => setExtraBranchId(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-border bg-bg disabled:opacity-50"
                >
                  {extraRole === 'central_admin' && <option value="">Central</option>}
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-heading mb-1">Department</label>
                <select
                  disabled={extraRole === 'central_admin' || extraRole === 'branch_admin'}
                  value={extraDeptId}
                  onChange={(e) => setExtraDeptId(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-border bg-bg disabled:opacity-50"
                >
                  <option value="">All / None</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" size="sm" loading={saving}>
                <Plus className="w-3.5 h-3.5" /> Assign
              </Button>
            </form>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {userRoles.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No additional role assignments.</p>
              ) : (
                userRoles.map((ar) => (
                  <div key={ar.id} className="flex items-center justify-between p-2.5 rounded-lg bg-bg border border-border text-xs">
                    <div>
                      <span className="font-semibold text-heading">{ar.role}</span>{' '}
                      <span className="text-muted">
                        · {ar.branch_name || 'Global'} {ar.department_name ? `/ ${ar.department_name}` : ''}
                      </span>{' '}
                      <Badge variant={ar.active ? 'approved' : 'ended'}>{ar.active ? 'active' : 'revoked'}</Badge>
                    </div>
                    {Boolean(ar.active) && (
                      <Button size="sm" variant="outline" onClick={() => revokeExtraRole(ar.id)}>
                        Revoke
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
