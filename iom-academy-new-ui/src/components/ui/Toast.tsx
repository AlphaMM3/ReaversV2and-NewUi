import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: number
  variant: ToastVariant
  message: string
}

interface ToastContextValue {
  success: (message: string) => void
  error: (err: unknown, fallback?: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'string' && err.trim()) return err
  if (err instanceof Error && err.message.trim()) return err.message
  return fallback
}

const STYLES: Record<ToastVariant, { wrap: string; Icon: typeof Info }> = {
  success: {
    wrap: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    Icon: CheckCircle2,
  },
  error: {
    wrap: 'bg-red-50 border-red-200 text-red-900',
    Icon: XCircle,
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-200 text-amber-900',
    Icon: AlertTriangle,
  },
  info: {
    wrap: 'bg-primary-50 border-primary-200 text-primary-900',
    Icon: Info,
  },
}

let _nextId = 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((variant: ToastVariant, message: string) => {
    const id = _nextId++
    setToasts((prev) => [...prev.slice(-3), { id, variant, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, variant === 'error' ? 6000 : 4000)
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (m) => push('success', m),
      error: (err, fallback = 'Request failed') => push('error', extractErrorMessage(err, fallback)),
      warning: (m) => push('warning', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        data-toast-container="true"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const { wrap, Icon } = STYLES[t.variant]
          return (
            <div
              key={t.id}
              role={t.variant === 'error' ? 'alert' : 'status'}
              data-toast-type={t.variant}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-lg text-xs font-medium animate-fade-in ${wrap}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{t.message}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="opacity-60 hover:opacity-100 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    }
  }
  return ctx
}

