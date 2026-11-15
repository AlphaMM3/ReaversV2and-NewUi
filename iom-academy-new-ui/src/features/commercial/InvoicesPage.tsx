import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toArray } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { StudentAvatar, Student360Drawer, type StudentSummaryTarget } from '@/components/Student360Drawer'
import { useToast } from '@/components/ui/Toast'
import { INVOICE_MACHINE, getStatusMeta } from '@/lib/stateMachines'
import { buildInvoiceText, buildWhatsAppUrl, buildTelegramShareUrl } from '@/lib/messaging'
import { getDhakaDateString } from '@/lib/utils'
import {
  ACADEMY_BRANDING_KEY,
  type AcademyBranding,
  type CourseFeePlan,
  DEFAULT_ACADEMY_BRANDING,
  FEE_PLANS_KEY,
  useLocalStore,
} from '@/lib/superAdminStore'
import {
  Receipt, Plus, CheckCircle, XCircle, MessageCircle, Send, Printer, Copy, X,
  Layers, Percent, ShieldCheck, Zap,
} from 'lucide-react'

type InvoiceTab = 'list' | 'bulk' | 'reminders' | 'plans' | 'references'

interface Invoice {
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

interface EnrollmentOption {
  id: number
  student_id?: number
  student_name: string
  course_id?: number
  course_title: string
  batch_name: string
  delivery_mode?: string
  status?: string
}

interface CourseOption {
  id: number
  title: string
  duration_type: string
}

interface PaymentReferenceRow {
  id: number
  enrollment_id: number
  billing_month: string
  reference_code: string
  payment_status: 'paid' | 'due' | 'waived' | 'unknown'
  portal_url?: string | null
  verified_at?: string | null
  notes?: string | null
  student_name: string
  course_title: string
  batch_name: string
}

type InvoiceOverlayState =
  | { mode: 'idle' }
  | { mode: 'create' }
  | { mode: 'record_payment'; invoice: Invoice }
  | { mode: 'receipt'; invoice: Invoice }

export default function InvoicesPage({ role }: { role: string }) {
  const isAdmin = role === 'central_admin' || role === 'branch_admin'
  const today = getDhakaDateString()
  const [tab, setTab] = useState<InvoiceTab>('list')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [overlay, setOverlay] = useState<InvoiceOverlayState>({ mode: 'idle' })
  const [phoneInput, setPhoneInput] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const toast = useToast()

  // Fee plans & Branding persisted store
  const [feePlans, setFeePlans] = useLocalStore<Record<number, CourseFeePlan>>(FEE_PLANS_KEY, {})
  const [branding] = useLocalStore<AcademyBranding>(ACADEMY_BRANDING_KEY, DEFAULT_ACADEMY_BRANDING)

  // Create form state
  const [enrollmentId, setEnrollmentId] = useState('')
  const [billingMonth, setBillingMonth] = useState(() => today.slice(0, 7))
  const [amountDue, setAmountDue] = useState('1500')
  const [dueDate, setDueDate] = useState(today)
  const [notes, setNotes] = useState('')

  // Record payment form state
  const [refCode, setRefCode] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Bulk invoice & WA Reminder Sheet state
  const [bulkMonth, setBulkMonth] = useState(() => today.slice(0, 7))
  const [bulkDueDate, setBulkDueDate] = useState(() => `${today.slice(0, 7)}-10`)
  const [bulkSelected, setBulkSelected] = useState<Record<number, boolean>>({})
  const [bulkCustomDiscount, setBulkCustomDiscount] = useState<Record<number, number>>({})
  const [bulkRunning, setBulkRunning] = useState(false)
  const [reminderMonth, setReminderMonth] = useState(() => today.slice(0, 7))
  const [perStudentPhones, setPerStudentPhones] = useState<Record<number, string>>({})
  const [bulkCopied, setBulkCopied] = useState(false)

  // Payment reference verification form + Guardian screenshot queue
  const [prEnrollmentId, setPrEnrollmentId] = useState('')
  const [prMonth, setPrMonth] = useState(() => today.slice(0, 7))
  const [prCode, setPrCode] = useState('')
  const [prStatus, setPrStatus] = useState<'paid' | 'due' | 'waived' | 'unknown'>('paid')
  const [prNotes, setPrNotes] = useState('')
  const [previewProofImg, setPreviewProofImg] = useState<string | null>(null)
  const [reviewingSubId, setReviewingSubId] = useState<number | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentSummaryTarget | null>(null)

  const qc = useQueryClient()

  const { data: studentsForDrawer = [] } = useQuery<Array<{ id: number; full_name: string; family_id?: number; branch_id?: number }>>({
    queryKey: ['students-lookup-drawer'],
    queryFn: () => api.get<any[]>('/students').then(toArray).catch(() => []),
    enabled: isAdmin,
  })

  function openStudentDrawerByName(name: string, fallbackId: number) {
    const found = studentsForDrawer.find((s) => s.full_name.toLowerCase() === name.toLowerCase())
    setSelectedStudent(found || { id: fallbackId, full_name: name })
  }

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', statusFilter],
    queryFn: () =>
      api
        .get<Invoice[] | { items?: Invoice[] }>(`/invoices${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)
        .then(toArray),
  })

  const { data: allInvoicesForBulk = [] } = useQuery<Invoice[]>({
    queryKey: ['invoices-all-bulk'],
    queryFn: () => api.get<Invoice[] | { items?: Invoice[] }>('/invoices').then(toArray),
    enabled: isAdmin && (tab === 'bulk' || tab === 'reminders'),
  })

  const { data: enrollments = [] } = useQuery<EnrollmentOption[]>({
    queryKey: ['enrollments-for-invoice'],
    queryFn: () => api.get<EnrollmentOption[] | { items?: EnrollmentOption[] }>('/enrollments?limit=500').then(toArray),
    enabled: isAdmin && (overlay.mode === 'create' || tab === 'bulk' || tab === 'references'),
  })

  const { data: courses = [] } = useQuery<CourseOption[]>({
    queryKey: ['courses-for-fees'],
    queryFn: () => api.get<CourseOption[] | { items?: CourseOption[] }>('/courses').then(toArray),
    enabled: isAdmin,
  })

  const { data: paymentRefs = [], isLoading: loadingRefs } = useQuery<PaymentReferenceRow[]>({
    queryKey: ['payment-references'],
    queryFn: () =>
      api.get<PaymentReferenceRow[] | { items?: PaymentReferenceRow[] }>('/payments/references').then(toArray),
    enabled: isAdmin && tab === 'references',
  })

  const { data: guardianSubmissions = [], isLoading: loadingSubmissions } = useQuery<any[]>({
    queryKey: ['admin-payment-submissions'],
    queryFn: () =>
      api.get<any[]>('/guardian/payment-submissions').then(toArray).catch(() => []),
    enabled: isAdmin && tab === 'references',
  })

  async function reviewGuardianSubmission(subId: number, action: 'approve' | 'reject') {
    setReviewingSubId(subId)
    try {
      await api.post(`/guardian/payment-submissions/${subId}/review`, {
        action,
        review_note: action === 'approve' ? 'Verified & reconciled in TrxID Queue' : 'Screenshot / TrxID rejected by Accounts',
      })
      toast.success(
        action === 'approve'
          ? 'Payment verified & invoice automatically marked Paid!'
          : 'Submission rejected',
      )
      qc.invalidateQueries({ queryKey: ['admin-payment-submissions'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoices-all-bulk'] })
    } catch (err) {
      toast.error(err, 'Failed to review payment submission')
    } finally {
      setReviewingSubId(null)
    }
  }

  function getPlanForCourse(courseId?: number, courseTitle?: string): CourseFeePlan {
    const matched =
      (courseId && feePlans[courseId]) ||
      courses
        .filter((c) => c.title === courseTitle)
        .map((c) => feePlans[c.id])
        .find(Boolean)
    return (
      matched || {
        course_id: courseId || 0,
        monthly_fee: 1500,
        one_to_one_fee: 3000,
        sibling_discount_pct: 10,
        scholarship_discount_pct: 25,
        due_day: 10,
        notes: '',
      }
    )
  }

  function updateFeePlan(courseId: number, patch: Partial<CourseFeePlan>) {
    setFeePlans((prev) => {
      const existing = prev[courseId] || {
        course_id: courseId,
        monthly_fee: 1500,
        one_to_one_fee: 3000,
        sibling_discount_pct: 10,
        scholarship_discount_pct: 25,
        due_day: 10,
        notes: '',
      }
      return { ...prev, [courseId]: { ...existing, ...patch, course_id: courseId } }
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/invoices', {
        enrollment_id: Number(enrollmentId),
        billing_month: billingMonth,
        amount_due: Number(amountDue),
        due_date: dueDate,
        notes: notes.trim() || undefined,
      })
      setOverlay({ mode: 'idle' })
      setNotes('')
      toast.success('Online tuition invoice created')
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoices-all-bulk'] })
    } catch (err) {
      toast.error(err, 'Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault()
    if (overlay.mode !== 'record_payment') return
    setSubmitting(true)
    try {
      await api.post(`/invoices/${overlay.invoice.id}/record-payment`, {
        payment_reference_code: refCode.trim(),
        amount_paid: Number(payAmount),
      })
      setOverlay({ mode: 'idle' })
      setRefCode('')
      setPayAmount('')
      toast.success(`Recorded payment for ${overlay.invoice.invoice_number}`)
      qc.invalidateQueries({ queryKey: ['invoices'] })
    } catch (err) {
      toast.error(err, 'Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  function copyReceiptText(inv: Invoice) {
    navigator.clipboard?.writeText(buildInvoiceText(inv))
    setCopiedId(inv.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Bulk invoice candidates
  const bulkRows = useMemo(() => {
    const activeEnrs = enrollments.filter((e) => !e.status || ['active', 'enrolled'].includes(e.status))
    const invoicedThisMonth = new Set(
      allInvoicesForBulk.filter((i) => i.billing_month === bulkMonth).map((i) => i.enrollment_id),
    )
    return activeEnrs.map((en) => {
      const plan = getPlanForCourse(en.course_id, en.course_title)
      const baseFee = en.delivery_mode === 'one_to_one' ? plan.one_to_one_fee : plan.monthly_fee
      const discountPct = bulkCustomDiscount[en.id] ?? 0
      const finalFee = Math.max(100, Math.round(baseFee * (1 - discountPct / 100)))
      const alreadyBilled = invoicedThisMonth.has(en.id)
      return {
        ...en,
        baseFee,
        discountPct,
        finalFee,
        alreadyBilled,
        selected: bulkSelected[en.id] ?? !alreadyBilled,
      }
    })
  }, [enrollments, allInvoicesForBulk, bulkMonth, feePlans, courses, bulkCustomDiscount, bulkSelected])

  async function runBulkGenerate() {
    const targets = bulkRows.filter((r) => r.selected)
    if (targets.length === 0) {
      toast.error(new Error('Select at least one enrollment to invoice'))
      return
    }
    setBulkRunning(true)
    let created = 0
    let failed = 0
    for (const r of targets) {
      try {
        await api.post('/invoices', {
          enrollment_id: r.id,
          billing_month: bulkMonth,
          amount_due: r.finalFee,
          due_date: bulkDueDate,
          notes:
            r.discountPct > 0
              ? `Bulk monthly tuition (${r.discountPct}% scholarship/sibling discount applied)`
              : 'Bulk monthly online tuition invoice',
        })
        created += 1
      } catch {
        failed += 1
      }
    }
    setBulkRunning(false)
    qc.invalidateQueries({ queryKey: ['invoices'] })
    qc.invalidateQueries({ queryKey: ['invoices-all-bulk'] })
    if (created > 0) {
      setReminderMonth(bulkMonth)
      setTab('reminders')
      toast.success(`Generated ${created} invoices — WhatsApp Reminder Sheet ready!${failed ? ` (${failed} failed)` : ''}`)
    } else {
      toast.success(`Generated ${created} invoices${failed ? ` (${failed} failed)` : ''}`)
      setTab('list')
    }
  }

  async function submitPaymentReference(e: React.FormEvent) {
    e.preventDefault()
    if (!prEnrollmentId || !prCode.trim()) return
    setSubmitting(true)
    try {
      await api.post('/payments/references', {
        enrollment_id: Number(prEnrollmentId),
        billing_month: prMonth,
        reference_code: prCode.trim(),
        payment_status: prStatus,
        notes: prNotes.trim() || undefined,
      })
      setPrCode('')
      setPrNotes('')
      toast.success('Verified payment reference recorded')
      qc.invalidateQueries({ queryKey: ['payment-references'] })
    } catch (err) {
      toast.error(err, 'Failed to save payment reference')
    } finally {
      setSubmitting(false)
    }
  }

  const totalDue = invoices.reduce((s, i) => s + Number(i.amount_due || 0), 0)
  const totalPaid = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0)

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Online Invoices, Fee Plans &amp; Payment Verification</h2>
          <p className="text-xs text-muted mt-0.5">
            Generate single or bulk monthly fee invoices, manage scholarship/sibling fee plans, verify bKash/Nagad TrxIDs, and send receipts via WhatsApp/Telegram
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Guardian WhatsApp (e.g. 017...)"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border bg-surface w-56 focus:outline-none focus:ring-2 focus:ring-primary-700"
          />
          {isAdmin && (
            <Button
              size="sm"
              variant={overlay.mode === 'create' ? 'primary' : 'outline'}
              onClick={() => {
                setTab('list')
                setOverlay(overlay.mode === 'create' ? { mode: 'idle' } : { mode: 'create' })
              }}
            >
              <Plus className="w-4 h-4" /> New Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Super Admin Finance Sub-tabs */}
      {isAdmin && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setTab('list')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold ${
              tab === 'list' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Invoices &amp; Receipts
          </button>
          <button
            type="button"
            onClick={() => setTab('bulk')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold ${
              tab === 'bulk' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Bulk Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setTab('reminders')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold ${
              tab === 'reminders' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" /> WA/TG Reminder Sheet
          </button>
          <button
            type="button"
            onClick={() => setTab('plans')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold ${
              tab === 'plans' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
            }`}
          >
            <Percent className="w-3.5 h-3.5" /> Fee Plans &amp; Discounts
          </button>
          <button
            type="button"
            onClick={() => setTab('references')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold ${
              tab === 'references' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> TrxID Verification Queue
          </button>
        </div>
      )}

      {/* TAB 1: ALL INVOICES */}
      {tab === 'list' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted uppercase font-semibold">Invoices Shown</p>
                <p className="text-2xl font-bold text-heading mt-1">{invoices.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted uppercase font-semibold">Total Billed</p>
                <p className="text-2xl font-bold text-primary-700 mt-1">{totalDue.toFixed(2)} BDT</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted uppercase font-semibold">Total Collected</p>
                <p className="text-2xl font-bold text-teal-700 mt-1">{totalPaid.toFixed(2)} BDT</p>
              </CardContent>
            </Card>
          </div>

          {overlay.mode === 'create' && isAdmin && (
            <Card data-overlay-mode="create">
              <CardHeader>
                <CardTitle>Create Online Tuition Invoice</CardTitle>
                <button type="button" onClick={() => setOverlay({ mode: 'idle' })} className="text-muted hover:text-heading">
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-heading block mb-1">Enrollment</label>
                    <select
                      required
                      value={enrollmentId}
                      onChange={(e) => {
                        const val = e.target.value
                        setEnrollmentId(val)
                        const chosen = enrollments.find((x) => String(x.id) === val)
                        if (chosen) {
                          const plan = getPlanForCourse(chosen.course_id, chosen.course_title)
                          setAmountDue(String(chosen.delivery_mode === 'one_to_one' ? plan.one_to_one_fee : plan.monthly_fee))
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-bg"
                    >
                      <option value="">— Select student enrollment —</option>
                      {enrollments.map((en) => (
                        <option key={en.id} value={en.id}>
                          #{en.id} · {en.student_name} — {en.course_title} ({en.batch_name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Billing Month"
                    type="month"
                    required
                    value={billingMonth}
                    onChange={(e) => setBillingMonth(e.target.value)}
                  />
                  <Input
                    label="Amount Due (BDT)"
                    type="number"
                    required
                    min="1"
                    value={amountDue}
                    onChange={(e) => setAmountDue(e.target.value)}
                  />
                  <Input
                    label="Due Date"
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <div className="md:col-span-4">
                    <Input
                      label="Notes (optional)"
                      placeholder="Monthly tuition / 1:1 package fee"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <Button type="submit" loading={submitting}>Create Invoice</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {overlay.mode === 'record_payment' && (
            <Card data-overlay-mode="record_payment" className="border-primary-500">
              <CardHeader>
                <CardTitle>Record Verified Payment — {overlay.invoice.invoice_number}</CardTitle>
                <button type="button" onClick={() => setOverlay({ mode: 'idle' })} className="text-muted hover:text-heading">
                  <X className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecordPayment} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <Input
                    label="External Payment Reference"
                    placeholder="bKash / SSL / Portal Ref #"
                    required
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                  />
                  <Input
                    label="Amount Paid (BDT)"
                    type="number"
                    step="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                  <div className="text-xs text-muted pb-2">
                    Due: <strong>{Number(overlay.invoice.amount_due).toFixed(2)}</strong> · Paid so far:{' '}
                    <strong>{Number(overlay.invoice.amount_paid).toFixed(2)}</strong>
                  </div>
                  <Button type="submit" loading={submitting}>
                    <CheckCircle className="w-4 h-4" /> Confirm Receipt
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 flex-wrap">
            {['all', 'unpaid', 'partially_paid', 'paid'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? 'bg-primary-700 text-white'
                    : 'bg-surface border border-border text-body hover:bg-primary-50'
                }`}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-14 text-muted">
                  <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium text-heading">No invoices found</p>
                  <p className="text-xs mt-1">Create a single or bulk online tuition invoice above.</p>
                </div>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Student & Course</th>
                      <th>Month</th>
                      <th>Due / Paid</th>
                      <th>Status</th>
                      <th>Payment Ref</th>
                      <th className="text-right">Receipt · WhatsApp · Telegram</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const msg = buildInvoiceText(inv)
                      const meta = getStatusMeta(INVOICE_MACHINE, inv.status)
                      return (
                        <tr key={inv.id} data-entity="invoice" data-state={meta.state}>
                          <td className="font-mono text-xs font-semibold text-heading">{inv.invoice_number}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => openStudentDrawerByName(inv.student_name, inv.enrollment_id)}
                              className="inline-flex items-center gap-2 text-left group"
                            >
                              <StudentAvatar
                                studentId={studentsForDrawer.find((s) => s.full_name.toLowerCase() === inv.student_name.toLowerCase())?.id}
                                name={inv.student_name}
                                size="xs"
                              />
                              <div>
                                <p className="font-semibold text-heading group-hover:text-primary-700 group-hover:underline">
                                  {inv.student_name}
                                </p>
                                <p className="text-xs text-muted">{inv.course_title} · {inv.batch_name}</p>
                              </div>
                            </button>
                          </td>
                          <td className="text-xs">{inv.billing_month}</td>
                          <td>
                            <p className="font-semibold text-heading">{Number(inv.amount_due).toFixed(2)} BDT</p>
                            <p className="text-xs text-teal-700">Paid: {Number(inv.amount_paid).toFixed(2)}</p>
                          </td>
                          <td>
                            <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                          </td>
                          <td className="text-xs font-mono text-muted">
                            {inv.payment_reference_code || '—'}
                          </td>
                          <td>
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {isAdmin && inv.status !== 'paid' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setPayAmount(
                                      String(Math.max(0, Number(inv.amount_due) - Number(inv.amount_paid))),
                                    )
                                    setOverlay({ mode: 'record_payment', invoice: inv })
                                  }}
                                >
                                  Record Pay
                                </Button>
                              )}
                              <button
                                type="button"
                                onClick={() => setOverlay({ mode: 'receipt', invoice: inv })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-semibold"
                                title="View / Print Digital Receipt"
                              >
                                <Printer className="w-3.5 h-3.5" /> Receipt
                              </button>
                              <a
                                href={buildWhatsAppUrl(msg, phoneInput)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold"
                                title="Send via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </a>
                              <a
                                href={buildTelegramShareUrl(msg)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold"
                                title="Send via Telegram"
                              >
                                <Send className="w-3.5 h-3.5" /> Telegram
                              </a>
                              <button
                                type="button"
                                onClick={() => copyReceiptText(inv)}
                                className="p-1.5 rounded-md border border-border text-muted hover:text-heading"
                                title="Copy invoice text"
                              >
                                {copiedId === inv.id ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
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
        </>
      )}

      {/* TAB 2: ONE-CLICK BULK MONTHLY BILLING */}
      {tab === 'bulk' && isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3 w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary-700" /> Bulk Monthly Tuition Invoice Generator
                </CardTitle>
                <p className="text-xs text-muted mt-0.5">
                  Automatically applies each course&apos;s Fee Plan, skips students already billed for {bulkMonth}, and lets you apply sibling/zakat waivers before issuing.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input label="Billing Month" type="month" value={bulkMonth} onChange={(e) => setBulkMonth(e.target.value)} />
                <Input label="Due Date" type="date" value={bulkDueDate} onChange={(e) => setBulkDueDate(e.target.value)} />
                <div className="pt-5">
                  <Button loading={bulkRunning} onClick={runBulkGenerate}>
                    <Zap className="w-4 h-4" /> Generate {bulkRows.filter((r) => r.selected).length} Invoices
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {bulkRows.length === 0 ? (
              <p className="text-center text-sm text-muted py-12">No active enrollments found.</p>
            ) : (
              <table className="iom-table">
                <thead>
                  <tr>
                    <th>Include</th>
                    <th>Student &amp; Course</th>
                    <th>Base Fee</th>
                    <th>Discount / Waiver %</th>
                    <th>Final Invoice (BDT)</th>
                    <th>{bulkMonth} Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((r) => {
                    const plan = getPlanForCourse(r.course_id, r.course_title)
                    return (
                      <tr key={r.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={r.selected}
                            onChange={(e) => setBulkSelected((p) => ({ ...p, [r.id]: e.target.checked }))}
                          />
                        </td>
                        <td>
                          <p className="font-semibold text-heading">{r.student_name}</p>
                          <p className="text-xs text-muted">{r.course_title} · {r.batch_name}</p>
                        </td>
                        <td className="text-xs font-mono">৳ {r.baseFee.toLocaleString()}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={95}
                              value={r.discountPct}
                              onChange={(e) =>
                                setBulkCustomDiscount((p) => ({ ...p, [r.id]: Math.min(95, Math.max(0, Number(e.target.value))) }))
                              }
                              className="w-16 px-2 py-1 text-xs rounded border border-border bg-bg"
                            />
                            <button
                              type="button"
                              onClick={() => setBulkCustomDiscount((p) => ({ ...p, [r.id]: plan.sibling_discount_pct }))}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 font-semibold"
                            >
                              Sibling ({plan.sibling_discount_pct}%)
                            </button>
                            <button
                              type="button"
                              onClick={() => setBulkCustomDiscount((p) => ({ ...p, [r.id]: plan.scholarship_discount_pct }))}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold"
                            >
                              Zakat ({plan.scholarship_discount_pct}%)
                            </button>
                          </div>
                        </td>
                        <td className="font-bold text-primary-700">৳ {r.finalFee.toLocaleString()}</td>
                        <td>
                          <Badge variant={r.alreadyBilled ? 'approved' : 'pending'}>
                            {r.alreadyBilled ? 'Already Billed' : 'Pending Bill'}
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
      )}

      {/* TAB 3: COURSE FEE PLANS & DISCOUNTS */}
      {tab === 'plans' && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Course Fee Plans, Sibling Discounts &amp; Scholarship Rules</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {courses.length === 0 ? (
              <p className="text-center text-sm text-muted py-12">Create courses in Academy Setup first.</p>
            ) : (
              <table className="iom-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Group Monthly Fee (BDT)</th>
                    <th>1:1 Package Fee (BDT)</th>
                    <th>Sibling Discount %</th>
                    <th>Scholarship / Zakat %</th>
                    <th>Default Due Day</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => {
                    const plan = getPlanForCourse(c.id, c.title)
                    return (
                      <tr key={c.id}>
                        <td>
                          <p className="font-semibold text-heading">{c.title}</p>
                          <p className="text-xs text-muted">{c.duration_type}</p>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={plan.monthly_fee}
                            onChange={(e) => updateFeePlan(c.id, { monthly_fee: Number(e.target.value) })}
                            className="w-28 px-2.5 py-1.5 text-xs rounded border border-border bg-bg font-mono"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={plan.one_to_one_fee}
                            onChange={(e) => updateFeePlan(c.id, { one_to_one_fee: Number(e.target.value) })}
                            className="w-28 px-2.5 py-1.5 text-xs rounded border border-border bg-bg font-mono"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            max={90}
                            value={plan.sibling_discount_pct}
                            onChange={(e) => updateFeePlan(c.id, { sibling_discount_pct: Number(e.target.value) })}
                            className="w-20 px-2.5 py-1.5 text-xs rounded border border-border bg-bg font-mono"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={plan.scholarship_discount_pct}
                            onChange={(e) => updateFeePlan(c.id, { scholarship_discount_pct: Number(e.target.value) })}
                            className="w-20 px-2.5 py-1.5 text-xs rounded border border-border bg-bg font-mono"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={1}
                            max={28}
                            value={plan.due_day}
                            onChange={(e) => updateFeePlan(c.id, { due_day: Number(e.target.value) })}
                            className="w-16 px-2.5 py-1.5 text-xs rounded border border-border bg-bg font-mono"
                          />
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

      {/* TAB 4: VERIFIED PAYMENT REFERENCES QUEUE (/payments/references + Guardian Proof Inbox) */}
      {tab === 'references' && isAdmin && (
        <div className="space-y-5">
          {/* Guardian Self-Submitted bKash/Nagad TrxID + Screenshot Queue */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>
                  Guardian Self-Submitted TrxID &amp; Receipt Screenshots ({guardianSubmissions.length})
                </CardTitle>
                <Badge variant="pending">
                  {guardianSubmissions.filter((g) => g.status === 'pending').length} Pending Review
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSubmissions ? (
                <Skeleton className="h-24" />
              ) : guardianSubmissions.length === 0 ? (
                <p className="text-xs text-muted py-6 text-center">
                  No Guardian self-submitted bKash/Nagad screenshots yet. Guardians submit from the Unified Guardian Portal.
                </p>
              ) : (
                <div className="space-y-3">
                  {guardianSubmissions.map((g) => (
                    <div key={g.id} className="p-3.5 rounded-xl border border-border bg-bg/40 flex items-center justify-between flex-wrap gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        {g.screenshot_data ? (
                          <button
                            type="button"
                            onClick={() => setPreviewProofImg(g.screenshot_data)}
                            className="shrink-0 group relative"
                            title="Click to inspect receipt screenshot"
                          >
                            <img
                              src={g.screenshot_data}
                              alt={g.trx_id}
                              className="w-14 h-14 rounded-lg object-cover border border-border group-hover:ring-2 group-hover:ring-primary-600"
                            />
                          </button>
                        ) : (
                          <div className="w-14 h-14 rounded-lg border border-border bg-surface flex items-center justify-center text-[10px] text-muted">
                            No Img
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-heading">
                            {g.student_name} · {g.payment_method} <span className="font-mono text-primary-800">{g.trx_id}</span> · ৳{Number(g.amount).toLocaleString()}
                          </p>
                          <p className="text-muted">
                            Invoice: <span className="font-mono">{g.invoice_number}</span> ({g.billing_month})
                            {g.sender_number ? ` · Sender: ${g.sender_number}` : ''}
                            {g.submitter_name ? ` · Submitted by ${g.submitter_name}` : ''}
                          </p>
                          {g.notes && <p className="text-[11px] text-body italic mt-0.5">{g.notes}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={g.status === 'approved' ? 'approved' : g.status === 'rejected' ? 'returned' : 'pending'}>
                          {g.status}
                        </Badge>
                        {g.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              loading={reviewingSubId === g.id}
                              disabled={reviewingSubId !== null}
                              onClick={() => reviewGuardianSubmission(g.id, 'approve')}
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Verify &amp; Mark Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={reviewingSubId !== null}
                              onClick={() => reviewGuardianSubmission(g.id, 'reject')}
                            >
                              <XCircle className="w-3.5 h-3.5 text-red-600" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Log / Verify External bKash, Nagad or Bank Payment Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitPaymentReference} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-heading mb-1">Student Enrollment</label>
                  <select
                    required
                    value={prEnrollmentId}
                    onChange={(e) => setPrEnrollmentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    <option value="">— Select enrollment —</option>
                    {enrollments.map((en) => (
                      <option key={en.id} value={en.id}>
                        #{en.id} · {en.student_name} — {en.course_title}
                      </option>
                    ))}
                  </select>
                </div>
                <Input label="Month" type="month" value={prMonth} onChange={(e) => setPrMonth(e.target.value)} required />
                <Input label="TrxID / Reference Code" placeholder="BKASH-9X220K" value={prCode} onChange={(e) => setPrCode(e.target.value)} required />
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1">Verification Status</label>
                  <select
                    value={prStatus}
                    onChange={(e) => setPrStatus(e.target.value as 'paid' | 'due' | 'waived' | 'unknown')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                  >
                    <option value="paid">Verified Paid</option>
                    <option value="due">Payment Due</option>
                    <option value="waived">Fee Waived</option>
                    <option value="unknown">Unknown / Hold</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <Input label="Admin Notes" placeholder="Verified from merchant statement" value={prNotes} onChange={(e) => setPrNotes(e.target.value)} />
                </div>
                <Button type="submit" loading={submitting}>Save Verification</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verified Payment References ({paymentRefs.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {loadingRefs ? (
                <div className="p-5 space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : paymentRefs.length === 0 ? (
                <p className="text-center text-sm text-muted py-12">No external payment references recorded yet.</p>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Student &amp; Course</th>
                      <th>Billing Month</th>
                      <th>Reference Code</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentRefs.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <p className="font-semibold text-heading">{r.student_name}</p>
                          <p className="text-xs text-muted">{r.course_title} · {r.batch_name}</p>
                        </td>
                        <td className="text-xs font-mono">{r.billing_month}</td>
                        <td className="text-xs font-mono font-semibold">{r.reference_code}</td>
                        <td>
                          <Badge variant={r.payment_status === 'paid' || r.payment_status === 'waived' ? 'approved' : 'pending'}>
                            {r.payment_status}
                          </Badge>
                        </td>
                        <td className="text-xs text-muted">{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: BULK MONTHLY WHATSAPP / TELEGRAM FEE REMINDER SHEET */}
      {tab === 'reminders' && isAdmin && (() => {
        const unpaidList = allInvoicesForBulk.filter((inv) => {
          const bal = Math.max(0, Number(inv.amount_due || 0) - Number(inv.amount_paid || 0))
          if (bal <= 0) return false
          if (reminderMonth && inv.billing_month !== reminderMonth) return false
          return true
        })

        const buildReminderMessage = (inv: Invoice) => {
          const bal = Math.max(0, Number(inv.amount_due || 0) - Number(inv.amount_paid || 0))
          return [
            `*${branding.academyName} — Fee Reminder (${inv.billing_month})*`,
            `আসসালামু আলাইকুম ${inv.student_name}-এর অভিভাবক,`,
            `Invoice #${inv.invoice_number} (${inv.course_title} · ${inv.batch_name})`,
            `মোট বকেয়া: *৳${bal.toLocaleString()} BDT* (Due: ${inv.due_date})`,
            `পেমেন্ট করুন: bKash ${branding.bkashNumber} | Nagad ${branding.nagadNumber}`,
            `টাকা পাঠিয়ে TrxID শেয়ার করুন। সহায়তায়: ${branding.helplinePhone}`,
          ].join('\n')
        }

        const copyAllReminders = () => {
          const combined = unpaidList
            .map((inv, idx) => `#${idx + 1} [${inv.student_name}]\n${buildReminderMessage(inv)}`)
            .join('\n\n====================\n\n')
          navigator.clipboard?.writeText(combined)
          setBulkCopied(true)
          setTimeout(() => setBulkCopied(false), 2500)
          toast.success(`Copied ${unpaidList.length} reminder message(s) to clipboard`)
        }

        const exportReminderCsv = () => {
          const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
          const rows = [
            ['Invoice', 'Student', 'Course', 'Billing Month', 'Balance Due (BDT)', 'Due Date', 'Guardian Phone', 'WhatsApp Reminder Message'],
            ...unpaidList.map((inv) => {
              const bal = Math.max(0, Number(inv.amount_due || 0) - Number(inv.amount_paid || 0))
              return [
                inv.invoice_number,
                inv.student_name,
                `${inv.course_title} (${inv.batch_name})`,
                inv.billing_month,
                String(bal),
                inv.due_date,
                perStudentPhones[inv.id] || phoneInput || '',
                buildReminderMessage(inv),
              ]
            }),
          ]
          const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\r\n')
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `iom-fee-reminders-${reminderMonth || 'all'}.csv`
          a.click()
          URL.revokeObjectURL(url)
        }

        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Bulk Monthly WhatsApp &amp; Telegram Fee Reminder Sheet ({unpaidList.length} Unpaid)</CardTitle>
                  <p className="text-xs text-muted mt-0.5">
                    Includes live merchant accounts: bKash {branding.bkashNumber} · Nagad {branding.nagadNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="month"
                    value={reminderMonth}
                    onChange={(e) => setReminderMonth(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border bg-bg"
                  />
                  {reminderMonth && (
                    <Button size="sm" variant="outline" onClick={() => setReminderMonth('')}>
                      All Months
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={exportReminderCsv} disabled={unpaidList.length === 0}>
                    Export CSV
                  </Button>
                  <Button size="sm" onClick={copyAllReminders} disabled={unpaidList.length === 0}>
                    {bulkCopied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy All ({unpaidList.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {unpaidList.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted">
                  No unpaid invoices found for {reminderMonth || 'any month'}.
                </div>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Student &amp; Invoice</th>
                      <th>Balance Due</th>
                      <th>Guardian Phone (WA)</th>
                      <th>Reminder Message Preview</th>
                      <th>1-Click Dispatch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidList.map((inv) => {
                      const bal = Math.max(0, Number(inv.amount_due || 0) - Number(inv.amount_paid || 0))
                      const msg = buildReminderMessage(inv)
                      const targetPhone = perStudentPhones[inv.id] ?? phoneInput
                      return (
                        <tr key={inv.id}>
                          <td>
                            <p className="font-semibold text-heading">{inv.student_name}</p>
                            <p className="text-xs font-mono text-muted">
                              {inv.invoice_number} · {inv.billing_month} (Due {inv.due_date})
                            </p>
                          </td>
                          <td className="text-xs font-bold text-rose-700">৳ {bal.toLocaleString()}</td>
                          <td>
                            <input
                              type="text"
                              placeholder="017..."
                              value={perStudentPhones[inv.id] ?? ''}
                              onChange={(e) => setPerStudentPhones((prev) => ({ ...prev, [inv.id]: e.target.value }))}
                              className="w-32 px-2 py-1 text-xs rounded-lg border border-border bg-bg"
                            />
                          </td>
                          <td className="max-w-xs">
                            <p className="text-[11px] text-body line-clamp-2">{msg}</p>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <a
                                href={buildWhatsAppUrl(msg, targetPhone)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                              </a>
                              <a
                                href={buildTelegramShareUrl(msg)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
                              >
                                <Send className="w-3.5 h-3.5" /> TG
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(msg)
                                  toast.success(`Copied reminder for ${inv.student_name}`)
                                }}
                                className="p-1.5 rounded-lg border border-border hover:bg-bg"
                                title="Copy single message"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
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
        )
      })()}

      {/* Printable Digital Receipt Overlay */}
      {overlay.mode === 'receipt' && (() => {
        const receiptInvoice = overlay.invoice
        return (
          <div data-overlay-mode="receipt" className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl border border-border max-w-lg w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">{branding.academyName}</p>
                  <p className="text-[11px] text-muted">{branding.tagline}</p>
                  <h3 className="text-lg font-bold text-heading mt-0.5">
                    {receiptInvoice.status === 'paid' ? 'Official Payment Receipt' : 'Tuition Fee Invoice'}
                  </h3>
                </div>
                <button type="button" onClick={() => setOverlay({ mode: 'idle' })} className="text-muted hover:text-heading">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted">Invoice Number</p>
                  <p className="font-mono font-semibold text-heading">{receiptInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Billing Month</p>
                  <p className="font-semibold text-heading">{receiptInvoice.billing_month}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Student Name</p>
                  <p className="font-semibold text-heading">{receiptInvoice.student_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Course / Batch</p>
                  <p className="font-semibold text-heading">{receiptInvoice.course_title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Total Fee</p>
                  <p className="font-bold text-heading">{Number(receiptInvoice.amount_due).toFixed(2)} BDT</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Amount Paid</p>
                  <p className="font-bold text-teal-700">{Number(receiptInvoice.amount_paid).toFixed(2)} BDT</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Due Date</p>
                  <p className="text-heading">{receiptInvoice.due_date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Reference Code</p>
                  <p className="font-mono text-heading">{receiptInvoice.payment_reference_code || 'Pending'}</p>
                </div>
              </div>

              <div className="bg-bg rounded-xl p-3 text-xs text-muted space-y-1">
                <p>
                  <span className="font-semibold text-heading">Merchant Accounts:</span> bKash {branding.bkashNumber} · Nagad {branding.nagadNumber}
                </p>
                <p>{branding.footerNote} · Support: {branding.helplinePhone}</p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <a
                  href={buildWhatsAppUrl(buildInvoiceText(receiptInvoice), phoneInput)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4" /> Send WhatsApp
                </a>
                <a
                  href={buildTelegramShareUrl(buildInvoiceText(receiptInvoice))}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
                >
                  <Send className="w-4 h-4" /> Send Telegram
                </a>
                <Button size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" /> Print / PDF
                </Button>
              </div>
            </div>
          </div>
        )
      })()}
      {previewProofImg && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewProofImg(null)}
        >
          <div className="bg-surface rounded-2xl p-4 max-w-lg w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-heading">Guardian Payment Receipt Screenshot</p>
              <button type="button" onClick={() => setPreviewProofImg(null)} className="text-muted hover:text-heading">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={previewProofImg} alt="Guardian payment proof" className="w-full max-h-[75vh] object-contain rounded-xl border border-border" />
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
