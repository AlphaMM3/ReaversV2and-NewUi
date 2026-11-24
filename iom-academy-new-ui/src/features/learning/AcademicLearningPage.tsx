import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toArray, type ClassSession } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { navigateTo, useHashRoute } from '@/lib/router'
import { formatDhakaDateTime, getDhakaDateString } from '@/lib/utils'
import {
  useLocalStore,
  HOMEWORK_OVERRIDES_KEY,
  type HomeworkPrincipalOverride,
  STAR_STUDENTS_KEY,
  DEFAULT_STAR_STUDENTS,
  type StarStudentAward,
} from '@/lib/superAdminStore'
import {
  BookOpen, GraduationCap, Plus, CheckCircle, X,
  Pencil, Eye, UserCheck, Search, Calendar, AlertCircle, ClipboardCheck, ArrowRight,
  Trophy,
} from 'lucide-react'
import HifzDailySheet from './HifzDailySheet'

interface MonthlyAttendanceMini {
  enrollment_id: number
  student_name?: string
  full_name?: string
  batch_id?: number
  batch_name?: string
  course_title?: string
  held_classes?: number
  present_count?: number
  late_count?: number
  absent_count?: number
  attendance_pct?: number | null
}

interface HomeworkRow {
  id: number
  batch_id: number
  class_id?: number | null
  title: string
  instructions?: string
  due_date?: string
  due_at?: string
  created_at?: string
  course_title?: string
  batch_name?: string
  teacher_name?: string
}

interface HomeworkSubmissionRow {
  id: number
  homework_id: number
  enrollment_id: number
  status: string
  teacher_feedback?: string | null
  student_name?: string
}

interface AssessmentRow {
  id: number
  batch_id: number
  title: string
  assessment_type?: string
  max_marks: number
  pass_marks?: number | null
  assessment_date?: string
  published?: number | boolean
  batch_name?: string
  course_title?: string
  teacher_name?: string
}

interface AssessmentMarkRow {
  id: number
  assessment_id: number
  enrollment_id: number
  obtained_marks: number
  teacher_remarks?: string | null
  guardian_feedback?: string | null
  status: string
  revision: number
  student_name?: string
}

interface BatchOption {
  course_id?: number
  id: number
  label: string
  course_title?: string
}

function makeRequestId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export default function AcademicLearningPage({
  role,
  mode = 'learning',
}: {
  role: string
  mode?: 'learning' | 'exams'
}) {
  const { params } = useHashRoute()
  const sessionId = mode === 'learning' && /^\d+$/.test(params.get('classId') ?? '') ? params.get('classId') : null
  const sessionBatch = sessionId ? params.get('batchId') : null
  const todayStr = getDhakaDateString()
  const isSuperAdmin = ['central_admin', 'branch_admin'].includes(role)
  const canCreate = ['central_admin', 'branch_admin', 'zimmadar', 'teacher'].includes(role)
  const canPublish = ['central_admin', 'branch_admin', 'zimmadar'].includes(role)

  const [tab, setTab] = useState<'hifz_pora' | 'homework' | 'attendance' | 'assessments'>(
    mode === 'exams' ? 'assessments' : sessionId ? 'homework' : 'hifz_pora',
  )
  useEffect(() => {
    setTab((prev) => {
      if (mode === 'exams') return 'assessments'
      if (sessionId) return 'homework'
      return prev === 'assessments' ? 'hifz_pora' : prev
    })
    setShowCreate(false)
    setSelectedClassId(sessionId ?? '')
    setSelectedBatchId(sessionBatch ?? '')
    setInspectHwId(null)
    setInspectAssess(null)
  }, [mode, sessionId, sessionBatch])
  const [singleCourse, setSingleCourse] = useState('')
  const [batchFilter, setBatchFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  // Create form fields (using friendly batch/class dropdowns + required backend fields)
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueOrExamDate, setDueOrExamDate] = useState(todayStr)
  const [assessmentType, setAssessmentType] = useState<'oral_practical' | 'continuous'>('oral_practical')
  const [maxMarks, setMaxMarks] = useState('100')
  const [saving, setSaving] = useState(false)

  // Principal / Super Admin Homework Override state (synced via superAdminStore -> MySQL)
  const [hwOverrides, setHwOverrides] = useLocalStore<HomeworkPrincipalOverride[]>(HOMEWORK_OVERRIDES_KEY, [])
  const [starStudents] = useLocalStore<StarStudentAward[]>(STAR_STUDENTS_KEY, DEFAULT_STAR_STUDENTS)
  const [overrideTargetHw, setOverrideTargetHw] = useState<HomeworkRow | null>(null)
  const [ovTitle, setOvTitle] = useState('')
  const [ovDue, setOvDue] = useState('')
  const [ovInstructions, setOvInstructions] = useState('')
  const [ovNote, setOvNote] = useState('')

  // Drill-down inspector state: Student Homework Submissions or Assessment Marks & Audited Override
  const [inspectHwId, setInspectHwId] = useState<number | null>(null)
  const [inspectAssess, setInspectAssess] = useState<AssessmentRow | null>(null)
  const [correctingMark, setCorrectingMark] = useState<AssessmentMarkRow | null>(null)
  const [newMarksVal, setNewMarksVal] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')

  const qc = useQueryClient()
  const toast = useToast()

  const { data: homework = [], isLoading: loadingHw } = useQuery<HomeworkRow[]>({
    queryKey: ['homework'],
    queryFn: () => api.get<HomeworkRow[]>('/homework'),
  })

  const { data: assessments = [], isLoading: loadingAs } = useQuery<AssessmentRow[]>({
    queryKey: ['assessments'],
    queryFn: () => api.get<AssessmentRow[]>('/assessments'),
  })

  const { data: batches = [] } = useQuery<BatchOption[]>({
    queryKey: ['learning-batches'],
    queryFn: () => api.get<BatchOption[]>('/batches').catch(() => []),
  })

  const { data: classes = [], isLoading: loadingClasses } = useQuery<ClassSession[]>({
    queryKey: ['learning-classes'],
    queryFn: () => api.get<ClassSession[] | { items?: ClassSession[] }>('/classes?limit=120').then(toArray).catch(() => []),
  })

  const { data: monthlyAttendance = [], isLoading: loadingAtt } = useQuery<MonthlyAttendanceMini[]>({
    queryKey: ['learning-attendance-monthly', todayStr.slice(0, 7)],
    queryFn: () =>
      api
        .get<MonthlyAttendanceMini[] | { items?: MonthlyAttendanceMini[] }>(`/attendance/monthly?month=${todayStr.slice(0, 7)}`)
        .then(toArray)
        .catch(() => []),
  })

  const { data: hwSubmissions = [], isLoading: loadingSubs } = useQuery<HomeworkSubmissionRow[]>({
    queryKey: ['hw-submissions', inspectHwId],
    queryFn: () => api.get<HomeworkSubmissionRow[]>(`/homework/${inspectHwId}/submissions`),
    enabled: inspectHwId !== null,
  })

  const { data: assessMarks = [], isLoading: loadingMarks } = useQuery<AssessmentMarkRow[]>({
    queryKey: ['assess-marks', inspectAssess?.id],
    queryFn: () => api.get<AssessmentMarkRow[]>(`/assessments/${inspectAssess!.id}/marks`),
    enabled: inspectAssess !== null,
  })

  const { data: courses = [] } = useQuery<{ id: number; title: string; category: string }[]>({
    queryKey: ['learning-courses'],
    queryFn: () => api.get('/courses'),
    enabled: tab === 'homework',
  })
  const singleCourses = courses.filter((course) => course.category === 'single_course')

  const overrideMap = useMemo(
    () => new Map(hwOverrides.map((o) => [o.homework_id, o])),
    [hwOverrides],
  )

  const batchSelectList = useMemo<BatchOption[]>(() => {
    if (batches.length > 0) return batches
    const seen = new Map<number, string>()
    for (const h of homework) {
      if (h.batch_id) seen.set(h.batch_id, h.batch_name || `Batch #${h.batch_id}`)
    }
    for (const a of assessments) {
      if (a.batch_id) seen.set(a.batch_id, a.batch_name || `Batch #${a.batch_id}`)
    }
    return Array.from(seen.entries()).map(([id, label]): BatchOption => ({ id, label }))
  }, [batches, homework, assessments])

  const filteredHomework = useMemo(() => {
    const q = search.trim().toLowerCase()
    return homework
      .map((h) => {
        const ov = overrideMap.get(h.id)
        return {
          raw: h,
          overridden: !!ov,
          overrideNote: ov?.principal_note,
          overrideAt: ov?.updated_at,
          displayTitle: ov?.title || h.title,
          displayInstructions: ov?.instructions || h.instructions || '—',
          displayDueDate: ov?.due_date || h.due_date || h.due_at?.slice(0, 10) || '—',
        }
      })
      .filter((item) => {
        if (singleCourse && !batches.some((batch) => batch.id === item.raw.batch_id && String(batch.course_id) === singleCourse)) return false
        if (sessionId && String(item.raw.class_id) !== sessionId) return false
        if (batchFilter !== 'all' && String(item.raw.batch_id) !== batchFilter) return false
        if (!q) return true
        return (
          item.displayTitle.toLowerCase().includes(q) ||
          item.raw.batch_name?.toLowerCase().includes(q) ||
          item.raw.course_title?.toLowerCase().includes(q) ||
          item.raw.teacher_name?.toLowerCase().includes(q)
        )
      })
  }, [homework, overrideMap, batchFilter, search, sessionId, singleCourse, batches])

  const filteredAssessments = useMemo(() => {
    const q = search.trim().toLowerCase()
    return assessments.filter((a) => {
      if (!a.title) return false
      const lowerTitle = a.title.toLowerCase().trim()
      if (['dsfd', 'dfsfd', 'asdf', 'test', 'dfsdf'].includes(lowerTitle)) return false
      if (batchFilter !== 'all' && String(a.batch_id) !== batchFilter) return false
      if (!q) return true
      return (
        a.title.toLowerCase().includes(q) ||
        a.batch_name?.toLowerCase().includes(q) ||
        a.course_title?.toLowerCase().includes(q) ||
        a.teacher_name?.toLowerCase().includes(q)
      )
    })
  }, [assessments, batchFilter, search])

  const filteredAttClasses = useMemo(() => {
    const q = search.trim().toLowerCase()
    return classes.filter((c) => {
      if (batchFilter !== 'all' && String(c.batch_id) !== batchFilter) return false
      if (!q) return true
      return (
        c.batch_name?.toLowerCase().includes(q) ||
        c.course_title?.toLowerCase().includes(q) ||
        String(c.id).includes(q)
      )
    })
  }, [classes, batchFilter, search])

  const filteredAttStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    return monthlyAttendance.filter((row) => {
      if (batchFilter !== 'all' && String(row.batch_id ?? '') !== batchFilter) return false
      if (!q) return true
      const nm = (row.student_name || row.full_name || '').toLowerCase()
      return nm.includes(q) || (row.batch_name || '').toLowerCase().includes(q)
    })
  }, [monthlyAttendance, batchFilter, search])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBatchId) {
      toast.warning('Please select a Batch')
      return
    }
    setSaving(true)
    try {
      if (tab === 'homework') {
        await api.post('/homework', {
          batch_id: Number(selectedBatchId),
          class_id: selectedClassId ? Number(selectedClassId) : null,
          title: title.trim(),
          instructions: instructions.trim() || 'Complete before next live class',
          due_date: dueOrExamDate,
          request_id: makeRequestId('hw'),
        })
        toast.success('Homework published to batch')
        qc.invalidateQueries({ queryKey: ['homework'] })
      } else {
        await api.post('/assessments', {
          batch_id: Number(selectedBatchId),
          title: title.trim(),
          assessment_type: assessmentType,
          max_marks: Number(maxMarks) || 100,
          assessment_date: dueOrExamDate,
          request_id: makeRequestId('assess'),
        })
        toast.success('Assessment created')
        qc.invalidateQueries({ queryKey: ['assessments'] })
      }
      setShowCreate(false)
      setTitle('')
      setInstructions('')
      setSelectedClassId(sessionId ?? '')
    } catch (err) {
      toast.error(err, 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function openHomeworkOverride(h: HomeworkRow) {
    const existing = overrideMap.get(h.id)
    setOverrideTargetHw(h)
    setOvTitle(existing?.title || h.title)
    setOvDue(existing?.due_date || h.due_date || todayStr)
    setOvInstructions(existing?.instructions || h.instructions || '')
    setOvNote(existing?.principal_note || '')
  }

  function saveHomeworkOverride(e: React.FormEvent) {
    e.preventDefault()
    if (!overrideTargetHw) return
    const next: HomeworkPrincipalOverride = {
      homework_id: overrideTargetHw.id,
      title: ovTitle.trim(),
      due_date: ovDue,
      instructions: ovInstructions.trim(),
      principal_note: ovNote.trim() || 'Adjusted by Principal Oversight',
      updated_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    setHwOverrides((prev) => [...prev.filter((x) => x.homework_id !== overrideTargetHw.id), next])
    setOverrideTargetHw(null)
    toast.success('Principal homework override saved')
  }

  function clearHomeworkOverride(homeworkId: number) {
    setHwOverrides((prev) => prev.filter((x) => x.homework_id !== homeworkId))
    toast.info('Reverted to original teacher submission')
  }

  async function publishAssessment(id: number) {
    try {
      await api.post(`/assessments/${id}/publish`, {})
      toast.success('Assessment marks published to Guardians')
      qc.invalidateQueries({ queryKey: ['assessments'] })
      if (inspectAssess?.id === id) {
        qc.invalidateQueries({ queryKey: ['assess-marks', id] })
      }
    } catch (err) {
      toast.error(err, 'Publish failed')
    }
  }

  async function submitMarkOverride(e: React.FormEvent) {
    e.preventDefault()
    if (!inspectAssess || !correctingMark) return
    if (correctionReason.trim().length < 5) {
      toast.warning('Please enter an audit reason (minimum 5 characters)')
      return
    }
    setSaving(true)
    try {
      await api.post(`/assessments/${inspectAssess.id}/marks/${correctingMark.id}/correction`, {
        new_marks: Number(newMarksVal),
        reason: correctionReason.trim(),
        expected_revision: correctingMark.revision,
      })
      toast.success('Student mark overridden with audit trail')
      setCorrectingMark(null)
      setCorrectionReason('')
      qc.invalidateQueries({ queryKey: ['assess-marks', inspectAssess.id] })
    } catch (err) {
      toast.error(err, 'Mark override failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-heading tracking-tight">
            {mode === 'exams' ? 'পরীক্ষা ও ফলাফল (Exams & Results)' : 'সবক হাজিরা ও বাড়ির কাজ'}
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            {mode === 'exams'
              ? 'শিক্ষার্থী মূল্যায়ন ও পরীক্ষার ফলাফল প্রকাশনা খাতা'
              : 'হিফজ ও ইসলামিক স্টাডিজের দৈনিক সবক, উপস্থিতি এবং হোমওয়ার্ক ব্যবস্থাপনা'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {mode !== 'exams' && (
            <Button size="sm" variant="outline" className="rounded-md text-xs font-semibold" onClick={() => navigateTo('#/attendance')}>
              <ClipboardCheck className="w-4 h-4" /> হাজিরা গ্রহণ
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="rounded-md text-xs font-semibold"
            onClick={() => navigateTo(mode === 'exams' ? '#/homework' : '#/exams')}
          >
            {mode === 'exams' ? (
              <>
                <BookOpen className="w-4 h-4" /> সবক ও হোমওয়ার্ক
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4" /> পরীক্ষা ও ফলাফল
              </>
            )}
          </Button>
          {canCreate && tab !== 'attendance' && (
            <Button size="sm" variant={isSuperAdmin ? 'outline' : 'primary'} className="rounded-md text-xs font-bold" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="w-4 h-4" /> {isSuperAdmin ? `ম্যানুয়াল ${tab === 'homework' ? 'হোমওয়ার্ক' : 'পরীক্ষা'}` : `নতুন ${tab === 'homework' ? 'হোমওয়ার্ক' : 'মূল্যায়ন'}`}
            </Button>
          )}
        </div>
      </div>

      {/* Dropdown & Filter Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className={`grid grid-cols-1 ${mode === 'exams' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>
            {mode !== 'exams' && (
              <div>
                <label className="text-xs font-semibold text-heading block mb-1">ভিউ মোড (Section View)</label>
                <select
                  value={tab}
                  onChange={(e) => {
                    setTab(e.target.value as 'hifz_pora' | 'homework' | 'attendance' | 'assessments')
                    setShowCreate(false)
                    setInspectHwId(null)
                    setInspectAssess(null)
                  }}
                  className="w-full"
                >
                  <option value="hifz_pora">📖 দৈনিক সবক ও হিফজ ডায়েরি (PDF Format)</option>
                  <option value="homework">হোমওয়ার্ক খাতা ({homework.length})</option>
                  <option value="attendance">উপস্থিতি ও হাজিরা ({filteredAttClasses.length})</option>
                </select>
              </div>
            )}
{tab !== 'hifz_pora' && <><div>
              <label className="text-xs font-semibold text-heading block mb-1">ব্যাচ নির্বাচন (Batch)</label>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full"
              >
                <option value="all">সবগুলো ব্যাচ (All Batches)</option>
                {batchSelectList.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.label} {b.course_title ? `— ${b.course_title}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-heading block mb-1">অনুসন্ধান (Search)</label>
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  placeholder="শিরোনাম, ব্যাচ বা উস্তাদের নাম…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="iom-input pl-10 w-full text-xs rounded-md"
                />
              </div>
            </div>
            </>}
            {tab === 'homework' && <label className="text-xs font-semibold text-heading">
              কোর্স ফিল্টার
              <select className="mt-1 block w-full text-xs rounded-md" value={singleCourse} onChange={(e) => { setSingleCourse(e.target.value); setBatchFilter('all') }}>
                <option value="">সবগুলো কোর্স (All Courses)</option>
                {singleCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
            </label>}
          </div>
        </CardContent>
      </Card>

      {/* Create Form */}
      {showCreate && canCreate && (
        <Card>
          <CardHeader>
            <CardTitle>{tab === 'homework' ? 'Assign Online Homework' : 'Create Online Assessment'}</CardTitle>
            <button type="button" onClick={() => setShowCreate(false)} className="text-muted"><X className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs font-semibold text-heading block mb-1">Batch</label>
                <select required disabled={!!sessionBatch} value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} className="w-full">
                  <option value="">— Select batch —</option>
                  {batchSelectList.map((b) => (
                    <option key={b.id} value={b.id}>{b.label} {b.course_title ? `— ${b.course_title}` : ''}</option>
                  ))}
                </select>
              </div>
              {tab === 'homework' ? (
                <div>
                  <label className="text-xs font-semibold text-heading block mb-1">Linked Class (Optional)</label>
                  <select disabled={!!sessionId} value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full">
                    {sessionId ? <option value={sessionId}>Class #{sessionId}</option> : <option value="">— General batch homework —</option>}
                    {classes
                      .filter((c) => !sessionId && (!selectedBatchId || String(c.batch_id) === selectedBatchId))
                      .slice(0, 30)
                      .map((c) => (
                        <option key={c.id} value={c.id}>#{c.id} · {c.batch_name} ({c.scheduled_start.slice(0, 10)})</option>
                      ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-heading block mb-1">Assessment Type</label>
                  <select value={assessmentType} onChange={(e) => setAssessmentType(e.target.value as 'oral_practical' | 'continuous')} className="w-full">
                    <option value="oral_practical">Oral / Practical Exam</option>
                    <option value="continuous">Continuous Evaluation</option>
                  </select>
                </div>
              )}
              <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tab === 'homework' ? 'Surah Al-Mulk 1–10 Hifz' : 'Monthly Tajweed Oral Exam'} />
              <Input label={tab === 'homework' ? 'Due Date' : 'Exam Date'} type="date" required value={dueOrExamDate} onChange={(e) => setDueOrExamDate(e.target.value)} />
              {tab === 'homework' ? (
                <div className="md:col-span-3">
                  <Input label="Instructions" required value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Memorize & record 2-minute audio before next class" />
                </div>
              ) : (
                <div className="md:col-span-3">
                  <Input label="Max Marks" type="number" min="1" max="1000" required value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} />
                </div>
              )}
              <Button type="submit" loading={saving}>Save</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Super Admin Homework Override Form */}
      {overrideTargetHw && (
        <Card className="border-amber-300 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Principal Override — Homework #{overrideTargetHw.id}
            </CardTitle>
            <button type="button" onClick={() => setOverrideTargetHw(null)} className="text-muted"><X className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveHomeworkOverride} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Input label="Adjusted Title" required value={ovTitle} onChange={(e) => setOvTitle(e.target.value)} />
              <Input label="Adjusted Due Date" type="date" required value={ovDue} onChange={(e) => setOvDue(e.target.value)} />
              <Input label="Principal Override Reason" placeholder="e.g. Extended deadline for weekend test" value={ovNote} onChange={(e) => setOvNote(e.target.value)} />
              <div className="md:col-span-2">
                <Input label="Adjusted Instructions" required value={ovInstructions} onChange={(e) => setOvInstructions(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Apply Override</Button>
                {overrideMap.has(overrideTargetHw.id) && (
                  <Button type="button" variant="outline" onClick={() => { clearHomeworkOverride(overrideTargetHw.id); setOverrideTargetHw(null) }}>
                    Revert
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* HIFZ & NAJERA DAILY SHEET */}
      {tab === 'hifz_pora' && (
        <HifzDailySheet role={role} />
      )}

      {sessionId && tab === 'homework' && <div className="flex items-center gap-3 text-sm"><span>Homework for class #{sessionId}</span><Button size="sm" variant="outline" onClick={() => navigateTo('#/classes')}>Back to classes</Button><Button size="sm" variant="outline" onClick={() => navigateTo('#/homework')}>Clear class filter</Button></div>}
      {/* HOMEWORK BOX GRID */}
      {tab === 'homework' ? (
        loadingHw ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : filteredHomework.length === 0 ? (
          <Card>
            <CardContent className="text-center py-14 text-muted">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-heading">No teacher homework updates found for this filter.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
            {filteredHomework.map(({ raw: h, overridden, overrideNote, displayTitle, displayInstructions, displayDueDate }) => {
              const isInspecting = inspectHwId === h.id
              return (
                <Card key={h.id} className="h-full flex flex-col justify-between">
                  <CardContent className="pt-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-heading leading-snug">{displayTitle}</h3>
                        {overridden ? (
                          <Badge variant="pending">Overridden</Badge>
                        ) : (
                          <Badge variant="primary">Teacher Update</Badge>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-primary-700">
                        {h.batch_name || `Batch #${h.batch_id}`}
                        {h.course_title ? ` · ${h.course_title}` : ''}
                      </p>

                      <div className="flex items-center justify-between gap-2 text-xs text-muted bg-bg/60 rounded-lg px-2.5 py-1.5">
                        <span className="inline-flex items-center gap-1 truncate">
                          <UserCheck className="w-3.5 h-3.5 shrink-0" />
                          {h.teacher_name || 'Assigned Teacher'}
                        </span>
                        <span className="inline-flex items-center gap-1 shrink-0 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          Due {displayDueDate}
                        </span>
                      </div>

                      <p className="text-xs text-body line-clamp-3 leading-relaxed">
                        {displayInstructions}
                      </p>

                      {overridden && overrideNote && (
                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                          <strong>Principal Note:</strong> {overrideNote}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border/70 flex items-center justify-between gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={isInspecting ? 'primary' : 'outline'}
                        onClick={() => setInspectHwId(isInspecting ? null : h.id)}
                      >
                        <Eye className="w-3.5 h-3.5" /> {isInspecting ? 'Hide Submissions' : 'Submissions'}
                      </Button>
                      {isSuperAdmin && (
                        <Button size="sm" variant="ghost" onClick={() => openHomeworkOverride(h)}>
                          <Pencil className="w-3.5 h-3.5" /> Override
                        </Button>
                      )}
                    </div>

                    {isInspecting && (
                      <div className="pt-2 border-t border-border space-y-1.5 max-h-48 overflow-y-auto">
                        {loadingSubs ? (
                          <Skeleton className="h-12 rounded-lg" />
                        ) : hwSubmissions.length === 0 ? (
                          <p className="text-xs text-muted italic">No student tracking rows yet.</p>
                        ) : (
                          hwSubmissions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-bg border border-border/60">
                              <span className="font-semibold text-heading truncate">{s.student_name || `Enrollment #${s.enrollment_id}`}</span>
                              <Badge variant={s.status === 'completed' ? 'approved' : 'draft'}>{s.status}</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      ) : tab === 'attendance' ? (
        /* CLASS ATTENDANCE & ROLL CALL VIEW */
        <div className="space-y-5">
          {/* Session Cards Box Grid */}
          <Card>
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-base">Class Attendance Sessions ({filteredAttClasses.length})</CardTitle>
                <p className="text-xs text-muted mt-0.5">Select any recent or live session to mark or review Present / Absent / Late roll call</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigateTo('#/attendance')}>
                Full Roll Call Page <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingClasses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
              ) : filteredAttClasses.length === 0 ? (
                <p className="text-sm text-muted text-center py-8">No sessions match this batch filter.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 items-stretch">
                  {filteredAttClasses.slice(0, 12).map((cls) => (
                    <div
                      key={cls.id}
                      className="p-4 rounded-xl border border-border bg-bg/60 hover:border-primary-300 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-heading leading-snug">{cls.batch_name || cls.course_title}</p>
                          <Badge
                            variant={
                              cls.status === 'ended'
                                ? 'approved'
                                : cls.status === 'in_progress'
                                  ? 'live'
                                  : cls.status === 'cancelled'
                                    ? 'absent'
                                    : 'draft'
                            }
                          >
                            {cls.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted truncate">{cls.course_title}</p>
                        <p className="text-xs text-muted font-mono">{formatDhakaDateTime(cls.scheduled_start)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={cls.status === 'ended' || cls.status === 'in_progress' ? 'primary' : 'outline'}
                        className="w-full"
                        onClick={() => navigateTo(`#/attendance?classId=${cls.id}`)}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Open Roll Call
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Monthly Attendance Snapshot */}
          <Card>
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-base">Student Attendance Overview ({todayStr.slice(0, 7)})</CardTitle>
                <p className="text-xs text-muted mt-0.5">Batch-wise monthly attendance summary alongside Homework &amp; Exams</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigateTo('#/attendance/monthly')}>
                Monthly Register <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingAtt ? (
                <Skeleton className="h-36 rounded-xl" />
              ) : filteredAttStudents.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No attendance records recorded for {todayStr.slice(0, 7)} yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="iom-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Batch</th>
                        <th>Held</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttStudents.slice(0, 20).map((row) => {
                        const pct = row.attendance_pct !== null && row.attendance_pct !== undefined ? Math.round(Number(row.attendance_pct)) : 0
                        return (
                          <tr key={row.enrollment_id}>
                            <td className="font-semibold text-heading">{row.student_name || row.full_name || `#${row.enrollment_id}`}</td>
                            <td className="text-xs text-muted">{row.batch_name || '—'}</td>
                            <td className="text-xs">{row.held_classes ?? 0}</td>
                            <td className="text-xs text-emerald-700 font-semibold">{row.present_count ?? 0}</td>
                            <td className="text-xs text-rose-700 font-semibold">{row.absent_count ?? 0}</td>
                            <td>
                              <Badge variant={pct >= 80 ? 'approved' : pct >= 60 ? 'pending' : 'absent'}>{pct}%</Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ASSESSMENTS & EXAM MARKS BOX GRID */
        <div className="space-y-4">
          {/* Monthly Star Students Leaderboard Widget for Teachers & Admins */}
          <Card className="rounded-2xl border-amber-300/80 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/20 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-950">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Monthly Star Students Leaderboard · নভেম্বর ২০২৬
                </CardTitle>
                <p className="text-xs text-muted mt-0.5">
                  উপস্থিতি (২৫%) + ডেইলি সবক (৩৫%) + হোমওয়ার্ক (২০%) + কুইজ (২০%) এর ১০০ পয়েন্ট মূল্যায়নে ব্যাচের সেরা শিক্ষার্থীরা।
                </p>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                ⭐ Star Performer Ranking
              </span>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {starStudents.map((star) => (
                  <div
                    key={star.id}
                    className="p-3 rounded-xl border border-amber-200/70 bg-surface shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs ${
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
                          <p className="font-bold text-xs text-heading">{star.student_name}</p>
                          <p className="text-[10px] text-muted truncate max-w-[150px]">{star.batch_name}</p>
                        </div>
                      </div>
                      <Badge variant="approved" className="text-[10px]">
                        {star.grade}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/60">
                      <span className="font-bold text-primary-700">স্কোর: {star.score}/১০০</span>
                      <span className="text-[10px] text-muted">হাজিরা {star.attendance_score} · সবক {star.sabaq_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {inspectAssess && (
            <Card className="border-primary-300">
              <CardHeader className="border-b border-border pb-3">
                <div>
                  <CardTitle className="text-base">
                    Exam Marks Oversight · {inspectAssess.title} (Max {inspectAssess.max_marks})
                  </CardTitle>
                  <p className="text-xs text-muted mt-0.5">
                    {inspectAssess.batch_name} · Teacher: {inspectAssess.teacher_name || 'Assigned Teacher'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canPublish && (
                    <Button size="sm" variant="secondary" onClick={() => publishAssessment(inspectAssess.id)}>
                      <CheckCircle className="w-3.5 h-3.5" /> Publish to Guardians
                    </Button>
                  )}
                  <button type="button" onClick={() => { setInspectAssess(null); setCorrectingMark(null) }} className="text-muted">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {correctingMark && (
                  <form onSubmit={submitMarkOverride} className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="md:col-span-4 text-xs font-bold text-amber-900">
                      Audited Mark Override for {correctingMark.student_name} (Current: {correctingMark.obtained_marks} / {inspectAssess.max_marks})
                    </div>
                    <Input label="New Marks" type="number" min="0" max={inspectAssess.max_marks} step="0.5" required value={newMarksVal} onChange={(e) => setNewMarksVal(e.target.value)} />
                    <div className="md:col-span-2">
                      <Input label="Mandatory Audit Reason (min 5 chars)" required value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} placeholder="e.g. Rechecked oral tajweed rubric score" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" loading={saving}>Save Override</Button>
                      <Button type="button" variant="outline" onClick={() => setCorrectingMark(null)}>Cancel</Button>
                    </div>
                  </form>
                )}

                {loadingMarks ? (
                  <Skeleton className="h-24 rounded-xl" />
                ) : assessMarks.length === 0 ? (
                  <p className="text-xs text-muted py-4 text-center">No marks entered by the teacher yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="iom-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Obtained</th>
                          <th>Status</th>
                          <th>Feedback</th>
                          {canCreate && <th className="text-right">Oversight</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {assessMarks.map((m) => (
                          <tr key={m.id}>
                            <td className="font-semibold text-heading">{m.student_name || `Enrollment #${m.enrollment_id}`}</td>
                            <td className="font-bold text-primary-700">{m.obtained_marks} / {inspectAssess.max_marks}</td>
                            <td>
                              <Badge variant={m.status === 'published' ? 'approved' : 'draft'}>{m.status}</Badge>
                            </td>
                            <td className="text-xs text-muted">{m.guardian_feedback || m.teacher_remarks || '—'}</td>
                            {canCreate && (
                              <td className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setCorrectingMark(m)
                                    setNewMarksVal(String(m.obtained_marks))
                                    setCorrectionReason('')
                                  }}
                                >
                                  <Pencil className="w-3 h-3" /> Override Mark
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {loadingAs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          ) : filteredAssessments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-14 text-muted">
                <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium text-heading">No assessments match this filter.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
              {filteredAssessments.map((a) => (
                <Card key={a.id} className="h-full flex flex-col justify-between">
                  <CardContent className="pt-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-heading">{a.title}</h3>
                        <Badge variant={a.published ? 'approved' : 'draft'}>
                          {a.published ? 'Published' : 'Teacher Entry'}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-primary-700">
                        {a.batch_name || `Batch #${a.batch_id}`}
                        {a.course_title ? ` · ${a.course_title}` : ''}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted bg-bg/60 rounded-lg px-2.5 py-1.5">
                        <span className="truncate">{a.teacher_name || 'Teacher'}</span>
                        <span className="font-semibold shrink-0">Max {a.max_marks} marks</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/70 flex items-center justify-between gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={inspectAssess?.id === a.id ? 'primary' : 'outline'}
                        onClick={() => setInspectAssess(inspectAssess?.id === a.id ? null : a)}
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect &amp; Override Marks
                      </Button>
                      {canPublish && !a.published && (
                        <Button size="sm" variant="secondary" onClick={() => publishAssessment(a.id)}>
                          <CheckCircle className="w-3.5 h-3.5" /> Publish
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
