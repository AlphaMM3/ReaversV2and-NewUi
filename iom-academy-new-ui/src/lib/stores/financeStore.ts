// ── Course Fee & Discount Plans ───────────────────────────────────────────
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

// ── Academy Operating Expenses (P&L) ──────────────────────────────────────
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

// ── Teacher Payroll Adjustments & Settlements ─────────────────────────────
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

// ── Fee Waiver & Refund Approvals ───────────────────────────────
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

// ── Guardian Accounts Ledger ─────────────────────────────────────────────
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
