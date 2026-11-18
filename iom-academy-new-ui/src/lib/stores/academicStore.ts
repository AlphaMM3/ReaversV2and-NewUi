// ── Teacher Leave Requests (with Proxy Support) ───────────────────────────
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

// ── Module 4: Syllabus / Hifz Milestones, Certificates & Exit Reasons ─────
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

// ── Module 6: Automation Rules & Academy Branding ─────────────────────────
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
    phone: '+880 1819-345678',
    email: 'abrar@iom-academy.com',
    sanad: 'ফজিলত ও তাজবীদ সনদ (মাদানি কায়েদা মাস্টার ট্রেইনার)',
    shift: 'বিকাল ৫:০০ - রাত ৯:০০',
    weeklyHours: 20,
    status: 'active',
    responsibilities: [
      'নুরানি কায়দা ও আমপারা পাঠ্যক্রম সমন্বয়',
      'মাখরাজ ও সিফাত ড্রিল মনিটরিং',
      'প্রাথমিক স্তরের সাপ্তাহিক মূল্যায়ন',
    ],
    joinedDate: '২০২৩-০৩-০১',
  },
  {
    id: 3,
    name: 'মুফতী মাওলানা আব্দুর রহমান',
    role: 'teacher',
    designation: 'সিনিয়র হিফজ উস্তাদ',
    department: 'হিফজুল কুরআন বিভাগ',
    assignedBatches: ['Hifz-A (হিফজ বালক শাখা)'],
    phone: '+880 1912-334455',
    email: 'rahman@iom-academy.com',
    sanad: 'হাফেজে কুরআন ও কারী (আন্তর্জাতিক কিরাত প্রতিযোগিতা রানারআপ)',
    shift: 'সকাল ৬:০০ - ৮:৩০',
    weeklyHours: 15,
    status: 'active',
    responsibilities: [
      'দৈনিক নতুন সবক শুনানি',
      'সাত সবক পুনরাবৃত্তি নিশ্চিতকরণ',
      'আমল ট্র্যাকার হালনাগাদ করা',
    ],
    joinedDate: '২০২৩-০২-১০',
  },
  {
    id: 4,
    name: 'মাওলানা খালিদ বিন ওয়ালিদ',
    role: 'teacher',
    designation: 'হিফজ ও দাওর উস্তাদ',
    department: 'হিফজুল কুরআন বিভাগ',
    assignedBatches: ['Hifz-A (হিফজ বালক শাখা)', '১:১ বিশেষ হিফজ স্লট'],
    phone: '+880 1715-998877',
    email: 'khalid@iom-academy.com',
    sanad: 'হাফেজে কুরআন ও দাওরা হাদিস',
    shift: 'বিকাল ৫:০০ - ৭:০০ ও এশা শিফট',
    weeklyHours: 18,
    status: 'active',
    responsibilities: [
      'পেছনের আমোক্তা শুনানি ও দাওর পরীক্ষণ',
      '১:১ হিফজ শিক্ষার্থীর বিশেষ পরিচর্যা',
    ],
    joinedDate: '২০২৩-০৪-১৫',
  },
  {
    id: 5,
    name: 'উস্তাযা আয়েশা খাতুন',
    role: 'teacher',
    designation: 'মহিলা ও বালিকা শাখা শিক্ষিকা',
    department: 'মহিলা ও শিশু বিভাগ',
    assignedBatches: ['Hifz-B (হিফজ বালিকা শাখা)'],
    phone: '+880 1610-887766',
    email: 'ayesha@iom-academy.com',
    sanad: 'হাফেজা ও মুআলিমা সনদ',
    shift: 'সকাল ৭:০০ - ৯:০০ ও বিকাল ৪:০০ - ৬:০০',
    weeklyHours: 20,
    status: 'active',
    responsibilities: [
      'বালিকা হিফজ শাখার সবক ও আমোক্তা শুনানি',
      'তাজবীদ ও মাসনুন দোয়া শিক্ষা',
    ],
    joinedDate: '২০২৩-০৬-০১',
  },
  {
    id: 6,
    name: 'হাফেজ ক্বারী শিহাব উদ্দিন',
    role: 'teacher',
    designation: 'নাজেরা ও তাজবীদ শিক্ষক',
    department: 'নাজেরা ও কায়দা বিভাগ',
    assignedBatches: ['নাজেরা ও কায়দা (তাজবীদ ব্যাচ ১)'],
    phone: '+880 1815-443322',
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
