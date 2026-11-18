import React from 'react'
import {
  Sparkles,
  X,
  Video,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  Trophy,
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
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-4">
      {/* 1. Hero Welcome Banner */}
      {welcomeBanner.visible && (
        <div
          onMouseEnter={welcomeBanner.pause}
          onMouseLeave={welcomeBanner.resume}
          className={`bg-royal-gradient rounded-2xl pl-5 sm:pl-7 pr-12 sm:pr-14 py-5 sm:py-6 text-white relative overflow-hidden shadow-sm transition-all duration-300 ${
            welcomeBanner.closing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-200 font-semibold mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {greeting}, {firstName} — Itqaan Control Center
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                IOM Itqaan Academy Platform
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
                Real-time operational dashboard for online Quran, Hifz, and Islamic studies.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={welcomeBanner.dismiss}
            aria-label="Dismiss welcome banner"
            title="Dismiss"
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
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
          <Card className="rounded-2xl border-emerald-300/80 bg-gradient-to-r from-emerald-50/60 via-white to-emerald-50/40 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="relative flex h-2.5 w-2.5">
                    {liveNowClasses.length > 0 && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        liveNowClasses.length > 0 ? 'bg-emerald-600' : 'bg-slate-400'
                      }`}
                    />
                  </span>
                  {isSuperAdminRole
                    ? 'Live Classrooms Right Now — Principal Silent Monitor'
                    : 'Live Classrooms Right Now — Zimmadar Monitor'}
                  <Badge variant={liveNowClasses.length > 0 ? 'live' : 'neutral'}>
                    {liveNowClasses.length} Live
                  </Badge>
                </CardTitle>
              </div>
              <button
                type="button"
                onClick={liveMonitorBanner.dismiss}
                aria-label="Dismiss live monitor banner"
                title="Dismiss"
                className="w-7 h-7 rounded-full bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="pt-3.5">
              {liveNowClasses.length === 0 ? (
                <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-muted bg-surface/80 rounded-xl px-4 py-3 border border-border">
                  <span>
                    No online classroom sessions are currently in progress. Teachers launch Zoom/Meet rooms from
                    Today&apos;s Classes.
                  </span>
                  <Button size="sm" variant="outline" onClick={() => onNavigate('#/classes')}>
                    <Video className="w-3.5 h-3.5" /> View Today&apos;s Classes ({todayClassesCount})
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {liveNowClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3.5 rounded-xl border border-emerald-200 bg-surface shadow-2xs flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-heading truncate">{cls.course_title}</h4>
                          <Badge variant="live" className="shrink-0 text-[10px]">
                            LIVE NOW
                          </Badge>
                        </div>
                        <p className="text-xs text-muted mt-0.5 truncate">{cls.batch_name}</p>
                        <p className="text-xs text-slate-700 mt-1 font-medium">
                          উস্তাদ: <strong>{cls.teacher_name || 'Assigned Teacher'}</strong>
                        </p>
                        <p className="text-[11px] text-muted mt-0.5 font-mono">
                          শুরু: {formatDhakaTime(cls.scheduled_start)} ({cls.delivery_mode || 'Google Meet'})
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        {cls.meeting_url ? (
                          <a
                            href={cls.meeting_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-3xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> ক্লাসরুম অবেজার্ভ করুন
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted italic">Meeting URL not set</span>
                        )}
                        <button
                          type="button"
                          onClick={() => onNavigate(`#/attendance?classId=${cls.id}`)}
                          className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer"
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
          <Card className="rounded-2xl border-amber-300/80 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-950">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  Monthly Star Students &amp; Honor Roll · {monthKey}
                </CardTitle>
                <p className="text-xs text-muted mt-0.5">
                  Top evaluated students across Group Batches &amp; 1:1 Hifz tracks based on attendance, daily sabaq, and
                  assessments.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate(isSuperAdminRole ? '#/governance' : '#/approvals')}
                  className="text-xs font-semibold text-primary-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {isSuperAdminRole ? 'Manage & Publish to Web' : 'Review & Recommend'}{' '}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={starStudentsBanner.dismiss}
                  aria-label="Dismiss monthly star students banner"
                  title="Dismiss"
                  className="w-7 h-7 rounded-full bg-amber-100/80 hover:bg-amber-200 text-amber-900 flex items-center justify-center transition-colors cursor-pointer"
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
                    className="p-3.5 rounded-xl border border-amber-200/70 bg-surface shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full font-black flex items-center justify-center text-xs shadow-xs ${
                          star.rank === 1
                            ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                            : star.rank === 2
                              ? 'bg-slate-200 text-slate-800 ring-2 ring-slate-300'
                              : 'bg-amber-700/20 text-amber-900 ring-2 ring-amber-700/30'
                        }`}
                      >
                        {star.rank}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-heading truncate max-w-[170px]">{star.student_name}</p>
                        <p className="text-xs text-muted truncate max-w-[170px]">{star.batch_name}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-sm text-primary-700">{star.score}/১০০</span>
                      <p className="text-[10px] text-muted">{star.grade}</p>
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
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-3xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Today — {attentionRows.length} item{attentionRows.length > 1 ? 's' : ''} need attention
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onDismissAttention?.()}
                className="w-6 h-6 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center transition-colors cursor-pointer text-xs"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {attentionRows.slice(0, 4).map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => onNavigate(row.route)}
                  className="p-2.5 rounded-xl bg-white border border-amber-200/80 hover:border-amber-400 text-left transition-colors flex items-center gap-2 cursor-pointer shadow-3xs"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${row.iconBg}`}>
                    {row.icon}
                  </div>
                  <p className="text-xs text-slate-800 font-medium truncate flex-1">{row.text}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
