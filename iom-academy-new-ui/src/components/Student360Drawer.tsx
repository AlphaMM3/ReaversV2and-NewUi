import { useSupportTickets } from '@/lib/supportApi'
import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, toArray } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { formatBDT } from '@/lib/utils'
import {
  useLocalStore,
  STUDENT_PHOTOS_KEY,
  STUDENT_MILESTONE_LOGS_KEY,
  SYLLABUS_MILESTONES_KEY,
  CERTIFICATES_KEY,
  compressImageToDataUrl,
  type StudentPhotoMap,
  type StudentMilestoneLog,
  type SyllabusMilestone,
  type DigitalCertificate,
} from '@/lib/superAdminStore'
import { navigateTo } from '@/lib/router'
import {
  X,
  Camera,
  Trash2,
  Award,
  BookOpen,
  CreditCard,
  AlertTriangle,
  CalendarCheck,
  ExternalLink,
  GraduationCap,
  Ticket,
} from 'lucide-react'

export interface StudentSummaryTarget {
  id: number
  full_name: string
  family_id?: number
  branch_id?: number
}

export function StudentAvatar({
  studentId,
  name,
  size = 'md',
}: {
  studentId?: number | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}) {
  const [photos] = useLocalStore<StudentPhotoMap>(STUDENT_PHOTOS_KEY, {})
  const src = studentId ? photos[String(studentId)] : undefined

  const sizeClass =
    size === 'xs'
      ? 'w-7 h-7 text-[10px]'
      : size === 'sm'
        ? 'w-8 h-8 text-xs'
        : size === 'lg'
          ? 'w-16 h-16 text-lg'
          : 'w-10 h-10 text-sm'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border border-emerald-200 shrink-0 shadow-xs`}
      />
    )
  }

  const initials = (name || 'ST')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase()

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary-100 text-primary-800 border border-primary-200 flex items-center justify-center font-bold shrink-0`}
    >
      {initials || 'ST'}
    </div>
  )
}

export function Student360Drawer({
  student,
  onClose,
}: {
  student: StudentSummaryTarget | null
  onClose: () => void
}) {
  const [photos, setPhotos] = useLocalStore<StudentPhotoMap>(STUDENT_PHOTOS_KEY, {})
  const [milestoneLogs] = useLocalStore<Record<number, StudentMilestoneLog>>(STUDENT_MILESTONE_LOGS_KEY, {})
  const [milestones] = useLocalStore<SyllabusMilestone[]>(SYLLABUS_MILESTONES_KEY, [])
  const [certs] = useLocalStore<DigitalCertificate[]>(CERTIFICATES_KEY, [])
  const { data: supportTickets = [] } = useSupportTickets()
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const toast = useToast()

  const { data: enrollmentsRaw } = useQuery<any>({
    queryKey: ['s360-enrollments'],
    queryFn: () => api.get<any>('/enrollments?limit=250').catch(() => []),
    enabled: !!student,
  })
  const enrollments = useMemo(() => toArray<any>(enrollmentsRaw), [enrollmentsRaw])

  const { data: invoicesRaw } = useQuery<any>({
    queryKey: ['s360-invoices'],
    queryFn: () => api.get<any>('/invoices').catch(() => []),
    enabled: !!student,
  })
  const invoices = useMemo(() => toArray<any>(invoicesRaw), [invoicesRaw])

  const { data: followupsRaw } = useQuery<any>({
    queryKey: ['s360-followups'],
    queryFn: () => api.get<any>('/followups?limit=100').catch(() => []),
    enabled: !!student,
  })
  const followups = useMemo(() => toArray<any>(followupsRaw), [followupsRaw])

  const { data: progressNotesRaw } = useQuery<any>({
    queryKey: ['s360-progress-list'],
    queryFn: () => api.get<any>('/progress').catch(() => []),
    enabled: !!student,
  })
  const progressNotes = useMemo(() => toArray<any>(progressNotesRaw), [progressNotesRaw])

  const { data: monthlyAtt } = useQuery<any>({
    queryKey: ['s360-attendance'],
    queryFn: () => api.get('/attendance/monthly').catch(() => null),
    enabled: !!student,
  })

  const { data: assessmentsRaw } = useQuery<any>({
    queryKey: ['s360-assessments'],
    queryFn: () => api.get<any>('/assessments').catch(() => []),
    enabled: !!student,
  })
  const assessments = useMemo(() => toArray<any>(assessmentsRaw), [assessmentsRaw])

  const studentEnrollments = useMemo(() => {
    if (!student) return []
    return enrollments.filter(
      (e) =>
        e.student_id === student.id ||
        String(e.student_name || '').toLowerCase() === student.full_name.toLowerCase(),
    )
  }, [enrollments, student])

  const studentEnrollmentIds = useMemo(
    () => new Set(studentEnrollments.map((e) => e.id)),
    [studentEnrollments],
  )

  const studentInvoices = useMemo(() => {
    if (!student) return []
    return invoices.filter(
      (inv) =>
        studentEnrollmentIds.has(inv.enrollment_id) ||
        String(inv.student_name || '').toLowerCase() === student.full_name.toLowerCase(),
    )
  }, [invoices, studentEnrollmentIds, student])

  const totalDue = studentInvoices.reduce(
    (sum, i) => sum + Math.max(0, Number(i.amount_due || 0) - Number(i.amount_paid || 0)),
    0,
  )
  const totalPaid = studentInvoices.reduce((sum, i) => sum + Number(i.amount_paid || 0), 0)

  const studentCompletedUnits = useMemo(() => {
    const out: Array<{ milestone: SyllabusMilestone; updated_at: string; note?: string }> = []
    for (const en of studentEnrollments) {
      const rec = milestoneLogs[en.id]
      if (!rec || !Array.isArray(rec.completed_unit_ids)) continue
      for (const uid of rec.completed_unit_ids) {
        const ms = milestones.find((m) => m.id === uid)
        if (ms && !out.some((x) => x.milestone.id === ms.id)) {
          out.push({ milestone: ms, updated_at: rec.updated_at, note: rec.current_note })
        }
      }
    }
    return out
  }, [milestoneLogs, milestones, studentEnrollments])

  const studentCerts = useMemo(() => {
    if (!student) return []
    return certs.filter(
      (c) =>
        c.student_id === student.id ||
        c.student_name.toLowerCase() === student.full_name.toLowerCase(),
    )
  }, [certs, student])

  const studentFollowups = useMemo(() => {
    if (!student) return []
    return followups.filter(
      (f) =>
        studentEnrollmentIds.has(f.enrollment_id) ||
        String(f.student_name || '').toLowerCase() === student.full_name.toLowerCase(),
    )
  }, [followups, studentEnrollmentIds, student])

  const studentTickets = useMemo(() => {
    if (!student) return []
    return supportTickets.filter(
      (t) =>
        t.student_name?.toLowerCase() === student.full_name.toLowerCase() ||
        (t.subject && t.subject.toLowerCase().includes(student.full_name.toLowerCase())),
    )
  }, [supportTickets, student])

  const attendancePct = useMemo(() => {
    const rows: any[] = monthlyAtt?.rows || monthlyAtt?.students || []
    if (!student || !Array.isArray(rows)) return null
    const hit = rows.find(
      (r) =>
        r.student_id === student.id ||
        studentEnrollmentIds.has(r.enrollment_id) ||
        String(r.student_name || '').toLowerCase() === student.full_name.toLowerCase(),
    )
    return hit?.attendance_percent ?? hit?.percent ?? null
  }, [monthlyAtt, student, studentEnrollmentIds])

  const relevantExams = useMemo(() => {
    const batchNames = new Set(studentEnrollments.map((e) => e.batch_name))
    return assessments.filter((a) => !batchNames.size || batchNames.has(a.batch_name)).slice(0, 5)
  }, [assessments, studentEnrollments])

  if (!student) return null

  const photoUrl = photos[String(student.id)]

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !student) return
    setUploadingPhoto(true)
    try {
      const dataUrl = await compressImageToDataUrl(file, 360, 0.8)
      setPhotos((prev) => ({
        ...prev,
        [String(student.id)]: dataUrl,
      }))
      toast.success(`Profile photo updated for ${student.full_name}`)
    } catch (err) {
      toast.error(err, 'Failed to process selected image')
    } finally {
      setUploadingPhoto(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removePhoto() {
    if (!student) return
    setPhotos((prev) => {
      const copy = { ...prev }
      delete copy[String(student.id)]
      return copy
    })
    toast.success('Student photo removed')
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface h-full shadow-2xl border-l border-border flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Photo */}
        <div className="p-5 border-b border-border bg-gradient-to-r from-emerald-50/70 to-amber-50/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <StudentAvatar studentId={student.id} name={student.full_name} size="lg" />
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold text-heading">{student.full_name}</h3>
                <Badge variant="approved">Student 360°</Badge>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Learner #{student.id}
                {student.family_id ? ` · Family #${student.family_id}` : ''}
                {student.branch_id ? ` · Branch #${student.branch_id}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={uploadingPhoto}
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="w-3.5 h-3.5" /> {photoUrl ? 'Change Photo' : 'Upload Photo'}
                </Button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:bg-bg hover:text-heading"
            aria-label="Close Student 360 Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Top KPI strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-border bg-bg/50">
              <p className="text-[11px] font-semibold text-muted flex items-center gap-1">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-700" /> Attendance
              </p>
              <p className="text-lg font-extrabold text-heading mt-1">
                {attendancePct !== null && attendancePct !== undefined ? `${attendancePct}%` : 'Synced'}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-bg/50">
              <p className="text-[11px] font-semibold text-muted flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" /> Outstanding Due
              </p>
              <p className={`text-lg font-extrabold mt-1 ${totalDue > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {formatBDT(totalDue)}
              </p>
              <p className="text-[10px] text-muted">Paid: {formatBDT(totalPaid)}</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-bg/50">
              <p className="text-[11px] font-semibold text-muted flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-primary-700" /> Milestones
              </p>
              <p className="text-lg font-extrabold text-heading mt-1">
                {studentCompletedUnits.length} / {milestones.length || studentCompletedUnits.length}
              </p>
            </div>
          </div>

          {/* Active Enrollments */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" /> Enrolled Courses & Batches ({studentEnrollments.length})
            </h4>
            {studentEnrollments.length === 0 ? (
              <p className="text-xs text-muted p-3 rounded-xl border border-border bg-bg/30">
                No active batch enrollments linked yet.
              </p>
            ) : (
              <div className="space-y-2">
                {studentEnrollments.map((en) => (
                  <div key={en.id} className="p-3 rounded-xl border border-border flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-heading">{en.course_title}</p>
                      <p className="text-muted">
                        {en.batch_name} · {en.delivery_mode === 'one_to_one' ? '1:1 Private' : 'Group'}
                      </p>
                    </div>
                    <Badge variant={en.status === 'active' ? 'approved' : 'neutral'}>{en.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Hifz / Nazera / Syllabus Milestones */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Hifz & Syllabus Sabq Milestones ({studentCompletedUnits.length})
            </h4>
            {studentCompletedUnits.length === 0 ? (
              <p className="text-xs text-muted p-3 rounded-xl border border-border bg-bg/30">
                No Sabq/Manzil milestones logged yet (log from Principal Governance).
              </p>
            ) : (
              <div className="space-y-2">
                {studentCompletedUnits.map((u) => (
                  <div key={u.milestone.id} className="p-3 rounded-xl border border-border flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-heading">
                        {u.milestone.unit_code} — {u.milestone.title}
                      </p>
                      <p className="text-muted">
                        {(u.updated_at || '').slice(0, 10)} {u.note ? `· ${u.note}` : ''}
                      </p>
                    </div>
                    <Badge variant="approved">Completed</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Exams & Published Notes */}
          {(relevantExams.length > 0 || progressNotes.some((n) => studentEnrollmentIds.has(n.enrollment_id))) && (
            <section className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Exams & Published Guardian Notes
              </h4>
              {relevantExams.map((a) => (
                <div key={a.id} className="p-2.5 rounded-xl border border-border flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-heading">{a.title}</p>
                    <p className="text-muted">Max Marks: {a.max_marks} · {a.batch_name || a.course_title}</p>
                  </div>
                  <Badge variant={a.published ? 'approved' : 'draft'}>
                    {a.published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              ))}
              {progressNotes
                .filter((n) => studentEnrollmentIds.has(n.enrollment_id))
                .slice(0, 3)
                .map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-bg border border-border text-xs text-body">
                    <strong>{n.title}:</strong> {n.progress_summary}
                  </div>
                ))}
            </section>
          )}

          {/* Invoices */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Fee Invoices & Dues ({studentInvoices.length})
            </h4>
            {studentInvoices.length === 0 ? (
              <p className="text-xs text-muted p-3 rounded-xl border border-border bg-bg/30">
                No tuition invoices generated yet.
              </p>
            ) : (
              <div className="space-y-2">
                {studentInvoices.slice(0, 6).map((inv) => (
                  <div key={inv.id} className="p-2.5 rounded-xl border border-border flex items-center justify-between text-xs">
                    <div>
                      <p className="font-mono font-semibold text-heading">{inv.invoice_number}</p>
                      <p className="text-muted">
                        Month: {inv.billing_month} · Due {formatBDT(inv.amount_due)} · Paid {formatBDT(inv.amount_paid)}
                      </p>
                    </div>
                    <Badge variant={inv.status === 'paid' ? 'approved' : inv.status === 'partially_paid' ? 'late' : 'pending'}>
                      {inv.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Support Tickets & Escalations */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-primary-700" /> Support Tickets &amp; Escalations ({studentTickets.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  navigateTo('#/tickets')
                }}
                className="text-[11px] font-bold text-primary-700 hover:underline cursor-pointer"
              >
                + New Ticket / Open Inbox
              </button>
            </div>
            {studentTickets.length === 0 ? (
              <p className="text-xs text-muted p-3 rounded-xl border border-border bg-bg/30">
                No tickets or escalations recorded for this student yet.
              </p>
            ) : (
              <div className="space-y-2">
                {studentTickets.map((tkt) => (
                  <div
                    key={tkt.id}
                    onClick={() => {
                      onClose()
                      navigateTo('#/tickets')
                    }}
                    className="p-3 rounded-xl border border-border hover:border-primary-300 bg-white cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded text-[10px] border border-primary-100">
                          #{tkt.token}
                        </span>
                        <p className="font-bold text-heading truncate max-w-[220px]">{tkt.subject}</p>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">
                        {tkt.kind === 'teacher_escalation' ? 'Teacher Escalation' : 'Guardian Ticket'} · {Array.isArray(tkt.replies) ? tkt.replies.length : 0} replies
                      </p>
                    </div>
                    <Badge variant={tkt.status === 'resolved' ? 'approved' : tkt.status === 'in_progress' ? 'pending' : 'neutral'}>
                      {tkt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Follow-ups & Digital Sanads */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" /> Issued Sanads ({studentCerts.length}) & Follow-Ups ({studentFollowups.length})
            </h4>
            {studentCerts.map((c) => (
              <div key={c.id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-heading">{c.course_title}</p>
                  <p className="text-muted font-mono">{c.verification_code} · {c.grade_label}</p>
                </div>
                <a
                  href={`#/verify/${encodeURIComponent(c.verification_code)}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
                >
                  Verify <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
            {studentFollowups.map((f) => (
              <div key={f.id} className="p-2.5 rounded-xl border border-border flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-heading">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> {f.kind}
                </span>
                <Badge variant={f.status === 'resolved' ? 'approved' : 'pending'}>{f.status}</Badge>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}
