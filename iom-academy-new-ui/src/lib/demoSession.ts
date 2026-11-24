import type { CurrentUser } from './api'

export const DEMO_SESSION_KEY = 'iom_active_session_user'

export const DEMO_PERSONAS: Record<string, CurrentUser> = {
  central_admin: {
    id: 1,
    name: 'প্রকৌশলী মো. রফিকুল ইসলাম',
    email: 'admin@iom-itqaan.edu.bd',
    role: 'central_admin',
    base_role: 'central_admin',
    branch_id: 1,
    department_id: 1,
    csrf: 'demo-csrf-token',
  },
  zimmadar: {
    id: 3,
    name: 'মাওলানা আবু বকর সিদ্দিক',
    email: 'abubakar.hifz@iom-itqaan.edu.bd',
    role: 'zimmadar',
    base_role: 'zimmadar',
    branch_id: 1,
    department_id: 2,
    csrf: 'demo-csrf-token',
  },
  teacher: {
    id: 5,
    name: 'মুফতী তারেক মনোয়ার',
    email: 'tareq.hifz@iom-itqaan.edu.bd',
    role: 'teacher',
    base_role: 'teacher',
    branch_id: 1,
    department_id: 2,
    csrf: 'demo-csrf-token',
  },
  guardian_primary: {
    id: 8,
    name: 'মুহাম্মদ আনিসুর রহমান',
    email: 'anisur.parent@gmail.com',
    role: 'guardian_primary',
    base_role: 'guardian_primary',
    branch_id: 1,
    department_id: null,
    csrf: 'demo-csrf-token',
  },
}

export function getStoredSessionUser(): CurrentUser | null {
  try {
    if (typeof window !== 'undefined' && (window.location.search.includes('demo=admin') || window.location.href.includes('demo=admin'))) {
      return DEMO_PERSONAS.central_admin
    }
    const raw = localStorage.getItem(DEMO_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.id && parsed.role && parsed.name) {
      return parsed as CurrentUser
    }
  } catch {
    // ignore json parse errors
  }
  return null
}

export function saveSessionUser(user: CurrentUser | null) {
  try {
    if (!user) {
      localStorage.removeItem(DEMO_SESSION_KEY)
    } else {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user))
    }
  } catch {
    // ignore storage quota errors
  }
}
