import { supportApi, useSupportTickets } from '@/lib/supportApi'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import type { CurrentUser } from '@/lib/api'
import {
  useLocalStore,
  STAFF_NOTICES_KEY,
  type SupportTicket,
  type StaffAttentionNotice,
  type TicketAttachment,
  readFileAsAttachment,
  hydrateSuperAdminStoresFromServer,
} from '@/lib/superAdminStore'
import {
  Ticket, Megaphone, Plus, Send, CheckCircle2, AlertTriangle,
  ShieldAlert, Clock, UserCheck, Search, Paperclip,
  Image as ImageIcon, FileText, Download, X,
} from 'lucide-react'

function isSlaOverdue(ticket: SupportTicket): boolean {
  if (ticket.status === 'resolved') return false
  const ageMs = Date.now() - new Date(ticket.created_at).getTime()
  return ageMs > 24 * 60 * 60 * 1000
}

export default function TicketsPage({ user }: { user: CurrentUser }) {
  const toast = useToast()
  const role = user.role
  const isSuperAdmin = ['central_admin', 'branch_admin'].includes(role)
  const isZimmadar = ['zimmadar', 'department_supervisor'].includes(role)
  const isTeacher = role === 'teacher'
  const isGuardian = ['guardian_primary', 'guardian_secondary'].includes(role)

  const { data: tickets = [], isError: ticketError, isLoading: ticketsLoading, refetch: refreshTickets } = useSupportTickets()
  const [notices, setNotices] = useLocalStore<StaffAttentionNotice[]>(STAFF_NOTICES_KEY, [])

  // Auto-sync shared tickets & replies with server
  useEffect(() => {
    void hydrateSuperAdminStoresFromServer()
    const timer = setInterval(() => {
      void hydrateSuperAdminStoresFromServer()
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const [tab, setTab] = useState<'tickets' | 'notices'>('tickets')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(() => {
    try {
      const saved = sessionStorage.getItem('iom_active_ticket_id')
      if (saved) {
        sessionStorage.removeItem('iom_active_ticket_id')
        return saved
      }
    } catch {}
    return null
  })
  const [replyText, setReplyText] = useState('')

  // Attachment states & Lightbox
  const [ticketAttachments, setTicketAttachments] = useState<TicketAttachment[]>([])
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [previewLightbox, setPreviewLightbox] = useState<{ url: string; name: string } | null>(null)
  const ticketFileInputRef = useRef<HTMLInputElement | null>(null)
  const replyFileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, mode: 'ticket' | 'reply') {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingAttachment(true)
    try {
      const newAtts: TicketAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const att = await readFileAsAttachment(files[i])
        newAtts.push(att)
      }
      if (mode === 'ticket') {
        setTicketAttachments((prev) => [...prev, ...newAtts])
      } else {
        setReplyAttachments((prev) => [...prev, ...newAtts])
      }
      toast.success(`${files.length}টি ফাইল সংযুক্ত হয়েছে`)
    } catch {
      toast.error('ফাইল আপলোড করতে সমস্যা হয়েছে')
    } finally {
      setUploadingAttachment(false)
      e.target.value = ''
    }
  }

  // New Ticket / Escalation form
  const [category, setCategory] = useState<SupportTicket['category']>(
    isTeacher ? 'student_issue' : 'fee',
  )
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal')
  const [targetRole, setTargetRole] = useState<'zimmadar' | 'central_admin'>('zimmadar')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [studentName, setStudentName] = useState('')

  // New Staff Attention Notice form (Super Admin)
  const [showNewNotice, setShowNewNotice] = useState(false)
  const [noticeTitle, setNoticeTitle] = useState('')
  const [noticeMessage, setNoticeMessage] = useState('')
  const [noticeAudience, setNoticeAudience] = useState<'all_staff' | 'zimmadar' | 'teacher'>('all_staff')
  const [noticePriority, setNoticePriority] = useState<'normal' | 'urgent'>('urgent')

  const [searchQuery, setSearchQuery] = useState('')

  const visibleTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        // Staff members (Central Admin, Branch Admin, Zimmadar, Teacher) see all tickets and guardian chats
        return !isGuardian || t.created_by_id === user.id
      })
      .filter((t) => (statusFilter === 'all' ? true : t.status === statusFilter))
      .filter((t) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase().trim()
        return (
          t.token.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          (t.student_name && t.student_name.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  }, [tickets, isGuardian, user.id, statusFilter, searchQuery])

  const selectedTicket = visibleTickets.find((t) => t.id === selectedTicketId) ?? visibleTickets[0] ?? null

  const visibleNotices = useMemo(() => {
    return notices
      .filter((n) => {
        if (isSuperAdmin) return true
        if (!n.active) return false
        if (n.target_audience === 'all_staff') return !isGuardian
        if (n.target_audience === 'zimmadar') return isZimmadar
        if (n.target_audience === 'teacher') return isTeacher
        return false
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [notices, isSuperAdmin, isGuardian, isZimmadar, isTeacher])

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault()
    try {
      const ticket = await supportApi.create({ subject, description, category, priority, student_name: studentName,
        target_role: isGuardian ? 'central_admin' : targetRole, attachments: ticketAttachments })
      await refreshTickets()
      setSelectedTicketId(ticket.id)
      setShowNewTicket(false)
      setSubject('')
      setDescription('')
      setStudentName('')
      setTicketAttachments([])
      toast.success(`Ticket #${ticket.token} created`)
    } catch (error) {
      toast.error(error, 'Could not save ticket. Try again.')
    }
  }

  async function handleAddReply(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTicket || (!replyText.trim() && !replyAttachments.length)) return
    try {
      await supportApi.reply(selectedTicket.id, { message: replyText.trim() || 'See attachment', attachments: replyAttachments })
      setReplyText('')
      setReplyAttachments([])
      await refreshTickets()
      toast.success('Reply saved')
    } catch (error) {
      toast.error(error, 'Could not save reply. Try again.')
    }
  }

  async function updateTicketStatus(id: string, status: SupportTicket['status']) {
    try {
      await supportApi.status(id, status)
      await refreshTickets()
      toast.success('Ticket status updated')
    } catch (error) {
      toast.error(error, 'Could not update ticket status')
    }
  }
  function handleCreateNotice(e: React.FormEvent) {
    e.preventDefault()
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      toast.warning('Title and message are required')
      return
    }
    const item: StaffAttentionNotice = {
      id: `ntc-${Date.now()}`,
      title: noticeTitle.trim(),
      message: noticeMessage.trim(),
      target_audience: noticeAudience,
      priority: noticePriority,
      created_by: user.name,
      created_at: new Date().toISOString(),
      active: true,
      acknowledged_by: [],
    }
    setNotices((prev) => [item, ...prev])
    setNoticeTitle('')
    setNoticeMessage('')
    setShowNewNotice(false)
    toast.success('Staff attention notice published')
  }

  function acknowledgeNotice(noticeId: string) {
    setNotices((prev) =>
      prev.map((n) => {
        if (n.id !== noticeId) return n
        if (n.acknowledged_by.some((a) => a.user_id === user.id)) return n
        return {
          ...n,
          acknowledged_by: [
            ...n.acknowledged_by,
            { user_id: user.id, name: user.name, role, at: new Date().toISOString() },
          ],
        }
      }),
    )
    toast.success('Notice acknowledged')
  }

  function toggleNoticeActive(noticeId: string) {
    setNotices((prev) => prev.map((n) => (n.id === noticeId ? { ...n, active: !n.active } : n)))
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">
            {isGuardian
              ? 'Help Desk & Support Tickets'
              : isTeacher
                ? 'Escalate Issues & Principal Notices'
                : 'Support Tickets, Escalations & Staff Notices'}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {isGuardian
              ? 'Open a tracked Token Ticket for Fee, Batch, or Management support (for study/homework Q&A, use Batch Notices & Q&A)'
              : isTeacher
                ? 'Report student or operational issues directly to Zimmadar or Super Admin, and read Principal attention notices'
                : 'Track guardian Token Tickets, teacher escalations, 24h SLA alerts, and broadcast Principal attention notices'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isGuardian && (
            <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => setTab('tickets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  tab === 'tickets' ? 'bg-primary-700 text-white' : 'text-body hover:text-heading'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 inline mr-1" />
                Tickets ({visibleTickets.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('notices')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  tab === 'notices' ? 'bg-primary-700 text-white' : 'text-body hover:text-heading'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5 inline mr-1" />
                Staff Notices ({visibleNotices.length})
              </button>
            </div>
          )}

          {tab === 'tickets' && (
            <Button size="sm" onClick={() => setShowNewTicket(!showNewTicket)}>
              <Plus className="w-4 h-4" /> {isTeacher ? 'Report / Escalate Issue' : 'New Support Ticket'}
            </Button>
          )}
          {tab === 'notices' && isSuperAdmin && (
            <Button size="sm" onClick={() => setShowNewNotice(!showNewNotice)}>
              <Megaphone className="w-4 h-4" /> Send Attention Notice
            </Button>
          )}
        </div>
      </div>

      {/* TAB 1: TICKETS & ESCALATIONS */}
      {tab === 'tickets' && (
        <div className="space-y-4">
          {showNewTicket && (
            <Card className="border-primary-200 bg-primary-50/30">
              <CardHeader>
                <CardTitle className="text-base">
                  {isTeacher ? 'Escalate Issue to Zimmadar / Super Admin' : 'Open New Help Ticket'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTicket} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-heading mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                    >
                      {isTeacher ? (
                        <>
                          <option value="student_issue">Student Issue / Absent</option>
                          <option value="academic">Academic / Curriculum</option>
                          <option value="batch">Batch / Routine</option>
                          <option value="technical">Technical / Zoom</option>
                        </>
                      ) : (
                        <>
                          <option value="fee">Fee &amp; Payment</option>
                          <option value="batch">Batch / Schedule</option>
                          <option value="technical">Portal / Technical</option>
                          <option value="general">Management / General</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-heading mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'normal' | 'urgent')}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {!isGuardian && (
                    <div>
                      <label className="block text-xs font-semibold text-heading mb-1">Send To</label>
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value as 'zimmadar' | 'central_admin')}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                      >
                        <option value="zimmadar">Zimmadar</option>
                        <option value="central_admin">Super Admin / Principal</option>
                      </select>
                    </div>
                  )}

                  <Input
                    label="Student Name (Optional)"
                    placeholder="e.g. Abdullah Al Mamun"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />

                  <div className="md:col-span-4">
                    <Input
                      label="Subject"
                      placeholder="Short summary of the issue"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-heading mb-1">Details</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the issue clearly..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                      required
                    />
                  </div>

                  <div className="md:col-span-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-heading">
                        স্ক্রিনশট বা ফাইল সংযুক্ত করুন (ঐচ্ছিক)
                      </label>
                      <input
                        type="file"
                        ref={ticketFileInputRef}
                        onChange={(e) => handleFileSelect(e, 'ticket')}
                        accept="image/*,.pdf,.doc,.docx"
                        multiple
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => ticketFileInputRef.current?.click()}
                        disabled={uploadingAttachment}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer shadow-3xs"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-primary-700" />
                        <span>{uploadingAttachment ? 'ফাইল প্রসেসিং...' : 'ফাইল যুক্ত করুন'}</span>
                      </button>
                    </div>

                    {/* Attachment Chips */}
                    {ticketAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {ticketAttachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary-50 border border-primary-200 text-xs text-primary-950 font-medium"
                          >
                            {att.type.startsWith('image/') ? (
                              <ImageIcon className="w-3.5 h-3.5 text-primary-700" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-primary-700" />
                            )}
                            <span className="truncate max-w-[140px]">{att.name}</span>
                            <button
                              type="button"
                              onClick={() => setTicketAttachments((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-primary-700 hover:text-rose-600 p-0.5 cursor-pointer ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-4 flex gap-2">
                    <Button type="submit">
                      <Send className="w-4 h-4" /> Submit Ticket
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowNewTicket(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Status Filter Strip & Token Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                    statusFilter === st
                      ? 'bg-primary-700 text-white border-primary-700'
                      : 'bg-surface text-body border-border hover:text-heading'
                  }`}
                >
                  {st === 'all' ? 'All Tickets' : st === 'in_progress' ? 'In Progress' : st.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search Token (e.g. TKT-1085)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-surface focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Ticket List */}
            <div className="lg:col-span-5 space-y-2.5">
              {visibleTickets.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-xs text-muted">
                    {ticketError ? 'Could not load tickets.' : ticketsLoading ? 'Loading tickets…' : 'No tickets or escalations yet.'}{ticketError && <Button onClick={() => void refreshTickets()}>Retry</Button>}
                  </CardContent>
                </Card>
              ) : (
                visibleTickets.map((t) => {
                  const active = selectedTicket?.id === t.id
                  const overdue = isSlaOverdue(t)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full text-left rounded-2xl border p-3.5 transition-all cursor-pointer space-y-2 ${
                        active
                          ? 'border-primary-400 bg-primary-50/60 shadow-xs'
                          : 'border-border bg-surface hover:border-primary-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-primary-700">#{t.token}</span>
                          {t.status === 'open' && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="সক্রিয় ও নতুন টিকেট" />
                          )}
                          {t.priority === 'urgent' && <Badge variant="absent">Urgent</Badge>}
                          {overdue && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                              <Clock className="w-3 h-3" /> 24h+ SLA
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={
                            t.status === 'resolved'
                              ? 'approved'
                              : t.status === 'in_progress'
                                ? 'pending'
                                : 'draft'
                          }
                        >
                          {t.status === 'resolved' ? 'সমাধান' : t.status === 'in_progress' ? 'ইন প্রগ্রেস' : 'ওপেন'}
                        </Badge>
                      </div>
                      <p className="text-sm font-bold text-heading truncate">{t.subject}</p>
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span className="truncate max-w-[200px]">
                          প্রাপক: <strong>{t.target_recipient || t.target_role}</strong>
                        </span>
                        <span>{Array.isArray(t.replies) ? t.replies.length : 0} বার্তা</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Ticket Thread & Super Admin Override */}
            <div className="lg:col-span-7">
              {selectedTicket ? (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col h-[650px] max-h-[85vh]">
                  {/* Clean Modern Chat Header */}
                  <div className="p-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-primary-700 bg-primary-100/80 px-2 py-0.5 rounded-md border border-primary-200">
                          #{selectedTicket.token}
                        </span>
                        <Badge
                          variant={
                            selectedTicket.status === 'resolved'
                              ? 'approved'
                              : selectedTicket.status === 'in_progress'
                                ? 'pending'
                                : 'neutral'
                          }
                        >
                          {selectedTicket.status === 'resolved'
                            ? 'সমাধান হয়েছে'
                            : selectedTicket.status === 'in_progress'
                              ? 'ইন প্রগ্রেস'
                              : 'ওপেন (অপেক্ষমাণ)'}
                        </Badge>
                        {selectedTicket.priority === 'urgent' && <Badge variant="absent">জরুরি</Badge>}
                        <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          ক্যাটাগরি: {selectedTicket.category}
                        </span>
                      </div>

                      {!isGuardian && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {selectedTicket.status !== 'in_progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                              className="text-xs h-8 rounded-lg cursor-pointer"
                            >
                              ইন প্রগ্রেস করুন
                            </Button>
                          )}
                          {selectedTicket.status !== 'resolved' ? (
                            <Button
                              size="sm"
                              onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                              className="text-xs h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> সমাধান চিহ্নিত করুন
                            </Button>
                          ) : (
                            isSuperAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTicketStatus(selectedTicket.id, 'open')}
                                className="text-xs h-8 rounded-lg cursor-pointer"
                              >
                                পুনরায় খুলুন
                              </Button>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 mt-2 line-clamp-1">
                      {selectedTicket.subject}
                    </h2>

                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                      <span>প্রেরক: <strong>{selectedTicket.created_by_name}</strong></span>
                      <span className="text-slate-300">·</span>
                      <span>প্রাপক: <strong className="text-primary-800">{selectedTicket.target_recipient || (selectedTicket.target_role === 'central_admin' ? 'সুপার অ্যাডমিন' : selectedTicket.target_role === 'teacher' ? 'ক্লাস শিক্ষক' : 'জিম্মাদার')}</strong></span>
                      {selectedTicket.student_name && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span>শিক্ষার্থী: <strong>{selectedTicket.student_name}</strong></span>
                        </>
                      )}
                    </div>

                    {selectedTicket.overridden_by && (
                      <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>প্রিন্সিপাল অ্যাকশন: <strong>{selectedTicket.overridden_by}</strong></span>
                      </p>
                    )}
                  </div>

                  {/* Clean Unified Chat Thread (Single Stream, No Nested Double Boxes) */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
                    {/* Original Ticket Opening Card */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-3xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-muted border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-800">
                          👨‍💼 {selectedTicket.created_by_name} ({selectedTicket.created_by_role.startsWith('guardian') ? 'অভিভাবকের মূল আবেদন' : 'শিক্ষকের রিপোর্ট'}):
                        </span>
                        <span className="font-mono">{new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pt-0.5">
                        {selectedTicket.description}
                      </p>

                      {/* Opening Attachments */}
                      {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                          {selectedTicket.attachments.map((att, i) => {
                            const isImg = att.type.startsWith('image/')
                            return isImg ? (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setPreviewLightbox({ url: att.url, name: att.name })}
                                className="group relative block rounded-xl overflow-hidden border border-slate-200 hover:border-primary-500 transition-all cursor-pointer shadow-3xs"
                              >
                                <img src={att.url} alt={att.name} className="w-28 h-20 object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                                  বড় করে দেখুন
                                </div>
                              </button>
                            ) : (
                              <a
                                key={i}
                                href={att.url}
                                download={att.name}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 text-primary-700" />
                                <span className="truncate max-w-[140px]">{att.name}</span>
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Chat Replies */}
                    {(selectedTicket.replies ?? []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted">
                        <p>এখনো কোনো উত্তর দেওয়া হয়নি।</p>
                        <p className="text-[11px] mt-1">অভিভাবককে উত্তর বা পরামর্শ পাঠাতে নিচের বক্স ব্যবহার করুন।</p>
                      </div>
                    ) : (
                      (selectedTicket.replies ?? []).map((r) => {
                        const isMe = r.author_name === user.name
                        const isGuardianMsg = r.author_role.startsWith('guardian')
                        const isTeacherMsg = r.author_role === 'teacher'
                        const isZimmadarMsg = r.author_role === 'zimmadar' || r.author_role === 'department_supervisor'

                        return (
                          <div
                            key={r.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                          >
                            <span className="text-[10px] text-muted px-1">
                              {isMe
                                ? 'আপনি'
                                : isGuardianMsg
                                  ? `👨‍💼 অভিভাবক: ${r.author_name}`
                                  : isTeacherMsg
                                    ? `👳‍♂️ উস্তাদ: ${r.author_name}`
                                    : isZimmadarMsg
                                      ? `🏢 জিম্মাদার: ${r.author_name}`
                                      : `👑 প্রিন্সিপাল: ${r.author_name}`}
                              {' · '}
                              <span className="font-mono">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>

                            <div
                              className={`max-w-[85%] rounded-2xl text-xs leading-relaxed shadow-3xs p-3 whitespace-pre-wrap ${
                                isMe
                                  ? 'bg-emerald-academy text-white rounded-tr-xs'
                                  : isGuardianMsg
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-tl-xs'
                                    : isTeacherMsg
                                      ? 'bg-sky-50 border border-sky-200 text-sky-950 rounded-tl-xs'
                                      : isZimmadarMsg
                                        ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-xs'
                                        : 'bg-purple-50 border border-purple-200 text-purple-950 rounded-tl-xs'
                              }`}
                            >
                              {r.message && <p>{r.message}</p>}

                              {/* Clean Embedded Media */}
                              {r.attachments && r.attachments.length > 0 && (
                                <div className={`pt-2 flex flex-wrap gap-2 ${r.message ? (isMe ? 'border-t border-white/20 mt-2' : 'border-t border-slate-200 mt-2') : ''}`}>
                                  {r.attachments.map((att, i) => {
                                    const isImg = att.type.startsWith('image/')
                                    return isImg ? (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setPreviewLightbox({ url: att.url, name: att.name })}
                                        className="group relative block rounded-xl overflow-hidden border border-black/10 hover:border-black/30 transition-all cursor-pointer shadow-3xs max-w-[240px]"
                                      >
                                        <img src={att.url} alt={att.name} className="w-full max-h-48 object-cover group-hover:scale-102 transition-transform" />
                                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                                          বড় করে দেখুন
                                        </div>
                                      </button>
                                    ) : (
                                      <a
                                        key={i}
                                        href={att.url}
                                        download={att.name}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
                                          isMe
                                            ? 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                                        }`}
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[140px]">{att.name}</span>
                                        <Download className="w-3 h-3 opacity-70" />
                                      </a>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Clean Fixed Reply Bar */}
                  <div className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2">
                    {/* Pending Reply Attachments Preview Chips */}
                    {replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {replyAttachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium"
                          >
                            {att.type.startsWith('image/') ? (
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-blue-700" />
                            )}
                            <span className="truncate max-w-[130px] text-[11px]">{att.name}</span>
                            <button
                              type="button"
                              onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleAddReply} className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={replyFileInputRef}
                        onChange={(e) => handleFileSelect(e, 'reply')}
                        accept="image/*,.pdf,.doc,.docx"
                        multiple
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => replyFileInputRef.current?.click()}
                        disabled={uploadingAttachment}
                        className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shrink-0"
                        title="ছবি, স্ক্রিনশট বা ফাইল সংযুক্ত করুন"
                      >
                        <Paperclip className="w-4 h-4 text-primary-700" />
                      </button>

                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="অভিভাবককে সরাসরি উত্তর লিখুন / পরামর্শ দিন..."
                        className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary-600"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-emerald-academy hover:bg-emerald-academy-dark text-white rounded-xl gap-1.5 px-4 cursor-pointer shadow-xs shrink-0 font-bold text-xs"
                      >
                        <Send className="w-3.5 h-3.5" /> পাঠান
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center text-xs text-muted">
                    তালিকা থেকে যেকোনো টিকেট নির্বাচন করুন বিস্তারিত বার্তা দেখার জন্য।
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRINCIPAL / SUPER ADMIN STAFF ATTENTION NOTICES */}
      {tab === 'notices' && !isGuardian && (
        <div className="space-y-4">
          {showNewNotice && isSuperAdmin && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-700" />
                  Broadcast Attention Notice to Zimmadars / Teachers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateNotice} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Notice Title"
                    placeholder="e.g. Monthly Exam Question Submission Deadline"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-xs font-semibold text-heading mb-1">Target Audience</label>
                    <select
                      value={noticeAudience}
                      onChange={(e) => setNoticeAudience(e.target.value as StaffAttentionNotice['target_audience'])}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                    >
                      <option value="all_staff">All Staff (Zimmadars &amp; Teachers)</option>
                      <option value="zimmadar">Zimmadars Only</option>
                      <option value="teacher">Teachers Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-heading mb-1">Priority</label>
                    <select
                      value={noticePriority}
                      onChange={(e) => setNoticePriority(e.target.value as 'normal' | 'urgent')}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                    >
                      <option value="urgent">Urgent Attention (Banner Alert)</option>
                      <option value="normal">Normal Notice</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-heading mb-1">Message</label>
                    <textarea
                      rows={3}
                      value={noticeMessage}
                      onChange={(e) => setNoticeMessage(e.target.value)}
                      placeholder="Write clear instructions for Zimmadars / Teachers..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg"
                      required
                    />
                  </div>
                  <div className="md:col-span-3 flex gap-2">
                    <Button type="submit">
                      <Send className="w-4 h-4" /> Publish Notice
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowNewNotice(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {visibleNotices.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-xs text-muted">
                No staff attention notices right now.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {visibleNotices.map((n) => {
                const acked = n.acknowledged_by.some((a) => a.user_id === user.id)
                return (
                  <Card
                    key={n.id}
                    className={
                      n.priority === 'urgent' && n.active
                        ? 'border-amber-300 bg-amber-50/40'
                        : undefined
                    }
                  >
                    <CardContent className="pt-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {n.priority === 'urgent' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3" /> Attention
                              </span>
                            )}
                            <p className="text-sm font-bold text-heading">{n.title}</p>
                          </div>
                          <p className="text-[11px] text-muted">
                            By {n.created_by} · Target:{' '}
                            {n.target_audience === 'all_staff'
                              ? 'All Staff'
                              : n.target_audience === 'zimmadar'
                                ? 'Zimmadars'
                                : 'Teachers'}{' '}
                            · {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isSuperAdmin && !acked && n.active && (
                            <Button size="sm" onClick={() => acknowledgeNotice(n.id)}>
                              <UserCheck className="w-3.5 h-3.5" /> Acknowledge
                            </Button>
                          )}
                          {!isSuperAdmin && acked && (
                            <Badge variant="approved">Acknowledged</Badge>
                          )}
                          {isSuperAdmin && (
                            <Button size="sm" variant="outline" onClick={() => toggleNoticeActive(n.id)}>
                              {n.active ? 'Archive Notice' : 'Reactivate'}
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-body whitespace-pre-wrap">{n.message}</p>

                      {isSuperAdmin && (() => {
                        const ackList = Array.isArray(n.acknowledged_by) ? n.acknowledged_by : []
                        return (
                          <div className="pt-2 border-t border-border/70 text-[11px] text-muted">
                            <strong>Acknowledged ({ackList.length}):</strong>{' '}
                            {ackList.length === 0
                              ? 'Waiting for staff acknowledgment'
                              : ackList.map((a) => `${a.name} (${a.role})`).join(', ')}
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── IMAGE / SCREENSHOT LIGHTBOX MODAL ── */}
      {previewLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewLightbox(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 bg-white/10 hover:bg-white/20 p-1.5 rounded-full cursor-pointer transition-colors"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewLightbox.url}
              alt={previewLightbox.name}
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain bg-black/40"
            />
            <div className="mt-2 text-center text-xs text-white/90 font-medium flex items-center gap-3">
              <span className="truncate max-w-sm">{previewLightbox.name}</span>
              <a
                href={previewLightbox.url}
                download={previewLightbox.name}
                className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <Download className="w-3.5 h-3.5" /> ডাউনলোড
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

