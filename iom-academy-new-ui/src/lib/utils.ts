import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ============================================================
// Class name helper (Tailwind v4 safe)
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBDT(amount: number | string | null | undefined): string {
  const n = Number(amount || 0)
  return `৳${Number.isFinite(n) ? n.toLocaleString() : '0'}`
}

// ============================================================
// Asia/Dhaka date/time formatting
// ============================================================
const DHAKA_TZ = 'Asia/Dhaka'

export function formatDhakaDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleDateString('en-BD', {
    timeZone: DHAKA_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDhakaTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleTimeString('en-BD', {
    timeZone: DHAKA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDhakaDateTime(iso: string | Date): string {
  return `${formatDhakaDate(iso)}, ${formatDhakaTime(iso)}`
}

export function getDhakaToday(): string {
  return new Date().toLocaleDateString('en-BD', {
    timeZone: DHAKA_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getDhakaDateString(): string {
  // Returns YYYY-MM-DD in Dhaka timezone
  const now = new Date()
  const dhakaDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: DHAKA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return dhakaDate
}

/** Report deadline: 23:59 same day, or next day 12:00 if class ends ≥ 23:00 (AM-04/AM-07) */
export function getReportDeadline(scheduledEnd: string): Date {
  const end = new Date(scheduledEnd)

  // Get local Dhaka date (YYYY-MM-DD) and hour of scheduledEnd
  const dhakaDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: DHAKA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(end)

  const dhakaHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: DHAKA_TZ,
      hour: 'numeric',
      hour12: false,
    }).format(end),
    10,
  )

  if (dhakaHour >= 23) {
    // Next day 12:00 noon BD time (AM-04/AM-07)
    const nextDay = new Date(`${dhakaDateStr}T12:00:00+06:00`)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)
    return nextDay
  }

  // Same BD date 23:59:59 Asia/Dhaka (covers after-midnight < 23:00 and normal daytime classes)
  return new Date(`${dhakaDateStr}T23:59:59+06:00`)
}

export function timeUntil(target: Date): string {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return 'Overdue'
  const hours = Math.floor(diff / 3_600_000)
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  if (hours > 0) return `${hours}h ${mins}m left`
  return `${mins}m left`
}

// ============================================================
// Misc helpers
// ============================================================

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? singular + 's'}`
}

/** Returns avatar color based on name hash — consistent per name */
export function avatarColor(name: string): string {
  const palette = [
    '#0f3d91', '#1d4ed8', '#0f766e', '#0d9488',
    '#7c3aed', '#059669', '#d97706', '#dc2626',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

/** Map role key to display name */
export const ROLE_LABELS: Record<string, string> = {
  central_admin:       'Central Admin',
  branch_admin:        'Branch Admin',
  zimmadar:            'Zimmadar',
  teacher:             'Teacher',
  guardian_primary:    'Primary Guardian',
  guardian_secondary:  'Secondary Guardian',
  finance:             'Finance',
}

export function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role
}
