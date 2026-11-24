import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CheckCheck,
  Copy,
  Crop,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  MessageSquarePlus,
  MousePointer,
  RotateCcw,
  StickyNote,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

export interface AreaRectPct {
  leftPct: number
  topPct: number
  widthPct: number
  heightPct: number
}

export interface UiAnnotation {
  id: string
  route: string
  selector: string
  label: string
  tag: string
  note: string
  createdAt: string
  viewport: string
  xPct: number
  yPct: number
  status?: 'open' | 'resolved'
  resolvedAt?: string
  mode?: 'element' | 'area'
  areaRect?: AreaRectPct
  geometryNote?: string
}

const STORAGE_KEY = 'iom_ui_annotations_v1'
const TAGS = ['Alignment', 'Box Style', 'Dropdown', 'Spacing', 'Typography', 'Mobile', 'Bug', 'Idea'] as const

type TargetMode = 'element' | 'area'
type DrawerFilter = 'open' | 'resolved' | 'all'

function normalizeAnnotation(raw: Partial<UiAnnotation>): UiAnnotation {
  return {
    id: raw.id || `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    route: raw.route || '#/dashboard',
    selector: raw.selector || '#main-content',
    label: raw.label || 'Element note',
    tag: raw.tag || 'Alignment',
    note: raw.note || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    viewport: raw.viewport || `${window.innerWidth}x${window.innerHeight}`,
    xPct: typeof raw.xPct === 'number' ? raw.xPct : 50,
    yPct: typeof raw.yPct === 'number' ? raw.yPct : 35,
    status: raw.status === 'resolved' ? 'resolved' : 'open',
    resolvedAt: raw.resolvedAt,
    mode: raw.mode === 'area' ? 'area' : 'element',
    areaRect: raw.areaRect,
    geometryNote: raw.geometryNote,
  }
}

export function loadAnnotations(): UiAnnotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => normalizeAnnotation(item))
  } catch {
    return []
  }
}

function saveAnnotations(list: UiAnnotation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore storage quota failure
  }
}

function isAnnotatorEl(el: Element | null): boolean {
  return Boolean(el?.closest('[data-annotator-ui="true"]'))
}

function pickMeaningfulTarget(el: Element | null): Element | null {
  if (!el || isAnnotatorEl(el)) return null
  const meaningful = el.closest(
    '[data-annotate], article, section, form, table, nav, aside, header, main, button, a, input, select, textarea, .iom-card, [class*="rounded-2xl"], [class*="rounded-xl"], [class*="grid"] > div'
  )
  return meaningful && !isAnnotatorEl(meaningful) ? meaningful : el
}

function describeElement(el: Element): string {
  const custom = el.getAttribute('data-annotate')
  if (custom) return custom
  const tag = el.tagName.toLowerCase()
  const heading = el.querySelector('h1, h2, h3, h4, [class*="CardTitle"]')?.textContent?.trim()
  if (heading) return `Card/Box · ${heading.slice(0, 46)}`
  const aria = el.getAttribute('aria-label')
  if (aria) return `${tag} · ${aria.slice(0, 42)}`
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
  if (text) return `${tag} · ${text.slice(0, 42)}${text.length > 42 ? '…' : ''}`
  return tag
}

function buildSelector(el: Element): string {
  if (el.id) return `#${el.id}`
  const parts: string[] = []
  let cur: Element | null = el
  for (let depth = 0; cur && cur.nodeType === 1 && depth < 5; depth++) {
    let part = cur.tagName.toLowerCase()
    if (cur.id) {
      parts.unshift(`#${cur.id}`)
      break
    }
    const parent: Element | null = cur.parentElement
    if (parent) {
      const sameTagSiblings = Array.from(parent.children).filter(
        (c: Element) => c.tagName === cur!.tagName
      )
      if (sameTagSiblings.length > 1) {
        const idx = sameTagSiblings.indexOf(cur) + 1
        part += `:nth-of-type(${idx})`
      }
    }
    parts.unshift(part)
    cur = parent
  }
  return parts.join(' > ')
}

function measureGeometryNote(el: Element, drawnRect?: DOMRect): string {
  const rect = drawnRect ?? el.getBoundingClientRect()
  const w = Math.round(rect.width)
  const h = Math.round(rect.height)
  const parts = [`${w}×${h}px`]

  if (!drawnRect) {
    const parent = el.parentElement
    if (parent && parent.children.length >= 2 && parent.children.length <= 6) {
      const siblings = Array.from(parent.children).filter(
        (child) => child instanceof HTMLElement && child.getBoundingClientRect().width > 20
      )
      const sameRow = siblings.filter((sib) => {
        const sr = sib.getBoundingClientRect()
        return Math.abs(sr.top - rect.top) <= 28
      })
      if (sameRow.length >= 2) {
        const heights = sameRow.map((sib) => Math.round(sib.getBoundingClientRect().height))
        const maxH = Math.max(...heights)
        const minH = Math.min(...heights)
        if (maxH - minH > 8) {
          parts.push(`row heights: ${heights.join('px / ')}px`)
        }
      }
    }
  }
  return parts.join(' • ')
}

function getBoxForAnnotation(ann: UiAnnotation): DOMRect | null {
  try {
    if (ann.mode === 'area' && ann.areaRect) {
      const x = (ann.areaRect.leftPct / 100) * window.innerWidth
      const y = (ann.areaRect.topPct / 100) * window.innerHeight
      const w = (ann.areaRect.widthPct / 100) * window.innerWidth
      const h = (ann.areaRect.heightPct / 100) * window.innerHeight
      return new DOMRect(x, y, w, h)
    }
    const el = document.querySelector(ann.selector)
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) return null
    return rect
  } catch {
    return null
  }
}

function clampPopoverPos(x: number, y: number, cardWidth = 340, cardHeight = 290) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const left = Math.max(12, Math.min(vw - cardWidth - 12, x))
  const top = Math.max(12, Math.min(vh - cardHeight - 12, y))
  return { left, top }
}

function formatAnnotationItem(a: UiAnnotation, index = 1): string {
  const lines = [
    `${index}. **[${a.tag}]** \`${a.route}\` (${a.viewport}) — **${a.label}**`,
    `   - Note: ${a.note}`,
  ]
  if (a.geometryNote) lines.push(`   - Geometry: \`${a.geometryNote}\``)
  lines.push(`   - Target selector: \`${a.selector}\``)
  return lines.join('\n')
}

function buildSingleAnnotationPrompt(a: UiAnnotation): string {
  return [
    `## UI/UX Visual Note (1 open item)`,
    '',
    formatAnnotationItem(a, 1),
  ].join('\n')
}

function buildSelectedAnnotationsPrompt(items: UiAnnotation[]): string {
  if (items.length === 0) return 'No notes selected.'
  if (items.length === 1) return buildSingleAnnotationPrompt(items[0])
  const lines = [
    `## UI/UX Visual Notes (${items.length} items)`,
    '',
  ]
  items.forEach((a, idx) => {
    lines.push(formatAnnotationItem(a, idx + 1))
  })
  return lines.join('\n')
}

function buildMarkdownPrompt(list: UiAnnotation[], onlyOpen = true): string {
  const target = onlyOpen ? list.filter((a) => a.status !== 'resolved') : list
  if (target.length === 0) return 'No open UI/UX annotations to export.'
  return buildSelectedAnnotationsPrompt(target)
}

async function copyTextSafe(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return true
  }
}

interface AnnotatorOverlayProps {
  activeRoute: string
  annotating: boolean
  onToggleAnnotating: (next: boolean) => void
  onCountChange?: (count: number) => void
}

interface PendingPin {
  x: number
  y: number
  selector: string
  label: string
  mode: TargetMode
  areaRect?: AreaRectPct
  geometryNote: string
}

interface DragBoxState {
  startX: number
  startY: number
  curX: number
  curY: number
}

export default function AnnotatorOverlay({
  activeRoute,
  annotating,
  onToggleAnnotating,
  onCountChange,
}: AnnotatorOverlayProps) {
  const [annotations, setAnnotations] = useState<UiAnnotation[]>(loadAnnotations)
  const [targetMode, setTargetMode] = useState<TargetMode>('element')
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null)
  const [hoverLabel, setHoverLabel] = useState('')
  const [dragBox, setDragBox] = useState<DragBoxState | null>(null)
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null)
  const [draftTag, setDraftTag] = useState<string>('Alignment')
  const [draftNote, setDraftNote] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerFilter, setDrawerFilter] = useState<DrawerFilter>('open')
  const [currentPageOnly, setCurrentPageOnly] = useState(false)
  const [hideResolvedPins, setHideResolvedPins] = useState(false)
  const [copiedBanner, setCopiedBanner] = useState('')
  const [activePinId, setActivePinId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTag, setEditTag] = useState<string>('Alignment')
  const [editNote, setEditNote] = useState('')
  const [, setTick] = useState(0)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const openAnnotations = useMemo(
    () => annotations.filter((a) => a.status !== 'resolved'),
    [annotations]
  )
  const resolvedAnnotations = useMemo(
    () => annotations.filter((a) => a.status === 'resolved'),
    [annotations]
  )

  useEffect(() => {
    saveAnnotations(annotations)
    onCountChange?.(openAnnotations.length)
  }, [annotations, openAnnotations.length, onCountChange])

  // Recompute marker positions on scroll / resize / route switch
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    window.addEventListener('resize', bump)
    window.addEventListener('scroll', bump, true)
    const id = setInterval(bump, 900)
    return () => {
      window.removeEventListener('resize', bump)
      window.removeEventListener('scroll', bump, true)
      clearInterval(id)
    }
  }, [activeRoute, annotating])

  const openPinComposer = useCallback(
    (clientX: number, clientY: number, el: Element | null, mode: TargetMode, drawnRect?: DOMRect) => {
      const picked = el ?? document.querySelector('#main-content') ?? document.body
      const label = drawnRect ? `Area · ${describeElement(picked)}` : describeElement(picked)
      const areaRect: AreaRectPct | undefined = drawnRect
        ? {
            leftPct: Math.round((drawnRect.left / window.innerWidth) * 1000) / 10,
            topPct: Math.round((drawnRect.top / window.innerHeight) * 1000) / 10,
            widthPct: Math.round((drawnRect.width / window.innerWidth) * 1000) / 10,
            heightPct: Math.round((drawnRect.height / window.innerHeight) * 1000) / 10,
          }
        : undefined
      setPendingPin({
        x: clientX,
        y: clientY,
        selector: buildSelector(picked),
        label,
        mode,
        areaRect,
        geometryNote: measureGeometryNote(picked, drawnRect),
      })
      setDraftTag(window.innerWidth < 640 ? 'Mobile' : 'Alignment')
      setDraftNote('')
    },
    []
  )

  // Click-Element targeting listeners when annotating & targetMode === 'element'
  useEffect(() => {
    if (!annotating || targetMode !== 'element') {
      setHoverRect(null)
      setHoverLabel('')
      return
    }

    const handleMove = (e: MouseEvent) => {
      if (pendingPin || drawerOpen) return
      const target = pickMeaningfulTarget(document.elementFromPoint(e.clientX, e.clientY))
      if (!target) {
        setHoverRect(null)
        setHoverLabel('')
        return
      }
      const rect = target.getBoundingClientRect()
      setHoverRect(rect)
      setHoverLabel(`${describeElement(target)} (${Math.round(rect.width)}×${Math.round(rect.height)}px)`)
    }

    const handleClick = (e: MouseEvent) => {
      const clicked = document.elementFromPoint(e.clientX, e.clientY)
      if (isAnnotatorEl(clicked)) return
      e.preventDefault()
      e.stopPropagation()
      const target = pickMeaningfulTarget(clicked)
      if (!target) return
      openPinComposer(e.clientX, e.clientY, target, 'element')
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingPin) setPendingPin(null)
        else if (activePinId) setActivePinId(null)
        else if (drawerOpen) setDrawerOpen(false)
        else onToggleAnnotating(false)
      }
    }

    document.addEventListener('mousemove', handleMove, true)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousemove', handleMove, true)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('keydown', handleKey)
    }
  }, [annotating, targetMode, pendingPin, drawerOpen, activePinId, onToggleAnnotating, openPinComposer])

  // Escape handler also active in Draw Area mode
  useEffect(() => {
    if (!annotating || targetMode !== 'area') return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dragBox) setDragBox(null)
        else if (pendingPin) setPendingPin(null)
        else onToggleAnnotating(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [annotating, targetMode, dragBox, pendingPin, onToggleAnnotating])

  function handleAreaPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (pendingPin || drawerOpen) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragBox({ startX: e.clientX, startY: e.clientY, curX: e.clientX, curY: e.clientY })
  }

  function handleAreaPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragBox) return
    setDragBox((prev) => (prev ? { ...prev, curX: e.clientX, curY: e.clientY } : null))
  }

  function handleAreaPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragBox) return
    const x1 = Math.min(dragBox.startX, e.clientX)
    const y1 = Math.min(dragBox.startY, e.clientY)
    const w = Math.abs(e.clientX - dragBox.startX)
    const h = Math.abs(e.clientY - dragBox.startY)
    setDragBox(null)

    const sampleX = w >= 18 ? x1 + w / 2 : e.clientX
    const sampleY = h >= 18 ? y1 + h / 2 : e.clientY
    const stack = document.elementsFromPoint(sampleX, sampleY)
    const underlying = stack.find((el) => !isAnnotatorEl(el)) ?? null
    const picked = pickMeaningfulTarget(underlying)

    if (w >= 18 && h >= 18) {
      openPinComposer(x1 + w / 2, y1 + h / 2, picked, 'area', new DOMRect(x1, y1, w, h))
    } else if (picked) {
      openPinComposer(e.clientX, e.clientY, picked, 'element')
    }
  }

  const routePins = useMemo(() => {
    return annotations.filter((a) => {
      if (a.route !== activeRoute) return false
      if (hideResolvedPins && a.status === 'resolved') return false
      return true
    })
  }, [annotations, activeRoute, hideResolvedPins])

  const drawerAnnotations = useMemo(() => {
    return annotations.filter((a) => {
      if (currentPageOnly && a.route !== activeRoute) return false
      if (drawerFilter === 'open') return a.status !== 'resolved'
      if (drawerFilter === 'resolved') return a.status === 'resolved'
      return true
    })
  }, [annotations, currentPageOnly, activeRoute, drawerFilter])

  function createAnnotation() {
    if (!pendingPin || !draftNote.trim()) return
    const rect = pendingPin.areaRect
      ? new DOMRect(
          (pendingPin.areaRect.leftPct / 100) * window.innerWidth,
          (pendingPin.areaRect.topPct / 100) * window.innerHeight,
          (pendingPin.areaRect.widthPct / 100) * window.innerWidth,
          (pendingPin.areaRect.heightPct / 100) * window.innerHeight
        )
      : (() => {
          try {
            return document.querySelector(pendingPin.selector)?.getBoundingClientRect()
          } catch {
            return undefined
          }
        })()

    const xPct = rect
      ? Math.max(2, Math.min(98, ((pendingPin.x - rect.left) / Math.max(rect.width, 1)) * 100))
      : 50
    const yPct = rect
      ? Math.max(2, Math.min(98, ((pendingPin.y - rect.top) / Math.max(rect.height, 1)) * 100))
      : 50

    const next: UiAnnotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      route: activeRoute,
      selector: pendingPin.selector,
      label: pendingPin.label,
      tag: draftTag,
      note: draftNote.trim(),
      createdAt: new Date().toISOString(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      xPct: Math.round(xPct),
      yPct: Math.round(yPct),
      status: 'open',
      mode: pendingPin.mode,
      areaRect: pendingPin.areaRect,
      geometryNote: pendingPin.geometryNote,
    }
    setAnnotations((prev) => [next, ...prev])
    setPendingPin(null)
    setDraftNote('')
  }

  function addPageLevelNote() {
    setPendingPin({
      x: Math.round(window.innerWidth / 2),
      y: Math.round(window.innerHeight / 3),
      selector: '#main-content',
      label: `Page Overview · ${activeRoute}`,
      mode: 'element',
      geometryNote: `${window.innerWidth}×${window.innerHeight}px viewport`,
    })
    setDraftTag('Alignment')
    setDraftNote('')
  }

  function toggleStatus(id: string) {
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const resolved = a.status === 'resolved'
        return {
          ...a,
          status: resolved ? 'open' : 'resolved',
          resolvedAt: resolved ? undefined : new Date().toISOString(),
        }
      })
    )
  }

  function markAllResolved(routeOnly = false) {
    const now = new Date().toISOString()
    setAnnotations((prev) =>
      prev.map((a) => {
        if (routeOnly && a.route !== activeRoute) return a
        if (a.status === 'resolved') return a
        return { ...a, status: 'resolved', resolvedAt: now }
      })
    )
    flashStatus('Marked open notes resolved')
  }

  function clearResolved() {
    setAnnotations((prev) => prev.filter((a) => a.status !== 'resolved'))
    if (activePinId) setActivePinId(null)
    flashStatus('Cleared resolved notes')
  }

  function deleteAnnotation(id: string) {
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (activePinId === id) setActivePinId(null)
    if (editingId === id) setEditingId(null)
  }

  function startEditing(ann: UiAnnotation) {
    setEditingId(ann.id)
    setEditTag(ann.tag)
    setEditNote(ann.note)
  }

  function saveEdit(id: string) {
    if (!editNote.trim()) return
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, tag: editTag, note: editNote.trim() } : a))
    )
    setEditingId(null)
  }

  function flashStatus(msg: string) {
    setCopiedBanner(msg)
    setTimeout(() => setCopiedBanner(''), 2400)
  }

  async function handleCopySingle(a: UiAnnotation) {
    const text = buildSingleAnnotationPrompt(a)
    const ok = await copyTextSafe(text)
    if (ok) {
      setCopiedId(a.id)
      setTimeout(() => setCopiedId(null), 2000)
      flashStatus('Copied 1 note for AI!')
    }
  }

  async function handleCopySelected() {
    const selectedList = annotations.filter((a) => selectedIds.has(a.id))
    if (selectedList.length === 0) return
    const text = buildSelectedAnnotationsPrompt(selectedList)
    const ok = await copyTextSafe(text)
    if (ok) {
      flashStatus(`Copied ${selectedList.length} selected note(s) for AI!`)
    }
  }

  function toggleSelectId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllVisible(visibleList: UiAnnotation[]) {
    const visibleIds = visibleList.map((a) => a.id)
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function handleCopyMarkdown(onlyOpen = true) {
    const ok = await copyTextSafe(buildMarkdownPrompt(annotations, onlyOpen))
    if (ok) {
      const count = onlyOpen ? openAnnotations.length : annotations.length
      flashStatus(`Copied ${count} ${onlyOpen ? 'open ' : ''}note(s)`)
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(annotations, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `iom-ui-notes-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '[]'))
        if (!Array.isArray(parsed)) return
        const imported = parsed.map((item) => normalizeAnnotation(item))
        setAnnotations((prev) => {
          const map = new Map<string, UiAnnotation>()
          for (const item of prev) map.set(item.id, item)
          for (const item of imported) map.set(item.id, item)
          return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        })
        flashStatus(`Imported ${imported.length} note(s)`)
      } catch {
        flashStatus('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const activePin = annotations.find((a) => a.id === activePinId) ?? null
  const showPinsOnScreen = annotating || drawerOpen || activePinId !== null

  return (
    <>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportJson}
        data-annotator-ui="true"
      />

      {/* Draw Area Box capture layer (works on mouse & mobile touch) */}
      {annotating && targetMode === 'area' && !pendingPin && !drawerOpen && (
        <div
          data-annotator-ui="true"
          onPointerDown={handleAreaPointerDown}
          onPointerMove={handleAreaPointerMove}
          onPointerUp={handleAreaPointerUp}
          className="fixed inset-0 z-[9995] cursor-crosshair bg-primary-700/[0.03]"
          style={{ touchAction: 'none' }}
        >
          <div className="fixed top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-slate-900/95 text-white text-xs font-semibold shadow-lg pointer-events-none whitespace-nowrap">
            Drag a box over any area or gap (works on desktop & mobile)
          </div>
          {dragBox && (
            <div
              className="fixed border-2 border-dashed border-primary-700 bg-primary-700/15 rounded-lg pointer-events-none"
              style={{
                left: Math.min(dragBox.startX, dragBox.curX),
                top: Math.min(dragBox.startY, dragBox.curY),
                width: Math.max(Math.abs(dragBox.curX - dragBox.startX), 4),
                height: Math.max(Math.abs(dragBox.curY - dragBox.startY), 4),
              }}
            />
          )}
        </div>
      )}

      {/* Element hover highlight box */}
      {annotating && targetMode === 'element' && hoverRect && !pendingPin && (
        <div
          data-annotator-ui="true"
          className="fixed pointer-events-none z-[9996] border-2 border-primary-700 bg-primary-700/10 rounded-lg transition-all duration-75"
          style={{
            left: hoverRect.left,
            top: hoverRect.top,
            width: hoverRect.width,
            height: hoverRect.height,
          }}
        >
          <span className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-slate-900 text-white text-[11px] font-semibold whitespace-nowrap shadow max-w-[90vw] truncate">
            {hoverLabel}
          </span>
        </div>
      )}

      {/* Render Area boxes & Sticky Pins */}
      {showPinsOnScreen &&
        routePins.map((ann, idx) => {
          const box = getBoxForAnnotation(ann)
          if (!box) return null
          const isResolved = ann.status === 'resolved'
          const pinX = Math.max(12, Math.min(window.innerWidth - 28, box.left + (box.width * ann.xPct) / 100))
          const pinY = Math.max(12, Math.min(window.innerHeight - 28, box.top + (box.height * ann.yPct) / 100))
          const isSelected = activePinId === ann.id
          return (
            <div key={ann.id} data-annotator-ui="true">
              {(ann.mode === 'area' || isSelected) && ann.areaRect && (
                <div
                  className={`fixed pointer-events-none z-[9996] rounded-lg border-2 border-dashed ${
                    isResolved
                      ? 'border-emerald-600/60 bg-emerald-500/10'
                      : 'border-amber-500 bg-amber-400/15'
                  }`}
                  style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
                />
              )}
              <button
                type="button"
                data-annotator-ui="true"
                onClick={() => {
                  setActivePinId(isSelected ? null : ann.id)
                  setEditingId(null)
                }}
                title={`[${ann.tag}] ${ann.note}`}
                className={`fixed z-[9997] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full font-extrabold text-xs shadow-lg border-2 border-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ${
                  isResolved
                    ? 'bg-emerald-600 text-white opacity-80'
                    : 'bg-royal-gradient text-white'
                }`}
                style={{ left: pinX, top: pinY }}
              >
                {isResolved ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </button>
            </div>
          )
        })}

      {/* Quick Card for selected pin */}
      {activePin && (() => {
        const box = getBoxForAnnotation(activePin)
        const baseX = box ? box.left + (box.width * activePin.xPct) / 100 : window.innerWidth / 2
        const baseY = box ? box.top + (box.height * activePin.yPct) / 100 + 18 : 120
        const pos = clampPopoverPos(baseX, baseY, 320, 220)
        const isResolved = activePin.status === 'resolved'
        const isEditing = editingId === activePin.id
        return (
          <div
            data-annotator-ui="true"
            className="fixed z-[9999] w-[calc(100vw-24px)] max-w-[340px] bg-white rounded-2xl border border-border shadow-2xl p-3.5 space-y-2.5"
            style={{ left: pos.left, top: pos.top }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-bold">
                  {activePin.tag}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isResolved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {isResolved ? 'Resolved' : 'Open'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePinId(null)
                  setEditingId(null)
                }}
                className="text-muted hover:text-heading cursor-pointer"
                aria-label="Close pin details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] font-semibold text-muted truncate">{activePin.label}</p>
            {activePin.geometryNote && (
              <p className="text-[11px] font-mono text-primary-700 bg-primary-50/70 px-2 py-0.5 rounded">
                {activePin.geometryNote}
              </p>
            )}

            {isEditing ? (
              <div className="space-y-2">
                <select
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="w-full text-xs border border-border rounded-lg px-2 py-1"
                >
                  {TAGS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <textarea
                  rows={3}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full border border-border rounded-lg p-2 text-xs text-heading"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveEdit(activePin.id)}
                    className="px-2.5 py-1 rounded-lg bg-royal-gradient text-white text-xs font-semibold cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-heading leading-relaxed whitespace-pre-wrap">{activePin.note}</p>
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopySingle(activePin)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary-50 text-primary-700 hover:bg-primary-100 cursor-pointer transition-colors"
                      title="Copy this single note formatted for AI"
                    >
                      {copiedId === activePin.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy for AI
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(activePin.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        isResolved
                          ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isResolved ? <><RotateCcw className="w-3 h-3" /> Reopen</> : <><Check className="w-3 h-3" /> Resolve</>}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(activePin)}
                      className="text-[11px] font-semibold text-primary-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAnnotation(activePin.id)}
                      className="text-[11px] font-semibold text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* Pin Note Form Popover */}
      {pendingPin && (() => {
        const pos = clampPopoverPos(pendingPin.x + 12, pendingPin.y + 12, 340, 310)
        return (
          <div
            data-annotator-ui="true"
            className="fixed z-[9999] w-[calc(100vw-24px)] max-w-[350px] bg-white rounded-2xl border border-primary-300 shadow-2xl p-4 space-y-3"
            style={{ left: pos.left, top: pos.top }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-primary-700 truncate">{pendingPin.label}</p>
                {pendingPin.geometryNote && (
                  <p className="text-[11px] text-muted font-mono truncate">{pendingPin.geometryNote}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPendingPin(null)}
                className="text-muted hover:text-heading cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setDraftTag(tag)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer ${
                    draftTag === tag
                      ? 'bg-primary-700 text-white'
                      : 'bg-bg text-muted hover:text-heading'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              autoFocus
              rows={3}
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder="Write exactly what to fix here (English or Banglish)..."
              className="w-full rounded-xl border border-border p-2.5 text-sm text-heading focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingPin(null)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createAnnotation}
                disabled={!draftNote.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-royal-gradient text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
              >
                Save Pin
              </button>
            </div>
          </div>
        )
      })()}

      {/* Floating Annotator Dock */}
      {(annotating || annotations.length > 0) && (
        <div
          data-annotator-ui="true"
          className="fixed bottom-4 right-4 z-[9998] max-w-[calc(100vw-24px)] flex items-center gap-1.5 flex-wrap justify-end bg-slate-900/95 text-white px-3 py-2 rounded-2xl shadow-2xl border border-white/15 backdrop-blur"
        >
          {annotating ? (
            <>
              <div className="inline-flex rounded-xl bg-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => setTargetMode('element')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    targetMode === 'element' ? 'bg-primary-600 text-white' : 'text-white/75 hover:text-white'
                  }`}
                  title="Click any UI element or card"
                >
                  <MousePointer className="w-3.5 h-3.5" /> Click Box
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('area')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    targetMode === 'area' ? 'bg-primary-600 text-white' : 'text-white/75 hover:text-white'
                  }`}
                  title="Drag a custom box anywhere (Desktop or Mobile)"
                >
                  <Crop className="w-3.5 h-3.5" /> Draw Area
                </button>
              </div>

              <button
                type="button"
                onClick={addPageLevelNote}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" /> Page Note
              </button>

              {resolvedAnnotations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHideResolvedPins((v) => !v)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
                  title="Toggle solved pins visibility on screen"
                >
                  {hideResolvedPins ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {hideResolvedPins ? 'Show Solved' : 'Hide Solved'}
                </button>
              )}

              <button
                type="button"
                onClick={() => onToggleAnnotating(false)}
                className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onToggleAnnotating(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
            >
              <MousePointer className="w-3.5 h-3.5" /> Annotate
            </button>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold cursor-pointer"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>
              Notes ({openAnnotations.length} open / {annotations.length})
            </span>
          </button>

          {openAnnotations.length > 0 && (
            <button
              type="button"
              onClick={() => handleCopyMarkdown(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-royal-gradient text-xs font-bold shadow cursor-pointer"
            >
              {copiedBanner ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedBanner || `Copy Open (${openAnnotations.length})`}
            </button>
          )}

          {openAnnotations.length === 0 && resolvedAnnotations.length > 0 && !annotating && (
            <button
              type="button"
              onClick={clearResolved}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Clear {resolvedAnnotations.length} Solved
            </button>
          )}
        </div>
      )}

      {/* Annotations Review Drawer */}
      {drawerOpen && (
        <div
          data-annotator-ui="true"
          className="fixed inset-0 z-[9999] bg-black/35 flex justify-end"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-heading">UI Review Notes Studio</h3>
                <p className="text-xs text-muted">
                  {openAnnotations.length} open · {resolvedAnnotations.length} resolved · Track, resolve &amp; share open fixes only
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-muted hover:text-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter bar */}
            <div className="px-5 py-2.5 border-b border-border/70 bg-bg/50 flex items-center justify-between flex-wrap gap-2">
              <div className="inline-flex rounded-xl bg-white border border-border p-0.5 text-xs">
                {(
                  [
                    ['open', `Open (${openAnnotations.length})`],
                    ['resolved', `Resolved (${resolvedAnnotations.length})`],
                    ['all', `All (${annotations.length})`],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDrawerFilter(key)}
                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                      drawerFilter === key ? 'bg-primary-700 text-white' : 'text-muted hover:text-heading'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {drawerAnnotations.length > 0 && (
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-heading cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={
                        drawerAnnotations.length > 0 &&
                        drawerAnnotations.every((a) => selectedIds.has(a.id))
                      }
                      onChange={() => toggleSelectAllVisible(drawerAnnotations)}
                      className="rounded border-border accent-primary-600 cursor-pointer"
                    />
                    <span>Select visible</span>
                    {selectedIds.size > 0 && (
                      <span className="text-[11px] font-bold text-primary-700 bg-primary-100/70 px-1.5 py-0.5 rounded-full">
                        {selectedIds.size}
                      </span>
                    )}
                  </label>
                )}

                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-[11px] font-medium text-muted hover:text-heading cursor-pointer underline"
                  >
                    Clear
                  </button>
                )}

                <label className="inline-flex items-center gap-1.5 text-xs font-medium text-heading cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={currentPageOnly}
                    onChange={(e) => setCurrentPageOnly(e.target.checked)}
                    className="rounded border-border"
                  />
                  This page only
                </label>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {drawerAnnotations.length === 0 ? (
                <p className="text-sm text-muted text-center py-12">
                  {drawerFilter === 'open'
                    ? 'No open notes! Click Annotate to pin issues or switch tab to view Resolved.'
                    : 'No annotations match this filter.'}
                </p>
              ) : (
                drawerAnnotations.map((a, idx) => {
                  const isResolved = a.status === 'resolved'
                  const isEditing = editingId === a.id
                  const isSelected = selectedIds.has(a.id)
                  const isCopied = copiedId === a.id
                  return (
                    <div
                      key={a.id}
                      className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                        isSelected
                          ? 'ring-2 ring-primary-500/80 border-primary-300 bg-primary-50/20'
                          : isResolved
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-border bg-bg/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectId(a.id)}
                            className="rounded border-border accent-primary-600 cursor-pointer w-3.5 h-3.5 mr-0.5"
                            title="Select to copy multiple"
                          />
                          <span className="text-xs font-bold text-primary-700">#{idx + 1}</span>
                          <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-bold">
                            {a.tag}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isResolved ? 'Resolved' : 'Open'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.hash = a.route
                              setActivePinId(a.id)
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-primary-700 hover:underline cursor-pointer"
                            title="Jump to this page & highlight pin"
                          >
                            {a.route} <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopySingle(a)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 cursor-pointer transition-colors shadow-2xs"
                            title="Copy only this note for AI"
                          >
                            {isCopied ? (
                              <><Check className="w-3 h-3 text-emerald-600" /> Copied!</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copy for AI</>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(a.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                              isResolved
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {isResolved ? (
                              <><RotateCcw className="w-3 h-3" /> Reopen</>
                            ) : (
                              <><Check className="w-3 h-3" /> Resolve</>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditing(a)}
                            className="text-primary-700 hover:text-primary-900 cursor-pointer p-1"
                            title="Edit note"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAnnotation(a.id)}
                            className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-heading">{a.label}</p>
                      {a.geometryNote && (
                        <p className="text-[11px] font-mono text-primary-700 bg-white px-2 py-0.5 rounded border border-border/60 inline-block">
                          {a.geometryNote}
                        </p>
                      )}

                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <select
                            value={editTag}
                            onChange={(e) => setEditTag(e.target.value)}
                            className="w-full text-xs border border-border rounded-lg px-2 py-1 bg-white"
                          >
                            {TAGS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <textarea
                            rows={2}
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="w-full text-xs border border-border rounded-lg p-2 bg-white text-heading"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold text-muted bg-white cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEdit(a.id)}
                              className="px-2.5 py-1 rounded-lg bg-royal-gradient text-white text-xs font-semibold cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-sm ${isResolved ? 'line-through text-muted' : 'text-body'}`}>
                          {a.note}
                        </p>
                      )}

                      <p className="text-[11px] font-mono text-muted truncate">
                        {a.viewport} · {a.selector}
                      </p>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-border space-y-2 bg-bg/40">
              <div className="flex flex-wrap gap-2">
                {selectedIds.size > 0 ? (
                  <button
                    type="button"
                    onClick={handleCopySelected}
                    className="flex-1 min-w-[200px] py-2 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Selected ({selectedIds.size}) for AI
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCopyMarkdown(true)}
                    disabled={openAnnotations.length === 0}
                    className="flex-1 min-w-[180px] py-2 rounded-xl bg-royal-gradient text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Open Notes for AI ({openAnnotations.length})
                  </button>
                )}

                {selectedIds.size > 0 && openAnnotations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleCopyMarkdown(true)}
                    className="px-3 py-2 rounded-xl border border-border bg-white text-xs font-semibold text-heading hover:bg-bg inline-flex items-center gap-1 cursor-pointer"
                    title="Copy all open notes at once"
                  >
                    <Copy className="w-3.5 h-3.5" /> All Open ({openAnnotations.length})
                  </button>
                )}

                {openAnnotations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllResolved(currentPageOnly)}
                    className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    {currentPageOnly ? 'Solve This Page' : 'Mark All Solved'}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={exportJson}
                    disabled={annotations.length === 0}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-heading hover:bg-bg inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-heading hover:bg-bg inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Import JSON
                  </button>
                </div>

                {resolvedAnnotations.length > 0 && (
                  <button
                    type="button"
                    onClick={clearResolved}
                    className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    Clear Solved ({resolvedAnnotations.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
