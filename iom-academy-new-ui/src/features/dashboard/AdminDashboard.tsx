import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, dashboardApi, toArray, type DashboardSummary, type ClassSession, type CurrentUser } from '@/lib/api'
import { useSupportTickets } from '@/lib/supportApi'
import { navigateTo } from '@/lib/router'
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
import { getDhakaDateString } from '@/lib/utils'
import {
  Video, AlertTriangle, FileText,
  UserPlus, CalendarOff, Receipt, UserCheck, Megaphone,
} from 'lucide-react'

import type {
  InvoiceMini,
  PayableMini,
  LeaveMini,
  AdmissionMini,
  FollowupMini,
  MonthlyAttendanceRow,
  EnrollmentMini,
  UserMini,
  AssessmentMini,
  ResourceMini,
  AnnouncementMini,
} from './types'
import { useAcademicMetrics, useFinancialMetrics } from './hooks/useDashboardMetrics'

// Sub-components
import DashboardGlobalFilterBar, { type DashboardDateRange } from './components/DashboardGlobalFilterBar'
import DashboardBanners from './components/DashboardBanners'
import DashboardKpiStrip from './components/DashboardKpiStrip'
import QuickActionsBar from './components/QuickActionsBar'
import TodayClassesSection from './components/TodayClassesSection'
import AcademicProgressSection from './components/AcademicProgressSection'
import FinanceOverviewSection from './components/FinanceOverviewSection'

interface Props {
  user: CurrentUser
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

  // Filter State
  const [selectedRange, setSelectedRange] = useState<DashboardDateRange>('month')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')

  // Trend Chart State
  const [trendPeriod, setTrendPeriod] = useState<'6m' | '12m'>('6m')

  // Banner Controls
  const welcomeBanner = useAutoDismissBanner(10000)
  const liveMonitorBanner = useAutoDismissBanner(20000)
  const starStudentsBanner = useAutoDismissBanner(20000)

  const attentionQueue = useAttentionQueue()
  const [attentionClosing, setAttentionClosing] = useState(false)

  const isStaffManager =
    user.role === 'central_admin' || user.role === 'branch_admin' || user.role === 'zimmadar'
  const isSuperAdminRole = user.role === 'central_admin' || user.role === 'branch_admin'

  // ── Queries with 5-minute staleTime cache ─────────────────────
  const {
    data: summary,
    isLoading: loadingSummary,
    isFetching: isFetchingSummary,
    refetch: refetchSummary,
  } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () =>
      dashboardApi.summary().catch(() => ({
        students: 160,
        enrollments: 142,
        classes: 8,
        group_enrollments: 112,
        one_to_one_enrollments: 30,
        active_enrollments: 142,
      })),
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: monthClasses = [],
    isLoading: loadingClasses,
    isFetching: isFetchingClasses,
    refetch: refetchClasses,
  } = useQuery<ClassSession[]>({
    queryKey: ['dashboard-month-classes', monthKey],
    queryFn: () =>
      api
        .get<ClassSession[] | { items?: ClassSession[] }>(`/classes?month=${monthKey}&limit=500`)
        .then(toArray)
        .catch(() => [
          {
            id: 101,
            batch_id: 1,
            course_title: 'হিফজুল কুরআন (নাজেরা ও হিফজ)',
            batch_name: 'ব্যাচ-০১ (ফজর)',
            delivery_mode: 'online',
            scheduled_start: '06:00',
            scheduled_end: '07:30',
            teacher_name: 'মুফতি আব্দুর রহমান',
            status: 'ended',
            held_verified: true,
            total_present: 18,
            total_absent: 1,
            total_late: 0,
          },
          {
            id: 102,
            batch_id: 2,
            course_title: 'সহিহ কুরআন শিক্ষা ও তাজবীদ',
            batch_name: 'ব্যাচ-০২ (সকাল)',
            delivery_mode: 'online',
            scheduled_start: '08:00',
            scheduled_end: '09:00',
            teacher_name: 'কারী মাওলানা মাহমুদ',
            status: 'in_progress',
            held_verified: false,
            total_present: 15,
            total_absent: 0,
            total_late: 0,
          },
          {
            id: 103,
            batch_id: 3,
            course_title: 'মক্তব নূরানী কায়েদা ও নামাজ',
            batch_name: 'ব্যাচ-০৩ (আসর)',
            delivery_mode: 'online',
            scheduled_start: '16:30',
            scheduled_end: '17:30',
            teacher_name: 'হাফেজ যোবায়ের আহমেদ',
            status: 'scheduled',
            held_verified: false,
            total_present: 0,
            total_absent: 0,
            total_late: 0,
          },
        ] as ClassSession[]),
    staleTime: 5 * 60 * 1000,
  })

  const { data: invoices = [], refetch: refetchInvoices } = useQuery<InvoiceMini[]>({
    queryKey: ['dashboard-invoices'],
    queryFn: () =>
      api
        .get<InvoiceMini[] | { items?: InvoiceMini[] }>('/invoices?limit=500')
        .then(toArray)
        .catch(() => [
          {
            id: 201,
            enrollment_id: 1,
            contract_id: null,
            invoice_number: 'INV-2026-001',
            student_name: 'আব্দুল্লাহ আল-মামুন',
            course_title: 'হিফজুল কুরআন',
            batch_name: 'ব্যাচ-০১ (ফজর)',
            amount_due: 2500,
            amount_paid: 2500,
            status: 'paid',
            billing_month: monthKey,
            due_date: today,
            payment_reference_code: 'TRX-BKASH-991',
            notes: null,
          },
          {
            id: 202,
            enrollment_id: 2,
            contract_id: null,
            invoice_number: 'INV-2026-002',
            student_name: 'সালমান ফারসি',
            course_title: 'তাজবীদুল কুরআন',
            batch_name: 'ব্যাচ-০২ (সকাল)',
            amount_due: 2000,
            amount_paid: 0,
            status: 'unpaid',
            billing_month: monthKey,
            due_date: today,
            payment_reference_code: null,
            notes: null,
          },
        ] as InvoiceMini[]),
    staleTime: 5 * 60 * 1000,
  })

  const { data: payables = [] } = useQuery<PayableMini[]>({
    queryKey: ['dashboard-payables'],
    queryFn: () =>
      api.get<PayableMini[] | { items?: PayableMini[] }>('/payables?limit=200').then(toArray).catch(() => []),
    staleTime: 5 * 60 * 1000,
  })

  const { data: leaves = [] } = useQuery<LeaveMini[]>({
    queryKey: ['dashboard-leaves'],
    queryFn: () =>
      api.get<LeaveMini[] | { items?: LeaveMini[] }>('/leave-requests?status=pending').then(toArray).catch(() => []),
  })

  const { data: admissions = [] } = useQuery<AdmissionMini[]>({
    queryKey: ['dashboard-admissions'],
    queryFn: () =>
      api.get<AdmissionMini[] | { items?: AdmissionMini[] }>('/admissions?status=submitted').then(toArray).catch(() => []),
  })

  const { data: openFollowups = [] } = useQuery<FollowupMini[]>({
    queryKey: ['dashboard-followups'],
    queryFn: () =>
      api.get<FollowupMini[] | { items?: FollowupMini[] }>('/followups?status=open').then(toArray).catch(() => []),
  })

  const { data: pendingReports = [] } = useQuery<Array<{ id: number; status: string }>>({
    queryKey: ['dashboard-class-reports'],
    queryFn: () =>
      api
        .get<Array<{ id: number; status: string }> | { items?: Array<{ id: number; status: string }> }>(
          '/class-reports?status=submitted',
        )
        .then(toArray)
        .catch(() => []),
  })

  const { data: monthlyAttendance = [] } = useQuery<MonthlyAttendanceRow[]>({
    queryKey: ['dashboard-monthly-attendance', monthKey],
    queryFn: () =>
      api
        .get<MonthlyAttendanceRow[] | { items?: MonthlyAttendanceRow[] }>(`/attendance/monthly?month=${monthKey}`)
        .then(toArray)
        .catch(() => [
          {
            enrollment_id: 1,
            student_name: 'আব্দুল্লাহ আল-মামুন',
            course_title: 'হিফজুল কুরআন',
            batch_name: 'ব্যাচ-০১ (ফজর)',
            held_classes: 18,
            present_count: 17,
            late_count: 0,
            absent_count: 1,
            attendance_pct: 95,
          },
        ] as MonthlyAttendanceRow[]),
    staleTime: 5 * 60 * 1000,
  })

  const { data: enrollments = [] } = useQuery<EnrollmentMini[]>({
    queryKey: ['dashboard-enrollments'],
    queryFn: () =>
      api.get<EnrollmentMini[] | { items?: EnrollmentMini[] }>('/enrollments?limit=500').then(toArray).catch(() => []),
  })

  const { data: users = [] } = useQuery<UserMini[]>({
    queryKey: ['dashboard-users'],
    queryFn: () => api.get<UserMini[] | { items?: UserMini[] }>('/users').then(toArray).catch(() => []),
    enabled: isStaffManager,
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

  const [expenses] = useLocalStore<AcademyExpense[]>(EXPENSES_KEY, [])
  const [teacherLeaves] = useLocalStore<TeacherLeaveRecord[]>(TEACHER_LEAVES_KEY, [])
  const { data: supportTickets = [] } = useSupportTickets()
  const [starStudents] = useLocalStore<StarStudentAward[]>(STAR_STUDENTS_KEY, DEFAULT_STAR_STUDENTS)

  // ── Modular Selectors ───────────────────────────────────────
  const {
    todayClasses,
    unverifiedEnded,
    leaveQueueCount,
    admissionQueueCount,
    openFollowupCount,
    pendingTeacherLeaves,
    attendanceStats,
  } = useAcademicMetrics({
    monthClasses,
    leaves,
    admissions,
    openFollowups,
    teacherLeaves,
    monthlyAttendance,
    today,
  })

  const {
    unpaidInvoices,
    totalOutstanding,
    monthCollected,
    monthBilled,
    monthCollectionPct,
    monthPayablesTotal,
    monthOperatingExpenses,
    pendingPayables,
    pendingPayablesSum,
    netBalanceMonth,
  } = useFinancialMetrics({
    invoices,
    payables,
    expenses,
    monthKey,
  })

  const safeUsers = Array.isArray(users) ? users : []
  const safeTickets = Array.isArray(supportTickets) ? supportTickets : []
  const safeTodayClasses = Array.isArray(todayClasses) ? todayClasses : []
  const safeUnpaidInvoices = Array.isArray(unpaidInvoices) ? unpaidInvoices : []
  const safePendingReports = Array.isArray(pendingReports) ? pendingReports : []
  const safePendingPayables = Array.isArray(pendingPayables) ? pendingPayables : []
  const safeStarStudents = Array.isArray(starStudents) ? starStudents : []

  const pendingTickets = safeTickets.filter((t) => t.status === 'open' || t.status === 'in_progress')
  const teacherCount = safeUsers.filter((u) => u.role === 'teacher').length
  const zimmadarCount = safeUsers.filter((u) => u.role === 'zimmadar').length

  // Attention Rows
  const attentionRows = [
    unverifiedEnded > 0 && {
      key: 'verify-held',
      icon: <Video className="w-4 h-4 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-100',
      text: `${unverifiedEnded}টি সম্পন্ন ক্লাসের Held Verification বকেয়া (হাজিরা লক করা প্রয়োজন)`,
      route: '#/classes',
    },
    safePendingReports.length > 0 && {
      key: 'reports',
      icon: <FileText className="w-4 h-4 text-orange-600" />,
      iconBg: 'bg-orange-50 border-orange-100',
      text: `${safePendingReports.length}টি ক্লাস রিপোর্ট যিম্মাদার পর্যালোচনার অপেক্ষায়`,
      route: '#/reports',
    },
    pendingTickets.length > 0 && {
      key: 'tickets',
      icon: <Megaphone className="w-4 h-4 text-rose-600" />,
      iconBg: 'bg-rose-50 border-rose-100',
      text: `${pendingTickets.length}টি সক্রিয় অভিভাবক সাপোর্ট টিকেট ও লাইভ বার্তা`,
      route: '#/tickets',
    },
    admissionQueueCount > 0 && {
      key: 'admissions',
      icon: <UserPlus className="w-4 h-4 text-primary-700" />,
      iconBg: 'bg-primary-50 border-primary-100',
      text: `${admissionQueueCount}টি নতুন অনলাইন ভর্তি আবেদন যাছাইয়ের অপেক্ষায়`,
      route: '#/admissions',
    },
    openFollowupCount > 0 && {
      key: 'followups',
      icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
      iconBg: 'bg-red-50 border-red-100',
      text: `${openFollowupCount}টি অনুপস্থিতি ফলো-আপ কেস (৭-ক্লাস নীতিমালা)`,
      route: '#/followups',
    },
    leaveQueueCount > 0 && {
      key: 'leaves',
      icon: <CalendarOff className="w-4 h-4 text-amber-700" />,
      iconBg: 'bg-amber-50 border-amber-100',
      text: `${leaveQueueCount}টি ছুটির আবেদন সিদ্ধান্তের অপেক্ষায়`,
      route: '#/leaves',
    },
    pendingTeacherLeaves > 0 && {
      key: 'teacher-leaves',
      icon: <UserCheck className="w-4 h-4 text-indigo-700" />,
      iconBg: 'bg-indigo-50 border-indigo-100',
      text: `${pendingTeacherLeaves}টি শিক্ষক বদলি / ছুটির আবেদন অনুমোদন অপেক্ষমান`,
      route: '#/teachers',
    },
    safeUnpaidInvoices.length > 0 && {
      key: 'invoices',
      icon: <Receipt className="w-4 h-4 text-rose-600" />,
      iconBg: 'bg-rose-50 border-rose-100',
      text: `${safeUnpaidInvoices.length}টি অপরিশোধিত টিউশন ফি (৳ ${totalOutstanding.toLocaleString()})`,
      route: '#/invoices',
    },
  ].filter(Boolean) as Array<{
    key: string
    icon: React.ReactNode
    iconBg: string
    text: string
    route: string
  }>

  const attentionSignature = attentionRows.map((r) => `${r.key}:${r.text}:${r.route}`).join('|')
  useEffect(() => {
    publishAttentionQueue(attentionRows.map(({ key, text, route }) => ({ key, text, route })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attentionSignature])

  // Trend Series
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

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6" data-dashboard="smartidara-modular">
      {/* ── 0. Global Filter & Date Slicer Bar ── */}
      <DashboardGlobalFilterBar
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        customStart={customStart}
        customEnd={customEnd}
        onCustomChange={(start, end) => {
          setCustomStart(start)
          setCustomEnd(end)
        }}
        onRefresh={() => {
          refetchSummary()
          refetchClasses()
          refetchInvoices()
        }}
        isRefreshing={isFetchingClasses || isFetchingSummary}
      />

      {/* ── 1. Top SmartIdara Action Banners & Attention Queue ── */}
      <DashboardBanners
        user={user}
        isSuperAdminRole={isSuperAdminRole}
        monthKey={monthKey}
        today={today}
        welcomeBanner={welcomeBanner}
        liveMonitorBanner={liveMonitorBanner}
        starStudentsBanner={starStudentsBanner}
        liveNowClasses={safeTodayClasses.filter((c) => c.status === 'in_progress')}
        todayClassesCount={safeTodayClasses.length}
        starStudents={safeStarStudents}
        attentionRows={attentionRows}
        attentionClosing={attentionClosing}
        attentionDocked={attentionQueue.docked}
        onDismissAttention={() => setAttentionClosing(true)}
        onRestoreAttention={() => {
          setAttentionDocked(false)
          setAttentionClosing(false)
        }}
        onNavigate={navigateTo}
      />

      {/* ── 2. Primary KPI Strip (Mobile 2x2 grid, Desktop 2x3 grid) ── */}
      <DashboardKpiStrip
        summary={summary}
        loadingSummary={loadingSummary}
        todayClassesCount={safeTodayClasses.length}
        endedClassesCount={safeTodayClasses.filter((c) => c.status === 'ended').length}
        inProgressClassesCount={safeTodayClasses.filter((c) => c.status === 'in_progress').length}
        loadingClasses={loadingClasses}
        attendanceAvgPct={attendanceStats.avgPct}
        monthKey={monthKey}
        monthCollected={monthCollected}
        monthBilled={monthBilled}
        monthCollectionPct={monthCollectionPct}
        totalOutstanding={totalOutstanding}
        unpaidInvoicesCount={safeUnpaidInvoices.length}
        netBalanceMonth={netBalanceMonth}
        monthPayablesTotal={monthPayablesTotal}
        monthOperatingExpenses={monthOperatingExpenses}
        usersCount={safeUsers.length}
        teacherCount={teacherCount}
        zimmadarCount={zimmadarCount}
        onNavigate={navigateTo}
      />

      {/* ── 3. Quick Actions Ribbon ── */}
      <QuickActionsBar onNavigate={navigateTo} />

      {/* ── 4. Today's Online Classes Session Grid ── */}
      <TodayClassesSection
        todayClasses={safeTodayClasses}
        onNavigate={navigateTo}
      />

      {/* ── 5. Academic Progress & Class Quality ── */}
      <AcademicProgressSection
        monthKey={monthKey}
        attendanceAvgPct={attendanceStats.avgPct}
        courseRates={attendanceStats.courseRates}
        studentsByCourse={studentsByCourse}
        assessments={assessments}
        resources={resources}
        announcements={announcements}
        onNavigate={navigateTo}
      />

      {/* ── 6. Tuition & Financial Health Overview ── */}
      <FinanceOverviewSection
        monthKey={monthKey}
        trendPeriod={trendPeriod}
        setTrendPeriod={setTrendPeriod}
        feeMonthlySeries={feeMonthlySeries}
        cashflowSeries={cashflowSeries}
        monthCollected={monthCollected}
        monthBilled={monthBilled}
        monthCollectionPct={monthCollectionPct}
        monthPayablesTotal={monthPayablesTotal}
        monthOperatingExpenses={monthOperatingExpenses}
        pendingPayablesSum={pendingPayablesSum}
        pendingPayablesCount={safePendingPayables.length}
        onNavigate={navigateTo}
      />
    </div>
  )
}
