import { useState } from 'react'
import { Calendar, Filter, RefreshCw, CheckCircle2 } from 'lucide-react'
import { getDhakaToday, formatDhakaDate } from '@/lib/utils'

export type DashboardDateRange = 'today' | 'week' | 'month' | 'last_month' | 'custom'

interface Props {
  selectedRange: DashboardDateRange
  onRangeChange: (range: DashboardDateRange) => void
  customStart?: string
  customEnd?: string
  onCustomChange?: (start: string, end: string) => void
  onRefresh?: () => void
  isRefreshing?: boolean
}

export default function DashboardGlobalFilterBar({
  selectedRange,
  onRangeChange,
  customStart,
  customEnd,
  onCustomChange,
  onRefresh,
  isRefreshing,
}: Props) {
  const [showCustomModal, setShowCustomModal] = useState(false)
  const today = getDhakaToday()

  const ranges: Array<{ id: DashboardDateRange; label: string }> = [
    { id: 'today', label: 'আজ' },
    { id: 'week', label: 'এই সপ্তাহ' },
    { id: 'month', label: 'চলতি মাস' },
    { id: 'last_month', label: 'বিগত মাস' },
    { id: 'custom', label: 'কাস্টম তারিখ' },
  ]

  return (
    <div className="bg-surface rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-3xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-700 shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">অ্যাকাডেমিক পিরিয়ড</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-2.5 h-2.5" /> ঢাকা সময়: {formatDhakaDate(today)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap max-w-full">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 overflow-x-auto max-w-full no-scrollbar flex-shrink-0">
          {ranges.map((r) => {
            const active = selectedRange === r.id
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  onRangeChange(r.id)
                  if (r.id === 'custom') setShowCustomModal(true)
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[34px] flex items-center ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow-3xs border border-slate-200/60 dark:border-slate-700 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {r.label}
              </button>
            )
          })}
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary-700' : ''}`} />
          </button>
        )}
      </div>

      {showCustomModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface rounded-xl border border-border p-5 max-w-sm w-full shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-heading flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-700" /> কাস্টম তারিখ নির্বাচন করুন
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">শুরুর তারিখ</label>
                <input
                  type="date"
                  value={customStart || today}
                  onChange={(e) => onCustomChange && onCustomChange(e.target.value, customEnd || today)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border text-xs bg-bg"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">শেষ তারিখ</label>
                <input
                  type="date"
                  value={customEnd || today}
                  onChange={(e) => onCustomChange && onCustomChange(customStart || today, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border text-xs bg-bg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 rounded-lg bg-primary-700 text-white text-xs font-semibold hover:bg-primary-800 cursor-pointer"
              >
                প্রয়োগ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
