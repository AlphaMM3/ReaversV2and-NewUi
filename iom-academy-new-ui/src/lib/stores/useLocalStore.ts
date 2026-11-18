import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { RBAC_STORAGE_KEY, NAV_VISIBILITY_RULES_KEY } from './rbacStore'
import {
  TEACHER_LEAVES_KEY,
  SYLLABUS_MILESTONES_KEY,
  STUDENT_MILESTONE_LOGS_KEY,
  CERTIFICATES_KEY,
  DROPOUT_REASONS_KEY,
  AUTOMATION_RULES_KEY,
  ACADEMY_BRANDING_KEY,
  STUDENT_PHOTOS_KEY,
  COURSE_TRACKER_PLANS_KEY,
  HOMEWORK_OVERRIDES_KEY,
  STAR_STUDENTS_KEY,
  STAFF_NOTICES_KEY,
  BOOKSHELF_VAULT_KEY,
} from './academicStore'
import {
  FEE_PLANS_KEY,
  EXPENSES_KEY,
  PAYROLL_SETTLEMENTS_KEY,
  FEE_WAIVERS_KEY,
  GUARDIAN_ACCOUNTS_KEY,
} from './financeStore'
import { USER_ACCOUNTS_KEY, USER_PRESENCE_KEY } from './userProfilesStore'

export const STORAGE_EVENT = 'iom-super-admin-storage'

export const ALL_SUPER_ADMIN_KEYS = [
  RBAC_STORAGE_KEY,
  NAV_VISIBILITY_RULES_KEY,
  TEACHER_LEAVES_KEY,
  FEE_PLANS_KEY,
  EXPENSES_KEY,
  PAYROLL_SETTLEMENTS_KEY,
  SYLLABUS_MILESTONES_KEY,
  STUDENT_MILESTONE_LOGS_KEY,
  CERTIFICATES_KEY,
  DROPOUT_REASONS_KEY,
  FEE_WAIVERS_KEY,
  AUTOMATION_RULES_KEY,
  ACADEMY_BRANDING_KEY,
  STUDENT_PHOTOS_KEY,
  COURSE_TRACKER_PLANS_KEY,
  HOMEWORK_OVERRIDES_KEY,
  STAR_STUDENTS_KEY,
  STAFF_NOTICES_KEY,
  BOOKSHELF_VAULT_KEY,
  GUARDIAN_ACCOUNTS_KEY,
  USER_ACCOUNTS_KEY,
  USER_PRESENCE_KEY,
] as const

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStore<T>(key: string, value: T, opts: { sync?: boolean } = { sync: true }): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key } }))
  } catch {
    // Ignore storage quota / private mode failures gracefully
  }
  if (opts.sync !== false && (ALL_SUPER_ADMIN_KEYS as readonly string[]).includes(key)) {
    void api.put(`/super-admin/stores/${encodeURIComponent(key)}`, { value }).catch(() => {
      // Non-blocking background sync (e.g. insufficient role or offline)
    })
  }
}

export function useLocalStore<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readStore(key, fallback))

  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail
      if (detail?.key === key) {
        setValue(readStore(key, fallback))
      }
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        setValue(readStore(key, fallback))
      }
    }
    window.addEventListener(STORAGE_EVENT, onCustom)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(STORAGE_EVENT, onCustom)
      window.removeEventListener('storage', onStorage)
    }
  }, [key, fallback])

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        writeStore(key, resolved)
        return resolved
      })
    },
    [key],
  )

  return [value, update]
}

export function exportAllSuperAdminData(): string {
  const snapshot: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    app: 'iom-itqaan-academy-super-admin',
    version: 1,
    stores: {} as Record<string, unknown>,
  }
  const stores = snapshot.stores as Record<string, unknown>
  for (const key of ALL_SUPER_ADMIN_KEYS) {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) {
        stores[key] = JSON.parse(raw)
      }
    } catch {
      // Skip unparseable keys
    }
  }
  return JSON.stringify(snapshot, null, 2)
}

export function importSuperAdminData(jsonStr: string): number {
  return importAllSuperAdminData(jsonStr).restoredKeys
}

export function importAllSuperAdminData(rawJson: string): { restoredKeys: number } {
  const parsed = JSON.parse(rawJson) as { stores?: Record<string, unknown> }
  if (!parsed || typeof parsed !== 'object' || !parsed.stores || typeof parsed.stores !== 'object') {
    throw new Error('Invalid backup file: missing "stores" object')
  }
  const allowed = new Set<string>(ALL_SUPER_ADMIN_KEYS)
  let restoredKeys = 0
  for (const [key, val] of Object.entries(parsed.stores)) {
    if (allowed.has(key)) {
      writeStore(key, val, { sync: true })
      restoredKeys += 1
    }
  }
  return { restoredKeys }
}

/**
 * Hydrates local stores from the backend MySQL `/api/super-admin/stores` endpoint,
 * and seed any locally-existing keys that have not yet been uploaded.
 */
export async function hydrateSuperAdminStoresFromServer(): Promise<{ downloaded: number; uploaded: number }> {
  try {
    const res = await api.get<{ stores?: Record<string, { value: unknown; updated_at: string }> }>(
      '/super-admin/stores',
    )
    const serverStores = res?.stores || {}
    let downloaded = 0
    let uploaded = 0
    for (const key of ALL_SUPER_ADMIN_KEYS) {
      if (Object.prototype.hasOwnProperty.call(serverStores, key)) {
        writeStore(key, serverStores[key].value, { sync: false })
        downloaded += 1
      } else {
        try {
          const raw = window.localStorage.getItem(key)
          if (raw !== null) {
            const parsed = JSON.parse(raw)
            void api.put(`/super-admin/stores/${encodeURIComponent(key)}`, { value: parsed }).catch(() => {})
            uploaded += 1
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
    return { downloaded, uploaded }
  } catch {
    return { downloaded: 0, uploaded: 0 }
  }
}
