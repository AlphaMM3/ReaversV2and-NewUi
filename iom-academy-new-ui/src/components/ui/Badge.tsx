import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'present' | 'absent' | 'late'
  | 'live' | 'in_progress' | 'scheduled' | 'ended' | 'makeup' | 'cancelled' | 'verified'
  | 'approved' | 'returned' | 'submitted' | 'draft' | 'pending'
  | 'primary' | 'secondary' | 'neutral'

const variantMap: Record<BadgeVariant, string> = {
  present:     'badge-present',
  absent:      'badge-absent',
  late:        'badge-late',
  live:        'badge-live animate-pulse',
  in_progress: 'badge-live animate-pulse',
  scheduled: 'bg-primary-100 text-primary-900',
  ended:     'bg-gray-100 text-gray-600',
  makeup:    'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  verified:  'badge-approved',
  approved:  'badge-approved',
  returned:  'badge-returned',
  submitted: 'bg-blue-100 text-blue-700',
  draft:     'badge-draft',
  pending:   'badge-pending',
  primary:   'bg-primary-700 text-white',
  secondary: 'bg-teal-100 text-teal-700',
  neutral:   'bg-gray-100 text-gray-700',
}

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
  dot?: boolean
}

export function Badge({ variant = 'neutral', className, children, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
        variantMap[variant],
        className,
      )}
    >
      {dot && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  )
}

/** Segmented pill group for P / A / L attendance marking */
interface AttendancePillsProps {
  value: 'P' | 'A' | 'L' | null
  onChange: (v: 'P' | 'A' | 'L') => void
  disabled?: boolean
}

export function AttendancePills({ value, onChange, disabled }: AttendancePillsProps) {
  const opts: { v: 'P' | 'A' | 'L'; label: string; active: string; inactive: string }[] = [
    { v: 'P', label: 'P', active: 'bg-emerald-600 text-white', inactive: 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100' },
    { v: 'A', label: 'A', active: 'bg-red-600 text-white',   inactive: 'bg-red-50/80 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100' },
    { v: 'L', label: 'L', active: 'bg-amber-500 text-white', inactive: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100' },
  ]
  return (
    <div className="inline-flex rounded-xl overflow-hidden border border-border shadow-3xs">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.v)}
          className={cn(
            'px-3.5 py-1.5 min-h-[36px] min-w-[36px] text-xs font-bold transition-all cursor-pointer flex items-center justify-center',
            value === o.v ? o.active : o.inactive,
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

