import React, { useState } from 'react'
import { Users, Video, Receipt, AlertTriangle, Wallet, UserCheck, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/KpiCard'
import { cn } from '@/lib/utils'
import type { DashboardSummary } from '@/lib/api'

interface SmartKpiCardProps {
  label: string
  value: string | number
  sub: string
  badge?: string
  footerLink?: { label: string; route: string }
  icon: React.ReactNode
  iconBg: string
  loading: boolean
  onNavigate: (route: string) => void
}

export function SmartKpiCard({
  label,
  value,
  sub,
  badge,
  footerLink,
  icon,
  iconBg,
  loading,
  onNavigate,
}: SmartKpiCardProps) {
  return (
    <div
      role={footerLink ? 'button' : undefined}
      tabIndex={footerLink ? 0 : undefined}
      onClick={() => footerLink && onNavigate(footerLink.route)}
      onKeyDown={(e) => {
        if (footerLink && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onNavigate(footerLink.route)
        }
      }}
      className={cn(
        'h-full bg-surface rounded-xl border border-slate-200/90 p-3 sm:p-4 lg:p-4.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]',
        'hover:shadow-md hover:border-primary-300 transition-all flex flex-col justify-between gap-2 sm:gap-2.5',
        footerLink && 'cursor-pointer group active:scale-[0.98]',
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          <div
            className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-4.5 sm:[&>svg]:h-4.5',
              iconBg,
            )}
          >
            {icon}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {badge && (
              <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {badge}
              </span>
            )}
            {footerLink && (
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-slate-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-700 transition-colors" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 sm:mt-2.5">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-primary-700 transition-colors truncate">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 mt-1" />
          ) : (
            <div className="flex items-baseline gap-1.5 mt-0.5 sm:mt-1">
              <p className="text-xl sm:text-2xl font-black text-heading tracking-tight tabular-nums truncate">
                {value}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px] sm:text-xs">
        <p className="text-slate-500 truncate font-medium">{sub}</p>
        {footerLink && (
          <span className="hidden sm:inline font-semibold text-primary-700 group-hover:underline flex-shrink-0">
            {footerLink.label}
          </span>
        )}
      </div>
    </div>
  )
}

interface Props {
  summary?: DashboardSummary
  loadingSummary: boolean
  todayClassesCount: number
  endedClassesCount: number
  inProgressClassesCount: number
  loadingClasses: boolean
  attendanceAvgPct: number | null
  monthKey: string
  monthCollected: number
  monthBilled: number
  monthCollectionPct: number
  totalOutstanding: number
  unpaidInvoicesCount: number
  netBalanceMonth: number
  monthPayablesTotal: number
  monthOperatingExpenses: number
  usersCount: number
  teacherCount: number
  zimmadarCount: number
  onNavigate: (route: string) => void
}

export default function DashboardKpiStrip({
  summary,
  loadingSummary,
  todayClassesCount,
  endedClassesCount,
  inProgressClassesCount,
  loadingClasses,
  attendanceAvgPct,
  monthKey: _monthKey,
  monthCollected,
  monthBilled,
  monthCollectionPct,
  totalOutstanding,
  unpaidInvoicesCount,
  netBalanceMonth,
  monthPayablesTotal,
  monthOperatingExpenses: _monthOperatingExpenses,
  usersCount,
  teacherCount,
  zimmadarCount,
  onNavigate,
}: Props) {
  const [showExtraKpisMobile, setShowExtraKpisMobile] = useState(false)

  return (
    <div className="space-y-2.5">
      {/* 4 Primary KPI cards in 2x2 grid on mobile, desktop 2x3 grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 lg:gap-4 items-stretch">
        {/* Card 1: Active Students */}
        <SmartKpiCard
          label="সক্রিয় শিক্ষার্থী"
          value={summary?.students ?? '—'}
          sub={`${summary?.group_enrollments ?? 0} গ্রুপ · ${summary?.one_to_one_enrollments ?? 0} ১:১`}
          footerLink={{ label: 'শিক্ষার্থী তালিকা →', route: '#/students' }}
          icon={<Users className="w-4.5 h-4.5 text-primary-700" />}
          iconBg="bg-primary-50"
          loading={loadingSummary}
          onNavigate={onNavigate}
        />

        {/* Card 2: Attendance & Classes Today */}
        <SmartKpiCard
          label="আজকের ক্লাস ও উপস্থিতি"
          value={
            todayClassesCount > 0
              ? `${todayClassesCount}টি ক্লাস`
              : attendanceAvgPct !== null
                ? `${attendanceAvgPct}%`
                : '—'
          }
          sub={`${endedClassesCount} সম্পন্ন · ${inProgressClassesCount} চলমান · গড় ${attendanceAvgPct ?? '—'}%`}
          footerLink={{ label: 'হাজিরা গ্রহণ →', route: '#/attendance' }}
          icon={<Video className="w-4.5 h-4.5 text-teal-700" />}
          iconBg="bg-teal-50"
          loading={loadingClasses}
          onNavigate={onNavigate}
        />

        {/* Card 3: Fee Collected */}
        <SmartKpiCard
          label="আদায়কৃত টিউশন ফি"
          value={`৳ ${monthCollected.toLocaleString()}`}
          badge={monthBilled > 0 ? `${monthCollectionPct}%` : undefined}
          sub={`বিল: ৳ ${monthBilled.toLocaleString()}`}
          footerLink={{ label: 'বিলিং খাতা →', route: '#/invoices' }}
          icon={<Receipt className="w-4.5 h-4.5 text-emerald-700" />}
          iconBg="bg-emerald-50"
          loading={false}
          onNavigate={onNavigate}
        />

        {/* Card 4: Fee Pending (Due) */}
        <SmartKpiCard
          label="বকেয়া টিউশন ফি"
          value={`৳ ${totalOutstanding.toLocaleString()}`}
          sub={`${unpaidInvoicesCount}টি বকেয়া ইনভয়েস`}
          footerLink={{ label: 'বকেয়া তালিকা →', route: '#/invoices' }}
          icon={<AlertTriangle className="w-4.5 h-4.5 text-rose-600" />}
          iconBg="bg-rose-50"
          loading={false}
          onNavigate={onNavigate}
        />

        {/* Extra Cards (Cards 5 & 6) — visible on desktop, or toggled on mobile */}
        <div className={cn('col-span-2 sm:col-span-1', !showExtraKpisMobile && 'hidden sm:block')}>
          <SmartKpiCard
            label="নেট ব্যালেন্স"
            value={`৳ ${netBalanceMonth.toLocaleString()}`}
            sub={`আদায় ৳ ${monthCollected.toLocaleString()} · প্রদেয় ৳ ${monthPayablesTotal.toLocaleString()}`}
            footerLink={{ label: 'ব্যয় ও হিসাব →', route: '#/expenses' }}
            icon={<Wallet className="w-4.5 h-4.5 text-primary-700" />}
            iconBg="bg-primary-50"
            loading={false}
            onNavigate={onNavigate}
          />
        </div>

        <div className={cn('col-span-2 sm:col-span-1', !showExtraKpisMobile && 'hidden sm:block')}>
          <SmartKpiCard
            label="মুয়াল্লিম ও স্টাফ"
            value={usersCount > 0 ? usersCount : summary?.active_enrollments ?? '—'}
            sub={
              usersCount > 0
                ? `${teacherCount} উস্তাদ · ${zimmadarCount} যিম্মাদার`
                : `${summary?.active_enrollments ?? 0} জন সক্রিয়`
            }
            footerLink={{ label: 'ডিরেক্টরি →', route: '#/settings' }}
            icon={<UserCheck className="w-4.5 h-4.5 text-amber-700" />}
            iconBg="bg-amber-50"
            loading={false}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* Mobile toggle button for the 2 extra cards */}
      <div className="sm:hidden flex justify-center pt-0.5">
        <button
          type="button"
          onClick={() => setShowExtraKpisMobile((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors shadow-3xs cursor-pointer active:scale-95"
        >
          {showExtraKpisMobile ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              সংক্ষেপ করুন (৪ টি মূল বক্স)
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              + আরও ২ টি মেট্রিক (নেট ব্যালেন্স ও স্টাফ)
            </>
          )}
        </button>
      </div>
    </div>
  )
}
