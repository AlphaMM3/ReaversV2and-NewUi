// Daily Amol, Protection Habits & Friday Sunnah Tracker Store

export type SalahStatus = 'jamat' | 'alone' | 'missed'

export interface DailyAmolRecord {
  id: string
  student_id: number
  student_name: string
  date: string // YYYY-MM-DD
  is_friday?: boolean

  // ── ১. পাঁচ ওয়াক্ত সালাত (5 Waqt Salah) ────────────────────
  fajr: SalahStatus
  dhuhr: SalahStatus
  asr: SalahStatus
  maghrib: SalahStatus
  isha: SalahStatus

  // ── ২. দৈনিক হিফাজতের আমল ও সুন্নাহ ────────────────────────
  protection_3qul_ayatul_kursi: boolean // সকাল-সন্ধ্যায় ৩ কুল ও আয়াতুল কুরসি
  sleep_wudu_dua_brush: boolean         // মেসওয়াক/ব্রাশ, ওযু ও ঘুমানোর দোয়া
  parents_respect_help: boolean         // মা-বাবাকে সালাম ও সাহায্য

  // ── ৩. নাজেরা ও সাধারণ ছাত্রদের ৩০ মিনিট কুরআন পড়া ─────────
  is_hifz_student: boolean              // হিফজের ক্ষেত্রে এটি প্রযোজ্য নয়
  non_hifz_30m_quran: boolean           // ৩০ মিনিট কুরআন তিলাওয়াত সম্পন্ন হয়েছে কিনা
  quran_minutes?: number                // মোট কত মিনিট

  // ── ৪. শুক্রবারের বিশেষ সুন্নাহ মিশন ───────────────────────
  friday_ghusl_perfume?: boolean        // জুমার গোসল, সুগন্ধি ও পরিষ্কার কাপড়
  friday_surah_kahf?: boolean           // সূরা কাহাফ তিলাওয়াত বা শ্রবণ
  friday_durood_100?: boolean           // অন্তত ১০০ বার দরুদ শরীফ পাঠ
  friday_asr_dua?: boolean              // আসরের পর বিশেষ মোনাজাত

  // ── পয়েন্ট ও অভিভাবকের স্বাক্ষর ────────────────────────────
  total_diamonds: number
  guardian_notes?: string
  guardian_confirmed: boolean
  updated_at: string
}

export const DAILY_AMOL_RECORDS_KEY = 'iom_daily_amol_records_v1'

export const DEFAULT_AMOL_RECORDS: DailyAmolRecord[] = [
  {
    id: 'amol-rec-001',
    student_id: 1,
    student_name: 'আব্দুল্লাহ আল মাহমুদ',
    date: '2026-11-12',
    is_friday: false,
    fajr: 'jamat',
    dhuhr: 'jamat',
    asr: 'jamat',
    maghrib: 'jamat',
    isha: 'jamat',
    protection_3qul_ayatul_kursi: true,
    sleep_wudu_dua_brush: true,
    parents_respect_help: true,
    is_hifz_student: true,
    non_hifz_30m_quran: true,
    total_diamonds: 85,
    guardian_notes: 'আজ মাশাআল্লাহ খুব খুশীমনে ফজরে মসজিদে গেছে।',
    guardian_confirmed: true,
    updated_at: '2026-11-12T20:00:00Z',
  },
  {
    id: 'amol-rec-002',
    student_id: 2,
    student_name: 'ফাতিমা বিনতে হাসান',
    date: '2026-11-12',
    is_friday: false,
    fajr: 'alone',
    dhuhr: 'alone',
    asr: 'alone',
    maghrib: 'alone',
    isha: 'alone',
    protection_3qul_ayatul_kursi: true,
    sleep_wudu_dua_brush: true,
    parents_respect_help: true,
    is_hifz_student: true,
    non_hifz_30m_quran: true,
    total_diamonds: 75,
    guardian_notes: 'সবক ও আমল সুন্দরভাবে শেষ করেছে।',
    guardian_confirmed: true,
    updated_at: '2026-11-12T19:30:00Z',
  },
]

export function computeAmolDiamonds(record: Partial<DailyAmolRecord>): number {
  let diamonds = 0

  // 1. Salah calculation (Jamat = 15, Alone = 10, Missed = 0)
  const prayers: SalahStatus[] = [
    record.fajr ?? 'missed',
    record.dhuhr ?? 'missed',
    record.asr ?? 'missed',
    record.maghrib ?? 'missed',
    record.isha ?? 'missed',
  ]
  for (const p of prayers) {
    if (p === 'jamat') diamonds += 15
    else if (p === 'alone') diamonds += 10
  }

  // 2. Daily Protection & Bedtime Sunnah (10 each)
  if (record.protection_3qul_ayatul_kursi) diamonds += 10
  if (record.sleep_wudu_dua_brush) diamonds += 10
  if (record.parents_respect_help) diamonds += 5

  // 3. Non-Hifz 30m Quran reading (+15 or -5)
  if (!record.is_hifz_student) {
    if (record.non_hifz_30m_quran || (record.quran_minutes && record.quran_minutes >= 30)) {
      diamonds += 15
    } else if (record.quran_minutes && record.quran_minutes > 0 && record.quran_minutes < 30) {
      diamonds = Math.max(0, diamonds - 5) // Point cut as requested by user
    }
  }

  // 4. Friday Missions
  if (record.is_friday) {
    if (record.friday_ghusl_perfume) diamonds += 10
    if (record.friday_surah_kahf) diamonds += 20
    if (record.friday_durood_100) diamonds += 15
    if (record.friday_asr_dua) diamonds += 10
  }

  return diamonds
}

