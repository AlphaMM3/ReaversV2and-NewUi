import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type AttendanceRow, type ClassSession } from '@/lib/api'
import { AttendancePills, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Skeleton, AvatarInitials } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { useHashRoute, navigateTo } from '@/lib/router'
import { formatDhakaDate, formatDhakaTime } from '@/lib/utils'
import { ClipboardCheck, Save, AlertCircle, CheckCircle2 } from 'lucide-react'

type PillValue = 'P' | 'A' | 'L'

const PILL_TO_STATUS: Record<PillValue, 'Present' | 'Absent' | 'Late'> = {
  P: 'Present',
  A: 'Absent',
  L: 'Late',
}

const STATUS_TO_PILL: Record<string, PillValue | null> = {
  Present: 'P',
  Absent: 'A',
  Late: 'L',
  Unrecorded: null,
}

export default function AttendancePage() {
  const { params } = useHashRoute()
  const toast = useToast()
  const paramClassId = params.get('classId')
  const [classId, setClassId] = useState<number | null>(() => (paramClassId ? Number(paramClassId) : null))
  const [drafts, setDrafts] = useState<Record<number, PillValue>>({})
  const [reasons, setReasons] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [pendingSwitchId, setPendingSwitchId] = useState<number | null | 'none'>('none')
  const qc = useQueryClient()

  useEffect(() => {
    if (paramClassId) {
      const parsed = Number(paramClassId)
      if (!Number.isNaN(parsed) && parsed !== classId) {
        setDrafts({})
        setReasons({})
        setPendingSwitchId('none')
        setClassId(parsed)
      }
    }
  }, [paramClassId])

  const { data: classes = [] } = useQuery<ClassSession[]>({
    queryKey: ['classes', 'attendance-options'],
    queryFn: () => api.get<ClassSession[]>('/classes?status=ended&limit=50'),
  })

  const { data: roster = [], isLoading } = useQuery<AttendanceRow[]>({
    queryKey: ['attendance', classId],
    queryFn: () => api.get<AttendanceRow[]>(`/classes/${classId}/attendance`),
    enabled: !!classId,
  })

  const selectedClass = classes.find((c) => c.id === classId)

  async function saveAttendance() {
    if (!classId) return
    const changed = roster.filter((r) => {
      const next = drafts[r.enrollment_id]
      if (!next) return false
      return PILL_TO_STATUS[next] !== r.status
    })
    if (changed.length === 0) return

    setSaving(true)
    setSavedMsg('')
    try {
      for (const r of changed) {
        const nextStatus = PILL_TO_STATUS[drafts[r.enrollment_id]]
        await api.post(`/classes/${classId}/attendance`, {
          enrollment_id: r.enrollment_id,
          status: nextStatus,
          expected_revision: r.revision,
          reason: reasons[r.enrollment_id]?.trim() || (r.status !== 'Unrecorded' ? 'Teacher update' : undefined),
        })
      }
      setDrafts({})
      const summary = `Saved ${changed.length} attendance record${changed.length === 1 ? '' : 's'}`
      setSavedMsg(summary)
      toast.success(summary)
      qc.invalidateQueries({ queryKey: ['attendance', classId] })
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (err) {
      toast.error(err, 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  function requestClassChange(nextId: number | null) {
    if (pendingCount > 0) {
      setPendingSwitchId(nextId)
      return
    }
    setDrafts({})
    setReasons({})
    setClassId(nextId)
    navigateTo(nextId ? `#/attendance?classId=${nextId}` : '#/attendance')
  }

  function confirmDiscardAndSwitch() {
    if (pendingSwitchId === 'none') return
    const nextId = pendingSwitchId
    setPendingSwitchId('none')
    setDrafts({})
    setReasons({})
    setClassId(nextId)
    navigateTo(nextId ? `#/attendance?classId=${nextId}` : '#/attendance')
  }

  const pendingCount = roster.filter(
    (r) => drafts[r.enrollment_id] && PILL_TO_STATUS[drafts[r.enrollment_id]] !== r.status,
  ).length

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-heading">Attendance Workspace</h2>
          <p className="text-xs text-muted mt-0.5">
            Mark Present / Absent / Late per enrollment on verified-held classes (AM-09)
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-surface rounded-xl border border-border p-4 flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-64">
          <label className="text-xs font-semibold text-heading block mb-1">Ended Class Session</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-border text-sm text-body bg-bg focus:outline-none focus:ring-2 focus:ring-primary-700"
            value={classId ?? ''}
            onChange={(e) => requestClassChange(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— Select ended class —</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} · {c.course_title} ({c.batch_name}) · {formatDhakaDate(c.scheduled_start)} {formatDhakaTime(c.scheduled_start)}
                {c.held_verified ? ' ✓' : ' (Unverified)'}
              </option>
            ))}
          </select>
        </div>
        {selectedClass && (
          <Badge variant={selectedClass.held_verified ? 'verified' : 'pending'}>
            {selectedClass.held_verified ? 'Held Verified' : 'Needs Verify Held'}
          </Badge>
        )}
      </div>

      {pendingSwitchId !== 'none' && (
        <div
          data-state="unsaved_switch_guard"
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
        >
          <p className="text-xs font-medium text-amber-900">
            You have {pendingCount} unsaved attendance draft(s). Discard changes and switch session?
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPendingSwitchId('none')}>Keep Editing</Button>
            <Button size="sm" variant="danger" onClick={confirmDiscardAndSwitch}>Discard & Switch</Button>
          </div>
        </div>
      )}

      {/* Roster */}
      {!classId ? (
        <div className="text-center py-16 text-muted">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-heading">Select a class to begin</p>
          <p className="text-xs mt-1">Only ended and held-verified sessions accept attendance marks.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : (
        <Card
          data-entity="attendance_roster"
          data-state={selectedClass?.held_verified ? 'unlocked' : 'locked'}
          data-dirty={String(pendingCount > 0)}
        >
          <CardHeader>
            <CardTitle>
              Attendance Roster
              <span className="ml-2 text-xs font-normal text-muted">
                {roster.filter((r) => r.status !== 'Unrecorded').length} / {roster.length} saved
              </span>
            </CardTitle>
            {savedMsg && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {savedMsg}
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="iom-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Enrollment</th>
                  <th className="text-center">Mark</th>
                  <th>Reason (for corrections)</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => {
                  const value = drafts[r.enrollment_id] ?? STATUS_TO_PILL[r.status] ?? null
                  return (
                    <tr key={r.enrollment_id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <AvatarInitials name={r.full_name} size="sm" />
                          <span className="text-sm font-medium text-heading">{r.full_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-muted">#{r.enrollment_id}</span>
                      </td>
                      <td className="text-center">
                        <AttendancePills
                          value={value}
                          disabled={selectedClass ? !selectedClass.held_verified : false}
                          onChange={(v) => setDrafts((prev) => ({ ...prev, [r.enrollment_id]: v }))}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder={r.status === 'Unrecorded' ? 'Optional note' : 'Correction reason'}
                          value={reasons[r.enrollment_id] ?? ''}
                          onChange={(e) =>
                            setReasons((prev) => ({ ...prev, [r.enrollment_id]: e.target.value }))
                          }
                          className="w-full px-2 py-1 text-xs rounded border border-border bg-bg focus:outline-none focus:ring-1 focus:ring-primary-700"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="p-4 border-t border-border flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-muted">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Direct correction allowed through class date + 7 days at 23:59 Asia/Dhaka (AM-16-C1).</span>
              </div>
              <Button
                onClick={saveAttendance}
                loading={saving}
                disabled={pendingCount === 0}
              >
                <Save className="w-4 h-4" /> Save {pendingCount > 0 ? `(${pendingCount})` : 'Attendance'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
