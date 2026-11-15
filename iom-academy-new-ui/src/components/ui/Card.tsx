import { cn } from '@/lib/utils'

interface CardProps {
  id?: string
  className?: string
  children: React.ReactNode
}

export function Card({ id, className, children }: CardProps) {
  return (
    <div
      id={id}
      className={cn(
        'bg-surface rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)] flex flex-col',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={cn('px-5 sm:px-6 pt-5 pb-3 flex flex-wrap items-center justify-between gap-3', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={cn('text-base font-bold text-heading font-heading', className)}>{children}</h3>
  )
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn('px-5 sm:px-6 pb-5 sm:pb-6 flex-1', className)}>{children}</div>
}

