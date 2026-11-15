import { useId } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const feedbackId = error || hint ? `${inputId}-feedback` : undefined
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-heading">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={feedbackId}
        className={cn(
          'w-full px-3.5 py-2.5 min-h-[42px] rounded-xl border border-slate-300 text-sm text-heading bg-surface',
          'placeholder:text-muted',
          'hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700',
          'transition-all duration-150',
          error && 'border-red-500 focus:ring-red-500/20',
          className,
        )}
        {...props}
      />
      {error && <p id={feedbackId} className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p id={feedbackId} className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

