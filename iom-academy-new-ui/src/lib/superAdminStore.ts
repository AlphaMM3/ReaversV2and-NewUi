import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

// Hybrid localStorage + MySQL-backed Super Admin configuration & ledger helpers.
// Writes immediately update localStorage for instant UI feedback AND sync to
// /api/super-admin/stores/:key so multiple admins on different computers share the same data.

const STORAGE_EVENT = 'iom-super-admin-storage'

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

// ── 1. RBAC Policy Matrix ────────────────────────────────────────────────────
export type PolicyRole = 'central_admin' | 'branch_admin' | 'department_supervisor' | 'zimmadar' | 'teacher'

export interface RolePermissionSpec {
  id: string
  label: string
  description: string
  enforcedByBackend: boolean
  roles: Record<PolicyRole, boolean>
}

export const RBAC_STORAGE_KEY = 'iom_rbac_policy_v1'

export type NavVisibilityOverrides = Record<string, Partial<Record<PolicyRole, boolean>>>
export const NAV_VISIBILITY_RULES_KEY = 'iom_nav_visibility_rules_v1'
export const DEFAULT_NAV_VISIBILITY_RULES: NavVisibilityOverrides = {}

export const DEFAULT_RBAC_PERMISSIONS: RolePermissionSpec[] = [
  {
    id: 'manage_branches_roles',
    label: 'Create Branches & Multi-Role Assignments',
    description: 'Central Admin only in backend API; Principal governs branch structure.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: false, department_supervisor: false, zimmadar: false, teacher: false },
  },
  {
    id: 'manage_staff_courses',
    label: 'Create Users, Departments, Courses & Batches',
    description: 'Onboard teachers/staff and organize online courses & delivery modes.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: false, zimmadar: false, teacher: false },
  },
  {
    id: 'review_admissions_fees',
    label: 'Admissions Review & Tuition Invoicing',
    description: 'Approve admissions, generate monthly bills, and verify bKash/Nagad receipts.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: false, zimmadar: false, teacher: false },
  },
  {
    id: 'assign_substitute_teacher',
    label: 'Approve Teacher Leave & Assign Substitute',
    description: 'Assign proxy teachers on scheduled online sessions when regular teacher is on leave.',
    enforcedByBackend: false,
    roles: { central_admin: true, branch_admin: true, department_supervisor: true, zimmadar: true, teacher: false },
  },
  {
    id: 'apply_fee_discounts',
    label: 'Apply Sibling / Zakat / Scholarship Waivers',
    description: 'Controls who may apply custom discounts or scholarships during billing.',
    enforcedByBackend: false,
    roles: { central_admin: true, branch_admin: true, department_supervisor: false, zimmadar: false, teacher: false },
  },
  {
    id: 'settle_teacher_payroll',
    label: 'Approve Expenses & Settle Teacher Payroll',
    description: 'Finalize salary slips, retainers/bonuses, and log operating expenses.',
    enforcedByBackend: false,
    roles: { central_admin: true, branch_admin: true, department_supervisor: false, zimmadar: false, teacher: false },
  },
  {
    id: 'unlock_late_attendance',
    label: 'Review Late Attendance Corrections (>24h)',
    description: 'Override 24h teacher lock window on held class attendance & reports.',
    enforcedByBackend: true,
    roles: { central_admin: true, branch_admin: true, department_supervisor: true, zimmadar: true, teacher: false },
  },
  {
    id: 'conduct_online_classes',
    label: 'Start Live Class, Mark Attendance & Report',
    description: 'Launch Zoom/Meet session, submit attendance, and file post-class reports.',
    enforcedByBackend: true,
    roles: { central_admin: false, branch_admin: false, department_supervisor: false, zimmadar: true, teacher: true },
  },
  {
    id: 'manage_user_status_fee_hold',
    label: 'আইডি সক্রিয়/স্থগিত ও বকেয়া ফি লক (User ID Suspension & Fee Lock)',
    description: 'শিক্ষার্থী ও অভিভাবকের বকেয়া ফি বা শৃঙ্খলাজনিত কারণে আইডি সাময়িক বন্ধ/সক্রিয় করার ক্ষমতা।',
    enforcedByBackend: false,
    roles: { central_admin: true, branch_admin: true, department_supervisor: false, zimmadar: true, teacher: false },
  },
]

// ── 2. Teacher Leave Requests (with Proxy Support) ───────────────────────────
export interface TeacherLeaveRecord {
  id: string
  teacher_id: number
  teacher_name: string
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  substitute_teacher_id?: number | null
  substitute_teacher_name?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export const TEACHER_LEAVES_KEY = 'iom_teacher_leaves_v1'

// ── 3. Course Fee & Discount Plans ───────────────────────────────────────────
export interface CourseFeePlan {
  course_id: number
  monthly_fee: number
  one_to_one_fee: number
  sibling_discount_pct: number
  scholarship_discount_pct: number
  due_day: number
  notes: string
}

export const FEE_PLANS_KEY = 'iom_fee_plans_v1'

// ── 4. Academy Operating Expenses (P&L) ──────────────────────────────────────
export type ExpenseCategory =
  | 'Fixed Staff Salary'
  | 'Zoom & LMS Tools'
  | 'Marketing & Ads'
  | 'Server & Messaging'
  | 'Scholarships & Aid'
  | 'Office & Miscellaneous'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Fixed Staff Salary',
  'Zoom & LMS Tools',
  'Marketing & Ads',
  'Server & Messaging',
  'Scholarships & Aid',
  'Office & Miscellaneous',
]

export interface AcademyExpense {
  id: string
  title: string
  category: ExpenseCategory
  amount: number
  month: string // YYYY-MM
  expense_date: string // YYYY-MM-DD
  payment_method: 'bKash' | 'Nagad' | 'Bank Transfer' | 'Card' | 'Cash'
  reference?: string
  notes?: string
  created_by?: string
  created_at: string
}

export const EXPENSES_KEY = 'iom_expenses_v1'

// ── 5. Teacher Payroll Adjustments & Settlements ─────────────────────────────
export interface TeacherPayrollSettlement {
  key: string // `${teacher_id}:${month}`
  teacher_id: number
  month: string
  retainer_amount: number
  bonus_amount: number
  deduction_amount: number
  status: 'pending' | 'paid'
  payment_method?: 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash'
  payment_ref?: string
  paid_at?: string
  notes?: string
}

export const PAYROLL_SETTLEMENTS_KEY = 'iom_payroll_settlements_v1'

// ── 6. Module 4: Syllabus / Hifz Milestones, Certificates & Exit Reasons ─────
export interface SyllabusMilestone {
  id: string
  course_title: string
  unit_code: string // e.g. 'Para 01' or 'Unit 01'
  title: string
  target_sessions: number
}

export interface StudentMilestoneLog {
  enrollment_id: number
  completed_unit_ids: string[]
  current_note?: string
  updated_at: string
}

export const SYLLABUS_MILESTONES_KEY = 'iom_syllabus_milestones_v1'
export const STUDENT_MILESTONE_LOGS_KEY = 'iom_student_milestone_logs_v1'

export const DEFAULT_SYLLABUS_MILESTONES: SyllabusMilestone[] = [
  { id: 'ms-1', course_title: 'Hifz & Nazera Track', unit_code: 'Para 01', title: 'Surah Al-Fatihah & Al-Baqarah (1–141)', target_sessions: 18 },
  { id: 'ms-2', course_title: 'Hifz & Nazera Track', unit_code: 'Para 02', title: 'Al-Baqarah (142–252) & Tajweed Makharij', target_sessions: 18 },
  { id: 'ms-3', course_title: 'Hifz & Nazera Track', unit_code: 'Para 30', title: 'Amma Para Complete Memorization + Murajaah', target_sessions: 24 },
  { id: 'ms-4', course_title: 'Qaida & Tajweed Foundation', unit_code: 'Unit 01', title: 'Arabic Letters, Harakat & Madd Rules', target_sessions: 12 },
  { id: 'ms-5', course_title: 'Arabic & Islamic Studies', unit_code: 'Unit 02', title: 'Nahw/Sarf Basics & Daily Masnoon Duas', target_sessions: 16 },
]

export interface DigitalCertificate {
  id: string
  verification_code: string // IOM-SANAD-YYYY-XXXX
  student_id: number
  student_name: string
  enrollment_id?: number
  course_title: string
  batch_name?: string
  grade_label: string // e.g. 'Mumtaz (95%)' or 'Completed with Honors'
  issue_date: string // YYYY-MM-DD
  remarks?: string
  issued_by: string
  created_at: string
}

export const CERTIFICATES_KEY = 'iom_digital_certificates_v1'

export interface ExitDropoutRecord {
  id: string
  enrollment_id: number
  student_name: string
  batch_name: string
  new_status: string
  category: 'Graduated' | 'Fee Issue' | 'Schedule Conflict' | 'Batch Transfer' | 'Relocated' | 'Other'
  reason: string
  recorded_by: string
  recorded_at: string
}

export const DROPOUT_REASONS_KEY = 'iom_exit_dropout_reasons_v1'

// ── 7. Module 5: Fee Waiver & Refund Approvals ───────────────────────────────
export interface FeeWaiverRequest {
  id: string
  student_name: string
  enrollment_id?: number
  invoice_id?: number
  request_type: 'Sibling Discount' | 'Zakat / Scholarship' | 'Late Fee Waiver' | 'Partial Refund'
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  review_note?: string
  created_at: string
}

export const FEE_WAIVERS_KEY = 'iom_fee_waivers_v1'

// ── 8. Module 6: Automation Rules & Academy Branding ─────────────────────────
export interface AutomationRule {
  id: string
  title: string
  trigger_description: string
  channel: 'WhatsApp' | 'Telegram' | 'WhatsApp + Telegram'
  enabled: boolean
  timing_label: string
  template: string
  last_run_at?: string
}

export const AUTOMATION_RULES_KEY = 'iom_automation_rules_v1'

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule-class-15m',
    title: 'Class Starting Reminder (15 min before)',
    trigger_description: 'Alerts guardian & student before live online Zoom/Meet session starts.',
    channel: 'WhatsApp + Telegram',
    enabled: true,
    timing_label: '15 mins before scheduled_start',
    template:
      'আসসালামু আলাইকুম {student_name}-এর অভিভাবক, আর ১৫ মিনিট পর {course_title} ({batch_name}) ক্লাস শুরু হবে। জয়েন লিংক: {meeting_url}',
  },
  {
    id: 'rule-fee-due',
    title: 'Monthly Tuition Fee Due Reminder',
    trigger_description: 'Sends bKash/Nagad merchant instructions before monthly due date.',
    channel: 'WhatsApp',
    enabled: true,
    timing_label: '3 days before due_date & on due_date',
    template:
      'আসসালামু আলাইকুম, {student_name}-এর {billing_month} মাসের টিউশন ফি ৳{amount_due} বাকি রয়েছে। অনুগ্রহ করে {bkash_number} (bKash) নম্বরে পেমেন্ট করে TrxID পাঠিয়ে দিন। জাযাকাল্লাহু খাইরান।',
  },
  {
    id: 'rule-fee-overdue',
    title: 'Overdue Fee Follow-up Notice',
    trigger_description: 'Escalates unpaid invoices 5 days past due date to billing team & guardian.',
    channel: 'WhatsApp + Telegram',
    enabled: true,
    timing_label: '5 days after due_date',
    template:
      'প্রিয় অভিভাবক, {student_name}-এর {billing_month} মাসের ৳{balance} বকেয়া এখনো পরিশোধ হয়নি। কোনো সমস্যা হলে Principal হেল্পলাইনে ({helpline_phone}) যোগাযোগ করুন।',
  },
  {
    id: 'rule-absence-checkin',
    title: 'Consecutive Absence Care Check-in',
    trigger_description: 'Creates care follow-up alert when student misses 2 consecutive online classes.',
    channel: 'Telegram',
    enabled: true,
    timing_label: 'After 2 consecutive absent marks',
    template:
      'আসসালামু আলাইকুম, {student_name} পরপর ২টি ক্লাসে অনুপস্থিত ছিলেন। কোনো অসুবিধা হয়েছে কিনা জানালে আমরা সাপোর্ট ও মেকআপ ক্লাসের ব্যবস্থা করবো।',
  },
]

export interface AcademyBranding {
  academyName: string
  tagline: string
  principalName: string
  principalTitle: string
  helplinePhone: string
  whatsappSupport: string
  bkashNumber: string
  nagadNumber: string
  bankDetails: string
  footerNote: string
}

export const ACADEMY_BRANDING_KEY = 'iom_academy_branding_v1'

export const DEFAULT_ACADEMY_BRANDING: AcademyBranding = {
  academyName: 'IOM Itqaan Academy',
  tagline: 'Online Islamic & Quranic Excellence',
  principalName: 'Principal / Muhtamim',
  principalTitle: 'Principal & Central Academic Director',
  helplinePhone: '+880 1700-000000',
  whatsappSupport: '+880 1700-000000',
  bkashNumber: '01700-000000 (Merchant)',
  nagadNumber: '01800-000000 (Personal)',
  bankDetails: 'Islami Bank Bangladesh Ltd — A/C: 2050-XXXX-XXXX-01',
  footerNote: 'Computer-generated official document from IOM Itqaan Academy Super Admin Portal.',
}

export const STUDENT_PHOTOS_KEY = 'iom_student_photos_v1'
export type StudentPhotoMap = Record<string, string>

export interface CourseTrackerPlan {
  batch_id: number
  start_date: string
  end_date: string
  exam_date?: string
  gender_track?: 'all' | 'male' | 'female'
  program_track?: 'hifz' | 'najera' | 'other'
  milestone_note?: string
}
export const COURSE_TRACKER_PLANS_KEY = 'iom_course_tracker_plans_v1'

export interface HomeworkPrincipalOverride {
  homework_id: number
  title?: string
  instructions?: string
  due_date?: string
  principal_note?: string
  updated_at: string
  updated_by?: string
}
export const HOMEWORK_OVERRIDES_KEY = 'iom_homework_overrides_v1'

export interface TicketAttachment {
  name: string
  url: string
  type: string
  size?: number
}

export interface TicketReply {
  id: string
  author_name: string
  author_role: string
  message: string
  created_at: string
  is_override?: boolean
  attachments?: TicketAttachment[]
}

export interface TicketRecipientOption {
  id: string
  name: string
  role: 'zimmadar' | 'teacher' | 'central_admin'
  course: string
  group: 'কোর্স জিম্মাদার' | 'ক্লাস শিক্ষক / উস্তাদ' | 'কেন্দ্রীয় প্রশাসন'
}

export const TICKET_RECIPIENT_OPTIONS: TicketRecipientOption[] = [
  // কোর্স জিম্মাদারবৃন্দ
  { id: 'zim-hifz', name: 'মাওলানা আবু বকর সিদ্দিক', role: 'zimmadar', course: 'হিফজুল কুরআন বিভাগ', group: 'কোর্স জিম্মাদার' },
  { id: 'zim-najera', name: 'মুফতি আবরারুল হক', role: 'zimmadar', course: 'নাজেরা ও কায়দা বিভাগ', group: 'কোর্স জিম্মাদার' },
  { id: 'zim-tajweed', name: 'মাওলানা ক্বারী এনামুল হাসান', role: 'zimmadar', course: 'তাজবীদ ও তারতীল বিভাগ', group: 'কোর্স জিম্মাদার' },

  // ক্লাস শিক্ষক / উস্তাদবৃন্দ
  { id: 'tchr-1', name: 'মুফতী মাওলানা আব্দুর রহমান', role: 'teacher', course: 'হিফজ সিনিয়র উস্তাদ (Hifz-A)', group: 'ক্লাস শিক্ষক / উস্তাদ' },
  { id: 'tchr-2', name: 'মাওলানা খালিদ বিন ওয়ালিদ', role: 'teacher', course: 'হিফজ শিক্ষক', group: 'ক্লাস শিক্ষক / উস্তাদ' },
  { id: 'tchr-3', name: 'হাফেজ ক্বারী শিহাব উদ্দিন', role: 'teacher', course: 'নাজেরা ও কায়দা শিক্ষক (তাজবীদ ব্যাচ ১)', group: 'ক্লাস শিক্ষক / উস্তাদ' },
  { id: 'tchr-4', name: 'উস্তাযা আয়েশা খাতুন', role: 'teacher', course: 'মহিলা শাখা শিক্ষিকা (Hifz-B)', group: 'ক্লাস শিক্ষক / উস্তাদ' },

  // একাডেমি প্রশাসন
  { id: 'admin-1', name: 'সুপার অ্যাডমিন / একাডেমি কন্ট্রোল', role: 'central_admin', course: 'ফি, পেমেন্ট ও টেকনিক্যাল সাপোর্ট', group: 'কেন্দ্রীয় প্রশাসন' },
]

export interface SupportTicket {
  id: string
  token: string
  kind: 'guardian_ticket' | 'teacher_escalation'
  category: 'fee' | 'batch' | 'academic' | 'student_issue' | 'technical' | 'general'
  priority: 'normal' | 'urgent'
  target_role: 'zimmadar' | 'teacher' | 'central_admin'
  target_recipient?: string
  subject: string
  description: string
  student_name?: string
  batch_label?: string
  created_by_id: number
  created_by_name: string
  created_by_role: string
  status: 'open' | 'in_progress' | 'resolved'
  assigned_to?: string
  created_at: string
  updated_at: string
  overridden_by?: string
  attachments?: TicketAttachment[]
  replies: TicketReply[]
}
export const SUPPORT_TICKETS_KEY = 'iom_support_tickets_v1'

export const DEFAULT_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1081-seed',
    token: 'TKT-1081',
    kind: 'guardian_ticket',
    category: 'academic',
    priority: 'urgent',
    target_role: 'zimmadar',
    target_recipient: 'মাওলানা আবু বকর সিদ্দিক (হিফজুল কুরআন বিভাগীয় জিম্মাদার)',
    subject: '[আব্দুল্লাহ বিন মাহমুদ] আমোক্তা রিভিশনে মাখরাজের প্রতি বিশেষ যত্ন নেওয়ার অনুরোধ',
    description: 'আসসালামু আলাইকুম। আমার ছেলে আব্দুল্লাহর ৫ম পারার আমোক্তা পড়ার সময় ছদ ও তোয়াদ উচ্চারণে কিছুটা জড়তা দেখা যাচ্ছে। এ বিষয়ে উস্তাদের বিশেষ নজর দেওয়ার আবেদন করছি।',
    student_name: 'আব্দুল্লাহ বিন মাহমুদ',
    batch_label: 'Hifz-A (হিফজ বালক শাখা)',
    created_by_id: 101,
    created_by_name: 'ইঞ্জিনিয়ার রফিকুল ইসলাম',
    created_by_role: 'guardian_primary',
    status: 'in_progress',
    assigned_to: 'মাওলানা আবু বকর সিদ্দিক',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    replies: [
      {
        id: 'rep-1',
        author_name: 'মাওলানা আবু বকর সিদ্দিক',
        author_role: 'zimmadar',
        message: 'ওয়ালাইকুমুস সালাম ওয়া রাহমাতুল্লাহ। সম্মানিত অভিভাবক, আপনার বার্তাটি পেয়েছি। আজ ক্লাসে উস্তাদ মাওলানা খালিদ সাহেবকে নির্দেশনা দিয়েছি তার উচ্চারণের মাখরাজ আলাদাভাবে অনুশীলন করিয়ে দিতে। ইনশাআল্লাহ আগামী ৩ দিন বিশেষ রিভিশন করানো হবে।',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'rep-2',
        author_name: 'ইঞ্জিনিয়ার রফিকুল ইসলাম',
        author_role: 'guardian_primary',
        message: 'জাযাকাল্লাহু খাইরান সম্মানিত উস্তাদ। আপনাদের সার্বক্ষণিক তদারকির জন্য আমরা কৃতজ্ঞ।',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ],
  },
  {
    id: 'tkt-1082-seed',
    token: 'TKT-1082',
    kind: 'guardian_ticket',
    category: 'fee',
    priority: 'normal',
    target_role: 'central_admin',
    target_recipient: 'সুপার অ্যাডমিন / একাডেমি কন্ট্রোল (ফি, পেমেন্ট ও টেকনিক্যাল সাপোর্ট)',
    subject: '[মুহাম্মাদ আনাস ইসলাম] নভেম্বর মাসের মাসিক ফি কনফার্মেশন ও ডিজিটাল রশিদ',
    description: 'সম্মানিত অ্যাডমিন, নভেম্বর মাসের টিউশন ফি ৩,০০০ টাকা বিকাশ মার্চেন্টে পরিশোধ করেছি (TrxID: 9JK84M2L1P)। সিস্টেম রশিদের সফট কপি ডাউনলোডের জন্য অনুরোধ রইলো।',
    student_name: 'মুহাম্মাদ আনাস ইসলাম',
    batch_label: 'Hifz-A (হিফজ বালক শাখা)',
    created_by_id: 102,
    created_by_name: 'মো: নজরুল ইসলাম',
    created_by_role: 'guardian_primary',
    status: 'resolved',
    assigned_to: 'অ্যাকাউন্টস অ্যাডমিন',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    replies: [
      {
        id: 'rep-3',
        author_name: 'অ্যাকাউন্টস ডিপার্টমেন্ট',
        author_role: 'central_admin',
        message: 'সম্মানিত অভিভাবক, আপনার বিকাশ পেমেন্ট ভেরিফাই করে সিস্টেমে ডিজিটাল ইনভয়েস জেনারেট করা হয়েছে। ড্যাশবোর্ডের ইনভয়েস সেকশন থেকে রশিদ ডাউনলোড করে নিতে পারেন। শুকরিয়া।',
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
    ],
  },
  {
    id: 'tkt-1083-seed',
    token: 'TKT-1083',
    kind: 'guardian_ticket',
    category: 'batch',
    priority: 'normal',
    target_role: 'teacher',
    target_recipient: 'উস্তাযা আয়েশা খাতুন (হিফজ ও নাজেরা উস্তাযা - মহিলা শাখা)',
    subject: '[মারিয়াম বিনতে রফিক] হিফজ-বি সান্ধ্যকালীন বিশেষ রিভিশন ক্লাসে অংশগ্রহণের আবেদন',
    description: 'আসসালামু আলাইকুম উস্তাযা। পারিবারিক একটি জরুরি কাজের কারণে আগামী শনি ও রবিবার মারিয়ামের নিয়মিত সকাল ৭:০০ টার ক্লাসের পরিবর্তে সান্ধ্যকালীন ব্যাচের সাথে রিভিশন দেওয়ার সুযোগ দেওয়ার আবেদন করছি।',
    student_name: 'মারিয়াম বিনতে রফিক',
    batch_label: 'Hifz-B (হিফজ বালিকা শাখা)',
    created_by_id: 103,
    created_by_name: 'বেগম সেলিনা আখতার',
    created_by_role: 'guardian_primary',
    status: 'open',
    assigned_to: 'উস্তাযা আয়েশা খাতুন',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    replies: [],
  },
]

export function cleanAndSanitizeTickets(tickets: SupportTicket[]): SupportTicket[] {
  const clean = tickets.filter((t) => {
    const s = ((t.subject || '') + ' ' + (t.description || '')).toLowerCase()
    return (
      !s.includes('dfsdfsdf') &&
      !s.includes('sdgfsdg') &&
      !s.includes('frfdsf') &&
      !s.includes('vbdhj') &&
      !s.includes('asdasd')
    )
  })
  if (clean.length === 0) return DEFAULT_SUPPORT_TICKETS
  return clean
}

export interface StaffAttentionNotice {
  id: string
  title: string
  message: string
  target_audience: 'all_staff' | 'zimmadar' | 'teacher'
  priority: 'normal' | 'urgent'
  created_by: string
  created_at: string
  active: boolean
  acknowledged_by: Array<{ user_id: number; name: string; role: string; at: string }>
}
export const STAFF_NOTICES_KEY = 'iom_staff_notices_v1'

export interface BatchTelegramMap {
  batch_id: number
  group_name: string
  chat_id: string
  invite_link?: string
}
export const BATCH_TELEGRAM_KEY = 'iom_batch_telegram_groups_v1'

// Media & File Attachment Utilities (Clean Architecture: Ported to @/lib/mediaUtils)
export { compressImageToDataUrl, readFileAsAttachment } from '@/lib/mediaUtils'

export interface StarStudentAward {
  id: string
  student_id: number
  student_name: string
  course_title: string
  batch_name: string
  month_key: string // e.g. '2026-11'
  rank: 1 | 2 | 3
  score: number // out of 100
  grade: 'ممتاز' | 'جيد جداً' | 'جيد'
  attendance_score: number // out of 25
  sabaq_score: number // out of 35
  homework_score: number // out of 20
  assessment_score: number // out of 20
  bonus_points?: number
  teacher_shoutout?: string
  status: 'draft' | 'zimmadar_recommended' | 'published'
  recommended_by?: string
  published_by?: string
  published_at?: string
  show_on_website: boolean
}

export const STAR_STUDENTS_KEY = 'iom_star_students_leaderboard_v1'

export const DEFAULT_STAR_STUDENTS: StarStudentAward[] = [
  {
    id: 'STAR-2026-11-1',
    student_id: 2,
    student_name: 'মারিয়াম বিনতে রফিক',
    course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
    batch_name: 'তাজবীদ ব্যাচ ১',
    month_key: '2026-11',
    rank: 1,
    score: 98,
    grade: 'ممتاز',
    attendance_score: 25,
    sabaq_score: 35,
    homework_score: 19,
    assessment_score: 19,
    bonus_points: 0,
    teacher_shoutout: 'মাশাআল্লাহ! ১০০% উপস্থিতি ও প্রতিদিনের নিয়মিত সবক পাঠে এই মাসে সর্বোচ্চ স্থান অর্জন করেছে।',
    status: 'published',
    recommended_by: 'মাওলানা আবু বকর সিদ্দিক (Zimmadar)',
    published_by: 'প্রিন্সিপাল (Super Admin)',
    published_at: '2026-11-01T10:00:00Z',
    show_on_website: true,
  },
  {
    id: 'STAR-2026-11-2',
    student_id: 1,
    student_name: 'মুহাম্মাদ আনাস ইসলাম',
    course_title: 'হিফজুল কুরআন পূর্ণাঙ্গ প্রোগ্রাম',
    batch_name: 'হিফজুল কুরআন ১:১',
    month_key: '2026-11',
    rank: 2,
    score: 94,
    grade: 'جيد جداً',
    attendance_score: 24,
    sabaq_score: 33,
    homework_score: 18,
    assessment_score: 19,
    bonus_points: 0,
    teacher_shoutout: 'নিয়মিত নতুন সবক এবং পেছনের পড়া (আমোক্তা) অত্যন্ত সুন্দরভাবে শুনিয়েছে।',
    status: 'published',
    recommended_by: 'মাওলানা ক্বারী আব্দুর রহমান (Teacher)',
    published_by: 'প্রিন্সিপাল (Super Admin)',
    published_at: '2026-11-01T10:00:00Z',
    show_on_website: true,
  },
  {
    id: 'STAR-2026-11-3',
    student_id: 3,
    student_name: 'আব্দুল্লাহ আল মাহমুদ',
    course_title: 'তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত',
    batch_name: 'নাজেরা সান্ধ্যকালীন ব্যাচ',
    month_key: '2026-11',
    rank: 3,
    score: 90,
    grade: 'جيد جداً',
    attendance_score: 23,
    sabaq_score: 32,
    homework_score: 18,
    assessment_score: 17,
    bonus_points: 0,
    teacher_shoutout: 'মাসের প্রতিটি অ্যাসাইনমেন্ট সময়মতো জমা দিয়ে ৩য় স্থান লাভ করেছে।',
    status: 'published',
    recommended_by: 'মাওলানা আবু বকর সিদ্দিক (Zimmadar)',
    published_by: 'প্রিন্সিপাল (Super Admin)',
    published_at: '2026-11-01T10:00:00Z',
    show_on_website: true,
  },
]

export const BOOKSHELF_VAULT_KEY = 'iom_bookshelf_vault_v2'

export interface GuardianAccountRecord {
  id: number
  name: string
  relation: 'পিতা' | 'মাতা' | 'আইনগত অভিভাবক'
  email: string
  phone: string
  address: string
  family_id: number
  family_name: string
  student_ids: number[]
  student_names: string[]
  status: 'active' | 'inactive'
  created_at: string
}

export const GUARDIAN_ACCOUNTS_KEY = 'iom_guardian_accounts_v2'

export const DEFAULT_GUARDIAN_ACCOUNTS: GuardianAccountRecord[] = [
  {
    id: 1,
    name: 'ইঞ্জিনিয়ার মো. রফিকুল ইসলাম',
    relation: 'পিতা',
    email: 'rafiqul.guardian@gmail.com',
    phone: '+880 1711-456789',
    address: 'বাড়ি ১২, রোড ৭, ধানমন্ডি, ঢাকা',
    family_id: 1,
    family_name: 'রফিকুল ইসলাম পরিবার',
    student_ids: [1, 2],
    student_names: ['মুহাম্মাদ আনাস ইসলাম (হিফজ পারা ১২)', 'মারিয়াম বিনতে রফিক (তাজবীদ ব্যাচ ১)'],
    status: 'active',
    created_at: '২০২৩-০১-১০',
  },
  {
    id: 2,
    name: 'ড. আহমেদ জামান',
    relation: 'পিতা',
    email: 'ahmed.zaman@gmail.com',
    phone: '+880 1819-334455',
    address: 'সেক্টর ৪, উত্তরা, ঢাকা',
    family_id: 2,
    family_name: 'আহমেদ জামান পরিবার',
    student_ids: [3],
    student_names: ['আব্দুল্লাহ বিন মাহমুদ (হিফজ পারা ৮)'],
    status: 'active',
    created_at: '২০২৩-০২-১৫',
  },
  {
    id: 3,
    name: 'সৈয়দ মো. কামরুল হাসান',
    relation: 'পিতা',
    email: 'kamrul.hasan@gmail.com',
    phone: '+880 1912-887766',
    address: 'চকবাজার, চট্টগ্রাম',
    family_id: 3,
    family_name: 'কামরুল হাসান পরিবার',
    student_ids: [4],
    student_names: ['জুবায়ের আল হাসান (হিফজ পারা ৬)'],
    status: 'active',
    created_at: '২০২৩-০৩-০১',
  },
  {
    id: 4,
    name: 'বেগম উম্মে কুলসুম',
    relation: 'মাতা',
    email: 'umme.kulsum@gmail.com',
    phone: '+880 1610-998877',
    address: 'উপশহর, সিলেট',
    family_id: 4,
    family_name: 'উম্মে কুলসুম পরিবার',
    student_ids: [6],
    student_names: ['ফাতিমা তুয যাহরা (হিফজ পারা ৯)'],
    status: 'active',
    created_at: '২০২৩-০৩-২০',
  },
  {
    id: 5,
    name: 'মো. আব্দুল বাতেন',
    relation: 'পিতা',
    email: 'abdul.baten@gmail.com',
    phone: '+880 1515-223344',
    address: 'মিরপুর ১০, ঢাকা',
    family_id: 5,
    family_name: 'আব্দুল বাতেন পরিবার',
    student_ids: [5],
    student_names: ['মুহতাসিম বিল্লাহ (হিফজ পারা ৪)'],
    status: 'active',
    created_at: '২০২৩-০৪-০৫',
  },
]

export const USER_ACCOUNTS_KEY = 'iom_user_accounts_v1'
export const USER_PRESENCE_KEY = 'iom_user_presence_v1'

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
      // skip invalid entry
    }
  }
  return JSON.stringify(snapshot, null, 2)
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
 * Pull shared Super Admin stores from backend MySQL (/api/super-admin/stores)
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
          const localRaw = window.localStorage.getItem(key)
          if (localRaw !== null) {
            const parsed = JSON.parse(localRaw)
            await api.put(`/super-admin/stores/${encodeURIComponent(key)}`, { value: parsed }).catch(() => null)
            uploaded += 1
          }
        } catch {
          // ignore local parse issues
        }
      }
    }
    return { downloaded, uploaded }
  } catch {
    return { downloaded: 0, uploaded: 0 }
  }
}

// ────────────────────────────────────────────────────────────
// TEACHERS & ZIMMADARS (STAFF DUTY & ASSIGNMENT MANAGEMENT)
// ────────────────────────────────────────────────────────────
export interface AcademyStaffMember {
  id: number
  name: string
  role: 'zimmadar' | 'teacher' | 'supervisor' | 'examiner'
  designation: string
  department: string
  assignedBatches: string[]
  phone: string
  email: string
  sanad: string
  shift: string
  weeklyHours: number
  status: 'active' | 'on_leave' | 'part_time'
  responsibilities: string[]
  joinedDate: string
}

export const STAFF_MEMBERS_KEY = 'iom_staff_members_v2'

export const DEFAULT_STAFF_MEMBERS: AcademyStaffMember[] = [
  {
    id: 1,
    name: 'মুফতী মাওলানা আবু বকর সিদ্দিক',
    role: 'zimmadar',
    designation: 'হিফজুল কুরআন বিভাগীয় জিম্মাদার ও কোর্স প্রধান',
    department: 'হিফজুল কুরআন বিভাগ',
    assignedBatches: ['Hifz-A (হিফজ বালক শাখা)', 'Hifz-B (হিফজ বালিকা শাখা)'],
    phone: '+880 1711-234567',
    email: 'abubakr@iom-academy.com',
    sanad: 'দাওরায়ে হাদিস (দারুল উলুম দেওবন্দ), হাফেজে কুরআন ও সনদপ্রাপ্ত ক্বারী',
    shift: 'সকাল ৬:০০ - ৮:৩০ ও এশা শিফট',
    weeklyHours: 24,
    status: 'active',
    responsibilities: [
      'হিফজুল কুরআন সার্বিক তদারকি ও পরিকল্পনা',
      'আমোক্তা মূল্যায়ন ও ত্রৈমাসিক পরীক্ষা গ্রহণ',
      'উস্তাদগণের পাঠ পর্যালোচনা ও অভিভাবক কাউন্সেলিং',
    ],
    joinedDate: '২০২৩-০১-১৫',
  },
  {
    id: 2,
    name: 'মুফতী আবরারুল হক',
    role: 'zimmadar',
    designation: 'নাজেরা ও কায়দা বিভাগীয় জিম্মাদার',
    department: 'নাজেরা ও কায়দা বিভাগ',
    assignedBatches: ['নাজেরা ও কায়দা (তাজবীদ ব্যাচ ১)', 'নাজেরা সান্ধ্যকালীন শিফট'],
    phone: '+880 1819-876543',
    email: 'abrarulhaq@iom-academy.com',
    sanad: 'দাওরায়ে হাদিস (বেফাকুল মাদারিস), উচ্চতর তাখাসসুস ফিল ফিকহ ওয়াল ইফতা',
    shift: 'সকাল ৭:০০ - ৯:০০ ও বিকাল ৫:০০ - ৬:৩০',
    weeklyHours: 20,
    status: 'active',
    responsibilities: [
      'নাজেরা ও কায়দা কোর্স পাঠ্যক্রম পরিচালনা',
      'সহীহ তিলাওয়াত পরীক্ষা ও গ্রেডিং',
      'শিক্ষার্থীদের সবক ও হরফের মাখরাজ যাচাই',
    ],
    joinedDate: '২০২৩-০৩-০১',
  },
  {
    id: 3,
    name: 'মাওলানা ক্বারী এনামুল হাসান',
    role: 'supervisor',
    designation: 'তাজবীদুল কুরআন প্রধান মুসাহহিহ ও পরীক্ষক',
    department: 'তাজবীদুল কুরআন',
    assignedBatches: ['তাজবীদ স্পেশাল ব্যাচ', 'তাজবীদ ব্যাচ ১'],
    phone: '+880 1912-345678',
    email: 'enamul@iom-academy.com',
    sanad: 'আন্তর্জাতিক কিরাত সনদ, ক্বিরাআতে আশারাহ (মিশরীয় সানাদ)',
    shift: 'বাদ মাগরিব (৬:০০ - ৮:০০)',
    weeklyHours: 16,
    status: 'active',
    responsibilities: [
      'তারতীল ও মশ্ক লাইভ ক্লাস পরিচালনা',
      'সিফাত ও আহকাম মূল্যায়ন',
      'মাসিক তাজবীদ প্রতিযোগিতা পরীক্ষা গ্রহণ',
    ],
    joinedDate: '২০২৩-০৫-১০',
  },
  {
    id: 4,
    name: 'মাওলানা খালিদ বিন ওয়ালিদ',
    role: 'teacher',
    designation: 'সিনিয়র হিফজ উস্তাদ (বালক শাখা)',
    department: 'হিফজুল কুরআন বিভাগ',
    assignedBatches: ['Hifz-A (হিফজ বালক শাখা)'],
    phone: '+880 1515-678901',
    email: 'khalid@iom-academy.com',
    sanad: 'হাফেজে কুরআন (৩০ পারা মুত্তাসিল সনদ), ফযিলত (বেফাকুল মাদারিস)',
    shift: 'সকাল শিফট (৬:০০ - ৮:৩০)',
    weeklyHours: 22,
    status: 'active',
    responsibilities: [
      'দৈনিক সবক, সাত সবক ও আমোক্তা শ্রবণ',
      'ডিজিটাল লগবুক ও ডায়মন্ড এন্ট্রি সংরক্ষণ',
      'ছাত্রদের ক্লাসে উপস্থিতি ও নোট গ্রহণ',
    ],
    joinedDate: '২০২৩-০৬-০১',
  },
  {
    id: 5,
    name: 'মুফতী মাওলানা আব্দুর রহমান',
    role: 'teacher',
    designation: 'হিফজ উস্তাদ ও কিরাত প্রশিক্ষক',
    department: 'হিফজুল কুরআন বিভাগ',
    assignedBatches: ['Hifz-A (হিফজ বালক শাখা)'],
    phone: '+880 1622-334455',
    email: 'abdurrahman@iom-academy.com',
    sanad: 'দাওরায়ে হাদিস, হিফজুল কুরআন সনদ',
    shift: 'বাদ আসর (৫:০০ - ৬:৪৫)',
    weeklyHours: 18,
    status: 'active',
    responsibilities: [
      'আমোক্তা রিভিশন ও সান্ধ্যকালীন ক্লাস পরিচালনা',
      'দুর্বল ছাত্রদের বিশেষ তদারকি ও কোচিং',
    ],
    joinedDate: '২০২৩-০৮-১৫',
  },
  {
    id: 6,
    name: 'উস্তাযা আয়েশা খাতুন',
    role: 'teacher',
    designation: 'হিফজ ও নাজেরা উস্তাযা (মহিলা শাখা)',
    department: 'হিফজুল কুরআন বিভাগ',
    assignedBatches: ['Hifz-B (হিফজ বালিকা শাখা)'],
    phone: '+880 1733-445566',
    email: 'ayesha@iom-academy.com',
    sanad: 'হাফেজা ও আলিমা (বেফাকুল মাদারিসিল আরাবিয়া)',
    shift: 'সকাল শিফট (৭:০০ - ৯:০০)',
    weeklyHours: 20,
    status: 'active',
    responsibilities: [
      'মহিলা শাখার হিফজ ও নাজেরা ক্লাস পরিচালনা',
      'অভিভাবিকাদের সাথে পরামর্শ ও আমল ট্র্যাকিং',
    ],
    joinedDate: '২০২৩-০৯-০১',
  },
  {
    id: 7,
    name: 'হাফেজ ক্বারী শিহাব উদ্দিন',
    role: 'teacher',
    designation: 'নাজেরা ও কায়দা প্রশিক্ষক',
    department: 'নাজেরা ও কায়দা বিভাগ',
    assignedBatches: ['নাজেরা ও কায়দা (তাজবীদ ব্যাচ ১)'],
    phone: '+880 1844-556677',
    email: 'shihab@iom-academy.com',
    sanad: 'হাফেজে কুরআন ও তাজবীদ সনদ',
    shift: 'সকাল ৮:০০ - ৯:৩০',
    weeklyHours: 18,
    status: 'active',
    responsibilities: [
      'কায়দা ও আমপারা সহীহ শুদ্ধ পাঠদান',
      'দৈনিক হোমওয়ার্ক ও তাজবীদ পয়েন্ট প্রদান',
    ],
    joinedDate: '২০২৩-১০-০১',
  },
]

// ────────────────────────────────────────────────────────────
// CUSTOM CLASSES & LIVE SESSIONS MANAGEMENT
// ────────────────────────────────────────────────────────────
export interface CustomClassSession {
  id: number
  course_title: string
  batch_name: string
  teacher_name: string
  scheduled_start: string
  scheduled_end: string
  delivery_mode: string
  meeting_url: string
  status: 'scheduled' | 'in_progress' | 'ended' | 'cancelled'
  notes?: string
  created_at: string
}

export const CUSTOM_CLASSES_KEY = 'iom_custom_classes_v2'

export const DEFAULT_CUSTOM_CLASSES: CustomClassSession[] = [
  {
    id: 901,
    course_title: 'হিফজুল কুরআন - দৈনিক সবক ও আমোক্তা শুনানি',
    batch_name: 'Hifz-A (হিফজ বালক শাখা)',
    teacher_name: 'মাওলানা খালিদ বিন ওয়ালিদ',
    scheduled_start: new Date(Date.now() - 1800000).toISOString(),
    scheduled_end: new Date(Date.now() + 3600000).toISOString(),
    delivery_mode: 'Google Meet Live',
    meeting_url: 'https://meet.google.com/itq-hifz-live',
    status: 'in_progress',
    notes: 'আজকের ক্লাসে পারা ৮ এর পৃষ্ঠা ৫ নতুন সবক এবং পারা ৩ এর আমোক্তা শুনানি চলছে।',
    created_at: new Date().toISOString(),
  },
  {
    id: 902,
    course_title: 'হিফজুল কুরআন - মহিলা শাখা সকাল শিফট',
    batch_name: 'Hifz-B (হিফজ বালিকা শাখা)',
    teacher_name: 'উস্তাযা আয়েশা খাতুন',
    scheduled_start: new Date(Date.now() + 3600000).toISOString(),
    scheduled_end: new Date(Date.now() + 9000000).toISOString(),
    delivery_mode: 'Zoom Live',
    meeting_url: 'https://zoom.us/j/itq-hifz-female',
    status: 'scheduled',
    notes: 'পারা ১৫ এর রিভিশন এবং আমল ট্র্যাকার পর্যালোচনা।',
    created_at: new Date().toISOString(),
  },
  {
    id: 903,
    course_title: 'নাজেরা ও কায়দা - সহীহ তিলাওয়াত ও মাখরাজ অনুশীলন',
    batch_name: 'নাজেরা ও কায়দা (তাজবীদ ব্যাচ ১)',
    teacher_name: 'হাফেজ ক্বারী শিহাব উদ্দিন',
    scheduled_start: new Date(Date.now() + 7200000).toISOString(),
    scheduled_end: new Date(Date.now() + 12600000).toISOString(),
    delivery_mode: 'Google Meet Live',
    meeting_url: 'https://meet.google.com/itq-najera-tajweed',
    status: 'scheduled',
    notes: 'নুরানি কায়দা পৃষ্ঠা ১২-১৪ এর হরকতের মাখরাজ ড্রিল।',
    created_at: new Date().toISOString(),
  },
  {
    id: 904,
    course_title: 'তাজবীদুল কুরআন - বিশেষ মশ্ক ও তারতীল সেশন',
    batch_name: 'তাজবীদ স্পেশাল ব্যাচ',
    teacher_name: 'মাওলানা ক্বারী এনামুল হাসান',
    scheduled_start: new Date(Date.now() - 86400000).toISOString(),
    scheduled_end: new Date(Date.now() - 81000000).toISOString(),
    delivery_mode: 'Google Meet Live',
    meeting_url: 'https://meet.google.com/itq-tajweed-special',
    status: 'ended',
    notes: 'সূরা আল-ফাতহ এর শেষ রুকু তারতীল সহকারে মশ্ক সম্পন্ন হয়েছে।',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
]

// ── DIGITAL BOOKSHELF & BATCH-WISE VAULT ───────────────────────────────────
export interface BookshelfItem {
  id: string
  title: string
  arabic_title?: string
  batch_id: string // 'all', '1', '2', '3', '4'
  batch_label: string
  category: 'quran' | 'tajweed' | 'kitab' | 'dua_hadith' | 'worksheet' | 'syllabus'
  author?: string
  file_url: string
  file_type: 'pdf' | 'doc' | 'audio' | 'link'
  file_size?: string
  cover_theme: 'emerald' | 'amber' | 'blue' | 'crimson' | 'indigo'
  description?: string
  uploaded_by: string
  created_at: string
}

export const DEFAULT_BOOKSHELF_ITEMS: BookshelfItem[] = [
  {
    id: 'book-01',
    title: 'পবিত্র কুরআনুল কারীম (১৫ লাইন হাফেজী কুরআন শরীফ)',
    arabic_title: 'المصحف الشريف - رواية حفص',
    batch_id: '3',
    batch_label: '১:১ হিফজ সান্ধ্যকালীন বিশেষ স্লট',
    category: 'quran',
    author: 'দারুল কুরআন ওয়াত-তাজবীদ প্রেস',
    file_url: 'https://archive.org/details/15-lines-hafezi-quran-pdf',
    file_type: 'pdf',
    file_size: '52.4 MB',
    cover_theme: 'emerald',
    description: 'হিফজুল কুরআনের শিক্ষার্থীদের জন্য ৩০ পারা স্পষ্ট ১৫ লাইন হাফেজী নুসহা ও মারকাযী তাজবীদ চিহ্নায়ন।',
    uploaded_by: 'মাওলানা আবু বকর সিদ্দিক (হিফজ জিম্মাদার)',
    created_at: '2026-10-15T09:00:00Z',
  },
  {
    id: 'book-02',
    title: 'সহজ তাইসীরুত তাজবীদ (কুরআন শুদ্ধ তিলাওয়াত নিয়মাবলী)',
    arabic_title: 'تيسير التجويد لمبتدئي القرآن',
    batch_id: '1',
    batch_label: 'তাজবীদ ব্যাচ ১ (সকাল ৭:০০ - ৮:০০)',
    category: 'tajweed',
    author: 'মাওলানা ক্বারী এনামুল হাসান',
    file_url: 'https://archive.org/details/tajweed-rules-bangla-booklet',
    file_type: 'pdf',
    file_size: '8.2 MB',
    cover_theme: 'blue',
    description: 'মাখরাজ, সিফাত, নূন সাকিন, মীম সাকিন ও মাদ্দের পূর্ণাঙ্গ সচিত্র নিয়মাবলী ও রঙের সাহায্যে নকশা।',
    uploaded_by: 'মাওলানা ক্বারী এনামুল হাসান (তাজবীদ জিম্মাদার)',
    created_at: '2026-10-18T10:30:00Z',
  },
  {
    id: 'book-03',
    title: 'সচিত্র নূরানী কায়দা (মাখরাজ ও উচ্চারণ ড্রিল সহ)',
    arabic_title: 'القاعدة النورانية المصورة الملونة',
    batch_id: '2',
    batch_label: 'নাজেরা সান্ধ্যকালীন ব্যাচ (বিকাল ৫:০০ - ৬:০০)',
    category: 'kitab',
    author: 'মুফতী আবরারুল হক',
    file_url: 'https://archive.org/details/noorani-qaida-color-coded',
    file_type: 'pdf',
    file_size: '14.6 MB',
    cover_theme: 'amber',
    description: 'নতুন ও শিশু শিক্ষার্থীদের জন্য হরফ চেনা, হরকত, তানভীন ও জযমের প্রাথমিক অনুশীলন পাঠ্যপুস্তক।',
    uploaded_by: 'মুফতী আবরারুল হক (নাজেরা জিম্মাদার)',
    created_at: '2026-10-20T11:00:00Z',
  },
  {
    id: 'book-04',
    title: 'হিফজুল কুরআন দৈনিক সবক ও দাওর লগবুক শিট',
    arabic_title: 'سجل متابعة الحفظ والسبق والدور اليومي',
    batch_id: '3',
    batch_label: '১:১ হিফজ সান্ধ্যকালীন বিশেষ স্লট',
    category: 'worksheet',
    author: 'একাডেমিক পরীক্ষা ও কারিকুলাম সেল',
    file_url: 'https://archive.org/details/hifz-daily-ledger-tracker-sheet',
    file_type: 'pdf',
    file_size: '3.1 MB',
    cover_theme: 'emerald',
    description: 'দৈনিক নতুন সবক, সাত সবক এবং পেছনের আমুখতা রিভিশন ট্র্যাক করার অফিসিয়াল প্রিন্টেবল শিট।',
    uploaded_by: 'মাওলানা আবু বকর সিদ্দিক (হিফজ জিম্মাদার)',
    created_at: '2026-10-22T14:15:00Z',
  },
  {
    id: 'book-05',
    title: 'মাসনূন দুআ ও নিত্যদিনের জরুরি মাসআলা সংকলন',
    arabic_title: 'حصن المسلم والأدعية النبوية المأثورة',
    batch_id: 'all',
    batch_label: 'সাধারণ একাডেমি কুতুবখানা (সকল শিক্ষার্থী ও শিক্ষক)',
    category: 'dua_hadith',
    author: 'দারুল ইফতা ও গবেষণা বিভাগ',
    file_url: 'https://archive.org/details/masnoon-dua-and-namaz-rules',
    file_type: 'pdf',
    file_size: '5.9 MB',
    cover_theme: 'crimson',
    description: 'সকাল-সন্ধ্যার জিকির, সালাতের রুকন, অজুর তরিকা ও নিত্যপ্রয়োজনীয় সহীহ মাসনূন দুআসমূহ।',
    uploaded_by: 'মুফতী আব্দুর রহমান',
    created_at: '2026-10-25T16:00:00Z',
  },
  {
    id: 'book-06',
    title: 'আমপারা (৩০তম পারা শানেনুজুল ও বাংলা অর্থ সহ)',
    arabic_title: 'جزء عم مع التفسير والترجمة البنغالية',
    batch_id: '2',
    batch_label: 'নাজেরা সান্ধ্যকালীন ব্যাচ (বিকাল ৫:০০ - ৬:০০)',
    category: 'quran',
    author: 'আইওএম কুরআন অনুবাদ পরিষদ',
    file_url: 'https://archive.org/details/ampara-para-30-bangla-tafsir',
    file_type: 'pdf',
    file_size: '18.2 MB',
    cover_theme: 'indigo',
    description: 'সূরা আন-নাবা থেকে সূরা আন-নাস পর্যন্ত প্রতি আয়াতের শব্দার্থ, সংক্ষিপ্ত তাফসীর ও ফযিলত।',
    uploaded_by: 'মুফতী আবরারুল হক (নাজেরা জিম্মাদার)',
    created_at: '2026-10-28T09:45:00Z',
  },
  {
    id: 'book-07',
    title: '১:১ তাজবীদ ড্রিল ও অডিও রেকর্ডিং মাস্টার ফাইল',
    arabic_title: 'تسجيلات التجويد الصوتية للتدريب العملي',
    batch_id: '4',
    batch_label: '১:১ তাজবীদ সকালের প্রাইভেট স্লট (সকাল ৬:০০ - ৭:০০)',
    category: 'tajweed',
    author: 'উস্তাযা আয়েশা খাতুন',
    file_url: 'https://archive.org/details/tajweed-audio-drills-master',
    file_type: 'link',
    file_size: 'অডিও ড্রিল লিংক',
    cover_theme: 'blue',
    description: 'ব্যক্তিগত পাঠের জন্য মাখরাজ ও তারতীলের স্পষ্ট অডিও অনুশীলন ও শিক্ষক রিভিউ গাইড।',
    uploaded_by: 'উস্তাযা আয়েশা খাতুন (মহিলা শাখা কো-অর্ডিনেটর)',
    created_at: '2026-11-01T12:00:00Z',
  },
  {
    id: 'book-08',
    title: 'আইওএম ইতকান একাডেমি বার্ষিক সিলেবাস ও ছুটির ক্যালেন্ডার',
    arabic_title: 'المنهج الأكاديمي السنوي وتقويم العطلات الرسمية',
    batch_id: 'all',
    batch_label: 'সাধারণ একাডেমি কুতুবখানা (সকল শিক্ষার্থী ও শিক্ষক)',
    category: 'syllabus',
    author: 'কেন্দ্রীয় প্রশাসন সেল',
    file_url: 'https://archive.org/details/iom-itqaan-academic-calendar-2026',
    file_type: 'pdf',
    file_size: '2.8 MB',
    cover_theme: 'amber',
    description: '২০২৬-২৭ শিক্ষাবর্ষের সকল ব্যাচের টার্ম পরীক্ষা, কুইজ ও সরকারি/ইসলামিক ছুটির বিবরণ।',
    uploaded_by: 'প্রকৌশলী রফিকুল ইসলাম (সুপার অ্যাডমিন)',
    created_at: '2026-11-02T15:30:00Z',
  },
]

// ── 15. USER DIRECTORY, ACCOUNT STATUS & LIVE PRESENCE ───────────────────────
export interface UserProfileRecord {
  id: string
  backendUserId?: number
  name: string
  email: string
  phone: string
  role: 'central_admin' | 'branch_admin' | 'zimmadar' | 'teacher' | 'guardian' | 'student'
  roleBn: string
  designation: string
  department: string
  branchName: string
  avatarUrl?: string
  avatarColor?: string
  status: 'active' | 'inactive' | 'fee_hold' | 'suspended'
  feeDueAmount: number
  feeDueMonths: string[]
  feeHoldReason?: string
  feeHoldDate?: string
  feeHoldBy?: string
  linkedStudentNames?: string[]
  linkedGuardianName?: string
  linkedBatch?: string
  isOnline: boolean
  lastActiveAt: string // ISO timestamp
  lastActiveRelative: string
  lastActivePage?: string
  deviceInfo?: string
  ipAddress?: string
  isStarred?: boolean
  notes?: string
  createdAt: string
}

export const DEFAULT_USER_PROFILES: UserProfileRecord[] = [
  // ── 1. Central & Branch Admins ──────────────────────────────────────────
  {
    id: 'usr-admin-01',
    backendUserId: 1,
    name: 'প্রকৌশলী মো. রফিকুল ইসলাম',
    email: 'admin@iom-itqaan.edu.bd',
    phone: '+880 1711-234567',
    role: 'central_admin',
    roleBn: 'সুপার অ্যাডমিন',
    designation: 'প্রধান পরিচালক ও আইটি চিফ',
    department: 'কেন্দ্রীয় প্রশাসন ও গভর্ন্যান্স',
    branchName: 'সেন্ট্রাল মারকায (ঢাকা)',
    avatarColor: '#1e3a8a',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    isOnline: true,
    lastActiveAt: new Date().toISOString(),
    lastActiveRelative: 'অনলাইন এখন',
    lastActivePage: 'কমান্ড ড্যাশবোর্ড',
    deviceInfo: 'Chrome / Windows 11',
    ipAddress: '103.145.22.4',
    isStarred: true,
    notes: 'প্রধান অ্যাকাডেমিক ও আইটি নিয়ন্ত্রক',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'usr-admin-02',
    backendUserId: 2,
    name: 'মাওলানা মাহমুদুল হাসান',
    email: 'mahmudul@iom-itqaan.edu.bd',
    phone: '+880 1819-345678',
    role: 'branch_admin',
    roleBn: 'শাখা পরিচালক',
    designation: 'প্রিন্সিপাল (ঢাকা মারকায শাখা)',
    department: 'শাখা পরিচালনা সেল',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#0f766e',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    lastActiveRelative: '৪ মিনিট আগে',
    lastActivePage: 'ব্যাচ মনিটরিং ডেস্ক',
    deviceInfo: 'Edge / macOS',
    ipAddress: '103.145.22.18',
    createdAt: '2026-01-15T09:30:00Z',
  },

  // ── 2. Zimmadars (জিম্মাদারবৃন্দ) ────────────────────────────────────────
  {
    id: 'usr-zim-01',
    backendUserId: 3,
    name: 'মাওলানা আবু বকর সিদ্দিক',
    email: 'abubakar.hifz@iom-itqaan.edu.bd',
    phone: '+880 1712-998877',
    role: 'zimmadar',
    roleBn: 'বিভাগীয় জিম্মাদার',
    designation: 'হিফজুল কুরআন বিভাগীয় প্রধান জিম্মাদার',
    department: 'হিফজুল কুরআন বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#15803d',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    linkedBatch: '১:১ হিফজ সান্ধ্যকালীন স্লট',
    isOnline: true,
    lastActiveAt: new Date().toISOString(),
    lastActiveRelative: 'অনলাইন এখন',
    lastActivePage: 'জিম্মাদার আমলনামা ও সবক অডিট',
    deviceInfo: 'Chrome / Windows 11',
    ipAddress: '27.147.201.55',
    isStarred: true,
    notes: 'হিফজ বিভাগের সকল ছাত্রের সবক ও বকেয়া ফি স্থগিতকরণের দায়িত্বপ্রাপ্ত',
    createdAt: '2026-02-01T11:00:00Z',
  },
  {
    id: 'usr-zim-02',
    backendUserId: 4,
    name: 'মাওলানা ক্বারী এনামুল হাসান',
    email: 'enamul.tajweed@iom-itqaan.edu.bd',
    phone: '+880 1914-556677',
    role: 'zimmadar',
    roleBn: 'বিভাগীয় জিম্মাদার',
    designation: 'তাজবীদ ও কিরাত বিভাগীয় জিম্মাদার',
    department: 'তাজবীদ ও কিরাত বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#0369a1',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    linkedBatch: 'তাজবীদ ব্যাচ ১',
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    lastActiveRelative: '২৫ মিনিট আগে',
    lastActivePage: 'তাজবীদ ড্রিল অডিট',
    deviceInfo: 'Firefox / Ubuntu',
    ipAddress: '118.179.88.12',
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'usr-zim-03',
    backendUserId: 5,
    name: 'মুফতী আবরারুল হক',
    email: 'abrar.noorani@iom-itqaan.edu.bd',
    phone: '+880 1811-223344',
    role: 'zimmadar',
    roleBn: 'বিভাগীয় জিম্মাদার',
    designation: 'নাজেরা ও নুরানী আমল বিভাগীয় জিম্মাদার',
    department: 'নাজেরা ও নুরানী বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#c2410c',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    linkedBatch: 'নাজেরা সান্ধ্যকালীন ব্যাচ',
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    lastActiveRelative: '২ মিনিট আগে',
    lastActivePage: 'উপস্থিতি ও অনুপস্থিত ফলোআপ',
    deviceInfo: 'Chrome / Android',
    ipAddress: '103.112.54.90',
    createdAt: '2026-02-10T12:00:00Z',
  },
  {
    id: 'usr-zim-04',
    backendUserId: 6,
    name: 'উস্তাযা ফাতেমা তুয জোহরা',
    email: 'fatema.female@iom-itqaan.edu.bd',
    phone: '+880 1610-334455',
    role: 'zimmadar',
    roleBn: 'মহিলা শাখা জিম্মাদার',
    designation: 'মহিলা ও শিশু হিফজ বিভাগীয় সুপারভাইজার',
    department: 'মহিলা ও শিশু বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#be185d',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    lastActiveRelative: '৩ ঘণ্টা আগে',
    lastActivePage: '১:১ মহিলা তাজবীদ শিডিউল',
    deviceInfo: 'Safari / iPad OS',
    ipAddress: '103.88.220.14',
    createdAt: '2026-02-15T08:30:00Z',
  },

  // ── 3. Teachers (উস্তাদবৃন্দ) ───────────────────────────────────────────
  {
    id: 'usr-tch-01',
    backendUserId: 7,
    name: 'হাফেজ কারী আব্দুল্লাহ আল-মামুন',
    email: 'mamun.hifz@iom-itqaan.edu.bd',
    phone: '+880 1715-667788',
    role: 'teacher',
    roleBn: 'সিনিয়র উস্তাদ',
    designation: 'হিফজুল কুরআন মোয়াল্লিম (১০ পারা সানাদপ্রাপ্ত)',
    department: 'হিফজুল কুরআন বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#047857',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    linkedBatch: 'হিফজ সান্ধ্যকালীন হালক্বা ১',
    isOnline: true,
    lastActiveAt: new Date().toISOString(),
    lastActiveRelative: 'অনলাইন এখন',
    lastActivePage: 'হিফজ লাইভ ক্লাস রুম (Zoom)',
    deviceInfo: 'Chrome / Windows 11',
    ipAddress: '119.30.38.102',
    isStarred: true,
    createdAt: '2026-03-01T09:00:00Z',
  },
  {
    id: 'usr-tch-02',
    backendUserId: 8,
    name: 'মাওলানা নুরুল ইসলাম',
    email: 'nurul.islam@iom-itqaan.edu.bd',
    phone: '+880 1812-778899',
    role: 'teacher',
    roleBn: 'উস্তাদ',
    designation: 'তাজবীদ ও তারতীল শিক্ষক',
    department: 'তাজবীদ ও কিরাত বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#1d4ed8',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    linkedBatch: 'তাজবীদ ব্যাচ ১',
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    lastActiveRelative: '৫৫ মিনিট আগে',
    lastActivePage: 'ক্লাস রিপোর্ট সাবমিশন',
    deviceInfo: 'Chrome / Windows 10',
    ipAddress: '180.211.214.33',
    createdAt: '2026-03-05T10:15:00Z',
  },
  {
    id: 'usr-tch-03',
    backendUserId: 9,
    name: 'উস্তাযা আয়েশা খাতুন',
    email: 'ayesha.tajweed@iom-itqaan.edu.bd',
    phone: '+880 1913-889900',
    role: 'teacher',
    roleBn: 'উস্তাযা',
    designation: 'মহিলা শাখা সিনিয়র তাজবীদ শিক্ষিকা',
    department: 'মহিলা ও শিশু বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#9333ea',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    linkedBatch: '১:১ তাজবীদ সকালের প্রাইভেট স্লট',
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    lastActiveRelative: '৬ ঘণ্টা আগে',
    lastActivePage: '১:১ প্রাইভেট শিডিউল',
    deviceInfo: 'Chrome / Android',
    ipAddress: '103.114.156.44',
    createdAt: '2026-03-10T14:00:00Z',
  },

  // ── 4. Guardians (অভিভাবকবৃন্দ) ─────────────────────────────────────────
  {
    id: 'usr-grd-01',
    backendUserId: 10,
    name: 'ড. মো. তৌহিদুল ইসলাম',
    email: 'dr.tauhid@gmail.com',
    phone: '+880 1711-445566',
    role: 'guardian',
    roleBn: 'অভিভাবক (পিতা)',
    designation: 'অভিভাবক · আব্দুল্লাহ ও মারিয়াম',
    department: 'অভিভাবক ফোরাম',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#0284c7',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    linkedStudentNames: ['আব্দুল্লাহ ইবনে তৌহিদ', 'মারিয়াম বিনতে তৌহিদ'],
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    lastActiveRelative: '১২ মিনিট আগে',
    lastActivePage: 'অভিভাবক পোর্টাল (সবক ড্যাশবোর্ড)',
    deviceInfo: 'Safari / iPhone 15',
    ipAddress: '103.205.71.12',
    isStarred: true,
    notes: 'নিয়মিত বেতন পরিশোধকারী সম্মানিত অভিভাবক',
    createdAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'usr-grd-02',
    backendUserId: 11,
    name: 'ইঞ্জিনিয়ার সারওয়ার জাহান',
    email: 'sarwar.jahan@hotmail.com',
    phone: '+880 1819-887766',
    role: 'guardian',
    roleBn: 'অভিভাবক (পিতা)',
    designation: 'অভিভাবক · খুবাইব বিন সারওয়ার',
    department: 'অভিভাবক ফোরাম',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#ea580c',
    status: 'fee_hold',
    feeDueAmount: 2500,
    feeDueMonths: ['নভেম্বর ২০২৬'],
    feeHoldReason: 'নভেম্বর মাসের মাসিক টিউশন ফি অপরিশোধিত থাকায় আইডি স্থগিত',
    feeHoldDate: '2026-11-10',
    feeHoldBy: 'মাওলানা আবু বকর সিদ্দিক (হিফজ জিম্মাদার)',
    linkedStudentNames: ['খুবাইব বিন সারওয়ার'],
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    lastActiveRelative: 'গতকাল বিকাল ৪:২০',
    lastActivePage: 'ইনভয়েস ও ফি পরিশোধ পেইজ',
    deviceInfo: 'Chrome / Windows 11',
    ipAddress: '182.160.119.82',
    notes: 'বকেয়া ফি পরিশোধের পর অবিলম্বে আইডি সচল করে দেওয়ার আবেদন রয়েছে',
    createdAt: '2026-04-05T11:30:00Z',
  },
  {
    id: 'usr-grd-03',
    backendUserId: 12,
    name: 'ব্যারিস্টার তাসনিম ফেরদৌস',
    email: 'tasneem.law@yahoo.com',
    phone: '+880 1612-990011',
    role: 'guardian',
    roleBn: 'অভিভাবক (মাতা)',
    designation: 'অভিভাবক · আনাস ইবনে তাসনিম',
    department: 'অভিভাবক ফোরাম',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#7c3aed',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    linkedStudentNames: ['আনাস ইবনে তাসনিম'],
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    lastActiveRelative: '৫ মিনিট আগে',
    lastActivePage: 'আমলনামা ও ডায়মন্ড স্কোরকার্ড',
    deviceInfo: 'Chrome / MacBook Pro',
    ipAddress: '103.48.16.29',
    createdAt: '2026-04-12T15:20:00Z',
  },
  {
    id: 'usr-grd-04',
    backendUserId: 13,
    name: 'মো. মনিরুজ্জামান',
    email: 'moniruzzaman@gmail.com',
    phone: '+880 1714-332211',
    role: 'guardian',
    roleBn: 'অভিভাবক (পিতা)',
    designation: 'অভিভাবক · জুনায়েদ জামান',
    department: 'অভিভাবক ফোরাম',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#b91c1c',
    status: 'fee_hold',
    feeDueAmount: 1500,
    feeDueMonths: ['নভেম্বর ২০২৬'],
    feeHoldReason: '১:১ বিশেষ স্লটের ফি বকেয়া থাকায় আইডি সাময়িক স্থগিত',
    feeHoldDate: '2026-11-12',
    feeHoldBy: 'প্রকৌশলী মো. রফিকুল ইসলাম (সুপার অ্যাডমিন)',
    linkedStudentNames: ['জুনায়েদ জামান'],
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    lastActiveRelative: '২ দিন আগে',
    lastActivePage: 'লগইন স্ক্রিন',
    deviceInfo: 'Android / Samsung Galaxy',
    ipAddress: '103.134.88.5',
    createdAt: '2026-04-18T16:00:00Z',
  },

  // ── 5. Students / Wards (শিক্ষার্থীবৃন্দ) ─────────────────────────────────
  {
    id: 'usr-stu-01',
    name: 'আব্দুল্লাহ ইবনে তৌহিদ',
    email: 'abdullah.tauhid@student.iom.bd',
    phone: '+880 1711-445566 (পিতা)',
    role: 'student',
    roleBn: 'শিক্ষার্থী',
    designation: 'হিফজুল কুরআন (১৯তম পারা)',
    department: 'হিফজুল কুরআন বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#059669',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    linkedGuardianName: 'ড. মো. তৌহিদুল ইসলাম',
    linkedBatch: 'হিফজ সান্ধ্যকালীন হালক্বা ১',
    isOnline: true,
    lastActiveAt: new Date().toISOString(),
    lastActiveRelative: 'অনলাইন এখন',
    lastActivePage: 'হিফজুল কুরআন লাইভ ক্লাস',
    deviceInfo: 'Chrome / Windows',
    ipAddress: '103.205.71.12',
    isStarred: true,
    notes: 'মুমতাজ ক্যাটাগরির ছাত্র, ৮৫টি ডায়মন্ড অর্জন করেছে',
    createdAt: '2026-05-01T08:00:00Z',
  },
  {
    id: 'usr-stu-02',
    name: 'মারিয়াম বিনতে তৌহিদ',
    email: 'mariam.tauhid@student.iom.bd',
    phone: '+880 1711-445566 (পিতা)',
    role: 'student',
    roleBn: 'শিক্ষার্থী',
    designation: 'তাজবীদ ও কিরাত ১ম বর্ষ',
    department: 'তাজবীদ ও কিরাত বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#d97706',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    linkedGuardianName: 'ড. মো. তৌহিদুল ইসলাম',
    linkedBatch: 'তাজবীদ ব্যাচ ১',
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    lastActiveRelative: '৪০ মিনিট আগে',
    lastActivePage: 'তাজবীদ অডিও কুতুবখানা',
    deviceInfo: 'Safari / iPad',
    ipAddress: '103.205.71.12',
    createdAt: '2026-05-01T08:30:00Z',
  },
  {
    id: 'usr-stu-03',
    name: 'খুবাইব বিন সারওয়ার',
    email: 'khubaib.sarwar@student.iom.bd',
    phone: '+880 1819-887766 (পিতা)',
    role: 'student',
    roleBn: 'শিক্ষার্থী',
    designation: '১:১ হিফজ সান্ধ্যকালীন শিক্ষার্থী',
    department: 'হিফজুল কুরআন বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#dc2626',
    status: 'fee_hold',
    feeDueAmount: 2500,
    feeDueMonths: ['নভেম্বর ২০২৬'],
    feeHoldReason: 'নভেম্বর মাসের মাসিক টিউশন ফি অপরিশোধিত থাকায় আইডি স্থগিত',
    feeHoldDate: '2026-11-10',
    feeHoldBy: 'মাওলানা আবু বকর সিদ্দিক (হিফজ জিম্মাদার)',
    linkedGuardianName: 'ইঞ্জিনিয়ার সারওয়ার জাহান',
    linkedBatch: '১:১ হিফজ সান্ধ্যকালীন স্লট',
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    lastActiveRelative: 'গতকাল বিকাল ৪:২০',
    lastActivePage: 'পোর্টাল অ্যাক্সেস স্থগিত নোটিশ',
    deviceInfo: 'Chrome / Windows',
    ipAddress: '182.160.119.82',
    notes: 'ফি পরিশোধের পর জিম্মাদার আইডি সক্রিয় করবেন',
    createdAt: '2026-05-10T10:00:00Z',
  },
  {
    id: 'usr-stu-04',
    name: 'জুনায়েদ জামান',
    email: 'junaid.jaman@student.iom.bd',
    phone: '+880 1714-332211 (পিতা)',
    role: 'student',
    roleBn: 'শিক্ষার্থী',
    designation: '১:১ তাজবীদ ড্রিল শিক্ষার্থী',
    department: 'তাজবীদ ও কিরাত বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#991b1b',
    status: 'fee_hold',
    feeDueAmount: 1500,
    feeDueMonths: ['নভেম্বর ২০২৬'],
    feeHoldReason: 'মাসিক ফি অপরিশোধিত থাকায় আইডি সাময়িক স্থগিত',
    feeHoldDate: '2026-11-12',
    feeHoldBy: 'প্রকৌশলী মো. রফিকুল ইসলাম (সুপার অ্যাডমিন)',
    linkedGuardianName: 'মো. মনিরুজ্জামান',
    linkedBatch: '১:১ তাজবীদ সকালের প্রাইভেট স্লট',
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    lastActiveRelative: '২ দিন আগে',
    lastActivePage: 'লগইন উইন্ডো',
    deviceInfo: 'Android App',
    ipAddress: '103.134.88.5',
    createdAt: '2026-05-15T11:00:00Z',
  },
  {
    id: 'usr-stu-05',
    name: 'আনাস ইবনে তাসনিম',
    email: 'anas.tasneem@student.iom.bd',
    phone: '+880 1612-990011 (মাতা)',
    role: 'student',
    roleBn: 'শিক্ষার্থী',
    designation: 'হিফজুল কুরআন (৬ষ্ঠ পারা)',
    department: 'হিফজুল কুরআন বিভাগ',
    branchName: 'ঢাকা মারকায শাখা',
    avatarColor: '#4f46e5',
    status: 'active',
    feeDueAmount: 0,
    feeDueMonths: [],
    linkedGuardianName: 'ব্যারিস্টার তাসনিম ফেরদৌস',
    linkedBatch: 'হিফজ সান্ধ্যকালীন হালক্বা ১',
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    lastActiveRelative: '৮ মিনিট আগে',
    lastActivePage: 'কুরআন মশ্ক অডিও রুম',
    deviceInfo: 'Edge / Windows 11',
    ipAddress: '103.48.16.29',
    createdAt: '2026-05-20T12:00:00Z',
  },
]



