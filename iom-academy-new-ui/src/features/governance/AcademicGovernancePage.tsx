import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toArray, type ClassSession } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { QrCodeSvg } from '@/components/ui/QrCodeSvg'
import { StudentAvatar } from '@/components/Student360Drawer'
import { useToast } from '@/components/ui/Toast'
import { buildTelegramShareUrl, buildWhatsAppUrl } from '@/lib/messaging'
import { getDhakaDateString } from '@/lib/utils'
import {
  ACADEMY_BRANDING_KEY,
  type AcademyBranding,
  CERTIFICATES_KEY,
  DEFAULT_ACADEMY_BRANDING,
  DEFAULT_SYLLABUS_MILESTONES,
  DROPOUT_REASONS_KEY,
  type DigitalCertificate,
  type ExitDropoutRecord,
  type StudentMilestoneLog,
  STUDENT_MILESTONE_LOGS_KEY,
  SYLLABUS_MILESTONES_KEY,
  type SyllabusMilestone,
  STAR_STUDENTS_KEY,
  DEFAULT_STAR_STUDENTS,
  type StarStudentAward,
  useLocalStore,
} from '@/lib/superAdminStore'
import {
  Video, Eye, BookOpen, Award, ArrowRightLeft, Plus, CheckCircle,
  Printer, MessageCircle, Send, X, ShieldCheck, ExternalLink, Calendar,
  Trophy, Sparkles, Globe,
} from 'lucide-react'

type GovernanceTab = 'live' | 'syllabus' | 'certificates' | 'lifecycle' | 'leaderboard'

interface ProgressRow {
  id: number
  enrollment_id: number
  title: string
  progress_summary: string
  homework_summary: string
  published_at: string
  student_id: number
  student_name: string
  batch_name: string
  course_title: string
}

interface EnrollmentRow {
  id: number
  student_id: number
  student_name: string
  batch_id: number
  batch_name: string
  course_id?: number
  course_title: string
  delivery_mode: string
  status: string
  start_date: string
  end_date: string | null
}

interface BatchRow {
  id: number
  label: string
  course_title: string
  delivery_mode: string
  teacher_name?: string
}

interface AssessmentRow {
  id: number
  batch_id: number
  batch_name?: string
  course_title?: string
  title: string
  assessment_type: string
  max_marks: number
  pass_marks?: number | null
  assessment_date: string
}

interface MarkRow {
  id: number
  assessment_id: number
  enrollment_id: number
  student_id?: number
  student_name: string
  obtained_marks: number
  teacher_remarks?: string | null
  guardian_feedback?: string | null
  status: 'draft' | 'published'
  published_at?: string | null
}

interface StatusHistoryRow {
  id: number
  from_status: string
  to_status: string
  previous_end_date: string | null
  end_date: string | null
  reason: string
  at: string
}

const EXIT_CATEGORIES: ExitDropoutRecord['category'][] = [
  'Graduated',
  'Fee Issue',
  'Schedule Conflict',
  'Batch Transfer',
  'Relocated',
  'Other',
]

function computeGradeLabel(obtained: number, maxMarks: number): string {
  if (!maxMarks || maxMarks <= 0) return 'Evaluated'
  const pct = Math.round((obtained / maxMarks) * 100)
  if (pct >= 90) return `Mumtaz (${pct}%)`
  if (pct >= 80) return `Jayyid Jiddan (${pct}%)`
  if (pct >= 65) return `Jayyid (${pct}%)`
  if (pct >= 50) return `Maqbul (${pct}%)`
  return `Needs Review (${pct}%)`
}

export default function AcademicGovernancePage({ role }: { role: string }) {
  const today = getDhakaDateString()
  const toast = useToast()
  const qc = useQueryClient()
  const isAdmin = role === 'central_admin' || role === 'branch_admin'
  const canPublishResults = isAdmin || role === 'zimmadar'

  const [tab, setTab] = useState<GovernanceTab>('live')
  const [branding] = useLocalStore<AcademyBranding>(ACADEMY_BRANDING_KEY, DEFAULT_ACADEMY_BRANDING)

  // Persistent governance stores
  const [milestones, setMilestones] = useLocalStore<SyllabusMilestone[]>(
    SYLLABUS_MILESTONES_KEY,
    DEFAULT_SYLLABUS_MILESTONES,
  )
  const [studentLogs, setStudentLogs] = useLocalStore<Record<number, StudentMilestoneLog>>(
    STUDENT_MILESTONE_LOGS_KEY,
    {},
  )
  const [certificates, setCertificates] = useLocalStore<DigitalCertificate[]>(CERTIFICATES_KEY, [])
  const [exitRecords, setExitRecords] = useLocalStore<ExitDropoutRecord[]>(DROPOUT_REASONS_KEY, [])
  const [starStudents, setStarStudents] = useLocalStore<StarStudentAward[]>(STAR_STUDENTS_KEY, DEFAULT_STAR_STUDENTS)

  // Queries
  const { data: classesRaw, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes-governance'],
    queryFn: () => api.get<ClassSession[]>('/classes'),
  })
  const { data: progressRaw, isLoading: loadingProgress } = useQuery({
    queryKey: ['progress-governance'],
    queryFn: () => api.get<ProgressRow[]>('/progress'),
  })
  const { data: enrollmentsRaw } = useQuery({
    queryKey: ['enrollments-governance'],
    queryFn: () => api.get<EnrollmentRow[]>('/enrollments?limit=200'),
  })
  const { data: batchesRaw } = useQuery({
    queryKey: ['batches-governance'],
    queryFn: () => api.get<BatchRow[]>('/batches'),
  })
  const { data: assessmentsRaw, isLoading: loadingAssessments } = useQuery({
    queryKey: ['assessments-governance'],
    queryFn: () => api.get<AssessmentRow[]>('/assessments'),
  })

  const classes = useMemo(() => toArray(classesRaw), [classesRaw])
  const progressList = useMemo(() => toArray(progressRaw), [progressRaw])
  const enrollments = useMemo(() => toArray(enrollmentsRaw), [enrollmentsRaw])
  const batches = useMemo(() => toArray(batchesRaw), [batchesRaw])
  const assessments = useMemo(() => toArray(assessmentsRaw), [assessmentsRaw])

  // Live class observer views
  const liveClasses = useMemo(() => classes.filter((c) => c.status === 'in_progress'), [classes])
  const todayClasses = useMemo(
    () => classes.filter((c) => (c.scheduled_start || '').startsWith(today)),
    [classes, today],
  )

  // Syllabus form & selected enrollment
  const [selectedEnrForSyllabus, setSelectedEnrForSyllabus] = useState<string>('')
  const [milestoneCourse, setMilestoneCourse] = useState('Hifz & Nazera Track')
  const [milestoneUnit, setMilestoneUnit] = useState('')
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneSessions, setMilestoneSessions] = useState('16')

  // Zimmadar backend progress form
  const [pubTitle, setPubTitle] = useState('')
  const [pubSummary, setPubSummary] = useState('')
  const [pubHomework, setPubHomework] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Assessment & Marks & Certificate states
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('')
  const { data: marksRaw, isLoading: loadingMarks } = useQuery({
    queryKey: ['assessment-marks-gov', selectedAssessmentId],
    queryFn: () => api.get<MarkRow[]>(`/assessments/${selectedAssessmentId}/marks`),
    enabled: Boolean(selectedAssessmentId),
  })
  const marksList = useMemo(() => toArray(marksRaw), [marksRaw])
  const activeAssessment = assessments.find((a) => String(a.id) === selectedAssessmentId)

  // Certificate generator form
  const [certStudentEnrId, setCertStudentEnrId] = useState('')
  const [certGrade, setCertGrade] = useState('Mumtaz (95%)')
  const [certRemarks, setCertRemarks] = useState('Completed full recitation, Tajweed mastery, and oral evaluation.')
  const [certPreview, setCertPreview] = useState<DigitalCertificate | null>(null)

  // Lifecycle & Batch Transfer states
  const [selectedLifecycleEnrId, setSelectedLifecycleEnrId] = useState('')
  const activeLifecycleEnr = enrollments.find((e) => String(e.id) === selectedLifecycleEnrId)
  const { data: statusHistoryRaw } = useQuery({
    queryKey: ['enr-status-history', selectedLifecycleEnrId],
    queryFn: () => api.get<StatusHistoryRow[]>(`/enrollments/${selectedLifecycleEnrId}/status-history`),
    enabled: Boolean(selectedLifecycleEnrId) && isAdmin,
  })
  const statusHistory = useMemo(() => toArray(statusHistoryRaw), [statusHistoryRaw])

  const [newStatus, setNewStatus] = useState<'active' | 'on_hold' | 'completed' | 'withdrawn' | 'inactive'>('completed')
  const [exitCategory, setExitCategory] = useState<ExitDropoutRecord['category']>('Graduated')
  const [exitEndDate, setExitEndDate] = useState(today)
  const [exitReason, setExitReason] = useState('')
  const [transferBatchId, setTransferBatchId] = useState('')
  const [transferStartDate, setTransferStartDate] = useState(today)

  function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault()
    if (!milestoneUnit.trim() || !milestoneTitle.trim()) return
    const item: SyllabusMilestone = {
      id: `ms-${Date.now()}`,
      course_title: milestoneCourse.trim() || 'General Track',
      unit_code: milestoneUnit.trim(),
      title: milestoneTitle.trim(),
      target_sessions: Number(milestoneSessions) || 12,
    }
    setMilestones((prev) => [...prev, item])
    setMilestoneUnit('')
    setMilestoneTitle('')
    toast.success(`Added syllabus unit ${item.unit_code}`)
  }

  function toggleStudentMilestone(enrId: number, milestoneId: string) {
    setStudentLogs((prev) => {
      const current = prev[enrId] || { enrollment_id: enrId, completed_unit_ids: [], updated_at: new Date().toISOString() }
      const exists = current.completed_unit_ids.includes(milestoneId)
      const nextIds = exists
        ? current.completed_unit_ids.filter((id) => id !== milestoneId)
        : [...current.completed_unit_ids, milestoneId]
      return {
        ...prev,
        [enrId]: { ...current, completed_unit_ids: nextIds, updated_at: new Date().toISOString() },
      }
    })
  }

  async function publishProgressToGuardians(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedEnrForSyllabus || !pubTitle.trim() || !pubSummary.trim()) return
    setSubmitting(true)
    try {
      await api.post('/progress', {
        enrollment_id: Number(selectedEnrForSyllabus),
        request_id: crypto.randomUUID(),
        title: pubTitle.trim(),
        progress_summary: pubSummary.trim(),
        homework_summary: pubHomework.trim(),
      })
      toast.success('Progress update published to Guardian Portal')
      setPubTitle('')
      setPubSummary('')
      setPubHomework('')
      qc.invalidateQueries({ queryKey: ['progress-governance'] })
    } catch (err) {
      toast.error(err, 'Could not publish progress update')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePublishAssessment() {
    if (!activeAssessment) return
    setSubmitting(true)
    try {
      await api.post(`/assessments/${activeAssessment.id}/publish`, {})
      toast.success('Assessment results published to guardians')
      qc.invalidateQueries({ queryKey: ['assessment-marks-gov', selectedAssessmentId] })
    } catch (err) {
      toast.error(err, 'Could not publish results')
    } finally {
      setSubmitting(false)
    }
  }

  function handleIssueCertificate(e: React.FormEvent) {
    e.preventDefault()
    const en = enrollments.find((x) => String(x.id) === certStudentEnrId)
    if (!en) {
      toast.error(new Error('Select an enrolled student first'))
      return
    }
    const year = today.slice(0, 4)
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase()
    const cert: DigitalCertificate = {
      id: `cert-${Date.now()}`,
      verification_code: `IOM-SANAD-${year}-${randCode}`,
      student_id: en.student_id,
      student_name: en.student_name,
      enrollment_id: en.id,
      course_title: en.course_title,
      batch_name: en.batch_name,
      grade_label: certGrade.trim() || 'Completed with Honors',
      issue_date: today,
      remarks: certRemarks.trim() || undefined,
      issued_by: branding.principalName,
      created_at: new Date().toISOString(),
    }
    setCertificates((prev) => [cert, ...prev])
    setCertPreview(cert)
    toast.success(`Issued Digital Sanad ${cert.verification_code}`)
  }

  async function handleUpdateEnrollmentStatus(e: React.FormEvent) {
    e.preventDefault()
    if (!activeLifecycleEnr || !exitReason.trim()) {
      toast.error(new Error('Select an enrollment and provide a written reason'))
      return
    }
    const needsEndDate = ['withdrawn', 'completed', 'inactive'].includes(newStatus)
    if (needsEndDate && !exitEndDate) {
      toast.error(new Error('Last active date is required for closed statuses'))
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/enrollments/${activeLifecycleEnr.id}/status`, {
        status: newStatus,
        expected_status: activeLifecycleEnr.status,
        expected_end_date: activeLifecycleEnr.end_date ?? null,
        end_date: needsEndDate ? exitEndDate : null,
        reason: `[${exitCategory}] ${exitReason.trim()}`,
      })
      const logEntry: ExitDropoutRecord = {
        id: `exit-${Date.now()}`,
        enrollment_id: activeLifecycleEnr.id,
        student_name: activeLifecycleEnr.student_name,
        batch_name: activeLifecycleEnr.batch_name,
        new_status: newStatus,
        category: exitCategory,
        reason: exitReason.trim(),
        recorded_by: branding.principalName,
        recorded_at: new Date().toISOString(),
      }
      setExitRecords((prev) => [logEntry, ...prev])
      setExitReason('')
      toast.success(`Enrollment updated to ${newStatus}`)
      qc.invalidateQueries({ queryKey: ['enrollments-governance'] })
      qc.invalidateQueries({ queryKey: ['enr-status-history', selectedLifecycleEnrId] })
    } catch (err) {
      toast.error(err, 'Failed to update enrollment status')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBatchTransfer() {
    if (!activeLifecycleEnr || !transferBatchId || !transferStartDate) {
      toast.error(new Error('Select target batch and start date'))
      return
    }
    setSubmitting(true)
    try {
      await api.post('/enrollments', {
        student_id: activeLifecycleEnr.student_id,
        batch_id: Number(transferBatchId),
        start_date: transferStartDate,
      })
      const targetBatch = batches.find((b) => String(b.id) === transferBatchId)
      const logEntry: ExitDropoutRecord = {
        id: `xfer-${Date.now()}`,
        enrollment_id: activeLifecycleEnr.id,
        student_name: activeLifecycleEnr.student_name,
        batch_name: `${activeLifecycleEnr.batch_name} → ${targetBatch?.label || `Batch #${transferBatchId}`}`,
        new_status: 'transferred',
        category: 'Batch Transfer',
        reason: `Promoted / transferred to ${targetBatch?.label || `Batch #${transferBatchId}`}`,
        recorded_by: branding.principalName,
        recorded_at: new Date().toISOString(),
      }
      setExitRecords((prev) => [logEntry, ...prev])
      toast.success(`${activeLifecycleEnr.student_name} enrolled in new batch`)
      qc.invalidateQueries({ queryKey: ['enrollments-governance'] })
    } catch (err) {
      toast.error(err, 'Could not transfer student batch')
    } finally {
      setSubmitting(false)
    }
  }

  const exitAnalytics = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of EXIT_CATEGORIES) counts[c] = 0
    for (const r of exitRecords) counts[r.category] = (counts[r.category] || 0) + 1
    return counts
  }, [exitRecords])

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Academic Governance, Live Observer &amp; Sanad</h2>
          <p className="text-xs text-muted mt-0.5">
            Silent live class inspection, Hifz/Nazera syllabus milestones, official marksheets, digital certificates &amp; batch lifecycle
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Badge variant={liveClasses.length > 0 ? 'live' : 'neutral'}>
            {liveClasses.length} Live Now
          </Badge>
          <Badge variant="primary">{certificates.length} Sanads Issued</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setTab('live')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'live' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Live Class Observer ({liveClasses.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('syllabus')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'syllabus' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Syllabus &amp; Hifz Tracker ({milestones.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('certificates')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'certificates' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Results &amp; Digital Sanad ({certificates.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('lifecycle')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'lifecycle' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" /> Promotion, Transfer &amp; Exit ({enrollments.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('leaderboard')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'leaderboard' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" /> Monthly Leaderboard &amp; Star Students ({starStudents.length})
        </button>
      </div>

      {/* TAB 1: LIVE CLASS OBSERVER */}
      {tab === 'live' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Currently Live Online Classes — Silent Principal Inspection</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingClasses ? (
                <Skeleton className="h-32 w-full" />
              ) : liveClasses.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-bg border border-border">
                  <Video className="w-7 h-7 text-muted mx-auto mb-2" />
                  <p className="text-sm font-semibold text-heading">No classes are live right now</p>
                  <p className="text-xs text-muted mt-1">
                    When teachers launch an online session from Live Console, it appears here for silent Principal monitoring.
                  </p>
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => { window.location.hash = '#/classes' }}>
                      Open Live Class Console
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveClasses.map((cl) => (
                    <div key={cl.id} className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/40 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant="live">LIVE SESSION</Badge>
                          <h4 className="font-bold text-heading text-sm mt-1.5">{cl.course_title}</h4>
                          <p className="text-xs text-muted">{cl.batch_name} · {cl.delivery_mode}</p>
                        </div>
                        <span className="text-xs font-mono text-muted">#{cl.id}</span>
                      </div>
                      <p className="text-xs text-body">
                        Started: <span className="font-mono">{cl.actual_start || cl.scheduled_start}</span>
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        {cl.meeting_url ? (
                          <a
                            href={cl.meeting_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                          >
                            <Eye className="w-3.5 h-3.5" /> Join Silently as Principal <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => { window.location.hash = '#/classes' }}>
                            Open Class Console
                          </Button>
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
              <CardTitle>Today&apos;s Scheduled &amp; Completed Sessions ({todayClasses.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {todayClasses.length === 0 ? (
                <p className="p-6 text-sm text-muted">No sessions scheduled for {today}.</p>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Session</th>
                      <th>Batch &amp; Mode</th>
                      <th>Scheduled</th>
                      <th>Status</th>
                      <th>Meeting Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayClasses.map((cl) => (
                      <tr key={cl.id}>
                        <td className="font-semibold text-heading">{cl.course_title}</td>
                        <td className="text-xs text-muted">{cl.batch_name} ({cl.delivery_mode})</td>
                        <td className="text-xs font-mono">{cl.scheduled_start}</td>
                        <td>
                          <Badge variant={cl.status}>{cl.status}</Badge>
                        </td>
                        <td className="text-xs">
                          {cl.meeting_url ? (
                            <a href={cl.meeting_url} target="_blank" rel="noreferrer" className="text-primary-700 underline inline-flex items-center gap-1">
                              Join Room <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-muted">Not attached</span>
                          )}
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

      {/* TAB 2: SYLLABUS & HIFZ TRACKER */}
      {tab === 'syllabus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader><CardTitle>Add Syllabus / Hifz Milestone</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddMilestone} className="space-y-3">
                  <Input
                    label="Track / Course Title"
                    value={milestoneCourse}
                    onChange={(e) => setMilestoneCourse(e.target.value)}
                    placeholder="e.g. Hifz & Nazera Track"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Para / Unit Code"
                      value={milestoneUnit}
                      onChange={(e) => setMilestoneUnit(e.target.value)}
                      placeholder="e.g. Para 03"
                      required
                    />
                    <Input
                      label="Target Sessions"
                      type="number"
                      min="1"
                      value={milestoneSessions}
                      onChange={(e) => setMilestoneSessions(e.target.value)}
                    />
                  </div>
                  <Input
                    label="Milestone Description"
                    value={milestoneTitle}
                    onChange={(e) => setMilestoneTitle(e.target.value)}
                    placeholder="e.g. Tilawat + Makharij Mastery"
                    required
                  />
                  <Button type="submit" size="sm">
                    <Plus className="w-4 h-4" /> Add Milestone Unit
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Curriculum Units ({milestones.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[380px] overflow-y-auto">
                {milestones.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-lg border border-border bg-bg flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-primary-700">{m.unit_code} · {m.course_title}</p>
                      <p className="text-xs text-heading font-medium">{m.title}</p>
                    </div>
                    <Badge variant="neutral">{m.target_sessions} cls</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader><CardTitle>Student Hifz / Nazera &amp; Milestone Checklist</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-heading">Select Student Enrollment</label>
                  <select
                    value={selectedEnrForSyllabus}
                    onChange={(e) => setSelectedEnrForSyllabus(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface"
                  >
                    <option value="">-- Choose student enrollment --</option>
                    {enrollments.map((en) => (
                      <option key={en.id} value={en.id}>
                        {en.student_name} — {en.course_title} ({en.batch_name})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedEnrForSyllabus && (() => {
                  const enrId = Number(selectedEnrForSyllabus)
                  const doneIds = studentLogs[enrId]?.completed_unit_ids || []
                  const pct = milestones.length > 0 ? Math.round((doneIds.length / milestones.length) * 100) : 0
                  return (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-heading">Syllabus Completion</span>
                          <span className="font-bold text-primary-700">{doneIds.length}/{milestones.length} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-bg overflow-hidden border border-border">
                          <div className="h-full bg-primary-700 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {milestones.map((m) => {
                          const checked = doneIds.includes(m.id)
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleStudentMilestone(enrId, m.id)}
                              className={`text-left p-2.5 rounded-lg border text-xs transition ${
                                checked
                                  ? 'border-emerald-500 bg-emerald-50/60 text-heading'
                                  : 'border-border bg-surface hover:bg-bg text-body'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold">{m.unit_code}</span>
                                {checked && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                              </div>
                              <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{m.title}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle>Published Guardian Progress Feed ({progressList.length})</CardTitle>
                  {role !== 'zimmadar' && (
                    <span className="text-[11px] text-muted">Assigned Zimmadars publish directly to Guardian Portal</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {role === 'zimmadar' && selectedEnrForSyllabus && (
                  <form onSubmit={publishProgressToGuardians} className="p-3 rounded-xl border border-border bg-bg space-y-2.5">
                    <p className="text-xs font-bold text-heading">Publish New Guardian Progress Note</p>
                    <Input
                      label="Title"
                      value={pubTitle}
                      onChange={(e) => setPubTitle(e.target.value)}
                      placeholder="e.g. Para 30 Revision & Tajweed Assessment"
                      required
                    />
                    <Input
                      label="Progress Summary"
                      value={pubSummary}
                      onChange={(e) => setPubSummary(e.target.value)}
                      placeholder="What the student mastered this week"
                      required
                    />
                    <Input
                      label="Homework"
                      value={pubHomework}
                      onChange={(e) => setPubHomework(e.target.value)}
                      placeholder="Optional daily practice assignment"
                    />
                    <Button type="submit" size="sm" loading={submitting}>Publish to Guardian Portal</Button>
                  </form>
                )}

                {loadingProgress ? (
                  <Skeleton className="h-24 w-full" />
                ) : progressList.length === 0 ? (
                  <p className="text-xs text-muted">No progress updates published yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
                    {progressList.slice(0, 20).map((p) => (
                      <div key={p.id} className="p-3 rounded-lg border border-border bg-surface">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-heading">{p.student_name} — {p.title}</span>
                          <span className="text-[11px] font-mono text-muted">{p.published_at?.slice(0, 10)}</span>
                        </div>
                        <p className="text-xs text-body mt-1">{p.progress_summary}</p>
                        {p.homework_summary && (
                          <p className="text-[11px] text-primary-700 mt-1">Homework: {p.homework_summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: EXAM RESULTS & DIGITAL CERTIFICATES (SANAD) */}
      {tab === 'certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Result Sheet & Publication */}
          <Card className="lg:col-span-6">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle>Exam Result Sheet &amp; Marksheet</CardTitle>
                {activeAssessment && canPublishResults && (
                  <Button size="sm" loading={submitting} onClick={handlePublishAssessment}>
                    <ShieldCheck className="w-3.5 h-3.5" /> Publish Results to Guardians
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingAssessments ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-heading">Select Assessment / Exam</label>
                  <select
                    value={selectedAssessmentId}
                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface"
                  >
                    <option value="">-- Choose an exam / oral assessment --</option>
                    {assessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.course_title || `Batch #${a.batch_id}`} · {a.assessment_date})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedAssessmentId && (
                loadingMarks ? (
                  <Skeleton className="h-28 w-full" />
                ) : marksList.length === 0 ? (
                  <p className="text-xs text-muted py-4">No marks entered yet for this assessment. Teachers can score from Assessments page.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="iom-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Marks</th>
                          <th>Grade</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marksList.map((m) => (
                          <tr key={m.id}>
                            <td className="font-semibold text-heading">{m.student_name}</td>
                            <td className="font-mono text-xs">
                              {m.obtained_marks} / {activeAssessment?.max_marks || 100}
                            </td>
                            <td className="text-xs font-medium text-primary-700">
                              {computeGradeLabel(Number(m.obtained_marks), Number(activeAssessment?.max_marks || 100))}
                            </td>
                            <td>
                              <Badge variant={m.status === 'published' ? 'approved' : 'draft'}>
                                {m.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Digital Sanad / Certificate Generator */}
          <Card className="lg:col-span-6">
            <CardHeader><CardTitle>Issue Verifiable Digital Certificate (Sanad)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleIssueCertificate} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-heading">Select Student &amp; Course</label>
                  <select
                    value={certStudentEnrId}
                    onChange={(e) => setCertStudentEnrId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface"
                    required
                  >
                    <option value="">-- Choose student --</option>
                    {enrollments.map((en) => (
                      <option key={en.id} value={en.id}>
                        {en.student_name} — {en.course_title} ({en.batch_name})
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Awarded Grade / Distinction"
                  value={certGrade}
                  onChange={(e) => setCertGrade(e.target.value)}
                  placeholder="Mumtaz (95%) / Hifz Complete"
                  required
                />
                <Input
                  label="Citation / Sanad Remarks"
                  value={certRemarks}
                  onChange={(e) => setCertRemarks(e.target.value)}
                />
                <Button type="submit" size="sm">
                  <Award className="w-4 h-4" /> Issue Principal-Signed Sanad
                </Button>
              </form>

              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-bold text-heading">Issued Certificates Registry ({certificates.length})</p>
                {certificates.length === 0 ? (
                  <p className="text-xs text-muted">No certificates issued yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto">
                    {certificates.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-lg border border-border bg-bg flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-heading">{c.student_name} · {c.course_title}</p>
                          <p className="text-[11px] font-mono text-primary-700">
                            {c.verification_code} · {c.grade_label}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setCertPreview(c)}>
                          View / Print
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: PROMOTION, TRANSFER & EXIT/DROPOUT TRACKER */}
      {tab === 'lifecycle' && (
        <div className="space-y-4">
          {/* Structured Exit Analytics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {EXIT_CATEGORIES.map((cat) => (
              <Card key={cat}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-[11px] text-muted uppercase font-semibold">{cat}</p>
                  <p className="text-xl font-bold text-heading mt-0.5">{exitAnalytics[cat] || 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Card className="lg:col-span-6">
              <CardHeader><CardTitle>Update Enrollment Status &amp; Transfer Batch</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-heading">Select Student Enrollment</label>
                  <select
                    value={selectedLifecycleEnrId}
                    onChange={(e) => setSelectedLifecycleEnrId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface"
                  >
                    <option value="">-- Choose enrollment --</option>
                    {enrollments.map((en) => (
                      <option key={en.id} value={en.id}>
                        {en.student_name} · {en.batch_name} [{en.status}]
                      </option>
                    ))}
                  </select>
                </div>

                {activeLifecycleEnr && (
                  <>
                    <div className="p-3 rounded-xl bg-bg border border-border text-xs flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="font-bold text-heading">{activeLifecycleEnr.student_name}</span>
                        <span className="text-muted"> · {activeLifecycleEnr.course_title} ({activeLifecycleEnr.batch_name})</span>
                      </div>
                      <Badge variant={activeLifecycleEnr.status === 'active' ? 'approved' : 'pending'}>
                        {activeLifecycleEnr.status}
                      </Badge>
                    </div>

                    <form onSubmit={handleUpdateEnrollmentStatus} className="space-y-3 border border-border rounded-xl p-3">
                      <p className="text-xs font-bold text-heading">Change Enrollment Status / Record Exit Reason</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-heading">New Status</label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as typeof newStatus)}
                            className="w-full px-2.5 py-2 text-xs rounded-lg border border-border bg-surface"
                          >
                            <option value="completed">completed (Graduated)</option>
                            <option value="on_hold">on_hold (Paused)</option>
                            <option value="withdrawn">withdrawn (Dropout)</option>
                            <option value="inactive">inactive</option>
                            <option value="active">active</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-heading">Reason Category</label>
                          <select
                            value={exitCategory}
                            onChange={(e) => setExitCategory(e.target.value as ExitDropoutRecord['category'])}
                            className="w-full px-2.5 py-2 text-xs rounded-lg border border-border bg-surface"
                          >
                            {EXIT_CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <Input
                          label="Last Active Date"
                          type="date"
                          value={exitEndDate}
                          onChange={(e) => setExitEndDate(e.target.value)}
                        />
                      </div>
                      <Input
                        label="Written Justification"
                        value={exitReason}
                        onChange={(e) => setExitReason(e.target.value)}
                        placeholder="e.g. Completed Hifz Level 1 or financial difficulty follow-up"
                        required
                      />
                      <Button type="submit" size="sm" loading={submitting} disabled={!isAdmin}>
                        Save Status Change
                      </Button>
                    </form>

                    {/* Batch Transfer */}
                    <div className="border border-border rounded-xl p-3 space-y-3">
                      <p className="text-xs font-bold text-heading">Promote / Transfer Student to Another Batch</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-heading">Destination Batch</label>
                          <select
                            value={transferBatchId}
                            onChange={(e) => setTransferBatchId(e.target.value)}
                            className="w-full px-2.5 py-2 text-xs rounded-lg border border-border bg-surface"
                          >
                            <option value="">-- Target batch --</option>
                            {batches
                              .filter((b) => b.id !== activeLifecycleEnr.batch_id)
                              .map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.label} ({b.course_title} · {b.delivery_mode})
                                </option>
                              ))}
                          </select>
                        </div>
                        <Input
                          label="Effective Start Date"
                          type="date"
                          value={transferStartDate}
                          onChange={(e) => setTransferStartDate(e.target.value)}
                        />
                      </div>
                      <Button size="sm" variant="outline" loading={submitting} onClick={handleBatchTransfer} disabled={!isAdmin}>
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Enroll in Target Batch
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-6">
              <CardHeader><CardTitle>Status History &amp; Exit Audit Log</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {selectedLifecycleEnrId && statusHistory.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-primary-700">Selected Enrollment Backend History</p>
                    {statusHistory.map((h) => (
                      <div key={h.id} className="p-2.5 rounded-lg border border-border bg-bg text-xs">
                        <span className="font-bold text-heading">{h.from_status} → {h.to_status}</span>
                        <span className="text-muted"> · {h.at?.slice(0, 10)}</span>
                        <p className="text-body mt-0.5">{h.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-bold text-heading">Recent Principal Lifecycle &amp; Dropout Notes ({exitRecords.length})</p>
                  {exitRecords.length === 0 ? (
                    <p className="text-xs text-muted">No status changes or transfers logged in this browser yet.</p>
                  ) : (
                    exitRecords.slice(0, 15).map((r) => (
                      <div key={r.id} className="p-2.5 rounded-lg border border-border bg-surface flex items-start justify-between gap-2 text-xs">
                        <div>
                          <p className="font-semibold text-heading">{r.student_name} · {r.batch_name}</p>
                          <p className="text-body">{r.reason}</p>
                        </div>
                        <Badge variant={r.new_status === 'withdrawn' ? 'cancelled' : 'approved'}>{r.category}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: MONTHLY LEADERBOARD & STAR STUDENTS */}
      {tab === 'leaderboard' && (
        <div className="space-y-5">
          <Card className="rounded-2xl border-amber-300/70 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-950">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Monthly Star Students Leaderboard &amp; Shoutout Console
                </CardTitle>
                <p className="text-xs text-muted mt-1">
                  Evaluate, overwrite, approve and publish monthly star performers to the Guardian Portal and Academy Website.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setStarStudents((prev) =>
                      prev.map((s) => ({
                        ...s,
                        status: 'published',
                        published_by: `${branding.principalName} (Super Admin)`,
                        published_at: new Date().toISOString(),
                        show_on_website: true,
                      })),
                    )
                    toast.success('Leaderboard approved & published to Website and Guardian Portals!')
                  }}
                  className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Sparkles className="w-4 h-4" /> Approve &amp; Publish All to Web
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {starStudents.map((star) => (
                  <div
                    key={star.id}
                    className="p-4 rounded-xl border border-amber-200/80 bg-surface shadow-xs space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-8 h-8 rounded-full font-black flex items-center justify-center text-sm shadow-xs ${
                            star.rank === 1
                              ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                              : star.rank === 2
                                ? 'bg-slate-200 text-slate-900 ring-2 ring-slate-300'
                                : 'bg-amber-700/20 text-amber-900 ring-2 ring-amber-700/30'
                          }`}
                        >
                          {star.rank}
                        </span>
                        <div>
                          <p className="font-bold text-sm text-heading">{star.student_name}</p>
                          <p className="text-xs text-muted truncate max-w-[170px]">{star.course_title}</p>
                        </div>
                      </div>
                      <Badge variant={star.status === 'published' ? 'approved' : 'pending'}>
                        {star.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                    </div>

                    {/* Breakdown pill */}
                    <div className="grid grid-cols-4 gap-1 p-2 rounded-lg bg-bg/80 border border-border/60 text-[10px] text-center">
                      <div>
                        <span className="text-muted block">হাজিরা</span>
                        <strong className="text-heading">{star.attendance_score}/25</strong>
                      </div>
                      <div>
                        <span className="text-muted block">সবক</span>
                        <strong className="text-heading">{star.sabaq_score}/35</strong>
                      </div>
                      <div>
                        <span className="text-muted block">হোমওয়ার্ক</span>
                        <strong className="text-heading">{star.homework_score}/20</strong>
                      </div>
                      <div>
                        <span className="text-muted block">পরীক্ষা</span>
                        <strong className="text-heading">{star.assessment_score}/20</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-primary-700">মোট স্কোর: {star.score}/১০০ ({star.grade})</span>
                      <span className="text-[11px] text-muted">{star.batch_name}</span>
                    </div>

                    {star.teacher_shoutout && (
                      <p className="text-xs text-body bg-amber-50/60 p-2 rounded-lg border border-amber-200/50 italic">
                        &ldquo;{star.teacher_shoutout}&rdquo;
                      </p>
                    )}

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={star.show_on_website}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setStarStudents((prev) =>
                              prev.map((s) => (s.id === star.id ? { ...s, show_on_website: checked } : s)),
                            )
                            toast.success(`Updated website display for ${star.student_name}`)
                          }}
                          className="rounded text-primary-700"
                        />
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        Show on Public Web
                      </label>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const bonus = prompt(`Enter bonus points or score adjustment for ${star.student_name}:`, '2')
                          if (bonus !== null) {
                            const add = Number(bonus) || 0
                            setStarStudents((prev) =>
                              prev.map((s) =>
                                s.id === star.id
                                  ? {
                                      ...s,
                                      score: Math.min(100, s.score + add),
                                      bonus_points: (s.bonus_points || 0) + add,
                                    }
                                  : s,
                              ),
                            )
                            toast.success(`Score adjusted for ${star.student_name}`)
                          }
                        }}
                        className="text-[11px] h-7 px-2"
                      >
                        Adjust Score
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PRINTABLE BRANDED DIGITAL CERTIFICATE (SANAD) MODAL */}
      {certPreview && (() => {
        const publicVerifyUrl =
          typeof window !== 'undefined'
            ? `${window.location.origin}/#/verify/${encodeURIComponent(certPreview.verification_code)}`
            : `#/verify/${encodeURIComponent(certPreview.verification_code)}`
        const shareMsg = [
          `*${branding.academyName} — Digital Sanad / Certificate*`,
          `Student: ${certPreview.student_name}`,
          `Course: ${certPreview.course_title}`,
          `Distinction: ${certPreview.grade_label}`,
          `Issue Date: ${certPreview.issue_date}`,
          `Verification Code: ${certPreview.verification_code}`,
          `Verify Online: ${publicVerifyUrl}`,
          `Signed by: ${branding.principalName} (${branding.principalTitle})`,
        ].join('\n')
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl border-4 border-primary-700/80 max-w-xl w-full p-7 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div className="text-center flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary-700">{branding.academyName}</p>
                  <p className="text-[11px] text-muted">{branding.tagline}</p>
                  <h3 className="text-2xl font-bold text-heading mt-2">Certificate of Completion (Sanad)</h3>
                </div>
                <button type="button" onClick={() => setCertPreview(null)} className="text-muted hover:text-heading">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center space-y-2 py-3 border-y border-border bg-bg/60 rounded-xl px-4">
                <div className="flex justify-center pb-1">
                  <StudentAvatar studentId={certPreview.student_id} name={certPreview.student_name} size="lg" />
                </div>
                <p className="text-xs text-muted">This is to certify that</p>
                <p className="text-2xl font-bold text-primary-800">{certPreview.student_name}</p>
                <p className="text-xs text-body">has successfully completed the online academic program</p>
                <p className="text-base font-bold text-heading">{certPreview.course_title}</p>
                <p className="text-sm font-semibold text-emerald-700">Distinction: {certPreview.grade_label}</p>
                {certPreview.remarks && <p className="text-xs text-muted italic pt-1">{certPreview.remarks}</p>}
              </div>

              <div className="flex items-center justify-between gap-4 text-xs pt-2 flex-wrap">
                <div>
                  <p className="text-muted inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {certPreview.issue_date}</p>
                  <p className="font-mono font-bold text-heading mt-1">Verify ID: {certPreview.verification_code}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <a
                      href={`#/verify/${encodeURIComponent(certPreview.verification_code)}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 hover:underline"
                    >
                      Open Public Card <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(publicVerifyUrl)
                        toast.success('Verification link copied')
                      }}
                      className="text-[11px] font-semibold text-muted hover:text-heading underline"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <QrCodeSvg value={publicVerifyUrl} size={78} />
                  <div className="text-right">
                    <p className="font-bold text-heading border-t border-heading/40 pt-1 px-2">{branding.principalName}</p>
                    <p className="text-[11px] text-muted">{branding.principalTitle}</p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-center text-muted">{branding.footerNote}</p>

              <div className="flex gap-2 justify-end flex-wrap pt-2 border-t border-border">
                <a
                  href={buildWhatsAppUrl(shareMsg)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4" /> Share WhatsApp
                </a>
                <a
                  href={buildTelegramShareUrl(shareMsg)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
                >
                  <Send className="w-4 h-4" /> Share Telegram
                </a>
                <Button size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" /> Print / PDF
                </Button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

