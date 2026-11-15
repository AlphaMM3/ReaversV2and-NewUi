import {
  LayoutDashboard, CheckSquare, Video, Calendar, CalendarDays, RefreshCw, FileText, BookOpen,
  ClipboardCheck, BarChart2, AlertTriangle, CalendarOff, UserPlus, Users,
  ClipboardList, Home, TrendingUp, User, Heart, CreditCard, Package,
  Receipt, DollarSign, Settings, Shield, FolderOpen, MessageSquare, ChevronRight, ChevronDown,
  LucideProps, UserCheck, Wallet, Award, BellRing, SlidersHorizontal, KeyRound, Trophy,
} from 'lucide-react'
import type { NavItem, NavGroupMeta } from './navConfig'
import { cn } from '@/lib/utils'

// Map icon string → component
const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  LayoutDashboard, CheckSquare, Video, Calendar, CalendarDays, RefreshCw, FileText, BookOpen,
  ClipboardCheck, BarChart2, AlertTriangle, CalendarOff, UserPlus, Users,
  ClipboardList, Home, TrendingUp, User, Heart, CreditCard, Package,
  Receipt, DollarSign, Settings, Shield, FolderOpen, MessageSquare,
  UserCheck, Wallet, Award, BellRing, SlidersHorizontal, KeyRound, Trophy,
}

export function getNavIcon(name: string): React.ComponentType<LucideProps> {
  return ICONS[name] ?? LayoutDashboard
}

interface SidebarItemProps {
  item: NavItem
  isActive: boolean
  badge?: number
  collapsed?: boolean
  onClick: () => void
}

export function SidebarNavItem({ item, isActive, badge, collapsed = false, onClick }: SidebarItemProps) {
  const Icon = getNavIcon(item.icon)

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        title={item.label}
        className={cn(
          'relative w-full flex items-center justify-center p-2.5 min-h-[42px] rounded-xl transition-all duration-150 group cursor-pointer',
          isActive
            ? 'bg-primary-50 text-primary-700 shadow-[inset_0_0_0_1px_rgba(29,78,216,0.2)]'
            : 'text-slate-500 hover:bg-white hover:text-primary-800 hover:shadow-3xs',
        )}
      >
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary-700"
          />
        )}
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative w-full flex items-center gap-2.5 px-3 py-2 min-h-[40px] rounded-xl text-[13px] transition-all duration-150 group cursor-pointer',
        isActive
          ? 'bg-gradient-to-r from-primary-50/95 via-primary-50/70 to-white/40 text-primary-950 font-semibold shadow-[inset_0_0_0_1px_rgba(29,78,216,0.18)]'
          : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-3xs font-medium',
      )}
    >
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-primary-600 to-primary-800"
        />
      )}
      <Icon
        className={cn(
          'w-[17px] h-[17px] flex-shrink-0 transition-colors',
          isActive ? 'text-primary-700' : 'text-slate-400 group-hover:text-primary-700',
        )}
      />
      <span className="flex-1 text-left truncate">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto text-[11px] font-bold bg-red-600 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center tabular-nums">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {!isActive && (
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </button>
  )
}

interface SidebarGroupProps {
  meta: NavGroupMeta
  urgentCount?: number
  hasActiveChild: boolean
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function SidebarGroup({
  meta,
  urgentCount = 0,
  hasActiveChild,
  isOpen,
  onToggle,
  children,
}: SidebarGroupProps) {
  const panelId = `sidebar-group-${meta.key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const GroupIcon = getNavIcon(meta.icon)

  return (
    <section className="mb-2" aria-label={meta.label}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cn(
          'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer group border',
          hasActiveChild || isOpen
            ? 'bg-gradient-to-r from-primary-50/90 to-primary-50/40 border-primary-200/80 text-primary-950 shadow-2xs font-bold'
            : 'bg-white/80 border-slate-200/70 hover:bg-white hover:border-slate-300/80 text-slate-700 shadow-3xs',
        )}
      >
        <span
          className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
            hasActiveChild
              ? 'bg-gradient-to-br from-primary-800 to-primary-600 text-white shadow-xs'
              : 'bg-slate-100/80 text-slate-600 border border-slate-200/80 group-hover:bg-primary-50 group-hover:text-primary-700 group-hover:border-primary-200',
          )}
        >
          <GroupIcon className="w-3.5 h-3.5" />
        </span>
        <span
          className={cn(
            'flex-1 min-w-0 text-[12px] font-bold tracking-wide uppercase truncate',
            hasActiveChild ? 'text-primary-950' : 'text-slate-700 group-hover:text-slate-900',
          )}
        >
          {meta.label}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isOpen && urgentCount > 0 && (
            <span className="text-[11px] font-bold bg-red-600 text-white rounded-full px-1.5 py-0.5 tabular-nums">
              {urgentCount > 99 ? '99+' : urgentCount}
            </span>
          )}
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-primary-700 transition-transform" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform" />
          )}
        </div>
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="ml-3.5 pl-2.5 mt-1.5 border-l-2 border-primary-100 flex flex-col gap-0.5"
        >
          {children}
        </div>
      )}
    </section>
  )
}
