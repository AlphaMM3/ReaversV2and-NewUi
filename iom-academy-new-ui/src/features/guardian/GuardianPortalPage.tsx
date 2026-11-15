import { supportApi, useSupportTickets } from '@/lib/supportApi'
import { useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, toArray, type ClassSession } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { StudentAvatar } from '@/components/Student360Drawer'
import { useToast } from '@/components/ui/Toast'
import {
  useLocalStore,
  ACADEMY_BRANDING_KEY,
  DEFAULT_ACADEMY_BRANDING,
  compressImageToDataUrl,
  type AcademyBranding,
  type SupportTicket,
  type TicketAttachment,
  readFileAsAttachment,
  TICKET_RECIPIENT_OPTIONS,
} from '@/lib/superAdminStore'
import { deriveClassCapabilities } from '@/lib/stateMachines'
import { formatDhakaDate, formatDhakaTime, formatBDT } from '@/lib/utils'
import { navigateTo } from '@/lib/router'
import {
  Video, ExternalLink, CalendarOff, CreditCard, UploadCloud, CheckCircle2,
  Smartphone, Trophy, Sparkles, Ticket, Plus, Send, Search, MessageSquare,
  Paperclip, Image as ImageIcon, FileText, Download, X, Bell,
} from 'lucide-react'
import AmolTrackerCard from './AmolTrackerCard'

interface StudentOption {
  id: number
  full_name: string
}

interface GuardianPayment {
  id: number
  enrollment_id: number
  student_name?: string
  course_title?: string
  billing_month: string
  payment_status: string
  reference_code: string | null
  portal_url?: string | null
}

interface PaymentSubmissionRow {
  id: number
  invoice_id: number
  invoice_number?: string
  billing_month?: string
  student_name?: string
  payment_method: string
  trx_id: string
  amount: number
  sender_number?: string | null
  screenshot_data?: string | null
  status: string
  review_note?: string | null
  created_at: string
}

export default function GuardianPortalPage() {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [branding] = useLocalStore<AcademyBranding>(ACADEMY_BRANDING_KEY, DEFAULT_ACADEMY_BRANDING)
  const toast = useToast()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [proofInvoiceId, setProofInvoiceId] = useState<string>('')
  const [proofMethod, setProofMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Bank'>('bKash')
  const [proofTrxId, setProofTrxId] = useState('')
  const [proofAmount, setProofAmount] = useState('')
  const [proofSender, setProofSender] = useState('')
  const [proofNotes, setProofNotes] = useState('')
  const [proofScreenshot, setProofScreenshot] = useState('')
  const [submittingProof, setSubmittingProof] = useState(false)

  // Support Tickets Integration
  const { data: supportTickets = [], refetch: refreshTickets, isError: ticketError } = useSupportTickets()
  const [tokenSearch, setTokenSearch] = useState('')
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [activeChatTicketId, setActiveChatTicketId] = useState<string | null>(null)
  const [guardianReplyText, setGuardianReplyText] = useState('')
  const [tktCategory, setTktCategory] = useState<SupportTicket['category']>('fee')
  const [tktPriority, setTktPriority] = useState<'normal' | 'urgent'>('normal')
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('zim-hifz')
  const [tktSubject, setTktSubject] = useState('')
  const [tktDescription, setTktDescription] = useState('')

  // Attachment states & refs
  const [tktAttachments, setTktAttachments] = useState<TicketAttachment[]>([])
  const [guardianReplyAttachments, setGuardianReplyAttachments] = useState<TicketAttachment[]>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [previewLightbox, setPreviewLightbox] = useState<{ url: string; name: string } | null>(null)
  const tktFileInputRef = useRef<HTMLInputElement | null>(null)
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
        setTktAttachments((prev) => [...prev, ...newAtts])
      } else {
        setGuardianReplyAttachments((prev) => [...prev, ...newAtts])
      }
      toast.success(`${files.length}টি ফাইল / স্ক্রিনশট যুক্ত হয়েছে`)
    } catch {
      toast.error('ফাইল আপলোড করতে সমস্যা হয়েছে')
    } finally {
      setUploadingAttachment(false)
      e.target.value = ''
    }
  }

  const activeChatTicket = useMemo(() => {
    return supportTickets.find((t) => t.id === activeChatTicketId) || null
  }, [supportTickets, activeChatTicketId])

  async function handleSendGuardianReply(e: React.FormEvent) {
    e.preventDefault()
    if (!activeChatTicket || (!guardianReplyText.trim() && !guardianReplyAttachments.length)) return
    try {
      await supportApi.reply(activeChatTicket.id, { message: guardianReplyText.trim() || 'সংযুক্ত ফাইল দেখুন', attachments: guardianReplyAttachments })
      setGuardianReplyText('')
      setGuardianReplyAttachments([])
      await refreshTickets()
      toast.success('উত্তর সংরক্ষিত হয়েছে')
    } catch (error) {
      toast.error(error, 'উত্তর সংরক্ষণ করা যায়নি')
    }
  }

  async function handleCreateGuardianTicket(e: React.FormEvent) {
    e.preventDefault()
    try {
      const ticket = await supportApi.create({ subject: tktSubject, description: tktDescription,
        category: tktCategory, priority: tktPriority, target_role: selectedRecipientId === 'admin-1' || !activeChildId ? 'central_admin' : 'zimmadar',
        student_id: activeChildId ?? undefined, attachments: tktAttachments })
      await refreshTickets()
      setShowTicketModal(false)
      setTktSubject('')
      setTktDescription('')
      setTktAttachments([])
      setActiveChatTicketId(ticket.id)
      toast.success(`টিকেট সংরক্ষিত হয়েছে · #${ticket.token}`)
    } catch (error) {
      toast.error(error, 'টিকেট সংরক্ষণ করা যায়নি')
    }
  }
  const { data: children = [], isLoading } = useQuery<StudentOption[]>({
    queryKey: ['guardian-children'],
    queryFn: () => api.get<StudentOption[]>('/students'),
  })

  const activeChild = children.find((child) => child.id === selectedChildId) ?? children[0]
  const activeChildId = activeChild?.id ?? null

  const { data: classes = [] } = useQuery<ClassSession[]>({
    queryKey: ['guardian-classes'],
    queryFn: () => api.get<ClassSession[]>('/classes?limit=20'),
  })

  const { data: progress } = useQuery<any>({
    queryKey: ['guardian-progress', activeChildId],
    queryFn: () => api.get(`/guardian/learners/${activeChildId}/progress-summary`).catch(() => null),
    enabled: !!activeChildId,
  })

  const { data: payments = [] } = useQuery<GuardianPayment[]>({
    queryKey: ['guardian-payments'],
    queryFn: () => api.get<GuardianPayment[]>('/guardian/payments').catch(() => []),
  })

  const { data: invoicesRaw } = useQuery<any[]>({
    queryKey: ['guardian-invoices'],
    queryFn: () => api.get<any[]>('/invoices').catch(() => []),
  })
  const unpaidInvoices = useMemo(
    () =>
      toArray(invoicesRaw).filter(
        (inv) => Number(inv.amount_due || 0) - Number(inv.amount_paid || 0) > 0,
      ),
    [invoicesRaw],
  )

  const { data: submissionsRaw, refetch: refetchSubmissions } = useQuery<PaymentSubmissionRow[]>({
    queryKey: ['guardian-payment-submissions'],
    queryFn: () => api.get<PaymentSubmissionRow[]>('/guardian/payment-submissions').catch(() => []),
  })
  const submissions = toArray(submissionsRaw)

  async function handleSelectScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await compressImageToDataUrl(file, 900, 0.78)
      setProofScreenshot(dataUrl)
      toast.success('Receipt screenshot attached')
    } catch (err) {
      toast.error(err, 'Could not read receipt image')
    }
  }

  async function handleSubmitProof(e: React.FormEvent) {
    e.preventDefault()
    const targetInvId = Number(proofInvoiceId || unpaidInvoices[0]?.id || 0)
    if (!targetInvId) {
      toast.warning('Please select an unpaid tuition invoice')
      return
    }
    const amt = Number(proofAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.warning('Enter a valid paid amount in BDT')
      return
    }
    setSubmittingProof(true)
    try {
      await api.post('/guardian/payment-submissions', {
        invoice_id: targetInvId,
        payment_method: proofMethod,
        trx_id: proofTrxId.trim().toUpperCase(),
        amount: amt,
        sender_number: proofSender.trim() || undefined,
        screenshot_data: proofScreenshot || undefined,
        notes: proofNotes.trim() || undefined,
      })
      toast.success('Payment TrxID & receipt sent to Admin verification queue')
      setProofTrxId('')
      setProofAmount('')
      setProofSender('')
      setProofNotes('')
      setProofScreenshot('')
      if (fileRef.current) fileRef.current.value = ''
      void refetchSubmissions()
      void qc.invalidateQueries({ queryKey: ['admin-payment-submissions'] })
    } catch (err) {
      toast.error(err, 'Failed to submit payment proof')
    } finally {
      setSubmittingProof(false)
    }
  }

  const unreadTeacherReplies = useMemo(() => {
    return supportTickets.filter(
      (t) =>
        t.status !== 'resolved' &&
        t.replies.some((r) => !r.author_role.startsWith('guardian')),
    )
  }, [supportTickets])

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Unified Guardian Portal (AM-19)</h2>
          <p className="text-xs text-muted mt-0.5">
            Track all linked children across Group Batches & 1:1 classes from one dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { window.location.hash = '#/leaves' }}>
            <CalendarOff className="w-4 h-4" /> Apply Leave
          </Button>
          <Button size="sm" onClick={() => { window.location.hash = '#/invoices' }}>
            <CreditCard className="w-4 h-4" /> Invoices & Receipts
          </Button>
        </div>
      </div>

      {/* Live Unread Teacher Reply Notification Banner */}
      {unreadTeacherReplies.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 shadow-3xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-3xs">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-emerald-950 truncate">
                🔔 উস্তাদ / জিম্মাদারের নতুন উত্তর এসেছে!
              </p>
              <p className="text-[11px] text-emerald-800 truncate">
                টিকেট #{unreadTeacherReplies[0].token} ({unreadTeacherReplies[0].subject}) · সর্বশেষ উত্তর দেখতে ক্লিক করুন
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setActiveChatTicketId(unreadTeacherReplies[0].id)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-3.5 py-2 cursor-pointer shadow-xs shrink-0"
          >
            চ্যাট খুলুন →
          </Button>
        </div>
      )}

      {ticketError && <Button variant="outline" onClick={() => void refreshTickets()}>টিকেট লোড হয়নি · আবার চেষ্টা করুন</Button>}
      {/* Child switcher */}
      {isLoading ? (
        <Skeleton className="h-12" />
      ) : children.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedChildId(c.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeChildId === c.id
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'bg-surface border border-border text-body hover:bg-primary-50'
              }`}
            >
              <StudentAvatar studentId={c.id} name={c.full_name} size="xs" /> {c.full_name}
            </button>
          ))}
        </div>
      )}

      {activeChild && (
        <AmolTrackerCard key={activeChild.id} studentId={activeChild.id} studentName={activeChild.full_name} isHifz />
      )}

      <Card className="p-4 rounded-2xl border-border bg-surface shadow-2xs">
        <p className="text-sm text-muted">এই পোর্টালে হিফজ ডায়েরি এখন উপলব্ধ নেই।</p>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary-700" /> Recent & Upcoming Live Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {classes.length === 0 ? (
              <p className="text-xs text-muted py-6 text-center">No classes scheduled yet.</p>
            ) : (
              classes.slice(0, 6).map((cls) => {
                const cap = deriveClassCapabilities(cls)
                return (
                <div key={cls.id} data-entity="class_session" data-state={cap.status} className="p-3 rounded-xl border border-border flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-heading">{cls.course_title}</p>
                    <p className="text-xs text-muted">
                      {cls.batch_name} · {formatDhakaDate(cls.scheduled_start)} {formatDhakaTime(cls.scheduled_start)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cap.badgeVariant}>{cap.label}</Badge>
                    {cls.meeting_url && (
                      <a
                        href={cls.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-700 text-xs font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" /> Join
                      </a>
                    )}
                  </div>
                </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Progress & Payments */}
        <div className="space-y-6">
          {/* Monthly Star Students Leaderboard */}
          <Card className="rounded-2xl border-amber-300/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 shadow-xs">
            <CardHeader className="pb-3 border-b border-amber-200/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-950">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  Monthly Star Students Leaderboard · নভেম্বর ২০২৬
                </CardTitle>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-700" /> Top Performer
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 mt-0.5">
                উপস্থিতি, ডেইলি পড়া (সবক), হোমওয়ার্ক ও মাসিক কুইজের ১০০ পয়েন্ট মূল্যায়নে সেরা শিক্ষার্থীরা।
              </p>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5">
              <div className="divide-y divide-amber-200/50">
                <div className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xs shadow-xs">
                      ১
                    </span>
                    <div>
                      <p className="font-bold text-heading">মারিয়াম বিনতে রফিক</p>
                      <p className="text-[11px] text-muted">তাজবীদ ব্যাচ ১ · স্কোর: ৯৮/১০০ (ممتاز)</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-lg border border-amber-200">
                    🥇 ১ম স্থান (Star)
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                      ২
                    </span>
                    <div>
                      <p className="font-bold text-heading">মুহাম্মাদ আনাস ইসলাম</p>
                      <p className="text-[11px] text-muted">হিফজুল কুরআন · স্কোর: ৯৪/১০০ (جيد جداً)</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    🥈 ২য় স্থান
                  </span>
                </div>

                <div className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-900 font-bold flex items-center justify-center text-xs">
                      ৩
                    </span>
                    <div>
                      <p className="font-bold text-heading">আব্দুল্লাহ আল মাহমুদ</p>
                      <p className="text-[11px] text-muted">নাজেরা ব্যাচ · স্কোর: ৯০/১০০ (جيد جداً)</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    🥉 ৩য় স্থান
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-primary-50/70 border border-primary-200/80 text-[11px] text-primary-950 flex items-center justify-between">
                <span>🌟 আপনার সন্তানের রেটিং: <strong>১ম স্থান</strong> (১০০% উপস্থিতি + নিয়মিত সবক)</span>
                <span className="font-bold text-primary-700 cursor-pointer hover:underline">Shoutout Sanad →</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Published Academic Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {!progress ? (
                <p className="text-xs text-muted py-4 text-center">
                  No published progress summary available for this child yet.
                </p>
              ) : (
                <pre className="text-xs bg-bg p-3 rounded-lg overflow-auto max-h-48">
                  {JSON.stringify(progress, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verified Payment References</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {payments.length === 0 ? (
                <p className="text-xs text-muted py-4 text-center">
                  Check the <strong>Invoices & Receipts</strong> tab for fee invoices and WhatsApp/Telegram receipts.
                </p>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg border border-border flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-heading">{p.course_title || `Enrollment #${p.enrollment_id}`}</p>
                      <p className="text-muted">Month: {p.billing_month} · Ref: {p.reference_code || '—'}</p>
                    </div>
                    <Badge variant={p.payment_status === 'paid' ? 'approved' : 'pending'}>
                      {p.payment_status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Guardian bKash / Nagad Screenshot & TrxID Self-Submit Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary-700" />
              Submit Tuition Fee Proof (bKash / Nagad TrxID + Screenshot)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex flex-wrap gap-3 justify-between">
              <span><strong>bKash:</strong> {branding.bkashNumber}</span>
              <span><strong>Nagad:</strong> {branding.nagadNumber}</span>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-heading">Select Unpaid Invoice</label>
                  <select
                    value={proofInvoiceId || String(unpaidInvoices[0]?.id || '')}
                    onChange={(e) => {
                      setProofInvoiceId(e.target.value)
                      const found = unpaidInvoices.find((i) => String(i.id) === e.target.value)
                      if (found && !proofAmount) {
                        const bal = Math.max(0, Number(found.amount_due) - Number(found.amount_paid))
                        setProofAmount(String(bal))
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-bg"
                  >
                    <option value="">-- Choose invoice --</option>
                    {unpaidInvoices.map((inv) => {
                      const bal = Math.max(0, Number(inv.amount_due) - Number(inv.amount_paid))
                      return (
                        <option key={inv.id} value={inv.id}>
                          {inv.student_name} · {inv.billing_month} (Due ৳{bal})
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-heading">Payment Channel</label>
                  <select
                    value={proofMethod}
                    onChange={(e) => setProofMethod(e.target.value as 'bKash' | 'Nagad' | 'Rocket' | 'Bank')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-bg"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Transaction ID (TrxID)"
                  required
                  placeholder="e.g. BL9K4X20QP"
                  value={proofTrxId}
                  onChange={(e) => setProofTrxId(e.target.value)}
                />
                <Input
                  label="Amount Sent (BDT)"
                  type="number"
                  required
                  min="1"
                  placeholder="1500"
                  value={proofAmount}
                  onChange={(e) => setProofAmount(e.target.value)}
                />
                <Input
                  label="Sender Mobile"
                  placeholder="017XXXXXXXX"
                  value={proofSender}
                  onChange={(e) => setProofSender(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <Input
                  label="Optional Note"
                  placeholder="Paid for November tuition"
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                />
                <div className="space-y-1">
                  <label className="text-xs font-medium text-heading">Payment Receipt Screenshot</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleSelectScreenshot}
                    className="block w-full text-xs text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-800 hover:file:bg-primary-100"
                  />
                </div>
              </div>

              {proofScreenshot && (
                <div className="flex items-center gap-3 p-2 rounded-xl border border-border bg-bg/50">
                  <img src={proofScreenshot} alt="Payment receipt preview" className="w-16 h-16 object-cover rounded-lg border border-border" />
                  <div className="text-xs">
                    <p className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Screenshot ready to upload
                    </p>
                    <button
                      type="button"
                      onClick={() => { setProofScreenshot(''); if (fileRef.current) fileRef.current.value = '' }}
                      className="block text-[11px] text-red-700 underline mt-1"
                    >
                      Remove screenshot
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" loading={submittingProof} disabled={unpaidInvoices.length === 0}>
                <UploadCloud className="w-4 h-4" /> Submit TrxID &amp; Receipt to Accounts
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle>Submitted Fee Receipts Status ({submissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-xs text-muted py-8 text-center">
                No self-submitted payment screenshots yet. Once you submit a TrxID &amp; receipt, live verification status appears here.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-3 rounded-xl border border-border flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      {sub.screenshot_data && (
                        <img
                          src={sub.screenshot_data}
                          alt={sub.trx_id}
                          className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-bold text-heading">
                          {sub.payment_method} · <span className="font-mono">{sub.trx_id}</span> · {formatBDT(sub.amount)}
                        </p>
                        <p className="text-muted">
                          {sub.student_name} · {sub.invoice_number} ({sub.billing_month})
                        </p>
                        {sub.review_note && <p className="text-[11px] text-primary-700 mt-0.5">Accounts Note: {sub.review_note}</p>}
                      </div>
                    </div>
                    <Badge variant={sub.status === 'approved' ? 'approved' : sub.status === 'rejected' ? 'returned' : 'pending'}>
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 5. HELP DESK, SUPPORT TICKETS & TOKEN TRACKING (GUARDIAN PORTAL INTEGRATION) ── */}
      <Card className="rounded-2xl border-primary-200/90 bg-gradient-to-br from-primary-50/20 via-white to-primary-50/10 shadow-xs">
        <CardHeader className="pb-3 border-b border-primary-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-primary-950">
              <Ticket className="w-4 h-4 text-primary-700" />
              সাহায্য ও সাপোর্ট টিকেট (Help Desk & Tracked Tokens)
            </CardTitle>
            <p className="text-xs text-muted mt-0.5">
              ফি, ব্যাচ পরিবর্তন বা অ্যাকাডেমিক যেকোনো সমস্যায় টোকেন টিকেট খুলুন এবং অগ্রগতি ট্র্যাক করুন
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => setShowTicketModal(true)}
              className="bg-emerald-academy hover:bg-emerald-academy-dark text-white rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> নতুন টিকেট খুলুন
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateTo('#/tickets')}
              className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer text-primary-800 border-primary-200 hover:bg-primary-50"
            >
              <MessageSquare className="w-3.5 h-3.5" /> টিকেট ইনবক্স দেখুন
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Quick Token Search / Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="টোকেন নম্বর খুঁজুন (যেমন: TKT-1085)..."
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-bg/60 focus:bg-white focus:outline-none focus:border-primary-500"
              />
            </div>
            {tokenSearch && (
              <button
                type="button"
                onClick={() => setTokenSearch('')}
                className="text-xs text-muted hover:text-heading cursor-pointer"
              >
                রিসেট
              </button>
            )}
          </div>

          {/* Ticket List */}
          {(() => {
            const myTickets = supportTickets
              .filter((t) => {
                if (!tokenSearch.trim()) return true
                const q = tokenSearch.toLowerCase()
                return t.token.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)
              })
              .slice(0, 5)

            if (myTickets.length === 0) {
              return (
                <div className="py-8 text-center text-xs text-muted border border-dashed border-border rounded-xl bg-bg/30">
                  <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">কোনো সক্রিয় সাপোর্ট টিকেট নেই</p>
                  <p className="text-[11px] text-muted mt-0.5">যেকোনো সহায়তার জন্য উপরের "+ নতুন টিকেট খুলুন" বোতামে চাপুন।</p>
                </div>
              )
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myTickets.map((tkt) => (
                  <div
                    key={tkt.id}
                    onClick={() => setActiveChatTicketId(tkt.id)}
                    className="p-3.5 rounded-xl border border-border bg-white hover:border-primary-400 hover:shadow-xs transition-all cursor-pointer shadow-3xs space-y-2 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                          #{tkt.token}
                        </span>
                        {tkt.priority === 'urgent' && <Badge variant="absent">জরুরি</Badge>}
                      </div>
                      <Badge
                        variant={
                          tkt.status === 'resolved'
                            ? 'approved'
                            : tkt.status === 'in_progress'
                              ? 'pending'
                              : 'neutral'
                        }
                      >
                        {tkt.status === 'resolved'
                          ? 'সমাধান হয়েছে'
                          : tkt.status === 'in_progress'
                            ? 'ইন প্রগ্রেস'
                            : 'ওপেন'}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-heading group-hover:text-primary-700 transition-colors line-clamp-1">
                        {tkt.subject}
                      </h4>
                      <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                        {tkt.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-muted">
                      <span>শিক্ষার্থী: {tkt.student_name || 'আব্দুল্লাহ'}</span>
                      <span className="flex items-center gap-1 font-bold text-primary-700">
                        <MessageSquare className="w-3 h-3 text-primary-600" />
                        {tkt.replies.length} টি উত্তর · সরাসরি চ্যাট করুন 💬
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* New Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-border max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary-700" />
                <h3 className="text-base font-bold text-heading">নতুন সাপোর্ট টিকেট খুলুন</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="text-muted hover:text-heading cursor-pointer text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGuardianTicket} className="space-y-3">
              {/* Recipient Selection (Zimmadar / Teacher / Admin) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্রাপক নির্বাচন করুন (কার কাছে বার্তা পাঠাবেন) *
                </label>
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-slate-50 cursor-pointer focus:bg-white focus:outline-none focus:border-primary-500"
                >
                  <optgroup label="🏛️ কোর্স জিম্মাদার (বিভাগীয় প্রধান)">
                    {TICKET_RECIPIENT_OPTIONS.filter((o) => o.group === 'কোর্স জিম্মাদার').map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} — {o.course}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="👳‍♂️ ক্লাস শিক্ষক / উস্তাদবৃন্দ">
                    {TICKET_RECIPIENT_OPTIONS.filter((o) => o.group === 'ক্লাস শিক্ষক / উস্তাদ').map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} — {o.course}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="👑 একাডেমি প্রশাসন (অ্যাডমিন)">
                    {TICKET_RECIPIENT_OPTIONS.filter((o) => o.group === 'কেন্দ্রীয় প্রশাসন').map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} — {o.course}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ক্যাটাগরি</label>
                <select
                  value={tktCategory}
                  onChange={(e) => setTktCategory(e.target.value as SupportTicket['category'])}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-slate-50 cursor-pointer"
                >
                  <option value="fee">ফি ও পেমেন্ট সংক্রান্ত (Fee & Payment)</option>
                  <option value="batch">ব্যাচ / রুটিন পরিবর্তন (Batch & Routine)</option>
                  <option value="academic">পড়ালেখা ও হিফজ প্রগ্রেস (Academic)</option>
                  <option value="technical">পোর্টাল / জুম টেকনিক্যাল ইস্যু (Technical)</option>
                  <option value="general">সাধারণ জিজ্ঞাসা / অভিযোগ (General)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">অগ্রাধিকার (Priority)</label>
                <select
                  value={tktPriority}
                  onChange={(e) => setTktPriority(e.target.value as 'normal' | 'urgent')}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-slate-50 cursor-pointer"
                >
                  <option value="normal">সাধারণ (Normal)</option>
                  <option value="urgent">জরুরি (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">বিষয় (Subject)</label>
                <input
                  type="text"
                  placeholder="যেমন: ৩য় কিস্তির ফি পরিশোধ করেছি কিন্তু এখনো আনপেইড দেখাচ্ছে"
                  value={tktSubject}
                  onChange={(e) => setTktSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:border-primary-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">বিস্তারিত বিবরণ (Details)</label>
                <textarea
                  rows={3}
                  placeholder="সমস্যার বিস্তারিত বর্ণনা ও প্রয়োজনীয় তথ্য লিখুন..."
                  value={tktDescription}
                  onChange={(e) => setTktDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              {/* Attachments Picker */}
              <div className="space-y-2">
                <input
                  ref={tktFileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect(e, 'ticket')}
                  className="hidden"
                />
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">ফাইল / স্ক্রিনশট সংযুক্ত করুন (ঐচ্ছিক)</label>
                  <button
                    type="button"
                    onClick={() => tktFileInputRef.current?.click()}
                    disabled={uploadingAttachment}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-academy bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{uploadingAttachment ? 'আপলোড হচ্ছে...' : 'যুক্ত করুন'}</span>
                  </button>
                </div>

                {tktAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tktAttachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs"
                      >
                        {att.type.startsWith('image/') ? (
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                        <span className="max-w-[140px] truncate font-medium text-[11px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setTktAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                          title="মুছে ফেলুন"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowTicketModal(false)} className="rounded-xl text-xs cursor-pointer">
                  বাতিল
                </Button>
                <Button type="submit" className="bg-emerald-academy hover:bg-emerald-academy-dark text-white rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-xs">
                  <Send className="w-3.5 h-3.5" /> টিকেট জমা দিন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── GUARDIAN LIVE TICKET CHAT MODAL ── */}
      {activeChatTicket && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full flex flex-col h-[620px] max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/90 flex items-start justify-between gap-3 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded-md border border-primary-200">
                    #{activeChatTicket.token}
                  </span>
                  <Badge
                    variant={
                      activeChatTicket.status === 'resolved'
                        ? 'approved'
                        : activeChatTicket.status === 'in_progress'
                          ? 'pending'
                          : 'neutral'
                    }
                  >
                    {activeChatTicket.status === 'resolved'
                      ? 'সমাধান হয়েছে'
                      : activeChatTicket.status === 'in_progress'
                        ? 'ইন প্রগ্রেস'
                        : 'ওপেন (অপেক্ষমাণ)'}
                  </Badge>
                  {activeChatTicket.priority === 'urgent' && <Badge variant="absent">জরুরি</Badge>}
                </div>
                <h3 className="text-sm font-extrabold text-heading mt-1.5 line-clamp-1">
                  {activeChatTicket.subject}
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  শিক্ষার্থী: <strong>{activeChatTicket.student_name || 'শিক্ষার্থী'}</strong> · প্রাপক:{' '}
                  <strong className="text-primary-800">{activeChatTicket.target_recipient || (activeChatTicket.target_role === 'central_admin' ? 'সুপার অ্যাডমিন' : activeChatTicket.target_role === 'teacher' ? 'ক্লাস শিক্ষক' : 'জিম্মাদার')}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveChatTicketId(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
                title="চ্যাট বন্ধ করুন"
              >
                ✕
              </button>
            </div>

            {/* Chat Body & Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
              {/* Initial Issue Description Bubble */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 text-xs shadow-3xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-800">
                    👨‍💼 {activeChatTicket.created_by_name} (আপনার মূল আবেদন):
                  </span>
                  <span>{new Date(activeChatTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pt-0.5">
                  {activeChatTicket.description}
                </p>

                {/* Attachments if any */}
                {activeChatTicket.attachments && activeChatTicket.attachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                    {activeChatTicket.attachments.map((att, i) => (
                      <div key={i}>
                        {att.type.startsWith('image/') ? (
                          <button
                            type="button"
                            onClick={() => setPreviewLightbox({ url: att.url, name: att.name })}
                            className="group relative block rounded-xl overflow-hidden border border-slate-200 hover:border-primary-400 transition-all cursor-pointer shadow-3xs"
                          >
                            <img src={att.url} alt={att.name} className="w-24 h-20 object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                              বড় করুন
                            </div>
                          </button>
                        ) : (
                          <a
                            href={att.url}
                            download={att.name}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[11px] transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span className="max-w-[120px] truncate">{att.name}</span>
                            <Download className="w-3 h-3 text-slate-400" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Thread Replies */}
              {activeChatTicket.replies.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">
                  <p>উস্তাদ বা জিম্মাদার এখনো উত্তর দেননি। উত্তর আসলেই এখানে ভেসে উঠবে।</p>
                  <p className="text-[11px] mt-1">প্রয়োজনে নিচে আরও বার্তা বা স্ক্রিনশট লিখে পাঠাতে পারেন।</p>
                </div>
              ) : (
                activeChatTicket.replies.map((rep) => {
                  const isMe = rep.author_role.startsWith('guardian')
                  const isTeacherRep = rep.author_role === 'teacher'
                  const isZimmadarRep = rep.author_role === 'zimmadar' || rep.author_role === 'department_supervisor'

                  return (
                    <div
                      key={rep.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <span className="text-[10px] text-muted px-1">
                        {isMe
                          ? 'আপনি (অভিভাবক)'
                          : isTeacherRep
                            ? `👳‍♂️ উস্তাদ: ${rep.author_name}`
                            : isZimmadarRep
                              ? `🏢 জিম্মাদার: ${rep.author_name}`
                              : `👑 প্রিন্সিপাল: ${rep.author_name}`}
                        {' · '}
                        {new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-3xs whitespace-pre-wrap ${
                          isMe
                            ? 'bg-emerald-academy text-white rounded-tr-xs'
                            : isTeacherRep
                              ? 'bg-sky-50 border border-sky-200 text-sky-950 rounded-tl-xs'
                              : isZimmadarRep
                                ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-xs'
                                : 'bg-purple-50 border border-purple-200 text-purple-950 rounded-tl-xs'
                        }`}
                      >
                        {rep.message && <p>{rep.message}</p>}

                        {/* Reply Attachments */}
                        {rep.attachments && rep.attachments.length > 0 && (
                          <div className={`pt-2 flex flex-wrap gap-2 ${rep.message ? (isMe ? 'border-t border-white/20 mt-2' : 'border-t border-slate-200 mt-2') : ''}`}>
                            {rep.attachments.map((att, i) => (
                              <div key={i}>
                                {att.type.startsWith('image/') ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewLightbox({ url: att.url, name: att.name })}
                                    className="group relative block rounded-xl overflow-hidden border border-black/10 hover:border-black/30 transition-all cursor-pointer shadow-3xs max-w-[240px]"
                                  >
                                    <img src={att.url} alt={att.name} className="w-full max-h-48 object-cover group-hover:scale-102 transition-transform" />
                                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                                      বড় করুন
                                    </div>
                                  </button>
                                ) : (
                                  <a
                                    href={att.url}
                                    download={att.name}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                                      isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-800'
                                    }`}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span className="max-w-[120px] truncate">{att.name}</span>
                                    <Download className="w-3 h-3 opacity-70" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Chat Reply Form */}
            <form onSubmit={handleSendGuardianReply} className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 shrink-0">
              <input
                ref={replyFileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => handleFileSelect(e, 'reply')}
                className="hidden"
              />

              {/* Pending Attachments Chips */}
              {guardianReplyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  {guardianReplyAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]"
                    >
                      {att.type.startsWith('image/') ? (
                        <ImageIcon className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <FileText className="w-3 h-3 text-blue-600" />
                      )}
                      <span className="max-w-[120px] truncate">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setGuardianReplyAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => replyFileInputRef.current?.click()}
                  disabled={uploadingAttachment}
                  className="p-2 rounded-xl text-slate-500 hover:text-emerald-academy hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  title="ফাইল বা স্ক্রিনশট সংযুক্ত করুন"
                >
                  <Paperclip className="w-4 h-4 text-primary-700" />
                </button>
                <input
                  type="text"
                  placeholder="উস্তাদ বা জিম্মাদারের জন্য বার্তা লিখুন..."
                  value={guardianReplyText}
                  onChange={(e) => setGuardianReplyText(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:border-primary-500"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-academy hover:bg-emerald-academy-dark text-white rounded-xl text-xs font-bold gap-1 px-4 cursor-pointer shadow-xs shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> পাঠান
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── HIGH RESOLUTION LIGHTBOX MODAL ── */}
      {previewLightbox && (
        <div
          onClick={() => setPreviewLightbox(null)}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-700"
          >
            <div className="px-4 py-2.5 bg-slate-800 text-white flex items-center justify-between text-xs font-bold border-b border-slate-700">
              <span className="truncate max-w-[80%]">{previewLightbox.name}</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewLightbox.url}
                  download={previewLightbox.name}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> ডাউনলোড
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewLightbox(null)}
                  className="text-slate-400 hover:text-white p-1 text-base cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/60 overflow-auto">
              <img
                src={previewLightbox.url}
                alt={previewLightbox.name}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

