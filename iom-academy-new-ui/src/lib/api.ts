// ============================================================
// API client — CSRF-aware fetch helper for IOM Academy
// Matches the real Express backend in iom-itqaan-academy-v2:
//   - CSRF token is returned by POST /api/login and GET /api/me
//   - Errors return { detail: string, fields?: Record<string, string> }
// ============================================================

export const API_BASE = '/api'

let _csrfToken: string | null = null
const _unauthorizedListeners = new Set<() => void>()

export function subscribeUnauthorized(listener: () => void): () => void {
  _unauthorizedListeners.add(listener)
  return () => {
    _unauthorizedListeners.delete(listener)
  }
}

export function setCsrfToken(token: string | null) {
  _csrfToken = token
}

export function clearCsrfToken() {
  _csrfToken = null
}

export class ApiError extends Error {
  status: number
  fields?: Record<string, string>

  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  json?: unknown
  body?: BodyInit | null
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { json, headers: extraHeaders, method: rawMethod, body, ...rest } = options
  const method = rawMethod || (json !== undefined ? 'POST' : 'GET')

  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string>),
  }

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    headers['x-csrf-token'] = _csrfToken ?? ''
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'same-origin',
    headers,
    body: json !== undefined ? JSON.stringify(json) : body,
    ...rest,
  })

  if (res.status === 401 && path !== '/login' && path !== '/me') {
    clearCsrfToken()
    _unauthorizedListeners.forEach((fn) => fn())
  }

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.toLowerCase().includes('application/json')

  // If server returns non-JSON (e.g. index.html rewrite fallback on static host), treat as API error
  if (!isJson) {
    throw new ApiError(
      res.ok
        ? 'Backend API unavailable (received HTML response from static host).'
        : `Server returned non-JSON error (status ${res.status}).`,
      res.ok ? 503 : res.status,
    )
  }

  const payload = await res.json().catch(() => ({
    detail:
      res.status >= 500
        ? 'Backend server (port 3020) is unreachable. Start the backend server and retry.'
        : res.statusText || 'Unexpected response',
  }))

  if (!res.ok) {
    const detail =
      typeof payload?.detail === 'string'
        ? payload.detail
        : typeof payload?.message === 'string'
          ? payload.message
          : `HTTP ${res.status}`
    throw new ApiError(detail, res.status, payload?.fields)
  }

  return payload as T
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown = {}) =>
    apiFetch<T>(path, { method: 'POST', json: body }),
  patch: <T>(path: string, body: unknown = {}) =>
    apiFetch<T>(path, { method: 'PATCH', json: body }),
  put: <T>(path: string, body: unknown = {}) =>
    apiFetch<T>(path, { method: 'PUT', json: body }),
  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE', json: {} }),
}

export function toArray<T>(
  data: T[] | { items?: T[]; rows?: T[] } | null | undefined,
): T[] {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.items)) return data.items
  if (data && Array.isArray(data.rows)) return data.rows
  return []
}

// ============================================================
// Backend Domain Types
// ============================================================

export interface RoleAssignment {
  id: number
  role: string
  branch_id: number | null
  department_id: number | null
  branch_name: string | null
  department_name: string | null
}

export interface AccountRolesResponse {
  base: { role: string; branch_id: number | null; department_id: number | null }
  active_assignment_id: number | null
  assignments: RoleAssignment[]
}

export interface CurrentUser {
  id: number
  name: string
  email: string
  role: string
  branch_id: number | null
  department_id: number | null
  base_role: string
  csrf: string
}

export interface DashboardSummary {
  students: number
  enrollments: number
  classes: number
  group_enrollments: number
  one_to_one_enrollments: number
  active_enrollments: number
}

export interface ClassSession {
  id: number
  batch_id: number
  course_title: string
  batch_name: string
  delivery_mode: string
  scheduled_start: string
  scheduled_end: string | null
  actual_start?: string | null
  actual_end?: string | null
  status: 'scheduled' | 'in_progress' | 'ended' | 'cancelled'
  held_verified: number | boolean
  meeting_url?: string | null
}

export interface AttendanceRow {
  id: number | null
  class_id: number
  enrollment_id: number
  full_name: string
  status: 'Present' | 'Late' | 'Absent' | 'Unrecorded'
  join_time: string | null
  verified_by: number | null
  verified_at: string | null
  revision: number
}

export interface ReportRow {
  id: number
  class_id: number
  author_id: number
  status: 'draft' | 'submitted' | 'approved' | 'returned'
  revision: number
  first_submitted_at: string | null
  review_reason: string | null
  updated_at: string
  batch_name: string
  course_title: string
  zimmadar_id: number | null
  teacher_id: number | null
  branch_id: number
  actual_start: string | null
  actual_end: string | null
  due_at: string | null
  submission_status: 'pending' | 'on_time' | 'late' | 'unresolved'
}

export interface ReportDetailResponse {
  template: unknown
  report: {
    id: number
    class_id: number
    author_id: number
    body: string
    status: 'draft' | 'submitted' | 'approved' | 'returned'
    revision: number
    review_reason: string | null
    latest_history_id: number
  } | null
  history: Array<{
    id: number
    revision: number
    body: string
    event: string
    actor_id: number
    at: string
  }>
  latest_history_id: number
}

// ============================================================
// Auth & Endpoint Helpers
// ============================================================

export const authApi = {
  login: async (email: string, password: string): Promise<CurrentUser> => {
    const res = await api.post<{
      ok: boolean
      csrf: string
      user: { id: number; name: string; role: string }
    }>('/login', { email, password })
    setCsrfToken(res.csrf)
    const me = await api.get<CurrentUser>('/me')
    setCsrfToken(me.csrf)
    return me
  },

  logout: async () => {
    try {
      await api.post<void>('/logout', {})
    } finally {
      clearCsrfToken()
    }
  },

  me: async (): Promise<CurrentUser> => {
    const me = await api.get<CurrentUser>('/me')
    if (!me || typeof me !== 'object' || !me.id || !me.role) {
      throw new ApiError('Invalid session user payload', 401)
    }
    setCsrfToken(me.csrf)
    return me
  },

  roles: () =>
    api
      .get<AccountRolesResponse>('/account/roles')
      .then((data) => {
        if (!data || typeof data !== 'object' || !Array.isArray(data.assignments)) {
          return {
            base: { role: 'central_admin', branch_id: null, department_id: null },
            active_assignment_id: null,
            assignments: [],
          }
        }
        return data
      })
      .catch(() => ({
        base: { role: 'central_admin', branch_id: null, department_id: null },
        active_assignment_id: null,
        assignments: [],
      })),

  switchRole: (assignment_id: number | null) =>
    api.post<{ ok: boolean }>('/account/role', { assignment_id }),
}

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/summary'),
}
