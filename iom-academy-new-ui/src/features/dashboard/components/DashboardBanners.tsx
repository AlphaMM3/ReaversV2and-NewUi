import React from 'react'
import {
  X,
  Video,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  Activity,
  Award,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDhakaTime } from '@/lib/utils'
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

export default function DashboardBanners({
  user,
  isSuperAdminRole,
  monthKey,
  welcomeBanner,
  liveMonitorBanner,
  starStudentsBanner,
  liveNowClasses,
  todayClassesCount,
  starStudents,
  attentionRows,
  attentionClosing = false,
  onDismissAttention,
  onNavigate,
}: Props) {
  const firstName = user.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'শুভ সকাল' : hour < 17 ? 'শুভ অপরাহ্ন' : 'শুভ সন্ধ্যা'

  return (
    <div className="space-y-4">
      {/* 1. Institutional Academy Orientation Bar (Clean, Utility-First) */}
      {welcomeBanner.visible && (
        <div
          onMouseEnter={welcomeBanner.pause}
          onMouseLeave={welcomeBanner.resume}
          className={`bg-surface rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-3xs transition-all duration-300 relative ${
            welcomeBanner.closing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pr-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {greeting}, {firstName} · ইতকান একাডেমি অনলাইন অপারেশনস
                </p>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-heading tracking-tight mt-0.5">
                IOM Itqaan Academy Control Center
              </h2>
              <p className="text-xs text-muted mt-0.5">
                দৈনিক লাইভ ক্লাস, উপস্থিতি ট্র্যাকিং, সবক পর্যবেক্ষণ ও ফি আদায়ের সার্বিক নিয়ন্ত্রণ কেন্দ্র
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isSuperAdminRole && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate('#/executive')}
                  className="min-h-[40px] sm:min-h-[38px] text-xs font-semibold"
                >
                  এক্সিকিউটিভ রিপোর্ট
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate('#/approvals')}
                className="min-h-[40px] sm:min-h-[38px] text-xs font-semibold"
              >
                অনুমোদন কেন্দ্র
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={welcomeBanner.dismiss}
            aria-label="Dismiss orientation banner"
            title="Dismiss"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Live Classrooms Right Now — Silent Monitor */}
      {liveMonitorBanner.visible && (
        <div
          onMouseEnter={liveMonitorBanner.pause}
          onMouseLeave={liveMonitorBanner.resume}
          className={`transition-all duration-300 ${
            liveMonitorBanner.closing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        >
          <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-3xs">
            <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-heading">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  {isSuperAdminRole
                    ? 'চলমান অনলাইন ক্লাস — অধ্যক্ষ লাইভ সাইলেন্ট মনিটর'
                    : 'চলমান অনলাইন ক্লাস — যিম্মাদার লাইভ মনিটর'}
                  <Badge variant={liveNowClasses.length > 0 ? 'live' : 'neutral'} className="text-[10px]">
                    {liveNowClasses.length} Live
                  </Badge>
                </CardTitle>
              </div>
              <button
                type="button"
                onClick={liveMonitorBanner.dismiss}
                aria-label="Dismiss live monitor banner"
                title="Dismiss"
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="pt-3.5">
              {liveNowClasses.length === 0 ? (
                <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-muted bg-bg rounded-xl px-4 py-3 border border-border">
                  <span>
                    বর্তমানে কোনো অনলাইন ক্লাস চলমান নেই। আজকের শিডিউলার থেকে উস্তাদগণ সরাসরি ক্লাসরুম চালু করবেন।
                  </span>
                  <Button size="sm" variant="outline" onClick={() => onNavigate('#/classes')} className="min-h-[40px] sm:min-h-[36px]">
                    <Video className="w-3.5 h-3.5" /> আজকের ক্লাস শিডিউলার ({todayClassesCount})
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {liveNowClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-surface shadow-3xs flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-heading truncate">{cls.course_title}</h4>
                          <Badge variant="live" className="shrink-0 text-[10px]">
                            LIVE
                          </Badge>
                        </div>
                        <p className="text-xs text-muted mt-0.5 truncate">{cls.batch_name}</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">
                          মুয়াল্লিম: <strong>{cls.teacher_name || 'নির্ধারিত উস্তাদ'}</strong>
                        </p>
                        <p className="text-[11px] text-muted mt-0.5 font-mono">
                          সময়: {formatDhakaTime(cls.scheduled_start)} ({cls.delivery_mode || 'Google Meet'})
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        {cls.meeting_url ? (
                          <a
                            href={cls.meeting_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-3xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> ক্লাসরুমে প্রবেশ
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted italic">মিটিং লিংক সংযুক্ত নেই</span>
                        )}
                        <button
                          type="button"
                          onClick={() => onNavigate(`#/attendance?classId=${cls.id}`)}
                          className="min-h-[36px] px-2 text-xs font-semibold text-primary-700 dark:text-primary-400 hover:underline cursor-pointer"
                        >
                          হাজিরা খাতা →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Monthly Star Students Honor Roll */}
      {starStudentsBanner.visible && (
        <div
          onMouseEnter={starStudentsBanner.pause}
          onMouseLeave={starStudentsBanner.resume}
          className={`transition-all duration-300 ${
            starStudentsBanner.closing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        >
          <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 shadow-3xs">
            <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-heading">
                  <Award className="w-4 h-4 text-amber-600" />
                  মাসিক সেরা শিক্ষার্থী ও সম্মাননা তালিকা · {monthKey}
                </CardTitle>
                <p className="text-xs text-muted mt-0.5">
                  হিফজ সবক, সাত সবক ও মাসিক পরীক্ষার মূল্যায়নে শীর্ষ শিক্ষার্থী
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate(isSuperAdminRole ? '#/governance' : '#/approvals')}
                  className="min-h-[36px] text-xs font-semibold text-primary-700 dark:text-primary-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {isSuperAdminRole ? 'ম্যানেজ ও পাবলিশ' : 'পর্যালোচনা'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={starStudentsBanner.dismiss}
                  aria-label="Dismiss monthly star students banner"
                  title="Dismiss"
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-3.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {starStudents.map((star) => (
                  <div
                    key={star.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-surface shadow-3xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-full font-black flex items-center justify-center text-xs shadow-xs flex-shrink-0 ${
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
                        <p className="text-[11px] text-muted truncate">{star.batch_name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-xs sm:text-sm text-primary-700 dark:text-primary-400">{star.score}/১০০</span>
                      <p className="text-[10px] text-muted font-medium">{star.grade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Attention Queue Banner */}
      {attentionRows.length > 0 && (
        <div
          className={`transition-all duration-300 ${
            attentionClosing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="rounded-2xl border border-amber-200/90 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-3xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                  জরুরি কার্যক্রম — {attentionRows.length}টি বিষয়ে দৃষ্টি আকর্ষণ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onDismissAttention?.()}
                className="w-8 h-8 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center transition-colors cursor-pointer text-xs"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {attentionRows.slice(0, 4).map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => onNavigate(row.route)}
                  className="p-3 rounded-xl bg-surface border border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400 text-left transition-colors flex items-center gap-2.5 cursor-pointer shadow-3xs min-h-[44px]"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${row.iconBg}`}>
                    {row.icon}
                  </div>
                  <p className="text-xs text-heading font-medium truncate flex-1">{row.text}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
