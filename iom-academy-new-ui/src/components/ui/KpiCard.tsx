import { cn, initials, avatarColor } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  trend?: { value: string; positive: boolean }
  color?: 'blue' | 'teal' | 'orange' | 'red'
  loading?: boolean
}

const colorMap = {
  blue:   'bg-primary-100 text-primary-700',
  teal:   'bg-teal-100 text-teal-700',
  orange: 'bg-amber-100 text-amber-700',
  red:    'bg-red-100 text-red-700',
}

export function KpiCard({ label, value, icon, trend, color = 'blue', loading }: KpiCardProps) {
  return (
    <div className="h-full bg-surface rounded-2xl border border-slate-200/90 p-5 flex items-start gap-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-primary-200 transition-colors">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', colorMap[color])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted font-semibold uppercase tracking-wider truncate">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-8 w-20 bg-border rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-heading mt-1 tabular-nums font-heading">{value}</p>
        )}
        {trend && (
          <p className={cn('text-xs mt-1', trend.positive ? 'text-green-600' : 'text-red-600')}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================
// TaskCard — attention queue row
// ============================================================
interface TaskCardProps {
  icon: React.ReactNode
  label: string
  count: number
  iconColor?: string
  onClick?: () => void
}

export function TaskCard({ icon, label, count, iconColor = 'text-primary-700', onClick }: TaskCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="attention-row w-full text-left group"
    >
      <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-50', iconColor)}>
        {icon}
      </span>
      <span className="flex-1 text-sm text-body">{label}</span>
      <span className="text-xs font-bold bg-red-100 text-red-600 rounded-full px-2 py-0.5 ml-auto">
        {count}
      </span>
      <span className="text-xs text-muted group-hover:text-primary-700 transition-colors">Open →</span>
    </button>
  )
}

// ============================================================
// AvatarInitials
// ============================================================
interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' }

export function AvatarInitials({ name, size = 'md', className }: AvatarProps) {
  const bg = avatarColor(name)
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white flex-shrink-0',
        sizeMap[size],
        className,
      )}
      style={{ backgroundColor: bg }}
    >
      {initials(name)}
    </div>
  )
}

// ============================================================
// Skeleton
// ============================================================
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-border rounded animate-pulse', className)} />
}

