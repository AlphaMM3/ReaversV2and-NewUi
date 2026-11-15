import { useEffect, useReducer, lazy, Suspense } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import LoginView from '@/features/auth/LoginView'
import AppShell from '@/features/layout/AppShell'
import DashboardPage from '@/features/dashboard/DashboardPage'

// Lazy-loaded route components (Clean Architecture & Performance Code-Splitting)
const ClassesPage = lazy(() => import('@/features/classes/ClassesPage'))
const AcademicCalendarPage = lazy(() => import('@/features/calendar/AcademicCalendarPage'))
const RoutinePage = lazy(() => import('@/features/classes/RoutinePage'))
const AttendancePage = lazy(() => import('@/features/attendance/AttendancePage'))
const MonthlySummaryPage = lazy(() => import('@/features/attendance/MonthlySummaryPage'))
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'))
const AcademicLearningPage = lazy(() => import('@/features/learning/AcademicLearningPage'))
const ResourcesPage = lazy(() => import('@/features/learning/ResourcesPage'))
const FollowupsPage = lazy(() => import('@/features/followups/FollowupsPage'))
const LeavesPage = lazy(() => import('@/features/followups/LeavesPage'))
const AdmissionsEnrollmentsPage = lazy(() =>
  import('@/features/students/PeoplePages').then((m) => ({ default: m.AdmissionsEnrollmentsPage })),
)
const StudentsPage = lazy(() =>
  import('@/features/students/PeoplePages').then((m) => ({ default: m.StudentsPage })),
)
const OneToOnePage = lazy(() => import('@/features/oneto1/OneToOnePage'))
const GuardianPortalPage = lazy(() => import('@/features/guardian/GuardianPortalPage'))
const InvoicesPage = lazy(() => import('@/features/commercial/InvoicesPage'))
const PayablesPage = lazy(() => import('@/features/commercial/PayablesPage'))
const ExpensesPage = lazy(() => import('@/features/commercial/ExpensesPage'))
const TeacherOpsPage = lazy(() => import('@/features/teachers/TeacherOpsPage'))
const ApprovalCenterPage = lazy(() => import('@/features/approvals/ApprovalCenterPage'))
const AcademicGovernancePage = lazy(() => import('@/features/governance/AcademicGovernancePage'))
const TicketsPage = lazy(() => import('@/features/tickets/TicketsPage'))
const SystemHubPage = lazy(() => import('@/features/system/SystemHubPage'))
const ExecutiveReportsPage = lazy(() => import('@/features/reports/ExecutiveReportsPage'))
const CommunicationsPage = lazy(() => import('@/features/communications/CommunicationsPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const UsersPage = lazy(() => import('@/features/users/UsersPage'))
const AuditPage = lazy(() => import('@/features/audit/AuditPage'))
const ProfileAccountPage = lazy(() => import('@/features/profile/ProfileAccountPage'))
const LeaderboardPage = lazy(() => import('@/features/leaderboard/LeaderboardPage'))
const PublicVerifyPage = lazy(() => import('@/features/public/PublicVerifyPage'))
import type { CurrentUser } from '@/lib/api'
import { authApi, subscribeUnauthorized } from '@/lib/api'
import { getStoredSessionUser, saveSessionUser } from '@/lib/demoSession'
import {
  DEFAULT_NAV_VISIBILITY_RULES,
  NAV_VISIBILITY_RULES_KEY,
  hydrateSuperAdminStoresFromServer,
  type NavVisibilityOverrides,
  useLocalStore,
} from '@/lib/superAdminStore'
import { canAccessRoute, getDefaultRouteForRole } from '@/features/layout/navConfig'
import { useHashRoute, parseHashRoute } from '@/lib/router'
import { useToast } from '@/components/ui/Toast'
import { ShieldAlert } from 'lucide-react'
import '@/lib/stateMachines'

// Explicit discriminated union for Auth session state machine (eliminates impossible states)
type AuthState =
  | { status: 'checking' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: CurrentUser }

type AuthAction =
  | { type: 'SESSION_FOUND'; user: CurrentUser }
  | { type: 'SESSION_MISSING' }
  | { type: 'LOGIN_SUCCESS'; user: CurrentUser }
  | { type: 'ROLE_SWITCHED'; user: CurrentUser }
  | { type: 'UNAUTHORIZED_401' }
  | { type: 'LOGOUT' }

function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SESSION_FOUND':
    case 'LOGIN_SUCCESS':
    case 'ROLE_SWITCHED':
      return { status: 'authenticated', user: action.user }
    case 'SESSION_MISSING':
    case 'UNAUTHORIZED_401':
    case 'LOGOUT':
      return { status: 'unauthenticated' }
  }
}

function PageNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted">
      <p className="text-4xl font-bold mb-2">404</p>
      <p className="text-sm">Page not found. Use the sidebar to navigate.</p>
    </div>
  )
}

function AccessRestricted({ fallbackRoute, onGoBack }: { fallbackRoute: string; onGoBack: (route: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[52vh] text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-3">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-heading">Access Restricted by Admin Rules</h2>
      <p className="text-sm text-muted max-w-md mt-1 mb-5">
        This module is currently hidden or disabled for your role in Roles &amp; Permissions.
      </p>
      <button
        type="button"
        onClick={() => onGoBack(fallbackRoute)}
        className="px-4 py-2 rounded-lg bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 cursor-pointer"
      >
        Go to Allowed Workspace
      </button>
    </div>
  )
}

function getPage(route: string, user: CurrentUser, role: string) {
  switch (route) {
    case '':
    case 'dashboard':          return <DashboardPage user={user} role={role} />
    case 'classes':            return <ClassesPage role={role} />
    case 'calendar':           return <AcademicCalendarPage role={role} />
    case 'routine':            return <RoutinePage role={role} />
    case 'reports':            return <ReportsPage />
    case 'homework':           return <AcademicLearningPage role={role} mode="learning" />
    case 'exams':              return <AcademicLearningPage role={role} mode="exams" />
    case 'resources':          return <ResourcesPage role={role} />
    case 'attendance':         return <AttendancePage />
    case 'attendance/monthly': return <MonthlySummaryPage role={role} />
    case 'followups':          return <FollowupsPage />
    case 'leaves':             return <LeavesPage role={role} />
    case 'admissions':         return <AdmissionsEnrollmentsPage initialTab="admissions" />
    case 'students':           return <StudentsPage />
    case 'enrollments':        return <AdmissionsEnrollmentsPage initialTab="enrollments" />
    case 'teachers':           return <TeacherOpsPage user={user} />
    case 'oneto1':             return <OneToOnePage role={role} />
    case 'guardian':           return <GuardianPortalPage />
    case 'invoices':           return <InvoicesPage role={role} />
    case 'payables':           return <PayablesPage role={role} />
    case 'expenses':           return <ExpensesPage />
    case 'communications':     return <CommunicationsPage role={role} />
    case 'approvals':          return <ApprovalCenterPage user={user} />
    case 'tickets':            return <TicketsPage user={user} />
    case 'governance':         return <AcademicGovernancePage role={role} />
    case 'system':             return <SystemHubPage role={role} />
    case 'executive':          return <ExecutiveReportsPage />
    case 'permissions':        return <SettingsPage role={role} initialTab="permissions" />
    case 'users':              return <UsersPage user={user} role={role} />
    case 'settings':           return <SettingsPage role={role} initialTab="branches" />
    case 'audit':              return <AuditPage />
    case 'leaderboard':        return <LeaderboardPage />
    case 'profile':            return <ProfileAccountPage user={user} role={role} />
    default:                   return <PageNotFound />
  }
}

function PageLoadingFallback() {
  return (
    <div className="w-full max-w-[1680px] mx-auto p-4 sm:p-6 space-y-4 animate-pulse">
      <div className="h-7 bg-slate-200/80 rounded-xl w-64 mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200/70 rounded-2xl" />
        ))}
      </div>
      <div className="h-80 bg-slate-200/60 rounded-2xl" />
    </div>
  )
}

export default function App() {
  const [auth, dispatch] = useReducer(authReducer, { status: 'checking' })
  const { route, navigate } = useHashRoute()
  const qc = useQueryClient()
  const toast = useToast()
  const [navRules] = useLocalStore<NavVisibilityOverrides>(
    NAV_VISIBILITY_RULES_KEY,
    DEFAULT_NAV_VISIBILITY_RULES,
  )

  const isPublic = route === 'verify' || route.startsWith('verify/')
  const authUserId = auth.status === 'authenticated' ? auth.user.id : null
  const authUserRole = auth.status === 'authenticated' ? auth.user.role : null

  useEffect(() => {
    if (isPublic) return
    let active = true
    const stored = getStoredSessionUser()
    authApi.me()
      .then((u) => {
        if (!active) return
        if (u && u.id && u.role) {
          saveSessionUser(u)
          dispatch({ type: 'SESSION_FOUND', user: u })
        } else if (stored) {
          dispatch({ type: 'SESSION_FOUND', user: stored })
        } else {
          dispatch({ type: 'SESSION_MISSING' })
        }
      })
      .catch(() => {
        if (!active) return
        if (stored) {
          dispatch({ type: 'SESSION_FOUND', user: stored })
        } else {
          dispatch({ type: 'SESSION_MISSING' })
        }
      })
    return () => { active = false }
  }, [isPublic])

  useEffect(() => {
    if (auth.status === 'authenticated') {
      void hydrateSuperAdminStoresFromServer()
    }
  }, [auth.status, authUserId, authUserRole])

  // If landing/default route (#/ or #/dashboard) is disabled for this role, redirect immediately to first allowed route
  useEffect(() => {
    if (auth.status !== 'authenticated' || isPublic) return
    if ((route === '' || route === 'dashboard') && !canAccessRoute('dashboard', auth.user.role, navRules)) {
      const target = getDefaultRouteForRole(auth.user.role, navRules)
      if (target !== '#/dashboard') {
        navigate(target)
      }
    }
  }, [auth, isPublic, route, navRules, navigate])

  useEffect(() => {
    return subscribeUnauthorized(() => {
      const currentRoute = parseHashRoute(window.location.hash).route
      if (currentRoute === 'verify' || currentRoute.startsWith('verify/')) return
      saveSessionUser(null)
      dispatch({ type: 'UNAUTHORIZED_401' })
      qc.clear()
      navigate('#/login')
      toast.warning('Session expired. Please sign in again.')
    })
  }, [qc, navigate, toast])

  // Public unauthenticated routes (e.g. Digital Sanad QR Verification #/verify/IOM-SANAD-...)
  if (isPublic) {
    const code = route.startsWith('verify/') ? decodeURIComponent(route.slice('verify/'.length)) : ''
    return (
      <div data-auth-state="public" data-route="verify">
        <Suspense fallback={<PageLoadingFallback />}>
          <PublicVerifyPage initialCode={code} />
        </Suspense>
      </div>
    )
  }

  if (auth.status === 'checking') {
    return (
      <div
        data-auth-state="checking"
        data-route={route}
        className="min-h-screen flex items-center justify-center bg-bg"
      >
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-primary-700 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    )
  }

  if (auth.status === 'unauthenticated') {
    return (
      <div data-auth-state="unauthenticated" data-role="anonymous" data-route="login">
        <LoginView
          onLogin={(u) => {
            saveSessionUser(u)
            dispatch({ type: 'LOGIN_SUCCESS', user: u })
            navigate(getDefaultRouteForRole(u.role, navRules))
          }}
        />
      </div>
    )
  }

  const fallbackRoute = getDefaultRouteForRole(auth.user.role, navRules)
  const fallbackCleanRoute = fallbackRoute.replace(/^#\/?/, '')
  const normalizedRoute = route === '' ? 'dashboard' : route
  const isRouteAllowed = canAccessRoute(normalizedRoute, auth.user.role, navRules)

  const page = isRouteAllowed
    ? getPage(route, auth.user, auth.user.role)
    : normalizedRoute === 'dashboard' && fallbackCleanRoute !== 'dashboard'
      ? getPage(fallbackCleanRoute, auth.user, auth.user.role)
      : <AccessRestricted fallbackRoute={fallbackRoute} onGoBack={navigate} />

  return (
    <div data-auth-state="authenticated" data-role={auth.user.role} data-route={route}>
      <AppShell
        user={auth.user}
        onUserChange={(u) => {
          saveSessionUser(u)
          dispatch({ type: 'ROLE_SWITCHED', user: u })
        }}
        onLogout={() => {
          saveSessionUser(null)
          dispatch({ type: 'LOGOUT' })
          qc.clear()
          navigate('#/login')
        }}
      >
        <Suspense fallback={<PageLoadingFallback />}>
          {page}
        </Suspense>
      </AppShell>
    </div>
  )
}
