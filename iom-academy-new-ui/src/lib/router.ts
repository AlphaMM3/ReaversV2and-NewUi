import { useEffect, useState, useCallback, useMemo } from 'react'

export interface HashRouteState {
  rawHash: string
  route: string
  params: URLSearchParams
  navigate: (to: string) => void
}

export function parseHashRoute(raw?: string): { rawHash: string; route: string; query: string } {
  const rawHash = raw && raw.length > 0 ? raw : '#/dashboard'
  const clean = rawHash.replace(/^#/, '')
  const [pathPart, queryPart = ''] = clean.split('?')
  const route = pathPart.replace(/^\//, '') || 'dashboard'
  return { rawHash, route, query: queryPart }
}

export function navigateTo(to: string) {
  const target = to.startsWith('#') ? to : `#/${to.replace(/^\//, '')}`
  if (window.location.hash === target) {
    // Re-dispatch hashchange so listeners watching the same route/param still sync cleanly
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    return
  }
  window.location.hash = target
}

/**
 * Reactive hash router hook (eliminates stale mount-only URL query reads).
 */
export function useHashRoute(): HashRouteState {
  const [rawHash, setRawHash] = useState<string>(() => window.location.hash || '#/dashboard')

  useEffect(() => {
    const sync = () => setRawHash(window.location.hash || '#/dashboard')
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const parsed = useMemo(() => parseHashRoute(rawHash), [rawHash])
  const params = useMemo(() => new URLSearchParams(parsed.query), [parsed.query])
  const navigate = useCallback((to: string) => navigateTo(to), [])

  return {
    rawHash: parsed.rawHash,
    route: parsed.route,
    params,
    navigate,
  }
}

