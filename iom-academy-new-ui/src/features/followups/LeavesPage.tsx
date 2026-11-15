import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { APPROVAL_MACHINE, getStatusMeta } from '@/lib/stateMachines'
import { CalendarOff, Plus, CheckCircle, XCircle, X } from 'lucide-react'

interface LeaveRow {
  id: number
  enrollment_id: number
  student_name?: string
  start_date: string
  end_date: string
  reason: string
  status: string
}

export default function LeavesPage({ role }: { role: string }) {
  const canReview = ['central_admin', 'branch_admin', 'zimmadar', 'department_supervisor'].includes(role)
  const [showNew, setShowNew] = useState(false)
  const [enrollmentId, setEnrollmentId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [reviewingId, setReviewingId] = useState<number | null>(null)
  const qc = useQueryClient()
  const toast = useToast()

  const { data: leaves = [], isLoading } = useQuery<LeaveRow[]>({
    queryKey: ['leaves'],
    queryFn: () => api.get<LeaveRow[]>('/leaves'),
  })

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/leaves', {
        enrollment_id: Number(enrollmentId),
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      })
      setShowNew(false)
      setReason('')
      toast.success('Leave request submitted')
      qc.invalidateQueries({ queryKey: ['leaves'] })
    } catch (err) {
      toast.error(err, 'Failed to apply leave')
    } finally {
      setSaving(false)
    }
  }

  async function reviewLeave(id: number, action: 'approve' | 'reject') {
    setReviewingId(id)
    try {
      await api.post(`/leaves/${id}/review`, { action, reason: action === 'approve' ? 'Approved' : 'Rejected' })
      toast.success(action === 'approve' ? 'Leave approved' : 'Leave rejected')
      qc.invalidateQueries({ queryKey: ['leaves'] })
    } catch (err) {
      toast.error(err, 'Review failed')
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Online Leave Requests</h2>
          <p className="text-xs text-muted mt-0.5">
            Approved leave pauses low-attendance warnings and resets absence follow-up streaks (AM-12)
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(!showNew)}>
          <Plus className="w-4 h-4" /> Request Leave
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Student Leave Request</CardTitle>
            <button type="button" onClick={() => setShowNew(false)} className="text-muted"><X className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitLeave} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <Input label="Enrollment ID" type="number" required value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)} />
              <Input label="Start Date" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input label="End Date" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <Input label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button type="submit" loading={saving}>Submit</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-5 space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">
              <CalendarOff className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No leave requests submitted.
            </div>
          ) : (
            <table className="iom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student / Enrollment</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => {
                  const meta = getStatusMeta(APPROVAL_MACHINE, l.status)
                  return (
                  <tr key={l.id} data-entity="leave_request" data-state={meta.state}>
                    <td className="font-mono text-xs">#{l.id}</td>
                    <td className="font-semibold text-heading">{l.student_name || `Enrollment #${l.enrollment_id}`}</td>
                    <td className="text-xs">{l.start_date} → {l.end_date}</td>
                    <td className="text-xs">{l.reason}</td>
                    <td>
                      <Badge variant={meta.badgeVariant}>
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="text-right">
                      {canReview && meta.state === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" loading={reviewingId === l.id} disabled={reviewingId !== null} onClick={() => reviewLeave(l.id, 'approve')}>
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="danger" loading={reviewingId === l.id} disabled={reviewingId !== null} onClick={() => reviewLeave(l.id, 'reject')}>
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

