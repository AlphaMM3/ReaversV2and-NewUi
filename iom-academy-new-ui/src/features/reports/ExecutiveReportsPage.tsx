import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, toArray, type ClassSession } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/KpiCard'
import { StudentAvatar, Student360Drawer, type StudentSummaryTarget } from '@/components/Student360Drawer'
import { ChartTableCard, DualBarChart, HorizontalBarList } from '@/features/dashboard/DashboardCharts'
import { buildTelegramShareUrl, buildWhatsAppUrl } from '@/lib/messaging'
import { getDhakaDateString } from '@/lib/utils'
import {
  ACADEMY_BRANDING_KEY,
  type AcademyBranding,
  type AcademyExpense,
  CERTIFICATES_KEY,
  DEFAULT_ACADEMY_BRANDING,
  type DigitalCertificate,
  DROPOUT_REASONS_KEY,
  EXPENSES_KEY,
  type ExitDropoutRecord,
  useLocalStore,
} from '@/lib/superAdminStore'
import {
  TrendingUp, Printer, Download, MessageCircle, Send, Users,
  Wallet, ClipboardCheck, AlertTriangle, X, BarChart2, Award,
} from 'lucide-react'

type ExecTab = 'retention' | 'finance' | 'academic'

interface EnrollmentRow {
  id: number
  student_id: number
  student_name: string
  batch_id: number
  batch_name: string
  course_title: string
  delivery_mode: string
  status: string
  start_date: string
  end_date: string | null
}

interface InvoiceRow {
  id: number
  invoice_number: string
  student_name: string
  course_title: string
  batch_name: string
  billing_month: string
  amount_due: string | number
  amount_paid: string | number
  due_date: string
  status: string
}

interface PayableRow {
  id: number
  teacher_name: string | null
  billing_month: string
  conducted_minutes: number
  payable_amount: string | number
  status: string
}

interface MonthlyAttendanceRow {
  enrollment_id: number
  student_name: string
  course_title: string
  batch_name: string
  held_classes: number
  present_count: number
  late_count: number
  absent_count: number
  attendance_pct: number | null
}

interface FollowupRow {
  id: number
  enrollment_id: number
  student_name?: string
  course_title?: string
  status: string
  reason?: string
}

function getLastNMonths(anchorYm: string, n: number): string[] {
  const [yStr, mStr] = anchorYm.split('-')
  const y = Number(yStr) || new Date().getFullYear()
  const m = Number(mStr) || new Date().getMonth() + 1
  const out: string[] = []
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1))
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

function csvEscape(v: unknown): string {
  const s = String(v ?? '')
  return `"${s.replace(/"/g, '""')}"`
}

export default function ExecutiveReportsPage() {
  const today = getDhakaDateString()
  const [month, setMonth] = useState(() => today.slice(0, 7))
  const [tab, setTab] = useState<ExecTab>('retention')
  const [showBoardModal, setShowBoardModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentSummaryTarget | null>(null)

  const [branding] = useLocalStore<AcademyBranding>(ACADEMY_BRANDING_KEY, DEFAULT_ACADEMY_BRANDING)
  const [expenses] = useLocalStore<AcademyExpense[]>(EXPENSES_KEY, [])
  const [exitRecords] = useLocalStore<ExitDropoutRecord[]>(DROPOUT_REASONS_KEY, [])
  const [certificates] = useLocalStore<DigitalCertificate[]>(CERTIFICATES_KEY, [])

  const { data: enrollmentsRaw, isLoading: loadingEnr } = useQuery({
    queryKey: ['exec-enrollments'],
    queryFn: () => api.get<EnrollmentRow[]>('/enrollments?limit=500'),
  })
  const { data: invoicesRaw, isLoading: loadingInv } = useQuery({
    queryKey: ['exec-invoices'],
    queryFn: () => api.get<InvoiceRow[]>('/invoices'),
  })
  const { data: payablesRaw } = useQuery({
    queryKey: ['exec-payables'],
    queryFn: () => api.get<PayableRow[]>('/finance/teacher-payables'),
  })
  const { data: classesRaw } = useQuery({
    queryKey: ['exec-classes'],
    queryFn: () => api.get<ClassSession[]>('/classes?limit=500'),
  })
  const { data: attendanceRaw } = useQuery<MonthlyAttendanceRow[]>({
    queryKey: ['exec-attendance', month],
    queryFn: () =>
      api.get<MonthlyAttendanceRow[]>(`/attendance/monthly?month=${month}`).catch(() => [] as MonthlyAttendanceRow[]),
  })
  const { data: followupsRaw } = useQuery<FollowupRow[]>({
    queryKey: ['exec-followups'],
    queryFn: () => api.get<FollowupRow[]>('/followups').catch(() => [] as FollowupRow[]),
  })

  const enrollments = useMemo(() => toArray(enrollmentsRaw), [enrollmentsRaw])
  const invoices = useMemo(() => toArray(invoicesRaw), [invoicesRaw])
  const payables = useMemo(() => toArray(payablesRaw), [payablesRaw])
  const classes = useMemo(() => toArray(classesRaw), [classesRaw])
  const attendanceRows = useMemo(() => toArray(attendanceRaw), [attendanceRaw])
  const followups = useMemo(() => toArray(followupsRaw), [followupsRaw])

  // ── 1. Retention & Churn Computations ────────────────────────────────────
  const activeCount = useMemo(
    () => enrollments.filter((e) => !e.status || e.status === 'active').length,
    [enrollments],
  )
  const completedCount = useMemo(
    () => enrollments.filter((e) => e.status === 'completed').length,
    [enrollments],
  )
  const droppedOrPausedCount = useMemo(
    () => enrollments.filter((e) => ['withdrawn', 'inactive', 'on_hold'].includes(e.status)).length,
    [enrollments],
  )

  const monthStarts = useMemo(
    () => enrollments.filter((e) => (e.start_date || '').startsWith(month)).length,
    [enrollments, month],
  )
  const monthExits = useMemo(
    () =>
      enrollments.filter(
        (e) =>
          ['withdrawn', 'inactive'].includes(e.status) &&
          (e.end_date || '').startsWith(month),
      ).length,
    [enrollments, month],
  )

  const churnBase = Math.max(1, activeCount + monthExits)
  const monthlyChurnPct = Number(((monthExits / churnBase) * 100).toFixed(1))
  const retentionRatePct = Number((100 - monthlyChurnPct).toFixed(1))

  const last6Months = useMemo(() => getLastNMonths(month, 6), [month])

  const cohortTrend = useMemo(() => {
    return last6Months.map((ym) => {
      const joined = enrollments.filter((e) => (e.start_date || '').startsWith(ym)).length
      const exited = enrollments.filter(
        (e) => ['withdrawn', 'inactive'].includes(e.status) && (e.end_date || '').startsWith(ym),
      ).length
      return { ym, label: ym.slice(2), primary: joined, secondary: exited }
    })
  }, [last6Months, enrollments])

  const batchRetentionStats = useMemo(() => {
    const map = new Map<
      string,
      { batchName: string; courseTitle: string; total: number; active: number; completed: number; exited: number }
    >()
    for (const e of enrollments) {
      const key = `${e.course_title}::${e.batch_name}`
      const cur = map.get(key) || {
        batchName: e.batch_name,
        courseTitle: e.course_title,
        total: 0,
        active: 0,
        completed: 0,
        exited: 0,
      }
      cur.total += 1
      if (!e.status || e.status === 'active') cur.active += 1
      else if (e.status === 'completed') cur.completed += 1
      else cur.exited += 1
      map.set(key, cur)
    }
    return Array.from(map.values())
      .map((r) => ({
        ...r,
        churnPct: r.total > 0 ? Math.round((r.exited / r.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }, [enrollments])

  // ── 2. Financial & Defaulter Computations ────────────────────────────────
  const monthInvoices = useMemo(
    () => invoices.filter((i) => i.billing_month === month),
    [invoices, month],
  )
  const monthBilled = monthInvoices.reduce((s, i) => s + Number(i.amount_due || 0), 0)
  const monthCollected = monthInvoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0)
  const collectionPct = monthBilled > 0 ? Math.round((monthCollected / monthBilled) * 100) : 0

  const monthPayablesTotal = useMemo(
    () =>
      payables
        .filter((p) => p.billing_month === month)
        .reduce((s, p) => s + Number(p.payable_amount || 0), 0),
    [payables, month],
  )
  const monthExpensesTotal = useMemo(
    () =>
      expenses
        .filter((ex) => ex.month === month)
        .reduce((s, ex) => s + Number(ex.amount || 0), 0),
    [expenses, month],
  )
  const netOperatingSurplus = monthCollected - monthPayablesTotal - monthExpensesTotal

  const defaulters = useMemo(() => {
    return invoices
      .map((i) => {
        const balance = Math.max(0, Number(i.amount_due || 0) - Number(i.amount_paid || 0))
        return { ...i, balance }
      })
      .filter((i) => i.balance > 0)
      .sort((a, b) => b.balance - a.balance)
  }, [invoices])
  const totalOutstanding = defaulters.reduce((s, d) => s + d.balance, 0)

  const cashflow6m = useMemo(() => {
    return last6Months.map((ym) => {
      const rev = invoices
        .filter((i) => i.billing_month === ym)
        .reduce((s, i) => s + Number(i.amount_paid || 0), 0)
      const pay = payables
        .filter((p) => p.billing_month === ym)
        .reduce((s, p) => s + Number(p.payable_amount || 0), 0)
      const exp = expenses
        .filter((e) => e.month === ym)
        .reduce((s, e) => s + Number(e.amount || 0), 0)
      return { ym, label: ym.slice(2), primary: rev, secondary: pay + exp }
    })
  }, [last6Months, invoices, payables, expenses])

  // ── 3. Academic Delivery, Attendance & Followups ─────────────────────────
  const monthClasses = useMemo(
    () => classes.filter((c) => (c.scheduled_start || '').startsWith(month)),
    [classes, month],
  )
  const heldClassesCount = monthClasses.filter((c) => c.status === 'ended' && Boolean(c.held_verified)).length
  const avgAttendancePct = useMemo(() => {
    const valid = attendanceRows.filter((r) => r.attendance_pct !== null && r.held_classes > 0)
    if (valid.length === 0) return null
    const sum = valid.reduce((s, r) => s + Number(r.attendance_pct || 0), 0)
    return Math.round(sum / valid.length)
  }, [attendanceRows])

  const openFollowupsCount = followups.filter((f) => ['open', 'in_progress', 'escalated'].includes(f.status)).length
  const resolvedFollowupsCount = followups.filter((f) => !['open', 'in_progress', 'escalated'].includes(f.status)).length

  const teacherHoursThisMonth = useMemo(() => {
    const mins = payables
      .filter((p) => p.billing_month === month)
      .reduce((s, p) => s + Number(p.conducted_minutes || 0), 0)
    return Number((mins / 60).toFixed(1))
  }, [payables, month])

  // ── Executive Share Brief & CSV Export ───────────────────────────────────
  const boardSummaryText = [
    `*${branding.academyName} — Principal Executive Report (${month})*`,
    `Active Enrollments: ${activeCount} (New: +${monthStarts}, Exits: -${monthExits}, Retention: ${retentionRatePct}%)`,
    `Tuition Collected (${month}): ৳${monthCollected.toLocaleString()} / ৳${monthBilled.toLocaleString()} (${collectionPct}%)`,
    `Total Unpaid Dues: ৳${totalOutstanding.toLocaleString()} (${defaulters.length} defaulters)`,
    `Payables + Expenses (${month}): ৳${(monthPayablesTotal + monthExpensesTotal).toLocaleString()}`,
    `Net Operating Surplus: ৳${netOperatingSurplus.toLocaleString()}`,
    `Avg Held Attendance: ${avgAttendancePct !== null ? `${avgAttendancePct}%` : 'N/A'} | Held Sessions: ${heldClassesCount}/${monthClasses.length}`,
    `Open Care Follow-ups: ${openFollowupsCount} | Sanads Issued: ${certificates.length}`,
    `Prepared by: ${branding.principalName} (${branding.principalTitle})`,
  ].join('\n')

  function downloadExecutiveCsv() {
    const rows: string[][] = [
      ['Metric Category', 'Metric', 'Value', 'Period / Notes'],
      ['Retention', 'Active Enrollments', String(activeCount), month],
      ['Retention', 'New Starts', String(monthStarts), month],
      ['Retention', 'Exits (Withdrawn/Inactive)', String(monthExits), month],
      ['Retention', 'Retention Rate %', `${retentionRatePct}%`, month],
      ['Finance', 'Tuition Billed (BDT)', String(monthBilled), month],
      ['Finance', 'Tuition Collected (BDT)', String(monthCollected), `${collectionPct}%`],
      ['Finance', 'Teacher Payables (BDT)', String(monthPayablesTotal), month],
      ['Finance', 'Operating Expenses (BDT)', String(monthExpensesTotal), month],
      ['Finance', 'Net Operating Surplus (BDT)', String(netOperatingSurplus), month],
      ['Finance', 'Total Unpaid Balance (All Months)', String(totalOutstanding), `${defaulters.length} defaulters`],
      ['Academics', 'Held Verified Classes', String(heldClassesCount), `of ${monthClasses.length} scheduled`],
      ['Academics', 'Average Attendance %', avgAttendancePct !== null ? `${avgAttendancePct}%` : 'N/A', month],
      ['Academics', 'Open Care Follow-ups', String(openFollowupsCount), `${resolvedFollowupsCount} resolved`],
      ['', '', '', ''],
      ['TOP DEFAULTERS', 'Student Name', 'Course / Batch', 'Balance Due (BDT)'],
      ...defaulters.slice(0, 50).map((d) => [
        d.invoice_number,
        d.student_name,
        `${d.course_title} (${d.batch_name})`,
        String(d.balance),
      ]),
    ]
    const csv = '\uFEFF' + rows.map((r) => r.map(csvEscape).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iom-executive-report-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      {/* Header & Board Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Principal Executive Reports &amp; Retention Analytics</h2>
          <p className="text-xs text-muted mt-0.5">
            Student retention &amp; dropout cohorts, financial P&amp;L margin, fee defaulter aging, and 1-click Board/Trustee executive reports
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-surface"
          />
          <Button size="sm" variant="outline" onClick={downloadExecutiveCsv}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowBoardModal(true)}>
            <Printer className="w-3.5 h-3.5" /> Board Summary (PDF)
          </Button>
        </div>
      </div>

      {/* Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
        <Card className="h-full">
          <CardContent className="pt-5 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted uppercase font-semibold">Retention &amp; Dropouts ({month})</p>
              <Users className="w-4 h-4 text-primary-700" />
            </div>
            {loadingEnr ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <>
                <p className="text-2xl font-bold text-heading mt-1">{retentionRatePct}% Retained</p>
                <p className="text-xs text-muted mt-1">
                  Active: {activeCount} · +{monthStarts} Joined · -{monthExits} Dropped ({monthlyChurnPct}% dropout)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="pt-5 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted uppercase font-semibold">Collection Rate ({month})</p>
              <Wallet className="w-4 h-4 text-teal-600" />
            </div>
            {loadingInv ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <>
                <p className="text-2xl font-bold text-teal-700 mt-1">{collectionPct}% Collected</p>
                <p className="text-xs text-muted mt-1">
                  ৳{monthCollected.toLocaleString()} / ৳{monthBilled.toLocaleString()} billed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="pt-5 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted uppercase font-semibold">Net Operating Surplus</p>
              <TrendingUp className="w-4 h-4 text-primary-700" />
            </div>
            <p className={`text-2xl font-bold mt-1 ${netOperatingSurplus >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ৳ {netOperatingSurplus.toLocaleString()}
            </p>
            <p className="text-xs text-muted mt-1">
              Payables ৳{monthPayablesTotal.toLocaleString()} + Expenses ৳{monthExpensesTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="pt-5 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted uppercase font-semibold">Attendance &amp; Care</p>
              <ClipboardCheck className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-heading mt-1">
              {avgAttendancePct !== null ? `${avgAttendancePct}% Avg` : `${heldClassesCount} Held`}
            </p>
            <p className="text-xs text-muted mt-1">
              {heldClassesCount}/{monthClasses.length} classes held · {openFollowupsCount} open follow-ups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setTab('retention')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'retention' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Retention &amp; Dropouts
        </button>
        <button
          type="button"
          onClick={() => setTab('finance')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'finance' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" /> Revenue P&amp;L &amp; Defaulters ({defaulters.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('academic')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'academic' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" /> Delivery, Follow-ups &amp; Sanads
        </button>
      </div>

      {/* TAB 1: RETENTION & DROPOUTS */}
      {tab === 'retention' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-7 h-full">
              <ChartTableCard
                title="Student Growth vs Dropouts (Last 6 Months)"
                subtitle="New enrollment starts vs withdrawn, paused, or inactive student exits"
                chart={
                  <DualBarChart
                    data={cohortTrend}
                    primaryLabel="New Joins"
                    secondaryLabel="Exits / Dropouts"
                    primaryColor="#0d9488"
                    secondaryColor="#e11d48"
                  />
                }
                table={
                  <table className="iom-table">
                    <thead>
                      <tr><th>Month</th><th>New Starts</th><th>Exits / Dropouts</th><th>Net</th></tr>
                    </thead>
                    <tbody>
                      {cohortTrend.map((c) => (
                        <tr key={c.ym}>
                          <td className="font-mono text-xs">{c.ym}</td>
                          <td className="text-xs font-bold text-teal-700">+{c.primary}</td>
                          <td className="text-xs font-bold text-rose-600">-{c.secondary}</td>
                          <td className="text-xs font-bold">{c.primary - c.secondary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              />
            </div>

            <div className="lg:col-span-5 h-full">
              <ChartTableCard
                title="Enrollment Lifecycle Mix"
                subtitle={`Total tracked enrollments: ${enrollments.length}`}
                chart={
                  <HorizontalBarList
                    items={[
                      { label: 'Active Learning', value: activeCount, displayValue: `${activeCount}`, color: 'bg-teal-600' },
                      { label: 'Completed / Graduated', value: completedCount, displayValue: `${completedCount}`, color: 'bg-primary-700' },
                      { label: 'Withdrawn / Paused / Inactive', value: droppedOrPausedCount, displayValue: `${droppedOrPausedCount}`, color: 'bg-rose-500' },
                    ]}
                  />
                }
                table={
                  <table className="iom-table">
                    <thead><tr><th>Category</th><th>Count</th></tr></thead>
                    <tbody>
                      <tr><td className="text-xs">Active</td><td className="text-xs font-bold">{activeCount}</td></tr>
                      <tr><td className="text-xs">Completed / Graduated</td><td className="text-xs font-bold">{completedCount}</td></tr>
                      <tr><td className="text-xs">Withdrawn / Paused</td><td className="text-xs font-bold">{droppedOrPausedCount}</td></tr>
                    </tbody>
                  </table>
                }
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Course &amp; Batch Dropout Risk Leaderboard ({batchRetentionStats.length})</CardTitle>
                <span className="text-xs text-muted">
                  Tracks students who paused or left (Exited ÷ Total Enrolled) — spot batches needing teacher support or guardian outreach
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {batchRetentionStats.length === 0 ? (
                <p className="p-6 text-xs text-muted">No batch enrollment data found.</p>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Course &amp; Batch</th>
                      <th>Total Students</th>
                      <th>Active</th>
                      <th>Completed</th>
                      <th>Exited / Hold</th>
                      <th>Dropout Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchRetentionStats.map((b, idx) => (
                      <tr key={`${b.batchName}-${idx}`}>
                        <td>
                          <p className="font-semibold text-heading">{b.courseTitle}</p>
                          <p className="text-xs text-muted">{b.batchName}</p>
                        </td>
                        <td className="text-xs font-bold">{b.total}</td>
                        <td className="text-xs text-teal-700 font-semibold">{b.active}</td>
                        <td className="text-xs text-primary-700 font-semibold">{b.completed}</td>
                        <td className="text-xs text-rose-600 font-semibold">{b.exited}</td>
                        <td>
                          <Badge variant={b.churnPct >= 25 ? 'cancelled' : b.churnPct >= 10 ? 'pending' : 'approved'}>
                            {b.churnPct}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {exitRecords.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Logged Dropout &amp; Exit Reasons ({exitRecords.length})</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {exitRecords.slice(0, 9).map((r) => (
                  <div key={r.id} className="p-3 rounded-xl border border-border bg-bg text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-heading">{r.student_name}</span>
                      <Badge variant="cancelled">{r.category}</Badge>
                    </div>
                    <p className="text-muted">{r.batch_name}</p>
                    <p className="text-body">{r.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: REVENUE P&L & DEFAULTERS */}
      {tab === 'finance' && (
        <div className="space-y-4">
          <ChartTableCard
            title="6-Month Cashflow: Collected Tuition vs (Teacher Payroll + Operating Expenses)"
            subtitle="All figures in BDT across online invoices, payables & expense ledger"
            chart={
              <DualBarChart
                data={cashflow6m}
                primaryLabel="Collected"
                secondaryLabel="Payroll + Expenses"
                primaryColor="#1d4ed8"
                secondaryColor="#f59e0b"
              />
            }
            table={
              <table className="iom-table">
                <thead>
                  <tr><th>Month</th><th>Collected (BDT)</th><th>Outflow (BDT)</th><th>Net Margin</th></tr>
                </thead>
                <tbody>
                  {cashflow6m.map((c) => (
                    <tr key={c.ym}>
                      <td className="font-mono text-xs">{c.ym}</td>
                      <td className="text-xs text-primary-700 font-semibold">৳ {c.primary.toLocaleString()}</td>
                      <td className="text-xs text-amber-700 font-semibold">৳ {c.secondary.toLocaleString()}</td>
                      <td className={`text-xs font-bold ${c.primary - c.secondary >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        ৳ {(c.primary - c.secondary).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Outstanding Tuition Defaulters ({defaulters.length})</CardTitle>
                  <p className="text-xs text-muted mt-0.5">Total Pending Balance: ৳ {totalOutstanding.toLocaleString()}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { window.location.hash = '#/invoices' }}>
                  Open Fee &amp; Billing Console
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {defaulters.length === 0 ? (
                <p className="p-6 text-xs text-muted">Alhamdulillah — 0 outstanding fee defaulters.</p>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Student &amp; Course</th>
                      <th>Month</th>
                      <th>Due Date</th>
                      <th>Balance Due</th>
                      <th>Quick Reminder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaulters.slice(0, 30).map((d) => {
                      const reminderText = `আসসালামু আলাইকুম, ${d.student_name}-এর ${d.billing_month} মাসের টিউশন ফি ৳${d.balance.toLocaleString()} বকেয়া রয়েছে (Due: ${d.due_date})। অনুগ্রহ করে ${branding.bkashNumber} (bKash) এ পেমেন্ট করে TrxID পাঠান।`
                      return (
                        <tr key={d.id}>
                          <td className="font-mono text-xs">{d.invoice_number}</td>
                          <td>
                            <p className="font-semibold text-heading">{d.student_name}</p>
                            <p className="text-xs text-muted">{d.course_title} · {d.batch_name}</p>
                          </td>
                          <td className="text-xs font-mono">{d.billing_month}</td>
                          <td className="text-xs font-mono text-rose-700">{d.due_date}</td>
                          <td className="text-xs font-bold text-rose-700">৳ {d.balance.toLocaleString()}</td>
                          <td>
                            <div className="flex gap-1.5">
                              <a
                                href={buildWhatsAppUrl(reminderText)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                              >
                                <MessageCircle className="w-3 h-3" /> WhatsApp
                              </a>
                              <a
                                href={buildTelegramShareUrl(reminderText)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
                              >
                                <Send className="w-3 h-3" /> TG
                              </a>
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

      {/* TAB 3: ACADEMIC QUALITY, FOLLOWUPS & SANADS */}
      {tab === 'academic' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-7">
            <CardHeader><CardTitle>Batch Attendance Health ({month})</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {attendanceRows.length === 0 ? (
                <p className="p-6 text-xs text-muted">No attendance records calculated yet for {month}.</p>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course / Batch</th>
                      <th>Held</th>
                      <th>Present + Late</th>
                      <th>Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRows.slice(0, 30).map((r) => {
                      const pct = r.attendance_pct ?? 0
                      const enMatch = enrollments.find((e) => e.id === r.enrollment_id)
                      const sid = enMatch?.student_id ?? r.enrollment_id
                      return (
                        <tr key={r.enrollment_id}>
                          <td>
                            <button
                              type="button"
                              onClick={() => setSelectedStudent({ id: sid, full_name: r.student_name })}
                              className="inline-flex items-center gap-2 font-semibold text-heading hover:text-primary-700 hover:underline text-left"
                            >
                              <StudentAvatar studentId={sid} name={r.student_name} size="xs" />
                              <span>{r.student_name}</span>
                            </button>
                          </td>
                          <td className="text-xs text-muted">{r.course_title} · {r.batch_name}</td>
                          <td className="text-xs">{r.held_classes}</td>
                          <td className="text-xs">{r.present_count + r.late_count}</td>
                          <td>
                            <Badge variant={pct >= 80 ? 'approved' : pct >= 60 ? 'pending' : 'cancelled'}>
                              {r.attendance_pct !== null ? `${r.attendance_pct}%` : '—'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader><CardTitle>Academic &amp; Care Operations Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg border border-border">
                  <span className="inline-flex items-center gap-1.5 font-medium text-heading">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Open Follow-up Care Cases
                  </span>
                  <Badge variant={openFollowupsCount > 0 ? 'pending' : 'approved'}>{openFollowupsCount} Open</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg border border-border">
                  <span className="font-medium text-heading">Resolved Follow-up Cases</span>
                  <span className="font-bold text-teal-700">{resolvedFollowupsCount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg border border-border">
                  <span className="font-medium text-heading">Billed Teaching Hours ({month})</span>
                  <span className="font-bold text-primary-700">{teacherHoursThisMonth} hrs</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-bg border border-border">
                  <span className="inline-flex items-center gap-1.5 font-medium text-heading">
                    <Award className="w-4 h-4 text-primary-700" /> Digital Certificates (Sanads) Issued
                  </span>
                  <span className="font-bold text-heading">{certificates.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* PRINTABLE BOARD / PRINCIPAL EXECUTIVE SUMMARY MODAL */}
      {showBoardModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">{branding.academyName}</p>
                <p className="text-[11px] text-muted">{branding.tagline}</p>
                <h3 className="text-xl font-bold text-heading mt-1">
                  Monthly Principal &amp; Board Executive Summary · {month}
                </h3>
              </div>
              <button type="button" onClick={() => setShowBoardModal(false)} className="text-muted hover:text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-bg border border-border">
                <p className="text-muted">Active Students</p>
                <p className="text-lg font-bold text-heading">{activeCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg border border-border">
                <p className="text-muted">Retention Rate</p>
                <p className="text-lg font-bold text-teal-700">{retentionRatePct}%</p>
              </div>
              <div className="p-3 rounded-xl bg-bg border border-border">
                <p className="text-muted">Collected ({month})</p>
                <p className="text-lg font-bold text-primary-700">৳{monthCollected.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-bg border border-border">
                <p className="text-muted">Net Surplus</p>
                <p className="text-lg font-bold text-emerald-700">৳{netOperatingSurplus.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-body border border-border rounded-xl p-4 bg-bg/50">
              <p><strong>Tuition Billing ({month}):</strong> Billed ৳{monthBilled.toLocaleString()} · Collected ৳{monthCollected.toLocaleString()} ({collectionPct}%) · Total Unpaid Backlog: ৳{totalOutstanding.toLocaleString()} across {defaulters.length} invoice(s).</p>
              <p><strong>Outflows ({month}):</strong> Teacher Payables ৳{monthPayablesTotal.toLocaleString()} ({teacherHoursThisMonth} billed hrs) + Academy Operating Expenses ৳{monthExpensesTotal.toLocaleString()}.</p>
              <p><strong>Academic Operations:</strong> {heldClassesCount}/{monthClasses.length} classes held-verified · Avg Attendance: {avgAttendancePct !== null ? `${avgAttendancePct}%` : 'N/A'} · Open Care Follow-ups: {openFollowupsCount}.</p>
              <p><strong>Admissions &amp; Retention:</strong> +{monthStarts} new enrollments started vs {monthExits} withdrawn/inactive exits in {month}.</p>
            </div>

            <div className="flex items-end justify-between text-xs pt-2 border-t border-border">
              <span className="text-muted">{branding.footerNote}</span>
              <div className="text-right">
                <p className="font-bold text-heading">{branding.principalName}</p>
                <p className="text-[11px] text-muted">{branding.principalTitle}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end flex-wrap pt-2">
              <a
                href={buildWhatsAppUrl(boardSummaryText)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4" /> Share Board Brief (WA)
              </a>
              <a
                href={buildTelegramShareUrl(boardSummaryText)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
              >
                <Send className="w-4 h-4" /> Share Telegram
              </a>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4" /> Print / Save PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      <Student360Drawer
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  )
}

