import { useState, useRef } from 'react'
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-body hover:bg-primary-50 cursor-pointer transition-colors"
          >
            {viewMode === 'chart' ? (
              <>
                <Table className="w-3.5 h-3.5 text-primary-700" /> টেবিল ভিউ
              </>
            ) : (
              <>
                <BarChart3 className="w-3.5 h-3.5 text-primary-700" /> ইন্টারঅ্যাক্টিভ চার্ট
              </>
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const maxVal = Math.max(1, ...data.flatMap((d) => [d.primary, d.secondary]))
  const isHex = (c: string) => c.startsWith('#') || c.startsWith('rgb')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-4">
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

        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md animate-in fade-in">
            {data[hoveredIdx].label}: {primaryLabel} ৳ {formatValue(data[hoveredIdx].primary)} | {secondaryLabel} ৳{' '}
            {formatValue(data[hoveredIdx].secondary)}
          </div>
        )}
      </div>

      <div className="h-44 flex items-end gap-2 pt-4 border-b border-border pb-1">
        {data.map((d, idx) => {
          const h1 = Math.max(d.primary > 0 ? 6 : 2, Math.round((d.primary / maxVal) * 100))
          const h2 = Math.max(d.secondary > 0 ? 6 : 2, Math.round((d.secondary / maxVal) * 100))
          const isHovered = hoveredIdx === idx

          return (
            <div
              key={`${d.label}-${idx}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center justify-end h-full min-w-0 group cursor-pointer"
            >
              <div className="w-full flex items-end justify-center gap-1 flex-1 relative">
                {isHovered && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md z-20 pointer-events-none animate-in fade-in zoom-in-95">
                    ৳ {formatValue(d.primary)}
                  </div>
                )}
                <div
                  className={`w-2.5 sm:w-3.5 rounded-t ${isHex(primaryColor) ? '' : primaryColor} transition-all duration-300 ${
                    isHovered ? 'brightness-110 ring-2 ring-primary-300' : ''
                  }`}
                  style={{ height: `${h1}%`, ...(isHex(primaryColor) ? { backgroundColor: primaryColor } : {}) }}
                />
                <div
                  className={`w-2.5 sm:w-3.5 rounded-t ${isHex(secondaryColor) ? '' : secondaryColor} transition-all duration-300 ${
                    isHovered ? 'brightness-110 ring-2 ring-teal-300' : ''
                  }`}
                  style={{ height: `${h2}%`, ...(isHex(secondaryColor) ? { backgroundColor: secondaryColor } : {}) }}
                />
              </div>
              <span
                className={`text-[10px] mt-1.5 truncate max-w-full font-medium transition-colors ${
                  isHovered ? 'text-primary-700 font-bold' : 'text-muted'
                }`}
              >
                {d.label}
              </span>
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const maxVal = maxOverride ?? Math.max(1, ...items.map((i) => i.value))

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isHovered = hoveredIdx === idx
        return (
          <div
            key={`${item.label}-${idx}`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`flex items-center gap-3 p-1 rounded-lg transition-colors cursor-pointer ${
              isHovered ? 'bg-slate-50' : ''
            }`}
          >
            <span
              className={`w-36 sm:w-44 text-xs font-semibold truncate transition-colors ${
                isHovered ? 'text-primary-700 font-bold' : 'text-body'
              }`}
              title={item.label}
            >
              {item.label}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color ?? 'bg-primary-700'} transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.round((item.value / maxVal) * 100))}%` }}
              />
            </div>
            <span className="w-16 text-right text-xs font-bold text-heading tabular-nums">
              {item.displayValue}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export interface TrendPoint {
  label: string
  value: number
}

/**
 * Interactive SparkAreaChart with hover tooltips and dynamic cursor line
 */
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  if (points.length === 0) return null
  const width = 420
  const height = 130
  const padX = 14
  const padY = 16
  const maxVal = Math.max(1, ...points.map((p) => p.value))
  const stepX = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0

  const coords = points.map((p, idx) => {
    const x = padX + idx * stepX
    const y = height - padY - (p.value / maxVal) * (height - padY * 2)
    return { x, y, ...p }
  })

  const polyPoints = coords.map((c) => `${c.x},${c.y}`).join(' ')
  const areaPath =
    coords.length > 0
      ? `M ${coords[0].x},${height - padY} L ${coords.map((c) => `${c.x},${c.y}`).join(' L ')} L ${coords[coords.length - 1].x},${height - padY} Z`
      : ''

  const activePoint = hoveredIdx !== null ? coords[hoveredIdx] : null

  return (
    <div className="space-y-2 select-none">
      <div className="relative">
        {activePoint && (
          <div
            className="absolute -top-3 z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150 animate-in fade-in"
            style={{ left: `${(activePoint.x / width) * 100}%` }}
          >
            <div className="bg-slate-900 text-white text-[11px] font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1.5 whitespace-nowrap">
              <span>{activePoint.label}:</span>
              <span className="text-emerald-400">{activePoint.value}{suffix}</span>
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 overflow-visible cursor-crosshair"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#e2e8f0" strokeWidth="1" />
          <line
            x1={padX}
            y1={padY}
            x2={width - padX}
            y2={padY}
            stroke="#e2e8f0"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

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

          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padY}
              x2={activePoint.x}
              y2={height - padY}
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              className="animate-in fade-in"
            />
          )}

          {coords.map((c, idx) => {
            const isHovered = hoveredIdx === idx
            return (
              <g
                key={`${c.label}-${idx}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onTouchStart={() => setHoveredIdx(idx)}
                className="cursor-pointer"
              >
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? stroke : '#ffffff'}
                  stroke={stroke}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />
                <circle cx={c.x} cy={c.y} r="18" fill="transparent" />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted px-1">
        {points.map((p, idx) => (
          <span
            key={`${p.label}-${idx}`}
            onMouseEnter={() => setHoveredIdx(idx)}
            className={`truncate cursor-pointer transition-colors ${
              hoveredIdx === idx ? 'text-primary-700 font-bold' : ''
            }`}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}
