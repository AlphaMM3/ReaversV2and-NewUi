import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, toArray } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { buildTelegramShareUrl, buildWhatsAppUrl } from '@/lib/messaging'
import {
  ACADEMY_BRANDING_KEY,
  type AcademyBranding,
  AUTOMATION_RULES_KEY,
  type AutomationRule,
  DEFAULT_ACADEMY_BRANDING,
  DEFAULT_AUTOMATION_RULES,
  exportAllSuperAdminData,
  importAllSuperAdminData,
  useLocalStore,
} from '@/lib/superAdminStore'
import {
  BellRing, Building2, Database, ShieldAlert, Download, Upload,
  MessageCircle, Send, Zap, RefreshCw, LogOut, CheckCircle, Clock, Radio,
} from 'lucide-react'

type SystemTab = 'automation' | 'branding' | 'backups'

interface DeliveryRow {
  id: number
  event_key: string
  route: string
  stage: string
  title: string
  status: string
  attempt_count: number
  created_at: string
  error_code?: string | null
}

export default function SystemHubPage({ role }: { role: string }) {
  const toast = useToast()
  const isCentral = role === 'central_admin'
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [tab, setTab] = useState<SystemTab>('automation')
  const [rules, setRules] = useLocalStore<AutomationRule[]>(AUTOMATION_RULES_KEY, DEFAULT_AUTOMATION_RULES)
  const [branding, setBranding] = useLocalStore<AcademyBranding>(ACADEMY_BRANDING_KEY, DEFAULT_ACADEMY_BRANDING)

  const [runningWorkflow, setRunningWorkflow] = useState(false)
  const [runningAutoCron, setRunningAutoCron] = useState(false)
  const [savingWebhookCfg, setSavingWebhookCfg] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [healthResult, setHealthResult] = useState<{ health?: string; ready?: string; checkedAt?: string }>({})

  const { data: deliveriesRaw, refetch: refetchDeliveries } = useQuery({
    queryKey: ['system-notification-deliveries'],
    queryFn: () => api.get<DeliveryRow[]>('/notification-deliveries'),
  })
  const deliveries = toArray(deliveriesRaw)

  const { data: autoStatus, refetch: refetchAutoStatus } = useQuery<any>({
    queryKey: ['system-automation-status'],
    queryFn: () => api.get('/automation/status').catch(() => null),
  })

  const [cronEnabled, setCronEnabled] = useState(true)
  const [cronLeadMins, setCronLeadMins] = useState('15')
  const [tgBotToken, setTgBotToken] = useState('')
  const [tgChatId, setTgChatId] = useState('')
  const [waPhoneId, setWaPhoneId] = useState('')
  const [waAccessToken, setWaAccessToken] = useState('')
  const [waDefaultTo, setWaDefaultTo] = useState('')
  const [customWebhookUrl, setCustomWebhookUrl] = useState('')

  useEffect(() => {
    const cfg = autoStatus?.config
    if (!cfg) return
    setCronEnabled(Boolean(cfg.enabled))
    setCronLeadMins(String(cfg.lead_minutes ?? 15))
    setTgChatId(cfg.telegram_default_chat_id || '')
    setWaPhoneId(cfg.whatsapp_phone_number_id || '')
    setWaDefaultTo(cfg.whatsapp_default_recipient || '')
    setCustomWebhookUrl(cfg.custom_webhook_url || '')
  }, [autoStatus])

  async function saveWebhookConfig(e: React.FormEvent) {
    e.preventDefault()
    setSavingWebhookCfg(true)
    try {
      const payload: Record<string, unknown> = {
        enabled: cronEnabled,
        lead_minutes: Number(cronLeadMins) || 15,
        telegram_default_chat_id: tgChatId.trim(),
        whatsapp_phone_number_id: waPhoneId.trim(),
        whatsapp_default_recipient: waDefaultTo.trim(),
        custom_webhook_url: customWebhookUrl.trim(),
      }
      if (tgBotToken.trim()) payload.telegram_bot_token = tgBotToken.trim()
      if (waAccessToken.trim()) payload.whatsapp_access_token = waAccessToken.trim()
      await api.put('/automation/config', payload)
      toast.success('Backend Cron & WhatsApp/Telegram Webhook settings saved to MySQL')
      setTgBotToken('')
      setWaAccessToken('')
      void refetchAutoStatus()
    } catch (err) {
      toast.error(err, 'Failed to save webhook configuration')
    } finally {
      setSavingWebhookCfg(false)
    }
  }

  async function runAutoCronNow(forcePreview = false) {
    setRunningAutoCron(true)
    try {
      const res = await api.post<any>('/automation/run-now', { force_preview: forcePreview })
      toast.success(
        `Scheduler checked ${res.scanned_classes} sessions · Dispatched ${res.sent_count} (${res.skipped_count} deduped)`,
      )
      void refetchAutoStatus()
    } catch (err) {
      toast.error(err, 'Failed to execute 15m auto-push scheduler')
    } finally {
      setRunningAutoCron(false)
    }
  }

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))
  }

  function updateRuleTemplate(id: string, template: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, template } : r)))
  }

  function renderPreviewMessage(template: string): string {
    const vars: Record<string, string> = {
      '{student_name}': 'Abdullah Al Mamun',
      '{course_title}': 'Hifz & Tajweed Online',
      '{batch_name}': 'Evening Batch A',
      '{meeting_url}': 'https://meet.google.com/iom-live',
      '{billing_month}': new Date().toISOString().slice(0, 7),
      '{amount_due}': '1500',
      '{balance}': '1500',
      '{bkash_number}': branding.bkashNumber,
      '{helpline_phone}': branding.helplinePhone,
    }
    return Object.entries(vars).reduce((acc, [k, v]) => acc.split(k).join(v), template)
  }

  async function triggerWorkflowRun() {
    setRunningWorkflow(true)
    try {
      await api.post('/workflow/run', { after_id: 0 })
      toast.success('Workflow reminder & notification dispatch triggered')
      refetchDeliveries()
    } catch (err) {
      toast.error(err, 'Central Admin required to trigger global workflow run')
    } finally {
      setRunningWorkflow(false)
    }
  }

  async function retryDelivery(id: number) {
    try {
      await api.post(`/notification-deliveries/${id}/retry`, { confirm_possible_duplicate: true })
      toast.success(`Notification #${id} re-queued`)
      refetchDeliveries()
    } catch (err) {
      toast.error(err, 'Delivery is not currently retryable')
    }
  }

  async function downloadStudentsCsv() {
    try {
      const res = await fetch('/api/exports/students.csv', { credentials: 'include' })
      if (!res.ok) throw new Error(`Export failed (${res.status})`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `iom-students-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Official students.csv exported')
    } catch (err) {
      toast.error(err, 'Could not download students CSV')
    }
  }

  function downloadJsonBackup() {
    const json = exportAllSuperAdminData()
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iom-super-admin-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Full Super Admin settings, ledger & certificates backup downloaded')
  }

  function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const res = importAllSuperAdminData(String(reader.result || ''))
        toast.success(`Restored ${res.restoredKeys} configuration store(s)`)
      } catch (err) {
        toast.error(err, 'Invalid backup JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function checkSystemHealth() {
    try {
      const [h, r] = await Promise.all([
        fetch('/api/health').then((res) => (res.ok ? 'OK' : `HTTP ${res.status}`)),
        fetch('/api/ready').then((res) => (res.ok ? 'READY' : `HTTP ${res.status}`)),
      ])
      setHealthResult({ health: h, ready: r, checkedAt: new Date().toLocaleTimeString() })
      toast.success(`Backend Health: ${h} · Database Ready: ${r}`)
    } catch (err) {
      toast.error(err, 'Could not reach backend health probe')
    }
  }

  async function revokeAllSessions() {
    if (!window.confirm('Revoke all active sessions for your account across every device?')) return
    setRevoking(true)
    try {
      await api.post('/account/revoke-sessions', {})
      toast.success('All active sessions revoked — reloading sign-in')
      setTimeout(() => window.location.reload(), 900)
    } catch (err) {
      toast.error(err, 'Failed to revoke sessions')
      setRevoking(false)
    }
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-heading">Automation, Academy Branding, Backups &amp; Security</h2>
          <p className="text-xs text-muted mt-0.5">
            Automated WA/Telegram reminder templates, official Receipt/Sanad letterhead, CSV/JSON backups &amp; security controls
          </p>
        </div>
        <Badge variant="primary">{rules.filter((r) => r.enabled).length} / {rules.length} Rules Active</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setTab('automation')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'automation' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" /> Auto Reminders &amp; Dispatch
        </button>
        <button
          type="button"
          onClick={() => setTab('branding')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'branding' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Academy Branding &amp; Merchant Setup
        </button>
        <button
          type="button"
          onClick={() => setTab('backups')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold ${
            tab === 'backups' ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-body'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> Exports, Backups &amp; Security
        </button>
      </div>

      {/* TAB 1: AUTOMATION RULES */}
      {tab === 'automation' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Automated Reminder Rules &amp; Bengali/English Templates</CardTitle>
                  <p className="text-xs text-muted mt-0.5">Customize templates once and trigger instant WhatsApp/Telegram messages or backend workflow run.</p>
                </div>
                {isCentral && (
                  <Button size="sm" loading={runningWorkflow} onClick={triggerWorkflowRun}>
                    <Zap className="w-3.5 h-3.5" /> Run Workflow Queue Now
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rules.map((r) => {
                const sample = renderPreviewMessage(r.template)
                return (
                  <div key={r.id} className="p-4 rounded-xl border border-border bg-bg space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-heading">{r.title}</p>
                        <p className="text-xs text-muted">{r.trigger_description}</p>
                        <p className="text-[11px] font-mono text-primary-700 mt-1">Timing: {r.timing_label} · {r.channel}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRule(r.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.enabled ? 'bg-emerald-600 text-white' : 'bg-surface border border-border text-muted'
                        }`}
                      >
                        {r.enabled ? 'Enabled' : 'Paused'}
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={r.template}
                      onChange={(e) => updateRuleTemplate(r.id, e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-heading"
                    />
                    <div className="flex gap-2 flex-wrap justify-end">
                      <a
                        href={buildWhatsAppUrl(sample)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Test WhatsApp
                      </a>
                      <a
                        href={buildTelegramShareUrl(sample)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
                      >
                        <Send className="w-3.5 h-3.5" /> Test Telegram
                      </a>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-700" />
                    Backend 15m Cron &amp; WhatsApp Cloud / Telegram Auto-Trigger
                  </CardTitle>
                  <p className="text-xs text-muted mt-0.5">
                    Server polls every {autoStatus?.poll_interval_seconds ?? 60}s and dispatches class reminders before scheduled start automatically.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={autoStatus?.scheduler_active ? 'approved' : 'pending'} dot>
                    {autoStatus?.scheduler_active ? 'Cron Active (60s)' : 'Scheduler Ready'}
                  </Badge>
                  {autoStatus?.last_cycle_at && (
                    <span className="text-[11px] font-mono text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Last tick: {autoStatus.last_cycle_at.slice(11, 19)} UTC
                    </span>
                  )}
                  <Button size="sm" variant="outline" loading={runningAutoCron} onClick={() => runAutoCronNow(false)}>
                    <Zap className="w-3.5 h-3.5" /> Run Live 15m Scan
                  </Button>
                  <Button size="sm" loading={runningAutoCron} onClick={() => runAutoCronNow(true)}>
                    <Send className="w-3.5 h-3.5" /> Test Auto-Dispatch
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={saveWebhookConfig} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-bg/40">
                  <input
                    id="cron-enabled-chk"
                    type="checkbox"
                    checked={cronEnabled}
                    onChange={(e) => setCronEnabled(e.target.checked)}
                    className="rounded border-border"
                  />
                  <label htmlFor="cron-enabled-chk" className="text-xs font-semibold text-heading">
                    Enable Automatic Background Dispatch
                  </label>
                </div>
                <Input
                  label="Lead Window Before Class (minutes)"
                  type="number"
                  min={5}
                  max={60}
                  value={cronLeadMins}
                  onChange={(e) => setCronLeadMins(e.target.value)}
                />
                <Input
                  label="Custom Webhook URL (Optional)"
                  placeholder="https://hook.your-server.com/academy"
                  value={customWebhookUrl}
                  onChange={(e) => setCustomWebhookUrl(e.target.value)}
                />
                <Input
                  label={`Telegram Bot Token ${autoStatus?.config?.telegram_token_masked ? `(${autoStatus.config.telegram_token_masked})` : ''}`}
                  type="password"
                  placeholder="123456789:ABC..."
                  value={tgBotToken}
                  onChange={(e) => setTgBotToken(e.target.value)}
                />
                <Input
                  label="Default Telegram Group / Channel Chat ID"
                  placeholder="-1001234567890"
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                />
                <Input
                  label="WhatsApp Cloud Phone Number ID"
                  placeholder="Meta Graph Phone Number ID"
                  value={waPhoneId}
                  onChange={(e) => setWaPhoneId(e.target.value)}
                />
                <Input
                  label={`WhatsApp Cloud Bearer Token ${autoStatus?.config?.whatsapp_token_masked ? `(${autoStatus.config.whatsapp_token_masked})` : ''}`}
                  type="password"
                  placeholder="EAAG..."
                  value={waAccessToken}
                  onChange={(e) => setWaAccessToken(e.target.value)}
                />
                <Input
                  label="WhatsApp Default Test / Group Phone"
                  placeholder="88017XXXXXXXX"
                  value={waDefaultTo}
                  onChange={(e) => setWaDefaultTo(e.target.value)}
                />
                {isCentral && (
                  <Button type="submit" size="sm" loading={savingWebhookCfg}>
                    <CheckCircle className="w-3.5 h-3.5" /> Save Webhook Credentials
                  </Button>
                )}
              </form>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-bold text-heading mb-2">
                  Auto-Reminder Dispatch History ({autoStatus?.dispatches?.length || 0})
                </p>
                {!autoStatus?.dispatches?.length ? (
                  <p className="text-xs text-muted">
                    No auto-dispatches logged yet. Click &ldquo;Test Auto-Dispatch&rdquo; or let the 60s backend cron catch the next upcoming class.
                  </p>
                ) : (
                  <div className="overflow-x-auto max-h-60">
                    <table className="iom-table">
                      <thead>
                        <tr>
                          <th>Channel</th>
                          <th>Target</th>
                          <th>Message Preview</th>
                          <th>Status</th>
                          <th>Sent At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {autoStatus.dispatches.slice(0, 15).map((row: any) => (
                          <tr key={row.id}>
                            <td className="text-xs font-semibold uppercase">{row.channel}</td>
                            <td className="text-xs font-mono text-muted">{row.target}</td>
                            <td className="text-xs text-body max-w-md truncate">{row.message_body}</td>
                            <td>
                              <Badge variant={row.status === 'sent' ? 'approved' : row.status === 'failed' ? 'cancelled' : 'pending'}>
                                {row.status}
                              </Badge>
                            </td>
                            <td className="text-xs font-mono text-muted">{String(row.sent_at || '').slice(11, 19)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Telegram Notification Delivery Log ({deliveries.length})</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {deliveries.length === 0 ? (
                <p className="p-6 text-xs text-muted">No automated Telegram workflow deliveries queued for this account yet.</p>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>Event / Title</th>
                      <th>Stage</th>
                      <th>Attempts</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.slice(0, 20).map((d) => (
                      <tr key={d.id}>
                        <td className="text-xs font-semibold text-heading">{d.title || d.event_key}</td>
                        <td className="text-xs text-muted">{d.stage}</td>
                        <td className="text-xs font-mono">{d.attempt_count}</td>
                        <td>
                          <Badge variant={d.status === 'sent' ? 'approved' : d.status === 'failed' ? 'cancelled' : 'pending'}>
                            {d.status}
                          </Badge>
                        </td>
                        <td>
                          {(d.status === 'failed' || d.status === 'unknown') && (
                            <Button size="sm" variant="outline" onClick={() => retryDelivery(d.id)}>
                              <RefreshCw className="w-3 h-3" /> Retry
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: BRANDING & MERCHANT SETUP */}
      {tab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-7">
            <CardHeader><CardTitle>Academy Identity, Principal Signatory &amp; Payment Accounts</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Academy Name"
                  value={branding.academyName}
                  onChange={(e) => setBranding((b) => ({ ...b, academyName: e.target.value }))}
                />
                <Input
                  label="Tagline / Subtitle"
                  value={branding.tagline}
                  onChange={(e) => setBranding((b) => ({ ...b, tagline: e.target.value }))}
                />
                <Input
                  label="Principal / Director Name"
                  value={branding.principalName}
                  onChange={(e) => setBranding((b) => ({ ...b, principalName: e.target.value }))}
                />
                <Input
                  label="Principal Title"
                  value={branding.principalTitle}
                  onChange={(e) => setBranding((b) => ({ ...b, principalTitle: e.target.value }))}
                />
                <Input
                  label="Helpline Phone"
                  value={branding.helplinePhone}
                  onChange={(e) => setBranding((b) => ({ ...b, helplinePhone: e.target.value }))}
                />
                <Input
                  label="WhatsApp Support Number"
                  value={branding.whatsappSupport}
                  onChange={(e) => setBranding((b) => ({ ...b, whatsappSupport: e.target.value }))}
                />
                <Input
                  label="bKash Account"
                  value={branding.bkashNumber}
                  onChange={(e) => setBranding((b) => ({ ...b, bkashNumber: e.target.value }))}
                />
                <Input
                  label="Nagad Account"
                  value={branding.nagadNumber}
                  onChange={(e) => setBranding((b) => ({ ...b, nagadNumber: e.target.value }))}
                />
              </div>
              <Input
                label="Bank Transfer Instructions"
                value={branding.bankDetails}
                onChange={(e) => setBranding((b) => ({ ...b, bankDetails: e.target.value }))}
              />
              <Input
                label="Official Document Footer Note"
                value={branding.footerNote}
                onChange={(e) => setBranding((b) => ({ ...b, footerNote: e.target.value }))}
              />
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Auto-saved &amp; live across Invoices, Salary Slips &amp; Digital Sanads
                </span>
                <Button size="sm" variant="outline" onClick={() => setBranding(DEFAULT_ACADEMY_BRANDING)}>
                  Reset Defaults
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader><CardTitle>Live Receipt &amp; Sanad Header Preview</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-5 rounded-xl border-2 border-primary-700/30 bg-bg space-y-3">
                <div className="border-b border-border pb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-700">{branding.academyName}</p>
                  <p className="text-[11px] text-muted">{branding.tagline}</p>
                  <h4 className="text-base font-bold text-heading mt-1">Official Tuition Receipt / Sanad</h4>
                </div>
                <div className="text-xs space-y-1 text-body">
                  <p><span className="font-semibold text-heading">bKash:</span> {branding.bkashNumber}</p>
                  <p><span className="font-semibold text-heading">Nagad:</span> {branding.nagadNumber}</p>
                  <p><span className="font-semibold text-heading">Bank:</span> {branding.bankDetails}</p>
                  <p><span className="font-semibold text-heading">Helpline:</span> {branding.helplinePhone}</p>
                </div>
                <div className="pt-3 border-t border-border flex items-end justify-between text-[11px]">
                  <span className="text-muted">{branding.footerNote}</span>
                  <span className="font-bold text-heading whitespace-nowrap ml-2">{branding.principalName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: EXPORTS, BACKUPS & SECURITY */}
      {tab === 'backups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Official CSV &amp; Ledger Exports</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted">
                Download official database records or super-admin policies for Excel, compliance, or offline archives.
              </p>
              <Button size="sm" className="w-full justify-center" onClick={downloadStudentsCsv}>
                <Download className="w-4 h-4" /> Export Official Students Directory (.csv)
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-center" onClick={downloadJsonBackup}>
                <Download className="w-4 h-4" /> Export Full Governance &amp; Ledger Backup (.json)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Restore Configuration Snapshot</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted">
                Restore RBAC policies, fee plans, syllabus milestones, issued Sanads, automation templates, expenses &amp; branding from a JSON backup.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleRestoreFile}
              />
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" /> Upload &amp; Restore JSON Backup
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>System Health &amp; Session Security</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button size="sm" variant="outline" className="w-full justify-center" onClick={checkSystemHealth}>
                <ShieldAlert className="w-4 h-4" /> Run Live Server &amp; DB Health Check
              </Button>
              {healthResult.checkedAt && (
                <div className="p-2.5 rounded-lg bg-bg border border-border text-xs flex items-center justify-between">
                  <span>API: <strong>{healthResult.health}</strong> · DB: <strong>{healthResult.ready}</strong></span>
                  <span className="text-[11px] text-muted">{healthResult.checkedAt}</span>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                loading={revoking}
                className="w-full justify-center text-rose-700 border-rose-300"
                onClick={revokeAllSessions}
              >
                <LogOut className="w-4 h-4" /> Revoke All My Active Sessions
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-center"
                onClick={() => { window.location.hash = '#/settings' }}
              >
                Open Staff Accounts &amp; Suspend Controls
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
