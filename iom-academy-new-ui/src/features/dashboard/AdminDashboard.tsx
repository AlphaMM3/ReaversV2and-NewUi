import { useSupportTickets } from '@/lib/supportApi'
import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, dashboardApi, toArray, type DashboardSummary, type ClassSession, type CurrentUser } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton, AvatarInitials } from '@/components/ui/KpiCard'
import {
  ChartTableCard,
  DualBarChart,
  HorizontalBarList,
  SparkAreaChart,
} from './DashboardCharts'
import { deriveClassCapabilities, getStatusMeta, INVOICE_MACHINE } from '@/lib/stateMachines'
import { navigateTo } from '@/lib/router'
import { buildInvoiceText, buildWhatsAppUrl } from '@/lib/messaging'
import {
  publishAttentionQueue,
  setAttentionDocked,
  useAttentionQueue,
} from '@/lib/attentionNotifications'
import {
  type AcademyExpense,
  EXPENSES_KEY,
  TEACHER_LEAVES_KEY,
  STAR_STUDENTS_KEY,
  DEFAULT_STAR_STUDENTS,
  type TeacherLeaveRecord,
  type StarStudentAward,
  useLocalStore,
} from '@/lib/superAdminStore'
import { getDhakaToday, getDhakaDateString, formatDhakaTime, initials } from '@/lib/utils'
import {
  Users, Video, AlertTriangle, FileText, ArrowRight, BookOpen,
  ExternalLink, CalendarDays, Receipt, UserPlus, ClipboardCheck,
  CalendarOff, ChevronLeft, ChevronRight, Wallet, UserCheck,
  GraduationCap, Megaphone, MessageCircle, Smartphone, Plus, Sparkles, X,
  TrendingUp, Maximize2, Minimize2, Trophy,
} from 'lucide-react'

interface Props {
  user: CurrentUser
}

interface InvoiceMini {
  id: number
  enrollment_id: number
  contract_id: number | null
  invoice_number: string
  student_name: string
  course_title: string
  batch_name: string
  billing_month: string
  amount_due: string | number
  amount_paid: string | number
  due_date: string
  status: 'unpaid' | 'partially_paid' | 'paid'
  payment_reference_code: string | null
  notes: string | null
}

interface PayableMini {
  id: number
  billing_month: string
  payable_amount: string | number
  status: string
  course_title?: string | null
}

interface MonthlyAttendanceRow {
  enrollment_id: number
  student_name: string
  course_title: string
  batch_name: string
  delivery_mode?: string
  held_classes: number
  present_count: number
  late_count: number
  absent_count: number
  attendance_pct: number | null
}

interface EnrollmentMini {
  id: number
  batch_id: number
  batch_name?: string
  course_title?: string
  delivery_mode?: string
  status: string
  start_date?: string
  created_at?: string
}

interface UserMini {
  id: number
  name: string
  role: string
  active?: number | boolean
}

interface LeaveMini {
  id: number
  enrollment_id: number
  student_name?: string
  start_date: string
  end_date: string
  status: string
}

interface AdmissionMini {
  id: number
  applicant_name: string
  status: string
  created_at?: string
}

interface FollowupMini {
  id: number
  enrollment_id: number
  student_name?: string
  course_title?: string
  status: string
}

interface AcademicSessionMini {
  id: number
  label: string
  start_date: string
  end_date: string
}

interface AssessmentMini {
  id: number
  title: string
  batch_name?: string
  course_title?: string
  max_marks: number
  published: number | boolean
}

interface ResourceMini {
  id: number
  title: string
  course_title?: string
  url: string
}

interface AnnouncementMini {
  id: number
  title: string
  body: string
  created_at: string
}

interface TelegramStatus {
  linked: boolean
  configuration_required: boolean
}

function buildRecentMonths(endMonthKey: string, count: number): string[] {
  const [y, m] = endMonthKey.split('-').map(Number)
  const out: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

function shortMonthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

/** Manages timed auto-dismiss, hover-pause, and 300ms fade-out for transient top dashboard banners. */
function useAutoDismissBanner(delayMs: number) {
  const [status, setStatus] = useState<'visible' | 'closing' | 'hidden'>('visible')
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (status !== 'visible' || paused) return
    const timer = window.setTimeout(() => setStatus('closing'), delayMs)
    return () => window.clearTimeout(timer)
  }, [status, paused, delayMs])

  useEffect(() => {
    if (status !== 'closing') return
    const timer = window.setTimeout(() => setStatus('hidden'), 300)
    return () => window.clearTimeout(timer)
  }, [status])

  return {
    visible: status !== 'hidden',
    closing: status === 'closing',
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    dismiss: () => setStatus('closing'),
  }
}

export default function AdminDashboard({ user }: Props) {
  const today = getDhakaDateString()
  const monthKey = today.slice(0, 7)
  const [calYear, setCalYear] = useState(() => Number(today.slice(0, 4)))
  const [calMonth, setCalMonth] = useState(() => Number(today.slice(5, 7)) - 1)
  const [trendPeriod, setTrendPeriod] = useState<'6m' | '12m'>('6m')
  const [trendsExpanded, setTrendsExpanded] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('iom_dashboard_trends_expanded_v1') === 'true'
    } catch {
      return false
    }
  })
  const welcomeBanner = useAutoDismissBanner(10000)
  const liveMonitorBanner = useAutoDismissBanner(20000)
  const starStudentsBanner = useAutoDismissBanner(20000)
  const attentionQueue = useAttentionQueue()
  const [attentionClosing, setAttentionClosing] = useState(false)
  const [attentionPaused, setAttentionPaused] = useState(false)

  function toggleTrendsExpanded(next?: boolean) {
    setTrendsExpanded((prev) => {
      const resolved = typeof next === 'boolean' ? next : !prev
      try {
        window.localStorage.setItem('iom_dashboard_trends_expanded_v1', String(resolved))
      } catch {}
      return resolved
    })
  }

  const isStaffManager = ['central_admin', 'branch_admin', 'zimmadar', 'department_supervisor'].includes(user.role)

  const { data: summary, isLoading: loadingSummary } = useQuery<DashboardSummary>({
    queryKey: ['summary'],
    queryFn: dashboardApi.summary,
  })

  const calMonthKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate()

  const { data: monthClasses = [], isLoading: loadingClasses } = useQuery<ClassSession[]>({
    queryKey: ['dashboard-month-classes', calMonthKey],
    queryFn: () =>
      api
        .get<ClassSession[] | { items?: ClassSession[] }>(
          `/classes?from=${calMonthKey}-01&until=${calMonthKey}-${String(daysInCalMonth).padStart(2, '0')}T23:59:59&limit=500`,
        )
        .then(toArray),
  })

  const { data: pendingReports = [] } = useQuery<Array<{ id: number }>>({
    queryKey: ['reports', 'submitted'],
    queryFn: () =>
      api
        .get<Array<{ id: number }> | { items?: Array<{ id: number }> }>('/reports?status=submitted&limit=50')
        .then(toArray)
        .catch(() => []),
  })

  const { data: openFollowups = [] } = useQuery<FollowupMini[]>({
    queryKey: ['followups', 'dashboard'],
    queryFn: () =>
      api
        .get<FollowupMini[] | { items?: FollowupMini[] }>('/followups')
        .then(toArray)
        .catch(() => []),
  })

  const { data: leaves = [] } = useQuery<LeaveMini[]>({
    queryKey: ['leaves-dashboard'],
    queryFn: () => api.get<LeaveMini[] | { items?: LeaveMini[] }>('/leaves').then(toArray).catch(() => []),
  })

  const { data: admissions = [] } = useQuery<AdmissionMini[]>({
    queryKey: ['admissions-dashboard'],
    queryFn: () => api.get<AdmissionMini[] | { items?: AdmissionMini[] }>('/admissions').then(toArray).catch(() => []),
  })

  const { data: invoices = [] } = useQuery<InvoiceMini[]>({
    queryKey: ['dashboard-invoices'],
    queryFn: () => api.get<InvoiceMini[] | { items?: InvoiceMini[] }>('/invoices').then(toArray).catch(() => []),
  })

  const { data: payables = [] } = useQuery<PayableMini[]>({
    queryKey: ['dashboard-payables'],
    queryFn: () =>
      api
        .get<PayableMini[] | { items?: PayableMini[] }>('/finance/teacher-payables')
        .then(toArray)
        .catch(() => []),
  })

  const { data: monthlyAttendance = [] } = useQuery<MonthlyAttendanceRow[]>({
    queryKey: ['dashboard-attendance-monthly', monthKey],
    queryFn: () =>
      api
        .get<MonthlyAttendanceRow[] | { items?: MonthlyAttendanceRow[] }>(`/attendance/monthly?month=${monthKey}`)
        .then(toArray)
        .catch(() => []),
  })

  const { data: enrollments = [] } = useQuery<EnrollmentMini[]>({
    queryKey: ['dashboard-enrollments'],
    queryFn: () =>
      api
        .get<EnrollmentMini[] | { items?: EnrollmentMini[] }>('/enrollments?limit=500')
        .then(toArray)
        .catch(() => []),
  })

  const { data: users = [] } = useQuery<UserMini[]>({
    queryKey: ['dashboard-users'],
    queryFn: () => api.get<UserMini[] | { items?: UserMini[] }>('/users').then(toArray).catch(() => []),
    enabled: isStaffManager,
  })

  const { data: academicSessions = [] } = useQuery<AcademicSessionMini[]>({
    queryKey: ['dashboard-academic-sessions'],
    queryFn: () =>
      api
        .get<AcademicSessionMini[] | { items?: AcademicSessionMini[] }>('/academic-sessions')
        .then(toArray)
        .catch(() => []),
  })

  const { data: assessments = [] } = useQuery<AssessmentMini[]>({
    queryKey: ['dashboard-assessments'],
    queryFn: () => api.get<AssessmentMini[] | { items?: AssessmentMini[] }>('/assessments').then(toArray).catch(() => []),
  })

  const { data: resources = [] } = useQuery<ResourceMini[]>({
    queryKey: ['dashboard-resources'],
    queryFn: () => api.get<ResourceMini[] | { items?: ResourceMini[] }>('/resources').then(toArray).catch(() => []),
  })

  const { data: announcements = [] } = useQuery<AnnouncementMini[]>({
    queryKey: ['dashboard-announcements'],
    queryFn: () =>
      api.get<AnnouncementMini[] | { items?: AnnouncementMini[] }>('/announcements').then(toArray).catch(() => []),
  })

  const { data: telegramStatus } = useQuery<TelegramStatus>({
    queryKey: ['dashboard-telegram'],
    queryFn: () => api.get<TelegramStatus>('/telegram').catch(() => ({ linked: false, configuration_required: true })),
  })

  // ── Derived Operational Metrics ───────────────────────────
  const todayClasses = useMemo(
    () => monthClasses.filter((c) => c.scheduled_start.slice(0, 10) === today),
    [monthClasses, today],
  )

  const upcomingClasses = useMemo(
    () => monthClasses.filter((c) => c.scheduled_start.slice(0, 10) >= today && c.status === 'scheduled').slice(0, 4),
    [monthClasses, today],
  )

  const classCountByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of monthClasses) {
      const d = c.scheduled_start.slice(0, 10)
      map.set(d, (map.get(d) ?? 0) + 1)
    }
    return map
  }, [monthClasses])

  const unverifiedEnded = todayClasses.filter((c) => c.status === 'ended' && !c.held_verified).length
  const leaveQueueCount = leaves.filter((l) => l.status === 'pending').length
  const admissionQueueCount = admissions.filter((a) => a.status === 'pending').length
  const openFollowupCount = openFollowups.filter((f) => f.status !== 'closed').length
  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid')

  const totalCollectedAll = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0)
  const totalBilledAll = invoices.reduce((s, i) => s + Number(i.amount_due || 0), 0)
  const totalOutstanding = Math.max(0, totalBilledAll - totalCollectedAll)

  const thisMonthInvoices = invoices.filter((i) => i.billing_month === monthKey)
  const monthCollected = thisMonthInvoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0)
  const monthBilled = thisMonthInvoices.reduce((s, i) => s + Number(i.amount_due || 0), 0)
  const monthCollectionPct = monthBilled > 0 ? Math.round((monthCollected / monthBilled) * 100) : 0

  const [expenses] = useLocalStore<AcademyExpense[]>(EXPENSES_KEY, [])
  const [teacherLeaves] = useLocalStore<TeacherLeaveRecord[]>(TEACHER_LEAVES_KEY, [])
  const { data: supportTickets = [] } = useSupportTickets()
  const [starStudents] = useLocalStore<StarStudentAward[]>(STAR_STUDENTS_KEY, DEFAULT_STAR_STUDENTS)

  const isSuperAdminRole = user.role === 'central_admin' || user.role === 'branch_admin'
  const pendingTickets = supportTickets.filter((t) => t.status === 'open' || t.status === 'in_progress')

  const monthPayablesTotal = payables
    .filter((p) => p.billing_month === monthKey)
    .reduce((s, p) => s + Number(p.payable_amount || 0), 0)
  const monthOperatingExpenses = expenses
    .filter((e) => e.month === monthKey)
    .reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalPayablesAll = payables.reduce((s, p) => s + Number(p.payable_amount || 0), 0)
  const pendingPayables = payables.filter((p) => p.status !== 'paid')
  const pendingPayablesSum = pendingPayables.reduce((s, p) => s + Number(p.payable_amount || 0), 0)
  const netBalanceMonth = monthCollected - monthPayablesTotal - monthOperatingExpenses
  const pendingTeacherLeaves = teacherLeaves.filter((l) => l.status === 'pending').length

  const teacherCount = users.filter((u) => u.role === 'teacher').length
  const zimmadarCount = users.filter((u) => u.role === 'zimmadar').length
  const guardianCount = users.filter((u) => u.role.startsWith('guardian')).length

  // Attendance aggregates from /attendance/monthly
  const attendanceStats = useMemo(() => {
    const valid = monthlyAttendance.filter((r) => r.held_classes > 0 && r.attendance_pct !== null)
    const avgPct =
      valid.length > 0
        ? Math.round(valid.reduce((s, r) => s + Number(r.attendance_pct || 0), 0) / valid.length)
        : null

    const byCourse = new Map<string, { present: number; total: number }>()
    for (const r of monthlyAttendance) {
      if (r.held_classes <= 0) continue
      const key = `${r.course_title} · ${r.batch_name}`
      const cur = byCourse.get(key) ?? { present: 0, total: 0 }
      cur.present += Number(r.present_count || 0) + Number(r.late_count || 0)
      cur.total += Number(r.held_classes || 0)
      byCourse.set(key, cur)
    }
    const courseRates = Array.from(byCourse.entries()).map(([label, v]) => ({
      label,
      pct: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
      held: v.total,
    }))
    return { avgPct, courseRates }
  }, [monthlyAttendance])

  // Attention queue (matches SmartIdara's "Today — needs your attention")
  const attentionRows = [
    unverifiedEnded > 0 && {
      key: 'verify-held',
      icon: <Video className="w-4 h-4 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-100',
      text: `${unverifiedEnded} ended online class${unverifiedEnded > 1 ? 'es' : ''} waiting for Held Verification (attendance locked)`,
      route: '#/classes',
    },
    pendingReports.length > 0 && {
      key: 'reports',
      icon: <FileText className="w-4 h-4 text-orange-600" />,
      iconBg: 'bg-orange-50 border-orange-100',
      text: `${pendingReports.length} class report${pendingReports.length > 1 ? 's' : ''} awaiting Zimmadar review`,
      route: '#/reports',
    },
    pendingTickets.length > 0 && {
      key: 'tickets',
      icon: <Megaphone className="w-4 h-4 text-rose-600" />,
      iconBg: 'bg-rose-50 border-rose-100',
      text: `${pendingTickets.length}টি সক্রিয় অভিভাবক সাপোর্ট টিকেট ও লাইভ চ্যাট মেসেজ`,
      route: '#/tickets',
    },
    admissionQueueCount > 0 && {
      key: 'admissions',
      icon: <UserPlus className="w-4 h-4 text-primary-700" />,
      iconBg: 'bg-primary-50 border-primary-100',
      text: `${admissionQueueCount} new online admission application${admissionQueueCount > 1 ? 's' : ''} to review`,
      route: '#/admissions',
    },
    openFollowupCount > 0 && {
      key: 'followups',
      icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
      iconBg: 'bg-red-50 border-red-100',
      text: `${openFollowupCount} open absence follow-up case${openFollowupCount > 1 ? 's' : ''} (7-class rule)`,
      route: '#/followups',
    },
    leaveQueueCount > 0 && {
      key: 'leaves',
      icon: <CalendarOff className="w-4 h-4 text-amber-700" />,
      iconBg: 'bg-amber-50 border-amber-100',
      text: `${leaveQueueCount} student leave request${leaveQueueCount > 1 ? 's' : ''} awaiting decision`,
      route: '#/leaves',
    },
    pendingTeacherLeaves > 0 && {
      key: 'teacher-leaves',
      icon: <UserCheck className="w-4 h-4 text-indigo-700" />,
      iconBg: 'bg-indigo-50 border-indigo-100',
      text: `${pendingTeacherLeaves} teacher leave / proxy request${pendingTeacherLeaves > 1 ? 's' : ''} awaiting approval`,
      route: '#/teachers',
    },
    unpaidInvoices.length > 0 && {
      key: 'invoices',
      icon: <Receipt className="w-4 h-4 text-rose-600" />,
      iconBg: 'bg-rose-50 border-rose-100',
      text: `${unpaidInvoices.length} unpaid / partially paid tuition invoice${unpaidInvoices.length > 1 ? 's' : ''} (৳ ${totalOutstanding.toLocaleString()})`,
      route: '#/invoices',
    },
  ].filter(Boolean) as Array<{
    key: string
    icon: React.ReactNode
    iconBg: string
    text: string
    route: string
  }>

  // ── Period Trend Datasets (6m / 12m toggleable) ───────────
  const periodMonths = useMemo(
    () => buildRecentMonths(monthKey, trendPeriod === '6m' ? 6 : 12),
    [monthKey, trendPeriod],
  )

  const feeMonthlySeries = useMemo(
    () =>
      periodMonths.map((ym) => {
        const list = invoices.filter((i) => i.billing_month === ym)
        return {
          ym,
          label: shortMonthLabel(ym),
          primary: list.reduce((s, i) => s + Number(i.amount_due || 0), 0),
          secondary: list.reduce((s, i) => s + Number(i.amount_paid || 0), 0),
        }
      }),
    [periodMonths, invoices],
  )

  const cashflowSeries = useMemo(
    () =>
      periodMonths.map((ym) => {
        const collected = invoices
          .filter((i) => i.billing_month === ym)
          .reduce((s, i) => s + Number(i.amount_paid || 0), 0)
        const payOut = payables
          .filter((p) => p.billing_month === ym)
          .reduce((s, p) => s + Number(p.payable_amount || 0), 0)
        return {
          ym,
          label: shortMonthLabel(ym),
          primary: collected,
          secondary: payOut,
        }
      }),
    [periodMonths, invoices, payables],
  )

  const enrolmentMonthlySeries = useMemo(
    () =>
      periodMonths.map((ym) => {
        const count = enrollments.filter((e) => {
          const dt = (e.start_date || e.created_at || '').slice(0, 7)
          return dt <= ym && e.status === 'active'
        }).length
        return {
          ym,
          label: shortMonthLabel(ym),
          value: count || (ym === monthKey ? summary?.active_enrollments ?? 0 : 0),
        }
      }),
    [periodMonths, enrollments, monthKey, summary],
  )

  const studentsByCourse = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of enrollments) {
      if (e.status !== 'active') continue
      const key = `${e.course_title || 'Course'} · ${e.batch_name || `Batch #${e.batch_id}`}`
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({
        label,
        value: count,
        displayValue: `${count}`,
        color: 'bg-primary-700',
      }))
  }, [enrollments])

  const recentPayments = useMemo(
    () => invoices.filter((i) => Number(i.amount_paid || 0) > 0).slice(0, 6),
    [invoices],
  )

  const resourceCoursesCount = useMemo(
    () => new Set(resources.map((r) => r.course_title).filter(Boolean)).size,
    [resources],
  )

  const firstName = user.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const attentionSignature = attentionRows.map((r) => `${r.key}:${r.text}:${r.route}`).join('|')
  useEffect(() => {
    publishAttentionQueue(attentionRows.map(({ key, text, route }) => ({ key, text, route })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attentionSignature])

  useEffect(() => {
    if (attentionQueue.docked) {
      setAttentionClosing(false)
      return
    }
    if (attentionPaused || attentionClosing) return
    const timer = window.setTimeout(() => {
      setAttentionClosing(true)
    }, 30000)
    return () => window.clearTimeout(timer)
  }, [attentionQueue.docked, attentionPaused, attentionClosing])

  useEffect(() => {
    if (!attentionClosing) return
    const timer = window.setTimeout(() => {
      setAttentionDocked(true)
      setAttentionClosing(false)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [attentionClosing])

  const firstWeekday = (new Date(calYear, calMonth, 1).getDay() + 1) % 7
  const calLabel = new Date(calYear, calMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6" data-dashboard="smartidara-complete">
      {/* ── 1. SmartIdara Hero Welcome Banner (auto-dismisses after 10s or via × button) ── */}
      {welcomeBanner.visible && (
      <div
        onMouseEnter={welcomeBanner.pause}
        onMouseLeave={welcomeBanner.resume}
        className={`bg-royal-gradient rounded-2xl pl-5 sm:pl-7 pr-12 sm:pr-14 py-5 sm:py-6 text-white relative overflow-hidden shadow-sm transition-all duration-300 ${
          welcomeBanner.closing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="absolute right-24 -top-12 w-56 h-56 rounded-full bg-teal-400/15 blur-xl pointer-events-none" />
        <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />

        <button
          type="button"
          onClick={welcomeBanner.dismiss}
          aria-label="Dismiss welcome banner"
          title="Dismiss"
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-teal-300 flex-shrink-0" /> {greeting}, {firstName}
            </h2>
            <p className="text-white/90 text-sm mt-1">
              {getDhakaToday()} · IOM Itqaan Academy (Online Operations)
            </p>
            <button
              type="button"
              onClick={() => document.getElementById('attention-card')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 text-white/95 hover:text-white cursor-pointer"
            >
              {attentionRows.length > 0
                ? `${attentionRows.length} thing${attentionRows.length > 1 ? 's' : ''} need your attention today. ↓`
                : 'All academy action queues are clear today.'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 xl:min-w-[490px] items-stretch">
            {isSuperAdminRole && (
              <button
                type="button"
                onClick={() => navigateTo('#/executive')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-colors cursor-pointer text-center"
              >
                <FileText className="w-4 h-4 flex-shrink-0" /> Executive Reports
              </button>
            )}
            <button
              type="button"
              onClick={() => navigateTo('#/approvals')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-colors cursor-pointer text-center"
            >
              <ClipboardCheck className="w-4 h-4 flex-shrink-0" /> Approval Center
            </button>
            {isSuperAdminRole ? (
              <button
                type="button"
                onClick={() => navigateTo('#/governance')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-colors cursor-pointer text-center"
              >
                <GraduationCap className="w-4 h-4 flex-shrink-0" /> Observer &amp; Sanad
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateTo('#/tickets')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-colors cursor-pointer text-center"
              >
                <Megaphone className="w-4 h-4 flex-shrink-0" /> Support Tickets
              </button>
            )}
            <button
              type="button"
              onClick={() => navigateTo('#/calendar')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-colors cursor-pointer text-center"
            >
              <Plus className="w-4 h-4 flex-shrink-0" /> Schedule Class
            </button>
            <button
              type="button"
              onClick={() => navigateTo('#/invoices')}
              className="col-span-2 sm:col-span-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-xl bg-white text-primary-900 hover:bg-primary-50 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Receipt className="w-4 h-4 flex-shrink-0" /> Invoices &amp; Receipts
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ── 1b. Live Monitor (Principal / Zimmadar Supervision) (auto-dismisses after 20s or via × button) ── */}
      {liveMonitorBanner.visible && (() => {
        const liveNowClasses = monthClasses.filter((c) => c.status === 'in_progress')
        return (
          <div
            onMouseEnter={liveMonitorBanner.pause}
            onMouseLeave={liveMonitorBanner.resume}
            className={`transition-all duration-300 ${
              liveMonitorBanner.closing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
            }`}
          >
          <Card className="rounded-2xl border-emerald-500/30 bg-emerald-50/20">
            <CardHeader className="pb-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2 w-full">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="relative flex h-2.5 w-2.5">
                    {liveNowClasses.length > 0 && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        liveNowClasses.length > 0 ? 'bg-emerald-600' : 'bg-slate-400'
                      }`}
                    />
                  </span>
                  {isSuperAdminRole ? 'Live Classrooms Right Now — Principal Silent Monitor' : 'Live Classrooms Right Now — Zimmadar Monitor'}
                  <Badge variant={liveNowClasses.length > 0 ? 'live' : 'neutral'}>
                    {liveNowClasses.length} Live
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => navigateTo(isSuperAdminRole ? '#/governance' : '#/classes')}
                    className="text-xs font-semibold text-primary-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {isSuperAdminRole ? 'Open Live Observer & Syllabus Console' : "View Today's Classes"} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={liveMonitorBanner.dismiss}
                    aria-label="Dismiss live classrooms banner"
                    title="Dismiss"
                    className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300/80 text-slate-600 hover:text-heading flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {liveNowClasses.length === 0 ? (
                <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-muted bg-surface/80 rounded-xl px-4 py-3 border border-border">
                  <span>No online classroom sessions are currently in progress. Teachers launch Zoom/Meet rooms from Today&apos;s Classes.</span>
                  <Button size="sm" variant="outline" onClick={() => navigateTo('#/classes')}>
                    <Video className="w-3.5 h-3.5" /> View Today&apos;s Classes ({todayClasses.length})
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {liveNowClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3.5 rounded-xl bg-surface border border-emerald-500/40 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-heading truncate">{cls.course_title}</p>
                        <p className="text-xs text-muted truncate">
                          {cls.batch_name} · {cls.delivery_mode} · {formatDhakaTime(cls.actual_start || cls.scheduled_start)}
                        </p>
                      </div>
                      {cls.meeting_url ? (
                        <a
                          href={cls.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Join Silently
                        </a>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => navigateTo('#/classes')}>
                          Inspect
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )
      })()}

      {/* ── 2. "Today — needs your attention" Action Queue (auto-docks to top Bell after 30s) ──────── */}
      {!attentionQueue.docked && (
      <div
        onMouseEnter={() => setAttentionPaused(true)}
        onMouseLeave={() => setAttentionPaused(false)}
        className={`transition-all duration-300 ${
          attentionClosing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
      <Card id="attention-card" className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="w-4 h-4 text-primary-700" />
            Today — needs your attention
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {attentionRows.length}
            </span>
            <button
              type="button"
              onClick={() => setAttentionClosing(true)}
              aria-label="Move attention queue to notifications"
              title="Move to top notification bell"
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-heading flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {loadingClasses ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : attentionRows.length === 0 ? (
            <div className="rounded-xl border border-border bg-bg/50 px-4 py-5 text-center text-sm text-muted">
              All caught up — no overdue reports, unverified sessions, or pending items right now.
            </div>
          ) : (
            attentionRows.map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => navigateTo(row.route)}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl border border-border bg-bg/50 hover:bg-primary-50/60 hover:border-primary-200 transition-colors text-left group cursor-pointer"
              >
                <span className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${row.iconBg}`}>
                  {row.icon}
                </span>
                <span className="flex-1 text-sm font-medium text-heading">{row.text}</span>
                <span className="text-xs font-semibold text-primary-700 group-hover:translate-x-0.5 transition-transform">
                  Open →
                </span>
              </button>
            ))
          )}
        </CardContent>
      </Card>
      </div>
      )}

      {/* ── 3. SmartIdara 6-Card Top KPI Strip (2 × 3) ──────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        <SmartKpiCard
          label="ACTIVE STUDENTS"
          value={summary?.students ?? '—'}
          sub={`${summary?.group_enrollments ?? 0} Group · ${summary?.one_to_one_enrollments ?? 0} Native 1:1`}
          footerLink={{ label: 'Students & enrollments →', route: '#/students' }}
          icon={<Users className="w-5 h-5 text-primary-700" />}
          iconBg="bg-primary-50"
          loading={loadingSummary}
        />
        <SmartKpiCard
          label="ATTENDANCE & CLASSES TODAY"
          value={todayClasses.length > 0 ? `${todayClasses.length} live` : (attendanceStats.avgPct !== null ? `${attendanceStats.avgPct}%` : '—')}
          sub={`${todayClasses.filter((c) => c.status === 'ended').length} ended · ${todayClasses.filter((c) => c.status === 'in_progress').length} live now · Monthly avg ${attendanceStats.avgPct ?? '—'}%`}
          footerLink={{ label: 'Mark attendance →', route: '#/attendance' }}
          icon={<Video className="w-5 h-5 text-teal-700" />}
          iconBg="bg-teal-50"
          loading={loadingClasses}
        />
        <SmartKpiCard
          label={`FEE COLLECTED · ${monthKey}`}
          value={`৳ ${monthCollected.toLocaleString()}`}
          badge={monthBilled > 0 ? `${monthCollectionPct}%` : undefined}
          sub={`${monthCollectionPct}% of ৳ ${monthBilled.toLocaleString()} billed this month`}
          footerLink={{ label: 'Open billing →', route: '#/invoices' }}
          icon={<Receipt className="w-5 h-5 text-emerald-700" />}
          iconBg="bg-emerald-50"
          loading={false}
        />
        <SmartKpiCard
          label="FEE PENDING (ALL MONTHS)"
          value={`৳ ${totalOutstanding.toLocaleString()}`}
          sub={`${unpaidInvoices.length} unpaid / partial invoice${unpaidInvoices.length === 1 ? '' : 's'}`}
          footerLink={{ label: 'See pending invoices →', route: '#/invoices' }}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          iconBg="bg-rose-50"
          loading={false}
        />
        <SmartKpiCard
          label={`NET BALANCE · ${monthKey}`}
          value={`৳ ${netBalanceMonth.toLocaleString()}`}
          sub={`Collected ৳ ${monthCollected.toLocaleString()} · Payables ৳ ${monthPayablesTotal.toLocaleString()}${monthOperatingExpenses > 0 ? ` · Exp ৳ ${monthOperatingExpenses.toLocaleString()}` : ''}`}
          footerLink={{ label: 'Expenses & P&L →', route: '#/expenses' }}
          icon={<Wallet className="w-5 h-5 text-primary-700" />}
          iconBg="bg-primary-50"
          loading={false}
        />
        <SmartKpiCard
          label="TEACHERS & STAFF"
          value={users.length > 0 ? users.length : summary?.active_enrollments ?? '—'}
          sub={
            users.length > 0
              ? `${teacherCount} Teachers · ${zimmadarCount} Zimmadars`
              : `${summary?.active_enrollments ?? 0} active enrollments`
          }
          footerLink={{ label: 'Academy directory →', route: '#/settings' }}
          icon={<UserCheck className="w-5 h-5 text-amber-700" />}
          iconBg="bg-amber-50"
          loading={false}
        />
      </div>

      {/* ── 3b. Monthly Star Students Banner / Leaderboard Preview (Super Admin & Zimmadar) (auto-dismisses after 20s or via × button) ── */}
      {starStudentsBanner.visible && (
        <div
          onMouseEnter={starStudentsBanner.pause}
          onMouseLeave={starStudentsBanner.resume}
          className={`transition-all duration-300 ${
            starStudentsBanner.closing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        >
          <Card className="rounded-2xl border-amber-300/80 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-950">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Monthly Star Students &amp; Honor Roll · {monthKey}
                </CardTitle>
                <p className="text-xs text-muted mt-0.5">
                  Top evaluated students across Group Batches &amp; 1:1 Hifz tracks based on attendance, daily sabaq, and assessments.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigateTo(isSuperAdminRole ? '#/governance' : '#/approvals')}
                  className="text-xs font-semibold text-primary-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {isSuperAdminRole ? 'Manage & Publish to Web' : 'Review & Recommend'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={starStudentsBanner.dismiss}
                  aria-label="Dismiss monthly star students banner"
                  title="Dismiss"
                  className="w-7 h-7 rounded-full bg-amber-100/80 hover:bg-amber-200 text-amber-900 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-3.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {starStudents.map((star) => (
                  <div
                    key={star.id}
                    className="p-3.5 rounded-xl border border-amber-200/70 bg-surface shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full font-black flex items-center justify-center text-xs shadow-xs ${
                          star.rank === 1
                            ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                            : star.rank === 2
                              ? 'bg-slate-200 text-slate-800 ring-2 ring-slate-300'
                              : 'bg-amber-700/20 text-amber-900 ring-2 ring-amber-700/30'
                        }`}
                      >
                        {star.rank}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-heading truncate max-w-[170px]">{star.student_name}</p>
                        <p className="text-xs text-muted truncate max-w-[170px]">{star.batch_name}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-sm text-primary-700">{star.score}/১০০</span>
                      <p className="text-[10px] text-muted">{star.grade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 4. SmartIdara Operational 4-Card Strip ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
        {/* Teachers & Payroll */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Teachers &amp; payroll</CardTitle>
            <button type="button" onClick={() => navigateTo('#/payables')} className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer">
              All payables →
            </button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-3 text-xs">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted">Active academy staff</span>
                <span className="font-bold text-heading tabular-nums">{users.length || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted">Total calculated payables</span>
                <span className="font-bold text-heading tabular-nums">৳ {totalPayablesAll.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted">Pending teacher payouts</span>
                <span className="font-bold text-amber-700 tabular-nums">
                  ৳ {pendingPayablesSum.toLocaleString()} ({pendingPayables.length} slips)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('#/payables')}
              className="w-full mt-auto py-2.5 rounded-xl bg-primary-50 text-primary-700 font-semibold hover:bg-primary-100 transition-colors cursor-pointer"
            >
              Calculate / Pay Now →
            </button>
          </CardContent>
        </Card>

        {/* Coming Up (Terms & Upcoming Live Classes) */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>Coming up</CardTitle>
            <button type="button" onClick={() => navigateTo('#/calendar')} className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer">
              Calendar →
            </button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-2 text-xs">
            <div className="space-y-2">
              {academicSessions.slice(0, 2).map((t) => (
                <div key={t.id} className="p-2.5 rounded-xl bg-bg border border-border flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-heading truncate">{t.label}</p>
                    <p className="text-xs text-muted">{t.start_date} → {t.end_date}</p>
                  </div>
                  <Badge variant="primary">Term</Badge>
                </div>
              ))}
              {upcomingClasses.slice(0, 2).map((c) => (
                <div key={c.id} className="p-2.5 rounded-xl bg-bg border border-border flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-heading truncate">{c.course_title}</p>
                    <p className="text-xs text-muted">{c.scheduled_start.slice(5, 10)} · {formatDhakaTime(c.scheduled_start)}</p>
                  </div>
                  <Badge variant="scheduled">{c.delivery_mode}</Badge>
                </div>
              ))}
              {academicSessions.length === 0 && upcomingClasses.length === 0 && (
                <p className="text-muted py-4 text-center">No upcoming events or classes scheduled.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leaves & Absence Care This Month (Avatar List) */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              Leaves &amp; care
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-800 tabular-nums">
                {leaves.length + openFollowupCount}
              </span>
            </CardTitle>
            <button type="button" onClick={() => navigateTo('#/leaves')} className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer">
              View all →
            </button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-2.5">
            <div className="space-y-2.5">
              {leaves.slice(0, 3).map((l) => (
                <div key={`lv-${l.id}`} className="flex items-center gap-2.5 text-xs">
                  <AvatarInitials name={l.student_name || `Student ${l.enrollment_id}`} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-heading truncate">{l.student_name || `Enrollment #${l.enrollment_id}`}</p>
                    <p className="text-xs text-muted truncate">{l.start_date} · Leave ({l.status})</p>
                  </div>
                </div>
              ))}
              {openFollowups.slice(0, 2).map((f) => (
                <div key={`fu-${f.id}`} className="flex items-center gap-2.5 text-xs">
                  <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {initials(f.student_name || `E${f.enrollment_id}`)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-heading truncate">{f.student_name || `Enrollment #${f.enrollment_id}`}</p>
                    <p className="text-xs text-red-600 truncate">Follow-up · {f.course_title || '7-class rule'}</p>
                  </div>
                </div>
              ))}
              {leaves.length === 0 && openFollowups.length === 0 && (
                <p className="text-xs text-muted py-4 text-center">No leaves or open follow-ups.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Portal & Telegram Usage (SmartIdara App usage equivalent) */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-primary-700" /> Portal &amp; Bot usage
            </CardTitle>
            <button type="button" onClick={() => navigateTo('#/communications')} className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer">
              Alerts →
            </button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between gap-3 text-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted">Telegram Bot</span>
                <Badge variant={telegramStatus?.linked ? 'approved' : 'pending'}>
                  {telegramStatus?.linked ? 'Linked' : telegramStatus?.configuration_required ? 'Ready to configure' : 'Not linked'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Guardians / Staff online</span>
                <span className="font-bold text-heading tabular-nums">
                  {guardianCount} Parents · {teacherCount + zimmadarCount} Academic
                </span>
              </div>
            </div>
            <p className="mt-auto text-xs text-muted bg-primary-50/70 border border-primary-100 rounded-xl p-3 leading-relaxed">
              Tip: share payment receipts and Guardian Portal links via WhatsApp/Telegram to speed up tuition renewals.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 5. Mini Academic Calendar + Today's Live Sessions ──── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <Card className="xl:col-span-6 h-full flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="w-4 h-4 text-primary-700" /> Academic Calendar
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(calYear, calMonth - 1, 1)
                  setCalYear(d.getFullYear())
                  setCalMonth(d.getMonth())
                }}
                className="p-1 rounded-md border border-border hover:bg-primary-50 cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-heading min-w-28 text-center">{calLabel}</span>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(calYear, calMonth + 1, 1)
                  setCalYear(d.getFullYear())
                  setCalMonth(d.getMonth())
                }}
                className="p-1 rounded-md border border-border hover:bg-primary-50 cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-2 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase">
                {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
                  <div key={d} className={`py-1 ${i === 6 ? 'text-rose-600' : 'text-muted'}`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-8" />
                ))}
                {Array.from({ length: daysInCalMonth }).map((_, idx) => {
                  const dayNum = idx + 1
                  const dateStr = `${calMonthKey}-${String(dayNum).padStart(2, '0')}`
                  const isFriday = new Date(calYear, calMonth, dayNum).getDay() === 5
                  const count = classCountByDay.get(dateStr) ?? 0
                  const isToday = dateStr === today
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => navigateTo(`#/calendar?date=${dateStr}`)}
                      className={`h-8 rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors cursor-pointer ${
                        isToday
                          ? 'bg-primary-700 text-white font-bold'
                          : isFriday
                            ? 'bg-rose-50/80 text-rose-700 hover:bg-rose-100/80'
                            : count > 0
                              ? 'bg-primary-50 text-primary-900 hover:bg-primary-100'
                              : 'hover:bg-bg text-body'
                      }`}
                      title={count > 0 ? `${count} live classes on ${dateStr}` : dateStr}
                    >
                      <span>{dayNum}</span>
                      {count > 0 && (
                        <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-teal-300' : 'bg-teal-600'}`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-[11px] text-muted">Click any date to schedule/view online sessions</span>
              <Button size="sm" variant="ghost" onClick={() => navigateTo('#/calendar')}>
                Full Calendar <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-6 h-full flex flex-col">
          <CardHeader>
            <div>
              <CardTitle className="text-base">Today's Live Online Sessions ({todayClasses.length})</CardTitle>
              <p className="text-xs text-muted mt-0.5">Direct Zoom/Meet room launch & real-time lifecycle state</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigateTo('#/classes')}>
              All classes <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5 flex-1 flex flex-col">
            {todayClasses.length === 0 ? (
              <div className="flex-1 flex items-center justify-center gap-2 text-xs text-muted py-12">
                <BookOpen className="w-4 h-4 opacity-40" /> No classes scheduled today ({today}).
              </div>
            ) : (
              todayClasses.slice(0, 5).map((cls) => {
                const cap = deriveClassCapabilities(cls)
                return (
                  <div key={cls.id} data-entity="class_session" data-state={cap.status} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-bg border border-border">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-heading truncate">{cls.course_title}</p>
                      <p className="text-xs text-muted truncate">
                        {cls.batch_name} · {cls.delivery_mode} · {formatDhakaTime(cls.scheduled_start)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={cap.badgeVariant}>{cap.label}</Badge>
                      {cls.meeting_url && (
                        <a
                          href={cls.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 text-xs font-semibold hover:bg-teal-200"
                        >
                          <ExternalLink className="w-3 h-3" /> {cls.status === 'in_progress' ? 'Join Silently' : 'Join'}
                        </a>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 6. "Trends & analysis" Modern Minimize/Maximize Section ──────── */}
      <section aria-label="Trends and analysis" className="space-y-5 pt-2">
        <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
            <button
              type="button"
              onClick={() => toggleTrendsExpanded()}
              className="flex items-center gap-3 text-left group cursor-pointer"
            >
              <span className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-heading flex items-center gap-2">
                  Trends &amp; analysis
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bg border border-border text-muted">
                    {trendsExpanded ? 'Expanded' : 'Compact'}
                  </span>
                </h3>
                <p className="text-xs text-muted truncate">
                  Online fee collection, payables, attendance, enrollments, exams, and library metrics
                </p>
              </div>
            </button>

            <div className="flex items-center justify-between sm:justify-end flex-wrap gap-2">
              <div
                role="group"
                aria-label="Period for monthly charts"
                className="inline-flex rounded-xl border border-border bg-bg p-1 gap-1"
              >
                {(['6m', '12m'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={trendPeriod === p}
                    onClick={() => setTrendPeriod(p)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      trendPeriod === p ? 'bg-primary-700 text-white shadow-xs' : 'text-body hover:bg-primary-50'
                    }`}
                  >
                    {p === '6m' ? '6 months' : '12 months'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => toggleTrendsExpanded()}
                aria-expanded={trendsExpanded}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  trendsExpanded
                    ? 'bg-bg border border-border text-heading hover:bg-slate-100'
                    : 'bg-royal-gradient text-white shadow-xs hover:opacity-95'
                }`}
              >
                {trendsExpanded ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" /> Minimize
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" /> Expand Analytics
                  </>
                )}
              </button>
            </div>
          </div>

          {!trendsExpanded && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-border/70">
              {[
                { label: 'Fee Collected', val: `৳ ${monthCollected.toLocaleString()}`, sub: `${monthCollectionPct}% of billed` },
                { label: 'Attendance Avg', val: `${attendanceStats.avgPct ?? 0}%`, sub: `${todayClasses.length} classes today` },
                { label: 'Admissions & 1:1', val: `${admissions.length}`, sub: `${summary?.one_to_one_enrollments ?? 0} active 1:1` },
                { label: 'Teacher Payables', val: `৳ ${monthPayablesTotal.toLocaleString()}`, sub: `${assessments.length} exams tracked` },
                { label: 'Library & Notices', val: `${resources.length} files`, sub: `${announcements.length} notices` },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => toggleTrendsExpanded(true)}
                  className="text-left p-3 rounded-xl bg-bg/80 border border-border/80 hover:border-primary-300 hover:bg-primary-50/40 transition-colors cursor-pointer group"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted truncate">{chip.label}</p>
                  <p className="text-sm sm:text-base font-bold text-heading mt-0.5 tabular-nums">{chip.val}</p>
                  <p className="text-[11px] text-primary-700 font-medium mt-0.5 truncate group-hover:underline">
                    {chip.sub} · View chart →
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

      {trendsExpanded && (
      <div className="space-y-6">

      {/* Row A: Fee Collection + Fee Status Current Month */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-8 h-full">
          <ChartTableCard
            title="Fee collection"
            subtitle="Amount billed vs collected, by billing month"
            headerAction={
              <Button size="sm" variant="outline" onClick={() => navigateTo('#/invoices')}>Manage</Button>
            }
            chart={
              <DualBarChart
                data={feeMonthlySeries}
                primaryLabel="Billed (BDT)"
                secondaryLabel="Collected (BDT)"
                formatValue={(v) => `৳ ${v.toLocaleString()}`}
              />
            }
            table={
              <table className="iom-table">
                <thead>
                  <tr><th>Month</th><th>Billed</th><th>Collected</th></tr>
                </thead>
                <tbody>
                  {feeMonthlySeries.map((row) => (
                    <tr key={row.ym}>
                      <td className="text-xs font-semibold">{row.label}</td>
                      <td className="text-xs">৳ {row.primary.toLocaleString()}</td>
                      <td className="text-xs text-teal-700 font-semibold">৳ {row.secondary.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        </div>

        <Card className="xl:col-span-4 rounded-2xl h-full flex flex-col">
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="text-base">Fee status · {monthKey}</CardTitle>
              <p className="text-xs text-muted mt-0.5">{thisMonthInvoices.length} invoices issued this month</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-full h-3 rounded-full bg-bg overflow-hidden border border-border">
                <div className="h-full bg-royal-gradient transition-all duration-500" style={{ width: `${Math.min(100, monthCollectionPct)}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-bg">
                  <p className="text-muted">Paid</p>
                  <p className="text-base font-bold text-green-700 mt-0.5">
                    {thisMonthInvoices.filter((i) => i.status === 'paid').length}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-bg">
                  <p className="text-muted">Partial</p>
                  <p className="text-base font-bold text-amber-600 mt-0.5">
                    {thisMonthInvoices.filter((i) => i.status === 'partially_paid').length}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-bg">
                  <p className="text-muted">Unpaid</p>
                  <p className="text-base font-bold text-red-600 mt-0.5">
                    {thisMonthInvoices.filter((i) => i.status === 'unpaid').length}
                  </p>
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={() => navigateTo('#/invoices')}>
              Generate / Send Invoices via WhatsApp →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Row B: Revenue vs Teacher Payables + Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-8 h-full">
          <ChartTableCard
            title="Revenue vs teacher payables"
            subtitle="Tuition collected against calculated online teacher payouts"
            chart={
              <DualBarChart
                data={cashflowSeries}
                primaryLabel="Tuition Collected"
                secondaryLabel="Teacher Payables"
                primaryColor="bg-primary-700"
                secondaryColor="bg-amber-500"
                formatValue={(v) => `৳ ${v.toLocaleString()}`}
              />
            }
            table={
              <table className="iom-table">
                <thead>
                  <tr><th>Month</th><th>Collected</th><th>Payables</th><th>Net</th></tr>
                </thead>
                <tbody>
                  {cashflowSeries.map((r) => (
                    <tr key={r.ym}>
                      <td className="text-xs font-semibold">{r.label}</td>
                      <td className="text-xs text-teal-700">৳ {r.primary.toLocaleString()}</td>
                      <td className="text-xs text-amber-700">৳ {r.secondary.toLocaleString()}</td>
                      <td className="text-xs font-bold">৳ {(r.primary - r.secondary).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        </div>

        <div className="xl:col-span-4 h-full">
          <ChartTableCard
            title="Where money goes & fee mix"
            subtitle="Revenue, pending tuition, and teacher compensation breakdown"
            chart={
              <HorizontalBarList
                items={[
                  { label: 'Collected Tuition', value: totalCollectedAll, displayValue: `৳ ${totalCollectedAll.toLocaleString()}`, color: 'bg-teal-600' },
                  { label: 'Pending Tuition', value: totalOutstanding, displayValue: `৳ ${totalOutstanding.toLocaleString()}`, color: 'bg-rose-500' },
                  { label: 'Teacher Payables', value: totalPayablesAll, displayValue: `৳ ${totalPayablesAll.toLocaleString()}`, color: 'bg-primary-700' },
                  { label: 'Pending Payouts', value: pendingPayablesSum, displayValue: `৳ ${pendingPayablesSum.toLocaleString()}`, color: 'bg-amber-500' },
                ]}
              />
            }
            table={
              <table className="iom-table">
                <thead><tr><th>Category</th><th>Amount (BDT)</th></tr></thead>
                <tbody>
                  <tr><td className="text-xs">Collected Tuition</td><td className="text-xs font-bold">৳ {totalCollectedAll.toLocaleString()}</td></tr>
                  <tr><td className="text-xs">Pending Tuition</td><td className="text-xs font-bold">৳ {totalOutstanding.toLocaleString()}</td></tr>
                  <tr><td className="text-xs">Teacher Payables</td><td className="text-xs font-bold">৳ {totalPayablesAll.toLocaleString()}</td></tr>
                  <tr><td className="text-xs">Pending Teacher Payouts</td><td className="text-xs font-bold">৳ {pendingPayablesSum.toLocaleString()}</td></tr>
                </tbody>
              </table>
            }
          />
        </div>
      </div>

      {/* Row C: Student Attendance Trend + Attendance by Batch */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-6 h-full">
          <ChartTableCard
            title="Student attendance"
            subtitle={`Held-class present % in ${monthKey} · average ${attendanceStats.avgPct ?? '—'}%`}
            isEmpty={attendanceStats.courseRates.length === 0}
            emptyMessage="No held-verified attendance records for this month yet."
            chart={
              <SparkAreaChart
                points={attendanceStats.courseRates.slice(0, 8).map((c) => ({
                  label: c.label.split(' · ')[0].slice(0, 12),
                  value: c.pct,
                }))}
                stroke="#0d9488"
                fill="rgba(13, 148, 136, 0.12)"
                suffix="%"
              />
            }
            table={
              <table className="iom-table">
                <thead><tr><th>Course / Batch</th><th>Held Records</th><th>Present %</th></tr></thead>
                <tbody>
                  {attendanceStats.courseRates.map((r, idx) => (
                    <tr key={`${r.label}-${idx}`}>
                      <td className="text-xs font-semibold">{r.label}</td>
                      <td className="text-xs">{r.held}</td>
                      <td className="text-xs font-bold text-teal-700">{r.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        </div>

        <div className="xl:col-span-6 h-full">
          <ChartTableCard
            title="Attendance by batch"
            subtitle={`Present %, ${monthKey}`}
            isEmpty={attendanceStats.courseRates.length === 0}
            emptyMessage="Attendance by batch appears once ended classes are held-verified and marked."
            chart={
              <HorizontalBarList
                maxOverride={100}
                items={attendanceStats.courseRates.slice(0, 8).map((c) => ({
                  label: c.label,
                  value: c.pct,
                  displayValue: `${c.pct}%`,
                  color: c.pct >= 80 ? 'bg-teal-600' : c.pct >= 60 ? 'bg-amber-500' : 'bg-red-500',
                }))}
              />
            }
            table={
              <table className="iom-table">
                <thead><tr><th>Course / Batch</th><th>Present %</th></tr></thead>
                <tbody>
                  {attendanceStats.courseRates.map((r, idx) => (
                    <tr key={`${r.label}-${idx}`}>
                      <td className="text-xs font-semibold">{r.label}</td>
                      <td className="text-xs font-bold">{r.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        </div>
      </div>

      {/* Row D: Enrolment Trend + Students by Course/Batch */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-6 h-full">
          <ChartTableCard
            title="Enrolment trend"
            subtitle={`Active enrollments · ${admissions.length} total admissions tracked`}
            chart={
              <SparkAreaChart
                points={enrolmentMonthlySeries.map((e) => ({ label: e.label, value: e.value }))}
                stroke="#1d4ed8"
                fill="rgba(29, 78, 216, 0.12)"
              />
            }
            table={
              <table className="iom-table">
                <thead><tr><th>Month</th><th>Active Enrollments</th></tr></thead>
                <tbody>
                  {enrolmentMonthlySeries.map((r) => (
                    <tr key={r.ym}>
                      <td className="text-xs font-semibold">{r.label}</td>
                      <td className="text-xs font-bold">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        </div>

        <div className="xl:col-span-6 h-full">
          <ChartTableCard
            title="Students by course & batch"
            subtitle="Active online enrollments per batch"
            isEmpty={studentsByCourse.length === 0}
            emptyMessage="No active batch enrollments found."
            chart={<HorizontalBarList items={studentsByCourse} />}
            table={
              <table className="iom-table">
                <thead><tr><th>Course · Batch</th><th>Active Students</th></tr></thead>
                <tbody>
                  {studentsByCourse.map((r, idx) => (
                    <tr key={`${r.label}-${idx}`}>
                      <td className="text-xs font-semibold">{r.label}</td>
                      <td className="text-xs font-bold">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        </div>
      </div>

      {/* Row E: Exam Performance + Recent Payments + Digital Library & Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Exam / Assessment Performance */}
        <ChartTableCard
          title="Assessments & exams"
          subtitle={`${assessments.filter((a) => a.published).length}/${assessments.length} published online assessments`}
          isEmpty={assessments.length === 0}
          emptyMessage="No online assessments created yet."
          headerAction={
            <Button size="sm" variant="ghost" onClick={() => navigateTo('#/homework')}>Open</Button>
          }
          chart={
            <HorizontalBarList
              items={assessments.slice(0, 6).map((a) => ({
                label: a.title,
                value: Number(a.max_marks || 100),
                displayValue: `${a.max_marks}m`,
                color: a.published ? 'bg-teal-600' : 'bg-amber-500',
              }))}
            />
          }
          table={
            <table className="iom-table">
              <thead><tr><th>Assessment</th><th>Marks</th><th>State</th></tr></thead>
              <tbody>
                {assessments.slice(0, 6).map((a) => (
                  <tr key={a.id}>
                    <td className="text-xs font-semibold">{a.title}</td>
                    <td className="text-xs">{a.max_marks}</td>
                    <td><Badge variant={a.published ? 'approved' : 'pending'}>{a.published ? 'Published' : 'Draft'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />

        {/* Recent Payments */}
        <Card className="rounded-2xl h-full">
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="text-base">Recent payments</CardTitle>
              <p className="text-xs text-muted mt-0.5">Latest tuition fee receipts</p>
            </div>
            <button type="button" onClick={() => navigateTo('#/invoices')} className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer">
              All →
            </button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">No tuition payments recorded yet.</p>
            ) : (
              recentPayments.map((inv) => {
                const meta = getStatusMeta(INVOICE_MACHINE, inv.status)
                return (
                  <div key={inv.id} className="flex items-center gap-2.5 text-xs p-2 rounded-xl bg-bg/60 border border-border/70">
                    <AvatarInitials name={inv.student_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-heading truncate">{inv.student_name}</p>
                      <p className="text-[11px] text-muted truncate">
                        {inv.course_title} · {inv.billing_month}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-teal-700">+৳ {Number(inv.amount_paid).toLocaleString()}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <Badge variant={meta.badgeVariant} className="text-[9px]">{meta.label}</Badge>
                        <a
                          href={buildWhatsAppUrl(buildInvoiceText(inv))}
                          target="_blank"
                          rel="noreferrer"
                          title="Send WhatsApp Receipt"
                          className="text-green-700 hover:text-green-800"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Digital Library & Notices */}
        <div className="flex flex-col gap-5 h-full">
          <Card className="rounded-2xl flex-1">
            <CardHeader className="pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary-700" /> Digital library
                </CardTitle>
                <p className="text-xs text-muted mt-0.5">
                  {resources.length} resources across {resourceCoursesCount} courses
                </p>
              </div>
              <button type="button" onClick={() => navigateTo('#/resources')} className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer">
                Open library →
              </button>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {resources.length === 0 ? (
                <p className="text-muted py-3 text-center">No study PDFs or recordings uploaded yet.</p>
              ) : (
                resources.slice(0, 3).map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-bg border border-border hover:border-primary-200"
                  >
                    <span className="font-semibold text-heading truncate">{r.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-primary-700 flex-shrink-0" />
                  </a>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-primary-700" /> Notices
              </CardTitle>
              <button type="button" onClick={() => navigateTo('#/communications')} className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer">
                Compose →
              </button>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {announcements.length === 0 ? (
                <p className="text-muted py-2 text-center">No recent notices.</p>
              ) : (
                announcements.slice(0, 2).map((a) => (
                  <div key={a.id} className="p-2 rounded-lg bg-bg border border-border">
                    <p className="font-semibold text-heading truncate">{a.title}</p>
                    <p className="text-[11px] text-muted line-clamp-1">{a.body}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => toggleTrendsExpanded(false)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-heading hover:bg-bg cursor-pointer shadow-xs"
        >
          <Minimize2 className="w-3.5 h-3.5" /> Minimize Trends &amp; analysis
        </button>
      </div>
      </div>
      )}
      </section>
    </div>
  )
}

function SmartKpiCard({
  label,
  value,
  sub,
  badge,
  footerLink,
  icon,
  iconBg,
  loading,
}: {
  label: string
  value: string | number
  sub: string
  badge?: string
  footerLink?: { label: string; route: string }
  icon: React.ReactNode
  iconBg: string
  loading: boolean
}) {
  return (
    <div className="h-full bg-surface rounded-2xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-primary-200 transition-colors flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted truncate">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-2" />
          ) : (
            <div className="flex items-baseline gap-2 mt-1.5">
              <p className="text-2xl font-bold text-heading tracking-tight tabular-nums">{value}</p>
              {badge && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                  {badge}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted truncate">{sub}</p>
        {footerLink && (
          <button
            type="button"
            onClick={() => navigateTo(footerLink.route)}
            className="text-xs font-semibold text-primary-700 hover:underline flex-shrink-0 cursor-pointer"
          >
            {footerLink.label}
          </button>
        )}
      </div>
    </div>
  )
}
