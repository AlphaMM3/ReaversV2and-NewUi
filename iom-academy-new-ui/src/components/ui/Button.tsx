import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantClasses = {
  primary:   'bg-primary-700 text-white hover:bg-primary-900 focus-visible:ring-primary-700',
  secondary: 'bg-primary-100 text-primary-900 hover:bg-primary-200',
  ghost:     'bg-transparent text-body hover:bg-primary-50',
  danger:    'bg-red-600 text-white hover:bg-red-700',
  outline:   'border border-border bg-surface text-body hover:bg-primary-50',
}

const sizeClasses = {
  sm: 'px-3.5 py-2 min-h-[36px] text-xs font-semibold rounded-md gap-1.5',
  md: 'px-4 py-2.5 min-h-[42px] text-sm font-semibold rounded-md gap-2',
  lg: 'px-5 py-3 min-h-[46px] text-base font-semibold rounded-md gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 cursor-pointer active:scale-[0.99]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

