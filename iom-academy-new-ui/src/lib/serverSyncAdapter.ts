import { useState, useEffect, useCallback } from 'react'
import { hydrateSuperAdminStoresFromServer } from './superAdminStore'

export type SyncState = 'synced' | 'syncing' | 'offline' | 'pending'

export interface SyncStatus {
  state: SyncState
  lastSyncedAt: Date | null
  pendingCount: number
  error: string | null
}

const PENDING_SYNC_KEY = 'iom_pending_cloud_sync_keys'
const LAST_SYNC_KEY = 'iom_last_cloud_sync_time'

export function getPendingSyncKeys(): string[] {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function recordPendingKey(key: string) {
  try {
    const current = new Set(getPendingSyncKeys())
    current.add(key)
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(Array.from(current)))
  } catch {}
}

export function clearPendingKeys() {
  try {
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify([]))
  } catch {}
}

export async function syncWithCloudDatabase(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  if (typeof window === 'undefined') return { success: false, syncedCount: 0 }
  if (!window.navigator.onLine) {
    return { success: false, syncedCount: 0, error: 'Offline' }
  }

  try {
    const res = await hydrateSuperAdminStoresFromServer()
    clearPendingKeys()
    const now = new Date()
    localStorage.setItem(LAST_SYNC_KEY, now.toISOString())
    return { success: true, syncedCount: res.downloaded + res.uploaded }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Backend unreachable'
    return { success: false, syncedCount: 0, error: msg }
  }
}

/**
 * React Hook that monitors online status and cloud database synchronization.
 */
export function useCloudDatabaseSync() {
  const [status, setStatus] = useState<SyncStatus>(() => {
    const isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true
    const lastSyncRaw = typeof window !== 'undefined' ? localStorage.getItem(LAST_SYNC_KEY) : null
    const pending = typeof window !== 'undefined' ? getPendingSyncKeys().length : 0
    return {
      state: !isOnline ? 'offline' : pending > 0 ? 'pending' : 'synced',
      lastSyncedAt: lastSyncRaw ? new Date(lastSyncRaw) : null,
      pendingCount: pending,
      error: null,
    }
  })

  const syncNow = useCallback(async () => {
    setStatus((prev) => ({ ...prev, state: 'syncing', error: null }))
    const result = await syncWithCloudDatabase()
    setStatus((prev) => {
      if (result.success) {
        return {
          state: 'synced',
          lastSyncedAt: new Date(),
          pendingCount: 0,
          error: null,
        }
      }
      return {
        state: typeof window !== 'undefined' && !window.navigator.onLine ? 'offline' : 'pending',
        lastSyncedAt: prev.lastSyncedAt,
        pendingCount: getPendingSyncKeys().length,
        error: result.error || null,
      }
    })
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      syncNow()
    }
    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, state: 'offline' }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial sync check on mount
    syncNow()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncNow])

  return {
    ...status,
    syncNow,
  }
}
