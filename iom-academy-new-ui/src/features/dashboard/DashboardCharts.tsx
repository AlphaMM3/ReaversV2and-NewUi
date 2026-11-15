import { useState } from 'react'
import { BarChart3, Table } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface ChartTableCardProps {
  title: string
  subtitle: string
  headerAction?: React.ReactNode
  chart: React.ReactNode
  table: React.ReactNode
  emptyMessage?: string
  isEmpty?: boolean
  className?: string
}

export function ChartTableCard({
  title,
  subtitle,
  headerAction,
  chart,
  table,
  emptyMessage = 'No records available for this period.',
  isEmpty = false,
  className,
}: ChartTableCardProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')

  return (
    <Card className={cn('rounded-2xl h-full flex flex-col', className)} data-view-mode={viewMode}>
      <CardHeader className="pb-3 flex-nowrap items-start gap-2">
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 min-h-[36px]">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-body hover:bg-primary-50 cursor-pointer"
          >
            {viewMode === 'chart' ? (
              <><Table className="w-3.5 h-3.5" /> Table</>
            ) : (
              <><BarChart3 className="w-3.5 h-3.5" /> Chart</>
            )}
          </button>
          {headerAction}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        {isEmpty ? (
          <p className="text-xs text-muted py-6 text-center my-auto">{emptyMessage}</p>
        ) : viewMode === 'chart' ? (
          chart
        ) : (
          <div className="overflow-x-auto">{table}</div>
        )}
      </CardContent>
    </Card>
  )
}

export interface DualBarDatum {
  label: string
  primary: number
  secondary: number
}

export function DualBarChart({
  data,
  primaryLabel,
  secondaryLabel,
  primaryColor = 'bg-primary-700',
  secondaryColor = 'bg-teal-500',
  formatValue = (v: number) => v.toLocaleString(),
}: {
  data: DualBarDatum[]
  primaryLabel: string
  secondaryLabel: string
  primaryColor?: string
  secondaryColor?: string
  formatValue?: (v: number) => string
}) {
  const maxVal = Math.max(1, ...data.flatMap((d) => [d.primary, d.secondary]))
  const isHex = (c: string) => c.startsWith('#') || c.startsWith('rgb')

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-sm ${isHex(primaryColor) ? '' : primaryColor}`}
            style={isHex(primaryColor) ? { backgroundColor: primaryColor } : undefined}
          />
          {primaryLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-sm ${isHex(secondaryColor) ? '' : secondaryColor}`}
            style={isHex(secondaryColor) ? { backgroundColor: secondaryColor } : undefined}
          />
          {secondaryLabel}
        </span>
      </div>

      <div className="h-44 flex items-end gap-2 pt-4 border-b border-border pb-1">
        {data.map((d, idx) => {
          const h1 = Math.max(d.primary > 0 ? 6 : 2, Math.round((d.primary / maxVal) * 100))
          const h2 = Math.max(d.secondary > 0 ? 6 : 2, Math.round((d.secondary / maxVal) * 100))
          return (
            <div
              key={`${d.label}-${idx}`}
              className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group"
              title={`${d.label}: ${primaryLabel} ${formatValue(d.primary)} / ${secondaryLabel} ${formatValue(d.secondary)}`}
            >
              <div className="w-full flex items-end justify-center gap-1 flex-1">
                <div
                  className={`w-2.5 sm:w-3.5 rounded-t ${isHex(primaryColor) ? '' : primaryColor} transition-all duration-300`}
                  style={{ height: `${h1}%`, ...(isHex(primaryColor) ? { backgroundColor: primaryColor } : {}) }}
                />
                <div
                  className={`w-2.5 sm:w-3.5 rounded-t ${isHex(secondaryColor) ? '' : secondaryColor} transition-all duration-300`}
                  style={{ height: `${h2}%`, ...(isHex(secondaryColor) ? { backgroundColor: secondaryColor } : {}) }}
                />
              </div>
              <span className="text-[10px] text-muted mt-1.5 truncate max-w-full">{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export interface HorizontalBarItem {
  label: string
  value: number
  displayValue: string
  color?: string
}

export function HorizontalBarList({
  items,
  maxOverride,
}: {
  items: HorizontalBarItem[]
  maxOverride?: number
}) {
  const maxVal = maxOverride ?? Math.max(1, ...items.map((i) => i.value))

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={`${item.label}-${idx}`} className="flex items-center gap-3">
          <span className="w-36 sm:w-44 text-xs font-semibold text-body truncate" title={item.label}>
            {item.label}
          </span>
          <div className="flex-1 h-2.5 rounded-full bg-bg overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color ?? 'bg-primary-700'} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.round((item.value / maxVal) * 100))}%` }}
            />
          </div>
          <span className="w-16 text-right text-xs font-bold text-heading tabular-nums">
            {item.displayValue}
          </span>
        </div>
      ))}
    </div>
  )
}

export interface TrendPoint {
  label: string
  value: number
}

export function SparkAreaChart({
  points,
  stroke = '#1d4ed8',
  fill = 'rgba(29, 78, 216, 0.10)',
  suffix = '',
}: {
  points: TrendPoint[]
  stroke?: string
  fill?: string
  suffix?: string
}) {
  if (points.length === 0) return null
  const width = 420
  const height = 130
  const padX = 14
  const padY = 16
  const maxVal = Math.max(1, ...points.map((p) => p.value))
  const stepX = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0

  const coords = points.map((p, idx) => {
    const x = padX + idx * stepX
    const y = height - padY - ((p.value / maxVal) * (height - padY * 2))
    return { x, y, ...p }
  })

  const polyPoints = coords.map((c) => `${c.x},${c.y}`).join(' ')
  const areaPath =
    coords.length > 0
      ? `M ${coords[0].x},${height - padY} L ${coords.map((c) => `${c.x},${c.y}`).join(' L ')} L ${coords[coords.length - 1].x},${height - padY} Z`
      : ''

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#e2e8f0" strokeWidth="1" />
        <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
        {areaPath && <path d={areaPath} fill={fill} />}
        {coords.length > 1 && (
          <polyline
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyPoints}
          />
        )}
        {coords.map((c, idx) => (
          <g key={`${c.label}-${idx}`}>
            <circle cx={c.x} cy={c.y} r="3.5" fill="#ffffff" stroke={stroke} strokeWidth="2" />
            <title>{`${c.label}: ${c.value}${suffix}`}</title>
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-between text-[10px] text-muted px-1">
        {points.map((p, idx) => (
          <span key={`${p.label}-${idx}`} className="truncate">{p.label}</span>
        ))}
      </div>
    </div>
  )
}

