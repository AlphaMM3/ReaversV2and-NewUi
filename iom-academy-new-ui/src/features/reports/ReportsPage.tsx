import { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toArray, type ClassSession, type ReportRow, type ReportDetailResponse } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { useHashRoute, navigateTo } from '@/lib/router'
import { deriveReportCapabilities, getStatusMeta, REPORT_MACHINE } from '@/lib/stateMachines'
import { formatDhakaDateTime, timeUntil } from '@/lib/utils'
import { FileText, Clock, CheckCircle, RotateCcw, AlertTriangle, Search, ChevronDown } from 'lucide-react'

export default function ReportsPage() {
  const [filter, setFilter] = useState<string>('all')
  const [batchFilter, setBatchFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showMissedAudit, setShowMissedAudit] = useState(false)
  const [collapsedBatches, setCollapsedBatches] = useState<Record<string, boolean>>({})
  const { params } = useHashRoute()
  const paramClassId = params.get('classId')
  const [selectedClassId, setSelectedClassId] = useState<number | null>(() => (paramClassId ? Number(paramClassId) : null))

  useEffect(() => {
    if (paramClassId) {
      const parsed = Number(paramClassId)
      if (!Number.isNaN(parsed)) setSelectedClassId(parsed)
    }
  }, [paramClassId])

  const { data: reports = [], isLoading } = useQuery<ReportRow[]>({
    queryKey: ['reports', filter],
    queryFn: () => api.get<ReportRow[]>(`/reports${filter !== 'all' ? `?status=${filter}` : ''}`),
  })

  const { data: recentClasses = [] } = useQuery<ClassSession[]>({
    queryKey: ['reports-missed-classes-audit'],
    queryFn: () => api.get<ClassSession[] | { items?: ClassSession[] }>('/classes?limit=120').then(toArray).catch(() => []),
  })

  const missedAudit = useMemo(() => {
    const now = Date.now()
    const reportedIds = new Set(reports.map((r) => r.class_id))
    const cancelledOrMissed = recentClasses.filter((c) => {
      if (batchFilter !== 'all' && c.batch_name !== batchFilter) return false
      if (c.status === 'cancelled') return true
      if (c.status === 'scheduled' && c.scheduled_start) {
        const ts = Date.parse(c.scheduled_start)
        return !Number.isNaN(ts) && ts < now - 30 * 60_000
      }
      return false
    })
    const endedNoReport = recentClasses.filter((c) => {
      if (batchFilter !== 'all' && c.batch_name !== batchFilter) return false
      return c.status === 'ended' && !reportedIds.has(c.id)
    })
    return { cancelledOrMissed, endedNoReport, totalAlerts: cancelledOrMissed.length + endedNoReport.length }
  }, [recentClasses, reports, batchFilter])

  const batchOptions = useMemo(() => {
    const names = new Set<string>()
    for (const r of reports) {
      if (r.batch_name) names.add(r.batch_name)
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [reports])

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reports.filter((r) => {
      if (batchFilter !== 'all' && r.batch_name !== batchFilter) return false
      if (!q) return true
      return (
        r.course_title?.toLowerCase().includes(q) ||
        r.batch_name?.toLowerCase().includes(q) ||
        String(r.class_id).includes(q)
      )
    })
  }, [reports, batchFilter, search])

  const groupedByBatch = useMemo(() => {
    const map = new Map<string, ReportRow[]>()
    for (const r of filteredReports) {
      const key = r.batch_name || 'Unassigned Batch'
      const list = map.get(key) ?? []
      list.push(r)
      map.set(key, list)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filteredReports])

  function isBatchCollapsed(batchName: string, items: ReportRow[], idx: number): boolean {
    const explicit = collapsedBatches[batchName]
    if (explicit !== undefined) return explicit
    const hasPending = items.some((r) => r.status === 'submitted')
    return groupedByBatch.length > 1 && !hasPending && idx > 0
  }

  function toggleBatchGroup(batchName: string, currentlyCollapsed: boolean) {
    setCollapsedBatches((prev) => ({ ...prev, [batchName]: !currentlyCollapsed }))
  }

  const allCollapsed = groupedByBatch.length > 0 && groupedByBatch.every(([name, items], idx) => isBatchCollapsed(name, items, idx))

  function toggleAllBatches() {
    const nextState: Record<string, boolean> = {}
    const targetCollapsed = !allCollapsed
    for (const [name] of groupedByBatch) nextState[name] = targetCollapsed
    setCollapsedBatches(nextState)
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Class Reports &amp; Missed Class Audit</h2>
          <p className="text-xs text-muted mt-0.5">
            Governance oversight — detect missed/cancelled classes, missing teacher reports &amp; Zimmadar review queue
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {groupedByBatch.length > 1 && (
            <Button size="sm" variant="outline" onClick={toggleAllBatches}>
              {allCollapsed ? 'Expand all batches' : 'Collapse all batches'}
            </Button>
          )}
          <Badge variant="primary">{filteredReports.length} report(s)</Badge>
        </div>
      </div>

      {/* Zimmadar Governance Strip: Missed / Cancelled / Missing Reports */}
      <Card className={missedAudit.totalAlerts > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-emerald-200 bg-emerald-50/40'}>
        <CardContent className="py-3.5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <AlertTriangle className={`w-4 h-4 ${missedAudit.totalAlerts > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
              <span className="text-xs font-bold text-heading">Zimmadar Missed-Class Watch:</span>
              <Badge variant={missedAudit.cancelledOrMissed.length > 0 ? 'absent' : 'approved'}>
                {missedAudit.cancelledOrMissed.length} Missed / Cancelled
              </Badge>
              <Badge variant={missedAudit.endedNoReport.length > 0 ? 'pending' : 'approved'}>
                {missedAudit.endedNoReport.length} Ended Without Report
              </Badge>
            </div>
            {missedAudit.totalAlerts > 0 && (
              <Button size="sm" variant="outline" onClick={() => setShowMissedAudit((v) => !v)}>
                {showMissedAudit ? 'Hide Class List' : `Inspect ${missedAudit.totalAlerts} Alert(s)`}
              </Button>
            )}
          </div>

          {showMissedAudit && missedAudit.totalAlerts > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {missedAudit.cancelledOrMissed.map((c) => (
                <div key={`miss-${c.id}`} className="p-2.5 rounded-xl bg-white border border-red-200 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-heading truncate">{c.batch_name || c.course_title}</p>
                    <p className="text-[11px] text-muted truncate">{formatDhakaDateTime(c.scheduled_start)}</p>
                  </div>
                  <Badge variant="absent">{c.status === 'cancelled' ? 'Cancelled' : 'Missed'}</Badge>
                </div>
              ))}
              {missedAudit.endedNoReport.map((c) => (
                <div key={`norep-${c.id}`} className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-heading truncate">{c.batch_name || c.course_title}</p>
                    <p className="text-[11px] text-muted truncate">{formatDhakaDateTime(c.scheduled_start)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo(`#/reports?classId=${c.id}`)}
                    className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 font-semibold text-[11px] shrink-0 cursor-pointer hover:bg-amber-200"
                  >
                    File Report →
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Dropdown Filters Card */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-heading block mb-1">Batch Filter</label>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full"
              >
                <option value="all">All Batches ({reports.length})</option>
                {batchOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-heading block mb-1">Review Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted (Pending Review)</option>
                <option value="approved">Approved</option>
                <option value="returned">Returned</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-heading block mb-1">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  placeholder="Course, batch or class #…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="iom-input pl-10 w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* Batch-wise Dropdown Accordion Queue */}
        <div className="lg:col-span-3 space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          ) : groupedByBatch.length === 0 ? (
            <Card>
              <CardContent className="text-center py-14 text-muted">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium text-heading">No reports match the current filters.</p>
              </CardContent>
            </Card>
          ) : (
            groupedByBatch.map(([batchName, items], idx) => {
              const isCollapsed = isBatchCollapsed(batchName, items, idx)
              const pendingCount = items.filter((r) => r.status === 'submitted').length
              const courseName = items[0]?.course_title || ''
              return (
                <Card key={batchName} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleBatchGroup(batchName, isCollapsed)}
                    className="w-full px-5 py-3.5 bg-bg/60 hover:bg-bg border-b border-border flex items-center justify-between gap-3 text-left cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-heading truncate">{batchName}</p>
                      {courseName && <p className="text-xs text-muted truncate">{courseName}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {pendingCount > 0 && <Badge variant="pending">{pendingCount} to review</Badge>}
                      <Badge variant="primary">{items.length}</Badge>
                      <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="divide-y divide-border/70">
                      {items.map((r) => {
                        const due = r.due_at ? new Date(r.due_at) : null
                        const isOverdue = r.status === 'draft' && due !== null && new Date() > due
                        const meta = getStatusMeta(REPORT_MACHINE, r.status)
                        const isSelected = selectedClassId === r.class_id
                        return (
                          <button
                            key={r.id}
                            type="button"
                            data-entity="class_report"
                            data-state={meta.state}
                            onClick={() => setSelectedClassId(isSelected ? null : r.class_id)}
                            className={`w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                              isSelected ? 'bg-primary-50/70 border-l-4 border-l-primary-700' : 'hover:bg-bg/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isOverdue ? 'bg-red-100' : 'bg-primary-50'
                              }`}>
                                {isOverdue
                                  ? <AlertTriangle className="w-4 h-4 text-red-600" />
                                  : <FileText className="w-4 h-4 text-primary-700" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-heading truncate">
                                  Class #{r.class_id} · Rev {r.revision}
                                </p>
                                {due && (
                                  <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span>Due {formatDhakaDateTime(due)}</span>
                                    {r.status === 'draft' && (
                                      <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                                        · {isOverdue ? 'OVERDUE' : timeUntil(due)}
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {r.submission_status === 'late' && <Badge variant="absent">Late</Badge>}
                              <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>

        {/* Report detail / action panel */}
        <div className="lg:col-span-2 lg:sticky lg:top-20">
          {selectedClassId ? (
            <ReportActionPanel classId={selectedClassId} onDone={() => setSelectedClassId(null)} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Select a report from a batch dropdown to view, submit, or review.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ReportActionPanel({ classId, onDone }: { classId: number; onDone: () => void }) {
  const [bodyText, setBodyText] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [mode, setMode] = useState<'view' | 'return'>('view')
  const [saving, setSaving] = useState(false)
  const qc = useQueryClient()
  const toast = useToast()

  const { data, isLoading } = useQuery<ReportDetailResponse>({
    queryKey: ['report-detail', classId],
    queryFn: () => api.get<ReportDetailResponse>(`/classes/${classId}/report`),
  })

  useEffect(() => {
    setBodyText(data?.report?.body ?? '')
    setReturnReason('')
    setMode('view')
  }, [data?.report?.id, data?.report?.body])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8"><Skeleton className="h-40 rounded-lg" /></CardContent>
      </Card>
    )
  }

  const rep = data?.report
  const historyId = data?.latest_history_id ?? 0
  const cap = deriveReportCapabilities(rep?.status)

  async function saveReport(submit: boolean) {
    setSaving(true)
    try {
      await api.post(`/classes/${classId}/report`, {
        body: bodyText,
        submit,
        expected_history_id: historyId,
      })
      toast.success(submit ? 'Report submitted for review' : 'Report draft saved')
      qc.invalidateQueries({ queryKey: ['reports'] })
      qc.invalidateQueries({ queryKey: ['report-detail', classId] })
      if (submit) onDone()
    } catch (err) { toast.error(err, 'Failed to save report') }
    finally { setSaving(false) }
  }

  async function review(action: 'approve' | 'return_report') {
    if (!rep) return
    if (action === 'return_report' && !returnReason.trim()) {
      toast.warning('Return reason required')
      return
    }
    setSaving(true)
    try {
      await api.post(`/reports/${rep.id}/review`, {
        action,
        reason: action === 'return_report' ? returnReason : null,
        expected_history_id: historyId,
      })
      toast.success(action === 'approve' ? 'Report approved' : 'Report returned to teacher')
      qc.invalidateQueries({ queryKey: ['reports'] })
      qc.invalidateQueries({ queryKey: ['report-detail', classId] })
      onDone()
    } catch (err) { toast.error(err, 'Review failed') }
    finally { setSaving(false) }
  }

  return (
    <Card data-entity="class_report" data-state={cap.status}>
      <CardHeader>
        <CardTitle>{rep ? `Report #${rep.id}` : `New Report (Class #${classId})`}</CardTitle>
        <Badge variant={cap.meta.badgeVariant}>{rep ? cap.meta.label : 'new'}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {rep?.review_reason && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">Zimmadar Return Reason</p>
            <p className="text-sm text-amber-800">{rep.review_reason}</p>
          </div>
        )}

        {cap.canEdit && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-heading block">Class Report Summary</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-border text-sm text-body bg-bg focus:outline-none focus:ring-2 focus:ring-primary-700 resize-none"
              rows={6}
              placeholder="Write what was covered, student engagement, homework…"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => saveReport(false)} loading={saving} disabled={!bodyText.trim()}>
                Save Draft
              </Button>
              <Button className="flex-1" onClick={() => saveReport(true)} loading={saving} disabled={!bodyText.trim()}>
                Submit Report
              </Button>
            </div>
          </div>
        )}

        {cap.canReview && rep && (
          <div className="space-y-3">
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-primary-700 mb-1">Submitted Report</p>
              <p className="text-sm text-body whitespace-pre-wrap">{rep.body}</p>
            </div>
            {mode === 'return' ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-heading block">Reason for Return</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-body bg-bg focus:outline-none focus:ring-2 focus:ring-primary-700 resize-none"
                  rows={3}
                  placeholder="Explain what needs correction…"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setMode('view')}>Cancel</Button>
                  <Button variant="danger" size="sm" loading={saving} onClick={() => review('return_report')}>
                    Confirm Return
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => setMode('return')}>
                  <RotateCcw className="w-3.5 h-3.5" /> Return
                </Button>
                <Button size="sm" className="flex-1" loading={saving} onClick={() => review('approve')}>
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </Button>
              </div>
            )}
          </div>
        )}

        {cap.isLocked && rep && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-semibold text-green-700">Report Approved</p>
            </div>
            <p className="text-xs text-body whitespace-pre-wrap bg-bg p-3 rounded-lg border border-border">
              {rep.body}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
