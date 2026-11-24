import { useSupportTickets } from '@/lib/supportApi'
import { Bell, Search, LogOut, BookOpen, Menu, X, ChevronRight, MessageSquarePlus, PanelLeftClose, PanelLeftOpen, Megaphone, MessageSquare, Sparkles } from 'lucide-react'
import { roleLabel, initials, avatarColor, cn } from '@/lib/utils'
import type { CurrentUser, AccountRolesResponse } from '@/lib/api'
import { api, authApi, toArray } from '@/lib/api'
import {
  GROUP_META,
  type NavGroupKey,
  createDefaultOpenGroups,
  getDefaultRouteForRole,
  getMobileQuickNav,
  getNavForRole,
  getRouteBreadcrumb,
  groupNavItems,
  isFlatNavRole,
  isNavItemActive,
} from './navConfig'
import {
  DEFAULT_NAV_VISIBILITY_RULES,
  NAV_VISIBILITY_RULES_KEY,
  STAFF_NOTICES_KEY,
  type NavVisibilityOverrides,
  type StaffAttentionNotice,
  useLocalStore,
  hydrateSuperAdminStoresFromServer,
} from '@/lib/superAdminStore'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import CloudSyncBadge from '@/components/CloudSyncBadge'
import AcademyAssistantDrawer from '@/features/ai/AcademyAssistantDrawer'
import { APP_VERSION } from '@/lib/version'
import { SidebarNavItem, SidebarGroup, getNavIcon } from './Sidebar'
import AnnotatorOverlay, { loadAnnotations } from '@/components/AnnotatorOverlay'
import { useAttentionQueue, setAttentionDocked } from '@/lib/attentionNotifications'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useHashRoute } from '@/lib/router'
import { useToast } from '@/components/ui/Toast'

interface AppShellProps {
  user: CurrentUser
  onUserChange: (u: CurrentUser) => void
  onLogout: () => void
  children: React.ReactNode
  pendingCounts?: { followups?: number; reports?: number; pending?: number; tickets?: number }
}

const SIDEBAR_STORAGE_KEY = 'iom_sidebar_groups_v2'
const SIDEBAR_COLLAPSED_KEY = 'iom_sidebar_collapsed_v1'

function loadInitialGroupState(role: string): Record<NavGroupKey, boolean> {
  const defaults = createDefaultOpenGroups(role)
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<Record<NavGroupKey, boolean>>
    return { ...defaults, ...parsed }
  } catch {
    return defaults
  }
}

function loadInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export default function AppShell({ user, onUserChange, onLogout, children, pendingCounts = {} }: AppShellProps) {
  const { rawHash, navigate } = useHashRoute()
  const activeRoute = rawHash.split('?')[0] || '#/dashboard'
  const [loggingOut, setLoggingOut] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)
  const [navSearch, setNavSearch] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [annotating, setAnnotating] = useState(false)
  const [annotationCount, setAnnotationCount] = useState(() => loadAnnotations().length)
  const [openGroups, setOpenGroups] = useState<Record<NavGroupKey, boolean>>(() => loadInitialGroupState(user.role))
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(loadInitialCollapsed)
  const [sidebarFilter, setSidebarFilter] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const notifBoxRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const toast = useToast()

  const { data: rolesData } = useQuery<AccountRolesResponse>({
    queryKey: ['account-roles', user.id],
    queryFn: authApi.roles,
  })

  const { data: rawNotifications = [] } = useQuery<Array<{ id: number; title?: string; message: string; read_at?: string | null; created_at: string }>>({
    queryKey: ['notifications-bell', user?.id],
    queryFn: () =>
      api
        .get<Array<{ id: number; title?: string; message: string; read_at?: string | null; created_at: string }>>('/notifications')
        .then(toArray)
        .catch(() => []),
  })
  const notifications = useMemo(() => toArray(rawNotifications), [rawNotifications])
  const unreadNotifications = useMemo(() => notifications.filter((n) => !n?.read_at).length, [notifications])
  const attentionQueue = useAttentionQueue()
  const dockedAttentionItems = attentionQueue.docked ? attentionQueue.items : []

  // Global Cross-Device Auto-Sync (Pulls shared tickets, notices & stores from backend MySQL)
  useEffect(() => {
    void hydrateSuperAdminStoresFromServer()
    const timer = setInterval(() => {
      void hydrateSuperAdminStoresFromServer()
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  const [navVisibilityRules] = useLocalStore<NavVisibilityOverrides>(
    NAV_VISIBILITY_RULES_KEY,
    DEFAULT_NAV_VISIBILITY_RULES,
  )
  const [staffNotices, setStaffNotices] = useLocalStore<StaffAttentionNotice[]>(STAFF_NOTICES_KEY, [])
  const { data: supportTickets = [] } = useSupportTickets()

  // Auto-calculated live badges from stores & API
  const { data: followupsRaw = [] } = useQuery<Array<{ id: number; status: string }>>({
    queryKey: ['shell-followups'],
    queryFn: () => api.get<Array<{ id: number; status: string }> | { items?: Array<{ id: number; status: string }> }>('/followups').then(toArray).catch(() => []),
    staleTime: 30000,
  })
  const { data: reportsRaw = [] } = useQuery<Array<{ id: number; status: string }>>({
    queryKey: ['shell-reports'],
    queryFn: () => api.get<Array<{ id: number; status: string }> | { items?: Array<{ id: number; status: string }> }>('/reports?status=submitted').then(toArray).catch(() => []),
    staleTime: 30000,
  })
  const { data: paymentProofsRaw = [] } = useQuery<Array<{ id: number; status: string }>>({
    queryKey: ['shell-proofs'],
    queryFn: () => api.get<Array<{ id: number; status: string }> | { items?: Array<{ id: number; status: string }> }>('/guardian/payment-submissions').then(toArray).catch(() => []),
    staleTime: 30000,
  })

  const computedFollowupsCount = useMemo(
    () => toArray(followupsRaw).filter((f) => f.status !== 'closed' && f.status !== 'resolved').length,
    [followupsRaw],
  )
  const computedReportsCount = useMemo(
    () => toArray(reportsRaw).filter((r) => r.status === 'submitted').length,
    [reportsRaw],
  )
  const computedApprovalsCount = useMemo(
    () => toArray(paymentProofsRaw).filter((p) => p.status === 'pending').length,
    [paymentProofsRaw],
  )
  const relevantTickets = useMemo(() => {
    return toArray(supportTickets).filter((t) => {
      if (t.status === 'resolved') return false
      if (user.role === 'teacher') {
        return (
          t.target_role === 'teacher' ||
          (t.target_recipient && t.target_recipient.includes(user.name)) ||
          !t.target_recipient
        )
      }
      if (user.role === 'zimmadar' || user.role === 'department_supervisor') {
        return t.target_role === 'zimmadar' || !t.target_role
      }
      // Super admin / branch admin sees all
      return true
    })
  }, [supportTickets, user.role, user.name])

  const computedTicketsCount = relevantTickets.length

  const totalBellAlerts =
    unreadNotifications +
    dockedAttentionItems.length +
    computedTicketsCount +
    ((pendingCounts.followups ?? 0) + (pendingCounts.reports ?? 0))
  const unackedNotice = useMemo(() => {
    if (['central_admin', 'branch_admin', 'guardian_primary', 'guardian_secondary'].includes(user.role)) {
      return null
    }
    return (
      staffNotices.find((n) => {
        if (!n.active) return false
        const matchesAudience =
          n.target_audience === 'all_staff' ||
          (n.target_audience === 'zimmadar' && ['zimmadar', 'department_supervisor'].includes(user.role)) ||
          (n.target_audience === 'teacher' && user.role === 'teacher')
        if (!matchesAudience) return false
        return !n.acknowledged_by.some((a) => a.user_id === user.id)
      }) ?? null
    )
  }, [staffNotices, user.role, user.id])

  function acknowledgeBannerNotice(noticeId: string) {
    setStaffNotices((prev) =>
      prev.map((n) =>
        n.id === noticeId && !n.acknowledged_by.some((a) => a.user_id === user.id)
          ? {
              ...n,
              acknowledged_by: [
                ...n.acknowledged_by,
                { user_id: user.id, name: user.name, role: user.role, at: new Date().toISOString() },
              ],
            }
          : n,
      ),
    )
  }
  const navItems = useMemo(
    () => getNavForRole(user.role, navVisibilityRules),
    [user.role, navVisibilityRules],
  )
  const flatMode = isFlatNavRole(user.role)
  const filteredSidebarItems = useMemo(() => {
    const q = sidebarFilter.trim().toLowerCase()
    if (!q) return navItems
    return navItems.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true
      if (GROUP_META[item.group].label.toLowerCase().includes(q)) return true
      return (item.keywords ?? []).some((kw) => kw.toLowerCase().includes(q))
    })
  }, [navItems, sidebarFilter])
  const groups = useMemo(() => groupNavItems(filteredSidebarItems, user.role), [filteredSidebarItems, user.role])
  const breadcrumb = useMemo(() => getRouteBreadcrumb(navItems, activeRoute, user.role), [navItems, activeRoute, user.role])
  const mobileQuickNav = useMemo(() => getMobileQuickNav(user.role, navItems), [user.role, navItems])

  const matchingNavItems = useMemo(() => {
    const q = navSearch.trim().toLowerCase()
    if (!q) return []
    return navItems.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true
      if (GROUP_META[item.group].label.toLowerCase().includes(q)) return true
      return (item.keywords ?? []).some((kw) => kw.toLowerCase().includes(q))
    })
  }, [navItems, navSearch])

  // Auto-open whichever workflow group owns the active route
  useEffect(() => {
    const activeGroup = breadcrumb.group?.key
    if (!activeGroup) return
    setOpenGroups((prev) => {
      if (prev[activeGroup]) return prev
      const next = { ...prev, [activeGroup]: true }
      try { localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [breadcrumb.group?.key])

  // Keyboard shortcuts (/ for quick search, Alt+A for annotate mode, Escape to dismiss overlays)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const inEditable =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setAnnotating((prev) => !prev)
      } else if (e.key === '/' && !inEditable) {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        if (notifOpen) setNotifOpen(false)
        if (mobileMenuOpen) setMobileMenuOpen(false)
        if (mobileSearchOpen) setMobileSearchOpen(false)
        if (navSearch || document.activeElement === searchInputRef.current) {
          setNavSearch('')
          searchInputRef.current?.blur()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [notifOpen, mobileMenuOpen, mobileSearchOpen, navSearch])

  // Click-outside dismissal for notifications & command search popover
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (notifOpen && notifBoxRef.current && !notifBoxRef.current.contains(target)) {
        setNotifOpen(false)
      }
      if (navSearch && searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setNavSearch('')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [notifOpen, navSearch])

  const pageTitle = breadcrumb.item?.label ?? 'IOM Itqaan Academy'

  function getBadge(badge?: string) {
    if (badge === 'followups') return pendingCounts.followups ?? (computedFollowupsCount > 0 ? computedFollowupsCount : undefined)
    if (badge === 'reports') return pendingCounts.reports ?? (computedReportsCount > 0 ? computedReportsCount : undefined)
    if (badge === 'pending') return pendingCounts.pending ?? (computedApprovalsCount > 0 ? computedApprovalsCount : undefined)
    if (badge === 'tickets') return pendingCounts.tickets ?? (computedTicketsCount > 0 ? computedTicketsCount : undefined)
    return undefined
  }

  function toggleGroup(key: NavGroupKey) {
    setOpenGroups((prev) => {
      const willOpen = !prev[key]
      const next = { ...prev }
      for (const k of Object.keys(next) as NavGroupKey[]) {
        next[k] = k === key ? willOpen : false
      }
      try { localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  async function handleRoleSwitch(val: string) {
    setSwitchingRole(true)
    try {
      const assignmentId = val === 'base' ? null : Number(val)
      await authApi.switchRole(assignmentId)
      const updated = await authApi.me()
      onUserChange(updated)
      qc.invalidateQueries()
      toast.success(`Switched active role to ${roleLabel(updated.role)}`)
    } catch (err) {
      toast.error(err, 'Failed to switch role')
    } finally {
      setSwitchingRole(false)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try { await authApi.logout() } catch {}
    onLogout()
  }

  function toggleSidebarCollapse() {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0') } catch {}
      return next
    })
  }

  function handleNavigate(route: string) {
    navigate(route)
    setNavSearch('')
    setSidebarFilter('')
    setMobileMenuOpen(false)
  }

  const bg = avatarColor(user?.name)
  const assignments = Array.isArray(rolesData?.assignments) ? rolesData.assignments : []

  const renderSidebarBody = (isMobileDrawer = false) => {
    const isCollapsed = !isMobileDrawer && sidebarCollapsed
    return (
      <>
        {/* Logo + Academy Identity Card */}
        <div className={cn('pt-3.5 pb-3 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/80 to-slate-50/40 space-y-2.5 flex-shrink-0 transition-all', isCollapsed ? 'px-2' : 'px-3.5')}>
          <div className={cn('flex items-center gap-2', isCollapsed ? 'justify-center flex-col' : 'justify-between')}>
            <button
              type="button"
              onClick={() => handleNavigate(getDefaultRouteForRole(user.role, navVisibilityRules))}
              className={cn(
                'flex items-center gap-2.5 text-left cursor-pointer group rounded-xl p-1 -m-1 transition-all',
                isCollapsed ? 'justify-center' : 'flex-1 min-w-0'
              )}
              title="আইওএম ইতকান একাডেমি — স্মার্ট ইদারা"
            >
              {/* Premium Academy Crest */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-950 via-primary-800 to-primary-600 flex items-center justify-center shadow-sm shadow-primary-950/25 ring-1 ring-white/30 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5 text-amber-300 drop-shadow-xs" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title="সিস্টেম অনলাইন" />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[15px] font-extrabold tracking-tight text-slate-900 group-hover:text-primary-800 transition-colors font-heading leading-tight">
                      IOM <span className="bg-gradient-to-r from-primary-700 to-teal-700 bg-clip-text text-transparent">Itqaan</span>
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary-50 text-primary-700 border border-primary-200/70 shadow-3xs tracking-wider uppercase">
                      Portal
                    </span>
                    <span
                      title="অ্যাকাডেমি সিস্টেম রিলিজ ভার্সন — রোলব্যাকের জন্য রেফারেন্স"
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/90 shadow-3xs"
                    >
                      {APP_VERSION}
                    </span>
                  </div>
                  <p className="text-[10.5px] font-medium text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <span className="truncate">স্মার্ট ইদারা একাডেমি</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      অনলাইন
                    </span>
                  </p>
                </div>
              )}
            </button>

            {isMobileDrawer ? (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={isCollapsed ? 'Expand sidebar' : 'Mini sidebar'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary-800 hover:bg-white hover:border hover:border-slate-200/80 hover:shadow-3xs transition-all cursor-pointer flex-shrink-0"
              >
                {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            )}
          </div>

          {!isCollapsed && (
            <div className="relative group/search">
              <Search className="w-3.5 h-3.5 text-slate-400 group-focus-within/search:text-primary-600 transition-colors absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                placeholder="মেন্যু ফিল্টার করুন..."
                aria-label="Filter sidebar menu"
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200/90 bg-white/95 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 focus:bg-white shadow-3xs transition-all"
              />
              {sidebarFilter ? (
                <button
                  type="button"
                  onClick={() => setSidebarFilter('')}
                  aria-label="ফিল্টার মুছুন"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9.5px] font-mono text-slate-400 px-1 py-0.2 bg-slate-100 rounded border border-slate-200/70 pointer-events-none">
                  /
                </span>
              )}
            </div>
          )}
        </div>

        {/* Groupwise Flow Navigation (or Flat for Guardian / Collapsed Mini-Rail) */}
        <nav aria-label="Academy sections" className={cn('flex-1 py-3 overflow-y-auto', isCollapsed ? 'px-1.5 space-y-1' : 'px-2.5')}>
          {isCollapsed ? (
            navItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                collapsed
                isActive={isNavItemActive(item, activeRoute)}
                badge={getBadge(item.badge)}
                onClick={() => handleNavigate(item.route)}
              />
            ))
          ) : flatMode || sidebarFilter.trim() ? (
            <div className="flex flex-col gap-0.5">
              {filteredSidebarItems.length === 0 ? (
                <p className="px-3 py-4 text-xs text-muted text-center">No matching menu items</p>
              ) : (
                filteredSidebarItems.map((item) => (
                  <SidebarNavItem
                    key={item.id}
                    item={item}
                    isActive={isNavItemActive(item, activeRoute)}
                    badge={getBadge(item.badge)}
                    onClick={() => handleNavigate(item.route)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {groups.map(({ meta, items }) => {
                const hasActiveChild = items.some((i) => isNavItemActive(i, activeRoute))
                const urgentCount = items.reduce((sum, i) => sum + (getBadge(i.badge) ?? 0), 0)
                return (
                  <SidebarGroup
                    key={meta.key}
                    meta={meta}
                    urgentCount={urgentCount}
                    hasActiveChild={hasActiveChild}
                    isOpen={Boolean(openGroups[meta.key])}
                    onToggle={() => toggleGroup(meta.key)}
                  >
                    {items.map((item) => (
                      <SidebarNavItem
                        key={item.id}
                        item={item}
                        isActive={isNavItemActive(item, activeRoute)}
                        badge={getBadge(item.badge)}
                        onClick={() => handleNavigate(item.route)}
                      />
                    ))}
                  </SidebarGroup>
                )
              })}
            </div>
          )}
        </nav>

        {/* User + role switcher */}
        <div className={cn('border-t border-slate-200/80 flex-shrink-0 bg-gradient-to-b from-white/70 to-slate-50/95', isCollapsed ? 'p-2' : 'p-3 space-y-2.5')}>
          {!isCollapsed && assignments.length > 0 && (
            <div>
              <label htmlFor={`role-switch-${isMobileDrawer ? 'm' : 'd'}`} className="sr-only">
                Active role assignment
              </label>
              <select
                id={`role-switch-${isMobileDrawer ? 'm' : 'd'}`}
                disabled={switchingRole}
                value={rolesData?.active_assignment_id ?? 'base'}
                onChange={(e) => handleRoleSwitch(e.target.value)}
                className="iom-select w-full text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-3xs"
              >
                <option value="base">
                  {roleLabel(user.base_role)} (মেইন একাউন্ট)
                </option>
                {assignments.map((r) => (
                  <option key={r.id} value={r.id}>
                    {roleLabel(r.role)} {r.branch_name ? `— ${r.branch_name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={cn('flex items-center gap-2.5', isCollapsed ? 'flex-col justify-center' : 'justify-between')}>
            <div className="relative flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-xs"
                style={{ backgroundColor: bg }}
                title={`${user.name} (${roleLabel(user.role)})`}
              >
                {initials(user.name)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title="অনলাইন" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate leading-snug">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary-50 text-primary-700 border border-primary-200/60 truncate">
                    {roleLabel(user.role)}
                  </span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="সাইন আউট"
              title="সাইন আউট"
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer border border-transparent hover:border-red-100 flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Skip-to-content accessibility link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-lg focus:bg-primary-700 focus:text-white focus:text-xs focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col bg-slate-50/98 border-r border-slate-200/80 flex-shrink-0 overflow-hidden transition-[width] duration-200 shadow-[1px_0_10px_rgba(15,23,42,0.03)]"
        style={{ width: sidebarCollapsed ? '72px' : 'var(--sidebar-width)' }}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* ── MOBILE / TABLET SLIDE-OVER DRAWER ───────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Academy navigation menu"
        >
          <div
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="relative z-10 flex flex-col bg-slate-50/98 border-r border-slate-200/90 h-full shadow-2xl max-w-[85vw]"
            style={{ width: 'var(--sidebar-width)' }}
          >
            {renderSidebarBody(true)}
          </aside>
        </div>
      )}

      {/* ── MAIN AREA ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="flex items-center justify-between gap-3 px-3 sm:px-6 bg-surface border-b border-border flex-shrink-0"
          style={{ height: 'var(--topbar-height)' }}
        >
          {/* Left: Mobile Menu Toggle + Section Group & Page Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 -ml-1 rounded-md border border-slate-200/90 bg-surface text-heading hover:bg-slate-50 cursor-pointer flex-shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0 flex items-center gap-2">
              {breadcrumb.group && (
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  <span className="truncate">{breadcrumb.group.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </span>
              )}
              <h1 className="text-sm sm:text-base font-black text-heading truncate">{pageTitle}</h1>
            </div>
          </div>

          {/* Right Action Bar: Search, Cloud Sync, AI Assistant, Theme, Bell, Annotate */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen((s) => !s)}
              aria-label="Search pages"
              className="sm:hidden w-9 h-9 rounded-md border border-slate-200/90 bg-surface text-slate-600 hover:text-heading flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Desktop Command Search */}
            <div ref={searchBoxRef} className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="search"
                aria-label="Jump to page"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && matchingNavItems.length > 0) {
                    e.preventDefault()
                    handleNavigate(matchingNavItems[0].route)
                    searchInputRef.current?.blur()
                  }
                }}
                placeholder="পৃষ্ঠায় যান… (/)"
                className="pl-8 pr-7 h-9 text-xs rounded-md border border-slate-200/90 bg-slate-50/70 w-44 lg:w-56 focus:outline-none focus:ring-1 focus:ring-primary-700 focus:border-primary-700 focus:bg-white focus:w-64 transition-all duration-200"
              />
              <kbd className="hidden lg:inline-flex absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded px-1 pointer-events-none">
                /
              </kbd>
              {navSearch.trim() && (
                <div
                  data-command-results="true"
                  className="absolute right-0 mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-md shadow-xl py-1.5 z-40"
                >
                  {matchingNavItems.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted">কোনো পেজ পাওয়া যায়নি</p>
                  ) : (
                    matchingNavItems.slice(0, 8).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item.route)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-primary-50 flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-heading truncate">{item.label}</p>
                          <p className="text-xs text-muted truncate">
                            {GROUP_META[item.group].label}
                          </p>
                        </div>
                        <span className="text-xs text-muted font-mono flex-shrink-0">{item.route}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Cloud Database Sync Status */}
            <CloudSyncBadge />

            {/* Academy AI Assistant Trigger */}
            <button
              type="button"
              onClick={() => setAiDrawerOpen(true)}
              title="ইতকান অ্যাকাডেমি এআই সহকারী"
              className="inline-flex items-center gap-1.5 px-2.5 h-9 rounded-md border border-teal-200/90 bg-teal-50 hover:bg-teal-100/80 text-teal-900 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden md:inline">এআই সহকারী</span>
            </button>

            {/* Theme Customizer Switcher */}
            <ThemeSwitcher />

            {/* Notifications Bell */}
            <div ref={notifBoxRef} className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
                aria-expanded={notifOpen}
                className="relative w-9 h-9 rounded-md border border-slate-200/90 bg-surface text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {totalBellAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center">
                    {dockedAttentionItems.length > 0 && (
                      <span className="animate-ping absolute inline-flex h-[17px] w-[17px] rounded-full bg-red-500 opacity-60" />
                    )}
                    <span className="relative min-w-[17px] h-[17px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums ring-2 ring-surface">
                      {totalBellAlerts}
                    </span>
                  </span>
                )}
              </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-2xl shadow-xl z-40 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-bold text-heading">Notifications</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false)
                      handleNavigate('#/communications')
                    }}
                    className="text-xs font-semibold text-primary-700 hover:underline cursor-pointer"
                  >
                    Open center →
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                  {dockedAttentionItems.length > 0 && (
                    <div className="bg-amber-50/50">
                      <div className="px-4 py-2 flex items-center justify-between gap-2 border-b border-amber-200/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                          Needs your attention ({dockedAttentionItems.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAttentionDocked(false)
                            setNotifOpen(false)
                            handleNavigate('#/dashboard')
                          }}
                          className="text-[11px] font-semibold text-primary-700 hover:underline cursor-pointer"
                        >
                          Show card
                        </button>
                      </div>
                      <div className="divide-y divide-amber-200/40">
                        {dockedAttentionItems.map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setNotifOpen(false)
                              handleNavigate(item.route)
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-amber-100/50 flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <span className="font-medium text-heading">{item.text}</span>
                            <span className="text-[11px] font-semibold text-primary-700 flex-shrink-0">Open →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Active Support Tickets & Guardian Chats Section */}
                  {computedTicketsCount > 0 && (
                    <div className="bg-emerald-50/70 border-b border-emerald-100 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                          সাপোর্ট টিকেট ও চ্যাট ({computedTicketsCount})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNotifOpen(false)
                            handleNavigate('#/tickets')
                          }}
                          className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          সব দেখুন →
                        </button>
                      </div>
                      <div className="space-y-1">
                        {relevantTickets.slice(0, 4).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              try {
                                sessionStorage.setItem('iom_active_ticket_id', t.id)
                              } catch {}
                              setNotifOpen(false)
                              handleNavigate('#/tickets')
                            }}
                            className="w-full text-left p-2 rounded-xl bg-white/95 border border-emerald-200/80 hover:border-emerald-400 text-xs transition-colors flex items-center justify-between cursor-pointer shadow-3xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 truncate text-[11px]">
                                #{t.token} · {t.student_name ? `${t.student_name}: ` : ''}{t.subject}
                              </p>
                              <p className="text-[10px] text-muted truncate">
                                {(Array.isArray(t.replies) ? t.replies.length : 0) > 0
                                  ? `সর্বশেষ: ${t.replies[t.replies.length - 1]?.message ?? ''}`
                                  : t.description}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 ml-2 shrink-0">
                              {Array.isArray(t.replies) ? t.replies.length : 0} বার্তা
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {notifications.length === 0 && dockedAttentionItems.length === 0 && computedTicketsCount === 0 ? (
                    <p className="p-4 text-xs text-muted text-center">No notifications right now.</p>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div key={n.id} className="px-4 py-2.5 text-xs hover:bg-bg/60">
                        <p className="font-semibold text-heading">{n.title || 'Academy Alert'}</p>
                        <p className="text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Visual UI Annotate & Note Button (Compact Icon Tool) */}
          <button
            type="button"
            data-annotator-ui="true"
            onClick={() => setAnnotating((a) => !a)}
            aria-pressed={annotating}
            title="Pin UI/UX notes directly on boxes or buttons (Alt+A)"
            className={cn(
              'relative w-9 h-9 rounded-md border flex items-center justify-center transition-colors cursor-pointer flex-shrink-0',
              annotating
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-surface border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:text-primary-700',
            )}
          >
            <MessageSquarePlus className="w-4 h-4" />
            {annotationCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-[16px] rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                {annotationCount}
              </span>
            )}
          </button>
        </div>
      </header>

        {/* Expandable Mobile Command Search Strip */}
        {mobileSearchOpen && (
          <div className="sm:hidden px-3 py-2.5 bg-surface border-b border-border relative z-30">
            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                autoFocus
                type="search"
                aria-label="Mobile page search"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && matchingNavItems.length > 0) {
                    e.preventDefault()
                    handleNavigate(matchingNavItems[0].route)
                    setMobileSearchOpen(false)
                  }
                }}
                placeholder="Search pages (e.g. sanad, fees, students)..."
                className="w-full pl-9 pr-3 py-2 min-h-[40px] text-sm rounded-xl border border-slate-300 bg-bg"
              />
            </div>
            {navSearch.trim() && (
              <div className="mt-2 bg-surface border border-border rounded-xl shadow-lg py-1 max-h-60 overflow-y-auto">
                {matchingNavItems.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted">No matching pages</p>
                ) : (
                  matchingNavItems.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        handleNavigate(item.route)
                        setMobileSearchOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="font-semibold text-heading truncate">{item.label}</span>
                      <span className="text-xs text-muted">{GROUP_META[item.group].label}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 lg:pb-6 animate-fade-in focus:outline-none"
        >
          {unackedNotice && (
            <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-start justify-between gap-3 flex-wrap shadow-2xs">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4" />
                </span>
                <div className="text-xs space-y-0.5 min-w-0">
                  <p className="font-bold text-amber-950">
                    Principal Attention: {unackedNotice.title}
                  </p>
                  <p className="text-amber-900/90 line-clamp-2">{unackedNotice.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleNavigate('#/tickets')}
                  className="px-2.5 py-1 rounded-lg border border-amber-300 bg-white text-amber-900 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                >
                  View Notice
                </button>
                <button
                  type="button"
                  onClick={() => acknowledgeBannerNotice(unackedNotice.id)}
                  className="px-2.5 py-1 rounded-lg bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 cursor-pointer"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          )}
          {children}
        </main>

        {/* Mobile Bottom Quick-Access Bar */}
        <nav
          aria-label="Mobile quick navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-border px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
        >
          {mobileQuickNav.map((item) => {
            const Icon = getNavIcon(item.icon)
            const active = isNavItemActive(item, activeRoute)
            const badge = getBadge(item.badge)
            return (
              <button
                key={`mob-${item.id}`}
                type="button"
                onClick={() => handleNavigate(item.route)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl min-w-[64px] transition-colors cursor-pointer',
                  active ? 'text-primary-700 bg-primary-50/80 font-bold' : 'text-muted hover:text-heading font-medium',
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-[10px] leading-tight truncate max-w-[74px]">
                  {item.label.split(' ')[0]}
                </span>
                {badge !== undefined && badge > 0 && (
                  <span className="absolute top-0.5 right-2.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-surface" />
                )}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl min-w-[64px] text-muted hover:text-heading font-medium cursor-pointer"
          >
            <Menu className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-tight">Menu</span>
          </button>
        </nav>
      </div>

      <AnnotatorOverlay
        activeRoute={activeRoute}
        annotating={annotating}
        onToggleAnnotating={setAnnotating}
        onCountChange={setAnnotationCount}
      />

      <AcademyAssistantDrawer
        user={user}
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />
    </div>
  )
}
