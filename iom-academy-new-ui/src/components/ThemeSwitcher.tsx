import { useState, useEffect } from 'react'
import {
  type AppTheme,
  THEME_OPTIONS,
  getInitialTheme,
  applyTheme,
} from '@/lib/themeManager'
import { Palette, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeSwitcherProps {
  compact?: boolean
  className?: string
}

export default function ThemeSwitcher({ compact = false, className }: ThemeSwitcherProps) {
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(getInitialTheme)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  function handleSelect(theme: AppTheme) {
    setCurrentTheme(theme)
    applyTheme(theme)
    setOpen(false)
  }

  const activeOption = THEME_OPTIONS.find((t) => t.id === currentTheme) ?? THEME_OPTIONS[0]

  return (
    <div className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-heading shadow-2xs hover:bg-bg transition-colors cursor-pointer',
          compact ? 'px-2 py-1' : '',
        )}
        title="Change Workspace Theme"
        aria-label="Select theme"
      >
        <span className="text-sm">{activeOption.icon}</span>
        {!compact && (
          <span className="truncate max-w-[110px] hidden sm:inline">
            {activeOption.label.split(' ')[0]}
          </span>
        )}
        <Palette className="w-3.5 h-3.5 text-muted ml-0.5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-surface p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-2 border-b border-border mb-1">
              <p className="text-xs font-bold text-heading flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-primary-700" />
                কালার ও থিম কাস্টমাইজেশন
              </p>
              <p className="text-[11px] text-muted">
                মহিলা শিক্ষক, স্টাফ ও শিশুদের পছন্দের রঙে ইন্টারফেস সাজান
              </p>
            </div>

            <div className="space-y-1.5 mt-1.5">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = opt.id === currentTheme
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={cn(
                      'w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer border',
                      isSelected
                        ? 'border-primary-500 bg-primary-50/70 shadow-2xs'
                        : 'border-transparent hover:bg-bg hover:border-border',
                    )}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-heading truncate">
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span className="text-[10px] font-semibold bg-primary-100 text-primary-800 px-1.5 py-0.2 rounded-full">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted leading-tight mt-0.5 line-clamp-2">
                        {opt.subtitle}
                      </p>
                      {/* Color swatches preview */}
                      <div className="flex items-center gap-1 mt-1.5">
                        {opt.previewColors.map((c, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-3xs"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary-700 flex-shrink-0 mt-1" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
