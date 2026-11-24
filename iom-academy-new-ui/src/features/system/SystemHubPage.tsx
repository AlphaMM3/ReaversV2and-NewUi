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
  BellRing,
  Building2,
  Database,
  Download,
  Upload,
  MessageCircle,
  Send,
  Zap,
  RefreshCw,
  LogOut,
  CheckCircle,
  Clock,
  Radio,
  SlidersHorizontal,
  FileSpreadsheet,
  Check,
  RotateCcw,
  QrCode,
  ShieldCheck,
  Activity,
  Bot,
  ExternalLink,
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

const TEMPLATE_VARIABLES = [
  { key: '{student_name}', label: 'ছাত্র/ছাত্রীর নাম' },
  { key: '{course_title}', label: 'কোর্সের নাম' },
  { key: '{batch_name}', label: 'ব্যাচ' },
  { key: '{meeting_url}', label: 'ক্লাস লিংক' },
  { key: '{billing_month}', label: 'মাস' },
  { key: '{amount_due}', label: 'ফি টাকা' },
  { key: '{balance}', label: 'বকেয়া' },
  { key: '{bkash_number}', label: 'বিকাশ নম্বর' },
  { key: '{helpline_phone}', label: 'হেল্পলাইন' },
]

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
  const [healthChecking, setHealthChecking] = useState(false)
  const [healthResult, setHealthResult] = useState<{ health?: string; ready?: string; checkedAt?: string; ms?: number }>({})

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
      toast.success('মেটা হোয়াটসঅ্যাপ ও টেলিগ্রাম ক্রেডেনশিয়াল সংরক্ষিত হয়েছে')
      setTgBotToken('')
      setWaAccessToken('')
      void refetchAutoStatus()
    } catch (err) {
      toast.error(err, 'কনফিগারেশন সংরক্ষণ করা সম্ভব হয়নি')
    } finally {
      setSavingWebhookCfg(false)
    }
  }

  async function runAutoCronNow(forcePreview = false) {
    setRunningAutoCron(true)
    try {
      const res = await api.post<any>('/automation/run-now', { force_preview: forcePreview })
      toast.success(
        `স্ক্যান সম্পন্ন: ${res.scanned_classes} টি ক্লাস যাচাই · ${res.sent_count} টি নোটিফিকেশন ডিসপ্যাচ হয়েছে`,
      )
      void refetchAutoStatus()
    } catch (err) {
      toast.error(err, 'স্বয়ংক্রিয় শিডিউলার রান ব্যর্থ হয়েছে')
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

  function insertVariable(id: string, currentTemplate: string, varKey: string) {
    const updated = currentTemplate + ' ' + varKey
    updateRuleTemplate(id, updated)
  }

  function renderPreviewMessage(template: string): string {
    const vars: Record<string, string> = {
      '{student_name}': 'আব্দুল্লাহ আল মামুন',
      '{course_title}': 'হিফজ ও তাজবীদ অনলাইন',
      '{batch_name}': 'ইভনিং ব্যাচ-এ',
      '{meeting_url}': 'https://meet.google.com/iom-live',
      '{billing_month}': 'নভেম্বর ২০২৬',
      '{amount_due}': '১৫০০',
      '{balance}': '১৫০০',
      '{bkash_number}': branding.bkashNumber || '০১৭XXXXXXXX',
      '{helpline_phone}': branding.helplinePhone || '০১৯XXXXXXXX',
    }
    return Object.entries(vars).reduce((acc, [k, v]) => acc.split(k).join(v), template)
  }

  async function triggerWorkflowRun() {
    setRunningWorkflow(true)
    try {
      await api.post('/workflow/run', { after_id: 0 })
      toast.success('গ্লোবাল নোটিফিকেশন ডিসপ্যাচ কিউ রান হয়েছে')
      refetchDeliveries()
    } catch (err) {
      toast.error(err, 'সেন্ট্রাল অ্যাডমিন অনুমতি আবশ্যক')
    } finally {
      setRunningWorkflow(false)
    }
  }

  async function retryDelivery(id: number) {
    try {
      await api.post(`/notification-deliveries/${id}/retry`, { confirm_possible_duplicate: true })
      toast.success(`নোটিফিকেশন #${id} পুনরায় কিউ-তে যুক্ত করা হয়েছে`)
      refetchDeliveries()
    } catch (err) {
      toast.error(err, 'ডেলিভারি রিট্রাই করা সম্ভব হয়নি')
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
      toast.success('শিক্ষার্থী ডিরেক্টরি (.csv) সফলভাবে ডাউনলোড হয়েছে')
    } catch (err) {
      toast.error(err, 'শিক্ষার্থী CSV ডাউনলোড ব্যর্থ হয়েছে')
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
    toast.success('সম্পূর্ণ সিস্টেম ব্যাকআপ (.json) ডাউনলোড হয়েছে')
  }

  function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const res = importAllSuperAdminData(String(reader.result || ''))
        toast.success(`${res.restoredKeys} টি কনফিগারেশন স্টোর সফলভাবে রিস্টোর হয়েছে`)
      } catch (err) {
        toast.error(err, 'সঠিক ব্যাকআপ ফাইল নির্বাচন করুন')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function checkSystemHealth() {
    setHealthChecking(true)
    const t0 = performance.now()
    try {
      const [h, r] = await Promise.all([
        fetch('/api/health').then((res) => (res.ok ? 'স্বাভাবিক (Healthy)' : `ত্রুটি HTTP ${res.status}`)),
        fetch('/api/ready').then((res) => (res.ok ? 'প্রস্তুত (Ready)' : `ত্রুটি HTTP ${res.status}`)),
      ])
      const ms = Math.round(performance.now() - t0)
      setHealthResult({ health: h, ready: r, checkedAt: new Date().toLocaleTimeString('bn-BD'), ms })
      toast.success(`সিস্টেম রেসপন্স: ${ms}ms · ডাটাবেজ সচল`)
    } catch (err) {
      toast.error(err, 'সার্ভার প্রোব রেসপন্স পাওয়া যায়নি')
    } finally {
      setHealthChecking(false)
    }
  }

  async function revokeAllSessions() {
    if (!window.confirm('আপনি কি নিশ্চিত যে সকল ডিভাইস থেকে আপনার অ্যাকাউন্টের অ্যাক্টিভ সেশন বাতিল করতে চান?')) return
    setRevoking(true)
    try {
      await api.post('/account/revoke-sessions', {})
      toast.success('সকল অ্যাক্টিভ সেশন বাতিল করা হয়েছে — রিলোড হচ্ছে')
      setTimeout(() => window.location.reload(), 900)
    } catch (err) {
      toast.error(err, 'সেশন বাতিল করতে ব্যর্থ হয়েছে')
      setRevoking(false)
    }
  }

  const activeRulesCount = rules.filter((r) => r.enabled).length

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-4">
      {/* 1. Header Ribbon */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-heading">সিস্টেম হাব ও অটোমেশন</h2>
            <Badge variant="primary" className="text-[11px] font-bold">
              {activeRulesCount}/{rules.length} রুল সক্রিয়
            </Badge>
            {autoStatus?.scheduler_active ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ক্রন সক্রিয় (৬০ সে.)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-bg text-muted border border-border text-[11px]">
                শিডিউলার প্রস্তুত
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">
            স্বয়ংক্রিয় রিমাইন্ডার, টেলিগ্রাম ও হোয়াটসঅ্যাপ ইন্টিগ্রেশন, রশিদ ও সনদ ব্র্যান্ডিং এবং ক্লাউড ব্যাকআপ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isCentral && (
            <Button
              size="sm"
              loading={runningWorkflow}
              onClick={triggerWorkflowRun}
              className="text-xs font-semibold rounded-md shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5" /> নোটিফিকেশন কিউ চালান
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={checkSystemHealth}
            loading={healthChecking}
            className="text-xs font-semibold rounded-md"
          >
            <Activity className="w-3.5 h-3.5 text-primary-600" /> সিস্টেম পিং
          </Button>
        </div>
      </div>

      {/* 2. Sleek Architectural Tab Switcher */}
      <div className="inline-flex rounded-lg bg-surface border border-border p-1 gap-1">
        <button
          type="button"
          onClick={() => setTab('automation')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'automation'
              ? 'bg-primary-700 text-white shadow-2xs'
              : 'text-muted hover:text-heading hover:bg-bg/60'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>অটোমেশন ও মেসেজিং</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              tab === 'automation' ? 'bg-white/20 text-white' : 'bg-bg text-muted border border-border/80'
            }`}
          >
            {activeRulesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('branding')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'branding'
              ? 'bg-primary-700 text-white shadow-2xs'
              : 'text-muted hover:text-heading hover:bg-bg/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>একাডেমিক ব্র্যান্ডিং ও পেমেন্ট</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('backups')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
            tab === 'backups'
              ? 'bg-primary-700 text-white shadow-2xs'
              : 'text-muted hover:text-heading hover:bg-bg/60'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>ডাটা ব্যাকআপ ও সিকিউরিটি</span>
        </button>
      </div>

      {/* 3. TAB 1: AUTOMATION & MESSAGING */}
      {tab === 'automation' && (
        <div className="space-y-4">
          {/* Section A: Reminder Rules */}
          <Card className="rounded-lg border-border">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary-700" />
                    স্বয়ংক্রিয় রিমাইন্ডার রুলস ও মেসেজ টেমপ্লেট
                  </CardTitle>
                  <p className="text-[11px] text-muted mt-0.5">
                    ক্লাস শুরুর সতর্কতা, বকেয়া ফি তাগাদা ও অনুপস্থিতি সতর্কতার জন্য বাংলা টেমপ্লেট কাস্টমাইজ করুন।
                  </p>
                </div>
                <span className="text-[11px] text-muted font-mono">
                  ভেরিয়েবল বাটনে ক্লিক করে সহজেই মেসেজে যুক্ত করতে পারেন
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rules.map((r) => {
                const sample = renderPreviewMessage(r.template)
                return (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-lg border transition-all space-y-2.5 ${
                      r.enabled
                        ? 'border-border bg-surface shadow-2xs'
                        : 'border-border/60 bg-bg/40 opacity-80'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-heading">{r.title}</p>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary-50 text-primary-700 border border-primary-200/60">
                            {r.channel}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted mt-0.5">{r.trigger_description}</p>
                        <p className="text-[10px] text-muted font-mono mt-0.5">
                          টাইমিং: <strong className="text-heading">{r.timing_label}</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleRule(r.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors shrink-0 ${
                          r.enabled
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-bg border border-border text-muted hover:text-heading'
                        }`}
                      >
                        {r.enabled ? 'সক্রিয়' : 'বন্ধ'}
                      </button>
                    </div>

                    {/* Variable Pills */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                          মেসেজ টেমপ্লেট
                        </span>
                        <span className="text-[10px] text-muted">ভেরিয়েবল ইনসার্ট:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {TEMPLATE_VARIABLES.slice(0, 5).map((v) => (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => insertVariable(r.id, r.template, v.key)}
                            className="px-1.5 py-0.5 rounded bg-bg hover:bg-primary-50 text-[10px] font-mono text-primary-700 border border-border/80 hover:border-primary-300 cursor-pointer transition-colors"
                            title={v.label}
                          >
                            + {v.key}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      rows={3}
                      value={r.template}
                      onChange={(e) => updateRuleTemplate(r.id, e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md border border-border bg-bg text-heading font-sans focus:outline-none focus:ring-1 focus:ring-primary-500 leading-relaxed"
                    />

                    {/* Message Bubble Preview */}
                    <div className="p-2.5 rounded-md bg-bg/80 border border-border/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-muted flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> লাইভ প্রিভিউ (শিক্ষার্থীর মোবাইলে যেমন যাবে)
                        </span>
                      </div>
                      <p className="text-[11px] text-body whitespace-pre-wrap leading-relaxed line-clamp-2">
                        {sample}
                      </p>
                    </div>

                    {/* Test Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                      <a
                        href={buildWhatsAppUrl(sample)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer transition-colors shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp টেস্ট
                      </a>
                      <a
                        href={buildTelegramShareUrl(sample)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-600 text-white text-[11px] font-semibold hover:bg-sky-700 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Send className="w-3.5 h-3.5" /> Telegram টেস্ট
                      </a>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Section B: Gateway Configurations */}
          <Card className="rounded-lg border-border">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    ব্যাকএন্ড শিডিউলার ও মেটা ক্লাউড / টেলিগ্রাম গেটওয়ে
                  </CardTitle>
                  <p className="text-[11px] text-muted mt-0.5">
                    ক্লাসের নির্দিষ্ট সময় আগে স্বয়ংক্রিয়ভাবে মেসেজ পাঠাতে মেটা হোয়াটসঅ্যাপ ক্লাউড ও টেলিগ্রাম ক্রেডেনশিয়াল কনফিগার করুন।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={runningAutoCron}
                    onClick={() => runAutoCronNow(false)}
                    className="text-xs rounded-md"
                  >
                    <Zap className="w-3.5 h-3.5" /> ১৫ মি. লাইভ স্ক্যান
                  </Button>
                  <Button
                    size="sm"
                    loading={runningAutoCron}
                    onClick={() => runAutoCronNow(true)}
                    className="text-xs rounded-md"
                  >
                    <Send className="w-3.5 h-3.5" /> টেস্ট অটো-ডিসপ্যাচ
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <form onSubmit={saveWebhookConfig} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Column 1: Scheduler Core */}
                  <div className="p-3.5 rounded-lg border border-border bg-bg/40 space-y-3">
                    <p className="text-xs font-bold text-heading flex items-center gap-1.5 border-b border-border/60 pb-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary-600" />
                      শিডিউলার টাইমিং
                    </p>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-surface border border-border">
                      <input
                        id="cron-enabled-chk"
                        type="checkbox"
                        checked={cronEnabled}
                        onChange={(e) => setCronEnabled(e.target.checked)}
                        className="rounded border-border accent-primary-600 cursor-pointer"
                      />
                      <label htmlFor="cron-enabled-chk" className="text-xs font-semibold text-heading cursor-pointer">
                        স্বয়ংক্রিয় ব্যাকগ্রাউন্ড ডিসপ্যাচ চালু
                      </label>
                    </div>
                    <Input
                      label="ক্লাস শুরুর কত মিনিট আগে রিমাইন্ডার যাবে"
                      type="number"
                      min={5}
                      max={60}
                      value={cronLeadMins}
                      onChange={(e) => setCronLeadMins(e.target.value)}
                    />
                    <Input
                      label="কাস্টম ওয়েবহুক URL (ঐচ্ছিক)"
                      placeholder="https://hook.your-server.com/academy"
                      value={customWebhookUrl}
                      onChange={(e) => setCustomWebhookUrl(e.target.value)}
                    />
                  </div>

                  {/* Column 2: Telegram Bot */}
                  <div className="p-3.5 rounded-lg border border-border bg-bg/40 space-y-3">
                    <p className="text-xs font-bold text-heading flex items-center gap-1.5 border-b border-border/60 pb-1.5">
                      <Bot className="w-3.5 h-3.5 text-sky-600" />
                      টেলিগ্রাম বট গেটওয়ে
                    </p>
                    <Input
                      label={`টেলিগ্রাম বট টোকেন ${autoStatus?.config?.telegram_token_masked ? `(${autoStatus.config.telegram_token_masked})` : ''}`}
                      type="password"
                      placeholder="123456789:ABC..."
                      value={tgBotToken}
                      onChange={(e) => setTgBotToken(e.target.value)}
                    />
                    <Input
                      label="ডিফল্ট চ্যানেল / গ্রুপ চ্যাট আইডি"
                      placeholder="-1001234567890"
                      value={tgChatId}
                      onChange={(e) => setTgChatId(e.target.value)}
                    />
                    <p className="text-[11px] text-muted">
                      বট তৈরি করতে টেলিগ্রামে <strong>@BotFather</strong> ব্যবহার করুন এবং চ্যাট আইডি সংগ্রহ করুন।
                    </p>
                  </div>

                  {/* Column 3: WhatsApp Cloud API */}
                  <div className="p-3.5 rounded-lg border border-border bg-bg/40 space-y-3">
                    <p className="text-xs font-bold text-heading flex items-center gap-1.5 border-b border-border/60 pb-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      হোয়াটসঅ্যাপ ক্লাউড এপিআই
                    </p>
                    <Input
                      label="মেটা ফোন নম্বর আইডি"
                      placeholder="Meta Phone Number ID"
                      value={waPhoneId}
                      onChange={(e) => setWaPhoneId(e.target.value)}
                    />
                    <Input
                      label={`অ্যাক্সেস টোকেন ${autoStatus?.config?.whatsapp_token_masked ? `(${autoStatus.config.whatsapp_token_masked})` : ''}`}
                      type="password"
                      placeholder="EAAG..."
                      value={waAccessToken}
                      onChange={(e) => setWaAccessToken(e.target.value)}
                    />
                    <Input
                      label="ডিফল্ট টেস্ট / অভিভাবক নম্বর"
                      placeholder="88017XXXXXXXX"
                      value={waDefaultTo}
                      onChange={(e) => setWaDefaultTo(e.target.value)}
                    />
                  </div>
                </div>

                {isCentral && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                    <Button type="submit" size="sm" loading={savingWebhookCfg} className="rounded-md">
                      <CheckCircle className="w-3.5 h-3.5" /> ক্রেডেনশিয়াল সংরক্ষণ করুন
                    </Button>
                  </div>
                )}
              </form>

              {/* Delivery History Table */}
              <div className="border-t border-border/60 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-heading">
                    সাম্প্রতিক অটো-ডিসপ্যাচ হিস্ট্রি ({autoStatus?.dispatches?.length || 0})
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => void refetchAutoStatus()} className="h-7 text-xs">
                    <RefreshCw className="w-3 h-3" /> রিফ্রেশ
                  </Button>
                </div>

                {!autoStatus?.dispatches?.length ? (
                  <p className="text-xs text-muted p-4 bg-bg/50 rounded-md border border-border/60 text-center">
                    এখনো কোনো স্বয়ংক্রিয় মেসেজ লগ তৈরি হয়নি। &ldquo;টেস্ট অটো-ডিসপ্যাচ&rdquo; বাটনে ক্লিক করে পরীক্ষা করতে পারেন।
                  </p>
                ) : (
                  <div className="overflow-x-auto max-h-60 rounded-md border border-border">
                    <table className="iom-table">
                      <thead>
                        <tr>
                          <th>চ্যানেল</th>
                          <th>প্রাপক</th>
                          <th>মেসেজ সারাংশ</th>
                          <th>স্ট্যাটাস</th>
                          <th>সময় (UTC)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {autoStatus.dispatches.slice(0, 15).map((row: any) => (
                          <tr key={row.id}>
                            <td className="text-xs font-bold uppercase">{row.channel}</td>
                            <td className="text-xs font-mono text-muted">{row.target}</td>
                            <td className="text-xs text-body max-w-md truncate">{row.message_body}</td>
                            <td>
                              <Badge
                                variant={
                                  row.status === 'sent'
                                    ? 'approved'
                                    : row.status === 'failed'
                                    ? 'cancelled'
                                    : 'pending'
                                }
                              >
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

          {/* Section C: Telegram Workflow Deliveries */}
          <Card className="rounded-lg border-border">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-heading">
                  টেলিগ্রাম ওয়ার্কফ্লো নোটিফিকেশন ডেলিভারি লগ ({deliveries.length})
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => refetchDeliveries()} className="h-7 text-xs">
                  <RefreshCw className="w-3 h-3" /> রিলোড
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {deliveries.length === 0 ? (
                <p className="p-5 text-xs text-muted text-center">
                  এই অ্যাকাউন্টে বর্তমানে কোনো ব্যাকলগ ডেলিভারি নেই।
                </p>
              ) : (
                <table className="iom-table">
                  <thead>
                    <tr>
                      <th>ইভেন্ট ও শিরোনাম</th>
                      <th>স্টেজ</th>
                      <th>চেষ্টা (Attempts)</th>
                      <th>স্ট্যাটাস</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.slice(0, 20).map((d) => (
                      <tr key={d.id}>
                        <td className="text-xs font-semibold text-heading">{d.title || d.event_key}</td>
                        <td className="text-xs text-muted">{d.stage}</td>
                        <td className="text-xs font-mono">{d.attempt_count}</td>
                        <td>
                          <Badge
                            variant={
                              d.status === 'sent'
                                ? 'approved'
                                : d.status === 'failed'
                                ? 'cancelled'
                                : 'pending'
                            }
                          >
                            {d.status}
                          </Badge>
                        </td>
                        <td>
                          {(d.status === 'failed' || d.status === 'unknown') && (
                            <Button size="sm" variant="outline" onClick={() => retryDelivery(d.id)} className="rounded-md">
                              <RefreshCw className="w-3 h-3" /> পুনরায় চেষ্টা
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

      {/* 4. TAB 2: ACADEMY BRANDING & MERCHANT SETUP */}
      {tab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Form Side */}
          <Card className="lg:col-span-7 rounded-lg border-border">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface">
              <CardTitle className="text-sm font-bold text-heading">
                প্রাতিষ্ঠানিক পরিচয়, পরিচালক স্বাক্ষর ও পেমেন্ট নম্বর
              </CardTitle>
              <p className="text-[11px] text-muted mt-0.5">
                এখানে দেওয়া তথ্য স্বয়ংক্রিয়ভাবে ইনভয়েস, বেতন রশিদ, মানি রিসিট ও ডিজিটাল সনদে প্রদর্শিত হবে।
              </p>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Institution & Principal */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-heading border-b border-border/60 pb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary-600" />
                  একাডেমি ও প্রিন্সিপাল তথ্য
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="একাডেমির নাম"
                    value={branding.academyName}
                    onChange={(e) => setBranding((b) => ({ ...b, academyName: e.target.value }))}
                  />
                  <Input
                    label="ট্যাগলাইন / স্লোগান"
                    value={branding.tagline}
                    onChange={(e) => setBranding((b) => ({ ...b, tagline: e.target.value }))}
                  />
                  <Input
                    label="প্রিন্সিপাল / পরিচালকের নাম"
                    value={branding.principalName}
                    onChange={(e) => setBranding((b) => ({ ...b, principalName: e.target.value }))}
                  />
                  <Input
                    label="পরিচালকের পদবী"
                    value={branding.principalTitle}
                    onChange={(e) => setBranding((b) => ({ ...b, principalTitle: e.target.value }))}
                  />
                </div>
              </div>

              {/* Support Contacts */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-heading border-b border-border/60 pb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  যোগাযোগ ও সাপোর্ট
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="অফিসিয়াল হেল্পলাইন নম্বর"
                    value={branding.helplinePhone}
                    onChange={(e) => setBranding((b) => ({ ...b, helplinePhone: e.target.value }))}
                  />
                  <Input
                    label="হোয়াটসঅ্যাপ সাপোর্ট নম্বর"
                    value={branding.whatsappSupport}
                    onChange={(e) => setBranding((b) => ({ ...b, whatsappSupport: e.target.value }))}
                  />
                </div>
              </div>

              {/* Financial Accounts */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-heading border-b border-border/60 pb-1 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-rose-600" />
                  ফি পরিশোধের একাউন্টসমূহ
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="বিকাশ মার্চেন্ট / পার্সোনাল নম্বর"
                    value={branding.bkashNumber}
                    onChange={(e) => setBranding((b) => ({ ...b, bkashNumber: e.target.value }))}
                  />
                  <Input
                    label="নগদ মার্চেন্ট / পার্সোনাল নম্বর"
                    value={branding.nagadNumber}
                    onChange={(e) => setBranding((b) => ({ ...b, nagadNumber: e.target.value }))}
                  />
                </div>
                <Input
                  label="ব্যাংক ট্রান্সফার সংক্রান্ত নির্দেশনা"
                  value={branding.bankDetails}
                  onChange={(e) => setBranding((b) => ({ ...b, bankDetails: e.target.value }))}
                />
                <Input
                  label="অফিসিয়াল ডকুমেন্টের ফুটার নোট"
                  value={branding.footerNote}
                  onChange={(e) => setBranding((b) => ({ ...b, footerNote: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> অটো-সেভড ও লাইভ কার্যকর
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBranding(DEFAULT_ACADEMY_BRANDING)}
                  className="rounded-md text-xs"
                >
                  <RotateCcw className="w-3 h-3" /> ডিফল্ট রিস্টোর
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Side: Authentic Voucher Preview */}
          <Card className="lg:col-span-5 rounded-lg border-border">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface">
              <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary-700" />
                অফিসিয়াল রশিদ ও সনদ ভাউচার প্রিভিউ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-5 rounded-lg border-2 border-primary-700/20 bg-surface shadow-xs space-y-4 relative overflow-hidden">
                {/* Background Watermark */}
                <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] pointer-events-none select-none text-[120px] font-serif font-black text-primary-900">
                  IOM
                </div>

                {/* Header */}
                <div className="border-b-2 border-primary-700/20 pb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold uppercase tracking-wide text-primary-800">
                      {branding.academyName}
                    </h3>
                    <p className="text-[11px] text-muted font-medium">{branding.tagline}</p>
                    <div className="mt-1.5 inline-block px-2 py-0.5 rounded bg-primary-100 text-primary-800 text-[10px] font-bold">
                      টাকা প্রাপ্তির রশিদ / সনদ লেটারহেড
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-muted block">ভাউচার নং</span>
                    <span className="text-xs font-mono font-bold text-heading">#INV-2026-0891</span>
                  </div>
                </div>

                {/* Payment Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-md bg-bg border border-border/70">
                  <div>
                    <span className="text-[10px] text-muted block">বিকাশ পেমেন্ট:</span>
                    <strong className="text-heading font-mono">{branding.bkashNumber || 'নির্ধারিত নেই'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">নগদ পেমেন্ট:</span>
                    <strong className="text-heading font-mono">{branding.nagadNumber || 'নির্ধারিত নেই'}</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-border/60">
                    <span className="text-[10px] text-muted block">ব্যাংক হিসাব:</span>
                    <span className="text-body text-[11px] font-medium">{branding.bankDetails}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-muted block">জরুরি হেল্পলাইন:</span>
                    <span className="text-body text-[11px] font-bold font-mono text-primary-700">
                      {branding.helplinePhone}
                    </span>
                  </div>
                </div>

                {/* Sample Student Fee Item */}
                <div className="text-xs border border-border rounded-md p-2.5 bg-surface space-y-1">
                  <div className="flex justify-between text-muted text-[11px]">
                    <span>বিবরণ: হিফজ ও তাজবীদ কোর্স ফি (নভেম্বর)</span>
                    <span className="font-bold text-heading font-mono">৳ ১,৫০০</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold text-[11px] pt-1 border-t border-border/50">
                    <span>পরিশোধের মাধ্যম: bKash (TrxID: 9X7A21D)</span>
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px]">পরিশোধিত</span>
                  </div>
                </div>

                {/* Footer and Signature */}
                <div className="pt-3 border-t border-border flex items-end justify-between text-xs">
                  <div className="max-w-[200px]">
                    <p className="text-[10px] text-muted leading-tight">{branding.footerNote}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-24 border-b border-heading mb-1 ml-auto" />
                    <p className="font-bold text-heading text-xs">{branding.principalName}</p>
                    <p className="text-[10px] text-muted">{branding.principalTitle}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. TAB 3: EXPORTS, BACKUPS & SECURITY */}
      {tab === 'backups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: Data Exports */}
          <Card className="rounded-lg border-border">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface">
              <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
                <Download className="w-4 h-4 text-primary-600" />
                অফিসিয়াল ডাটা এক্সপোর্ট
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted leading-relaxed">
                এক্সেল শিট, অফলাইন অডিট ও ব্যাকআপের জন্য শিক্ষার্থী ও অ্যাকাডেমিক হিসাবের সম্পূর্ণ তালিকা ডাউনলোড করুন।
              </p>
              <Button
                size="sm"
                className="w-full justify-center rounded-md text-xs font-semibold"
                onClick={downloadStudentsCsv}
              >
                <Download className="w-4 h-4" /> শিক্ষার্থী ডিরেক্টরি ডাউনলোড (.csv)
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-center rounded-md text-xs font-semibold"
                onClick={downloadJsonBackup}
              >
                <Download className="w-4 h-4" /> সম্পূর্ণ সিস্টেম ব্যাকআপ (.json)
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Restore Snapshot */}
          <Card className="rounded-lg border-border">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface">
              <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-600" />
                ব্যাকআপ স্ন্যাপশট রিস্টোর
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted leading-relaxed">
                পূর্বে সংরক্ষিত কোনো কনফিগারেশন JSON ফাইল আপলোড করে ব্র্যান্ডিং, ফি প্ল্যান ও নোটিফিকেশন রুলস রিস্টোর করুন।
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
                className="w-full justify-center rounded-md text-xs font-semibold border-amber-300 bg-amber-50/40 text-amber-900 hover:bg-amber-100/60"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" /> JSON ব্যাকআপ আপলোড করুন
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: Health & Security */}
          <Card className="rounded-lg border-border">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-surface">
              <CardTitle className="text-sm font-bold text-heading flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                সার্ভার স্বাস্থ্য ও সেশন নিরাপত্তা
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-center rounded-md text-xs font-semibold"
                onClick={checkSystemHealth}
                loading={healthChecking}
              >
                <Activity className="w-4 h-4 text-primary-600" /> লাইভ সার্ভার ও DB পিং টেস্ট
              </Button>

              {healthResult.checkedAt && (
                <div className="p-3 rounded-md bg-bg border border-border text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">রেসপন্স লেটেন্সি:</span>
                    <strong className="text-emerald-700 font-mono">{healthResult.ms} ms</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">সার্ভার API:</span>
                    <strong className="text-heading font-medium">{healthResult.health}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">ডাটাবেজ:</span>
                    <strong className="text-heading font-medium">{healthResult.ready}</strong>
                  </div>
                  <p className="text-[10px] text-muted font-mono text-right pt-1 border-t border-border/60">
                    যাচাইয়ের সময়: {healthResult.checkedAt}
                  </p>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                loading={revoking}
                className="w-full justify-center rounded-md text-xs font-semibold text-rose-700 border-rose-300 hover:bg-rose-50"
                onClick={revokeAllSessions}
              >
                <LogOut className="w-4 h-4" /> সকল ডিভাইস থেকে সেশন লগআউট
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-center rounded-md text-xs text-muted hover:text-heading"
                onClick={() => {
                  window.location.hash = '#/settings'
                }}
              >
                ইউজার একাউন্ট ও পারমিশন দেখুন <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
