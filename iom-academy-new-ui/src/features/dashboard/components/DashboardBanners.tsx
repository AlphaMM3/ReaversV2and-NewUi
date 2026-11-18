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
  liveNowClasses,
  starStudents,
  attentionRows,
  attentionClosing = false,
  onDismissAttention,
  onNavigate,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('attention')
  const [collapsed, setCollapsed] = useState(false)

  const firstName = user.name ? user.name.split(' ')[0] : 'ইউজার'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Categorize attention rows into 4 distinct structured buckets (matching reference UI)
  const atRiskItems = attentionRows.filter(
    (r) => r.key === 'followups' || r.key === 'verify-held',
  )
  const feeItems = attentionRows.filter((r) => r.key === 'invoices')
  const staffItems = attentionRows.filter(
    (r) => r.key === 'teacher-leaves' || r.key === 'reports',
  )
  const requestItems = attentionRows.filter(
    (r) => r.key === 'admissions' || r.key === 'tickets' || r.key === 'leaves',
  )

  const totalAttentionCount = attentionRows.length

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
    <div className="space-y-3.5">
      {/* ── 1. Top Executive Greeting Bar (Clean & Lightweight) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl" role="img" aria-label="wave">
              👋
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-heading tracking-tight">
              {greeting}, {firstName}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 font-semibold border border-primary-200">
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

      {/* ── 2. Unified "Needs Attention" Box (Compact & Categorized) ── */}
      <div
        className={`bg-surface rounded-2xl border-2 border-amber-300/80 dark:border-amber-700/80 shadow-xs relative overflow-hidden transition-all duration-300 ${
          attentionClosing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Top Accent Strip */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 w-full" />

        <div className="p-3.5 sm:p-5">
          {/* Card Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-heading">
                  Needs attention
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {totalAttentionCount} things waiting
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted mt-0.5">
                {totalAttentionCount > 0
                  ? `${totalAttentionCount}টি বিষয়ে দ্রুত পদক্ষেপ নেওয়া প্রয়োজন`
                  : 'সকল কার্যক্রম হালনাগাদ রয়েছে'}
              </p>
            </div>

            {/* Segmented Switcher & Quick Collapse */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('attention')
                    setCollapsed(false)
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeTab === 'starStudents' && !collapsed
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-3xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  সেরা শিক্ষার্থী ({starStudents.length})
                </button>
                {liveNowClasses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('liveClasses')
                      setCollapsed(false)
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === 'liveClasses' && !collapsed
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-3xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    লাইভ ({liveNowClasses.length})
                  </button>
                )}
              </div>

              {/* Collapse Toggle */}
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title={collapsed ? 'প্রসারিত করুন' : 'সংক্ষেপ করুন'}
              >
                {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>

              {/* Dismiss Box */}
              {onDismissAttention && (
                <button
                  type="button"
                  onClick={onDismissAttention}
                  className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center transition-colors cursor-pointer text-xs"
                  title="লুকান"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Collapsed State Summary */}
          {collapsed ? (
            <div className="pt-2.5 flex items-center justify-between text-xs text-muted">
              <span>নোটিফিকেশন সংক্ষেপিত অবস্থায় রয়েছে। দেখতে প্রসারিত করুন।</span>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="font-semibold text-primary-700 hover:underline cursor-pointer"
              >
                বিস্তারিত দেখুন ▾
              </button>
            </div>
          ) : (
            <div className="pt-3.5">
              {/* ── TAB 1: Attention Queue Categorized (4 Clean Columns) ── */}
              {activeTab === 'attention' && (
                <>
                  {totalAttentionCount === 0 ? (
                    <div className="py-6 text-center text-xs text-emerald-800 dark:text-emerald-300 flex flex-col items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      <p className="font-bold text-sm">আলহামদুলিল্লাহ! কোনো জরুরি অ্যাকশন অপেক্ষমাণ নেই</p>
                      <p className="text-muted text-xs">সকল ক্লাস, রিপোর্ট, ফি ও ছুটির আবেদন সম্পূর্ণ হালনাগাদ রয়েছে।</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 items-stretch">
                      {/* Column 1: At-risk students */}
                      <div className="p-3 rounded-xl border border-rose-200/80 bg-rose-50/30 dark:bg-rose-950/10 flex flex-col justify-between gap-2.5">
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-rose-900/50">
                            <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              At-risk students
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                              {atRiskItems.length}
                            </span>
                          </div>

                          <div className="space-y-2 mt-2">
                            {atRiskItems.length === 0 ? (
                              <p className="text-[11px] text-muted italic py-1">হাজিরা সন্তোষজনক ✓</p>
                            ) : (
                              atRiskItems.slice(0, 2).map((item) => (
                                <div
                                  key={item.key}
                                  className="p-2 rounded-lg bg-surface border border-slate-200/80 shadow-3xs flex items-center justify-between gap-1.5"
                                >
                                  <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                                    {item.text}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => onNavigate(item.route)}
                                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex-shrink-0 cursor-pointer"
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
                          className="text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:underline text-left pt-1 inline-flex items-center gap-1 cursor-pointer"
                        >
                          See all {atRiskItems.length} →
                        </button>
                      </div>

                      {/* Column 2: Fee defaulters */}
                      <div className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/30 dark:bg-amber-950/10 flex flex-col justify-between gap-2.5">
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-amber-100 dark:border-amber-900/50">
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 text-amber-600" />
                              Fee defaulters
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              {feeItems.length}
                            </span>
                          </div>

                          <div className="space-y-2 mt-2">
                            {feeItems.length === 0 ? (
                              <p className="text-[11px] text-muted italic py-1">বকেয়া ফি নেই ✓</p>
                            ) : (
                              feeItems.slice(0, 2).map((item) => (
                                <div
                                  key={item.key}
                                  className="p-2 rounded-lg bg-surface border border-slate-200/80 shadow-3xs flex items-center justify-between gap-1.5"
                                >
                                  <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                                    {item.text}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => onNavigate(item.route)}
                                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 flex-shrink-0 cursor-pointer"
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
                          className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline text-left pt-1 inline-flex items-center gap-1 cursor-pointer"
                        >
                          See all {feeItems.length} →
                        </button>
                      </div>

                      {/* Column 3: Staff & Operations */}
                      <div className="p-3 rounded-xl border border-indigo-200/80 bg-indigo-50/30 dark:bg-indigo-950/10 flex flex-col justify-between gap-2.5">
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-900/50">
                            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                              Staff &amp; Reports
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              {staffItems.length}
                            </span>
                          </div>

                          <div className="space-y-2 mt-2">
                            {staffItems.length === 0 ? (
                              <p className="text-[11px] text-muted italic py-1">সব রিপোর্ট হালনাগাদ ✓</p>
                            ) : (
                              staffItems.slice(0, 2).map((item) => (
                                <div
                                  key={item.key}
                                  className="p-2 rounded-lg bg-surface border border-slate-200/80 shadow-3xs flex items-center justify-between gap-1.5"
                                >
                                  <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                                    {item.text}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => onNavigate(item.route)}
                                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex-shrink-0 cursor-pointer"
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
                          className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline text-left pt-1 inline-flex items-center gap-1 cursor-pointer"
                        >
                          See all {staffItems.length} →
                        </button>
                      </div>

                      {/* Column 4: Requests & Support */}
                      <div className="p-3 rounded-xl border border-teal-200/80 bg-teal-50/30 dark:bg-teal-950/10 flex flex-col justify-between gap-2.5">
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-teal-100 dark:border-teal-900/50">
                            <span className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                              <Megaphone className="w-3.5 h-3.5 text-teal-600" />
                              Requests &amp; Tickets
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                              {requestItems.length}
                            </span>
                          </div>

                          <div className="space-y-2 mt-2">
                            {requestItems.length === 0 ? (
                              <p className="text-[11px] text-muted italic py-1">কোনো টিকেট বকেয়া নেই ✓</p>
                            ) : (
                              requestItems.slice(0, 2).map((item) => (
                                <div
                                  key={item.key}
                                  className="p-2 rounded-lg bg-surface border border-slate-200/80 shadow-3xs flex items-center justify-between gap-1.5"
                                >
                                  <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                                    {item.text}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => onNavigate(item.route)}
                                    className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 flex-shrink-0 cursor-pointer"
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
                          className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline text-left pt-1 inline-flex items-center gap-1 cursor-pointer"
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
                    <p className="text-xs text-muted">
                      চলতি মাসের হিফজ সবক, আমোক্তা ও উপস্থিতির ভিত্তিতে শীর্ষ সম্মাননা প্রাপ্ত শিক্ষার্থী:
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate(isSuperAdminRole ? '#/governance' : '#/leaderboard')}
                      className="text-xs font-semibold text-primary-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      সম্পূর্ণ তালিকা →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {starStudents.map((star) => (
                      <div
                        key={star.id}
                        className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-surface shadow-3xs flex items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-full font-black flex items-center justify-center text-xs flex-shrink-0 ${
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
                            <p className="font-bold text-xs text-heading truncate">{star.student_name}</p>
                            <p className="text-[10px] text-muted truncate">{star.batch_name}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-black text-xs text-primary-700 dark:text-primary-400">
                            {star.score}/১০০
                          </span>
                          <p className="text-[9px] text-muted font-medium">{star.grade}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 3: Running Live Classes ── */}
              {activeTab === 'liveClasses' && liveNowClasses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">
                      উস্তাদ ও ছাত্রগণ সরাসরি নিচের অনলাইন ক্লাসরুমে যুক্ত আছেন:
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('#/classes')}
                      className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer"
                    >
                      আজকের শিডিউলার →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {liveNowClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20 shadow-3xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-heading truncate">{cls.course_title}</p>
                          <p className="text-[11px] text-muted truncate">
                            মুয়াল্লিম: {cls.teacher_name || 'নির্ধারিত উস্তাদ'} · {formatDhakaTime(cls.scheduled_start)}
                          </p>
                        </div>
                        {cls.meeting_url ? (
                          <a
                            href={cls.meeting_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-3xs flex-shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" /> ক্লাসরুম
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted italic flex-shrink-0">চলমান</span>
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
    </div>
  )
}
