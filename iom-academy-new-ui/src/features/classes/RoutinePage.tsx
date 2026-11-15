import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { getDhakaDateString } from '@/lib/utils'
import {
  Calendar, Plus, Play, Square, Video, X, Info, Clock, ArrowRight,
} from 'lucide-react'

interface RoutineRow {
  id: number
  batch_id: number
  batch_name?: string
  course_title?: string
  weekday: number
  start_time: string
  end_time: string
  from_date: string
  until_date: string
  meeting_url?: string | null
  active: number | boolean
}

interface BatchOption {
  id: number
  label: string
  course_title?: string
}

// Saturday-first UI display matching Academic Calendar, mapped to JS/backend getUTCDay() weekday (0=Sun..6=Sat)
const WEEKDAY_ITEMS = [
  { label: 'Sat', weekday: 6 },
  { label: 'Sun', weekday: 0 },
  { label: 'Mon', weekday: 1 },
  { label: 'Tue', weekday: 2 },
  { label: 'Wed', weekday: 3 },
  { label: 'Thu', weekday: 4 },
  { label: 'Fri', weekday: 5 },
] as const

const WEEKDAY_NAME_BY_NUM: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

function addDaysYmd(ymd: string, days: number): string {
  const dt = new Date(`${ymd}T00:00:00Z`)
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

export default function RoutinePage({ role }: { role: string }) {
  const todayStr = getDhakaDateString()
  const canManage = ['central_admin', 'branch_admin', 'zimmadar'].includes(role)
  const [showNew, setShowNew] = useState(false)
  const [batchId, setBatchId] = useState('')
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([6, 1, 3])
  const [startTime, setStartTime] = useState('20:00')
  const [endTime, setEndTime] = useState('20:45')
  const [fromDate, setFromDate] = useState(todayStr)
  const [untilDate, setUntilDate] = useState(() => addDaysYmd(todayStr, 90))
  const [meetingUrl, setMeetingUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyRoutineId, setBusyRoutineId] = useState<number | null>(null)
  const qc = useQueryClient()
  const toast = useToast()

  const { data: routines = [], isLoading } = useQuery<RoutineRow[]>({
    queryKey: ['routines'],
    queryFn: () => api.get<RoutineRow[]>('/routines'),
  })

  const { data: batches = [] } = useQuery<BatchOption[]>({
    queryKey: ['batches-options'],
    queryFn: () => api.get<BatchOption[]>('/batches'),
    enabled: canManage && showNew,
  })

  const routinesByWeekday = useMemo(() => {
    const map = new Map<number, RoutineRow[]>()
    for (const item of WEEKDAY_ITEMS) map.set(item.weekday, [])
    for (const rt of routines) {
      if (!rt.active) continue
      const list = map.get(rt.weekday) ?? []
      list.push(rt)
      map.set(rt.weekday, list)
    }
    return map
  }, [routines])

  function toggleWeekday(w: number) {
    setSelectedWeekdays((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]))
  }

  async function createRoutine(e: React.FormEvent) {
    e.preventDefault()
    if (!batchId || selectedWeekdays.length === 0) {
      toast.warning('Select a batch and at least one weekday')
      return
    }
    if (endTime <= startTime) {
      toast.warning('End time must be after start time')
      return
    }
    if (untilDate < fromDate) {
      toast.warning('End date cannot be earlier than start date')
      return
    }
    setSaving(true)
    try {
      let created = 0
      for (const wd of selectedWeekdays) {
        await api.post('/routines', {
          batch_id: Number(batchId),
          weekday: wd,
          start_time: startTime,
          end_time: endTime,
          from_date: fromDate,
          until_date: untilDate,
          meeting_url: meetingUrl.trim() || null,
        })
        created += 1
      }
      setShowNew(false)
      setMeetingUrl('')
      toast.success(`Saved ${created} weekly routine slot(s)`)
      qc.invalidateQueries({ queryKey: ['routines'] })
    } catch (err) {
      toast.error(err, 'Failed to create routine')
    } finally {
      setSaving(false)
    }
  }

  async function generateSessions(rt: RoutineRow) {
    setBusyRoutineId(rt.id)
    try {
      // Backend /routines/:id/generate enforces [from_date, until_date] within routine dates and <= 31 days
      const windowStart = todayStr > rt.from_date ? todayStr : rt.from_date
      const maxWindowEnd = addDaysYmd(windowStart, 14)
      const windowEnd = maxWindowEnd <= rt.until_date ? maxWindowEnd : rt.until_date
      if (windowEnd < windowStart) {
        toast.warning('This routine date range has already ended')
        return
      }
      const res = await api.post<{ created: number; existing: number }>(`/routines/${rt.id}/generate`, {
        from_date: windowStart,
        until_date: windowEnd,
      })
      toast.success(`Generated ${res.created} session(s) (${res.existing} already existed)`)
      qc.invalidateQueries({ queryKey: ['classes'] })
      qc.invalidateQueries({ queryKey: ['calendar-classes'] })
    } catch (err) {
      toast.error(err, 'Generation failed')
    } finally {
      setBusyRoutineId(null)
    }
  }

  async function stopRoutine(id: number) {
    setBusyRoutineId(id)
    try {
      await api.post(`/routines/${id}/stop`, {})
      toast.info('Routine stopped — past & held classes remain preserved')
      qc.invalidateQueries({ queryKey: ['routines'] })
    } catch (err) {
      toast.error(err, 'Failed to stop routine')
    } finally {
      setBusyRoutineId(null)
    }
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Online Timetable &amp; Weekly Routine</h2>
          <p className="text-xs text-muted mt-0.5">
            Master weekly slot templates per batch (Asia/Dhaka) with 1-click session generation into Classes &amp; Calendar
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setShowNew(!showNew)}>
            <Plus className="w-4 h-4" /> New Weekly Slot
          </Button>
        )}
      </div>

      {/* How This Page Works Explainer Strip */}
      <Card className="bg-primary-50/40 border-primary-200/70">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs flex-1">
              <div className="p-2.5 rounded-lg bg-surface border border-border/80">
                <p className="font-bold text-heading">1. Set Recurring Weekly Slot</p>
                <p className="text-muted mt-0.5">Pick Batch, Day(s) Sat–Fri, BD Start/End time, Term Dates &amp; Zoom/Meet link.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border/80">
                <p className="font-bold text-heading flex items-center gap-1">
                  2. Generate 2 Weeks of Classes <ArrowRight className="w-3 h-3 text-primary-700" />
                </p>
                <p className="text-muted mt-0.5">Clicking <strong>Generate 2w</strong> populates live class sessions in Classes &amp; Calendar.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border/80">
                <p className="font-bold text-heading">3. Stop / Update Anytime</p>
                <p className="text-muted mt-0.5">Stopping a template halts future generation without deleting past attendance records.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Form */}
      {showNew && canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Create Online Class Weekly Slot(s)</CardTitle>
            <button type="button" onClick={() => setShowNew(false)} className="text-muted hover:text-heading">
              <X className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={createRoutine} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-heading block mb-1">Batch</label>
                  <select required value={batchId} onChange={(e) => setBatchId(e.target.value)} className="w-full">
                    <option value="">— Select batch —</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.label} {b.course_title ? `— ${b.course_title}` : ''}</option>
                    ))}
                  </select>
                </div>
                <Input label="Start Time (BD)" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                <Input label="End Time (BD)" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Effective From" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
                <Input label="Effective Until" type="date" value={untilDate} onChange={(e) => setUntilDate(e.target.value)} required />
                <Input
                  label="Default Zoom / Meet URL (https://)"
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-heading mb-1.5">Class Days (Saturday – Friday)</p>
                <div className="flex gap-2 flex-wrap">
                  {WEEKDAY_ITEMS.map((d) => {
                    const active = selectedWeekdays.includes(d.weekday)
                    return (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => toggleWeekday(d.weekday)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                          active
                            ? 'bg-primary-700 text-white border-primary-700'
                            : d.weekday === 5
                              ? 'bg-red-50/70 text-red-700 border-red-200'
                              : 'bg-bg text-body border-border'
                        }`}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>Save Routine Slot(s)</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Visual Weekly Overview Grid (Sat - Fri) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {WEEKDAY_ITEMS.map((item) => {
          const slots = routinesByWeekday.get(item.weekday) ?? []
          const isFri = item.weekday === 5
          return (
            <Card
              key={item.label}
              className={`h-full ${isFri ? 'border-red-200 bg-red-50/40' : ''}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className={`text-xs font-bold uppercase ${isFri ? 'text-red-700' : 'text-heading'}`}>
                  {item.label}
                </CardTitle>
                <Badge variant={isFri ? 'cancelled' : 'primary'}>{slots.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {slots.length === 0 ? (
                  <p className="text-[11px] text-muted italic">No slot</p>
                ) : (
                  slots.map((rt) => (
                    <div key={rt.id} className="p-2 rounded-lg bg-surface border border-border text-xs space-y-0.5">
                      <p className="font-bold text-heading truncate">{rt.batch_name || `Batch #${rt.batch_id}`}</p>
                      <p className="text-[11px] text-primary-700 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {rt.start_time} – {rt.end_time}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Routines Table (Desktop) + Cards (Mobile) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configured Routine Templates ({routines.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : routines.length === 0 ? (
            <div className="text-center py-14 text-muted">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-heading">No weekly routines configured yet</p>
              <p className="text-xs text-muted mt-1">Click &ldquo;New Weekly Slot&rdquo; above to define recurring online class timings.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Batch / Course</th>
                      <th>Weekday</th>
                      <th>BD Time</th>
                      <th>Active Window</th>
                      <th>Meeting Room</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routines.map((rt) => (
                      <tr key={rt.id}>
                        <td>
                          <p className="font-semibold text-heading">{rt.batch_name || `Batch #${rt.batch_id}`}</p>
                          {rt.course_title && <p className="text-xs text-muted">{rt.course_title}</p>}
                        </td>
                        <td>
                          <Badge variant={rt.weekday === 5 ? 'cancelled' : 'primary'}>
                            {WEEKDAY_NAME_BY_NUM[rt.weekday] ?? `Day ${rt.weekday}`}
                          </Badge>
                        </td>
                        <td className="text-xs font-semibold text-heading">
                          {rt.start_time} – {rt.end_time}
                        </td>
                        <td className="text-xs font-mono text-muted">
                          {rt.from_date} → {rt.until_date}
                        </td>
                        <td>
                          {rt.meeting_url ? (
                            <a
                              href={rt.meeting_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-teal-700 font-semibold hover:underline"
                            >
                              <Video className="w-3.5 h-3.5" /> Open Room
                            </a>
                          ) : (
                            <span className="text-xs text-muted">Assigned per session</span>
                          )}
                        </td>
                        <td>
                          <Badge variant={rt.active ? 'approved' : 'ended'}>
                            {rt.active ? 'active' : 'stopped'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            {canManage && Boolean(rt.active) ? (
                              <>
                                <Button size="sm" variant="outline" loading={busyRoutineId === rt.id} disabled={busyRoutineId !== null} onClick={() => generateSessions(rt)}>
                                  <Play className="w-3.5 h-3.5" /> Generate 2w
                                </Button>
                                <Button size="sm" variant="danger" loading={busyRoutineId === rt.id} disabled={busyRoutineId !== null} onClick={() => stopRoutine(rt.id)}>
                                  <Square className="w-3.5 h-3.5" /> Stop
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden p-4 space-y-3">
                {routines.map((rt) => (
                  <div key={rt.id} className="p-3.5 rounded-xl border border-border bg-bg/40 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-heading">{rt.batch_name || `Batch #${rt.batch_id}`}</p>
                        <p className="text-xs text-muted">
                          {WEEKDAY_NAME_BY_NUM[rt.weekday] ?? `Day ${rt.weekday}`} · {rt.start_time} – {rt.end_time} BD
                        </p>
                      </div>
                      <Badge variant={rt.active ? 'approved' : 'ended'}>{rt.active ? 'active' : 'stopped'}</Badge>
                    </div>
                    <p className="text-xs text-muted font-mono">{rt.from_date} → {rt.until_date}</p>
                    {canManage && Boolean(rt.active) && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" className="flex-1" loading={busyRoutineId === rt.id} onClick={() => generateSessions(rt)}>
                          <Play className="w-3.5 h-3.5" /> Generate 2w
                        </Button>
                        <Button size="sm" variant="danger" loading={busyRoutineId === rt.id} onClick={() => stopRoutine(rt.id)}>
                          <Square className="w-3.5 h-3.5" /> Stop
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
