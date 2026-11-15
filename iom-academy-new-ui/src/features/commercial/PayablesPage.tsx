import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toArray, type ClassSession } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { PAYABLE_MACHINE, getStatusMeta } from '@/lib/stateMachines'
import { buildWhatsAppUrl, buildTelegramShareUrl } from '@/lib/messaging'
import { getDhakaDateString } from '@/lib/utils'
import {
  ACADEMY_BRANDING_KEY,
  type AcademyBranding,
  DEFAULT_ACADEMY_BRANDING,
  PAYROLL_SETTLEMENTS_KEY,
  type TeacherPayrollSettlement,
  useLocalStore,
} from '@/lib/superAdminStore'
import {
  DollarSign, Calculator, Zap, FileText, Printer, MessageCircle,
  Send, CheckCircle, X, Copy,
} from 'lucide-react'

interface PayableRow {
  id: number
  teacher_id?: number
  teacher_name: string | null
  teacher_email: string | null
  class_session_id: number
  course_title: string | null
  billing_month: string
  conducted_minutes: number
  hourly_rate: string | number
  payable_amount: string | number
  status: string
}

interface ExtendedClass extends ClassSession {
  teacher_name?: string | null
  teacher_id?: number | null
  actual_teacher_id?: number | null
}

interface PayrollSummaryRow {
  teacherId: number
  teacherName: string
  teacherEmail: string
  sessionsCount: number
  totalMinutes: number
  sessionEarnings: number
  retainer: number
  bonus: number
  deduction: number
  netPayable: number
  settlement: TeacherPayrollSettlement
}

export default function PayablesPage({ role }: { role: string }) {
  const canCalculate = ['central_admin', 'branch_admin', 'zimmadar'].includes(role)
  const isAdmin = ['central_admin', 'branch_admin'].includes(role)
  const today = getDhakaDateString()
  const [tab, setTab] = useState<'payroll' | 'sessions'>('payroll')
  const [month, setMonth] = useState(() => today.slice(0, 7))
  const [sessionId, setSessionId] = useState('')
  const [rate, setRate] = useState('500')
  const [saving, setSaving] = useState(false)
  const [bulkCalculating, setBulkCalculating] = useState(false)
  const [slipRow, setSlipRow] = useState<PayrollSummaryRow | null>(null)
  const [slipCopied, setSlipCopied] = useState(false)
  const qc = useQueryClient()
  const toast = useToast()

  const [settlements, setSettlements] = useLocalStore<Record<string, TeacherPayrollSettlement>>(
    PAYROLL_SETTLEMENTS_KEY,
    {},
  )
  const [branding] = useLocalStore<AcademyBranding>(ACADEMY_BRANDING_KEY, DEFAULT_ACADEMY_BRANDING)

  const { data: payables = [], isLoading } = useQuery<PayableRow[]>({
    queryKey: ['teacher-payables', month],
    queryFn: () =>
      api
        .get<PayableRow[] | { items?: PayableRow[] }>(`/finance/teacher-payables${month ? `?billing_month=${month}` : ''}`)
        .then(toArray),
  })

  const { data: endedClasses = [] } = useQuery<ExtendedClass[]>({
    queryKey: ['payables-ended-classes'],
    queryFn: () =>
      api.get<ExtendedClass[] | { items?: ExtendedClass[] }>('/classes?limit=500').then(toArray).catch(() => []),
    enabled: canCalculate,
  })

  const unbilledEndedClasses = useMemo(() => {
    const billedIds = new Set(payables.map((p) => p.class_session_id))
    return endedClasses.filter((c) => {
      if (c.status !== 'ended' || billedIds.has(c.id)) return false
      if (month && c.scheduled_start.slice(0, 7) !== month) return false
      return true
    })
  }, [endedClasses, payables, month])

  const payrollRows = useMemo<PayrollSummaryRow[]>(() => {
    const byTeacher = new Map<
      number,
      { name: string; email: string; sessionsCount: number; totalMinutes: number; sessionEarnings: number }
    >()
    const activeMonthKey = month || today.slice(0, 7)

    for (const p of payables) {
      const tid = p.teacher_id || 0
      const keyId = tid || p.id
      const prev = byTeacher.get(keyId) || {
        name: p.teacher_name || 'Teacher',
        email: p.teacher_email || '',
        sessionsCount: 0,
        totalMinutes: 0,
        sessionEarnings: 0,
      }
      prev.sessionsCount += 1
      prev.totalMinutes += Number(p.conducted_minutes || 0)
      prev.sessionEarnings += Number(p.payable_amount || 0)
      byTeacher.set(keyId, prev)
    }

    return Array.from(byTeacher.entries()).map(([tid, agg]) => {
      const settleKey = `${tid}:${activeMonthKey}`
      const st: TeacherPayrollSettlement = settlements[settleKey] || {
        key: settleKey,
        teacher_id: tid,
        month: activeMonthKey,
        retainer_amount: 0,
        bonus_amount: 0,
        deduction_amount: 0,
        status: 'pending',
        payment_method: 'bKash',
        payment_ref: '',
      }
      const net = Math.max(0, agg.sessionEarnings + st.retainer_amount + st.bonus_amount - st.deduction_amount)
      return {
        teacherId: tid,
        teacherName: agg.name,
        teacherEmail: agg.email,
        sessionsCount: agg.sessionsCount,
        totalMinutes: agg.totalMinutes,
        sessionEarnings: agg.sessionEarnings,
        retainer: st.retainer_amount,
        bonus: st.bonus_amount,
        deduction: st.deduction_amount,
        netPayable: net,
        settlement: st,
      }
    })
  }, [payables, settlements, month, today])

  function updateSettlement(teacherId: number, patch: Partial<TeacherPayrollSettlement>) {
    const activeMonthKey = month || today.slice(0, 7)
    const settleKey = `${teacherId}:${activeMonthKey}`
    setSettlements((prev) => {
      const base: TeacherPayrollSettlement = prev[settleKey] || {
        key: settleKey,
        teacher_id: teacherId,
        month: activeMonthKey,
        retainer_amount: 0,
        bonus_amount: 0,
        deduction_amount: 0,
        status: 'pending',
        payment_method: 'bKash',
        payment_ref: '',
      }
      return { ...prev, [settleKey]: { ...base, ...patch } }
    })
  }

  async function calculatePayable(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/finance/teacher-payables/calculate', {
        class_session_id: Number(sessionId),
        hourly_rate: Number(rate),
      })
      setSessionId('')
      toast.success('Teacher payable calculated')
      qc.invalidateQueries({ queryKey: ['teacher-payables'] })
    } catch (err) {
      toast.error(err, 'Calculation failed')
    } finally {
      setSaving(false)
    }
  }

  async function calculateAllUnbilled() {
    if (unbilledEndedClasses.length === 0) return
    const hr = Number(rate) || 500
    setBulkCalculating(true)
    let ok = 0
    for (const c of unbilledEndedClasses) {
      try {
        await api.post('/finance/teacher-payables/calculate', {
          class_session_id: c.id,
          hourly_rate: hr,
        })
        ok += 1
      } catch {
        // Ignore classes missing teacher or already calculated
      }
    }
    setBulkCalculating(false)
    qc.invalidateQueries({ queryKey: ['teacher-payables'] })
    toast.success(`Calculated payables for ${ok} ended class(es) @ ৳${hr}/hr`)
  }

  function buildSalarySlipText(r: PayrollSummaryRow): string {
    return [
      `*${branding.academyName} — Teacher Salary Slip (${r.settlement.month})*`,
      `Teacher: ${r.teacherName}`,
      `Conducted Sessions: ${r.sessionsCount} (${r.totalMinutes} mins)`,
      `Session Earnings: ${r.sessionEarnings.toFixed(2)} BDT`,
      `Fixed Retainer: ${r.retainer.toFixed(2)} BDT`,
      `Bonus: ${r.bonus.toFixed(2)} BDT`,
      `Deduction: -${r.deduction.toFixed(2)} BDT`,
      `*Net Payable: ${r.netPayable.toFixed(2)} BDT*`,
      `Status: ${r.settlement.status.toUpperCase()}${r.settlement.payment_ref ? ` (Ref: ${r.settlement.payment_ref})` : ''}`,
    ].join('\n')
  }

  const totalSessionPayable = payables.reduce((s, p) => s + Number(p.payable_amount || 0), 0)
  const totalNetPayroll = payrollRows.reduce((s, r) => s + r.netPayable, 0)

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Teacher Payroll, Payables &amp; Salary Slips</h2>
          <p className="text-xs text-muted mt-0.5">
            Aggregate live teaching hours, add retainers/bonuses, settle via bKash/Nagad/Bank, and issue official salary slips
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-surface"
          />
          {month && <Button size="sm" variant="outline" onClick={() => setMonth('')}>All Months</Button>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted uppercase font-semibold">Teachers on Payroll</p>
            <p className="text-2xl font-bold text-heading mt-1">{payrollRows.length}</p>
            <p className="text-xs text-muted mt-0.5">{payables.length} session logs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted uppercase font-semibold">Session Earnings</p>
            <p className="text-2xl font-bold text-primary-700 mt-1">৳ {totalSessionPayable.toLocaleString()}</p>
            <p className="text-xs text-muted mt-0.5">{unbilledEndedClasses.length} ended classes awaiting calculation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted uppercase font-semibold">Net Monthly Payroll (incl. Retainer/Bonus)</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">৳ {totalNetPayroll.toLocaleString()}</p>
            <p className="text-xs text-muted mt-0.5">
              Paid: {payrollRows.filter((r) => r.settlement.status === 'paid').length} / {payrollRows.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setTab('payroll')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'payroll' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Monthly Payroll &amp; Salary Slips ({payrollRows.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('sessions')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'sessions' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Session Breakdown ({payables.length})
        </button>
      </div>

      {/* TAB 1: MONTHLY PAYROLL SETTLEMENT & SLIPS */}
      {tab === 'payroll' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2 w-full">
              <CardTitle>Teacher Monthly Payroll Settlement ({month || 'Current Period'})</CardTitle>
              {canCalculate && unbilledEndedClasses.length > 0 && (
                <Button size="sm" variant="outline" loading={bulkCalculating} onClick={calculateAllUnbilled}>
                  <Zap className="w-3.5 h-3.5" /> Auto-Calculate {unbilledEndedClasses.length} Ended Class(es) @ ৳{rate}/h
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-5 space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : payrollRows.length === 0 ? (
              <p className="text-center text-sm text-muted py-12">
                No calculated teacher payables yet for {month || 'this filter'}. Switch to &quot;Session Breakdown&quot; to calculate ended classes.
              </p>
            ) : (
              <table className="iom-table">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Classes &amp; Time</th>
                    <th>Session Pay</th>
                    <th>Retainer (BDT)</th>
                    <th>Bonus / Deduct</th>
                    <th>Net Payable</th>
                    <th>Payout Ref</th>
                    <th>Status</th>
                    <th className="text-right">Salary Slip</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRows.map((r) => (
                    <tr key={r.teacherId}>
                      <td>
                        <p className="font-semibold text-heading">{r.teacherName}</p>
                        <p className="text-xs text-muted">{r.teacherEmail}</p>
                      </td>
                      <td className="text-xs">
                        {r.sessionsCount} classes · {r.totalMinutes}m
                      </td>
                      <td className="font-mono text-xs font-semibold">৳ {r.sessionEarnings.toFixed(0)}</td>
                      <td>
                        {isAdmin ? (
                          <input
                            type="number"
                            min={0}
                            value={r.retainer}
                            onChange={(e) => updateSettlement(r.teacherId, { retainer_amount: Math.max(0, Number(e.target.value)) })}
                            className="w-20 px-2 py-1 text-xs rounded border border-border bg-bg font-mono"
                          />
                        ) : (
                          <span className="text-xs">৳ {r.retainer}</span>
                        )}
                      </td>
                      <td>
                        {isAdmin ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              title="Bonus"
                              placeholder="+Bonus"
                              value={r.bonus}
                              onChange={(e) => updateSettlement(r.teacherId, { bonus_amount: Math.max(0, Number(e.target.value)) })}
                              className="w-16 px-1.5 py-1 text-xs rounded border border-border bg-bg font-mono text-emerald-700"
                            />
                            <input
                              type="number"
                              min={0}
                              title="Deduction"
                              placeholder="-Deduct"
                              value={r.deduction}
                              onChange={(e) => updateSettlement(r.teacherId, { deduction_amount: Math.max(0, Number(e.target.value)) })}
                              className="w-16 px-1.5 py-1 text-xs rounded border border-border bg-bg font-mono text-rose-700"
                            />
                          </div>
                        ) : (
                          <span className="text-xs">+{r.bonus} / -{r.deduction}</span>
                        )}
                      </td>
                      <td className="font-bold text-primary-700">৳ {r.netPayable.toFixed(0)}</td>
                      <td>
                        {isAdmin ? (
                          <input
                            type="text"
                            placeholder="bKash / Bank Trx"
                            value={r.settlement.payment_ref || ''}
                            onChange={(e) => updateSettlement(r.teacherId, { payment_ref: e.target.value })}
                            className="w-28 px-2 py-1 text-xs rounded border border-border bg-bg font-mono"
                          />
                        ) : (
                          <span className="text-xs font-mono">{r.settlement.payment_ref || '—'}</span>
                        )}
                      </td>
                      <td>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              const nextStatus = r.settlement.status === 'paid' ? 'pending' : 'paid'
                              updateSettlement(r.teacherId, {
                                status: nextStatus,
                                paid_at: nextStatus === 'paid' ? new Date().toISOString() : undefined,
                              })
                              toast.success(`${r.teacherName} marked ${nextStatus}`)
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              r.settlement.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {r.settlement.status === 'paid' ? 'Paid ✓' : 'Mark Paid'}
                          </button>
                        ) : (
                          <Badge variant={r.settlement.status === 'paid' ? 'approved' : 'pending'}>
                            {r.settlement.status}
                          </Badge>
                        )}
                      </td>
                      <td className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setSlipRow(r)}>
                          <FileText className="w-3.5 h-3.5" /> Slip
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: SESSION BREAKDOWN & CALCULATOR */}
      {tab === 'sessions' && (
        <div className="space-y-5">
          {canCalculate && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2 w-full">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary-700" /> Calculate Session Payable
                  </CardTitle>
                  {unbilledEndedClasses.length > 0 && (
                    <Button size="sm" variant="secondary" loading={bulkCalculating} onClick={calculateAllUnbilled}>
                      <Zap className="w-3.5 h-3.5" /> Batch Calculate {unbilledEndedClasses.length} Ended Classes
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={calculatePayable} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <Input
                    label="Ended Class Session ID"
                    type="number"
                    required
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                  />
                  <Input
                    label="Hourly Rate (BDT)"
                    type="number"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                  <div className="text-xs text-muted pb-2">
                    Total shown: <strong className="text-heading">{totalSessionPayable.toFixed(2)} BDT</strong>
                  </div>
                  <Button type="submit" loading={saving}>Calculate Payable</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="p-5 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : payables.length === 0 ? (
                <div className="text-center py-12 text-muted text-sm">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No teacher payables calculated yet.
                </div>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Teacher</th>
                      <th>Course / Session</th>
                      <th>Month</th>
                      <th>Minutes</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payables.map((p) => {
                      const meta = getStatusMeta(PAYABLE_MACHINE, p.status)
                      return (
                        <tr key={p.id} data-entity="teacher_payable" data-state={meta.state}>
                          <td>
                            <p className="font-semibold text-heading">{p.teacher_name || 'Teacher'}</p>
                            <p className="text-xs text-muted">{p.teacher_email}</p>
                          </td>
                          <td className="text-xs">{p.course_title || 'Class'} · #{p.class_session_id}</td>
                          <td className="text-xs">{p.billing_month}</td>
                          <td className="text-xs">{p.conducted_minutes}m</td>
                          <td className="text-xs">{Number(p.hourly_rate).toFixed(0)} BDT/h</td>
                          <td className="font-bold text-primary-700">{Number(p.payable_amount).toFixed(2)} BDT</td>
                          <td><Badge variant={meta.badgeVariant}>{meta.label}</Badge></td>
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

      {/* OFFICIAL SALARY SLIP MODAL */}
      {slipRow && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">{branding.academyName}</p>
                <p className="text-[11px] text-muted">{branding.tagline}</p>
                <h3 className="text-lg font-bold text-heading mt-0.5">
                  Official Teacher Salary Slip · {slipRow.settlement.month}
                </h3>
              </div>
              <button type="button" onClick={() => setSlipRow(null)} className="text-muted hover:text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted">Teacher Name</p>
                <p className="font-semibold text-heading">{slipRow.teacherName}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Sessions Conducted</p>
                <p className="font-semibold text-heading">
                  {slipRow.sessionsCount} sessions ({slipRow.totalMinutes} mins)
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Session Earnings</p>
                <p className="font-semibold text-heading">৳ {slipRow.sessionEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Fixed Retainer + Bonus</p>
                <p className="font-semibold text-teal-700">+ ৳ {(slipRow.retainer + slipRow.bonus).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Deductions</p>
                <p className="font-semibold text-rose-700">- ৳ {slipRow.deduction.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Net Payable Salary</p>
                <p className="text-lg font-bold text-primary-700">৳ {slipRow.netPayable.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Settlement Status</p>
                <Badge variant={slipRow.settlement.status === 'paid' ? 'approved' : 'pending'}>
                  {slipRow.settlement.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted">Payment Reference</p>
                <p className="font-mono text-xs text-heading">{slipRow.settlement.payment_ref || 'Pending'}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end flex-wrap pt-2 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText(buildSalarySlipText(slipRow))
                  setSlipCopied(true)
                  setTimeout(() => setSlipCopied(false), 2000)
                }}
              >
                {slipCopied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />} Copy
              </Button>
              <a
                href={buildWhatsAppUrl(buildSalarySlipText(slipRow))}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <a
                href={buildTelegramShareUrl(buildSalarySlipText(slipRow))}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
              >
                <Send className="w-4 h-4" /> Telegram
              </a>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4" /> Print / PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
