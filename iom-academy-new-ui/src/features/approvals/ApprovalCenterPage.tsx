import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toArray, type ReportRow } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import {
  FEE_WAIVERS_KEY,
  type FeeWaiverRequest,
  TEACHER_LEAVES_KEY,
  type TeacherLeaveRecord,
  STAR_STUDENTS_KEY,
  DEFAULT_STAR_STUDENTS,
  type StarStudentAward,
  useLocalStore,
} from '@/lib/superAdminStore'
import {
  CheckSquare, ShieldAlert, FileText, CalendarOff, UserPlus, Percent,
  CheckCircle, XCircle, Plus, CreditCard, Trophy, Send,
} from 'lucide-react'

type ApprovalCategory =
  | 'all'
  | 'payment_proofs'
  | 'corrections'
  | 'reports'
  | 'student_leaves'
  | 'admissions'
  | 'teacher_leaves'
  | 'fee_waivers'
  | 'star_students'

interface CorrectionRow {
  id: number
  class_id: number
  enrollment_id: number
  student_name: string
  requested_status?: string
  reason: string
  status: string
}

interface StudentLeaveRow {
  id: number
  student_name: string
  course_title: string
  start_date: string
  end_date: string
  reason: string
  status: string
  revision: number
}

interface AdmissionRow {
  id: number
  student_name: string
  course_title?: string
  course_id: number
  contact_phone: string
  country: string
  status: string
  revision: number
}

interface PaymentProofRow {
  id: number
  student_name?: string
  payment_method: string
  trx_id: string
  amount: number
  invoice_number?: string
  billing_month?: string
  sender_number?: string | null
  screenshot_data?: string | null
  status: string
}

export default function ApprovalCenterPage({ user }: { user: { name: string; role: string } }) {
  const toast = useToast()
  const qc = useQueryClient()
  const isAdmin = user.role === 'central_admin' || user.role === 'branch_admin'
  const isZimmadar = user.role === 'zimmadar'

  const [category, setCategory] = useState<ApprovalCategory>('all')
  const [reviewNote, setReviewNote] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  // Local queues (Teacher Leaves & Fee Waivers & Star Students)
  const [teacherLeaves, setTeacherLeaves] = useLocalStore<TeacherLeaveRecord[]>(TEACHER_LEAVES_KEY, [])
  const [feeWaivers, setFeeWaivers] = useLocalStore<FeeWaiverRequest[]>(FEE_WAIVERS_KEY, [])
  const [starStudents, setStarStudents] = useLocalStore<StarStudentAward[]>(STAR_STUDENTS_KEY, DEFAULT_STAR_STUDENTS)

  // Add Fee Waiver Modal/Inline form
  const [showWaiverForm, setShowWaiverForm] = useState(false)
  const [waiverStudent, setWaiverStudent] = useState('')
  const [waiverType, setWaiverType] = useState<FeeWaiverRequest['request_type']>('Sibling Discount')
  const [waiverAmount, setWaiverAmount] = useState('500')
  const [waiverReason, setWaiverReason] = useState('')

  // Backend Queries
  const { data: correctionsRaw, isLoading: loadingCorr } = useQuery({
    queryKey: ['approvals-corrections'],
    queryFn: () => api.get<CorrectionRow[]>('/attendance-corrections'),
  })
  const { data: reportsRaw, isLoading: loadingRep } = useQuery({
    queryKey: ['approvals-reports'],
    queryFn: () => api.get<ReportRow[]>('/reports?status=submitted'),
  })
  const { data: leavesRaw, isLoading: loadingLeaves } = useQuery({
    queryKey: ['approvals-student-leaves'],
    queryFn: () => api.get<StudentLeaveRow[]>('/leaves'),
  })
  const { data: admissionsRaw, isLoading: loadingAdm } = useQuery({
    queryKey: ['approvals-admissions'],
    queryFn: () => api.get<AdmissionRow[]>('/admissions'),
    enabled: isAdmin,
  })
  const { data: paymentProofsRaw, isLoading: loadingProofs } = useQuery<PaymentProofRow[]>({
    queryKey: ['approvals-payment-proofs'],
    queryFn: () =>
      api.get<PaymentProofRow[]>('/guardian/payment-submissions').catch(() => [] as PaymentProofRow[]),
    enabled: isAdmin || isZimmadar,
  })

  const pendingProofs = useMemo(
    () => toArray(paymentProofsRaw).filter((p) => p.status === 'pending'),
    [paymentProofsRaw],
  )
  const pendingCorrections = useMemo(
    () => toArray(correctionsRaw).filter((c) => c.status === 'pending'),
    [correctionsRaw],
  )
  const pendingReports = useMemo(
    () => toArray(reportsRaw).filter((r) => r.status === 'submitted'),
    [reportsRaw],
  )
  const pendingStudentLeaves = useMemo(
    () => toArray(leavesRaw).filter((l) => l.status === 'requested' || l.status === 'supervisor_review'),
    [leavesRaw],
  )
  const pendingAdmissions = useMemo(
    () => toArray(admissionsRaw).filter((a) => a.status === 'submitted' || a.status === 'reviewing'),
    [admissionsRaw],
  )
  const pendingTeacherLeaves = useMemo(
    () => teacherLeaves.filter((l) => l.status === 'pending'),
    [teacherLeaves],
  )
  const pendingWaivers = useMemo(
    () => feeWaivers.filter((w) => w.status === 'pending'),
    [feeWaivers],
  )

  const totalPending =
    pendingProofs.length +
    pendingCorrections.length +
    pendingReports.length +
    pendingStudentLeaves.length +
    pendingAdmissions.length +
    pendingTeacherLeaves.length +
    pendingWaivers.length

  async function reviewPaymentProof(id: number, action: 'approve' | 'reject') {
    if (action === 'reject' && !reviewNote.trim()) {
      toast.error(new Error('Write a brief reason in the Review Note box before rejecting'))
      return
    }
    setBusyId(`proof-${id}`)
    try {
      await api.post(`/guardian/payment-submissions/${id}/review`, {
        action,
        review_note: reviewNote.trim() || (action === 'approve' ? 'Verified in Principal Approval Center' : undefined),
      })
      toast.success(
        action === 'approve'
          ? 'Payment verified & tuition invoice marked Paid'
          : 'Guardian payment submission rejected',
      )
      setReviewNote('')
      qc.invalidateQueries({ queryKey: ['approvals-payment-proofs'] })
      qc.invalidateQueries({ queryKey: ['admin-payment-submissions'] })
      qc.invalidateQueries({ queryKey: ['invoices'] })
    } catch (err) {
      toast.error(err, 'Failed to review Guardian payment proof')
    } finally {
      setBusyId(null)
    }
  }

  async function reviewCorrection(id: number, action: 'approve' | 'reject') {
    setBusyId(`corr-${id}`)
    try {
      await api.post(`/attendance-corrections/${id}/review`, {
        action,
        reason: reviewNote.trim() || `${action} via Principal Approval Center`,
      })
      toast.success(`Attendance correction ${action}d`)
      setReviewNote('')
      qc.invalidateQueries({ queryKey: ['approvals-corrections'] })
    } catch (err) {
      toast.error(err, 'Only the assigned Batch Zimmadar can unlock/review attendance corrections')
    } finally {
      setBusyId(null)
    }
  }

  async function reviewReport(id: number, action: 'approve' | 'return_report') {
    if (action === 'return_report' && !reviewNote.trim()) {
      toast.error(new Error('Write a brief reason in the Review Note box before returning a report'))
      return
    }
    setBusyId(`rep-${id}`)
    try {
      await api.post(`/reports/${id}/review`, {
        action,
        reason: action === 'return_report' ? reviewNote.trim() : null,
      })
      toast.success(action === 'approve' ? 'Report approved' : 'Report returned for revision')
      setReviewNote('')
      qc.invalidateQueries({ queryKey: ['approvals-reports'] })
    } catch (err) {
      toast.error(err, 'Assigned Batch Zimmadar review required')
    } finally {
      setBusyId(null)
    }
  }

  async function reviewStudentLeave(l: StudentLeaveRow, action: 'approve' | 'reject') {
    if (action === 'reject' && !reviewNote.trim()) {
      toast.error(new Error('Write a rejection reason in the Review Note box'))
      return
    }
    setBusyId(`sleave-${l.id}`)
    try {
      await api.post(`/leaves/${l.id}/review`, {
        action,
        reason: reviewNote.trim(),
        expected_revision: l.revision,
      })
      toast.success(`Student leave ${action}d`)
      setReviewNote('')
      qc.invalidateQueries({ queryKey: ['approvals-student-leaves'] })
    } catch (err) {
      toast.error(err, 'Assigned Zimmadar / Department Supervisor review required')
    } finally {
      setBusyId(null)
    }
  }

  async function reviewAdmission(a: AdmissionRow, status: 'reviewing' | 'rejected') {
    if (status === 'rejected' && !reviewNote.trim()) {
      toast.error(new Error('Write a rejection reason in the Review Note box'))
      return
    }
    setBusyId(`adm-${a.id}`)
    try {
      await api.post(`/admissions/${a.id}/review`, {
        expected_revision: a.revision,
        status,
        review_reason: reviewNote.trim(),
      })
      toast.success(`Admission marked ${status}`)
      setReviewNote('')
      qc.invalidateQueries({ queryKey: ['approvals-admissions'] })
    } catch (err) {
      toast.error(err, 'Failed to review admission')
    } finally {
      setBusyId(null)
    }
  }

  function decideTeacherLeave(id: string, status: 'approved' | 'rejected') {
    setTeacherLeaves((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status, reviewed_by: user.name, reviewed_at: new Date().toISOString() } : l,
      ),
    )
    toast.success(`Teacher leave ${status}`)
  }

  function decideFeeWaiver(id: string, status: 'approved' | 'rejected') {
    setFeeWaivers((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status, reviewed_by: user.name, review_note: reviewNote.trim() || undefined } : w,
      ),
    )
    toast.success(`Fee waiver ${status}`)
    setReviewNote('')
  }

  function submitNewWaiver(e: React.FormEvent) {
    e.preventDefault()
    if (!waiverStudent.trim() || !waiverReason.trim()) return
    const item: FeeWaiverRequest = {
      id: `waiver-${Date.now()}`,
      student_name: waiverStudent.trim(),
      request_type: waiverType,
      amount: Number(waiverAmount) || 0,
      reason: waiverReason.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    setFeeWaivers((prev) => [item, ...prev])
    setWaiverStudent('')
    setWaiverReason('')
    setShowWaiverForm(false)
    toast.success('Fee waiver request queued for Principal approval')
  }

  const showSection = (key: ApprovalCategory) => category === 'all' || category === key

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Unified Principal Approval Center</h2>
          <p className="text-xs text-muted mt-0.5">
            All pending exceptions in one inbox — Attendance unlocks, Class reports, Student &amp; Teacher leaves, Admissions &amp; Fee waivers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={totalPending > 0 ? 'pending' : 'approved'}>
            {totalPending} Pending Items
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setShowWaiverForm((v) => !v)}>
            <Plus className="w-3.5 h-3.5" /> New Waiver / Refund Request
          </Button>
        </div>
      </div>

      {/* Category Summary Chips */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-border/80 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: `All Pending (${totalPending})`, icon: CheckSquare },
          { id: 'payment_proofs', label: `bKash/Nagad Proofs (${pendingProofs.length})`, icon: CreditCard },
          { id: 'corrections', label: `Attendance Unlocks (${pendingCorrections.length})`, icon: ShieldAlert },
          { id: 'reports', label: `Class Reports (${pendingReports.length})`, icon: FileText },
          { id: 'student_leaves', label: `Student Leaves (${pendingStudentLeaves.length})`, icon: CalendarOff },
          { id: 'admissions', label: `Admissions (${pendingAdmissions.length})`, icon: UserPlus },
          { id: 'teacher_leaves', label: `Teacher Leaves (${pendingTeacherLeaves.length})`, icon: CalendarOff },
          { id: 'fee_waivers', label: `Fee Waivers (${pendingWaivers.length})`, icon: Percent },
          { id: 'star_students', label: `Star Students Review (${starStudents.length})`, icon: Trophy },
        ].map((chip) => {
          const Icon = chip.icon
          const active = category === chip.id
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCategory(chip.id as ApprovalCategory)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[38px] transition-all cursor-pointer ${
                active
                  ? 'bg-white dark:bg-slate-900 text-primary-700 shadow-3xs'
                  : 'text-muted hover:text-heading hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{chip.label}</span>
            </button>
          )
        })}
      </div>

      {/* Shared Decision Note Bar */}
      <Card>
        <CardContent className="pt-5 pb-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-7">
            <Input
              label="Shared Approval / Rejection Note (applies to Reject / Return actions)"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Write approval comment or required rejection/return reason..."
            />
          </div>
          {!isZimmadar && (
            <div className="lg:col-span-5 rounded-xl bg-primary-50/60 border border-primary-100 px-3.5 py-2.5 text-xs text-body leading-relaxed">
              Note: Attendance Corrections &amp; Class Reports enforce Assigned Batch Zimmadar governance in the backend API; Principal oversees Admissions, Teacher Leaves &amp; Fee Waivers directly.
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Waiver Form */}
      {showWaiverForm && (
        <Card>
          <CardHeader><CardTitle>Queue New Sibling / Zakat / Scholarship Waiver</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submitNewWaiver} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <Input
                label="Student Name"
                value={waiverStudent}
                onChange={(e) => setWaiverStudent(e.target.value)}
                required
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold text-heading">Waiver Type</label>
                <select
                  value={waiverType}
                  onChange={(e) => setWaiverType(e.target.value as FeeWaiverRequest['request_type'])}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface"
                >
                  <option value="Sibling Discount">Sibling Discount</option>
                  <option value="Zakat / Scholarship">Zakat / Scholarship</option>
                  <option value="Late Fee Waiver">Late Fee Waiver</option>
                  <option value="Partial Refund">Partial Refund</option>
                </select>
              </div>
              <Input
                label="Amount (BDT)"
                type="number"
                min="1"
                value={waiverAmount}
                onChange={(e) => setWaiverAmount(e.target.value)}
              />
              <Input
                label="Reason"
                value={waiverReason}
                onChange={(e) => setWaiverReason(e.target.value)}
                required
              />
              <div className="md:col-span-4 flex justify-end gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setShowWaiverForm(false)}>Cancel</Button>
                <Button type="submit" size="sm">Add to Approval Queue</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* QUEUE SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* 1. Attendance Unlocks */}
        {showSection('corrections') && (
          <Card className="h-full">
            <CardHeader><CardTitle>Attendance Unlock Requests ({pendingCorrections.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {loadingCorr ? (
                <Skeleton className="h-20 w-full" />
              ) : pendingCorrections.length === 0 ? (
                <p className="text-xs text-muted">No pending attendance unlock requests.</p>
              ) : (
                pendingCorrections.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl border border-border bg-bg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-heading">{c.student_name}</p>
                        <p className="text-xs text-muted">Class #{c.class_id} · Requested: {c.requested_status || 'Correction'}</p>
                      </div>
                      <Badge variant="pending">{c.status}</Badge>
                    </div>
                    <p className="text-xs text-body">{c.reason}</p>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" loading={busyId === `corr-${c.id}`} onClick={() => reviewCorrection(c.id, 'reject')}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                      <Button size="sm" loading={busyId === `corr-${c.id}`} onClick={() => reviewCorrection(c.id, 'approve')}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve Unlock
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* 2. Class Reports */}
        {showSection('reports') && (
          <Card>
            <CardHeader><CardTitle>Submitted Class Reports ({pendingReports.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {loadingRep ? (
                <Skeleton className="h-20 w-full" />
              ) : pendingReports.length === 0 ? (
                <p className="text-xs text-muted">No reports awaiting approval.</p>
              ) : (
                pendingReports.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl border border-border bg-bg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-heading">{r.course_title} · {r.batch_name}</p>
                        <p className="text-xs text-muted">Class #{r.class_id} · Rev {r.revision}</p>
                      </div>
                      <Badge variant="submitted">{r.status}</Badge>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" loading={busyId === `rep-${r.id}`} onClick={() => reviewReport(r.id, 'return_report')}>
                        Return
                      </Button>
                      <Button size="sm" loading={busyId === `rep-${r.id}`} onClick={() => reviewReport(r.id, 'approve')}>
                        Approve Report
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* 3. Student Leaves */}
        {showSection('student_leaves') && (
          <Card>
            <CardHeader><CardTitle>Student Leave Requests ({pendingStudentLeaves.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {loadingLeaves ? (
                <Skeleton className="h-20 w-full" />
              ) : pendingStudentLeaves.length === 0 ? (
                <p className="text-xs text-muted">No pending student leave notices.</p>
              ) : (
                pendingStudentLeaves.map((l) => (
                  <div key={l.id} className="p-3 rounded-xl border border-border bg-bg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-heading">{l.student_name}</p>
                        <p className="text-xs text-muted">{l.course_title} · {l.start_date} to {l.end_date}</p>
                      </div>
                      <Badge variant="pending">{l.status}</Badge>
                    </div>
                    <p className="text-xs text-body">{l.reason}</p>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" loading={busyId === `sleave-${l.id}`} onClick={() => reviewStudentLeave(l, 'reject')}>
                        Reject
                      </Button>
                      <Button size="sm" loading={busyId === `sleave-${l.id}`} onClick={() => reviewStudentLeave(l, 'approve')}>
                        Approve Leave
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* 4. Admissions */}
        {showSection('admissions') && (
          <Card>
            <CardHeader><CardTitle>Pending Admissions ({pendingAdmissions.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {loadingAdm ? (
                <Skeleton className="h-20 w-full" />
              ) : pendingAdmissions.length === 0 ? (
                <p className="text-xs text-muted">No admissions awaiting review.</p>
              ) : (
                pendingAdmissions.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl border border-border bg-bg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-heading">{a.student_name}</p>
                        <p className="text-xs text-muted">{a.country} · {a.contact_phone}</p>
                      </div>
                      <Badge variant="pending">{a.status}</Badge>
                    </div>
                    <div className="flex gap-2 justify-end flex-wrap">
                      <Button size="sm" variant="outline" loading={busyId === `adm-${a.id}`} onClick={() => reviewAdmission(a, 'rejected')}>
                        Reject
                      </Button>
                      {a.status === 'submitted' && (
                        <Button size="sm" loading={busyId === `adm-${a.id}`} onClick={() => reviewAdmission(a, 'reviewing')}>
                          Start Review
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => { window.location.hash = '#/admissions' }}>
                        Assign Batch &amp; Accept
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* 5. Teacher Leaves */}
        {showSection('teacher_leaves') && (
          <Card>
            <CardHeader><CardTitle>Teacher Leave Queue ({pendingTeacherLeaves.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {pendingTeacherLeaves.length === 0 ? (
                <p className="text-xs text-muted">No pending teacher leave requests. Create or assign substitutes from Teacher Ops.</p>
              ) : (
                pendingTeacherLeaves.map((l) => (
                  <div key={l.id} className="p-3 rounded-xl border border-border bg-bg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-heading">{l.teacher_name}</p>
                        <p className="text-xs text-muted">{l.start_date} to {l.end_date}</p>
                      </div>
                      <Badge variant="pending">pending</Badge>
                    </div>
                    <p className="text-xs text-body">{l.reason}</p>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => decideTeacherLeave(l.id, 'rejected')}>Reject</Button>
                      <Button size="sm" onClick={() => decideTeacherLeave(l.id, 'approved')}>Approve Leave</Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* 6. Fee Waivers */}
        {showSection('fee_waivers') && (
          <Card>
            <CardHeader><CardTitle>Fee Waivers &amp; Refund Approvals ({pendingWaivers.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {pendingWaivers.length === 0 ? (
                <p className="text-xs text-muted">No pending fee waiver or refund approvals.</p>
              ) : (
                pendingWaivers.map((w) => (
                  <div key={w.id} className="p-3 rounded-xl border border-border bg-bg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-heading">{w.student_name} — ৳ {w.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted">{w.request_type}</p>
                      </div>
                      <Badge variant="pending">pending</Badge>
                    </div>
                    <p className="text-xs text-body">{w.reason}</p>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => decideFeeWaiver(w.id, 'rejected')}>Reject</Button>
                      <Button size="sm" onClick={() => decideFeeWaiver(w.id, 'approved')}>Approve Waiver</Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* 6b. Monthly Star Students & Leaderboard Review */}
        {showSection('star_students') && (
          <Card className="lg:col-span-2 rounded-2xl border-amber-300/80 bg-gradient-to-r from-amber-50/30 via-white to-amber-50/10 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/70">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-950">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Monthly Star Students Leaderboard Review (Zimmadar / Admin)
                </CardTitle>
                <p className="text-xs text-muted mt-0.5">
                  Review batch-wise calculated scores (Attendance 25% + Sabaq 35% + Homework 20% + Quiz 20%). Recommend or adjust before publishing.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setStarStudents((prev) =>
                      prev.map((s) => ({
                        ...s,
                        status: 'zimmadar_recommended',
                        recommended_by: `${user.name} (${user.role})`,
                      })),
                    )
                    toast.success('Recommended monthly star students to Super Admin for publication!')
                  }}
                  className="gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Recommend to Principal
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {starStudents.map((star) => (
                  <div key={star.id} className="p-3.5 rounded-xl border border-border bg-bg/60 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-bold flex items-center justify-center text-xs">
                          {star.rank}
                        </span>
                        <div>
                          <p className="font-bold text-xs text-heading">{star.student_name}</p>
                          <p className="text-[11px] text-muted">{star.batch_name}</p>
                        </div>
                      </div>
                      <Badge variant={star.status === 'published' ? 'approved' : 'pending'}>
                        {star.status}
                      </Badge>
                    </div>

                    <div className="text-[11px] space-y-1 bg-surface p-2 rounded-lg border border-border/60">
                      <div className="flex justify-between">
                        <span className="text-muted">হাজিরা (২৫):</span>
                        <span className="font-semibold">{star.attendance_score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">ডেইলি সবক (৩৫):</span>
                        <span className="font-semibold">{star.sabaq_score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">হোমওয়ার্ক (২০):</span>
                        <span className="font-semibold">{star.homework_score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">মাসিক কুইজ (২০):</span>
                        <span className="font-semibold">{star.assessment_score}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-border font-bold text-primary-700">
                        <span>মোট স্কোর:</span>
                        <span>{star.score}/১০০ ({star.grade})</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const note = prompt(`Enter Zimmadar recommendation note for ${star.student_name}:`, star.teacher_shoutout || '')
                          if (note !== null) {
                            setStarStudents((prev) =>
                              prev.map((s) => (s.id === star.id ? { ...s, teacher_shoutout: note } : s)),
                            )
                            toast.success('Updated note')
                          }
                        }}
                        className="text-[11px] h-7 px-2"
                      >
                        Edit Note
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {/* 7. Guardian bKash / Nagad Payment Proofs */}
        {isAdmin && showSection('payment_proofs') && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Guardian bKash / Nagad Receipt &amp; TrxID Inbox ({pendingProofs.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {loadingProofs ? <Skeleton className="h-20" /> : pendingProofs.length === 0 ? (
                <p className="text-xs text-muted">No pending guardian payment proofs awaiting verification.</p>
              ) : (
                pendingProofs.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl border border-border bg-bg flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {p.screenshot_data && (
                        <img
                          src={p.screenshot_data}
                          alt={p.trx_id}
                          className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                        />
                      )}
                      <div>
                        <p className="text-sm font-bold text-heading">
                          {p.student_name} · {p.payment_method} <span className="font-mono text-primary-700">{p.trx_id}</span> · ৳{Number(p.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted">
                          {p.invoice_number} ({p.billing_month}){p.sender_number ? ` · Sender: ${p.sender_number}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={busyId === `proof-${p.id}`}
                        disabled={busyId !== null}
                        onClick={() => reviewPaymentProof(p.id, 'reject')}
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-600" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        loading={busyId === `proof-${p.id}`}
                        disabled={busyId !== null}
                        onClick={() => reviewPaymentProof(p.id, 'approve')}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Verify &amp; Mark Paid
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

