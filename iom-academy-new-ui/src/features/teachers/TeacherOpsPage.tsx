import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toArray, type ClassSession, type CurrentUser } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton, AvatarInitials } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { navigateTo } from '@/lib/router'
import { getDhakaDateString, formatDhakaDateTime, cn } from '@/lib/utils'
import {
  TEACHER_LEAVES_KEY,
  type TeacherLeaveRecord,
  useLocalStore,
  STAFF_MEMBERS_KEY,
  DEFAULT_STAFF_MEMBERS,
  type AcademyStaffMember,
} from '@/lib/superAdminStore'
import {
  UserCheck, Clock, AlertTriangle, FileCheck2, CalendarOff,
  CheckCircle, XCircle, RefreshCw, Plus, Users, Search,
  Briefcase, Phone, Mail, Award, Edit3, X, Check,
  Shield, Key, Copy, MessageSquare, CheckSquare, Layers,
} from 'lucide-react'

type TeacherTab = 'roster' | 'assign' | 'zimmadar' | 'scorecard' | 'leaves' | 'reports'

interface UserMini {
  id: number
  name: string
  email: string
  role: string
  active?: number | boolean
  assigned_roles?: string | null
}

interface BatchMini {
  id: number
  label: string
  course_id?: number
  course_title?: string
  department?: string
  department_id?: number
  teacher_id?: number | null
  teacher_name?: string | null
  zimmadar_id?: number | null
  zimmadar_name?: string | null
  delivery_mode?: string
}

interface EnrollmentMini {
  id: number
  batch_id: number
  status: string
}

interface ExtendedClassSession extends ClassSession {
  teacher_id?: number | null
  actual_teacher_id?: number | null
  teacher_name?: string | null
  schedule_revision?: number
}

interface ReportMonitorRow {
  class_id: number
  batch_name: string
  course_title: string
  teacher_id?: number | null
  actual_teacher_id?: number | null
  actual_start: string
  actual_end: string
  due_at: string
  obligation_status: string
  overdue: boolean
}

interface ReportAlertRow {
  id: number
  class_id: number
  batch_name: string
  stage: string
  scheduled_at: string
  delivery_status: string
}

const AVAILABLE_ACADEMY_BATCHES = [
  'Hifz-A (হিফজ বালক শাখা)',
  'Hifz-B (হিফজ বালিকা শাখা)',
  'নাজেরা ও কায়দা (তাজবীদ ব্যাচ ১)',
  'নাজেরা সান্ধ্যকালীন শিফট',
  'তাজবীদ স্পেশাল ব্যাচ',
  'হিফজ রিভিশন ও দৌর ব্যাচ',
]

const AVAILABLE_DEPARTMENTS = [
  'হিফজুল কুরআন বিভাগ',
  'নাজেরা ও কায়দা বিভাগ',
  'তাজবীদুল কুরআন',
  'ইসলামিক স্টাডিজ ও ভাষা',
]

export default function TeacherOpsPage({ user }: { user: CurrentUser }) {
  const canManage = ['central_admin', 'branch_admin', 'zimmadar', 'department_supervisor'].includes(user.role)
  const isCentral = user.role === 'central_admin'
  const [tab, setTab] = useState<TeacherTab>('roster')
  const qc = useQueryClient()
  const toast = useToast()

  // Staff & Zimmadar Duty Management
  const [staffMembers, setStaffMembers] = useLocalStore<AcademyStaffMember[]>(
    STAFF_MEMBERS_KEY,
    DEFAULT_STAFF_MEMBERS,
  )
  const [rosterSearch, setRosterSearch] = useState('')
  const [rosterRoleFilter, setRosterRoleFilter] = useState<'all' | 'zimmadar' | 'teacher' | 'supervisor'>('all')
  const [rosterDeptFilter, setRosterDeptFilter] = useState<string>('all')

  // Modals for adding & editing duties
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<AcademyStaffMember | null>(null)
  const [dutyAssignStaff, setDutyAssignStaff] = useState<AcademyStaffMember | null>(null)

  // Add/Edit staff form states
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState<'zimmadar' | 'teacher' | 'supervisor' | 'examiner'>('teacher')
  const [formDesignation, setFormDesignation] = useState('')
  const [formDepartment, setFormDepartment] = useState('হিফজুল কুরআন বিভাগ')
  const [formBatches, setFormBatches] = useState<string[]>([])
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formSanad, setFormSanad] = useState('')
  const [formShift, setFormShift] = useState('সকাল শিফট (৬:০০ - ৮:৩০)')
  const [formWeeklyHours, setFormWeeklyHours] = useState(20)
  const [formResponsibilities, setFormResponsibilities] = useState('')
  const [formPassword, setFormPassword] = useState('Itqaan@Ustadh2026')
  const [createdStaffCredential, setCreatedStaffCredential] = useState<{
    name: string
    role: string
    email: string
    password: string
    phone: string
    batches: string[]
    department: string
    loginUrl: string
  } | null>(null)

  // Batch Assignment Hub states
  const [assignDeptFilter, setAssignDeptFilter] = useState<string>('all')
  const [showAssignBatchModal, setShowAssignBatchModal] = useState(false)
  const [selectedBatchToAssign, setSelectedBatchToAssign] = useState<BatchMini | null>(null)
  const [assignBatchTeacherId, setAssignBatchTeacherId] = useState<string>('')
  const [assignBatchZimmadarId, setAssignBatchZimmadarId] = useState<string>('')
  const [assignBatchDeliveryMode, setAssignBatchDeliveryMode] = useState<'group' | 'one_to_one'>('group')
  const [assignBatchSaving, setAssignBatchSaving] = useState(false)

  // Zimmadar Operational Desk states
  const [zimmadarChecklist, setZimmadarChecklist] = useState<Record<string, boolean>>({
    'sabaq-audit': true,
    'absent-followup': false,
    'substitute-check': true,
    'tickets-review': false,
    'star-student': true,
  })

  // Duty assignment modal states
  const [dutyBatches, setDutyBatches] = useState<string[]>([])
  const [dutyResponsibilities, setDutyResponsibilities] = useState<string>('')
  const [dutyShift, setDutyShift] = useState('')
  const [dutyHours, setDutyHours] = useState(20)
  const [dutyStatus, setDutyStatus] = useState<'active' | 'on_leave' | 'part_time'>('active')

  function generateStaffPassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$'
    let pwd = 'Itqaan@'
    for (let i = 0; i < 7; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormPassword(pwd)
  }

  function openAddModal() {
    setFormName('')
    setFormRole('teacher')
    setFormDesignation('')
    setFormDepartment('হিফজুল কুরআন বিভাগ')
    setFormBatches(['Hifz-A (হিফজ বালক শাখা)'])
    setFormPhone('+880 17')
    setFormEmail('')
    generateStaffPassword()
    setFormSanad('')
    setFormShift('সকাল শিফট (৬:০০ - ৮:৩০)')
    setFormWeeklyHours(20)
    setFormResponsibilities('দৈনিক সবক ও আমোক্তা পাঠদান\nডিজিটাল লগবুক ও পয়েন্ট সংরক্ষণ')
    setEditingStaff(null)
    setShowAddStaffModal(true)
  }

  function openEditModal(staff: AcademyStaffMember) {
    setEditingStaff(staff)
    setFormName(staff.name)
    setFormRole(staff.role)
    setFormDesignation(staff.designation)
    setFormDepartment(staff.department)
    setFormBatches([...staff.assignedBatches])
    setFormPhone(staff.phone)
    setFormEmail(staff.email)
    setFormSanad(staff.sanad)
    setFormShift(staff.shift)
    setFormWeeklyHours(staff.weeklyHours)
    setFormResponsibilities(staff.responsibilities.join('\n'))
    setShowAddStaffModal(true)
  }

  async function handleSaveStaff(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim() || !formDesignation.trim()) {
      toast.warning('শিক্ষকের নাম এবং পদবী আবশ্যক')
      return
    }
    const respList = formResponsibilities
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean)

    if (editingStaff) {
      setStaffMembers((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? {
                ...s,
                name: formName.trim(),
                role: formRole,
                designation: formDesignation.trim(),
                department: formDepartment,
                assignedBatches: formBatches,
                phone: formPhone.trim(),
                email: formEmail.trim(),
                sanad: formSanad.trim(),
                shift: formShift.trim(),
                weeklyHours: Number(formWeeklyHours) || 20,
                responsibilities: respList,
              }
            : s,
        ),
      )
      toast.success(`মাশাআল্লাহ! ${formName}-এর তথ্য সফলভাবে আপডেট করা হয়েছে`)
    } else {
      // Backend User Creation
      if (formEmail.trim()) {
        try {
          await api.post('/users', {
            name: formName.trim(),
            email: formEmail.trim().toLowerCase(),
            role: formRole === 'examiner' ? 'teacher' : formRole,
            branch_id: 1,
            password: formPassword || 'Itqaan@Ustadh2026',
          })
          qc.invalidateQueries({ queryKey: ['teachers-users'] })
        } catch (err) {
          console.warn('Backend staff user creation note:', err)
        }
      }

      const newStaff: AcademyStaffMember = {
        id: Date.now(),
        name: formName.trim(),
        role: formRole,
        designation: formDesignation.trim(),
        department: formDepartment,
        assignedBatches: formBatches,
        phone: formPhone.trim(),
        email: formEmail.trim(),
        sanad: formSanad.trim(),
        shift: formShift.trim(),
        weeklyHours: Number(formWeeklyHours) || 20,
        status: 'active',
        responsibilities: respList,
        joinedDate: new Date().toLocaleDateString('bn-BD'),
      }
      setStaffMembers((prev) => [newStaff, ...prev])

      // Open Credential confirmation modal
      setCreatedStaffCredential({
        name: formName.trim(),
        role: formRole === 'zimmadar' ? 'যিম্মাদার (Zimmadar)' : formRole === 'supervisor' ? 'মুসাহহিহ (Supervisor)' : 'উস্তাদ / শিক্ষক (Teacher)',
        email: formEmail.trim().toLowerCase() || 'staff@iom-academy.com',
        password: formPassword,
        phone: formPhone.trim(),
        batches: formBatches,
        department: formDepartment,
        loginUrl: `${window.location.origin}/#/login`,
      })

      toast.success(`মাশাআল্লাহ! নতুন শিক্ষক/জিম্মাদার ${formName} সফলভাবে যুক্ত হয়েছেন`)
    }
    setShowAddStaffModal(false)
  }

  function openAssignBatchModal(b: BatchMini) {
    setSelectedBatchToAssign(b)
    setAssignBatchTeacherId(b.teacher_id ? String(b.teacher_id) : '')
    setAssignBatchZimmadarId(b.zimmadar_id ? String(b.zimmadar_id) : '')
    setAssignBatchDeliveryMode(b.delivery_mode === 'one_to_one' ? 'one_to_one' : 'group')
    setShowAssignBatchModal(true)
  }

  async function handleSaveBatchAssignment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBatchToAssign) return
    setAssignBatchSaving(true)
    try {
      await api.patch(`/batches/${selectedBatchToAssign.id}`, {
        teacher_id: assignBatchTeacherId ? Number(assignBatchTeacherId) : null,
        zimmadar_id: assignBatchZimmadarId ? Number(assignBatchZimmadarId) : null,
        delivery_mode: assignBatchDeliveryMode,
      })
      qc.invalidateQueries({ queryKey: ['teachers-batches'] })

      const teacherName = teacherList.find((t) => t.id === Number(assignBatchTeacherId))?.name || ''
      const zimmadarName = staffMembers.find((s) => s.id === Number(assignBatchZimmadarId))?.name || ''

      setStaffMembers((prev) =>
        prev.map((s) => {
          const matchesTeacher = s.id === Number(assignBatchTeacherId) || s.name === teacherName
          const matchesZimmadar = s.id === Number(assignBatchZimmadarId) || s.name === zimmadarName
          if (matchesTeacher || matchesZimmadar) {
            const exists = s.assignedBatches.includes(selectedBatchToAssign.label)
            return exists ? s : { ...s, assignedBatches: [...s.assignedBatches, selectedBatchToAssign.label] }
          }
          return s
        }),
      )

      toast.success(`মাশাআল্লাহ! "${selectedBatchToAssign.label}" ব্যাচে শিক্ষক ও জিম্মাদার সফলভাবে আপডেট করা হয়েছে`)
      setShowAssignBatchModal(false)
    } catch (err) {
      toast.error(err, 'ব্যাচ অ্যাসাইনমেন্ট ব্যর্থ হয়েছে')
    } finally {
      setAssignBatchSaving(false)
    }
  }

  function openDutyModal(staff: AcademyStaffMember) {
    setDutyAssignStaff(staff)
    setDutyBatches([...staff.assignedBatches])
    setDutyResponsibilities(staff.responsibilities.join('\n'))
    setDutyShift(staff.shift)
    setDutyHours(staff.weeklyHours)
    setDutyStatus(staff.status)
  }

  function handleSaveDuties(e: React.FormEvent) {
    e.preventDefault()
    if (!dutyAssignStaff) return
    const respList = dutyResponsibilities
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean)

    setStaffMembers((prev) =>
      prev.map((s) =>
        s.id === dutyAssignStaff.id
          ? {
              ...s,
              assignedBatches: dutyBatches,
              responsibilities: respList,
              shift: dutyShift,
              weeklyHours: dutyHours,
              status: dutyStatus,
            }
          : s,
      ),
    )
    toast.success(`${dutyAssignStaff.name}-এর দায়িত্ব ও ব্যাচ সফলভাবে বণ্টন করা হয়েছে`)
    setDutyAssignStaff(null)
  }

  const filteredStaff = useMemo(() => {
    return staffMembers.filter((s) => {
      const q = rosterSearch.toLowerCase()
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.assignedBatches.some((b) => b.toLowerCase().includes(q))
      const matchRole = rosterRoleFilter === 'all' || s.role === rosterRoleFilter
      const matchDept = rosterDeptFilter === 'all' || s.department === rosterDeptFilter
      return matchSearch && matchRole && matchDept
    })
  }, [staffMembers, rosterSearch, rosterRoleFilter, rosterDeptFilter])

  const { data: users = [], isLoading: lu } = useQuery<UserMini[]>({
    queryKey: ['teachers-users'],
    queryFn: () => api.get<UserMini[] | { items?: UserMini[] }>('/users').then(toArray).catch(() => []),
    enabled: canManage,
  })
  const { data: batches = [] } = useQuery<BatchMini[]>({
    queryKey: ['teachers-batches'],
    queryFn: () => api.get<BatchMini[] | { items?: BatchMini[] }>('/batches').then(toArray).catch(() => []),
  })
  const { data: enrollments = [] } = useQuery<EnrollmentMini[]>({
    queryKey: ['teachers-enrollments'],
    queryFn: () =>
      api.get<EnrollmentMini[] | { items?: EnrollmentMini[] }>('/enrollments?limit=500').then(toArray).catch(() => []),
  })
  const { data: classes = [], isLoading: lc } = useQuery<ExtendedClassSession[]>({
    queryKey: ['teachers-classes'],
    queryFn: () =>
      api.get<ExtendedClassSession[] | { items?: ExtendedClassSession[] }>('/classes?limit=500').then(toArray).catch(() => []),
  })
  const { data: reportMonitor = [], isLoading: lr } = useQuery<ReportMonitorRow[]>({
    queryKey: ['report-monitor'],
    queryFn: () =>
      api.get<ReportMonitorRow[] | { items?: ReportMonitorRow[] }>('/report-monitor').then(toArray).catch(() => []),
  })
  const { data: reportAlerts = [] } = useQuery<ReportAlertRow[]>({
    queryKey: ['report-alerts'],
    queryFn: () =>
      api.get<ReportAlertRow[] | { items?: ReportAlertRow[] }>('/report-alerts').then(toArray).catch(() => []),
  })

  // Teacher leave queue (stored cleanly across tabs)
  const [teacherLeaves, setTeacherLeaves] = useLocalStore<TeacherLeaveRecord[]>(TEACHER_LEAVES_KEY, [])
  const [leaveTeacherId, setLeaveTeacherId] = useState(() => String(user.id))
  const [leaveStart, setLeaveStart] = useState(() => getDhakaDateString())
  const [leaveEnd, setLeaveEnd] = useState(() => getDhakaDateString())
  const [leaveReason, setLeaveReason] = useState('')
  const [leavePrefSubId, setLeavePrefSubId] = useState('')

  // Real Backend Class Substitute assignment state
  const [proxyFilterTeacherId, setProxyFilterTeacherId] = useState<string>('')
  const [proxySubByClass, setProxySubByClass] = useState<Record<number, string>>({})
  const [proxyReasonByClass, setProxyReasonByClass] = useState<Record<number, string>>({})
  const [savingClassId, setSavingClassId] = useState<number | null>(null)
  const [runningAlerts, setRunningAlerts] = useState(false)

  const teacherList = useMemo(() => {
    const map = new Map<number, { id: number; name: string; email: string }>()
    for (const u of users) {
      if (u.role === 'teacher' || (u.assigned_roles || '').includes('teacher')) {
        map.set(u.id, { id: u.id, name: u.name, email: u.email })
      }
    }
    if (!canManage || map.size === 0) {
      for (const b of batches) {
        if (b.teacher_id) {
          map.set(b.teacher_id, {
            id: b.teacher_id,
            name: b.teacher_name || `Teacher #${b.teacher_id}`,
            email: '',
          })
        }
      }
      if (user.role === 'teacher' && !map.has(user.id)) {
        map.set(user.id, { id: user.id, name: user.name, email: user.email })
      }
    }
    return Array.from(map.values())
  }, [users, batches, canManage, user])

  const batchTeacherLookup = useMemo(() => {
    const m = new Map<number, number>()
    for (const b of batches) {
      if (b.teacher_id) m.set(b.id, b.teacher_id)
    }
    return m
  }, [batches])

  const scorecardRows = useMemo(() => {
    const nowMs = Date.now()
    return teacherList.map((t) => {
      const assignedBatches = batches.filter((b) => b.teacher_id === t.id)
      const batchIds = new Set(assignedBatches.map((b) => b.id))
      const activeStudents = enrollments.filter((e) => batchIds.has(e.batch_id) && ['active', 'enrolled'].includes(e.status)).length

      const tClasses = classes.filter((c) => {
        const effTeacher = c.actual_teacher_id || c.teacher_id || batchTeacherLookup.get(c.batch_id)
        return effTeacher === t.id
      })

      let ended = 0
      let live = 0
      let onTime = 0
      let late = 0
      let unstartedPastDue = 0
      let totalMinutes = 0

      for (const c of tClasses) {
        if (c.status === 'in_progress') live += 1
        if (c.status === 'ended') {
          ended += 1
          if (c.actual_start && c.actual_end) {
            totalMinutes += Math.max(0, Math.round((new Date(c.actual_end).getTime() - new Date(c.actual_start).getTime()) / 60000))
          }
        }
        if (c.actual_start && c.scheduled_start) {
          const delayMin = (new Date(c.actual_start).getTime() - new Date(c.scheduled_start).getTime()) / 60000
          if (delayMin <= 5) onTime += 1
          else late += 1
        } else if (c.status === 'scheduled' && new Date(c.scheduled_start).getTime() + 15 * 60000 < nowMs) {
          unstartedPastDue += 1
        }
      }

      const checkedStarts = onTime + late
      const punctualityPct = checkedStarts > 0 ? Math.round((onTime / checkedStarts) * 100) : null
      const tReports = reportMonitor.filter((r) => (r.actual_teacher_id || r.teacher_id) === t.id)
      const overdueReports = tReports.filter((r) => r.overdue).length

      return {
        ...t,
        batchCount: assignedBatches.length,
        activeStudents,
        totalClasses: tClasses.length,
        ended,
        live,
        onTime,
        late,
        unstartedPastDue,
        punctualityPct,
        totalMinutes,
        overdueReports,
      }
    })
  }, [teacherList, batches, enrollments, classes, batchTeacherLookup, reportMonitor])

  const overallPunctuality = useMemo(() => {
    const totals = scorecardRows.reduce(
      (acc, r) => ({ on: acc.on + r.onTime, total: acc.total + r.onTime + r.late }),
      { on: 0, total: 0 },
    )
    return totals.total > 0 ? Math.round((totals.on / totals.total) * 100) : 100
  }, [scorecardRows])

  const overdueReportCount = reportMonitor.filter((r) => r.overdue).length
  const pendingLeavesCount = teacherLeaves.filter((l) => l.status === 'pending').length

  const upcomingScheduled = useMemo(() => {
    const today = getDhakaDateString()
    return classes
      .filter((c) => c.status === 'scheduled' && c.scheduled_start.slice(0, 10) >= today)
      .filter((c) => {
        if (!proxyFilterTeacherId) return true
        const eff = c.actual_teacher_id || c.teacher_id || batchTeacherLookup.get(c.batch_id)
        return String(eff || '') === proxyFilterTeacherId
      })
      .slice(0, 20)
  }, [classes, proxyFilterTeacherId, batchTeacherLookup])

  function submitTeacherLeave(e: React.FormEvent) {
    e.preventDefault()
    if (!leaveReason.trim()) return
    const targetId = canManage ? Number(leaveTeacherId || teacherList[0]?.id || user.id) : user.id
    const targetName = teacherList.find((t) => t.id === targetId)?.name || user.name
    const subId = leavePrefSubId ? Number(leavePrefSubId) : null
    const subName = subId ? teacherList.find((t) => t.id === subId)?.name : undefined

    const record: TeacherLeaveRecord = {
      id: `tl-${Date.now()}`,
      teacher_id: targetId,
      teacher_name: targetName,
      start_date: leaveStart,
      end_date: leaveEnd,
      reason: leaveReason.trim(),
      status: 'pending',
      substitute_teacher_id: subId,
      substitute_teacher_name: subName,
      created_at: new Date().toISOString(),
    }
    setTeacherLeaves((prev) => [record, ...prev])
    setLeaveReason('')
    toast.success('Teacher leave request submitted')
  }

  function decideTeacherLeave(id: string, decision: 'approved' | 'rejected') {
    setTeacherLeaves((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status: decision,
              reviewed_by: user.name,
              reviewed_at: new Date().toISOString(),
            }
          : l,
      ),
    )
    toast.success(`Teacher leave ${decision}`)
  }

  async function assignClassSubstitute(cls: ExtendedClassSession) {
    const subId = Number(proxySubByClass[cls.id] || '')
    const reason = (proxyReasonByClass[cls.id] || 'Teacher on approved leave (Principal/Zimmadar proxy)').trim()
    if (!subId) {
      toast.error(new Error('Please select a substitute teacher first'))
      return
    }
    setSavingClassId(cls.id)
    try {
      await api.post(`/classes/${cls.id}/substitute`, {
        teacher_id: subId,
        expected_start: cls.scheduled_start,
        expected_revision: cls.schedule_revision ?? 0,
        reason,
      })
      toast.success(`Substitute teacher assigned to Class #${cls.id}`)
      qc.invalidateQueries({ queryKey: ['teachers-classes'] })
      qc.invalidateQueries({ queryKey: ['classes'] })
    } catch (err) {
      toast.error(err, 'Failed to assign substitute teacher')
    } finally {
      setSavingClassId(null)
    }
  }

  async function checkAlertsNow() {
    setRunningAlerts(true)
    try {
      const res = await api.post<{ logged_events: unknown[] }>('/report-alerts/check-now', {})
      toast.success(`Alert check completed (${res.logged_events?.length ?? 0} new alerts queued)`)
      qc.invalidateQueries({ queryKey: ['report-alerts'] })
      qc.invalidateQueries({ queryKey: ['report-monitor'] })
    } catch (err) {
      toast.error(err, 'Failed to run report alert check')
    } finally {
      setRunningAlerts(false)
    }
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary-700" /> Teacher HR, Leave/Proxy & Report SLA Monitor
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Track online class punctuality, approve teacher leaves, assign real substitute teachers, and monitor post-class report deadlines.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigateTo('#/payables')}>
          Open Teacher Payables →
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted">Active Teachers</span>
            <Users className="w-4 h-4 text-primary-700" />
          </div>
          <p className="text-2xl font-bold text-heading mt-1">{scorecardRows.length}</p>
          <p className="text-xs text-muted mt-0.5">{batches.length} total academy batches</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted">On-Time Join Rate</span>
            <Clock className="w-4 h-4 text-teal-700" />
          </div>
          <p className="text-2xl font-bold text-teal-700 mt-1">{overallPunctuality}%</p>
          <p className="text-xs text-muted mt-0.5">Started within 5 min of schedule</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted">Pending Teacher Leaves</span>
            <CalendarOff className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-heading mt-1">{pendingLeavesCount}</p>
          <p className="text-xs text-muted mt-0.5">{teacherLeaves.length} total leave records</p>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted">Overdue Class Reports</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className={`text-2xl font-bold mt-1 ${overdueReportCount > 0 ? 'text-rose-600' : 'text-heading'}`}>
            {overdueReportCount}
          </p>
          <p className="text-xs text-muted mt-0.5">{reportAlerts.length} SLA alert events logged</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setTab('roster')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'roster' ? 'bg-emerald-academy text-white shadow-xs' : 'bg-surface border border-border text-body hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> 👨‍🏫 শিক্ষক ও স্টাফ প্রোফাইল ({staffMembers.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('assign')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'assign' ? 'bg-emerald-academy text-white shadow-xs' : 'bg-surface border border-border text-body hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> 📋 ক্লাস, ব্যাচ ও বিভাগ দায়িত্ব বণ্টন ({batches.length})
        </button>

        <button
          type="button"
          onClick={() => setTab('zimmadar')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'zimmadar' ? 'bg-emerald-academy text-white shadow-xs' : 'bg-surface border border-border text-body hover:bg-slate-50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> 🛡️ জিম্মাদার কর্মশালা ও দায়িত্ব মনিটর
        </button>

        <button
          type="button"
          onClick={() => setTab('scorecard')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'scorecard' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> পারফরম্যান্স স্কোরকার্ড
        </button>

        <button
          type="button"
          onClick={() => setTab('leaves')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'leaves' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body hover:bg-slate-50'
          }`}
        >
          <CalendarOff className="w-3.5 h-3.5" /> শিক্ষক ছুটি ও বদলি ({pendingLeavesCount})
        </button>

        <button
          type="button"
          onClick={() => setTab('reports')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'reports' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body hover:bg-slate-50'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" /> ক্লাস রিপোর্ট SLA ({overdueReportCount})
        </button>
      </div>

      {/* TAB 0: TEACHER & ZIMMADAR ROSTER & DUTY MANAGEMENT */}
      {tab === 'roster' && (
        <div className="space-y-4">
          {/* Roster Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-surface rounded-2xl border border-border shadow-3xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-[240px] flex-1 max-w-md">
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="উস্তাদের নাম, পদবী বা বিভাগ দিয়ে খুঁজুন..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                />
              </div>

              {/* Role filter */}
              <select
                value={rosterRoleFilter}
                onChange={(e) => setRosterRoleFilter(e.target.value as any)}
                className="text-xs px-3 py-2 rounded-xl border border-border bg-slate-50 font-semibold cursor-pointer outline-none"
              >
                <option value="all">সকল ভূমিকা (All Roles)</option>
                <option value="zimmadar">🏛️ বিভাগীয় জিম্মাদার</option>
                <option value="teacher">👳‍♂️ ক্লাস উস্তাদ / শিক্ষক</option>
                <option value="supervisor">🔍 পরীক্ষক ও মুসাহহিহ</option>
              </select>

              {/* Department filter */}
              <select
                value={rosterDeptFilter}
                onChange={(e) => setRosterDeptFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-border bg-slate-50 font-semibold cursor-pointer outline-none"
              >
                <option value="all">সকল বিভাগ (All Depts)</option>
                {AVAILABLE_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Add Teacher/Zimmadar Action */}
            {canManage && (
              <Button
                type="button"
                onClick={openAddModal}
                className="bg-emerald-academy hover:bg-emerald-academy-dark text-white text-xs font-bold rounded-xl px-4 py-2.5 cursor-pointer gap-2 shadow-xs shrink-0 flex items-center"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>+ নতুন শিক্ষক / জিম্মাদার যোগ করুন</span>
              </Button>
            )}
          </div>

          {/* Roster Grid */}
          {filteredStaff.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-2xl border border-border">
              <Users className="w-10 h-10 text-muted mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold text-heading">কোনো শিক্ষক পাওয়া যায়নি</p>
              <p className="text-xs text-muted mt-1">অনুগ্রহ করে সার্চ বা ফিল্টারের মান পরিবর্তন করুন</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((staff) => {
                const isZimmadar = staff.role === 'zimmadar'
                const isSupervisor = staff.role === 'supervisor'

                return (
                  <div
                    key={staff.id}
                    className="bg-surface rounded-2xl border border-border p-5 shadow-3xs hover:border-emerald-500/40 hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top identity bar */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-3xs',
                            isZimmadar
                              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                              : isSupervisor
                                ? 'bg-amber-900 text-amber-100 border-amber-700'
                                : 'bg-emerald-academy text-white border-emerald-950',
                          )}>
                            {staff.name.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-slate-900 truncate" title={staff.name}>
                              {staff.name}
                            </h3>
                            <p className="text-xs text-emerald-800 font-semibold truncate" title={staff.designation}>
                              {staff.designation}
                            </p>
                          </div>
                        </div>

                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border',
                          isZimmadar
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isSupervisor
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-sky-50 text-sky-800 border-sky-300',
                        )}>
                          {isZimmadar ? '🏛️ জিম্মাদার' : isSupervisor ? '🔍 মুসাহহিহ' : '👳‍♂️ শিক্ষক'}
                        </span>
                      </div>

                      {/* Department & Shift */}
                      <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">বিভাগ:</span>
                          <strong className="text-slate-800">{staff.department}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">ক্লাসের শিফট:</span>
                          <span className="font-semibold text-slate-700">{staff.shift}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">সাপ্তাহিক কর্মঘণ্টা:</span>
                          <span className="font-mono font-bold text-emerald-800">{staff.weeklyHours} ঘণ্টা/সপ্তাহ</span>
                        </div>
                      </div>

                      {/* Assigned Batches */}
                      <div className="mb-3">
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">
                          📚 দায়িত্বপ্রাপ্ত ব্যাচসমূহ:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {staff.assignedBatches.map((batch) => (
                            <span
                              key={batch}
                              className="text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg px-2 py-0.5"
                            >
                              {batch}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Assigned Responsibilities */}
                      <div className="mb-3">
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">
                          📋 দায়িত্ব ও করণীয়:
                        </span>
                        <ul className="text-xs text-slate-700 space-y-1 list-none pl-0">
                          {staff.responsibilities.map((resp, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px]">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Sanad / Qualifications */}
                      {staff.sanad && (
                        <div className="text-[11px] text-slate-600 bg-amber-50/60 border border-amber-200/70 p-2 rounded-xl mb-3 flex items-start gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span className="italic">{staff.sanad}</span>
                        </div>
                      )}
                    </div>

                    {/* Contact & Actions footer */}
                    <div className="pt-3 border-t border-slate-200/90 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <a
                          href={`tel:${staff.phone}`}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
                          title={`কল করুন: ${staff.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`mailto:${staff.email}`}
                          className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200"
                          title={`ইমেইল পাঠান: ${staff.email}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDutyModal(staff)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="ব্যাচ ও দায়িত্ব বণ্টন করুন"
                          >
                            দায়িত্ব বণ্টন
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(staff)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="প্রোফাইল সম্পাদন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Modal: Add or Edit Staff Member */}
          {showAddStaffModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-3 overflow-y-auto">
              <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-xl w-full p-5 space-y-4 my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-heading">
                        {editingStaff ? 'শিক্ষক / জিম্মাদারের তথ্য সম্পাদন' : 'নতুন শিক্ষক / জিম্মাদার যোগ করুন'}
                      </h3>
                      <p className="text-[11px] text-muted">একাডেমির শিক্ষক প্যানেল ও দায়িত্ব নির্ধারণ</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="p-1.5 text-muted hover:text-heading hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">শিক্ষকের পুরো নাম *</label>
                      <input
                        type="text"
                        placeholder="যেমন: মুফতী মাওলানা আবু বকর সিদ্দিক"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ভূমিকা (Role) *</label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-slate-50 cursor-pointer"
                      >
                        <option value="zimmadar">🏛️ কোর্স ও বিভাগীয় জিম্মাদার</option>
                        <option value="teacher">👳‍♂️ সিনিয়র ক্লাস উস্তাদ</option>
                        <option value="supervisor">🔍 প্রধান পরীক্ষক / মুসাহহিহ</option>
                        <option value="examiner">📋 সহকারী প্রশিক্ষক</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">অফিশিয়াল পদবী *</label>
                      <input
                        type="text"
                        placeholder="যেমন: হিফজুল কুরআন বিভাগীয় জিম্মাদার ও কোর্স প্রধান"
                        value={formDesignation}
                        onChange={(e) => setFormDesignation(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">বিভাগ *</label>
                      <select
                        value={formDepartment}
                        onChange={(e) => setFormDepartment(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-slate-50 cursor-pointer"
                      >
                        {AVAILABLE_DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Batches Checkboxes */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">দায়িত্বপ্রাপ্ত ব্যাচসমূহ নির্বাচন করুন:</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {AVAILABLE_ACADEMY_BATCHES.map((b) => {
                        const checked = formBatches.includes(b)
                        return (
                          <label key={b} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-800">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) setFormBatches((prev) => [...prev, b])
                                else setFormBatches((prev) => prev.filter((x) => x !== b))
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>{b}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ফোন / হোয়াটসঅ্যাপ নম্বর</label>
                      <input
                        type="text"
                        placeholder="+880 1711-XXXXXX"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">অফিশিয়াল ইমেইল</label>
                      <input
                        type="email"
                        placeholder="teacher@iom-academy.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {!editingStaff && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-slate-700">লগইন পাসওয়ার্ড (লগইন ক্রেডেনশিয়াল) *</label>
                        <button
                          type="button"
                          onClick={generateStaffPassword}
                          className="text-[11px] text-emerald-700 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> পাসওয়ার্ড জেনারেট করুন
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white font-mono font-bold text-emerald-900"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ক্লাসের শিফট ও সময়</label>
                      <input
                        type="text"
                        placeholder="যেমন: সকাল শিফট (৬:০০ - ৮:৩০)"
                        value={formShift}
                        onChange={(e) => setFormShift(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">সাপ্তাহিক কর্মঘণ্টা</label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={formWeeklyHours}
                        onChange={(e) => setFormWeeklyHours(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">শিক্ষাগত সনদ / খেতাব</label>
                    <input
                      type="text"
                      placeholder="যেমন: দাওরায়ে হাদিস (দারুল উলুম দেওবন্দ), হাফেজে কুরআন"
                      value={formSanad}
                      onChange={(e) => setFormSanad(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">দায়িত্ব ও করণীয় (প্রতি লাইনে একটি দায়িত্ব লিখুন)</label>
                    <textarea
                      rows={3}
                      value={formResponsibilities}
                      onChange={(e) => setFormResponsibilities(e.target.value)}
                      placeholder="দৈনিক সবক ও আমোক্তা পাঠদান&#10;ডিজিটাল লগবুক ও পয়েন্ট সংরক্ষণ&#10;অভিভাবক কোয়ারি ও কাউন্সেলিং"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setShowAddStaffModal(false)} className="rounded-xl text-xs cursor-pointer">
                      বাতিল
                    </Button>
                    <Button type="submit" className="bg-emerald-academy hover:bg-emerald-academy-dark text-white rounded-xl text-xs font-bold px-4 py-2 cursor-pointer shadow-xs">
                      {editingStaff ? 'আপডেট সংরক্ষণ করুন' : 'শিক্ষক যুক্ত করুন'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Duty & Batch Assignment */}
          {dutyAssignStaff && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-3 overflow-y-auto">
              <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-lg w-full p-5 space-y-4 my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-bold text-sm text-heading">
                      দায়িত্ব ও ব্যাচ বণ্টন: {dutyAssignStaff.name}
                    </h3>
                    <p className="text-[11px] text-emerald-800 font-semibold">{dutyAssignStaff.designation}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDutyAssignStaff(null)}
                    className="p-1.5 text-muted hover:text-heading hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveDuties} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">দায়িত্বপ্রাপ্ত ব্যাচসমূহ:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {AVAILABLE_ACADEMY_BATCHES.map((b) => {
                        const checked = dutyBatches.includes(b)
                        return (
                          <label key={b} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-800">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) setDutyBatches((prev) => [...prev, b])
                                else setDutyBatches((prev) => prev.filter((x) => x !== b))
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>{b}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">নির্দিষ্ট দায়িত্বের তালিকা (প্রতি লাইনে একটি):</label>
                    <textarea
                      rows={4}
                      value={dutyResponsibilities}
                      onChange={(e) => setDutyResponsibilities(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white"
                      placeholder="দৈনিক সবক গ্রহণ&#10;আমোক্তা পরীক্ষা&#10;সাপ্তাহিক মূল্যায়ন"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ক্লাসের শিফট</label>
                      <input
                        type="text"
                        value={dutyShift}
                        onChange={(e) => setDutyShift(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">স্ট্যাটাস</label>
                      <select
                        value={dutyStatus}
                        onChange={(e) => setDutyStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-slate-50 cursor-pointer"
                      >
                        <option value="active">সক্রিয় (Active)</option>
                        <option value="on_leave">ছুটিতে (On Leave)</option>
                        <option value="part_time">খণ্ডকালীন (Part-time)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setDutyAssignStaff(null)} className="rounded-xl text-xs cursor-pointer">
                      বাতিল
                    </Button>
                    <Button type="submit" className="bg-emerald-academy hover:bg-emerald-academy-dark text-white rounded-xl text-xs font-bold px-4 py-2 cursor-pointer shadow-xs">
                      দায়িত্ব আপডেট করুন
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: BATCH, CLASS & DEPARTMENT ASSIGNMENT HUB */}
      {tab === 'assign' && (
        <div className="space-y-4">
          {/* Header controls & Department filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface rounded-2xl border border-border shadow-3xs">
            <div>
              <h3 className="font-bold text-sm text-heading flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                ক্লাস, ব্যাচ ও বিভাগীয় দায়িত্ব বণ্টন
              </h3>
              <p className="text-xs text-muted mt-0.5">
                প্রত্যেকটি ব্যাচ ও ক্লাসের জন্য নির্ধারিত শিক্ষক এবং তদারককারী যিম্মাদার অর্পণ করুন
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-muted">বিভাগ ফিল্টার:</span>
              <select
                value={assignDeptFilter}
                onChange={(e) => setAssignDeptFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-border bg-slate-50 font-semibold cursor-pointer outline-none"
              >
                <option value="all">সকল বিভাগ (All Departments)</option>
                {AVAILABLE_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Batches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches
              .filter((b) => {
                if (assignDeptFilter === 'all') return true
                return (b.department || '').includes(assignDeptFilter)
              })
              .map((batch) => {
                const assignedTeacher = teacherList.find((t) => t.id === batch.teacher_id) ||
                  staffMembers.find((s) => s.name === batch.teacher_name || s.id === batch.teacher_id)
                const assignedZimmadar = staffMembers.find((s) => s.id === batch.zimmadar_id || s.name === batch.zimmadar_name || s.role === 'zimmadar')
                const enrolledCount = enrollments.filter((e) => e.batch_id === batch.id && ['active', 'enrolled'].includes(e.status)).length

                return (
                  <div key={batch.id} className="bg-surface rounded-2xl border border-border p-4 shadow-3xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ব্যাচ #{batch.id} · {batch.delivery_mode === 'one_to_one' ? '১:১ স্লট' : 'গ্রুপ ব্যাচ'}
                          </span>
                          <h4 className="font-bold text-sm text-heading mt-1.5 leading-snug">
                            {batch.label}
                          </h4>
                          <p className="text-xs text-muted">{batch.course_title || 'হিফজ ও বিশুদ্ধ তিলাওয়াত'}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs my-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">বিভাগ:</span>
                          <strong className="text-slate-800">{batch.department || 'হিফজুল কুরআন বিভাগ'}</strong>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            👳‍♂️ দায়িত্বপ্রাপ্ত শিক্ষক:
                          </span>
                          <span className="font-semibold text-emerald-900">
                            {batch.teacher_name || assignedTeacher?.name || 'অ্যাসাইন করা হয়নি'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            🏛️ তত্ত্বাবধায়ক যিম্মাদার:
                          </span>
                          <span className="font-semibold text-sky-900">
                            {batch.zimmadar_name || assignedZimmadar?.name || 'মুফতী মাওলানা আবু বকর সিদ্দিক'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                          <span className="text-slate-500 font-medium">অধ্যয়নরত ছাত্র:</span>
                          <span className="font-mono font-bold text-slate-800">{enrolledCount} জন</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-[11px] text-muted font-medium">
                        স্থিতি: <span className="text-emerald-700 font-bold">সক্রিয় রুটিন</span>
                      </span>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => openAssignBatchModal(batch)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-academy hover:bg-emerald-academy-dark text-white text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> দায়িত্ব পরিবর্তন
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Teacher Workload Matrix */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" /> শিক্ষকভিত্তিক কর্মঘণ্টা ও ব্যাচ বরাদ্দ সারসংক্ষেপ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="iom-table">
                <thead>
                  <tr>
                    <th>শিক্ষক / কর্মকর্তা</th>
                    <th>বিভাগ ও পদবী</th>
                    <th>দায়িত্বপ্রাপ্ত ব্যাচসমূহ</th>
                    <th>শিফট ও সময়</th>
                    <th>সাপ্তাহিক কর্মঘণ্টা</th>
                    <th>স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="font-bold text-heading text-xs">{s.name}</div>
                        <span className="text-[10px] text-muted">{s.email}</span>
                      </td>
                      <td>
                        <div className="text-xs font-semibold">{s.department}</div>
                        <div className="text-[11px] text-muted">{s.designation}</div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {s.assignedBatches.map((b) => (
                            <span key={b} className="text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 px-1.5 py-0.5 rounded">
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-xs">{s.shift}</td>
                      <td className="font-mono text-xs font-bold text-emerald-800">{s.weeklyHours} ঘণ্টা/সপ্তাহ</td>
                      <td>
                        <Badge variant={s.status === 'active' ? 'approved' : 'pending'} dot>
                          {s.status === 'active' ? 'সক্রিয়' : 'ছুটিতে'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: ZIMMADAR OPERATIONAL DESK */}
      {tab === 'zimmadar' && (
        <div className="space-y-4">
          {/* Zimmadar Mission Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-emerald-300">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">জিম্মাদার কর্মশালা ও দায়িত্ব মনিটর (Zimmadar Operational Desk)</h3>
                <p className="text-xs text-emerald-200">
                  আইওএম ইতকান একাডেমিতে জিম্মাদার হলেন একাডেমি, শিক্ষক ও শিক্ষার্থীর মাঝে মূল সেতুবন্ধন
                </p>
              </div>
            </div>

            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-4xl border-t border-white/10 pt-3">
              জিম্মাদারের প্রধান দায়িত্ব: ক্লাসের মান তদারকি করা, প্রতিদিন সবক ও আমোক্তা শিট সঠিকভাবে পূরণ নিশ্চিত করা,
              অনুপস্থিত শিক্ষার্থীদের তাৎক্ষণিক ফলো-আপ করে অভিভাবকদের সাথে কথা বলা, শিক্ষক ছুটিতে থাকলে বদলি শিক্ষক নিশ্চিত করা এবং
              মাসিক স্টার স্টুডেন্টদের চূড়ান্ত মনোনয়ন দেওয়া।
            </p>
          </div>

          {/* Zimmadar Daily Action Checklist */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-700" />
                জিম্মাদারের দৈনিক অ্যাকাডেমিক চেকলিস্ট (Daily Action Checklist)
              </CardTitle>
              <span className="text-xs text-muted font-medium">আজকের তারিখ: {getDhakaDateString()}</span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  { key: 'sabaq-audit', title: '১. ফজর ও সকালের সবক শিট অডিট', desc: 'আজকের ক্লাসের সবক, সবকী ও আমোক্তা শিট পূরণ সম্পন্ন হয়েছে কি না তদারকি' },
                  { key: 'absent-followup', title: '২. অনুপস্থিত শিক্ষার্থী সনাক্ত ও অভিভাবক কল', desc: 'অনুপস্থিত ছাত্রদের চিহ্নিত করে সরাসরি ফোনে বা হোয়াটসঅ্যাপে যোগাযোগ' },
                  { key: 'substitute-check', title: '৩. শিক্ষক উপস্থিতি ও বদলি শিক্ষক নিশ্চিতকরণ', desc: 'ছুটিতে থাকা উস্তাদের ক্লাসে বদলি শিক্ষক ঠিক সময়ে যুক্ত হয়েছেন কি না' },
                  { key: 'tickets-review', title: '৪. অভিভাবক ফিডব্যাক ও সাপোর্ট টিকিট', desc: 'অভিভাবক কর্তৃক উত্থাপিত অভিযোগ ও পরামর্শের দ্রুত সমাধান' },
                  { key: 'star-student', title: '৫. মাসিক স্টার স্টুডেন্ট ও রিবন মূল্যায়ন', desc: 'সর্বোচ্চ পয়েন্ট ও নিয়মিত ছাত্রদের নাম লিডারবোর্ডের জন্য অনুমোদন' },
                ].map((item) => (
                  <label key={item.key} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-slate-50/70 hover:bg-white transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(zimmadarChecklist[item.key])}
                      onChange={(e) => setZimmadarChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <strong className="block text-slate-900 font-bold">{item.title}</strong>
                      <span className="text-slate-600 text-[11px] mt-0.5 block">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Zimmadar Roster & Assigned Batches */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffMembers.filter((s) => s.role === 'zimmadar').map((zim) => {
              const assigned = Array.isArray(zim.assignedBatches) ? zim.assignedBatches : []
              const myBatches = batches.filter((b) => b.zimmadar_id === zim.id || assigned.includes(b.label))
              return (
                <div key={zim.id} className="bg-surface rounded-2xl border border-emerald-200/90 p-4 shadow-3xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                          {zim.name.slice(0, 1)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-heading">{zim.name}</h4>
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {zim.designation}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs my-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">বিভাগ:</span>
                        <strong className="text-slate-800">{zim.department}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">মোবাইল:</span>
                        <a href={`tel:${zim.phone}`} className="font-mono text-slate-800 hover:underline">{zim.phone}</a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">ইমেইল:</span>
                        <a href={`mailto:${zim.email}`} className="text-slate-700 hover:underline">{zim.email}</a>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">
                        📚 তত্ত্বাবধানকৃত ব্যাচসমূহ ({myBatches.length || assigned.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {assigned.map((b) => (
                          <span key={b} className="text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 rounded px-2 py-0.5">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('#/learning')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                    >
                      সবক শিট দেখুন →
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const cleanPhone = zim.phone.replace(/[^0-9]/g, '')
                        window.open(`https://wa.me/${cleanPhone}?text=আসসালামু আলাইকুম মুহতারাম জিম্মাদার সাহেব`, '_blank')
                      }}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 cursor-pointer"
                      title="হোয়াটসঅ্যাপে যোগাযোগ"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-emerald-950">জরুরি জিম্মাদার অ্যাকশন</h4>
              <p className="text-xs text-emerald-800">অনুপস্থিত শিক্ষার্থীর খোঁজ নেওয়া, বদলি শিক্ষক নিয়োগ বা নতুন দায়িত্ব অর্পণ</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => navigateTo('#/followups')} variant="outline" className="border-emerald-300 text-emerald-900 bg-white">
                <Phone className="w-3.5 h-3.5" /> অনুপস্থিত ছাত্র ফলো-আপ
              </Button>
              <Button size="sm" onClick={() => setTab('leaves')} className="bg-emerald-academy hover:bg-emerald-academy-dark text-white">
                <CalendarOff className="w-3.5 h-3.5" /> বদলি শিক্ষক প্রোটোকল
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: PUNCTUALITY & WORKLOAD SCORECARD */}
      {tab === 'scorecard' && (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Performance, Punctuality & Teaching Load</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {lu || lc ? (
              <div className="p-5 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : scorecardRows.length === 0 ? (
              <p className="text-center text-sm text-muted py-12">No teacher assignments found yet.</p>
            ) : (
              <table className="iom-table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Batches · Students</th>
                    <th>Classes (Ended / Live)</th>
                    <th>Conducted Mins</th>
                    <th>Punctuality</th>
                    <th>Missed / Late</th>
                    <th>Overdue Reports</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {scorecardRows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <AvatarInitials name={r.name} size="sm" />
                          <div>
                            <p className="font-semibold text-heading">{r.name}</p>
                            <p className="text-[11px] text-muted">{r.email || `Teacher #${r.id}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs">
                        <strong>{r.batchCount}</strong> batches · <strong>{r.activeStudents}</strong> students
                      </td>
                      <td className="text-xs">
                        {r.totalClasses} total ({r.ended} ended{r.live > 0 ? `, ${r.live} live` : ''})
                      </td>
                      <td className="text-xs font-mono">{r.totalMinutes} min</td>
                      <td>
                        {r.punctualityPct === null ? (
                          <span className="text-xs text-muted">No starts yet</span>
                        ) : (
                          <Badge variant={r.punctualityPct >= 85 ? 'approved' : r.punctualityPct >= 65 ? 'pending' : 'cancelled'}>
                            {r.punctualityPct}% On-Time ({r.onTime}/{r.onTime + r.late})
                          </Badge>
                        )}
                      </td>
                      <td className="text-xs">
                        <span className={r.late > 0 ? 'text-amber-700 font-semibold' : 'text-muted'}>{r.late} late</span>
                        {' · '}
                        <span className={r.unstartedPastDue > 0 ? 'text-rose-600 font-semibold' : 'text-muted'}>
                          {r.unstartedPastDue} unstarted
                        </span>
                      </td>
                      <td>
                        <Badge variant={r.overdueReports > 0 ? 'cancelled' : 'approved'}>
                          {r.overdueReports} overdue
                        </Badge>
                      </td>
                      <td className="text-right">
                        {canManage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setProxyFilterTeacherId(String(r.id))
                              setTab('leaves')
                            }}
                          >
                            Assign Proxy
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: TEACHER LEAVE & REAL PROXY ASSIGNMENT */}
      {tab === 'leaves' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary-700" /> Request Teacher Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitTeacherLeave} className="space-y-3">
                  {canManage && (
                    <div>
                      <label className="block text-xs font-semibold text-heading mb-1">Teacher</label>
                      <select
                        value={leaveTeacherId}
                        onChange={(e) => setLeaveTeacherId(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                      >
                        {teacherList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Start Date" type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} required />
                    <Input label="End Date" type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-heading mb-1">Suggested Proxy Teacher (Optional)</label>
                    <select
                      value={leavePrefSubId}
                      onChange={(e) => setLeavePrefSubId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                    >
                      <option value="">None suggested yet</option>
                      {teacherList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-heading mb-1">Leave Reason</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Family emergency / medical / conference…"
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                    />
                  </div>
                  <Button type="submit" className="w-full">Submit Leave Request</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Teacher Leave Queue ({teacherLeaves.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {teacherLeaves.length === 0 ? (
                  <p className="text-center text-sm text-muted py-12">
                    No teacher leave requests yet. Submit one on the left or assign a proxy teacher below.
                  </p>
                ) : (
                  <table className="iom-table">
                    <thead>
                      <tr>
                        <th>Teacher</th>
                        <th>Dates</th>
                        <th>Reason & Suggested Proxy</th>
                        <th>Status</th>
                        {canManage && <th className="text-right">Decision</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {teacherLeaves.map((l) => (
                        <tr key={l.id}>
                          <td className="font-semibold text-heading">{l.teacher_name}</td>
                          <td className="text-xs font-mono">
                            {l.start_date} → {l.end_date}
                          </td>
                          <td className="text-xs">
                            <p>{l.reason}</p>
                            {l.substitute_teacher_name && (
                              <p className="text-primary-700 font-medium mt-0.5">
                                Suggested proxy: {l.substitute_teacher_name}
                              </p>
                            )}
                          </td>
                          <td>
                            <Badge variant={l.status === 'approved' ? 'approved' : l.status === 'rejected' ? 'cancelled' : 'pending'}>
                              {l.status}
                            </Badge>
                          </td>
                          {canManage && (
                            <td className="text-right">
                              <div className="flex justify-end gap-1.5">
                                {l.status === 'pending' && (
                                  <>
                                    <Button size="sm" onClick={() => decideTeacherLeave(l.id, 'approved')}>
                                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => decideTeacherLeave(l.id, 'rejected')}>
                                      <XCircle className="w-3.5 h-3.5" /> Reject
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setProxyFilterTeacherId(String(l.teacher_id))}
                                >
                                  Filter Classes ↓
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Direct Real Backend Proxy Assignment */}
          {canManage && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3 w-full">
                  <div>
                    <CardTitle>Assign Substitute (Proxy) Teacher to Upcoming Classes</CardTitle>
                    <p className="text-xs text-muted mt-0.5">
                      Updates `actual_teacher_id` directly on the academy schedule with full conflict check & audit logging.
                    </p>
                  </div>
                  <select
                    value={proxyFilterTeacherId}
                    onChange={(e) => setProxyFilterTeacherId(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border bg-bg"
                  >
                    <option value="">All Teachers&apos; Upcoming Classes</option>
                    {teacherList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {upcomingScheduled.length === 0 ? (
                  <p className="text-center text-sm text-muted py-10">No upcoming scheduled classes match this filter.</p>
                ) : (
                  <table className="iom-table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Scheduled Time (BD)</th>
                        <th>Current Teacher</th>
                        <th>Substitute Teacher</th>
                        <th>Reason</th>
                        <th className="text-right">Assign</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingScheduled.map((cls) => {
                        const effId = cls.actual_teacher_id || cls.teacher_id || batchTeacherLookup.get(cls.batch_id)
                        const effName =
                          teacherList.find((t) => t.id === effId)?.name ||
                          cls.teacher_name ||
                          (effId ? `Teacher #${effId}` : 'Unassigned')
                        return (
                          <tr key={cls.id}>
                            <td>
                              <p className="font-semibold text-heading">{cls.course_title}</p>
                              <p className="text-xs text-muted">{cls.batch_name} · #{cls.id}</p>
                            </td>
                            <td className="text-xs font-mono">{formatDhakaDateTime(cls.scheduled_start)}</td>
                            <td className="text-xs font-medium">{effName}</td>
                            <td>
                              <select
                                value={proxySubByClass[cls.id] || ''}
                                onChange={(e) => setProxySubByClass((p) => ({ ...p, [cls.id]: e.target.value }))}
                                className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-bg"
                              >
                                <option value="">Select substitute…</option>
                                {teacherList
                                  .filter((t) => t.id !== effId)
                                  .map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}
                                    </option>
                                  ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                placeholder="Reason (min 2 chars)"
                                value={proxyReasonByClass[cls.id] ?? 'Teacher leave substitute'}
                                onChange={(e) => setProxyReasonByClass((p) => ({ ...p, [cls.id]: e.target.value }))}
                                className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-bg w-44"
                              />
                            </td>
                            <td className="text-right">
                              <Button
                                size="sm"
                                loading={savingClassId === cls.id}
                                onClick={() => assignClassSubstitute(cls)}
                              >
                                Assign Proxy
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: REPORT SLA MONITOR */}
      {tab === 'reports' && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2 w-full">
                <CardTitle>Ended Class Report SLA Obligations ({reportMonitor.length})</CardTitle>
                {isCentral && (
                  <Button size="sm" variant="outline" loading={runningAlerts} onClick={checkAlertsNow}>
                    <RefreshCw className="w-3.5 h-3.5" /> Run Escalation Check Now
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {lr ? (
                <div className="p-5 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : reportMonitor.length === 0 ? (
                <p className="text-center text-sm text-muted py-12">No ended class report obligations recorded yet.</p>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Ended At (BD)</th>
                      <th>Report Due At</th>
                      <th>Obligation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportMonitor.map((r) => (
                      <tr key={r.class_id}>
                        <td>
                          <p className="font-semibold text-heading">{r.course_title}</p>
                          <p className="text-xs text-muted">{r.batch_name} · Class #{r.class_id}</p>
                        </td>
                        <td className="text-xs font-mono">{formatDhakaDateTime(r.actual_end)}</td>
                        <td className="text-xs font-mono">{formatDhakaDateTime(r.due_at)}</td>
                        <td>
                          <Badge
                            variant={
                              r.overdue
                                ? 'cancelled'
                                : r.obligation_status === 'approved'
                                  ? 'approved'
                                  : 'pending'
                            }
                          >
                            {r.obligation_status}
                          </Badge>
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

      {/* Modal: Assign / Reassign Batch & Teacher */}
      {showAssignBatchModal && selectedBatchToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-3 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-heading">ব্যাচে শিক্ষক ও জিম্মাদার অর্পণ</h3>
                  <p className="text-[11px] text-muted">{selectedBatchToAssign.label}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignBatchModal(false)}
                className="p-1.5 text-muted hover:text-heading hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchAssignment} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted font-medium">কোর্স:</span>
                  <span className="font-semibold text-slate-800">{selectedBatchToAssign.course_title || 'হিফজ ও বিশুদ্ধ কুরআন পাঠ'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted font-medium">বিভাগ:</span>
                  <span className="font-semibold text-slate-800">{selectedBatchToAssign.department || 'হিফজুল কুরআন বিভাগ'}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">👳‍♂️ দায়িত্বপ্রাপ্ত শিক্ষক (উস্তাদ) নির্বাচন *</label>
                <select
                  value={assignBatchTeacherId}
                  onChange={(e) => setAssignBatchTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:bg-white font-semibold cursor-pointer text-xs"
                >
                  <option value="">উস্তাদ নির্বাচন করুন</option>
                  {staffMembers.filter((s) => s.role === 'teacher' || s.role === 'supervisor').map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>
                  ))}
                  {teacherList.map((t) => (
                    <option key={`tl-${t.id}`} value={t.id}>{t.name} (ID: #{t.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">🏛️ তদারককারী যিম্মাদার (Supervisor) নির্বাচন *</label>
                <select
                  value={assignBatchZimmadarId}
                  onChange={(e) => setAssignBatchZimmadarId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:bg-white font-semibold cursor-pointer text-xs"
                >
                  <option value="">যিম্মাদার নির্বাচন করুন</option>
                  {staffMembers.filter((s) => s.role === 'zimmadar').map((z) => (
                    <option key={z.id} value={z.id}>{z.name} ({z.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ক্লাস ডেলিভারি মোড</label>
                <select
                  value={assignBatchDeliveryMode}
                  onChange={(e) => setAssignBatchDeliveryMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-slate-50 focus:bg-white font-semibold cursor-pointer text-xs"
                >
                  <option value="group">গ্রুপ ক্লাস ব্যাচ (Group Batch)</option>
                  <option value="one_to_one">১:১ প্রাইভেট অনলাইন স্লট (1:1 Private Slot)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAssignBatchModal(false)}>
                  বাতিল
                </Button>
                <Button type="submit" loading={assignBatchSaving} className="bg-emerald-academy hover:bg-emerald-academy-dark text-white">
                  <Check className="w-4 h-4" /> দায়িত্ব নিশ্চিত করুন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Staff Credential Card & Share */}
      {createdStaffCredential && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-3 overflow-y-auto">
          <div className="bg-surface rounded-2xl border border-emerald-300 shadow-2xl max-w-md w-full p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-heading">শিক্ষক / জিম্মাদার লগইন তথ্য</h3>
                  <p className="text-[11px] text-muted">অফিশিয়াল পোর্টাল ক্রেডেনশিয়াল সংরক্ষিত হয়েছে</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreatedStaffCredential(null)}
                className="p-1.5 text-muted hover:text-heading hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 space-y-2.5 text-xs text-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">নাম:</span>
                <strong className="text-slate-900">{createdStaffCredential.name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">ভূমিকা:</span>
                <span className="font-semibold text-emerald-900">{createdStaffCredential.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">বিভাগ:</span>
                <span className="text-slate-700">{createdStaffCredential.department}</span>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-200/60 pt-2">
                <span className="text-slate-500 font-medium">লগইন ইমেইল:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {createdStaffCredential.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">পাসওয়ার্ড:</span>
                <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {createdStaffCredential.password}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-200/60 pt-2">
                <span className="text-slate-500 font-medium">লগইন লিংক:</span>
                <span className="text-primary-700 underline font-mono text-[11px]">
                  {createdStaffCredential.loginUrl}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                type="button"
                onClick={() => {
                  const text = `আইওএম ইতকান একাডেমি — শিক্ষক/জিম্মাদার লগইন তথ্য\n` +
                    `-----------------------------------------\n` +
                    `নাম: ${createdStaffCredential.name} (${createdStaffCredential.role})\n` +
                    `বিভাগ: ${createdStaffCredential.department}\n` +
                    `লগইন পেইজ: ${createdStaffCredential.loginUrl}\n` +
                    `ইমেইল: ${createdStaffCredential.email}\n` +
                    `পাসওয়ার্ড: ${createdStaffCredential.password}\n` +
                    `-----------------------------------------\n` +
                    `ক্লাস ও সবক লগ পরিচালনায় নিয়মিত পোর্টালে লগইন করুন। জাযাকুমুল্লাহু খাইরান।`
                  navigator.clipboard.writeText(text)
                  toast.success('লগইন তথ্য ক্লিপবোর্ডে কপি করা হয়েছে!')
                }}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white"
              >
                <Copy className="w-4 h-4" /> সকল তথ্য ক্লিপবোর্ডে কপি করুন
              </Button>

              <Button
                type="button"
                onClick={() => {
                  const msg = `আসসালামু আলাইকুম ${createdStaffCredential.name} মুহতারাম,\n\n` +
                    `আইওএম ইতকান একাডেমিতে আপনার শিক্ষক/জিম্মাদার পোর্টাল অ্যাকাউন্ট সক্রিয় করা হয়েছে।\n\n` +
                    `📌 আপনার লগইন তথ্য:\n` +
                    `• পোর্টাল লিংক: ${createdStaffCredential.loginUrl}\n` +
                    `• ইমেইল: ${createdStaffCredential.email}\n` +
                    `• পাসওয়ার্ড: ${createdStaffCredential.password}\n` +
                    `• পদবী: ${createdStaffCredential.role}\n\n` +
                    `পোর্টালে ঢুকে আপনি দৈনিক ক্লাস, সবক শিট, আমোক্তা ও ছাত্র মূল্যায়ন পরিচালনা করতে পারবেন। জাযাকুমুল্লাহু খাইরান।`
                  const cleanPhone = createdStaffCredential.phone.replace(/[^0-9]/g, '')
                  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
                  window.open(url, '_blank')
                }}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <MessageSquare className="w-4 h-4" /> হোয়াটসঅ্যাপে শিক্ষককে পাঠান
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
