import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/KpiCard'
import { useToast } from '@/components/ui/Toast'
import { buildWhatsAppUrl, buildTelegramShareUrl } from '@/lib/messaging'
import { formatDhakaDateTime } from '@/lib/utils'
import { MessageCircle, Send, Bell, Megaphone, RefreshCw, Link2, Unlink } from 'lucide-react'

interface Announcement {
  id: number
  title: string
  body: string
  created_at: string
}

interface NotificationItem {
  id: number
  title?: string
  message: string
  read_at?: string | null
  created_at: string
}

interface DeliveryRow {
  id: number
  channel: string
  status: string
  error_code?: string | null
  created_at: string
}

interface TelegramStatus {
  linked: boolean
  configuration_required: boolean
}

export default function CommunicationsPage({ role }: { role: string }) {
  const isStaff = !role.startsWith('guardian')
  const [waPhone, setWaPhone] = useState('')
  const [waText, setWaText] = useState('Assalamu Alaikum! Reminder from IOM Itqaan Academy: ')
  const [annTitle, setAnnTitle] = useState('')
  const [annBody, setAnnBody] = useState('')
  const [postingAnn, setPostingAnn] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const qc = useQueryClient()
  const toast = useToast()

  const { data: telegram } = useQuery<TelegramStatus>({
    queryKey: ['telegram-status'],
    queryFn: () => api.get<TelegramStatus>('/telegram'),
  })

  const { data: announcements = [], isLoading: loadingAnn } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => api.get<Announcement[]>('/announcements'),
  })

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get<NotificationItem[]>('/notifications'),
  })

  const { data: deliveries = [] } = useQuery<DeliveryRow[]>({
    queryKey: ['notification-deliveries'],
    queryFn: () => api.get<DeliveryRow[]>('/notification-deliveries').catch(() => []),
    enabled: isStaff,
  })

  async function postAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    setPostingAnn(true)
    try {
      await api.post('/announcements', { title: annTitle.trim(), body: annBody.trim() })
      setAnnTitle('')
      setAnnBody('')
      toast.success('Announcement published')
      qc.invalidateQueries({ queryKey: ['announcements'] })
    } catch (err) {
      toast.error(err, 'Failed to publish announcement')
    } finally {
      setPostingAnn(false)
    }
  }

  async function generateTelegramLink() {
    try {
      const res = await api.post<{ url: string }>('/telegram/link-token', {})
      setLinkUrl(res.url)
      toast.success('Telegram link generated')
    } catch (err) {
      toast.error(err, 'Telegram bot username not configured on server yet.')
    }
  }

  async function unlinkTelegram() {
    try {
      await api.post('/telegram/unlink', {})
      setLinkUrl('')
      toast.info('Telegram account unlinked')
      qc.invalidateQueries({ queryKey: ['telegram-status'] })
    } catch (err) {
      toast.error(err, 'Failed to unlink')
    }
  }

  async function retryDelivery(id: number) {
    try {
      await api.post(`/notification-deliveries/${id}/retry`, {})
      toast.success('Retry queued')
      qc.invalidateQueries({ queryKey: ['notification-deliveries'] })
    } catch (err) {
      toast.error(err, 'Retry not permitted right now')
    }
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold text-heading">WhatsApp, Telegram & Academy Messaging</h2>
        <p className="text-xs text-muted mt-0.5">
          Send direct WhatsApp & Telegram messages, link your Telegram alert bot, publish announcements, and inspect delivery outbox
        </p>
      </div>

      {/* Top Grid: Direct WhatsApp/Telegram Composer + Telegram Bot Connection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick WhatsApp & Telegram Dispatch</CardTitle>
            <Badge variant="secondary">Online Guardian Care</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Recipient WhatsApp Number (optional)"
                placeholder="e.g. 01712345678 or +8801..."
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
              />
              <div className="text-xs text-muted flex items-end pb-2">
                Tip: From <strong className="mx-1">Invoices & Receipts</strong> you can send formatted fee invoices & receipts in one click.
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-heading block mb-1">Message</label>
              <textarea
                rows={4}
                value={waText}
                onChange={(e) => setWaText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <a
                href={buildWhatsAppUrl(waText, waPhone)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4" /> Send on WhatsApp
              </a>
              <a
                href={buildTelegramShareUrl(waText)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
              >
                <Send className="w-4 h-4" /> Send on Telegram
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Telegram Bot Alerts</CardTitle>
            <Badge variant={telegram?.linked ? 'approved' : 'pending'}>
              {telegram?.linked ? 'Linked' : 'Not Linked'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted">
              Connect your personal Telegram account to receive instant overdue report alerts, absence escalations, and guardian notices.
            </p>
            {telegram?.configuration_required && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                Server bot token/username is not set in local preview (`ACADEMY_TELEGRAM_BOT_USERNAME`). Direct Telegram share links above still work immediately.
              </div>
            )}
            {linkUrl && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-xs">
                <p className="font-semibold text-primary-900 mb-1">Open link in Telegram:</p>
                <a href={linkUrl} target="_blank" rel="noreferrer" className="text-primary-700 underline break-all">
                  {linkUrl}
                </a>
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={generateTelegramLink}>
                <Link2 className="w-4 h-4" /> Link Telegram
              </Button>
              {telegram?.linked && (
                <Button size="sm" variant="danger" onClick={unlinkTelegram}>
                  <Unlink className="w-4 h-4" /> Unlink
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary-700" /> Academy Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isStaff && (
              <form onSubmit={postAnnouncement} className="space-y-3 border-b border-border pb-4">
                <Input label="Announcement Title" required value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
                <textarea
                  rows={2}
                  required
                  placeholder="Write announcement for staff & guardians…"
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-bg"
                />
                <Button size="sm" type="submit" loading={postingAnn}>Publish Notice</Button>
              </form>
            )}
            {loadingAnn ? (
              <Skeleton className="h-24" />
            ) : announcements.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">No announcements published yet.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl bg-bg border border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-heading">{a.title}</p>
                      <span className="text-[11px] text-muted">{formatDhakaDateTime(a.created_at)}</span>
                    </div>
                    <p className="text-xs text-body mt-1 whitespace-pre-wrap">{a.body}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-700" /> Notifications & Delivery Outbox
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.length === 0 && deliveries.length === 0 ? (
              <p className="text-xs text-muted py-8 text-center">No notifications or outbox deliveries yet.</p>
            ) : (
              <>
                {notifications.slice(0, 6).map((n) => (
                  <div key={n.id} className="p-3 rounded-lg border border-border flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-heading">{n.title || 'Academy Alert'}</p>
                      <p className="text-xs text-body mt-0.5">{n.message}</p>
                    </div>
                    <Badge variant={n.read_at ? 'neutral' : 'pending'}>{n.read_at ? 'Read' : 'New'}</Badge>
                  </div>
                ))}
                {deliveries.slice(0, 5).map((d) => (
                  <div key={d.id} className="p-2.5 rounded-lg bg-bg border border-border flex items-center justify-between text-xs">
                    <span>
                      <strong>{d.channel}</strong> · {d.status} {d.error_code ? `(${d.error_code})` : ''}
                    </span>
                    {['failed', 'unknown'].includes(d.status) && (
                      <Button size="sm" variant="outline" onClick={() => retryDelivery(d.id)}>
                        <RefreshCw className="w-3 h-3" /> Retry
                      </Button>
                    )}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

