// Hifz & Najera Daily Pora Record Store (Directly modeled after IOM Hifz Record Book PDF)

export type SabaqGrade = 'mumtaz' | 'jayyid_jiddan' | 'jayyid' | 'maqbool'

export interface HifzDailyRecord {
  id: string
  student_id: number
  student_name: string
  batch_name: string
  date: string // YYYY-MM-DD
  day_name?: string // শনিবার, রবিবার ইত্যাদি
  mode: 'hifz' | 'najera'

  // ── ১. সবক (New Lesson) ──────────────────────────────────
  sabaq_para?: number       // যেমন: পারা ৩০
  sabaq_page?: string       // যেমন: "পৃষ্ঠা ৫, আয়াত ১-১৫"

  // ── ২. সাত সবক (Sabqi - Recent 7 Lessons) ────────────────
  sabqi_amount?: string     // যেমন: "হাফ পারা" বা "৫ পৃষ্ঠা"
  sabqi_mistakes?: number   // ভুলের সংখ্যা: ০, ১, ২, ইত্যাদি

  // ── ৩. আমুখতা (Manzil - Old Revisions) ───────────────────
  manzil_para?: number      // যেমন: পারা ১
  manzil_amount?: string    // যেমন: "১ পারা" বা "১৫ পৃষ্ঠা"
  manzil_mistakes?: number  // ভুলের সংখ্যা

  // ── ৪. সাধারণ তেলাওয়াত ─────────────────────────────────────
  tilawat_para?: number
  tilawat_amount?: string

  // ── ৫. নামাজে তেলাওয়াত ───────────────────────────────────
  salah_tilawat_amount?: string

  // ── ৬. সবিনাহ ও দাওর (Weekly Sabinah) ─────────────────────
  sabinah_para?: number
  sabinah_lokma?: number    // বড় লোকমা / সাহায্য প্রয়োজন
  sabinah_toka?: number     // ছোট টোকা / সামান্য দ্বিধা

  // ── ৭. নাজেরা ও সাধারণ কোর্স (Najera Mode) ──────────────────
  najera_page?: string
  najera_lesson?: string
  najera_mistakes?: number
  daily_quran_minutes?: number // ৩০ মিনিট পড়ার ট্র্যাকার (১৫, ৩০, ৪৫, ৬০)

  // ── মূল্যায়ন ও পয়েন্ট ─────────────────────────────────────
  grade: SabaqGrade
  teacher_remarks?: string
  teacher_name?: string
  diamonds_earned: number
  created_at: string
}

export const HIFZ_DAILY_RECORDS_KEY = 'iom_hifz_daily_records_v2'

export const DEFAULT_HIFZ_RECORDS: HifzDailyRecord[] = [
  {
    id: 'hifz-rec-001',
    student_id: 1,
    student_name: 'আব্দুল্লাহ আল মাহমুদ',
    batch_name: 'হিফজুল কুরআন ১:১ ব্যাচ',
    date: '2026-11-12',
    day_name: 'বৃহস্পতিবার',
    mode: 'hifz',
    sabaq_para: 30,
    sabaq_page: 'সূরা নাবা (পৃষ্ঠা ১-২)',
    sabqi_amount: 'সূরা মুরসালাত (সম্পূর্ণ)',
    sabqi_mistakes: 0,
    manzil_para: 29,
    manzil_amount: '১ পারা',
    manzil_mistakes: 1,
    tilawat_para: 1,
    tilawat_amount: '১ রুকু',
    salah_tilawat_amount: 'মাগরিব ও এশার নামাজে সূরা ক্বিয়ামাহ',
    sabinah_para: 28,
    sabinah_lokma: 0,
    sabinah_toka: 1,
    grade: 'mumtaz',
    teacher_remarks: 'মাশাআল্লাহ, উচ্চারণ ও মাদ্দ অনেক সুন্দর হয়েছে। মনযোগ বজায় রেখো।',
    teacher_name: 'মুফতী মাওলানা আব্দুর রহমান',
    diamonds_earned: 50,
    created_at: '2026-11-12T18:30:00Z',
  },
  {
    id: 'hifz-rec-002',
    student_id: 2,
    student_name: 'ফাতিমা বিনতে হাসান',
    batch_name: 'মহিলা হিফজ ব্যাচ (সকাল)',
    date: '2026-11-12',
    day_name: 'বৃহস্পতিবার',
    mode: 'hifz',
    sabaq_para: 29,
    sabaq_page: 'সূরা মুলক (আয়াত ১-১৫)',
    sabqi_amount: 'সূরা ক্বলম',
    sabqi_mistakes: 1,
    manzil_para: 30,
    manzil_amount: 'আধা পারা',
    manzil_mistakes: 0,
    tilawat_para: 2,
    tilawat_amount: '২ পৃষ্ঠা',
    salah_tilawat_amount: 'তাহাজ্জুদে সূরা মুলক',
    sabinah_para: 30,
    sabinah_lokma: 0,
    sabinah_toka: 0,
    grade: 'mumtaz',
    teacher_remarks: 'চমৎকার তাজবীদ ও মাখরাজ। আল্লাহ কবুল করুন।',
    teacher_name: 'উস্তাযা আয়েশা খাতুন',
    diamonds_earned: 50,
    created_at: '2026-11-12T17:45:00Z',
  },
  {
    id: 'hifz-rec-003',
    student_id: 3,
    student_name: 'মুহাম্মদ তাসনিম',
    batch_name: 'তাজবীদ ও নাজেরা ব্যাচ ১',
    date: '2026-11-12',
    day_name: 'বৃহস্পতিবার',
    mode: 'najera',
    najera_page: 'পৃষ্ঠা ১২ (নূরানী কায়দা)',
    najera_lesson: 'তানভীন ও সাকিন এর নিয়ম',
    najera_mistakes: 2,
    daily_quran_minutes: 45, // ৩০ মিনিটের বেশি পড়েছে!
    grade: 'jayyid_jiddan',
    teacher_remarks: 'ইদগাম ও ইখফা নিয়মগুলো ভালো হয়েছে, গুন্নাহ আরেকটু স্পষ্ট করতে হবে।',
    teacher_name: 'হাফেজ ক্বারী শিহাব উদ্দিন',
    diamonds_earned: 40,
    created_at: '2026-11-12T16:15:00Z',
  },
]

export function calculatePoraDiamonds(
  grade: SabaqGrade,
  mode: 'hifz' | 'najera',
  mistakesCount: number,
  quranMinutes?: number,
): number {
  let base = 30
  if (grade === 'mumtaz') base = 50
  else if (grade === 'jayyid_jiddan') base = 40
  else if (grade === 'jayyid') base = 30
  else base = 20

  // Penalty for excessive mistakes (capped)
  const mistakePenalty = Math.min(15, mistakesCount * 2)
  base = Math.max(10, base - mistakePenalty)

  // Non-Hifz: 30 min reading bonus / penalty as requested by user
  if (mode === 'najera' && quranMinutes !== undefined) {
    if (quranMinutes >= 45) {
      base += 15 // Bonus for extra devotion
    } else if (quranMinutes >= 30) {
      base += 10 // Target reached
    } else if (quranMinutes > 0 && quranMinutes < 30) {
      base -= 5  // Did not reach 30 min minimum
    }
  }

  return Math.max(5, base)
}

