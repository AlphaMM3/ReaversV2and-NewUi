import { useQuery } from '@tanstack/react-query'
import { api, type ClassSession } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { deriveClassCapabilities } from '@/lib/stateMachines'
import { navigateTo } from '@/lib/router'
import { formatDhakaTime, formatDhakaDate, getDhakaDateString } from '@/lib/utils'
import {
  Video, ExternalLink, Play, Square, CheckCircle, FileText,
  ClipboardCheck, Plus, BookOpen,
} from 'lucide-react'
import { useState } from 'react'
type ClassFilter = 'all' | 'scheduled' | 'in_progress' | 'ended' | 'cancelled'

export default function ClassesPage({ role }: { role: string }) {
  const [filter, setFilter] = useState<ClassFilter>('all')
  const [date, setDate] = useState(getDhakaDateString)
  const [batch, setBatch] = useState('')
  const [search, setSearch] = useState('')
  const today = getDhakaDateString()
  const canSchedule = ['central_admin', 'branch_admin', 'zimmadar'].includes(role)
  const { data: classes = [], isLoading, isError, refetch } = useQuery<ClassSession[]>({
    queryKey: ['classes', 'session-workspace', date],
    queryFn: () => api.get<ClassSession[]>(date
      ? `/classes?from=${date}&until=${date}T23:59:59&limit=100`
      : '/classes?limit=100'),
  })
  const batches = Array.from(new Map(classes.map((session) => [session.batch_id, session.batch_name])))
  const scoped = classes.filter((session) =>
    (!batch || String(session.batch_id) === batch) &&
    `${session.course_title} ${session.batch_name}`.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const filtered = scoped.filter((session) => filter === 'all' || session.status === filter)
  const reset = () => { setBatch(''); setSearch(''); setFilter('all') }
  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Online Class Operations (অনলাইন ক্লাস অপারেশন ও শিডিউল)</h2>
          <p className="text-xs text-muted mt-0.5">{formatDhakaDate(new Date())} · Asia/Dhaka · আইওএম ইতকান একাডেমি</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={date === today ? 'primary' : 'outline'} onClick={() => { setDate(today); reset() }}>Today</Button>
          <Button size="sm" variant={!date ? 'primary' : 'outline'} onClick={() => { setDate(''); reset() }}>Recent</Button>
          {canSchedule && <Button size="sm" onClick={() => navigateTo(`#/calendar?date=${date || today}&schedule=1`)}><Plus className="w-4 h-4" /> Schedule class</Button>}
          <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Class date<input className="block w-full" type="date" value={date} onChange={(event) => { setDate(event.target.value); reset() }} /></label>
        <label className="text-sm">Batch<select className="block w-full" value={batch} onChange={(event) => setBatch(event.target.value)}>
          <option value="">All batches</option>
          {batches.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select></label>
        <label className="text-sm">Search<input className="block w-full" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Course or batch" /></label>
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['all', 'scheduled', 'in_progress', 'ended', 'cancelled'] as ClassFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-primary-700 text-white'
                : 'bg-surface border border-border text-body hover:bg-primary-50'
            }`}
          >
            {f === 'all' ? 'All' : f === 'in_progress' ? 'Live' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1.5 text-[10px] opacity-80">
                {scoped.filter((c) => c.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {!isLoading && !isError && <div className="flex items-center gap-3 text-sm text-muted">
        <span>Showing {filtered.length} of {classes.length} loaded classes</span>
        {(batch || search || filter !== 'all') && <Button size="sm" variant="outline" onClick={reset}>Clear filters</Button>}
      </div>}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : isError ? (<div role="alert">Could not load classes. <Button onClick={() => void refetch()}>Retry</Button></div>) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-heading">{batch || search || filter !== 'all' ? 'No classes match these filters' : date === today ? 'No classes scheduled today' : 'No classes scheduled for this view'}</p>
          <p className="text-xs mt-1"><Button size="sm" variant="outline" onClick={() => navigateTo(`#/calendar?date=${date || today}`)}>Open calendar</Button></p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cls) => (
            <LiveSessionCard key={cls.id} cls={cls} onAction={() => refetch()} />
          ))}
        </div>
      )}
    </div>
  )
}

function LiveSessionCard({ cls, onAction }: { cls: ClassSession; onAction: () => void }) {
  const [pendingAction, setPendingAction] = useState<'start' | 'end' | 'verify-held' | null>(null)
  const toast = useToast()

  async function doAction(action: 'start' | 'end' | 'verify-held') {
    setPendingAction(action)
    try {
      await api.post(`/classes/${cls.id}/${action}`, {})
      toast.success(
        action === 'start'
          ? `Class "${cls.course_title}" started`
          : action === 'end'
            ? `Class "${cls.course_title}" ended`
            : `Class "${cls.course_title}" held verified`,
      )
      onAction()
    } catch (err) {
      toast.error(err, 'Class action failed')
    } finally {
      setPendingAction(null)
    }
  }

  const cap = deriveClassCapabilities(cls)
  const busy = pendingAction !== null

  return (
    <div
      data-entity="class_session"
      data-state={cap.status}
      data-held-verified={String(cap.isHeldVerified)}
      data-next-action={cap.nextPrimaryAction}
      className="bg-surface rounded-xl border border-border p-4 flex flex-wrap items-start gap-4 shadow-sm hover:border-primary-200 transition-colors"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        cap.isLive ? 'bg-teal-100' : 'bg-primary-100'
      }`}>
        <Video className={`w-5 h-5 ${cap.isLive ? 'text-teal-700' : 'text-primary-700'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-heading">{cls.course_title}</span>
          <Badge variant={cap.badgeVariant}>{cap.label}</Badge>
          <Badge variant="neutral" className="text-[10px]">{cls.delivery_mode}</Badge>
          {cap.isHeldVerified && (
            <Badge variant="verified" className="text-[10px]">Held Verified</Badge>
          )}
        </div>
        <p className="text-xs text-muted mt-0.5">{cls.batch_name}</p>
        <p className="text-xs text-muted mt-0.5">
          {formatDhakaDate(cls.scheduled_start)} · {formatDhakaTime(cls.scheduled_start)}
          {cls.scheduled_end ? ` – ${formatDhakaTime(cls.scheduled_end)}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
        {cls.meeting_url && (
          <a
            href={cls.meeting_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-100 text-teal-700 text-xs font-semibold hover:bg-teal-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Join Link
          </a>
        )}
        {cap.canStart && (
          <Button size="sm" variant="primary" loading={pendingAction === 'start'} disabled={busy} onClick={() => doAction('start')}>
            <Play className="w-3.5 h-3.5" /> Start
          </Button>
        )}
        {cap.canEnd && (
          <Button size="sm" variant="danger" loading={pendingAction === 'end'} disabled={busy} onClick={() => doAction('end')}>
            <Square className="w-3.5 h-3.5" /> End
          </Button>
        )}
        {cap.canVerifyHeld && (
          <Button size="sm" variant="secondary" loading={pendingAction === 'verify-held'} disabled={busy} onClick={() => doAction('verify-held')}>
            <CheckCircle className="w-3.5 h-3.5" /> Verify Held
          </Button>
        )}
        {cap.canOpenReport && (
          <Button size="sm" variant="outline" onClick={() => navigateTo(`#/homework?classId=${cls.id}&batchId=${cls.batch_id}`)}>
            <BookOpen className="w-3.5 h-3.5" /> Homework
          </Button>
        )}
        {cap.canOpenReport && (
          <>
            {cap.canMarkAttendance && (            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateTo(`#/attendance?classId=${cls.id}`)}
            >
              <ClipboardCheck className="w-3.5 h-3.5" /> Attendance
            </Button>)}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateTo(`#/reports?classId=${cls.id}`)}
            >
              <FileText className="w-3.5 h-3.5" /> Report
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
