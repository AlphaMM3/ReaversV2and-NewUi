import { useState, useMemo } from 'react'
import { Video, ExternalLink, CalendarDays } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDhakaTime } from '@/lib/utils'
import type { ClassSession } from '@/lib/api'

interface Props {
  todayClasses: ClassSession[]
  onNavigate: (route: string) => void
}

export default function TodayClassesSection({
  todayClasses = [],
  onNavigate,
}: Props) {
  const safeClasses = Array.isArray(todayClasses) ? todayClasses : []
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'scheduled' | 'ended'>('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return safeClasses
    return safeClasses.filter((c) => c.status === statusFilter)
  }, [safeClasses, statusFilter])

  return (
    <Card className="rounded-xl border-slate-200/90 shadow-3xs">
      <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between flex-wrap gap-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Video className="w-4 h-4 text-primary-700" />
            আজকের লাইভ অনলাইন ক্লাস ({safeClasses.length})
          </CardTitle>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/70 text-xs">
            {(['all', 'in_progress', 'scheduled', 'ended'] as const).map((st) => {
              const count = st === 'all' ? safeClasses.length : safeClasses.filter((c) => c.status === st).length
              const labels = {
                all: 'সকল',
                in_progress: 'চলমান (Live)',
                scheduled: 'আসন্ন',
                ended: 'সম্পন্ন',
              }
              const active = statusFilter === st
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    active ? 'bg-white text-primary-700 shadow-3xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labels[st]} ({count})
                </button>
              )
            })}
          </div>

          <Button size="sm" onClick={() => onNavigate('#/classes')}>
            <CalendarDays className="w-3.5 h-3.5" /> ক্লাস শিডিউলার
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted">
            <p>এই ফিল্টারে কোনো ক্লাস পাওয়া যায়নি।</p>
            <p className="text-[11px] mt-1">ক্লাস শিডিউলার থেকে নতুন ক্লাস নির্ধারণ করুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filtered.map((cls) => {
              const isLive = cls.status === 'in_progress'
              const isEnded = cls.status === 'ended'

              return (
                <div
                  key={cls.id}
                  className={`p-4 rounded-xl border transition-all shadow-3xs flex flex-col justify-between gap-3 ${
                    isLive
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : isEnded
                        ? 'border-slate-200 bg-slate-50/50'
                        : 'border-slate-200 bg-white hover:border-primary-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-heading truncate">{cls.course_title}</h4>
                      <Badge
                        variant={isLive ? 'live' : isEnded ? 'verified' : 'neutral'}
                        className="text-[10px] shrink-0"
                      >
                        {isLive ? 'LIVE' : isEnded ? 'ENDED' : 'SCHEDULED'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted mt-0.5 truncate">{cls.batch_name}</p>
                    <div className="mt-2 text-xs space-y-0.5 text-slate-700">
                      <p>উস্তাদ: <strong>{cls.teacher_name || 'মুয়াল্লিম'}</strong></p>
                      <p className="font-mono text-[11px] text-muted">
                        সময়: {formatDhakaTime(cls.scheduled_start)} ({cls.delivery_mode || 'Google Meet'})
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {cls.meeting_url ? (
                      <a
                        href={cls.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold shadow-3xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> জয়েন / মনিটর
                      </a>
                    ) : (
                      <span className="text-[11px] text-muted italic">মিটিং লিংক সংযুক্ত নেই</span>
                    )}

                    <button
                      type="button"
                      onClick={() => onNavigate(`#/attendance?classId=${cls.id}`)}
                      className="min-h-[38px] px-2 flex items-center text-xs font-semibold text-primary-700 dark:text-primary-400 hover:underline cursor-pointer"
                    >
                      হাজিরা →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
