import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { APPROVAL_MACHINE, getStatusMeta } from '@/lib/stateMachines'
import { BarChart2, CheckCircle, XCircle } from 'lucide-react'

interface MonthlyRow {
  enrollment_id: number
  student_name: string
  course_title: string
  batch_name: string
  held_classes: number
  present_count: number
  late_count: number
  absent_count: number
  attendance_pct: number | null
}

interface CorrectionRow {
  id: number
  class_id: number
  enrollment_id: number
  student_name?: string
  old_status: string
  new_status: string
  reason: string
  status: string
}

export default function MonthlySummaryPage({ role }: { role: string }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [pendingId, setPendingId] = useState<number | null>(null)
  const canReview = ['central_admin', 'branch_admin', 'zimmadar'].includes(role)
  const qc = useQueryClient()
  const toast = useToast()

  const { data: rows = [], isLoading } = useQuery<MonthlyRow[]>({
    queryKey: ['attendance-monthly', month],
    queryFn: () => api.get<MonthlyRow[]>(`/attendance/monthly?month=${month}`).catch(() => []),
  })

  const { data: corrections = [] } = useQuery<CorrectionRow[]>({
    queryKey: ['attendance-corrections'],
    queryFn: () => api.get<CorrectionRow[]>('/attendance-corrections').catch(() => []),
  })

  async function reviewCorrection(id: number, action: 'approve' | 'reject') {
    setPendingId(id)
    try {
      await api.post(`/attendance-corrections/${id}/review`, {
        action,
        reason: action === 'approve' ? 'Approved in monthly review' : 'Rejected in review',
      })
      toast.success(action === 'approve' ? 'Correction approved' : 'Correction rejected')
      qc.invalidateQueries({ queryKey: ['attendance-corrections'] })
    } catch (err) {
      toast.error(err, 'Review failed')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Monthly Attendance Summary & Corrections</h2>
          <p className="text-xs text-muted mt-0.5">
            Per-enrollment held-class attendance rates (AM-09) and post-7-day Zimmadar correction approvals (AM-16)
          </p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-border bg-surface"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary-700" /> Monthly Enrollment Attendance ({month})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-5 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : rows.length === 0 ? (
            <p className="text-center py-12 text-sm text-muted">No held-class attendance records for {month}.</p>
          ) : (
            <table className="iom-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course / Batch</th>
                  <th>Held</th>
                  <th>Present</th>
                  <th>Late</th>
                  <th>Absent</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pct = Number(r.attendance_pct ?? 0)
                  return (
                    <tr key={r.enrollment_id}>
                      <td className="font-semibold text-heading">{r.student_name}</td>
                      <td className="text-xs text-muted">{r.course_title} · {r.batch_name}</td>
                      <td>{r.held_classes}</td>
                      <td className="text-green-700 font-semibold">{r.present_count}</td>
                      <td className="text-amber-600 font-semibold">{r.late_count}</td>
                      <td className="text-red-600 font-semibold">{r.absent_count}</td>
                      <td>
                        <Badge variant={pct >= 75 ? 'approved' : pct >= 50 ? 'pending' : 'absent'}>
                          {r.attendance_pct !== null ? `${pct.toFixed(0)}%` : '—'}
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

      <Card>
        <CardHeader>
          <CardTitle>Pending Attendance Correction Requests ({corrections.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {corrections.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted">No attendance correction requests.</p>
          ) : (
            <table className="iom-table">
              <thead>
                <tr>
                  <th>Class / Enrollment</th>
                  <th>Change</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th className="text-right">Review</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map((c) => {
                  const meta = getStatusMeta(APPROVAL_MACHINE, c.status)
                  return (
                  <tr key={c.id} data-entity="attendance_correction" data-state={meta.state}>
                    <td className="text-xs">Class #{c.class_id} · Enrollment #{c.enrollment_id}</td>
                    <td className="text-xs">
                      <Badge variant="neutral">{c.old_status}</Badge> → <Badge variant="primary">{c.new_status}</Badge>
                    </td>
                    <td className="text-xs">{c.reason}</td>
                    <td><Badge variant={meta.badgeVariant}>{meta.label}</Badge></td>
                    <td className="text-right">
                      {canReview && meta.state === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" loading={pendingId === c.id} disabled={pendingId !== null} onClick={() => reviewCorrection(c.id, 'approve')}>
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="danger" loading={pendingId === c.id} disabled={pendingId !== null} onClick={() => reviewCorrection(c.id, 'reject')}>
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

