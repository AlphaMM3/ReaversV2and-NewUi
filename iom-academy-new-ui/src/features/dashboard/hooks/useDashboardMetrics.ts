import { useMemo } from 'react'
import type { ClassSession } from '@/lib/api'
import type {
  InvoiceMini,
  PayableMini,
  LeaveMini,
  AdmissionMini,
  FollowupMini,
  MonthlyAttendanceRow,
} from '../types'
import type { AcademyExpense, TeacherLeaveRecord } from '@/lib/superAdminStore'

export interface AcademicMetricsParams {
  monthClasses: ClassSession[]
  leaves: LeaveMini[]
  admissions: AdmissionMini[]
  openFollowups: FollowupMini[]
  teacherLeaves: TeacherLeaveRecord[]
  monthlyAttendance: MonthlyAttendanceRow[]
  today: string
}

export interface FinancialMetricsParams {
  invoices: InvoiceMini[]
  payables: PayableMini[]
  expenses: AcademyExpense[]
  monthKey: string
}

/**
 * useAcademicMetrics Hook — Clean separation of academic, attendance, and operational queues
 */
export function useAcademicMetrics({
  monthClasses,
  leaves,
  admissions,
  openFollowups,
  teacherLeaves,
  monthlyAttendance,
  today,
}: AcademicMetricsParams) {
  const todayClasses = useMemo(
    () => monthClasses.filter((c) => c.scheduled_start.slice(0, 10) === today),
    [monthClasses, today],
  )

  const upcomingClasses = useMemo(
    () =>
      monthClasses
        .filter((c) => c.scheduled_start.slice(0, 10) >= today && c.status === 'scheduled')
        .slice(0, 4),
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

  const unverifiedEnded = useMemo(
    () => todayClasses.filter((c) => c.status === 'ended' && !c.held_verified).length,
    [todayClasses],
  )

  const leaveQueueCount = useMemo(
    () => leaves.filter((l) => l.status === 'pending').length,
    [leaves],
  )

  const admissionQueueCount = useMemo(
    () => admissions.filter((a) => a.status === 'pending').length,
    [admissions],
  )

  const openFollowupCount = useMemo(
    () => openFollowups.filter((f) => f.status !== 'closed').length,
    [openFollowups],
  )

  const pendingTeacherLeaves = useMemo(
    () => teacherLeaves.filter((l) => l.status === 'pending').length,
    [teacherLeaves],
  )

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

  return {
    todayClasses,
    upcomingClasses,
    classCountByDay,
    unverifiedEnded,
    leaveQueueCount,
    admissionQueueCount,
    openFollowupCount,
    pendingTeacherLeaves,
    attendanceStats,
  }
}

/**
 * useFinancialMetrics Hook — Clean separation of invoices, payments, P&L, and payables
 */
export function useFinancialMetrics({
  invoices,
  payables,
  expenses,
  monthKey,
}: FinancialMetricsParams) {
  const unpaidInvoices = useMemo(
    () => invoices.filter((i) => i.status !== 'paid'),
    [invoices],
  )

  const totalCollectedAll = useMemo(
    () => invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0),
    [invoices],
  )

  const totalBilledAll = useMemo(
    () => invoices.reduce((s, i) => s + Number(i.amount_due || 0), 0),
    [invoices],
  )

  const totalOutstanding = useMemo(
    () => Math.max(0, totalBilledAll - totalCollectedAll),
    [totalBilledAll, totalCollectedAll],
  )

  const thisMonthInvoices = useMemo(
    () => invoices.filter((i) => i.billing_month === monthKey),
    [invoices, monthKey],
  )

  const monthCollected = useMemo(
    () => thisMonthInvoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0),
    [thisMonthInvoices],
  )

  const monthBilled = useMemo(
    () => thisMonthInvoices.reduce((s, i) => s + Number(i.amount_due || 0), 0),
    [thisMonthInvoices],
  )

  const monthCollectionPct = useMemo(
    () => (monthBilled > 0 ? Math.round((monthCollected / monthBilled) * 100) : 0),
    [monthBilled, monthCollected],
  )

  const monthPayablesTotal = useMemo(
    () =>
      payables
        .filter((p) => p.billing_month === monthKey)
        .reduce((s, p) => s + Number(p.payable_amount || 0), 0),
    [payables, monthKey],
  )

  const monthOperatingExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.month === monthKey)
        .reduce((s, e) => s + Number(e.amount || 0), 0),
    [expenses, monthKey],
  )

  const totalPayablesAll = useMemo(
    () => payables.reduce((s, p) => s + Number(p.payable_amount || 0), 0),
    [payables],
  )

  const pendingPayables = useMemo(
    () => payables.filter((p) => p.status !== 'paid'),
    [payables],
  )

  const pendingPayablesSum = useMemo(
    () => pendingPayables.reduce((s, p) => s + Number(p.payable_amount || 0), 0),
    [pendingPayables],
  )

  const netBalanceMonth = useMemo(
    () => monthCollected - monthPayablesTotal - monthOperatingExpenses,
    [monthCollected, monthPayablesTotal, monthOperatingExpenses],
  )

  return {
    unpaidInvoices,
    totalCollectedAll,
    totalBilledAll,
    totalOutstanding,
    thisMonthInvoices,
    monthCollected,
    monthBilled,
    monthCollectionPct,
    monthPayablesTotal,
    monthOperatingExpenses,
    totalPayablesAll,
    pendingPayables,
    pendingPayablesSum,
    netBalanceMonth,
  }
}
