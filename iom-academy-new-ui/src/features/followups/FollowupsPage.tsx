import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toArray } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { FOLLOWUP_MACHINE, getStatusMeta } from '@/lib/stateMachines'
import { buildWhatsAppUrl, buildTelegramShareUrl } from '@/lib/messaging'
import { formatDhakaDateTime } from '@/lib/utils'
import { AlertTriangle, MessageCircle, Send, FileText } from 'lucide-react'

interface FollowupCase {
  id: number
  enrollment_id: number
  student_name?: string
  course_title?: string
  batch_name?: string
  case_type?: string
  kind?: string
  status: string
  consecutive_absences?: number
  opened_at?: string
}

export default function FollowupsPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const qc = useQueryClient()
  const toast = useToast()

  const { data: cases = [], isLoading } = useQuery<FollowupCase[]>({
    queryKey: ['followups'],
    queryFn: () => api.get<FollowupCase[] | { items?: FollowupCase[] }>('/followups').then(toArray),
  })

  const selected = cases.find((c) => c.id === selectedId)

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !note.trim()) return
    setSaving(true)
    try {
      await api.post(`/followups/${selectedId}/note`, { note: note.trim(), outcome: 'contacted' })
      setNote('')
      toast.success(`Follow-up note logged on Case #${selectedId}`)
      qc.invalidateQueries({ queryKey: ['followups'] })
    } catch (err) {
      toast.error(err, 'Failed to save follow-up note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-heading">Student Absence Follow-ups & Care</h2>
        <p className="text-xs text-muted mt-0.5">
          Triggered after 7 consecutive missed held classes per enrollment (AM-01 / AM-09). Contact Guardians via WhatsApp or Telegram.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="p-5 space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : cases.length === 0 ? (
                <div className="text-center py-12 text-muted text-sm">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No active follow-up cases right now.
                </div>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Case #</th>
                      <th>Student & Course</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Opened</th>
                      <th className="text-right">Care</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => {
                      const msg = `*IOM Itqaan Academy — Student Absence Check-in*\nStudent: ${c.student_name || `Enrollment #${c.enrollment_id}`}\nCourse: ${c.course_title || 'Online Class'}\nAssalamu Alaikum, we noticed consecutive missed classes and wanted to check if everything is alright.`
                      const meta = getStatusMeta(FOLLOWUP_MACHINE, c.status)
                      return (
                        <tr key={c.id} data-entity="followup_case" data-state={meta.state}>
                          <td className="font-mono text-xs">#{c.id}</td>
                          <td>
                            <p className="font-semibold text-heading">{c.student_name || `Enrollment #${c.enrollment_id}`}</p>
                            <p className="text-xs text-muted">{c.course_title || ''} {c.batch_name ? `· ${c.batch_name}` : ''}</p>
                          </td>
                          <td><Badge variant="pending">{c.case_type || c.kind || 'streak'}</Badge></td>
                          <td><Badge variant={meta.badgeVariant}>{meta.label}</Badge></td>
                          <td className="text-xs text-muted">{c.opened_at ? formatDhakaDateTime(c.opened_at) : '—'}</td>
                          <td>
                            <div className="flex justify-end gap-1.5">
                              <a
                                href={buildWhatsAppUrl(msg)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> WA
                              </a>
                              <a
                                href={buildTelegramShareUrl(msg)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100"
                              >
                                <Send className="w-3.5 h-3.5" /> TG
                              </a>
                              <Button size="sm" variant="outline" onClick={() => setSelectedId(c.id)}>
                                <FileText className="w-3.5 h-3.5" /> Note
                              </Button>
                            </div>
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

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{selected ? `Log Follow-up Note (#${selected.id})` : 'Select a Follow-up Case'}</CardTitle>
            </CardHeader>
            <CardContent>
              {!selected ? (
                <p className="text-xs text-muted py-8 text-center">Click "Note" on any case to record Guardian outreach.</p>
              ) : (
                <form onSubmit={addNote} className="space-y-3">
                  <p className="text-sm font-semibold text-heading">{selected.student_name || `Enrollment #${selected.enrollment_id}`}</p>
                  <textarea
                    rows={4}
                    required
                    placeholder="Record Guardian conversation summary (teacher editable within 24h)…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-bg"
                  />
                  <Button type="submit" loading={saving} className="w-full">Save Care Note</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

