import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type ClassSession } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { useHashRoute, navigateTo } from '@/lib/router'
import { deriveClassCapabilities } from '@/lib/stateMachines'
import { formatDhakaTime, getDhakaDateString } from '@/lib/utils'
import {
  useLocalStore,
  COURSE_TRACKER_PLANS_KEY,
  type CourseTrackerPlan,
} from '@/lib/superAdminStore'
import {
  CalendarDays, ChevronLeft, ChevronRight, Video, ExternalLink,
  Plus, CalendarOff, Bookmark, X, GanttChartSquare, CalendarCheck2,
  Pencil, Check,
} from 'lucide-react'

interface AcademicSessionRow {
  id: number
  branch_id: number
  label: string
  start_date: string
  end_date: string
}

interface LeaveRow {
  id: number
  enrollment_id: number
  student_name?: string
  start_date: string
  end_date: string
  reason: string
  status: string
}

interface BatchOption {
  id: number
  course_id?: number
  label: string
  course_title?: string
  department?: string
  teacher_name?: string | null
  start_date?: string | null
  end_date?: string | null
  status?: string
  delivery_mode?: string
}

interface EnrollmentDateRow {
  id: number
  batch_id: number
  start_date?: string | null
  end_date?: string | null
  status?: string
}

const WEEKDAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

const TRACK_COLORS = [
  'bg-primary-700',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-amber-600',
  'bg-emerald-600',
  'bg-sky-600',
]

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toMonthKey(year: number, monthIndex: number) {
  return `${year}-${pad2(monthIndex + 1)}`
}

function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num))
}

function computeYearSpan(startDate: string, endDate: string, year: number): { leftPct: number; widthPct: number; inYear: boolean } {
  const yearStartMs = new Date(`${year}-01-01T00:00:00Z`).getTime()
  const yearEndMs = new Date(`${year}-12-31T23:59:59Z`).getTime()
  const totalMs = Math.max(1, yearEndMs - yearStartMs)

  const sMs = new Date(`${startDate.slice(0, 10)}T00:00:00Z`).getTime()
  const eMs = new Date(`${endDate.slice(0, 10)}T23:59:59Z`).getTime()

  if (Number.isNaN(sMs) || Number.isNaN(eMs) || eMs < yearStartMs || sMs > yearEndMs) {
    return { leftPct: 0, widthPct: 0, inYear: false }
  }
  const cStart = clamp(sMs, yearStartMs, yearEndMs)
  const cEnd = clamp(eMs, yearStartMs, yearEndMs)
  const leftPct = ((cStart - yearStartMs) / totalMs) * 100
  const widthPct = Math.max(2.5, ((cEnd - cStart) / totalMs) * 100)
  return { leftPct, widthPct, inYear: true }
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseYmdParts(ymd: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd.trim())
  if (!m) return null
  return [Number(m[1]), Number(m[2]) - 1, Number(m[3])]
}

function formatCourseDuration(startDate: string, endDate: string): string {
  const s = parseYmdParts(startDate)
  const e = parseYmdParts(endDate)
  if (!s || !e) return ''
  const months = Math.max(1, (e[0] - s[0]) * 12 + (e[1] - s[1]) + (e[2] >= s[2] ? 1 : 0))
  if (months >= 12) {
    if (months % 12 === 0) {
      const yrs = months / 12
      return `${yrs} yr${yrs > 1 ? 's' : ''}`
    }
    if (months % 6 === 0) {
      return `${(months / 12).toFixed(1)} yrs`
    }
    return `${Math.floor(months / 12)}y ${months % 12}m`
  }
  return `${months} mo${months > 1 ? 's' : ''}`
}

function computeCompletionPct(startDate: string, endDate: string, todayStr: string): number {
  const s = parseYmdParts(startDate)
  const e = parseYmdParts(endDate)
  const t = parseYmdParts(todayStr)
  if (!s || !e || !t) return 0
  const sMs = Date.UTC(s[0], s[1], s[2], 0, 0, 0)
  const eMs = Date.UTC(e[0], e[1], e[2], 23, 59, 59)
  const tMs = Date.UTC(t[0], t[1], t[2], 12, 0, 0)
  if (tMs <= sMs) return 0
  if (tMs >= eMs) return 100
  return Math.round(((tMs - sMs) / Math.max(1, eMs - sMs)) * 100)
}

function inferGenderTrack(batch: BatchOption, override?: 'all' | 'male' | 'female'): 'all' | 'male' | 'female' {
  if (override && override !== 'all') return override
  const text = `${batch.label} ${batch.course_title || ''} ${batch.department || ''}`.toLowerCase()
  if (/female|girls?|sisters?|ছাত্রী|বালিকা|মহিলা/.test(text)) return 'female'
  if (/male|boys?|brothers?|ছাত্র|বালক|পুরুষ/.test(text)) return 'male'
  return override || 'all'
}

function inferProgramTrack(batch: BatchOption, override?: 'hifz' | 'najera' | 'other'): 'hifz' | 'najera' | 'other' {
  if (override && override !== 'other') return override
  const text = `${batch.department || ''} ${batch.course_title || ''} ${batch.label}`.toLowerCase()
  if (/hifz|হফজ|হিফজ/.test(text)) return 'hifz'
  if (/najera|nazera|নাজেরা|তাজবীদ|tajweed|নূরানী|noorani/.test(text)) return 'najera'
  return override || 'other'
}

/**
 * Renders a horizontally slidable multi-year / multi-month timeline inside mobile cards
 * so courses of any length (e.g. 3 months, 1.5 years, 3 years) can be swiped start-to-end.
 */
function SlidableMultiYearBar({
  startDate,
  endDate,
  examDate,
  todayStr,
  barColorClass,
  trackBgClass = 'bg-slate-100',
}: {
  startDate: string
  endDate: string
  examDate?: string
  todayStr: string
  barColorClass: string
  trackBgClass?: string
}) {
  const s = parseYmdParts(startDate)
  const e = parseYmdParts(endDate)
  if (!s || !e) return null

  const [sYear, sMonth, sDay] = s
  const [eYear, eMonth, eDay] = e

  const totalMonthsRaw = (eYear - sYear) * 12 + (eMonth - sMonth) + 1
  if (totalMonthsRaw < 1) return null
  const cappedMonths = Math.min(totalMonthsRaw, 120)

  const yearGroups: Array<{ year: number; months: Array<{ label: string; key: string; isYearStart: boolean }> }> = []
  for (let i = 0; i < cappedMonths; i++) {
    const absMonth = sYear * 12 + sMonth + i
    const yr = Math.floor(absMonth / 12)
    const mo = absMonth % 12
    const lastGroup = yearGroups[yearGroups.length - 1]
    const cell = { label: MONTH_SHORT[mo], key: `${yr}-${mo}`, isYearStart: mo === 0 && i > 0 }
    if (lastGroup && lastGroup.year === yr) {
      lastGroup.months.push(cell)
    } else {
      yearGroups.push({ year: yr, months: [cell] })
    }
  }

  const trackStartMs = Date.UTC(sYear, sMonth, 1, 0, 0, 0)
  const lastAbsMonth = sYear * 12 + sMonth + cappedMonths - 1
  const lastYr = Math.floor(lastAbsMonth / 12)
  const lastMo = lastAbsMonth % 12
  const trackEndMs = Date.UTC(lastYr, lastMo + 1, 0, 23, 59, 59)
  const totalMs = Math.max(1, trackEndMs - trackStartMs)

  const barStartMs = clamp(Date.UTC(sYear, sMonth, sDay, 0, 0, 0), trackStartMs, trackEndMs)
  const barEndMs = clamp(Date.UTC(eYear, eMonth, eDay, 23, 59, 59), trackStartMs, trackEndMs)
  const leftPct = ((barStartMs - trackStartMs) / totalMs) * 100
  const widthPct = Math.max(3, ((barEndMs - barStartMs) / totalMs) * 100)

  const tParts = parseYmdParts(todayStr)
  let todayPct: number | null = null
  if (tParts) {
    const tMs = Date.UTC(tParts[0], tParts[1], tParts[2], 12, 0, 0)
    if (tMs >= trackStartMs && tMs <= trackEndMs) {
      todayPct = ((tMs - trackStartMs) / totalMs) * 100
    }
  }

  const exParts = examDate ? parseYmdParts(examDate) : null
  let examPct: number | null = null
  let examShortLabel = ''
  if (exParts) {
    const exMs = Date.UTC(exParts[0], exParts[1], exParts[2], 12, 0, 0)
    if (exMs >= trackStartMs && exMs <= trackEndMs) {
      examPct = ((exMs - trackStartMs) / totalMs) * 100
      examShortLabel = `${MONTH_SHORT[exParts[1]]} ${exParts[2]}`
    }
  }

  const completionPct = computeCompletionPct(startDate, endDate, todayStr)
  const durationLabel = formatCourseDuration(startDate, endDate)
  const isScrollable = cappedMonths > 7
  const minTrackWidth = Math.max(248, cappedMonths * 40)

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-3 rounded-xl bg-bg/80 border border-border/70 px-3 py-2.5">
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-muted font-medium w-9">Start:</span>
            <span className="font-mono font-semibold text-heading">{startDate.slice(0, 10)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted font-medium w-9">End:</span>
            <span className="font-mono font-semibold text-heading">{endDate.slice(0, 10)}</span>
          </div>
          {examDate && (
            <div className="flex items-center gap-1.5">
              <span className="text-amber-700 font-semibold w-9">Exam:</span>
              <span className="font-mono font-semibold text-amber-800">{examDate.slice(0, 10)}</span>
            </div>
          )}
        </div>
        <div className="text-right space-y-1 shrink-0">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-700 text-white text-[11px] font-bold">
            {completionPct}% Done
          </div>
          <div className="flex items-center justify-end gap-1.5">
            {durationLabel && (
              <span className="px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 font-semibold text-[10px]">
                {durationLabel}
              </span>
            )}
            {isScrollable && (
              <span className="text-[10px] text-muted font-medium">← Slide →</span>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto touch-pan-x pb-1 -mx-0.5 px-0.5">
        <div style={{ minWidth: `${minTrackWidth}px` }} className="space-y-1.5">
          {/* Year group headers */}
          <div className="flex text-[10px] font-bold text-primary-800">
            {yearGroups.map((yg, idx) => (
              <div
                key={yg.year}
                style={{ flexGrow: yg.months.length, flexBasis: 0 }}
                className={`truncate px-1.5 py-0.5 rounded-sm bg-primary-50/80 ${
                  idx > 0 ? 'border-l border-primary-200 ml-0.5' : ''
                }`}
              >
                {yg.year}
              </div>
            ))}
          </div>

          {/* Progress track + Today + Exam markers */}
          <div className="relative pt-1 pb-1">
            <div className={`relative h-3 rounded-full ${trackBgClass} overflow-hidden`}>
              <div
                className={`absolute top-0 bottom-0 rounded-full ${barColorClass}`}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              />
              {todayPct !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${todayPct}%` }}
                  title={`Today: ${todayStr}`}
                />
              )}
              {examPct !== null && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-amber-400 z-20"
                  style={{ left: `${examPct}%` }}
                  title={`Exam Date: ${examDate}`}
                />
              )}
            </div>
            {examPct !== null && (
              <div
                className="absolute -top-0.5 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none"
                style={{ left: `${examPct}%` }}
              >
                <span className="w-2.5 h-2.5 rotate-45 bg-amber-500 border border-white shadow-xs" />
                <span className="mt-1 px-1 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold whitespace-nowrap">
                  Exam · {examShortLabel}
                </span>
              </div>
            )}
          </div>

          {/* Month ticks */}
          <div className={`flex text-[10px] text-muted font-medium ${examPct !== null ? 'pt-3' : ''}`}>
            {yearGroups.flatMap((yg) =>
              yg.months.map((m) => (
                <span
                  key={m.key}
                  className={`flex-1 text-center ${
                    m.isYearStart ? 'border-l border-border font-semibold text-heading' : ''
                  }`}
                >
                  {m.label}
                </span>
              )),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AcademicCalendarPage({ role }: { role: string }) {
  const todayStr = getDhakaDateString()
  const { params } = useHashRoute()
  const toast = useToast()
  const paramDate = params.get('date')
  const validParamDate = paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate) ? paramDate : todayStr

  const [selectedDate, setSelectedDate] = useState(validParamDate)
  const [cursorYear, setCursorYear] = useState(() => Number(validParamDate.slice(0, 4)))
  const [cursorMonth, setCursorMonth] = useState(() => Number(validParamDate.slice(5, 7)) - 1)
  const [timelineYear, setTimelineYear] = useState(() => Number(todayStr.slice(0, 4)))
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'active'>('all')
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all')
  const [programFilter, setProgramFilter] = useState<'all' | 'hifz' | 'najera'>('all')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [panel, setPanel] = useState<'idle' | 'schedule_class' | 'add_term'>(() => params.get('schedule') === '1' ? 'schedule_class' : 'idle')

  const [trackerPlans, setTrackerPlans] = useLocalStore<CourseTrackerPlan[]>(COURSE_TRACKER_PLANS_KEY, [])
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null)
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editExamDate, setEditExamDate] = useState('')
  const [editGenderTrack, setEditGenderTrack] = useState<'all' | 'male' | 'female'>('all')
  const [editProgramTrack, setEditProgramTrack] = useState<'other' | 'hifz' | 'najera'>('other')
  const [editNote, setEditNote] = useState('')

  useEffect(() => {
    if (paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate)) {
      setSelectedDate(paramDate)
      setCursorYear(Number(paramDate.slice(0, 4)))
      setCursorMonth(Number(paramDate.slice(5, 7)) - 1)
    }
  }, [paramDate])

  // Quick class schedule state
  const [batchId, setBatchId] = useState('')
  const [startTime, setStartTime] = useState('20:00')
  const [endTime, setEndTime] = useState('20:45')
  const [meetingUrl, setMeetingUrl] = useState('')

  // Quick term state
  const [termLabel, setTermLabel] = useState('')
  const [termStart, setTermStart] = useState(todayStr)
  const [termEnd, setTermEnd] = useState(todayStr)
  const [saving, setSaving] = useState(false)

  const canManage = ['central_admin', 'branch_admin', 'zimmadar'].includes(role)
  const isAdmin = ['central_admin', 'branch_admin'].includes(role)
  const qc = useQueryClient()

  const monthKey = toMonthKey(cursorYear, cursorMonth)
  const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate()
  const monthFrom = `${monthKey}-01`
  const monthUntil = `${monthKey}-${pad2(daysInMonth)}T23:59:59`

  const { data: classes = [], isLoading: loadingClasses } = useQuery<ClassSession[]>({
    queryKey: ['calendar-classes', monthKey],
    queryFn: () =>
      api.get<ClassSession[]>(`/classes?from=${monthFrom}&until=${monthUntil}&limit=500`),
  })

  // Always fetch today's classes so right-hand schedule card can display Today's full classes even when browsing another month
  const { data: todayClassesDirect = [] } = useQuery<ClassSession[]>({
    queryKey: ['calendar-today-classes', todayStr],
    queryFn: () =>
      api.get<ClassSession[]>(`/classes?from=${todayStr}&until=${todayStr}T23:59:59&limit=200`),
  })

  const { data: terms = [] } = useQuery<AcademicSessionRow[]>({
    queryKey: ['academic-sessions'],
    queryFn: () => api.get<AcademicSessionRow[]>('/academic-sessions').catch(() => []),
  })

  const { data: leaves = [] } = useQuery<LeaveRow[]>({
    queryKey: ['leaves-calendar'],
    queryFn: () => api.get<LeaveRow[]>('/leaves').catch(() => []),
  })

  const { data: batches = [] } = useQuery<BatchOption[]>({
    queryKey: ['batches-for-calendar'],
    queryFn: () => api.get<BatchOption[]>('/batches').catch(() => []),
  })

  const { data: enrollments = [] } = useQuery<EnrollmentDateRow[]>({
    queryKey: ['enrollments-for-calendar'],
    queryFn: () => api.get<EnrollmentDateRow[]>('/enrollments?limit=500').catch(() => []),
  })

  const { data: branches = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ['branches-for-calendar'],
    queryFn: () => api.get('/branches'),
    enabled: isAdmin && panel === 'add_term',
  })

  // Index classes & leaves by YYYY-MM-DD (BD date prefix of scheduled_start)
  const classesByDay = useMemo(() => {
    const map = new Map<string, ClassSession[]>()
    for (const c of classes) {
      const day = c.scheduled_start.slice(0, 10)
      const list = map.get(day) ?? []
      list.push(c)
      map.set(day, list)
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start))
      map.set(k, list)
    }
    return map
  }, [classes])

  const todaysClassesList = useMemo(() => {
    const list = classesByDay.get(todayStr) ?? todayClassesDirect
    return [...list].sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start))
  }, [classesByDay, todayStr, todayClassesDirect])

  const leavesByDay = useMemo(() => {
    const map = new Map<string, LeaveRow[]>()
    for (const l of leaves) {
      if (l.status === 'rejected') continue
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = `${monthKey}-${pad2(d)}`
        if (dayStr >= l.start_date && dayStr <= l.end_date) {
          const list = map.get(dayStr) ?? []
          list.push(l)
          map.set(dayStr, list)
        }
      }
    }
    return map
  }, [leaves, monthKey, daysInMonth])

  // Saturday-first index: JS getDay() gives 0=Sun..6=Sat -> (getDay() + 1) % 7 maps Sat->0, Sun->1 ... Fri->6
  const firstWeekday = (new Date(cursorYear, cursorMonth, 1).getDay() + 1) % 7
  const totalSlots = firstWeekday + daysInMonth
  const trailingEmptySlots = (7 - (totalSlots % 7)) % 7

  const monthLabel = new Date(cursorYear, cursorMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  function shiftMonth(delta: number) {
    const d = new Date(cursorYear, cursorMonth + delta, 1)
    setCursorYear(d.getFullYear())
    setCursorMonth(d.getMonth())
  }

  function jumpToday() {
    setCursorYear(Number(todayStr.slice(0, 4)))
    setCursorMonth(Number(todayStr.slice(5, 7)) - 1)
    setSelectedDate(todayStr)
  }

  async function scheduleClass(e: React.FormEvent) {
    e.preventDefault()
    if (!batchId) return
    setSaving(true)
    try {
      await api.post('/classes', {
        batch_id: Number(batchId),
        scheduled_start: `${selectedDate}T${startTime}:00+06:00`,
        scheduled_end: `${selectedDate}T${endTime}:00+06:00`,
        meeting_url: meetingUrl.trim() || null,
      })
      setPanel('idle')
      setMeetingUrl('')
      toast.success(`Online class scheduled for ${selectedDate}`)
      qc.invalidateQueries({ queryKey: ['calendar-classes'] })
      qc.invalidateQueries({ queryKey: ['calendar-today-classes'] })
    } catch (err) {
      toast.error(err, 'Failed to schedule class')
    } finally {
      setSaving(false)
    }
  }

  async function createTerm(e: React.FormEvent) {
    e.preventDefault()
    if (!branches[0]?.id) return
    setSaving(true)
    try {
      await api.post('/academic-sessions', {
        branch_id: branches[0].id,
        label: termLabel.trim(),
        start_date: termStart,
        end_date: termEnd,
      })
      setPanel('idle')
      setTermLabel('')
      toast.success('Academic term saved')
      qc.invalidateQueries({ queryKey: ['academic-sessions'] })
    } catch (err) {
      toast.error(err, 'Failed to save academic term')
    } finally {
      setSaving(false)
    }
  }

  function saveBatchTrackerDates(targetBatchId: number) {
    if (!editStart || !editEnd) {
      toast.warning('Both start and end dates are required')
      return
    }
    if (editEnd < editStart) {
      toast.warning('End date cannot be earlier than start date')
      return
    }
    setTrackerPlans((prev) => [
      ...prev.filter((p) => p.batch_id !== targetBatchId),
      {
        batch_id: targetBatchId,
        start_date: editStart,
        end_date: editEnd,
        exam_date: editExamDate || undefined,
        gender_track: editGenderTrack,
        program_track: editProgramTrack,
        milestone_note: editNote.trim() || undefined,
      },
    ])
    setEditingBatchId(null)
    toast.success('Course timeline dates updated')
  }

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of batches) {
      const key = b.course_id ? String(b.course_id) : b.course_title || `batch-${b.id}`
      const label = b.course_title || `Course #${b.course_id || b.id}`
      if (!map.has(key)) map.set(key, label)
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [batches])

  // Build Year-Wise Project Tracker rows combining Academic Terms & Courses/Batches
  const batchTimelineRows = useMemo(() => {
    const planMap = new Map(trackerPlans.map((p) => [p.batch_id, p]))
    const enrollmentDates = new Map<number, { minStart?: string; maxEnd?: string }>()
    for (const en of enrollments) {
      const cur = enrollmentDates.get(en.batch_id) ?? {}
      const s = en.start_date?.slice(0, 10)
      const e = en.end_date?.slice(0, 10)
      if (s && (!cur.minStart || s < cur.minStart)) cur.minStart = s
      if (e && (!cur.maxEnd || e > cur.maxEnd)) cur.maxEnd = e
      enrollmentDates.set(en.batch_id, cur)
    }

    const defaultTerm = terms[0]
    const fallbackStart = defaultTerm?.start_date?.slice(0, 10) || `${timelineYear}-01-01`
    const fallbackEnd = defaultTerm?.end_date?.slice(0, 10) || `${timelineYear}-12-31`

    return batches
      .map((b, idx) => {
        const override = planMap.get(b.id)
        const enRange = enrollmentDates.get(b.id)
        const startDate =
          override?.start_date ||
          b.start_date?.slice(0, 10) ||
          enRange?.minStart ||
          fallbackStart
        const endDate =
          override?.end_date ||
          b.end_date?.slice(0, 10) ||
          enRange?.maxEnd ||
          fallbackEnd

        const span = computeYearSpan(startDate, endDate, timelineYear)
        const status =
          endDate < todayStr ? 'Completed' : startDate > todayStr ? 'Upcoming' : 'Active'
        const genderTrack = inferGenderTrack(b, override?.gender_track)
        const programTrack = inferProgramTrack(b, override?.program_track)
        const courseKey = b.course_id ? String(b.course_id) : b.course_title || `batch-${b.id}`

        return {
          batch: b,
          startDate,
          endDate,
          examDate: override?.exam_date,
          genderTrack,
          programTrack,
          courseKey,
          milestoneNote: override?.milestone_note,
          status,
          span,
          colorClass: TRACK_COLORS[idx % TRACK_COLORS.length],
        }
      })
      .filter((row) => (timelineFilter === 'active' ? row.status !== 'Completed' : true))
      .filter((row) => (genderFilter === 'all' ? true : row.genderTrack === genderFilter))
      .filter((row) => (programFilter === 'all' ? true : row.programTrack === programFilter))
      .filter((row) => (courseFilter === 'all' ? true : row.courseKey === courseFilter))
  }, [
    batches,
    enrollments,
    terms,
    trackerPlans,
    timelineYear,
    todayStr,
    timelineFilter,
    genderFilter,
    programFilter,
    courseFilter,
  ])

  const dayClasses = classesByDay.get(selectedDate) ?? []
  const dayLeaves = leavesByDay.get(selectedDate) ?? []
  const dayTerms = terms.filter((t) => selectedDate >= t.start_date && selectedDate <= t.end_date)
  const showingToday = selectedDate === todayStr

  // Vertical "Today" marker position in the 12-month horizontal tracker
  const todayMarkerPct = useMemo(() => {
    const yearNum = Number(todayStr.slice(0, 4))
    if (yearNum !== timelineYear) return null
    const start = new Date(`${timelineYear}-01-01T00:00:00Z`).getTime()
    const end = new Date(`${timelineYear}-12-31T23:59:59Z`).getTime()
    const cur = new Date(`${todayStr}T12:00:00Z`).getTime()
    return clamp(((cur - start) / Math.max(1, end - start)) * 100, 0, 100)
  }, [todayStr, timelineYear])

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6 pb-8 sm:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-700" /> Academic Calendar (Asia/Dhaka)
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Saturday–Friday monthly class view, daily live schedule, and full-year course timeline tracker
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <Button
              size="sm"
              variant={panel === 'schedule_class' ? 'primary' : 'outline'}
              onClick={() => setPanel(panel === 'schedule_class' ? 'idle' : 'schedule_class')}
            >
              <Plus className="w-4 h-4" /> Schedule Class ({selectedDate})
            </Button>
          )}
          {isAdmin && (
            <Button
              size="sm"
              variant={panel === 'add_term' ? 'primary' : 'outline'}
              onClick={() => setPanel(panel === 'add_term' ? 'idle' : 'add_term')}
            >
              <Bookmark className="w-4 h-4" /> Add Term / Session
            </Button>
          )}
        </div>
      </div>

      {/* Inline forms */}
      {panel === 'schedule_class' && canManage && (
        <Card data-panel="schedule_class">
          <CardHeader>
            <CardTitle>Schedule Live Online Class on {selectedDate}</CardTitle>
            <button type="button" onClick={() => setPanel('idle')} className="text-muted"><X className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={scheduleClass} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-heading block mb-1">Batch</label>
                <select
                  required
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full"
                >
                  <option value="">— Select batch —</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.label} {b.course_title ? `— ${b.course_title}` : ''}</option>
                  ))}
                </select>
              </div>
              <Input label="Start (BD)" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input label="End (BD)" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              <Button type="submit" loading={saving}>Schedule</Button>
              <div className="md:col-span-5">
                <Input label="Meeting URL (https://)" type="url" placeholder="https://zoom.us/j/..." value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} />
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {panel === 'add_term' && isAdmin && (
        <Card data-panel="add_term">
          <CardHeader>
            <CardTitle>Add Academic Term / Session</CardTitle>
            <button type="button" onClick={() => setPanel('idle')} className="text-muted"><X className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTerm} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <Input label="Term Name" required placeholder="Winter Term 2026" value={termLabel} onChange={(e) => setTermLabel(e.target.value)} />
              <Input label="Start Date" type="date" required value={termStart} onChange={(e) => setTermStart(e.target.value)} />
              <Input label="End Date" type="date" required value={termEnd} onChange={(e) => setTermEnd(e.target.value)} />
              <Button type="submit" loading={saving}>Save Term</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Main Calendar + Day Agenda (Equal Height Aligned) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left: Saturday-First Month Grid */}
        <Card className="xl:col-span-8 h-full flex flex-col">
          <CardHeader className="border-b border-border pb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-1.5 rounded-lg border border-border hover:bg-primary-50"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold text-heading min-w-40 text-center">{monthLabel}</h3>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-1.5 rounded-lg border border-border hover:bg-primary-50"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <Button size="sm" variant="outline" onClick={jumpToday}>Today</Button>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-700" /> Scheduled</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Live / Held</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Leave</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-300 border border-red-400" /> Friday</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex-1 flex flex-col justify-between overflow-x-auto">
            {loadingClasses ? (
              <Skeleton className="h-96" />
            ) : (
              <div className="min-w-[540px]">
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold uppercase pb-2">
                  {WEEKDAYS.map((w) => {
                    const isFridayHeader = w === 'Fri'
                    return (
                      <div
                        key={w}
                        className={`py-1.5 rounded-lg ${
                          isFridayHeader
                            ? 'bg-red-50 text-red-700 border border-red-200/80'
                            : 'text-muted'
                        }`}
                      >
                        {w}
                      </div>
                    )
                  })}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: firstWeekday }).map((_, i) => {
                    const isFriCol = i % 7 === 6
                    return (
                      <div
                        key={`empty-pre-${i}`}
                        className={`min-h-24 rounded-xl border border-transparent ${
                          isFriCol ? 'bg-red-50/40' : 'bg-bg/40'
                        }`}
                      />
                    )
                  })}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1
                    const dateStr = `${monthKey}-${pad2(dayNum)}`
                    const dayList = classesByDay.get(dateStr) ?? []
                    const leaveList = leavesByDay.get(dateStr) ?? []
                    const isToday = dateStr === todayStr
                    const isSelected = dateStr === selectedDate
                    const isFriday = new Date(cursorYear, cursorMonth, dayNum).getDay() === 5

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDate(dateStr)}
                        className={`min-h-24 p-2 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? isFriday
                              ? 'border-red-500 bg-red-50/90 ring-2 ring-red-200'
                              : 'border-primary-700 bg-primary-50/70 ring-2 ring-primary-200'
                            : isToday
                              ? 'border-teal-500 bg-teal-50/40'
                              : isFriday
                                ? 'border-red-200/80 bg-red-50/60 hover:border-red-300'
                                : 'border-border bg-surface hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-bold ${
                            isToday
                              ? 'bg-primary-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs'
                              : isFriday
                                ? 'text-red-700'
                                : 'text-heading'
                          }`}>
                            {dayNum}
                          </span>
                          <div className="flex items-center gap-1">
                            {isFriday && (
                              <span className="text-[10px] font-semibold text-red-600/80">Fri</span>
                            )}
                            {leaveList.length > 0 && (
                              <span className="w-2 h-2 rounded-full bg-amber-500" title={`${leaveList.length} leave(s)`} />
                            )}
                          </div>
                        </div>
                        <div className="space-y-0.5 w-full overflow-hidden">
                          {dayList.slice(0, 2).map((c) => (
                            <div
                              key={c.id}
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate ${
                                c.status === 'in_progress'
                                  ? 'bg-teal-100 text-teal-800'
                                  : c.status === 'ended'
                                    ? 'bg-green-100 text-green-800'
                                    : c.status === 'cancelled'
                                      ? 'bg-red-100 text-red-700 line-through'
                                      : 'bg-primary-100 text-primary-900'
                              }`}
                            >
                              {formatDhakaTime(c.scheduled_start)} {c.course_title}
                            </div>
                          ))}
                          {dayList.length > 2 && (
                            <p className="text-[10px] font-bold text-primary-700 pl-1">
                              +{dayList.length - 2} more
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                  {Array.from({ length: trailingEmptySlots }).map((_, i) => {
                    const colIdx = (totalSlots + i) % 7
                    return (
                      <div
                        key={`empty-post-${i}`}
                        className={`min-h-24 rounded-xl border border-transparent ${
                          colIdx === 6 ? 'bg-red-50/40' : 'bg-bg/40'
                        }`}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Aligned Day & Today's Classes Schedule Panel */}
        <div className="xl:col-span-4 h-full flex flex-col gap-4">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="border-b border-border pb-3">
              <div>
                <p className="text-xs font-bold text-primary-700 uppercase flex items-center gap-1.5">
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  {showingToday ? "Today's Class Schedule" : 'Selected Day Schedule'}
                </p>
                <CardTitle className="text-base mt-0.5">
                  {selectedDate}
                  {showingToday ? ' · Today' : ''}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {!showingToday && (
                  <Button size="sm" variant="ghost" onClick={jumpToday}>
                    Today
                  </Button>
                )}
                <Badge variant="primary">{dayClasses.length} classes</Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {dayTerms.map((t) => (
                <div key={t.id} className="p-2.5 rounded-lg bg-primary-50 border border-primary-100 text-xs">
                  <span className="font-bold text-primary-900">Term: {t.label}</span>
                  <span className="text-primary-700 ml-2">({t.start_date} → {t.end_date})</span>
                </div>
              ))}

              {dayClasses.length === 0 ? (
                <div className="text-center py-6 px-3 rounded-xl border border-dashed border-border bg-bg/40 text-muted text-xs space-y-2">
                  <Video className="w-7 h-7 mx-auto opacity-30" />
                  <p className="font-semibold text-heading">No live classes scheduled on {selectedDate}.</p>
                  {canManage && (
                    <Button size="sm" variant="outline" onClick={() => setPanel('schedule_class')}>
                      <Plus className="w-3.5 h-3.5" /> Schedule Class Here
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dayClasses.map((cls) => {
                    const cap = deriveClassCapabilities(cls)
                    return (
                      <div key={cls.id} data-state={cap.status} className="p-3 rounded-xl border border-border bg-bg/50 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-heading truncate">{cls.course_title}</p>
                            <p className="text-xs text-muted">{cls.batch_name} · {cls.delivery_mode}</p>
                            <p className="text-xs text-primary-700 font-semibold mt-0.5">
                              {formatDhakaTime(cls.scheduled_start)}
                              {cls.scheduled_end ? ` – ${formatDhakaTime(cls.scheduled_end)}` : ''}
                            </p>
                          </div>
                          <Badge variant={cap.badgeVariant}>{cap.label}</Badge>
                        </div>
                        <div className="flex gap-2 flex-wrap pt-1">
                          {cls.meeting_url && (
                            <a
                              href={cls.meeting_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-100 text-teal-800 text-xs font-semibold"
                            >
                              <ExternalLink className="w-3 h-3" /> Join
                            </a>
                          )}
                          <Button size="sm" variant="outline" onClick={() => navigateTo('#/classes')}>
                            Operations
                          </Button>
                          {cap.canOpenReport && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigateTo(`#/attendance?classId=${cls.id}`)}
                            >
                              Attendance
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Always keep Today's Classes quick view accessible below if user clicked another date */}
              {!showingToday && (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-heading">Today&apos;s Classes ({todayStr})</p>
                    <Badge variant="approved">{todaysClassesList.length} today</Badge>
                  </div>
                  {todaysClassesList.length === 0 ? (
                    <p className="text-xs text-muted">No classes scheduled for today ({todayStr}).</p>
                  ) : (
                    todaysClassesList.map((cls) => {
                      const cap = deriveClassCapabilities(cls)
                      return (
                        <div key={`today-${cls.id}`} className="p-2.5 rounded-lg border border-teal-200/70 bg-teal-50/40 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-heading truncate">{cls.course_title}</p>
                            <p className="text-muted truncate">
                              {cls.batch_name} · {formatDhakaTime(cls.scheduled_start)}
                            </p>
                          </div>
                          <Badge variant={cap.badgeVariant}>{cap.label}</Badge>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {dayLeaves.length > 0 && (
                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs font-bold text-heading flex items-center gap-1.5">
                    <CalendarOff className="w-3.5 h-3.5 text-amber-600" /> Active Leaves ({dayLeaves.length})
                  </p>
                  {dayLeaves.map((l) => (
                    <div key={l.id} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                      <span className="font-semibold text-amber-900">{l.student_name || `Enrollment #${l.enrollment_id}`}</span>
                      <span className="text-amber-700 ml-1">({l.status}) — {l.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {terms.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Academic Terms</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {terms.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-bg">
                    <span className="font-semibold text-heading">{t.label}</span>
                    <span className="text-muted">{t.start_date} → {t.end_date}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Full-Width Section: Year-Wise Course, Batch & Academic Term Project Tracker Calendar */}
      <Card className="w-full">
        <CardHeader className="border-b border-border pb-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <GanttChartSquare className="w-5 h-5 text-primary-700" />
                Year-Wise Course &amp; Batch Project Tracker ({timelineYear})
              </CardTitle>
              <p className="text-xs text-muted mt-0.5">
                Full roadmap showing Academic Terms &amp; every Course/Batch from Start Date to End Date with Exam milestone
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 rounded-lg border border-border bg-bg p-0.5">
                <button
                  type="button"
                  onClick={() => setTimelineFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                    timelineFilter === 'all' ? 'bg-primary-700 text-white' : 'text-body'
                  }`}
                >
                  All ({batches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineFilter('active')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                    timelineFilter === 'active' ? 'bg-primary-700 text-white' : 'text-body'
                  }`}
                >
                  Active &amp; Upcoming
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTimelineYear((y) => y - 1)}
                  className="p-1.5 rounded-lg border border-border hover:bg-primary-50"
                  title="Previous Year"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-heading min-w-14 text-center">{timelineYear}</span>
                <button
                  type="button"
                  onClick={() => setTimelineYear((y) => y + 1)}
                  className="p-1.5 rounded-lg border border-border hover:bg-primary-50"
                  title="Next Year"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Gender, Program (Hifz/Najera), and Single Course Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-bg p-0.5">
              {(['all', 'male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderFilter(g)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${
                    genderFilter === g ? 'bg-primary-700 text-white' : 'text-body hover:text-heading'
                  }`}
                >
                  {g === 'all' ? 'All Wings' : g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-bg p-0.5">
              {(['all', 'hifz', 'najera'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProgramFilter(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${
                    programFilter === p ? 'bg-primary-700 text-white' : 'text-body hover:text-heading'
                  }`}
                >
                  {p === 'all' ? 'All Programs' : p}
                </button>
              ))}
            </div>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Filter by single course"
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-bg text-heading max-w-full sm:max-w-[260px]"
            >
              <option value="all">All Courses ({courseOptions.length})</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Mobile Vertical Timeline View (zero horizontal scrolling) */}
          <div className="md:hidden p-4 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted bg-bg/70 border border-border rounded-xl px-3 py-2">
              <span className="font-semibold text-heading">{timelineYear} Vertical Roadmap</span>
              {todayMarkerPct !== null && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Today: {todayStr}
                </span>
              )}
            </div>

            {terms.length > 0 && (
              <div className="space-y-2">
                {terms.map((t) => (
                  <div
                    key={`m-term-${t.id}`}
                    className="rounded-xl border border-primary-200 bg-primary-50/40 p-3 space-y-2 border-l-4 border-l-primary-700"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-primary-900 truncate">Academic Term · {t.label}</p>
                      <Badge variant="primary">Term</Badge>
                    </div>
                    <SlidableMultiYearBar
                      startDate={t.start_date}
                      endDate={t.end_date}
                      todayStr={todayStr}
                      barColorClass="bg-primary-700"
                      trackBgClass="bg-primary-100"
                    />
                  </div>
                ))}
              </div>
            )}

            {batchTimelineRows.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted">
                No batches match the selected filters. Adjust Wing / Program / Course filters or add batches in Settings.
              </div>
            ) : (
              <div className="relative pl-4 border-l-2 border-primary-200 space-y-4">
                {batchTimelineRows.map((row) => {
                  const isEditing = editingBatchId === row.batch.id
                  const openEdit = () => {
                    if (isEditing) {
                      setEditingBatchId(null)
                    } else {
                      setEditingBatchId(row.batch.id)
                      setEditStart(row.startDate)
                      setEditEnd(row.endDate)
                      setEditExamDate(row.examDate || '')
                      setEditGenderTrack(row.genderTrack)
                      setEditProgramTrack(row.programTrack)
                      setEditNote(row.milestoneNote || '')
                    }
                  }
                  return (
                    <div
                      key={`m-batch-${row.batch.id}`}
                      className="relative rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3.5"
                    >
                      <span
                        className={`absolute -left-[21px] top-5 w-3 h-3 rounded-full border-2 border-surface ${row.colorClass}`}
                      />
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => navigateTo('#/settings')}
                          className="min-w-0 text-left"
                        >
                          <p className="text-[13px] font-bold text-heading leading-snug">
                            {row.batch.course_title || 'Course'} · {row.batch.label}
                          </p>
                          {row.batch.teacher_name && (
                            <p className="text-[11px] text-muted truncate mt-1">
                              Ustad: {row.batch.teacher_name}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {row.programTrack !== 'other' && (
                              <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-semibold capitalize">
                                {row.programTrack}
                              </span>
                            )}
                            {row.genderTrack !== 'all' && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-semibold capitalize">
                                {row.genderTrack}
                              </span>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant={
                              row.status === 'Active'
                                ? 'approved'
                                : row.status === 'Upcoming'
                                  ? 'pending'
                                  : 'ended'
                            }
                          >
                            {row.status}
                          </Badge>
                          {canManage && (
                            <button
                              type="button"
                              onClick={openEdit}
                              className="p-1.5 rounded-lg border border-border text-muted hover:text-primary-700"
                              title="Edit start / end / exam dates or track"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <SlidableMultiYearBar
                        startDate={row.startDate}
                        endDate={row.endDate}
                        examDate={row.examDate}
                        todayStr={todayStr}
                        barColorClass={row.colorClass}
                        trackBgClass="bg-slate-100"
                      />

                      {row.milestoneNote && (
                        <p className="text-[11px] text-teal-700 font-medium bg-teal-50/70 border border-teal-100 rounded-lg px-2.5 py-1.5">
                          Milestone: {row.milestoneNote}
                        </p>
                      )}

                      {isEditing && canManage && (
                        <div className="pt-3 border-t border-border space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <Input label="Start Date" type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                            <Input label="End Date" type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                          </div>
                          <Input label="Exam Date (Optional)" type="date" value={editExamDate} onChange={(e) => setEditExamDate(e.target.value)} />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-heading mb-1">Gender Wing</label>
                              <select
                                value={editGenderTrack}
                                onChange={(e) => setEditGenderTrack(e.target.value as 'all' | 'male' | 'female')}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-bg"
                              >
                                <option value="all">All / Combined</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-heading mb-1">Program Track</label>
                              <select
                                value={editProgramTrack}
                                onChange={(e) => setEditProgramTrack(e.target.value as 'other' | 'hifz' | 'najera')}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-bg"
                              >
                                <option value="other">Auto / General</option>
                                <option value="hifz">Hifz</option>
                                <option value="najera">Najera</option>
                              </select>
                            </div>
                          </div>
                          <Input label="Milestone / Phase Note" placeholder="e.g. Juz 1-10 Revision & Midterm" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveBatchTrackerDates(row.batch.id)}>
                              <Check className="w-3.5 h-3.5" /> Save Dates
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingBatchId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Desktop Horizontal 12-Month Gantt View */}
          <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[920px] w-full">
            {/* Month Header Rail */}
            <div className="grid grid-cols-12 border-b border-border bg-bg/70 text-xs font-bold text-heading">
              <div className="col-span-4 px-4 py-3 border-r border-border flex items-center justify-between">
                <span>Course / Batch &amp; Duration</span>
                <span className="text-[11px] font-medium text-muted">Start → End</span>
              </div>
              <div className="col-span-8 grid grid-cols-12 relative">
                {MONTHS_SHORT.map((m, idx) => {
                  const isCurrentMonth =
                    timelineYear === Number(todayStr.slice(0, 4)) &&
                    idx + 1 === Number(todayStr.slice(5, 7))
                  return (
                    <div
                      key={m}
                      className={`py-3 text-center border-r last:border-r-0 border-border/60 ${
                        isCurrentMonth ? 'bg-teal-50 text-teal-800 font-bold' : 'text-muted'
                      }`}
                    >
                      {m}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Academic Terms Rows */}
            {terms.map((t) => {
              const span = computeYearSpan(t.start_date, t.end_date, timelineYear)
              return (
                <div key={`term-${t.id}`} className="grid grid-cols-12 border-b border-border/70 bg-primary-50/30 hover:bg-primary-50/50 transition-colors">
                  <div className="col-span-4 px-4 py-2.5 border-r border-border flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary-900 truncate">Academic Term · {t.label}</p>
                      <p className="text-[11px] text-primary-700 font-mono">{t.start_date} → {t.end_date}</p>
                    </div>
                    <Badge variant="primary">Term</Badge>
                  </div>
                  <div className="col-span-8 grid grid-cols-12 relative items-center min-h-[46px]">
                    {MONTHS_SHORT.map((m) => (
                      <div key={m} className="h-full border-r last:border-r-0 border-border/40" />
                    ))}
                    {todayMarkerPct !== null && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-400/70 z-10 pointer-events-none"
                        style={{ left: `${todayMarkerPct}%` }}
                        title={`Today: ${todayStr}`}
                      />
                    )}
                    {span.inYear && (
                      <div
                        className="absolute h-6 rounded-full bg-primary-700/90 text-white text-[10px] font-bold px-2.5 flex items-center justify-between shadow-sm truncate z-20"
                        style={{ left: `${span.leftPct}%`, width: `${span.widthPct}%` }}
                        title={`${t.label}: ${t.start_date} → ${t.end_date}`}
                      >
                        <span className="truncate">{t.label}</span>
                        <span className="ml-1 opacity-85 hidden sm:inline">{t.start_date.slice(5)}..{t.end_date.slice(5)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Course & Batch Gantt Rows */}
            {batchTimelineRows.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                No batches found for {timelineYear}. Switch year or add batches in Academic Setup.
              </div>
            ) : (
              batchTimelineRows.map((row) => {
                const isEditing = editingBatchId === row.batch.id
                return (
                  <div key={`batch-track-${row.batch.id}`} className="border-b last:border-b-0 border-border/70">
                    <div className="grid grid-cols-12 hover:bg-bg/50 transition-colors">
                      <div className="col-span-4 px-4 py-3 border-r border-border flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-heading truncate">
                            {row.batch.course_title || 'Course'} · {row.batch.label}
                          </p>
                          <p className="text-[11px] text-muted truncate">
                            {row.batch.teacher_name ? `Ustad: ${row.batch.teacher_name} · ` : ''}
                            <span className="font-mono">{row.startDate} → {row.endDate}</span>
                          </p>
                          {row.milestoneNote && (
                            <p className="text-[11px] text-teal-700 font-medium truncate mt-0.5">
                              Milestone: {row.milestoneNote}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant={
                              row.status === 'Active'
                                ? 'approved'
                                : row.status === 'Upcoming'
                                  ? 'pending'
                                  : 'ended'
                            }
                          >
                            {row.status}
                          </Badge>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isEditing) {
                                  setEditingBatchId(null)
                                } else {
                                  setEditingBatchId(row.batch.id)
                                  setEditStart(row.startDate)
                                  setEditEnd(row.endDate)
                                  setEditExamDate(row.examDate || '')
                                  setEditGenderTrack(row.genderTrack)
                                  setEditProgramTrack(row.programTrack)
                                  setEditNote(row.milestoneNote || '')
                                }
                              }}
                              className="p-1 rounded-md border border-border text-muted hover:text-primary-700 hover:border-primary-300"
                              title="Edit start / end dates or milestone"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="col-span-8 grid grid-cols-12 relative items-center min-h-[58px]">
                        {MONTHS_SHORT.map((m) => (
                          <div key={m} className="h-full border-r last:border-r-0 border-border/40" />
                        ))}
                        {todayMarkerPct !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-400/70 z-10 pointer-events-none"
                            style={{ left: `${todayMarkerPct}%` }}
                            title={`Today: ${todayStr}`}
                          />
                        )}
                        {row.span.inYear ? (
                          <div
                            className={`absolute h-7 rounded-lg ${row.colorClass} text-white text-[11px] font-semibold px-2.5 flex items-center justify-between shadow-sm z-20 cursor-pointer hover:opacity-95`}
                            style={{ left: `${row.span.leftPct}%`, width: `${row.span.widthPct}%` }}
                            title={`${row.batch.course_title} · ${row.batch.label}: ${row.startDate} → ${row.endDate}`}
                            onClick={() => navigateTo('#/settings')}
                          >
                            <span className="truncate">{row.batch.label}</span>
                            <span className="ml-2 text-[10px] opacity-90 shrink-0 hidden md:inline">
                              {computeCompletionPct(row.startDate, row.endDate, todayStr)}% · {row.startDate.slice(5)} → {row.endDate.slice(5)}
                            </span>
                          </div>
                        ) : (
                          <span className="col-span-12 px-4 text-[11px] text-muted italic">
                            Runs {row.startDate} → {row.endDate} (outside {timelineYear})
                          </span>
                        )}
                        {row.examDate && computeYearSpan(row.examDate, row.examDate, timelineYear).inYear && (
                          <div
                            className="absolute top-1 bottom-1 w-0.5 bg-amber-500 z-30 pointer-events-none"
                            style={{ left: `${computeYearSpan(row.examDate, row.examDate, timelineYear).leftPct}%` }}
                            title={`Exam Date: ${row.examDate}`}
                          >
                            <span className="absolute -top-0.5 -left-1 w-2.5 h-2.5 rotate-45 bg-amber-500 border border-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditing && canManage && (
                      <div className="px-4 py-3 bg-primary-50/50 border-t border-border flex items-end gap-3 flex-wrap">
                        <Input label="Start Date" type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                        <Input label="End Date" type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                        <Input label="Exam Date" type="date" value={editExamDate} onChange={(e) => setEditExamDate(e.target.value)} />
                        <div>
                          <label className="block text-xs font-semibold text-heading mb-1">Gender Wing</label>
                          <select
                            value={editGenderTrack}
                            onChange={(e) => setEditGenderTrack(e.target.value as 'all' | 'male' | 'female')}
                            className="px-2.5 py-2 text-xs rounded-lg border border-border bg-bg"
                          >
                            <option value="all">All / Combined</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-heading mb-1">Program</label>
                          <select
                            value={editProgramTrack}
                            onChange={(e) => setEditProgramTrack(e.target.value as 'other' | 'hifz' | 'najera')}
                            className="px-2.5 py-2 text-xs rounded-lg border border-border bg-bg"
                          >
                            <option value="other">Auto / General</option>
                            <option value="hifz">Hifz</option>
                            <option value="najera">Najera</option>
                          </select>
                        </div>
                        <div className="flex-1 min-w-48">
                          <Input label="Milestone / Phase Note" placeholder="e.g. Juz 1-10 Revision & Midterm" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveBatchTrackerDates(row.batch.id)}>
                            <Check className="w-3.5 h-3.5" /> Save Dates
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingBatchId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
