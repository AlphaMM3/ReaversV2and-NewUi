import React, { useState } from 'react'
import {
  X,
  ExternalLink,
  AlertTriangle,
  Receipt,
  UserCheck,
  Megaphone,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDhakaDate, formatDhakaTime } from '@/lib/utils'
import type { ClassSession, CurrentUser } from '@/lib/api'
import type { StarStudentAward } from '@/lib/superAdminStore'

interface BannerState {
  visible: boolean
  closing: boolean
  dismiss: () => void
  pause: () => void
  resume: () => void
}

interface Props {
  user: CurrentUser
  isSuperAdminRole: boolean
  monthKey: string
  today: string
  welcomeBanner: BannerState
  liveMonitorBanner: BannerState
  starStudentsBanner: BannerState
  liveNowClasses: ClassSession[]
  todayClassesCount: number
  starStudents: StarStudentAward[]
  attentionRows: Array<{
    key: string
    icon: React.ReactNode
    iconBg: string
    text: string
    route: string
  }>
  attentionClosing?: boolean
  attentionDocked?: boolean
  onDismissAttention?: () => void
  onRestoreAttention?: () => void
  onNavigate: (route: string) => void
}

type TabType = 'attention' | 'starStudents' | 'liveClasses'

export default function DashboardBanners({
  user,
  isSuperAdminRole,
  monthKey: _monthKey,
  today,
  welcomeBanner: _welcomeBanner,
  liveNowClasses = [],
  starStudents = [],
  attentionRows = [],
  onDismissAttention,
  onNavigate,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('attention')
  const [collapsed, setCollapsed] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const firstName = user?.name ? user.name.split(' ')[0] : 'ইউজার'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const safeAttentionRows = Array.isArray(attentionRows) ? attentionRows : []
  const safeLiveClasses = Array.isArray(liveNowClasses) ? liveNowClasses : []
  const safeStarStudents = Array.isArray(starStudents) ? starStudents : []

  // Categorize attention rows into 4 distinct structured buckets (matching reference UI)
  const atRiskItems = safeAttentionRows.filter(
    (r) => r.key === 'followups' || r.key === 'verify-held',
  )
  const feeItems = safeAttentionRows.filter((r) => r.key === 'invoices')
  const staffItems = safeAttentionRows.filter(
    (r) => r.key === 'teacher-leaves' || r.key === 'reports',
  )
  const requestItems = safeAttentionRows.filter(
    (r) => r.key === 'admissions' || r.key === 'tickets' || r.key === 'leaves',
  )

  const totalAttentionCount = safeAttentionRows.length

  function handleDismiss() {
    setIsDismissed(true)
    onDismissAttention?.()
  }

  function getActionLabel(key: string): string {
    switch (key) {
      case 'verify-held':
        return 'হাজিরা লক'
      case 'reports':
        return 'রিভিউ'
      case 'tickets':
        return 'টিকেট'
      case 'admissions':
        return 'কল / যাচাই'
      case 'followups':
        return 'ফলোআপ'
      case 'leaves':
        return 'সিদ্ধান্ত'
      case 'teacher-leaves':
        return 'অনুমোদন'
      case 'invoices':
        return 'ইনভয়েস'
      default:
        return 'দেখুন'
    }
  }

  return (
    <div className="space-y-4">
      {/* ── 1. Top Executive Greeting Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl" role="img" aria-label="wave">
              👋
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-heading tracking-tight">
              {greeting}, {firstName}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 font-bold border border-primary-200">
              {isSuperAdminRole
                ? 'সুপার অ্যাডমিন'
                : user.role === 'zimmadar'
                  ? 'হিফজ যিম্মাদার'
                  : 'একাডেমি কন্ট্রোল'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            {formatDhakaDate(today)} · সম্পূর্ণ একাডেমি কার্যক্রম এক নজরে
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* If dismissed, show restore button right in the header bar */}
          {isDismissed && totalAttentionCount > 0 && (
            <button
              type="button"
              onClick={() => setIsDismissed(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-3xs cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {totalAttentionCount}টি পদক্ষেপ দেখুন ▾
            </button>
          )}

          {isSuperAdminRole && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('#/executive')}
              className="text-xs font-semibold"
            >
              এক্সিকিউটিভ রিপোর্ট
            </Button>
          )}
          <Button
            size="sm"
            variant="primary"
            onClick={() => onNavigate('#/approvals')}
            className="text-xs font-bold"
          >
            + অনুমোদন কেন্দ্র
          </Button>
        </div>
      </div>

      {/* ── 2. Unified "Needs Attention" Box (Only rendered when not dismissed, zero blank gap!) ── */}
      {!isDismissed && (
        <div className="bg-surface rounded-2xl border-2 border-amber-300/80 dark:border-amber-700/80 shadow-xs relative overflow-hidden transition-all duration-300">
          {/* Top Accent Strip */}
          <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 w-full" />

          <div className="p-4 sm:p-5">
            {/* Card Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base sm:text-lg font-black text-heading">
                    Needs attention
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                    {totalAttentionCount} things waiting
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {totalAttentionCount > 0
                    ? `${totalAttentionCount}টি বিষয়ে দ্রুত পদক্ষেপ নেওয়া প্রয়োজন`
                    : 'সকল কার্যক্রম হালনাগাদ রয়েছে'}
                </p>
              </div>

              {/* Segmented Switcher & Quick Collapse */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('attention')
                      setCollapsed(false)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'attention' && !collapsed
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-3xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    পদক্ষেপ ({totalAttentionCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('starStudents')
                      setCollapsed(false)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeTab === 'starStudents' && !collapsed
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-3xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    সেরা শিক্ষার্থী ({safeStarStudents.length})
                  </button>
                  {safeLiveClasses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('liveClasses')
                        setCollapsed(false)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'liveClasses' && !collapsed
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-3xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      লাইভ ({safeLiveClasses.length})
                    </button>
                  )}
                </div>

                {/* Collapse Toggle */}
                <button
                  type="button"
                  onClick={() => setCollapsed((prev) => !prev)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  title={collapsed ? 'প্রসারিত করুন' : 'সংক্ষেপ করুন'}
                >
                  {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>

                {/* Dismiss Box (Immediately hides and slides content up!) */}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center transition-colors cursor-pointer text-xs"
                  title="লুকান"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Collapsed State Summary */}
            {collapsed ? (
              <div className="pt-3 flex items-center justify-between text-xs sm:text-sm text-slate-500">
                <span>নোটিফিকেশন সংক্ষেপিত অবস্থায় রয়েছে। দেখতে প্রসারিত করুন।</span>
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  className="font-bold text-primary-700 hover:underline cursor-pointer"
                >
                  বিস্তারিত দেখুন ▾
                </button>
              </div>
            ) : (
              <div className="pt-4">
                {/* ── TAB 1: Attention Queue Categorized (4 Clean Columns with Readable Font Sizes) ── */}
                {activeTab === 'attention' && (
                  <>
                    {totalAttentionCount === 0 ? (
                      <div className="py-6 text-center text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 flex flex-col items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        <p className="font-bold text-base">আলহামদুলিল্লাহ! কোনো জরুরি অ্যাকশন অপেক্ষমাণ নেই</p>
                        <p className="text-muted text-xs sm:text-sm">সকল ক্লাস, রিপোর্ট, ফি ও ছুটির আবেদন সম্পূর্ণ হালনাগাদ রয়েছে।</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
                        {/* Column 1: At-risk students */}
                        <div className="p-3.5 rounded-xl border border-rose-200/90 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-between pb-2.5 border-b border-rose-100 dark:border-rose-900/50">
                              <span className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                At-risk students
                              </span>
                              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                                {atRiskItems.length}
                              </span>
                            </div>

                            <div className="space-y-2.5 mt-2.5">
                              {atRiskItems.length === 0 ? (
                                <p className="text-xs text-muted italic py-1 font-medium">হাজিরা সন্তোষজনক ✓</p>
                              ) : (
                                atRiskItems.slice(0, 2).map((item) => (
                                  <div
                                    key={item.key}
                                    className="p-2.5 rounded-lg bg-surface border border-slate-200/90 shadow-3xs flex items-center justify-between gap-2"
                                  >
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate flex-1">
                                      {item.text}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => onNavigate(item.route)}
                                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex-shrink-0 cursor-pointer transition-colors"
                                    >
                                      {getActionLabel(item.key)}
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onNavigate('#/followups')}
                            className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300 hover:underline text-left pt-1 inline-flex items-center gap-1 cursor-pointer"
                          >
                            See all {atRiskItems.length} →
                          </button>
                        </div>

                        {/* Column 2: Fee defaulters */}
                        <div className="p-3.5 rounded-xl border border-amber-200/90 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-between pb-2.5 border-b border-amber-100 dark:border-amber-900/50">
                              <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                <Receipt className="w-4 h-4 text-amber-600" />
                                Fee defaulters
                              </span>
                              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                {feeItems.length}
                              </span>
                            </div>

                            <div className="space-y-2.5 mt-2.5">
                              {feeItems.length === 0 ? (
                                <p className="text-xs text-muted italic py-1 font-medium">বকেয়া ফি নেই ✓</p>
                              ) : (
                                feeItems.slice(0, 2).map((item) => (
                                  <div
                                    key={item.key}
                                    className="p-2.5 rounded-lg bg-surface border border-slate-200/90 shadow-3xs flex items-center justify-between gap-2"
                                  >
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate flex-1">
                                      {item.text}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => onNavigate(item.route)}
                                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 flex-shrink-0 cursor-pointer transition-colors"
                                    >
                                      ইনভয়েস
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onNavigate('#/invoices')}
                            className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 hover:underline text-left pt-1 inline-flex items-center gap-1 cursor-pointer"
                          >
                            See all {feeItems.length} →
                          </button>
                        </div>

                        {/* Column 3: Staff & Operations */}
                        <div className="p-3.5 rounded-xl border border-indigo-200/90 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-between pb-2.5 border-b border-indigo-100 dark:border-indigo-900/50">
                              <span className="text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                                <UserCheck className="w-4 h-4 text-indigo-600" />
                                Staff &amp; Reports
                              </span>
                              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                                {staffItems.length}
                              </span>
                            </div>

                            <div className="space-y-2.5 mt-2.5">
                              {staffItems.length === 0 ? (
                                <p className="text-xs text-muted italic py-1 font-medium">সব রিপোর্ট হালনাগাদ ✓</p>
                              ) : (
                                staffItems.slice(0, 2).map((item) => (
                                  <div
                                    key={item.key}
                                    className="p-2.5 rounded-lg bg-surface border border-slate-200/90 shadow-3xs flex items-center justify-between gap-2"
                                  >
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate flex-1">
                                      {item.text}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => onNavigate(item.route)}
                                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex-shrink-0 cursor-pointer transition-colors"
                                    >
                                      {getActionLabel(item.key)}
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onNavigate('#/reports')}
                            className="text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-300 hover:underline text-left pt-1 inline-flex items-center gap-1 cursor-pointer"
                          >
                            See all {staffItems.length} →
                          </button>
                        </div>

                        {/* Column 4: Requests & Support */}
                        <div className="p-3.5 rounded-xl border border-teal-200/90 bg-teal-50/40 dark:bg-teal-950/20 flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-center justify-between pb-2.5 border-b border-teal-100 dark:border-teal-900/50">
                              <span className="text-xs sm:text-sm font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                                <Megaphone className="w-4 h-4 text-teal-600" />
                                Requests &amp; Tickets
                              </span>
                              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                                {requestItems.length}
                              </span>
                            </div>

                            <div className="space-y-2.5 mt-2.5">
                              {requestItems.length === 0 ? (
                                <p className="text-xs text-muted italic py-1 font-medium">কোনো টিকেট বকেয়া নেই ✓</p>
                              ) : (
                                requestItems.slice(0, 2).map((item) => (
                                  <div
                                    key={item.key}
                                    className="p-2.5 rounded-lg bg-surface border border-slate-200/90 shadow-3xs flex items-center justify-between gap-2"
                                  >
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate flex-1">
                                      {item.text}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => onNavigate(item.route)}
                                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 flex-shrink-0 cursor-pointer transition-colors"
                                    >
                                      {getActionLabel(item.key)}
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onNavigate('#/tickets')}
                            className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-300 hover:underline text-left pt-1 inline-flex items-center gap-1 cursor-pointer"
                          >
                            See all {requestItems.length} →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── TAB 2: Star Students Honor Roll (Compact Vertical / Tiles) ── */}
                {activeTab === 'starStudents' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                        চলতি মাসের হিফজ সবক, আমোক্তা ও উপস্থিতির ভিত্তিতে শীর্ষ সম্মাননা প্রাপ্ত শিক্ষার্থী:
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate(isSuperAdminRole ? '#/governance' : '#/leaderboard')}
                        className="text-xs sm:text-sm font-bold text-primary-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        সম্পূর্ণ তালিকা →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {safeStarStudents.map((star) => (
                        <div
                          key={star.id}
                          className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-surface shadow-3xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-8 h-8 rounded-full font-black flex items-center justify-center text-xs sm:text-sm flex-shrink-0 ${
                                star.rank === 1
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : star.rank === 2
                                    ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {star.rank}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-xs sm:text-sm text-heading truncate">{star.student_name}</p>
                              <p className="text-xs text-muted truncate">{star.batch_name}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-black text-xs sm:text-sm text-primary-700 dark:text-primary-400">
                              {star.score}/১০০
                            </span>
                            <p className="text-[11px] text-muted font-semibold">{star.grade}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB 3: Running Live Classes ── */}
                {activeTab === 'liveClasses' && safeLiveClasses.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                        উস্তাদ ও ছাত্রগণ সরাসরি নিচের অনলাইন ক্লাসরুমে যুক্ত আছেন:
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate('#/classes')}
                        className="text-xs sm:text-sm font-bold text-primary-700 hover:underline cursor-pointer"
                      >
                        আজকের শিডিউলার →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {safeLiveClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/30 shadow-3xs flex items-center justify-between gap-2.5"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-heading truncate">{cls.course_title}</p>
                            <p className="text-xs text-muted truncate">
                              মুয়াল্লিম: {cls.teacher_name || 'নির্ধারিত উস্তাদ'} · {formatDhakaTime(cls.scheduled_start)}
                            </p>
                          </div>
                          {cls.meeting_url ? (
                            <a
                              href={cls.meeting_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-3xs flex-shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> ক্লাসরুম
                            </a>
                          ) : (
                            <span className="text-xs text-muted italic flex-shrink-0">চলমান</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
