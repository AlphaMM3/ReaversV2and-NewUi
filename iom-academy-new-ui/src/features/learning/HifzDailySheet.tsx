import { supportApi, useSupportTickets } from '@/lib/supportApi'
import { useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import {
  useLocalStore,
} from '@/lib/superAdminStore'
import { StudentAvatar } from '@/components/Student360Drawer'
import {
  HIFZ_DAILY_RECORDS_KEY,
  type SabaqGrade,
} from '@/lib/hifzStore'
import {
  Save, CheckCircle2,

  RefreshCw, ChevronDown, ChevronUp,
  Plus, Minus,
  Edit2, AlertTriangle, Sparkles,
  BookOpen, Trophy, Mic, Ticket, Send, MessageSquare,
  Printer, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const AVAILABLE_TEACHERS = [
  'মাওলানা খালিদ',
  'মুফতী মাওলানা আব্দুর রহমান',
  'উস্তাযা আয়েশা খাতুন',
  'হাফেজ ক্বারী শিহাব উদ্দিন',
  'মাওলানা জাবের আহমেদ',
]

export interface BatchConfig {
  id: string
  name: string
  type: 'hifz' | 'najera' | 'general'
  defaultTeacher: string
}

export const ACADEMY_BATCHES: BatchConfig[] = [
  {
    id: 'hifz-a',
    name: 'Hifz-A (হিফজুল কুরআন - বালক শাখা)',
    type: 'hifz',
    defaultTeacher: 'মাওলানা খালিদ',
  },
  {
    id: 'hifz-b',
    name: 'Hifz-B (মহিলা হিফজ ১:১ ব্যাচ)',
    type: 'hifz',
    defaultTeacher: 'উস্তাযা আয়েশা খাতুন',
  },
  {
    id: 'tajweed-1',
    name: 'তাজবীদ ব্যাচ ১ (নাজেরা ও কায়দা)',
    type: 'najera',
    defaultTeacher: 'মুফতী মাওলানা আব্দুর রহমান',
  },
]

export interface StudentProfile {
  id: number
  roll: string
  name: string
  batchId: string
  currentDiamonds: number
  targetDiamonds: number
  currentPara?: number
}

export const ACADEMY_STUDENTS: StudentProfile[] = [
  // Hifz-A (বালক শাখা)
  {
    id: 1,
    roll: '৫০৬',
    name: 'আব্দুল্লাহ বিন মাহমুদ',
    batchId: 'hifz-a',
    currentDiamonds: 886,
    targetDiamonds: 1000,
    currentPara: 8,
  },
  {
    id: 2,
    roll: '৫০১',
    name: 'মুহাম্মাদ আনাস ইসলাম',
    batchId: 'hifz-a',
    currentDiamonds: 940,
    targetDiamonds: 1000,
    currentPara: 12,
  },
  {
    id: 3,
    roll: '৫০৪',
    name: 'জুবায়ের আল হাসান',
    batchId: 'hifz-a',
    currentDiamonds: 810,
    targetDiamonds: 1000,
    currentPara: 6,
  },
  {
    id: 4,
    roll: '৫০৮',
    name: 'মুহতাসিম বিল্লাহ',
    batchId: 'hifz-a',
    currentDiamonds: 795,
    targetDiamonds: 1000,
    currentPara: 4,
  },

  // Hifz-B (মহিলা শাখা)
  {
    id: 5,
    roll: '৫০২',
    name: 'মারিয়াম বিনতে রফিক',
    batchId: 'hifz-b',
    currentDiamonds: 980,
    targetDiamonds: 1000,
    currentPara: 15,
  },
  {
    id: 6,
    roll: '৫০৫',
    name: 'ফাতিমা তুয যাহরা',
    batchId: 'hifz-b',
    currentDiamonds: 870,
    targetDiamonds: 1000,
    currentPara: 9,
  },

  // Tajweed Batch 1
  {
    id: 7,
    roll: '৩১৫',
    name: 'জুবায়ের আহমেদ',
    batchId: 'tajweed-1',
    currentDiamonds: 840,
    targetDiamonds: 1000,
    currentPara: 1,
  },
  {
    id: 8,
    roll: '৩১৮',
    name: 'সালমান ফারসি',
    batchId: 'tajweed-1',
    currentDiamonds: 790,
    targetDiamonds: 1000,
    currentPara: 1,
  },
]

// ── HIFZ STANDARDS & DROPDOWN VALUES (১ পারা = ২০ পৃষ্ঠা) ──
export const BN_PARAS = Array.from({ length: 30 }, (_, i) => (i + 1).toLocaleString('bn-BD'))
export const BN_PAGES = Array.from({ length: 20 }, (_, i) => (i + 1).toLocaleString('bn-BD'))

export const SABAQ_AMOUNTS = [
  '৩ লাইন',
  '৫ লাইন',
  'আধা পৃষ্ঠা',
  '১ পৃষ্ঠা',
  '২ পৃষ্ঠা',
  '৩ পৃষ্ঠা',
  '৪ পৃষ্ঠা',
  '৫ পৃষ্ঠা',
  '৬ পৃষ্ঠা',
  '৭ পৃষ্ঠা',
  '১০ পৃষ্ঠা',
  'সবক বন্ধ / রিভিশন',
]

export const SABQI_AMOUNTS = [
  '২ পৃষ্ঠা',
  '৩ পৃষ্ঠা',
  '৪ পৃষ্ঠা',
  '৫ পৃষ্ঠা',
  '৬ পৃষ্ঠা',
  '৭ পৃষ্ঠা',
]

export const MANZIL_QUARTERS = [
  '১-৫',
  '৬-১০',
  '১১-১৫',
  '১৬-২০',
]

export const MANZIL_AMOUNTS = [
  '৫ পৃষ্ঠা',
  '১০ পৃষ্ঠা',
  '১৫ পৃষ্ঠা',
  '২০ পৃষ্ঠা',
]

export const TILAWAT_AMOUNTS = [
  '৫ পৃষ্ঠা',
  '১০ পৃষ্ঠা',
  '১৫ পৃষ্ঠা',
  '২০ পৃষ্ঠা',
]

export const SALAH_TILAWAT_AMOUNTS = [
  '১ পৃষ্ঠা',
  '২ পৃষ্ঠা',
  '৩ পৃষ্ঠা',
  '৪ পৃষ্ঠা',
  '৫ পৃষ্ঠা',
  '৬ পৃষ্ঠা',
  '৭ পৃষ্ঠা',
  '৮ পৃষ্ঠা',
  '৯ পৃষ্ঠা',
  '১০ পৃষ্ঠা',
  '২০ পৃষ্ঠা',
]

export const PURATAN_AMOUNTS = [
  'আধা পৃষ্ঠা',
  '১ পৃষ্ঠা',
  '২ পৃষ্ঠা',
  '৩ পৃষ্ঠা',
  '৪ পৃষ্ঠা',
  '৫ পৃষ্ঠা',
  '১০ পৃষ্ঠা',
]

export const TAJWEED_QUALITY_PRESETS = [
  { label: '🌟 অসাধারণ পাঠ (+৫ 💎)', value: '🌟 অসাধারণ পাঠ', points: 5 },
  { label: '✨ সুন্দর ও বিশুদ্ধ পাঠ (+২ 💎)', value: '✨ সুন্দর ও বিশুদ্ধ পাঠ', points: 2 },
  { label: '👌 সাধারণ পাঠ (+০ 💎)', value: '👌 সাধারণ পাঠ', points: 0 },
  { label: '⚠️ দুর্বল / অশুদ্ধ পাঠ (-২ 💎)', value: '⚠️ দুর্বল / অশুদ্ধ পাঠ', points: -2 },
  { label: '❌ মন্দ / দুর্বল পাঠ (-৫ 💎)', value: '❌ মন্দ / দুর্বল পাঠ', points: -5 },
]

import {
  parseBnInt,
  toBn,
  computeSatSabakRange,
  computeManzilRange,
  calculateNetDiamonds,
} from '@/domain/quranCalculators'

// Re-export domain calculators for backward compatibility
export { parseBnInt, toBn, computeSatSabakRange, computeManzilRange, calculateNetDiamonds }

export interface DailyLogRow {
  dayNum: string // "01", "02", ... "31"
  dateStr: string // "2026-11-01"
  dayName: string // "সোম", "মঙ্গল", ...
  // আজকের সবক
  sabaq_para: string
  sabaq_page: string
  sabaq_amount: string
  sabaq_mistakes: number
  // সাত সবক (Hifz)
  sabqi_para: string
  sabqi_page_range?: string
  sabqi_amount: string
  sabqi_mistakes: number
  sabqi_custom?: boolean
  // আমোক্তা (Hifz)
  manzil_para: string
  manzil_quarter: string
  manzil_page_range?: string
  manzil_amount: string
  manzil_mistakes: number
  manzil_custom?: boolean
  // তেলাওয়াত ও নামাজ (Hifz)
  tilawat_amount: string
  salah_tilawat_amount: string
  // নাজেরা নির্দিষ্ট ফিল্ডসমূহ
  puratan_para?: string
  puratan_page?: string
  puratan_amount?: string
  puratan_mistakes?: number
  tajweed_quality?: string
  tajweed_points?: number
  // মান ও স্বাক্ষর
  grade: SabaqGrade
  is_signed: boolean
  teacher_name: string
  teacher_notes?: string
}

// Generate the initial 31-day log matching the user's reference image
function generateDefaultMonthRows(teacherName: string): DailyLogRow[] {
  const days: DailyLogRow[] = []
  const bnDays = ['সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি', 'রবি']

  const sampleGrades: SabaqGrade[] = [
    'jayyid_jiddan',
    'maqbool',
    'mumtaz',
    'jayyid_jiddan',
    'jayyid',
    'maqbool',
    'mumtaz',
    'jayyid_jiddan',
    'jayyid',
    'maqbool',
    'mumtaz',
    'jayyid_jiddan',
    'jayyid',
    'maqbool',
    'mumtaz',
  ]

  const sampleMistakesToday = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]
  const sampleMistakesSaat = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
  const sampleMistakesAmukhta = [0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2]

  const sampleQuarters = ['১-৫', '১-৫', '৬-১০', '৬-১০', '১১-১৫', '১১-১৫', '১৬-২০', '১৬-২০', '১-৫', '১-৫', '৬-১০', '৬-১০', '১১-১৫', '১১-১৫', '১৬-২০']

  for (let i = 1; i <= 31; i++) {
    const dayStr = i.toString().padStart(2, '0')
    const idx = (i - 1) % 15
    const pageNum = ((i - 1) % 20) + 1
    const sabaqPageStr = pageNum.toLocaleString('bn-BD')
    const sabaqParaStr = '৮'
    const sabqiAmtStr = '৫ পৃষ্ঠা'
    const manzilAmtStr = '৫ পৃষ্ঠা'
    const manzilQtr = sampleQuarters[idx]

    days.push({
      dayNum: dayStr,
      dateStr: `2026-11-${dayStr}`,
      dayName: bnDays[(i - 1) % 7],
      sabaq_para: sabaqParaStr,
      sabaq_page: sabaqPageStr,
      sabaq_amount: '১ পৃষ্ঠা',
      sabaq_mistakes: sampleMistakesToday[idx],
      sabqi_para: sabaqParaStr,
      sabqi_amount: sabqiAmtStr,
      sabqi_page_range: computeSatSabakRange(sabaqParaStr, sabaqPageStr, sabqiAmtStr),
      sabqi_mistakes: sampleMistakesSaat[idx],
      sabqi_custom: false,
      manzil_para: '৩',
      manzil_quarter: manzilQtr,
      manzil_amount: manzilAmtStr,
      manzil_page_range: computeManzilRange('৩', manzilQtr, manzilAmtStr),
      manzil_mistakes: sampleMistakesAmukhta[idx],
      manzil_custom: false,
      tilawat_amount: '৫ পৃষ্ঠা',
      salah_tilawat_amount: '৫ পৃষ্ঠা',
      // নাজেরা নির্দিষ্ট ফিল্ডসমূহ
      puratan_para: '১',
      puratan_page: '৫',
      puratan_amount: '২ পৃষ্ঠা',
      puratan_mistakes: sampleMistakesSaat[idx],
      tajweed_quality: idx % 3 === 0 ? '🌟 অসাধারণ পাঠ' : '✨ সুন্দর ও বিশুদ্ধ পাঠ',
      tajweed_points: idx % 3 === 0 ? 5 : 2,
      grade: sampleGrades[idx],
      is_signed: true,
      teacher_name: teacherName,
      teacher_notes: idx % 4 === 0 ? 'মাশাআল্লাহ, সুন্দর তিলাওয়াত' : idx % 5 === 0 ? 'মাখরাজে আরও যত্নবান হতে হবে' : '',
    })
  }
  return days
}

interface HifzDailySheetProps {
  role?: string
  studentIdFilter?: number
}

export default function HifzDailySheet({ role = 'teacher', studentIdFilter }: HifzDailySheetProps) {
  const toast = useToast()

  // 1. Batch Selection
  const [selectedBatchId, setSelectedBatchId] = useState<string>(() => {
    if (studentIdFilter) {
      const match = ACADEMY_STUDENTS.find((s) => s.id === studentIdFilter)
      if (match) return match.batchId
    }
    return 'hifz-a'
  })

  // 2. Student Selection
  const [selectedStudentId, setSelectedStudentId] = useState<number>(() => {
    if (studentIdFilter) {
      const match = ACADEMY_STUDENTS.find((s) => s.id === studentIdFilter)
      if (match) return match.id
    }
    return 1 // Defaults to আব্দুল্লাহ বিন মাহমুদ (রোল: ৫০৬)
  })

  // Sync if studentIdFilter changes externally
  useEffect(() => {
    if (studentIdFilter) {
      const match = ACADEMY_STUDENTS.find((s) => s.id === studentIdFilter)
      if (match) {
        setSelectedBatchId(match.batchId)
        setSelectedStudentId(match.id)
      }
    }
  }, [studentIdFilter])

  // Active Batch & Students in this Batch
  const activeBatch = useMemo(() => {
    return ACADEMY_BATCHES.find((b) => b.id === selectedBatchId) || ACADEMY_BATCHES[0]
  }, [selectedBatchId])

  const studentsInBatch = useMemo(() => {
    return ACADEMY_STUDENTS.filter((s) => s.batchId === selectedBatchId)
  }, [selectedBatchId])

  // Active Student Profile
  const activeStudent = useMemo(() => {
    const student = ACADEMY_STUDENTS.find((s) => s.id === selectedStudentId)
    if (student && student.batchId === selectedBatchId) return student
    return studentsInBatch[0] || ACADEMY_STUDENTS[0]
  }, [selectedStudentId, selectedBatchId, studentsInBatch])

  // When batch changes, switch to first student of that batch
  function handleBatchChange(newBatchId: string) {
    setSelectedBatchId(newBatchId)
    const firstStudent = ACADEMY_STUDENTS.find((s) => s.batchId === newBatchId)
    if (firstStudent) {
      setSelectedStudentId(firstStudent.id)
    }
  }

  // 3. Date Range split: 'first_half' (০১ থেকে ১৫ তারিখ) vs 'second_half' (১৬ থেকে ৩১ তারিখ)
  const [dateRangeTab, setDateRangeTab] = useState<'first_half' | 'second_half'>('first_half')

  // Print / PDF Register Modal State
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printRange, setPrintRange] = useState<'first_half' | 'second_half' | 'full_month'>('first_half')

  // 4. View Switcher: 'cards' (Smart Card View) vs 'table' (Default to 'cards' as preferred)
  const [mobileDisplayMode, setMobileDisplayMode] = useState<'cards' | 'table'>('cards')

  // Expanded card on mobile/desktop (default to '01')
  const [expandedMobileDay, setExpandedMobileDay] = useState<string | null>('01')

  // Multi-session sub-card accordions state per day (defaults to open)
  const [subCardStates, setSubCardStates] = useState<Record<string, Record<string, boolean>>>({})

  const isSubCardOpen = (dayNum: string, key: string) => {
    return subCardStates[dayNum]?.[key] !== false
  }

  const toggleSubCard = (dayNum: string, key: string) => {
    setSubCardStates((prev) => ({
      ...prev,
      [dayNum]: {
        ...(prev[dayNum] || {}),
        [key]: !isSubCardOpen(dayNum, key),
      },
    }))
  }

  // Persistent storage of logbook rows for the active student & month
  const storageKey = `${HIFZ_DAILY_RECORDS_KEY}_student_${activeStudent.id}_2026_11`
  const [logRows, setLogRows] = useLocalStore<DailyLogRow[]>(
    storageKey,
    generateDefaultMonthRows(activeBatch.defaultTeacher),
  )

  // Visible rows based on date range tab
  const displayedRows = useMemo(() => {
    if (dateRangeTab === 'first_half') {
      return logRows.slice(0, 15) // Days 1 to 15
    }
    return logRows.slice(15) // Days 16 to 31
  }, [logRows, dateRangeTab])

  // Cell Update Handler with smart auto-range calculations
  function updateRowField<K extends keyof DailyLogRow>(
    dayNum: string,
    field: K,
    value: DailyLogRow[K],
  ) {
    setLogRows((prev) => {
      return prev.map((row) => {
        if (row.dayNum === dayNum) {
          const updated = { ...row, [field]: value }

          // Auto-recalculate Sabqi Range if sabaq page, para or sabqi amount changed and not custom
          if (
            (field === 'sabaq_page' || field === 'sabaq_para' || field === 'sabqi_amount') &&
            !updated.sabqi_custom
          ) {
            updated.sabqi_page_range = computeSatSabakRange(
              updated.sabaq_para,
              updated.sabaq_page,
              updated.sabqi_amount,
            )
            updated.sabqi_para = updated.sabaq_para
          }

          // Auto-recalculate Manzil Range if manzil quarter, para or amount changed and not custom
          if (
            (field === 'manzil_quarter' || field === 'manzil_para' || field === 'manzil_amount') &&
            !updated.manzil_custom
          ) {
            updated.manzil_page_range = computeManzilRange(
              updated.manzil_para,
              updated.manzil_quarter,
              updated.manzil_amount,
            )
          }

          return updated
        }
        return row
      })
    })
  }

  // Toggle custom override for Sabqi or Manzil range
  function toggleCustomMode(dayNum: string, section: 'sabqi' | 'manzil') {
    setLogRows((prev) => {
      return prev.map((row) => {
        if (row.dayNum === dayNum) {
          if (section === 'sabqi') {
            const isNowCustom = !row.sabqi_custom
            return {
              ...row,
              sabqi_custom: isNowCustom,
              sabqi_page_range: isNowCustom
                ? (row.sabqi_page_range || computeSatSabakRange(row.sabaq_para, row.sabaq_page, row.sabqi_amount))
                : computeSatSabakRange(row.sabaq_para, row.sabaq_page, row.sabqi_amount),
            }
          } else {
            const isNowCustom = !row.manzil_custom
            return {
              ...row,
              manzil_custom: isNowCustom,
              manzil_page_range: isNowCustom
                ? (row.manzil_page_range || computeManzilRange(row.manzil_para, row.manzil_quarter, row.manzil_amount))
                : computeManzilRange(row.manzil_para, row.manzil_quarter, row.manzil_amount),
            }
          }
        }
        return row
      })
    })
  }

  const isNajera = activeBatch.type === 'najera'

  // Calculate live diamond points with mistake deductions
  const liveTotalDiamonds = useMemo(() => {
    return logRows.reduce((acc, row) => {
      const totalMistakes = isNajera
        ? row.sabaq_mistakes + (row.puratan_mistakes || 0)
        : row.sabaq_mistakes + row.sabqi_mistakes + row.manzil_mistakes
      return acc + calculateNetDiamonds(row.grade, totalMistakes, isNajera ? (row.tajweed_points || 0) : 0)
    }, 0)
  }, [logRows, isNajera])

  // Data rows to be printed in printable register
  const printRows = useMemo(() => {
    if (printRange === 'first_half') return logRows.slice(0, 15)
    if (printRange === 'second_half') return logRows.slice(15, 31)
    return logRows
  }, [logRows, printRange])

  // Summary statistics for printable register
  const printSummary = useMemo(() => {
    const presentDays = printRows.filter((r) => r.is_signed || !!r.grade).length
    const totalMistakes = printRows.reduce((acc, r) => {
      return acc + (isNajera
        ? (r.sabaq_mistakes || 0) + (r.puratan_mistakes || 0)
        : (r.sabaq_mistakes || 0) + (r.sabqi_mistakes || 0) + (r.manzil_mistakes || 0))
    }, 0)
    const netDiamonds = printRows.reduce((acc, r) => {
      const mistakes = isNajera
        ? (r.sabaq_mistakes || 0) + (r.puratan_mistakes || 0)
        : (r.sabaq_mistakes || 0) + (r.sabqi_mistakes || 0) + (r.manzil_mistakes || 0)
      return acc + calculateNetDiamonds(r.grade, mistakes, isNajera ? (r.tajweed_points || 0) : 0)
    }, 0)
    return { presentDays, totalMistakes, netDiamonds }
  }, [printRows, isNajera])

  // Save changes handler
  function handleSaveLogbook(dayHint?: string) {
    setLogRows([...logRows])
    if (dayHint) {
      toast.success(
        `মাশাআল্লাহ! ${activeStudent.name}-এর ${dayHint} তারিখের সবক সংরক্ষিত হয়েছে।`,
      )
    } else {
      toast.success(
        `মাশাআল্লাহ! ${activeStudent.name}-এর ${isNajera ? 'নাজেরা ও তাজবীদ' : 'হিফজ'} তথ্য বই সম্পূর্ণ সংরক্ষিত হয়েছে।`,
      )
    }
  }

  // Reset to default sample values matching the reference
  const isTeacherOrAdmin = ['teacher', 'super_admin', 'director', 'zimmadar', 'dept_head'].includes(role)

  // Ticket / Escalation integration
  const { data: supportTickets = [], refetch: refreshTickets } = useSupportTickets()
  const studentOpenTickets = useMemo(() => {
    return supportTickets.filter(
      (t) =>
        t.status !== 'resolved' &&
        (t.student_name?.toLowerCase().includes(activeStudent.name.toLowerCase()) ||
          t.subject.toLowerCase().includes(activeStudent.name.toLowerCase())),
    )
  }, [supportTickets, activeStudent.name])

  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [escalateSubject, setEscalateSubject] = useState('')
  const [escalateDetails, setEscalateDetails] = useState('')
  const [escalatePriority, setEscalatePriority] = useState<'normal' | 'urgent'>('urgent')
  const [escalateTargetRole, setEscalateTargetRole] = useState<'zimmadar' | 'central_admin'>('zimmadar')

  async function handleCreateEscalationTicket(e: React.FormEvent) {
    e.preventDefault()
    try {
      const ticket = await supportApi.create({
        subject: escalateSubject,
        description: escalateDetails,
        category: 'student_issue',
        priority: escalatePriority,
        target_role: escalateTargetRole,
        student_name: activeStudent.name,
      })
      await refreshTickets()
      setShowEscalateModal(false)
      setEscalateSubject('')
      setEscalateDetails('')
      toast.success(`টিকেট সংরক্ষিত হয়েছে · #${ticket.token}`)
    } catch (error) {
      toast.error(error, 'টিকেট সংরক্ষণ করা যায়নি')
    }
  }
  return (
    <div className="space-y-4">
      {/* ── TOP DEPARTMENT & BATCH SWITCHER BAR (১-ক্লিকে হিফজ ও নাজেরা পরিবর্তন) ── */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <label className="space-y-1 text-xs font-semibold">বিভাগ
            <select className="block w-full" value={isNajera ? 'najera' : 'hifz'} onChange={(e) => handleBatchChange(e.target.value === 'najera' ? 'tajweed-1' : 'hifz-a')}>
              <option value="hifz">হিফজুল কুরআন</option>
              <option value="najera">নাজেরা ও তাজবীদ</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold">ব্যাচ
            <select className="block w-full" value={selectedBatchId} onChange={(e) => handleBatchChange(e.target.value)}>
              {ACADEMY_BATCHES.filter((b) => (b.id === 'tajweed-1') === isNajera).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold">শিক্ষার্থী
            <select className="block w-full" value={activeStudent.id} onChange={(e) => setSelectedStudentId(Number(e.target.value))}>
              {studentsInBatch.map((student) => <option key={student.id} value={student.id}>{student.name} · রোল {student.roll}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold">তারিখের ভাগ
            <select className="block w-full" value={dateRangeTab} onChange={(e) => setDateRangeTab(e.target.value === 'first_half' ? 'first_half' : 'second_half')}>
              <option value="first_half">১–১৫ নভেম্বর</option>
              <option value="second_half">১৬–৩০ নভেম্বর</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold">দেখার ধরন
            <select className="block w-full" value={mobileDisplayMode} onChange={(e) => setMobileDisplayMode(e.target.value === 'table' ? 'table' : 'cards')}>
              <option value="cards">কার্ড</option>
              <option value="table">তথ্যবই</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            onClick={() => setShowPrintModal(true)}
            variant="outline"
            className="text-xs rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-3 py-2 cursor-pointer gap-1.5 flex h-10 shadow-3xs items-center shrink-0 font-bold"
            title="রেজিস্টার খাতা A4 প্রিন্ট করুন বা PDF হিসেবে ডাউনলোড করুন"
          >
            <Printer className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="hidden sm:inline">রেজিস্টার প্রিন্ট / PDF</span>
            <span className="sm:hidden">প্রিন্ট</span>
          </Button>

          <Button
            type="button"
            onClick={() => handleSaveLogbook()}
            className="w-full lg:w-auto flex-1 lg:flex-none justify-center bg-emerald-academy hover:bg-emerald-academy-dark text-white rounded-xl text-xs sm:text-sm font-extrabold px-5 h-10 cursor-pointer gap-2 shadow-xs ring-1 ring-emerald-500/20 flex items-center active:scale-[0.99] transition-transform"
          >
            <Save className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>লগবুক আপডেট সংরক্ষণ করুন</span>
          </Button>

        </div>
      </Card>

      {/* ── TOP HEADER (ACADEMY WEBSITE CORE STYLE) ── */}
      <Card className="p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Student Profile Info with Avatar */}
          <div className="flex items-start sm:items-center gap-4">
            <StudentAvatar
              studentId={activeStudent.id}
              name={activeStudent.name}
              size="lg"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-bold text-[11px]',
                  isNajera
                    ? 'bg-amber-50 text-amber-900 border-amber-200/80'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
                )}>
                  {isNajera ? (
                    <>
                      <Mic className="w-3.5 h-3.5 text-amber-700" />
                      নাজেরা ও তাজবীদ দৈনিক তথ্য বই
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                      হিফজুল কুরআন দৈনিক তথ্য বই
                    </>
                  )}
                </span>
                <Badge variant="neutral" className="text-xs font-mono font-bold">
                  রোল: {activeStudent.roll}
                </Badge>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-heading tracking-tight">
                {activeStudent.name}
              </h2>

              <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted font-medium pt-0.5">
                <span className="inline-flex items-center gap-1">
                  <span>ব্যাচ:</span>
                  <strong className="text-heading font-semibold">{activeBatch.name}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span>উস্তাদ: <strong className="text-heading font-semibold">{activeBatch.defaultTeacher}</strong></span>
                {isTeacherOrAdmin && (
                  <>
                    <span className="text-slate-300">|</span>

                    {studentOpenTickets.length > 0 && (
                      <>
                        <a
                          href="#/tickets"
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs cursor-pointer animate-pulse transition-colors"
                          title="এই শিক্ষার্থীর জন্য অভিভাবকের সক্রিয় টিকেট রয়েছে — দেখতে ক্লিক করুন"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                          <span>অভিভাবক বার্তা ({toBn(studentOpenTickets.length)})</span>
                        </a>
                        <span className="text-slate-300">|</span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEscalateSubject(`ছাত্রের বিশেষ সমস্যা / ফলোআপ প্রয়োজন`)
                        setShowEscalateModal(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold text-xs cursor-pointer transition-colors"
                      title="জিম্মাদারকে সমস্যা রিপোর্ট / এস্কেলেট করুন"
                    >
                      <Ticket className="w-3.5 h-3.5 text-rose-600" />
                      <span>সমস্যা এস্কেলেট করুন</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* KPI Stat Cards (Website Core Style) */}
          <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto">
            {/* Card 1: বর্তমান মোট পয়েন্ট */}
            <div className="flex-1 sm:flex-initial bg-surface rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 flex items-center gap-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] min-w-[170px] hover:border-emerald-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-muted leading-tight">
                  বর্তমান মোট পয়েন্ট
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-heading font-mono">
                    {liveTotalDiamonds || activeStudent.currentDiamonds}
                  </span>
                  <span className="text-sm">💎</span>
                </div>
              </div>
            </div>

            {/* Card 2: মাসিক লক্ষ্যমাত্রা */}
            <div className="flex-1 sm:flex-initial bg-surface rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 flex items-center gap-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] min-w-[170px] hover:border-amber-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-muted leading-tight">
                  মাসিক লক্ষ্যমাত্রা
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
                    {activeStudent.targetDiamonds.toLocaleString()}
                  </span>
                  <span className="text-sm">💎</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>



      {/* ── 1. TABLE VIEW (EXACT REPLICA WITH INLINE DROPDOWNS & RED FLAGS) ── */}
      {mobileDisplayMode === 'table' ? (
        <Card className="rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              {/* Level 1 Header (Distinct Color Bands for Each Section) */}
              <thead>
                <tr className="text-white text-[11px] font-bold border-b border-slate-700">
                  <th rowSpan={2} className="py-2.5 px-2 border-r-2 border-slate-700 w-10 text-center sticky left-0 z-10 bg-slate-900 text-slate-100 shadow-3xs">
                    তারিখ
                  </th>
                  <th rowSpan={2} className="py-2.5 px-2 border-r-2 border-slate-700 w-12 text-center sticky left-10 z-10 bg-slate-900 text-slate-100 shadow-3xs">
                    বার
                  </th>
                  {isNajera ? (
                    <>
                      {/* আজকের সবক - Sky Blue Theme */}
                      <th colSpan={4} className="py-2.5 px-3 border-r-2 border-sky-400 text-center bg-sky-900 text-sky-100 font-extrabold tracking-wide">
                        📖 ১. আজকের সবক
                      </th>
                      {/* পুরাতন সবক - Indigo/Purple Theme */}
                      <th colSpan={3} className="py-2.5 px-3 border-r-2 border-indigo-400 text-center bg-indigo-900 text-indigo-100 font-extrabold tracking-wide">
                        📚 ২. পুরাতন সবক
                      </th>
                      {/* তাজবীদ ও তারতীল - Amber Theme */}
                      <th colSpan={2} className="py-2.5 px-3 border-r-2 border-amber-400 text-center bg-amber-900 text-amber-100 font-extrabold tracking-wide">
                        🎙️ ৩. তাজবীদ ও তারতীল
                      </th>
                    </>
                  ) : (
                    <>
                      {/* আজকের সবক - Sky Blue Theme */}
                      <th colSpan={4} className="py-2.5 px-3 border-r-2 border-sky-400 text-center bg-sky-900 text-sky-100 font-extrabold tracking-wide">
                        📖 ১. আজকের সবক
                      </th>
                      {/* সাত সবক - Indigo/Purple Theme */}
                      <th colSpan={3} className="py-2.5 px-3 border-r-2 border-indigo-400 text-center bg-indigo-900 text-indigo-100 font-extrabold tracking-wide">
                        🔁 ২. সাত সবক
                      </th>
                      {/* আমোক্তা - Amber/Gold Theme */}
                      <th colSpan={3} className="py-2.5 px-3 border-r-2 border-amber-400 text-center bg-amber-900 text-amber-100 font-extrabold tracking-wide">
                        📚 ৩. আমোক্তা
                      </th>
                      {/* তেলাওয়াত ও নামাজ - Emerald Theme */}
                      <th colSpan={2} className="py-2.5 px-3 border-r-2 border-emerald-400 text-center bg-emerald-900 text-emerald-100 font-extrabold tracking-wide">
                        🕌 ৪. তেলাওয়াত ও নামাজ
                      </th>
                    </>
                  )}
                  <th rowSpan={2} className="py-2.5 px-3 border-r border-teal-800 min-w-[125px] text-center bg-teal-950 text-teal-100">
                    মান / পয়েন্ট
                    <span className="block text-[9px] font-normal text-teal-300 mt-0.5">মুমতাজ/জায়্যিদ</span>
                  </th>
                  <th rowSpan={2} className="py-2.5 px-3 min-w-[85px] text-center bg-teal-950 text-teal-100">
                    স্বাক্ষর
                    <span className="block text-[9px] font-normal text-teal-300 mt-0.5">উস্তাদ</span>
                  </th>
                </tr>

                {/* Level 2 Sub-header */}
                <tr className="text-[10px] font-semibold border-b border-slate-700">
                  {isNajera ? (
                    <>
                      {/* আজকের সবক (Sky) */}
                      <th className="py-1.5 px-1 border-r border-sky-800/80 bg-sky-950 text-sky-200 min-w-[48px]">পারা/সুরা</th>
                      <th className="py-1.5 px-1 border-r border-sky-800/80 bg-sky-950 text-sky-200 min-w-[48px]">পৃষ্ঠা</th>
                      <th className="py-1.5 px-1 border-r border-sky-800/80 bg-sky-950 text-sky-200 min-w-[85px]">পরিমাণ</th>
                      <th className="py-1.5 px-1 border-r-2 border-sky-400 bg-sky-950 text-rose-300 font-bold w-10">ভুল</th>
                      {/* পুরাতন সবক (Indigo) */}
                      <th className="py-1.5 px-2 border-r border-indigo-800/80 bg-indigo-950 text-indigo-200 min-w-[85px]">পৃষ্ঠা</th>
                      <th className="py-1.5 px-1 border-r border-indigo-800/80 bg-indigo-950 text-indigo-200 min-w-[75px]">পরিমাণ</th>
                      <th className="py-1.5 px-1 border-r-2 border-indigo-400 bg-indigo-950 text-rose-300 font-bold w-10">ভুল</th>
                      {/* তাজবীদ ও তারতীল (Amber) */}
                      <th className="py-1.5 px-2 border-r border-amber-800/80 bg-amber-950 text-amber-200 min-w-[125px]">তিলাওয়াতের মান</th>
                      <th className="py-1.5 px-1 border-r-2 border-amber-400 bg-amber-950 text-amber-200 font-bold min-w-[80px]">পয়েন্ট (+/-)</th>
                    </>
                  ) : (
                    <>
                      {/* আজকের সবক (Sky) */}
                      <th className="py-1.5 px-1 border-r border-sky-800/80 bg-sky-950 text-sky-200 min-w-[48px]">পারা</th>
                      <th className="py-1.5 px-1 border-r border-sky-800/80 bg-sky-950 text-sky-200 min-w-[48px]">পৃষ্ঠা</th>
                      <th className="py-1.5 px-1 border-r border-sky-800/80 bg-sky-950 text-sky-200 min-w-[85px]">পরিমাণ</th>
                      <th className="py-1.5 px-1 border-r-2 border-sky-400 bg-sky-950 text-rose-300 font-bold w-10">ভুল</th>
                      {/* সাত সবক (Indigo) */}
                      <th className="py-1.5 px-2 border-r border-indigo-800/80 bg-indigo-950 text-indigo-200 min-w-[120px]">পারা/রেঞ্জ</th>
                      <th className="py-1.5 px-1 border-r border-indigo-800/80 bg-indigo-950 text-indigo-200 min-w-[75px]">পরিমাণ</th>
                      <th className="py-1.5 px-1 border-r-2 border-indigo-400 bg-indigo-950 text-rose-300 font-bold w-10">ভুল</th>
                      {/* আমোক্তা (Amber) */}
                      <th className="py-1.5 px-1 border-r border-amber-800/80 bg-amber-950 text-amber-200 min-w-[48px]">পারা</th>
                      <th className="py-1.5 px-1 border-r border-amber-800/80 bg-amber-950 text-amber-200 min-w-[85px]">পৃষ্ঠা</th>
                      <th className="py-1.5 px-1 border-r-2 border-amber-400 bg-amber-950 text-rose-300 font-bold w-10">ভুল</th>
                      {/* তেলাওয়াত ও নামাজ (Emerald) */}
                      <th className="py-1.5 px-1 border-r border-emerald-800/80 bg-emerald-950 text-emerald-200 min-w-[75px]">তেলাওয়াত</th>
                      <th className="py-1.5 px-1 border-r-2 border-emerald-400 bg-emerald-950 text-emerald-200 min-w-[75px]">নামাজে তিল:</th>
                    </>
                  )}
                </tr>
              </thead>

              {/* Table Body (Clean rows matching reference image) */}
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {displayedRows.map((row, idx) => {
                  const prevRow = idx > 0 ? displayedRows[idx - 1] : (dateRangeTab === 'second_half' ? logRows[14] : null)
                  const isSabaqRedFlag = row.sabaq_mistakes > 3
                  const isSabqiRedFlag = !isNajera && row.sabqi_mistakes > 3
                  const isManzilRedFlag = !isNajera && row.manzil_mistakes > 2
                  const isPuratanRedFlag = isNajera && (row.puratan_mistakes || 0) > 3

                  const totalMistakes = isNajera
                    ? row.sabaq_mistakes + (row.puratan_mistakes || 0)
                    : row.sabaq_mistakes + row.sabqi_mistakes + row.manzil_mistakes

                  const tajweedPoints = isNajera ? (row.tajweed_points || 0) : 0
                  const netDiamonds = calculateNetDiamonds(row.grade, totalMistakes, tajweedPoints)

                  return (
                    <tr
                      key={row.dayNum}
                      className="transition-colors font-medium text-[11px]"
                    >
                      {/* তারিখ */}
                      <td className="py-2 px-1 border-r-2 border-slate-300 font-black text-slate-900 bg-slate-100/90 sticky left-0 z-10">
                        {row.dayNum}
                      </td>

                      {/* বার */}
                      <td className="py-2 px-1 border-r-2 border-slate-300 text-slate-700 bg-slate-100/90 sticky left-10 z-10 font-bold">
                        {row.dayName}
                      </td>

                      {/* ── ১. আজকের সবক (Sky Blue Column Lane) ── */}
                      {/* পারা */}
                      <td className="py-1 px-0.5 border-r border-sky-200 bg-sky-50/70 hover:bg-sky-100/60 text-center min-w-[48px]">
                        {isTeacherOrAdmin ? (
                          <select
                            value={row.sabaq_para}
                            onChange={(e) => updateRowField(row.dayNum, 'sabaq_para', e.target.value)}
                            className="w-full text-center font-bold bg-transparent hover:bg-sky-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 rounded py-0.5 cursor-pointer text-xs text-sky-950"
                            title={prevRow ? `গতকাল: পারা ${prevRow.sabaq_para}` : 'পারা নির্বাচন'}
                          >
                            {BN_PARAS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sky-950 font-bold">{row.sabaq_para}</span>
                        )}
                      </td>

                      {/* পৃষ্ঠা */}
                      <td className="py-1 px-0.5 border-r border-sky-200 bg-sky-50/70 hover:bg-sky-100/60 text-center min-w-[48px]">
                        {isTeacherOrAdmin ? (
                          <select
                            value={row.sabaq_page}
                            onChange={(e) => updateRowField(row.dayNum, 'sabaq_page', e.target.value)}
                            className="w-full text-center font-bold bg-transparent hover:bg-sky-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 rounded py-0.5 cursor-pointer text-xs text-sky-950"
                            title={prevRow ? `গতকাল: পৃষ্ঠা ${prevRow.sabaq_page}` : 'পৃষ্ঠা নির্বাচন'}
                          >
                            {BN_PAGES.map((pg) => (
                              <option key={pg} value={pg}>{pg}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sky-950 font-bold">{row.sabaq_page}</span>
                        )}
                      </td>

                      {/* পরিমাণ */}
                      <td className="py-1 px-1 border-r border-sky-200 bg-sky-50/70 hover:bg-sky-100/60 text-slate-700 text-center min-w-[85px]">
                        {isTeacherOrAdmin ? (
                          <select
                            value={row.sabaq_amount}
                            onChange={(e) => updateRowField(row.dayNum, 'sabaq_amount', e.target.value)}
                            className="w-full text-center font-medium bg-transparent hover:bg-sky-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 rounded py-0.5 cursor-pointer text-[11px] text-sky-950"
                            title={prevRow ? `গতকাল: ${prevRow.sabaq_amount}` : 'সবকের পরিমাণ'}
                          >
                            {SABAQ_AMOUNTS.map((amt) => (
                              <option key={amt} value={amt}>{amt}</option>
                            ))}
                          </select>
                        ) : (
                          row.sabaq_amount
                        )}
                      </td>

                      {/* ভুল (+ Red Flag) */}
                      <td className={cn(
                        'py-1 px-1 border-r-2 border-sky-400 font-bold text-center',
                        isSabaqRedFlag ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-400' : 'bg-sky-100/80',
                      )}>
                        {isTeacherOrAdmin ? (
                          <input
                            type="number"
                            min="0"
                            value={row.sabaq_mistakes}
                            onChange={(e) => updateRowField(row.dayNum, 'sabaq_mistakes', Number(e.target.value))}
                            className={cn(
                              'w-8 text-center font-bold bg-transparent focus:bg-white focus:outline-none rounded py-0.5',
                              isSabaqRedFlag ? 'text-rose-700 font-black' : row.sabaq_mistakes > 0 ? 'text-amber-700 font-bold' : 'text-slate-600',
                            )}
                            title={isSabaqRedFlag ? 'সতর্কতা: আজকের সবকে ৩টির বেশি ভুল (রেড ফ্ল্যাগ)' : undefined}
                          />
                        ) : (
                          <span className={isSabaqRedFlag ? 'text-rose-700 font-black' : row.sabaq_mistakes > 0 ? 'text-amber-700' : 'text-slate-600'}>
                            {row.sabaq_mistakes}
                          </span>
                        )}
                      </td>

                      {isNajera ? (
                        <>
                          {/* ── ২. পুরাতন সবক (নাজেরা - Indigo) ── */}
                          {/* পৃষ্ঠা */}
                          <td className="py-1 px-1 border-r border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/60 text-center font-medium min-w-[85px]">
                            {isTeacherOrAdmin ? (
                              <select
                                value={row.puratan_page || '৫'}
                                onChange={(e) => updateRowField(row.dayNum, 'puratan_page', e.target.value)}
                                className="w-full text-center font-bold bg-transparent hover:bg-indigo-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded py-0.5 cursor-pointer text-xs text-indigo-950"
                              >
                                {BN_PAGES.map((pg) => (
                                  <option key={pg} value={pg}>পৃষ্ঠা {pg}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[10px] text-indigo-950 font-bold">পৃষ্ঠা {row.puratan_page || '৫'}</span>
                            )}
                          </td>

                          {/* পরিমাণ */}
                          <td className="py-1 px-1 border-r border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/60 text-indigo-950 text-center min-w-[75px]">
                            {isTeacherOrAdmin ? (
                              <select
                                value={row.puratan_amount || '২ পৃষ্ঠা'}
                                onChange={(e) => updateRowField(row.dayNum, 'puratan_amount', e.target.value)}
                                className="w-full text-center font-medium bg-transparent hover:bg-indigo-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded py-0.5 cursor-pointer text-[11px] text-indigo-950"
                              >
                                {PURATAN_AMOUNTS.map((amt) => (
                                  <option key={amt} value={amt}>{amt}</option>
                                ))}
                              </select>
                            ) : (
                              row.puratan_amount || '২ পৃষ্ঠা'
                            )}
                          </td>

                          {/* ভুল (+ Red Flag) */}
                          <td className={cn(
                            'py-1 px-1 border-r-2 border-indigo-400 font-bold text-center',
                            isPuratanRedFlag ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-400' : 'bg-indigo-100/80',
                          )}>
                            {isTeacherOrAdmin ? (
                              <input
                                type="number"
                                min="0"
                                value={row.puratan_mistakes ?? 0}
                                onChange={(e) => updateRowField(row.dayNum, 'puratan_mistakes', Number(e.target.value))}
                                className={cn(
                                  'w-8 text-center font-bold bg-transparent focus:bg-white focus:outline-none rounded py-0.5',
                                  isPuratanRedFlag ? 'text-rose-700 font-black' : (row.puratan_mistakes || 0) > 0 ? 'text-amber-700 font-bold' : 'text-slate-600',
                                )}
                                title={isPuratanRedFlag ? 'সতর্কতা: পুরাতন সবকে ৩টির বেশি ভুল (রেড ফ্ল্যাগ)' : undefined}
                              />
                            ) : (
                              <span className={isPuratanRedFlag ? 'text-rose-700 font-black' : (row.puratan_mistakes || 0) > 0 ? 'text-amber-700' : 'text-slate-600'}>
                                {row.puratan_mistakes ?? 0}
                              </span>
                            )}
                          </td>

                          {/* ── ৩. তাজবীদ ও তারতীল (নাজেরা - Amber/Gold) ── */}
                          {/* তিলাওয়াত মান */}
                          <td className="py-1 px-1 border-r border-amber-200 bg-amber-50/70 hover:bg-amber-100/60 text-center min-w-[125px]">
                            {isTeacherOrAdmin ? (
                              <select
                                value={row.tajweed_quality || '✨ সুন্দর ও বিশুদ্ধ পাঠ'}
                                onChange={(e) => {
                                  const val = e.target.value
                                  updateRowField(row.dayNum, 'tajweed_quality', val)
                                  const preset = TAJWEED_QUALITY_PRESETS.find((p) => p.value === val)
                                  if (preset !== undefined) {
                                    updateRowField(row.dayNum, 'tajweed_points', preset.points)
                                  }
                                }}
                                className="w-full text-center font-bold bg-transparent hover:bg-amber-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5 cursor-pointer text-[10px] text-amber-950"
                              >
                                {TAJWEED_QUALITY_PRESETS.map((p) => (
                                  <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-950">{row.tajweed_quality || 'বিশুদ্ধ পাঠ'}</span>
                            )}
                          </td>

                          {/* পয়েন্ট (+/-) */}
                          <td className="py-1 px-1 border-r-2 border-amber-400 bg-amber-50/70 hover:bg-amber-100/60 text-center min-w-[80px]">
                            {isTeacherOrAdmin ? (
                              <select
                                value={row.tajweed_points ?? 0}
                                onChange={(e) => updateRowField(row.dayNum, 'tajweed_points', Number(e.target.value))}
                                className={cn(
                                  'w-full text-center font-black bg-transparent hover:bg-amber-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5 cursor-pointer text-xs font-mono',
                                  (row.tajweed_points ?? 0) > 0 ? 'text-emerald-700' : (row.tajweed_points ?? 0) < 0 ? 'text-rose-700' : 'text-slate-700',
                                )}
                              >
                                {[-5, -2, -1, 0, 1, 2, 5].map((pts) => (
                                  <option key={pts} value={pts}>
                                    {pts > 0 ? `+${toBn(pts)}` : pts < 0 ? `-${toBn(Math.abs(pts))}` : '০'} 💎
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={cn('text-xs font-mono font-bold', (row.tajweed_points ?? 0) > 0 ? 'text-emerald-700' : (row.tajweed_points ?? 0) < 0 ? 'text-rose-700' : 'text-slate-700')}>
                                {(row.tajweed_points ?? 0) > 0 ? `+${toBn(row.tajweed_points ?? 0)}` : toBn(row.tajweed_points ?? 0)} 💎
                              </span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          {/* ── ২. সাত সবক (Hifz - Indigo/Purple Column Lane) ── */}
                          {/* রেঞ্জ */}
                          <td className="py-1 px-1 border-r border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/60 text-center font-medium min-w-[120px]">
                            <div className="flex items-center justify-center gap-1">
                              {row.sabqi_custom ? (
                                <input
                                  type="text"
                                  value={row.sabqi_page_range || ''}
                                  onChange={(e) => updateRowField(row.dayNum, 'sabqi_page_range', e.target.value)}
                                  className="w-full text-center text-[10px] font-bold bg-white border border-indigo-300 rounded px-1 py-0.5 text-indigo-950"
                                />
                              ) : (
                                <span className="text-[10px] text-indigo-950 font-bold truncate max-w-[105px]" title={row.sabqi_page_range || computeSatSabakRange(row.sabaq_para, row.sabaq_page, row.sabqi_amount)}>
                                  {row.sabqi_page_range || computeSatSabakRange(row.sabaq_para, row.sabaq_page, row.sabqi_amount)}
                                </span>
                              )}
                              {isTeacherOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => toggleCustomMode(row.dayNum, 'sabqi')}
                                  className="text-indigo-400 hover:text-indigo-700 cursor-pointer shrink-0"
                                  title={row.sabqi_custom ? 'অটো-ক্যালকুলেশনে ফেরত যান' : 'ম্যানুয়ালি রেঞ্জ এডিট করুন'}
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* পরিমাণ */}
                          <td className="py-1 px-1 border-r border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/60 text-indigo-950 text-center min-w-[75px]">
                            {isTeacherOrAdmin ? (
                              <select
                                value={row.sabqi_amount}
                                onChange={(e) => updateRowField(row.dayNum, 'sabqi_amount', e.target.value)}
                                className="w-full text-center font-medium bg-transparent hover:bg-indigo-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded py-0.5 cursor-pointer text-[11px] text-indigo-950"
                                title={prevRow ? `গতকাল: ${prevRow.sabqi_amount}` : 'সাত সবক পরিমাণ'}
                              >
                                {SABQI_AMOUNTS.map((amt) => (
                                  <option key={amt} value={amt}>{amt}</option>
                                ))}
                              </select>
                            ) : (
                              row.sabqi_amount
                            )}
                          </td>

                          {/* ভুল (+ Red Flag) */}
                          <td className={cn(
                            'py-1 px-1 border-r-2 border-indigo-400 font-bold text-center',
                            isSabqiRedFlag ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-400' : 'bg-indigo-100/80',
                          )}>
                            {isTeacherOrAdmin ? (
                              <input
                                type="number"
                                min="0"
                                value={row.sabqi_mistakes}
                                onChange={(e) => updateRowField(row.dayNum, 'sabqi_mistakes', Number(e.target.value))}
                                className={cn(
                                  'w-8 text-center font-bold bg-transparent focus:bg-white focus:outline-none rounded py-0.5',
                                  isSabqiRedFlag ? 'text-rose-700 font-black' : row.sabqi_mistakes > 0 ? 'text-amber-700 font-bold' : 'text-slate-600',
                                )}
                                title={isSabqiRedFlag ? 'সতর্কতা: সাত সবকে ৩টির বেশি ভুল (রেড ফ্ল্যাগ)' : undefined}
                              />
                            ) : (
                              <span className={isSabqiRedFlag ? 'text-rose-700 font-black' : row.sabqi_mistakes > 0 ? 'text-amber-700' : 'text-slate-600'}>
                                {row.sabqi_mistakes}
                              </span>
                            )}
                          </td>

                          {/* ── ৩. আমোক্তা (Hifz - Amber/Gold Column Lane) ── */}
                          {/* পারা */}
                          <td className="py-1 px-0.5 border-r border-amber-200 bg-amber-50/70 hover:bg-amber-100/60 text-center min-w-[48px]">
                            {isTeacherOrAdmin ? (
                              <select
                                value={row.manzil_para || '৩'}
                                onChange={(e) => updateRowField(row.dayNum, 'manzil_para', e.target.value)}
                                className="w-full text-center font-bold bg-transparent hover:bg-amber-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5 cursor-pointer text-xs text-amber-950"
                                title={prevRow ? `গতকাল: পারা ${prevRow.manzil_para}` : 'আমোক্তা পারা'}
                              >
                                {BN_PARAS.map((p) => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-amber-950 font-bold">{row.manzil_para || '৩'}</span>
                            )}
                          </td>

                          {/* পৃষ্ঠা */}
                          <td className="py-1 px-1 border-r border-amber-200 bg-amber-50/70 hover:bg-amber-100/60 text-center min-w-[85px]">
                            <div className="flex items-center justify-center gap-1">
                              {row.manzil_custom ? (
                                <input
                                  type="text"
                                  value={row.manzil_page_range || ''}
                                  onChange={(e) => updateRowField(row.dayNum, 'manzil_page_range', e.target.value)}
                                  className="w-full text-center text-[10px] font-bold bg-white border border-amber-300 rounded px-1 py-0.5 text-amber-950"
                                />
                              ) : isTeacherOrAdmin ? (
                                <select
                                  value={row.manzil_quarter || '১-৫'}
                                  onChange={(e) => updateRowField(row.dayNum, 'manzil_quarter', e.target.value)}
                                  className="w-full text-center text-[10px] font-bold bg-transparent hover:bg-amber-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 rounded py-0.5 cursor-pointer text-amber-950"
                                  title={row.manzil_page_range || computeManzilRange(row.manzil_para || '৩', row.manzil_quarter || '১-৫', row.manzil_amount || '৫ পৃষ্ঠা')}
                                >
                                  <option value="১-৫">১–৫ পৃষ্ঠা</option>
                                  <option value="৬-১০">৬–১০ পৃষ্ঠা</option>
                                  <option value="১১-১৫">১১–১৫ পৃষ্ঠা</option>
                                  <option value="১৬-২০">১৬–২০ পৃষ্ঠা</option>
                                </select>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-950">{row.manzil_quarter}</span>
                              )}
                              {isTeacherOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => toggleCustomMode(row.dayNum, 'manzil')}
                                  className="text-amber-500 hover:text-amber-800 cursor-pointer shrink-0"
                                  title={row.manzil_custom ? 'স্বয়ংক্রিয় মোডে ফিরুন' : 'কাস্টম পৃষ্ঠা রেঞ্জ লিখুন'}
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* ভুল (+ Red Flag) */}
                          <td className={cn(
                            'py-1 px-1 border-r-2 border-amber-400 font-bold text-center',
                            isManzilRedFlag ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-400' : 'bg-amber-100/80',
                          )}>
                            {isTeacherOrAdmin ? (
                              <input
                                type="number"
                                min="0"
                                value={row.manzil_mistakes}
                                onChange={(e) => updateRowField(row.dayNum, 'manzil_mistakes', Number(e.target.value))}
                                className={cn(
                                  'w-8 text-center font-bold bg-transparent focus:bg-white focus:outline-none rounded py-0.5',
                                  isManzilRedFlag ? 'text-rose-700 font-black' : row.manzil_mistakes > 0 ? 'text-amber-700 font-bold' : 'text-slate-600',
                                )}
                                title={isManzilRedFlag ? 'সতর্কতা: আমোক্তায় ২টির বেশি ভুল (রেড ফ্ল্যাগ)' : undefined}
                              />
                            ) : (
                              <span className={isManzilRedFlag ? 'text-rose-700 font-black' : row.manzil_mistakes > 0 ? 'text-amber-700' : 'text-slate-600'}>
                                {row.manzil_mistakes}
                              </span>
                            )}
                          </td>

                          {/* ── ৪. তেলাওয়াত ও নামাজ (Hifz - Emerald Column Lane) ── */}
                          {/* সাধারণ তেলাওয়াত */}
                          <td className="py-1 px-1 border-r border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/60 text-emerald-950 text-center">
                            {isTeacherOrAdmin ? (
                              <select
                                value={row.tilawat_amount}
                                onChange={(e) => updateRowField(row.dayNum, 'tilawat_amount', e.target.value)}
                                className="w-full text-center font-medium bg-transparent hover:bg-emerald-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded py-0.5 cursor-pointer text-[11px] text-emerald-950"
                                title={prevRow ? `গতকাল: ${prevRow.tilawat_amount}` : 'সাধারণ তেলাওয়াত'}
                              >
                                {TILAWAT_AMOUNTS.map((amt) => (
                                  <option key={amt} value={amt}>{amt}</option>
                                ))}
                              </select>
                            ) : (
                              row.tilawat_amount
                            )}
                          </td>

                          {/* নামাজে তিল: */}
                          <td className="py-1 px-1 border-r-2 border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100/60 text-emerald-950 text-center">
                            {isTeacherOrAdmin ? (
                              <select
                                value={row.salah_tilawat_amount}
                                onChange={(e) => updateRowField(row.dayNum, 'salah_tilawat_amount', e.target.value)}
                                className="w-full text-center font-medium bg-transparent hover:bg-emerald-100/80 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded py-0.5 cursor-pointer text-[11px] text-emerald-950"
                                title={prevRow ? `গতকাল: ${prevRow.salah_tilawat_amount}` : 'নামাজে তেলাওয়াত'}
                              >
                                {SALAH_TILAWAT_AMOUNTS.map((amt) => (
                                  <option key={amt} value={amt}>{amt}</option>
                                ))}
                              </select>
                            ) : (
                              row.salah_tilawat_amount
                            )}
                          </td>
                        </>
                      )}

                      {/* মান / পয়েন্ট (Dropdown + Live Net Points) */}
                      <td className="py-1.5 px-2 border-r border-slate-200 bg-teal-50/20 text-center">
                        {isTeacherOrAdmin ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <select
                              value={row.grade}
                              onChange={(e) => updateRowField(row.dayNum, 'grade', e.target.value as SabaqGrade)}
                              className="w-full max-w-[105px] mx-auto text-[11px] font-bold rounded border border-slate-300 bg-white px-1 py-0.5 text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500 text-center"
                            >
                              <option value="mumtaz">🌟 মুমতাজ</option>
                              <option value="jayyid_jiddan">✨ জায়্যিদ জিদ্দান</option>
                              <option value="jayyid">👍 জায়্যিদ</option>
                              <option value="maqbool">👌 মাকবুল</option>
                            </select>
                            <span className="text-[10px] font-mono text-emerald-800 font-bold" title={`মোট ভুল: ${totalMistakes}টি (-${totalMistakes * 2} 💎)`}>
                              {netDiamonds} 💎
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-slate-800">
                              {row.grade === 'mumtaz'
                                ? '🌟 মুমতাজ'
                                : row.grade === 'jayyid_jiddan'
                                  ? '✨ জায়্যিদ জিদ্দান'
                                  : row.grade === 'jayyid'
                                    ? '👍 জায়্যিদ'
                                    : '👌 মাকবুল'}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-700 font-bold">
                              {netDiamonds} 💎
                            </span>
                          </div>
                        )}
                      </td>

                      {/* স্বাক্ষর (উস্তাদ) */}
                      <td className="py-1.5 px-1 text-center bg-teal-50/10">
                        <span className="inline-block px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                          ✓ {row.teacher_name || activeBatch.defaultTeacher}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* ── 2. MOBILE & DESKTOP SMART CARD VIEW (FULL INTERACTIVE DROPDOWNS & RED FLAGS) ── */
        <div className="space-y-2.5">
          {displayedRows.map((row, idx) => {
            const isExpanded = expandedMobileDay === row.dayNum
            const prevRow = idx > 0 ? displayedRows[idx - 1] : (dateRangeTab === 'second_half' ? logRows[14] : null)
            const isSabaqRedFlag = row.sabaq_mistakes > 3
            const isSabqiRedFlag = !isNajera && row.sabqi_mistakes > 3
            const isManzilRedFlag = !isNajera && row.manzil_mistakes > 2
            const isPuratanRedFlag = isNajera && (row.puratan_mistakes || 0) > 3

            const hasAnyRedFlag = isNajera
              ? isSabaqRedFlag || isPuratanRedFlag
              : isSabaqRedFlag || isSabqiRedFlag || isManzilRedFlag

            const totalMistakes = isNajera
              ? row.sabaq_mistakes + (row.puratan_mistakes || 0)
              : row.sabaq_mistakes + row.sabqi_mistakes + row.manzil_mistakes

            const tajweedPoints = isNajera ? (row.tajweed_points || 0) : 0
            const netDiamonds = calculateNetDiamonds(row.grade, totalMistakes, tajweedPoints)

            const sabqiComputedRange = row.sabqi_page_range || computeSatSabakRange(row.sabaq_para, row.sabaq_page, row.sabqi_amount)
            const manzilComputedRange = row.manzil_page_range || computeManzilRange(row.manzil_para || '৩', row.manzil_quarter || '১-৫', row.manzil_amount || '৫ পৃষ্ঠা')

            return (
              <Card
                key={row.dayNum}
                className={cn(
                  'rounded-2xl border transition-all overflow-hidden',
                  hasAnyRedFlag
                    ? 'border-rose-400 bg-rose-50/20 shadow-xs'
                    : isExpanded
                      ? 'border-emerald-400 bg-surface shadow-xs ring-1 ring-emerald-400/20'
                      : 'border-border bg-bg/50',
                )}
              >
                {/* Accordion Summary Header matching reference design */}
                <div className="px-3.5 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50/70 border-b border-slate-200">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {/* Date Circle */}
                      <div className={cn(
                        'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-white flex flex-col items-center justify-center shrink-0 shadow-xs font-bold',
                        hasAnyRedFlag ? 'bg-rose-600' : 'bg-emerald-700',
                      )}>
                        <span className="text-sm sm:text-base leading-none">{row.dayNum}</span>
                        <span className="text-[9px] font-medium opacity-90 mt-0.5">নভে</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Row 1: Day & Date */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm sm:text-base font-bold text-slate-900">{row.dayName}বার</span>
                            <span className="text-xs font-medium text-slate-400">• {toBn(parseInt(row.dayNum, 10))} নভেম্বর ২০২৬</span>
                          </div>
                        </div>

                        {/* Row 2: Status Pills (Grade, Points, Red Flag) */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200/80">
                            {row.grade === 'mumtaz'
                              ? '🌟 মুমতাজ'
                              : row.grade === 'jayyid_jiddan'
                                ? '✨ জায়্যিদ জিদ্দান'
                                : row.grade === 'jayyid'
                                  ? '👍 জায়্যিদ'
                                  : '👌 মাকবুল'}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 font-mono">
                            {toBn(netDiamonds)} 💎
                          </span>

                          {hasAnyRedFlag && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> রেড ফ্ল্যাগ
                            </span>
                          )}
                        </div>

                        {/* Row 3: Quick Summary Line */}
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2 sm:truncate">
                          {isNajera ? (
                            <>সবক: পারা/সুরা {row.sabaq_para}, পৃ {row.sabaq_page} ({row.sabaq_amount}) • ভুল: {toBn(row.sabaq_mistakes)} | পুরাতন সবক: {row.puratan_amount || '২ পৃষ্ঠা'} • ভুল: {toBn(row.puratan_mistakes || 0)} | তাজবীদ: {row.tajweed_quality || 'বিশুদ্ধ পাঠ'} ({tajweedPoints >= 0 ? '+' : ''}{toBn(tajweedPoints)} 💎)</>
                          ) : (
                            <>সবক: পারা {row.sabaq_para}, পৃ {row.sabaq_page} ({row.sabaq_amount}) • ভুল: {toBn(row.sabaq_mistakes)} | সাত সবক: {row.sabqi_amount} • ভুল: {toBn(row.sabqi_mistakes)} | আমোক্তা: {manzilComputedRange} • ভুল: {toBn(row.manzil_mistakes)}</>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right: Main Collapse Button */}
                    <button
                      type="button"
                      onClick={() => setExpandedMobileDay(isExpanded ? null : row.dayNum)}
                      title="সম্পূর্ণ শিট ভাঁজ/খুলুন"
                      className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shrink-0 mt-0.5 cursor-pointer shadow-3xs"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Full Details Panel */}
                {isExpanded && (
                  <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 bg-slate-50/40">
                    {/* Student Info & Global Warning Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs sm:text-sm font-bold text-slate-800">{activeStudent.name}</span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">রোল: {activeStudent.roll}</span>
                      </div>

                      {hasAnyRedFlag && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <span>সীমার অতিরিক্ত ভুল থাকায় রেড ফ্ল্যাগ সক্রিয়</span>
                        </div>
                      )}
                    </div>

                    {/* Main Boxes Grid: 3-Columns for Najera, 4-Columns for Hifz */}
                    <div className={cn(
                      'grid gap-3.5 items-stretch',
                      isNajera
                        ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
                    )}>
                      {/* ── BOX 1: ১. আজকের সবক (Sky Blue Theme - Common for both) ── */}
                      <div className={cn(
                        'rounded-2xl border-2 transition-all shadow-xs overflow-hidden flex flex-col justify-between bg-white',
                        isSabaqRedFlag ? 'border-rose-400 ring-2 ring-rose-300/40' : 'border-sky-300 hover:border-sky-400 hover:shadow-sm',
                      )}>
                        <div>
                          {/* Header Strip with Sky Accent */}
                          <div className={cn(
                            'px-3.5 py-2.5 border-b flex items-center justify-between gap-2',
                            isSabaqRedFlag ? 'bg-rose-50 border-rose-200' : 'bg-sky-100/80 border-sky-200',
                          )}>
                            <div
                              onClick={() => toggleSubCard(row.dayNum, 'sabak')}
                              className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-3xs">
                                <BookOpen className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  <h3 className="text-sm font-extrabold text-sky-950 leading-tight group-hover:text-sky-700 transition-colors">১. আজকের সবক</h3>
                                  {isSubCardOpen(row.dayNum, 'sabak') ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-sky-600 transition-transform" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-sky-600 transition-transform" />
                                  )}
                                </div>
                                <p className="text-[11px] text-sky-800 mt-0.5 truncate font-medium">
                                  {isSubCardOpen(row.dayNum, 'sabak')
                                    ? (prevRow ? `গতকাল: পা-${prevRow.sabaq_para}, পৃ-${prevRow.sabaq_page} (${prevRow.sabaq_amount})` : 'প্রথম দিনের সবক')
                                    : (row.sabaq_amount === 'সবক বন্ধ / রিভিশন' ? 'আজ: সবক বন্ধ (রিভিশন)' : `আজ: পা-${row.sabaq_para}, পৃ-${row.sabaq_page} (${row.sabaq_amount})`)}
                                </p>
                              </div>
                            </div>

                            {/* Compact Mistake Counter */}
                            <div className="flex flex-col items-end shrink-0">
                              <div className={cn(
                                'flex items-center rounded-lg p-0.5 border shadow-2xs',
                                isSabaqRedFlag ? 'bg-white border-rose-300' : 'bg-white border-sky-300',
                              )}>
                                {isTeacherOrAdmin ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => updateRowField(row.dayNum, 'sabaq_mistakes', Math.max(0, row.sabaq_mistakes - 1))}
                                      className="w-6 h-6 flex items-center justify-center rounded-md text-sky-700 hover:bg-sky-100 font-bold text-xs transition-colors cursor-pointer"
                                      title="ভুল কমান"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      value={row.sabaq_mistakes}
                                      min={0}
                                      onChange={(e) => updateRowField(row.dayNum, 'sabaq_mistakes', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                      className={cn(
                                        'w-7 text-center bg-transparent text-xs font-bold focus:outline-none',
                                        isSabaqRedFlag ? 'text-rose-600 font-black' : 'text-sky-950',
                                      )}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateRowField(row.dayNum, 'sabaq_mistakes', row.sabaq_mistakes + 1)}
                                      className="w-6 h-6 flex items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                                      title="ভুল বাড়ান"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : (
                                  <span className="font-mono font-bold text-xs px-2 py-0.5 text-slate-700">{row.sabaq_mistakes}টি</span>
                                )}
                              </div>
                              {isSabaqRedFlag && (
                                <span className="mt-0.5 text-[10px] font-bold text-rose-600 flex items-center gap-0.5 animate-pulse">
                                  <AlertTriangle className="w-2.5 h-2.5" /> ৩+ ভুল (রেড ফ্ল্যাগ)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Collapsible Body */}
                          {isSubCardOpen(row.dayNum, 'sabak') && (
                            <div className="p-3.5 bg-sky-50/20 space-y-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-sky-950 mb-1">পরিমাণ / অবস্থা:</label>
                                <select
                                  value={row.sabaq_amount}
                                  disabled={!isTeacherOrAdmin}
                                  onChange={(e) => updateRowField(row.dayNum, 'sabaq_amount', e.target.value)}
                                  className="w-full h-9 px-2.5 rounded-xl border border-sky-300 bg-white text-xs font-semibold text-slate-800 focus:border-sky-600 focus:outline-none transition-colors cursor-pointer shadow-3xs"
                                >
                                  {SABAQ_AMOUNTS.map((amt) => (
                                    <option key={amt} value={amt}>{amt}</option>
                                  ))}
                                </select>
                              </div>

                              <div className={cn('grid grid-cols-2 gap-2 transition-opacity', row.sabaq_amount === 'সবক বন্ধ / রিভিশন' && 'opacity-45 pointer-events-none')}>
                                <div>
                                  <label className="block text-[11px] font-bold text-sky-950 mb-1">পারা / সুরা (১–৩০):</label>
                                  <select
                                    value={row.sabaq_para}
                                    disabled={!isTeacherOrAdmin || row.sabaq_amount === 'সবক বন্ধ / রিভিশন'}
                                    onChange={(e) => updateRowField(row.dayNum, 'sabaq_para', e.target.value)}
                                    className="w-full h-9 px-2.5 rounded-xl border border-sky-300 bg-white text-xs font-semibold text-slate-800 focus:border-sky-600 focus:outline-none cursor-pointer shadow-3xs"
                                  >
                                    {BN_PARAS.map((p) => (
                                      <option key={p} value={p}>পারা {p}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-sky-950 mb-1">পৃষ্ঠা (১–২০):</label>
                                  <select
                                    value={row.sabaq_page}
                                    disabled={!isTeacherOrAdmin || row.sabaq_amount === 'সবক বন্ধ / রিভিশন'}
                                    onChange={(e) => updateRowField(row.dayNum, 'sabaq_page', e.target.value)}
                                    className="w-full h-9 px-2.5 rounded-xl border border-sky-300 bg-white text-xs font-semibold text-slate-800 focus:border-sky-600 focus:outline-none cursor-pointer shadow-3xs"
                                  >
                                    {BN_PAGES.map((pg) => (
                                      <option key={pg} value={pg}>পৃষ্ঠা {pg}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-sky-100 flex items-center justify-between text-[11px] text-sky-800">
                                <span>সীমা: সর্বোচ্চ ৩টি ভুল</span>
                                <span className={cn('font-semibold px-2 py-0.5 rounded-md text-[10px]', row.sabaq_amount === 'সবক বন্ধ / রিভিশন' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800 border border-sky-200')}>
                                  {row.sabaq_amount === 'সবক বন্ধ / রিভিশন' ? 'সবক বন্ধ (রিভিশন চলছে)' : 'নিয়মিত সবক'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── NAJERA BRANCH: পুরাতন সবক + তাজবীদ ও তারতীল ── */}
                      {isNajera ? (
                        <>
                          {/* ── BOX 2: ২. পুরাতন সবক (Indigo/Purple Theme) ── */}
                          <div className={cn(
                            'rounded-2xl border-2 transition-all shadow-xs overflow-hidden flex flex-col justify-between bg-white',
                            isPuratanRedFlag ? 'border-rose-400 ring-2 ring-rose-300/40' : 'border-indigo-300 hover:border-indigo-400 hover:shadow-sm',
                          )}>
                            <div>
                              {/* Header Strip with Indigo Accent */}
                              <div className={cn(
                                'px-3.5 py-2.5 border-b flex items-center justify-between gap-2',
                                isPuratanRedFlag ? 'bg-rose-50 border-rose-200' : 'bg-indigo-100/80 border-indigo-200',
                              )}>
                                <div
                                  onClick={() => toggleSubCard(row.dayNum, 'puratan')}
                                  className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 group"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-3xs">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                      <h3 className="text-sm font-extrabold text-indigo-950 leading-tight group-hover:text-indigo-700 transition-colors">২. পুরাতন সবক</h3>
                                      {isSubCardOpen(row.dayNum, 'puratan') ? (
                                        <ChevronUp className="w-3.5 h-3.5 text-indigo-600 transition-transform" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600 transition-transform" />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-indigo-800 mt-0.5 truncate font-medium">
                                      {isSubCardOpen(row.dayNum, 'puratan')
                                        ? (prevRow ? `গতকাল: ${prevRow.puratan_amount || '২ পৃষ্ঠা'} (ভুল: ${toBn(prevRow.puratan_mistakes || 0)})` : 'পূর্ববর্তী রেকর্ড নেই')
                                        : `আজ: ${row.puratan_amount || '২ পৃষ্ঠা'}, পৃ-${row.puratan_page || '৫'}`}
                                    </p>
                                  </div>
                                </div>

                                {/* Compact Mistake Counter */}
                                <div className="flex flex-col items-end shrink-0">
                                  <div className={cn(
                                    'flex items-center rounded-lg p-0.5 border shadow-2xs',
                                    isPuratanRedFlag ? 'bg-white border-rose-300' : 'bg-white border-indigo-300',
                                  )}>
                                    {isTeacherOrAdmin ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => updateRowField(row.dayNum, 'puratan_mistakes', Math.max(0, (row.puratan_mistakes || 0) - 1))}
                                          className="w-6 h-6 flex items-center justify-center rounded-md text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition-colors cursor-pointer"
                                          title="ভুল কমান"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <input
                                          type="number"
                                          value={row.puratan_mistakes ?? 0}
                                          min={0}
                                          onChange={(e) => updateRowField(row.dayNum, 'puratan_mistakes', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                          className={cn(
                                            'w-7 text-center bg-transparent text-xs font-bold focus:outline-none',
                                            isPuratanRedFlag ? 'text-rose-600 font-black' : 'text-indigo-950',
                                          )}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => updateRowField(row.dayNum, 'puratan_mistakes', (row.puratan_mistakes || 0) + 1)}
                                          className="w-6 h-6 flex items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                                          title="ভুল বাড়ান"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </>
                                    ) : (
                                      <span className="font-mono font-bold text-xs px-2 py-0.5 text-slate-700">{row.puratan_mistakes || 0}টি</span>
                                    )}
                                  </div>
                                  {isPuratanRedFlag && (
                                    <span className="mt-0.5 text-[10px] font-bold text-rose-600 flex items-center gap-0.5 animate-pulse">
                                      <AlertTriangle className="w-2.5 h-2.5" /> ৩+ ভুল (রেড ফ্ল্যাগ)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Collapsible Body */}
                              {isSubCardOpen(row.dayNum, 'puratan') && (
                                <div className="p-3.5 bg-indigo-50/20 space-y-2.5">
                                  <div>
                                    <label className="block text-[11px] font-bold text-indigo-950 mb-1">পুরাতন সবক পরিমাণ:</label>
                                    <select
                                      value={row.puratan_amount || '২ পৃষ্ঠা'}
                                      disabled={!isTeacherOrAdmin}
                                      onChange={(e) => updateRowField(row.dayNum, 'puratan_amount', e.target.value)}
                                      className="w-full h-9 px-2.5 rounded-xl border border-indigo-300 bg-white text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none cursor-pointer shadow-3xs"
                                    >
                                      {PURATAN_AMOUNTS.map((amt) => (
                                        <option key={amt} value={amt}>{amt}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[11px] font-bold text-indigo-950 mb-1">পারা / কায়দা:</label>
                                      <select
                                        value={row.puratan_para || '১'}
                                        disabled={!isTeacherOrAdmin}
                                        onChange={(e) => updateRowField(row.dayNum, 'puratan_para', e.target.value)}
                                        className="w-full h-9 px-2.5 rounded-xl border border-indigo-300 bg-white text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none cursor-pointer shadow-3xs"
                                      >
                                        {BN_PARAS.map((p) => (
                                          <option key={p} value={p}>পারা {p}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-bold text-indigo-950 mb-1">পৃষ্ঠা (১–২০):</label>
                                      <select
                                        value={row.puratan_page || '৫'}
                                        disabled={!isTeacherOrAdmin}
                                        onChange={(e) => updateRowField(row.dayNum, 'puratan_page', e.target.value)}
                                        className="w-full h-9 px-2.5 rounded-xl border border-indigo-300 bg-white text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none cursor-pointer shadow-3xs"
                                      >
                                        {BN_PAGES.map((pg) => (
                                          <option key={pg} value={pg}>পৃষ্ঠা {pg}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-[11px] text-indigo-800">
                                    <span>সীমা: সর্বোচ্চ ৩টি ভুল</span>
                                    <span className="bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-md text-[10px] border border-indigo-200">নাজেরা রিভিশন</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ── BOX 3: ৩. তাজবীদ ও তারতীল (Amber/Gold Theme - EXACT MATCH TO USER IMAGE 2 & 3) ── */}
                          {(() => {
                            const curTajweedPts = Number(row.tajweed_points || 0)
                            const isTajweedPos = curTajweedPts > 0
                            const isTajweedNeg = curTajweedPts < 0

                            return (
                              <div className="rounded-2xl border-2 border-amber-300 hover:border-amber-400 bg-white overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
                                <div>
                                  {/* Header Strip matching Image 1 & 2 */}
                                  <div
                                    onClick={() => toggleSubCard(row.dayNum, 'tajweed')}
                                    className="px-3.5 py-2.5 border-b border-amber-200 bg-amber-100/80 flex items-center justify-between gap-2 cursor-pointer group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-3xs">
                                        <Sparkles className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1">
                                          <h3 className="text-sm font-extrabold text-amber-950 leading-tight group-hover:text-amber-800 transition-colors">৩. তাজবীদ ও তারতীল</h3>
                                          {isSubCardOpen(row.dayNum, 'tajweed') ? (
                                            <ChevronUp className="w-3.5 h-3.5 text-amber-700 transition-transform" />
                                          ) : (
                                            <ChevronDown className="w-3.5 h-3.5 text-amber-700 transition-transform" />
                                          )}
                                        </div>
                                        <p className="text-[11px] text-amber-800 mt-0.5 truncate font-medium">
                                          {prevRow
                                            ? `গতকাল: ${prevRow.tajweed_quality || 'ভালো পড়েছে'} (${Number(prevRow.tajweed_points || 0) > 0 ? '+' : ''}${toBn(prevRow.tajweed_points || 0)} 💎)`
                                            : 'গতকাল: ভালো পড়েছে (+২ 💎)'}
                                        </p>
                                      </div>
                                    </div>
                                    <span className={cn(
                                      'px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono shrink-0 shadow-2xs',
                                      isTajweedPos ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                      isTajweedNeg ? 'bg-rose-50 text-rose-600 border-rose-300' :
                                      'bg-slate-100 text-slate-700 border-slate-200',
                                    )}>
                                      {isTajweedPos ? `+${toBn(curTajweedPts)}` : isTajweedNeg ? `-${toBn(Math.abs(curTajweedPts))}` : '০'} 💎
                                    </span>
                                  </div>

                                  {/* Collapsible Body matching Image 2 & 3 */}
                                  {isSubCardOpen(row.dayNum, 'tajweed') && (
                                    <div className="p-3.5 bg-amber-50/20 space-y-3">
                                      <div>
                                        <label className="block text-[11px] font-bold text-amber-950 mb-1">আজকের তিলাওয়াতের মান:</label>
                                        <select
                                          value={row.tajweed_quality || '✨ সুন্দর ও বিশুদ্ধ পাঠ'}
                                          disabled={!isTeacherOrAdmin}
                                          onChange={(e) => {
                                            const val = e.target.value
                                            updateRowField(row.dayNum, 'tajweed_quality', val)
                                            const preset = TAJWEED_QUALITY_PRESETS.find((p) => p.value === val)
                                            if (preset !== undefined) {
                                              updateRowField(row.dayNum, 'tajweed_points', preset.points)
                                            }
                                          }}
                                          className="w-full h-10 px-3 rounded-xl border border-amber-300 bg-white text-xs font-bold text-slate-800 focus:border-amber-600 focus:outline-none cursor-pointer shadow-3xs"
                                        >
                                          {TAJWEED_QUALITY_PRESETS.map((p) => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* উস্তাদের তাৎক্ষণিক পয়েন্ট (+/-) with quick buttons and reset */}
                                      <div className="rounded-xl bg-slate-50/90 border border-slate-200/90 p-2 sm:p-2.5 shadow-3xs">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-bold text-slate-700">উস্তাদের পয়েন্ট:</span>
                                            <span className={cn(
                                              'text-xs font-mono font-black px-1.5 py-0.2 rounded',
                                              isTajweedPos ? 'text-emerald-700 bg-emerald-50' :
                                              isTajweedNeg ? 'text-rose-700 bg-rose-50' :
                                              'text-slate-700 bg-slate-100',
                                            )}>
                                              {isTajweedPos ? `+${toBn(curTajweedPts)}` : isTajweedNeg ? `-${toBn(Math.abs(curTajweedPts))}` : '০'} 💎
                                            </span>
                                          </div>
                                          {isTeacherOrAdmin && (
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() => updateRowField(row.dayNum, 'tajweed_points', curTajweedPts - 1)}
                                                className="w-5 h-5 flex items-center justify-center rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                                                title="১ পয়েন্ট কমান"
                                              >
                                                -
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => updateRowField(row.dayNum, 'tajweed_points', curTajweedPts + 1)}
                                                className="w-5 h-5 flex items-center justify-center rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                                                title="১ পয়েন্ট বাড়ান"
                                              >
                                                +
                                              </button>
                                              <span className="text-slate-300 mx-0.5">|</span>
                                              <button
                                                type="button"
                                                onClick={() => updateRowField(row.dayNum, 'tajweed_points', 0)}
                                                className="text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                              >
                                                রিসেট
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {/* 7 Interactive Quick Point Buttons (Guaranteed 100% responsive via grid-cols-7, no overflow) */}
                                        <div className="grid grid-cols-7 gap-1 w-full max-w-full">
                                          {[-5, -2, -1, 0, 1, 2, 5].map((pts) => {
                                            const isSelected = curTajweedPts === pts
                                            const isNegative = pts < 0
                                            const isZero = pts === 0
                                            return (
                                              <button
                                                key={pts}
                                                type="button"
                                                disabled={!isTeacherOrAdmin}
                                                onClick={() => updateRowField(row.dayNum, 'tajweed_points', pts)}
                                                className={cn(
                                                  'w-full min-w-0 h-8 sm:h-8.5 rounded-lg text-[10px] sm:text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer p-0 select-none truncate',
                                                  isSelected
                                                    ? isNegative
                                                      ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-400'
                                                      : isZero
                                                        ? 'bg-slate-800 text-white shadow-xs ring-1 ring-slate-400'
                                                        : 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                                                    : isNegative
                                                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                                      : isZero
                                                        ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
                                                )}
                                              >
                                                {pts > 0 ? `+${toBn(pts)}` : pts < 0 ? `-${toBn(Math.abs(pts))}` : '০'}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      </div>

                                      <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-800">
                                        <span>ভালো পড়লে বোনাস, মন্দ হলে মাইনাস</span>
                                        <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-[10px]">তাৎক্ষণিক মার্কিং</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })()}
                        </>
                      ) : (
                        <>
                          {/* ── HIFZ BRANCH: ২. সাত সবক, ৩. আমোক্তা, ৪. তেলাওয়াত ও নামাজ ── */}
                          {/* ── BOX 2: ২. সাত সবক (Indigo/Purple Theme) ── */}
                          <div className={cn(
                            'rounded-2xl border-2 transition-all shadow-xs overflow-hidden flex flex-col justify-between bg-white',
                            isSabqiRedFlag ? 'border-rose-400 ring-2 ring-rose-300/40' : 'border-indigo-300 hover:border-indigo-400 hover:shadow-sm',
                          )}>
                            <div>
                              {/* Header Strip with Indigo Accent */}
                              <div className={cn(
                                'px-3.5 py-2.5 border-b flex items-center justify-between gap-2',
                                isSabqiRedFlag ? 'bg-rose-50 border-rose-200' : 'bg-indigo-100/80 border-indigo-200',
                              )}>
                                <div
                                  onClick={() => toggleSubCard(row.dayNum, 'satSabak')}
                                  className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 group"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-3xs">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                      <h3 className="text-sm font-extrabold text-indigo-950 leading-tight group-hover:text-indigo-700 transition-colors">২. সাত সবক</h3>
                                      {isSubCardOpen(row.dayNum, 'satSabak') ? (
                                        <ChevronUp className="w-3.5 h-3.5 text-indigo-600 transition-transform" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-indigo-600 transition-transform" />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-indigo-800 mt-0.5 truncate font-medium">
                                      {isSubCardOpen(row.dayNum, 'satSabak')
                                        ? (prevRow ? `গতকাল: ${prevRow.sabqi_amount} (ভুল: ${toBn(prevRow.sabqi_mistakes)})` : 'পূর্ববর্তী রেকর্ড নেই')
                                        : `আজ: ${row.sabqi_amount} • ${sabqiComputedRange}`}
                                    </p>
                                  </div>
                                </div>

                                {/* Compact Mistake Counter */}
                                <div className="flex flex-col items-end shrink-0">
                                  <div className={cn(
                                    'flex items-center rounded-lg p-0.5 border shadow-2xs',
                                    isSabqiRedFlag ? 'bg-white border-rose-300' : 'bg-white border-indigo-300',
                                  )}>
                                    {isTeacherOrAdmin ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => updateRowField(row.dayNum, 'sabqi_mistakes', Math.max(0, row.sabqi_mistakes - 1))}
                                          className="w-6 h-6 flex items-center justify-center rounded-md text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition-colors cursor-pointer"
                                          title="ভুল কমান"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <input
                                          type="number"
                                          value={row.sabqi_mistakes}
                                          min={0}
                                          onChange={(e) => updateRowField(row.dayNum, 'sabqi_mistakes', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                          className={cn(
                                            'w-7 text-center bg-transparent text-xs font-bold focus:outline-none',
                                            isSabqiRedFlag ? 'text-rose-600 font-black' : 'text-indigo-950',
                                          )}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => updateRowField(row.dayNum, 'sabqi_mistakes', row.sabqi_mistakes + 1)}
                                          className="w-6 h-6 flex items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                                          title="ভুল বাড়ান"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </>
                                    ) : (
                                      <span className="font-mono font-bold text-xs px-2 py-0.5 text-slate-700">{row.sabqi_mistakes}টি</span>
                                    )}
                                  </div>
                                  {isSabqiRedFlag && (
                                    <span className="mt-0.5 text-[10px] font-bold text-rose-600 flex items-center gap-0.5 animate-pulse">
                                      <AlertTriangle className="w-2.5 h-2.5" /> ৩+ ভুল (রেড ফ্ল্যাগ)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Collapsible Body */}
                              {isSubCardOpen(row.dayNum, 'satSabak') && (
                                <div className="p-3.5 bg-indigo-50/20 space-y-2.5">
                                  <div>
                                    <label className="block text-[11px] font-bold text-indigo-950 mb-1">সাত সবক পরিমাণ (২–৭ পৃষ্ঠা):</label>
                                    <select
                                      value={row.sabqi_amount}
                                      disabled={!isTeacherOrAdmin}
                                      onChange={(e) => updateRowField(row.dayNum, 'sabqi_amount', e.target.value)}
                                      className="w-full h-9 px-2.5 rounded-xl border border-indigo-300 bg-white text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none cursor-pointer shadow-3xs"
                                    >
                                      {SABQI_AMOUNTS.map((amt) => (
                                        <option key={amt} value={amt}>{amt}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Auto-Calculated Page Range + Pencil Edit Button */}
                                  <div className="rounded-xl bg-white border border-indigo-200 p-2.5 shadow-3xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wide">স্বয়ংক্রিয় পৃষ্ঠা রেঞ্জ:</span>
                                      {isTeacherOrAdmin && (
                                        <button
                                          type="button"
                                          onClick={() => toggleCustomMode(row.dayNum, 'sabqi')}
                                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-indigo-200"
                                        >
                                          <Edit2 className="w-2.5 h-2.5" />
                                          <span>{row.sabqi_custom ? 'স্বয়ংক্রিয়' : 'এডিট'}</span>
                                        </button>
                                      )}
                                    </div>
                                    {row.sabqi_custom ? (
                                      <input
                                        type="text"
                                        value={row.sabqi_page_range || ''}
                                        onChange={(e) => updateRowField(row.dayNum, 'sabqi_page_range', e.target.value)}
                                        placeholder="যেমন: পারা ৭ (১৬-২০)"
                                        className="w-full h-7 px-2 rounded-lg border border-indigo-300 text-xs font-semibold text-slate-800 focus:outline-none"
                                      />
                                    ) : (
                                      <div className="text-xs font-extrabold text-indigo-950 font-mono">
                                        {sabqiComputedRange}
                                      </div>
                                    )}
                                  </div>

                                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-[11px] text-indigo-800">
                                    <span>সীমা: সর্বোচ্চ ৩টি ভুল</span>
                                    <span className="bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-md text-[10px] border border-indigo-200">অটো-ক্যালকুলেটেড</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ── BOX 3: ৩. আমোক্তা (Amber/Warm Gold Theme) ── */}
                          <div className={cn(
                            'rounded-2xl border-2 transition-all shadow-xs overflow-hidden flex flex-col justify-between bg-white',
                            isManzilRedFlag ? 'border-rose-400 ring-2 ring-rose-300/40' : 'border-amber-300 hover:border-amber-400 hover:shadow-sm',
                          )}>
                            <div>
                              {/* Header Strip with Amber Accent */}
                              <div className={cn(
                                'px-3.5 py-2.5 border-b flex items-center justify-between gap-2',
                                isManzilRedFlag ? 'bg-rose-50 border-rose-200' : 'bg-amber-100/80 border-amber-200',
                              )}>
                                <div
                                  onClick={() => toggleSubCard(row.dayNum, 'amokta')}
                                  className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 group"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-3xs">
                                    <BookOpen className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                      <h3 className="text-sm font-extrabold text-amber-950 leading-tight group-hover:text-amber-800 transition-colors">৩. আমোক্তা</h3>
                                      {isSubCardOpen(row.dayNum, 'amokta') ? (
                                        <ChevronUp className="w-3.5 h-3.5 text-amber-700 transition-transform" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-amber-700 transition-transform" />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-amber-850 mt-0.5 truncate font-medium">
                                      {isSubCardOpen(row.dayNum, 'amokta')
                                        ? (prevRow ? `গতকাল: পা-${prevRow.manzil_para || '১৬'}, পৃ-${prevRow.manzil_quarter || '৬-১০'} (${prevRow.manzil_amount || '১০ পৃষ্ঠা'})` : 'পূর্ববর্তী রেকর্ড নেই')
                                        : `আজ: ${manzilComputedRange}`}
                                    </p>
                                  </div>
                                </div>

                                {/* Compact Mistake Counter */}
                                <div className="flex flex-col items-end shrink-0">
                                  <div className={cn(
                                    'flex items-center rounded-lg p-0.5 border shadow-2xs',
                                    isManzilRedFlag ? 'bg-white border-rose-300' : 'bg-white border-amber-300',
                                  )}>
                                    {isTeacherOrAdmin ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => updateRowField(row.dayNum, 'manzil_mistakes', Math.max(0, row.manzil_mistakes - 1))}
                                          className="w-6 h-6 flex items-center justify-center rounded-md text-amber-800 hover:bg-amber-100 font-bold text-xs transition-colors cursor-pointer"
                                          title="ভুল কমান"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <input
                                          type="number"
                                          value={row.manzil_mistakes}
                                          min={0}
                                          onChange={(e) => updateRowField(row.dayNum, 'manzil_mistakes', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                          className={cn(
                                            'w-7 text-center bg-transparent text-xs font-bold focus:outline-none',
                                            isManzilRedFlag ? 'text-rose-600 font-black' : 'text-amber-950',
                                          )}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => updateRowField(row.dayNum, 'manzil_mistakes', row.manzil_mistakes + 1)}
                                          className="w-6 h-6 flex items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                                          title="ভুল বাড়ান"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </>
                                    ) : (
                                      <span className="font-mono font-bold text-xs px-2 py-0.5 text-slate-700">{row.manzil_mistakes}টি</span>
                                    )}
                                  </div>
                                  {isManzilRedFlag && (
                                    <span className="mt-0.5 text-[10px] font-bold text-rose-600 flex items-center gap-0.5 animate-pulse">
                                      <AlertTriangle className="w-2.5 h-2.5" /> ২+ ভুল (রেড ফ্ল্যাগ)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Collapsible Body */}
                              {isSubCardOpen(row.dayNum, 'amokta') && (
                                <div className="p-3.5 bg-amber-50/20 space-y-2.5">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[11px] font-bold text-amber-950 mb-1">পারা (১–৩০):</label>
                                      <select
                                        value={row.manzil_para || '৩'}
                                        disabled={!isTeacherOrAdmin}
                                        onChange={(e) => updateRowField(row.dayNum, 'manzil_para', e.target.value)}
                                        className="w-full h-9 px-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-800 focus:border-amber-600 focus:outline-none cursor-pointer shadow-3xs"
                                      >
                                        {BN_PARAS.map((p) => (
                                          <option key={p} value={p}>পারা {p}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-bold text-amber-950 mb-1">পৃষ্ঠা (১–২০):</label>
                                      <select
                                        value={row.manzil_quarter || '১-৫'}
                                        disabled={!isTeacherOrAdmin}
                                        onChange={(e) => updateRowField(row.dayNum, 'manzil_quarter', e.target.value)}
                                        className="w-full h-9 px-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-800 focus:border-amber-600 focus:outline-none cursor-pointer shadow-3xs"
                                      >
                                        <option value="১-৫">১–৫ পৃষ্ঠা</option>
                                        <option value="৬-১০">৬–১০ পৃষ্ঠা</option>
                                        <option value="১১-১৫">১১–১৫ পৃষ্ঠা</option>
                                        <option value="১৬-২০">১৬–২০ পৃষ্ঠা</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-amber-950 mb-1">আমোক্তা পরিমাণ:</label>
                                    <select
                                      value={row.manzil_amount || '৫ পৃষ্ঠা'}
                                      disabled={!isTeacherOrAdmin}
                                      onChange={(e) => updateRowField(row.dayNum, 'manzil_amount', e.target.value)}
                                      className="w-full h-9 px-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-800 focus:border-amber-600 focus:outline-none cursor-pointer shadow-3xs"
                                    >
                                      {MANZIL_AMOUNTS.map((amt) => (
                                        <option key={amt} value={amt}>{amt}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Fixed Range Preview + Pencil Edit */}
                                  <div className="rounded-xl bg-white border border-amber-200 p-2.5 shadow-3xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide">রেঞ্জ প্রিভিউ:</span>
                                      {isTeacherOrAdmin && (
                                        <button
                                          type="button"
                                          onClick={() => toggleCustomMode(row.dayNum, 'manzil')}
                                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-50 px-2 py-0.5 rounded-md cursor-pointer border border-amber-200"
                                        >
                                          <Edit2 className="w-2.5 h-2.5" />
                                          <span>{row.manzil_custom ? 'স্বয়ংক্রিয়' : 'এডিট'}</span>
                                        </button>
                                      )}
                                    </div>
                                    {row.manzil_custom ? (
                                      <input
                                        type="text"
                                        value={row.manzil_page_range || ''}
                                        onChange={(e) => updateRowField(row.dayNum, 'manzil_page_range', e.target.value)}
                                        placeholder="কাস্টম রেঞ্জ লিখুন..."
                                        className="w-full mt-1 h-7 px-2 rounded-lg border border-amber-300 text-xs font-semibold text-slate-800 focus:outline-none"
                                      />
                                    ) : (
                                      <div className="text-xs font-extrabold text-amber-950 mt-0.5 font-mono">
                                        {manzilComputedRange}
                                      </div>
                                    )}
                                  </div>

                                  <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-800">
                                    <span>সীমা: সর্বোচ্চ ২টি ভুল</span>
                                    <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md text-[10px] border border-amber-200">আমোক্তা রেকর্ড</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ── BOX 4: ৪. তেলাওয়াত ও নামাজ (Emerald Theme) ── */}
                          <div className="rounded-2xl border-2 border-emerald-300 hover:border-emerald-400 bg-white overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:shadow-sm">
                            <div>
                              {/* Header Strip with Emerald Accent */}
                              <div
                                onClick={() => toggleSubCard(row.dayNum, 'tilawat')}
                                className="px-3.5 py-2.5 border-b border-emerald-200 bg-emerald-100/80 flex items-center justify-between gap-2 cursor-pointer group"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-3xs">
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                      <h3 className="text-sm font-extrabold text-emerald-950 leading-tight group-hover:text-emerald-800 transition-colors">৪. তেলাওয়াত ও নামাজ</h3>
                                      {isSubCardOpen(row.dayNum, 'tilawat') ? (
                                        <ChevronUp className="w-3.5 h-3.5 text-emerald-700 transition-transform" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5 text-emerald-700 transition-transform" />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-emerald-800 mt-0.5 truncate font-medium">
                                      {isSubCardOpen(row.dayNum, 'tilawat')
                                        ? (prevRow ? `গতকাল: তেলাওয়াত ${prevRow.tilawat_amount}, নামাজ ${prevRow.salah_tilawat_amount}` : 'পূর্ববর্তী রেকর্ড নেই')
                                        : `আজ: সাধারণ ${row.tilawat_amount}, নামাজ ${row.salah_tilawat_amount}`}
                                    </p>
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300 shrink-0">
                                  দৈনিক আমল
                                </span>
                              </div>

                              {/* Collapsible Body */}
                              {isSubCardOpen(row.dayNum, 'tilawat') && (
                                <div className="p-3.5 bg-emerald-50/20 space-y-2.5">
                                  <div>
                                    <label className="block text-[11px] font-bold text-emerald-950 mb-1">সাধারণ তেলাওয়াত:</label>
                                    <select
                                      value={row.tilawat_amount}
                                      disabled={!isTeacherOrAdmin}
                                      onChange={(e) => updateRowField(row.dayNum, 'tilawat_amount', e.target.value)}
                                      className="w-full h-9 px-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none cursor-pointer shadow-3xs"
                                    >
                                      {TILAWAT_AMOUNTS.map((amt) => (
                                        <option key={amt} value={amt}>{amt}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-bold text-emerald-950 mb-1">নামাজে তেলাওয়াত:</label>
                                    <select
                                      value={row.salah_tilawat_amount}
                                      disabled={!isTeacherOrAdmin}
                                      onChange={(e) => updateRowField(row.dayNum, 'salah_tilawat_amount', e.target.value)}
                                      className="w-full h-9 px-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none cursor-pointer shadow-3xs"
                                    >
                                      {SALAH_TILAWAT_AMOUNTS.map((amt) => (
                                        <option key={amt} value={amt}>{amt}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800">
                                    <span>সুন্নাহ ও নফল আমল</span>
                                    <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md text-[10px] border border-emerald-200">ঐচ্ছিক রেকর্ড</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid items-start gap-3 lg:grid-cols-2">
                      <section className="rounded-xl border border-border bg-surface p-4">
                        <h3 className="text-sm font-semibold text-heading">হাজিরা</h3>
                        <p className="mt-1 text-xs text-muted">যাচাইকৃত ক্লাসের রোস্টারে সময়মতো, দেরি বা অনুপস্থিতি লিখুন। অনুমোদিত ছুটি ছুটির রেকর্ড থেকে আসে।</p>
                        <a className="mt-3 inline-block text-sm font-semibold text-primary-700 underline" href="#/attendance">ক্লাসের হাজিরা খুলুন</a>
                        <a className="ml-4 mt-3 inline-block text-sm font-semibold text-primary-700 underline" href="#/attendance/monthly">মাসিক হাজিরা</a>
                      </section>
                    {/* ── EVALUATION BOX: মান / গ্রেড মূল্যায়ন, ডায়মন্ড পয়েন্ট ও শিক্ষকের মন্তব্য ── */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                            <Trophy className="w-4 h-4 text-amber-600" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-800">
                            {isNajera ? '৪. মান / গ্রেড মূল্যায়ন, ডায়মন্ড পয়েন্ট ও শিক্ষকের মন্তব্য' : '৫. মান / গ্রেড মূল্যায়ন, ডায়মন্ড পয়েন্ট ও শিক্ষকের মন্তব্য'}
                          </h3>
                        </div>

                        {/* Live Net Diamond Points Pill */}
                        <div className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                          <span className="font-bold text-emerald-800">✨ নেট অর্জিত পয়েন্ট: <span className="text-sm font-mono">{toBn(netDiamonds)}</span> 💎</span>
                          {totalMistakes > 0 || (isNajera && tajweedPoints !== 0) ? (
                            <span className="text-[11px] font-semibold text-rose-600">
                              ({toBn(totalMistakes)}টি ভুলে -{toBn(totalMistakes * 2)} 💎{isNajera && tajweedPoints !== 0 ? `, তাজবীদ ${tajweedPoints > 0 ? '+' : ''}${toBn(tajweedPoints)} 💎` : ''})
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-600">(কোনো ভুল নেই — পূর্ণ পয়েন্ট!)</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        {/* Teacher Feedback (Top Full-Width Row on Mobile & Desktop) */}
                        <div className="md:col-span-12">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">টিচারের মন্তব্য / ফিডব্যাক:</label>
                          {isTeacherOrAdmin ? (
                            <input
                              type="text"
                              value={row.teacher_notes || ''}
                              onChange={(e) => updateRowField(row.dayNum, 'teacher_notes', e.target.value)}
                              placeholder="যেমন: মাশাআল্লাহ, সুন্দর তিলাওয়াত হয়েছে / মাখরাজে আরও যত্নবান হতে হবে..."
                              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                            />
                          ) : (
                            <p className="text-xs text-slate-700 italic bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                              {row.teacher_notes || 'কোনো মন্তব্য নেই'}
                            </p>
                          )}
                        </div>

                        {/* Grade Dropdown & Signatory Ustad Side-by-Side Row */}
                        <div className="grid grid-cols-2 md:col-span-12 gap-2.5 sm:gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">দৈনিক মান / গ্রেড:</label>
                            {isTeacherOrAdmin ? (
                              <select
                                value={row.grade}
                                onChange={(e) => updateRowField(row.dayNum, 'grade', e.target.value as SabaqGrade)}
                                className="w-full h-10 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
                              >
                                <option value="mumtaz">🌟 মুমতাজ (৪০ 💎)</option>
                                <option value="jayyid_jiddan">✨ জায়্যিদ জিদ্দান (৩০ 💎)</option>
                                <option value="jayyid">👍 জায়্যিদ (২৫ 💎)</option>
                                <option value="maqbool">👌 মাকবুল (২০ 💎)</option>
                              </select>
                            ) : (
                              <Badge variant="neutral" className="text-xs font-bold bg-emerald-50 text-emerald-900 border-emerald-300 py-1.5 px-3">
                                {row.grade === 'mumtaz'
                                  ? '🌟 মুমতাজ'
                                  : row.grade === 'jayyid_jiddan'
                                    ? '✨ জায়্যিদ জিদ্দান'
                                    : row.grade === 'jayyid'
                                      ? '👍 জায়্যিদ'
                                      : '👌 মাকবুল'}
                              </Badge>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1 truncate">স্বাক্ষরকারী উস্তাদ:</label>
                            {isTeacherOrAdmin ? (
                              <select
                                value={row.teacher_name || activeBatch.defaultTeacher}
                                onChange={(e) => updateRowField(row.dayNum, 'teacher_name', e.target.value)}
                                className="w-full h-10 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
                              >
                                {AVAILABLE_TEACHERS.map((teacher) => (
                                  <option key={teacher} value={teacher}>
                                    ✍️ {teacher}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {row.teacher_name || activeBatch.defaultTeacher} (স্বাক্ষরিত)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CENTERED SAVE & WHATSAPP ACTION BAR */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col items-center justify-center gap-2">
                        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-2.5 w-full sm:w-auto max-w-md mx-auto">
                          <button
                            type="button"
                            onClick={() => {
                              const sabakLine = row.sabaq_amount === 'সবক বন্ধ / রিভিশন'
                                ? 'সবক বন্ধ (রিভিশন)'
                                : `পারা/সুরা ${row.sabaq_para}, পৃষ্ঠা ${row.sabaq_page} (${row.sabaq_amount}) — ভুল: ${row.sabaq_mistakes}টি`
                              
                              const gradeLabel = row.grade === 'mumtaz'
                                ? '🌟 মুমতাজ'
                                : row.grade === 'jayyid_jiddan'
                                  ? '✨ জায়্যিদ জিদ্দান'
                                  : row.grade === 'jayyid'
                                    ? '👍 জায়্যিদ'
                                    : '👌 মাকবুল'

                              const report = isNajera ? [
                                `📖 *দৈনিক নাজেরা ও তাজবীদ রিপোর্ট — ${row.dayName}বার (${row.dateStr})*`,
                                `👤 *ছাত্র:* ${activeStudent.name} (রোল: ${activeStudent.roll})`,
                                `━━━━━━━━━━━━━━━━━━`,
                                `🔹 *১. আজকের সবক:* ${sabakLine}`,
                                `🔹 *২. পুরাতন সবক:* ${row.puratan_amount || '২ পৃষ্ঠা'} (পৃষ্ঠা ${row.puratan_page || '৫'}) — ভুল: ${toBn(row.puratan_mistakes || 0)}টি`,
                                `🔹 *৩. তাজবীদ ও তারতীল:* ${row.tajweed_quality || 'বিশুদ্ধ পাঠ'} (${(row.tajweed_points || 0) >= 0 ? '+' : ''}${toBn(row.tajweed_points || 0)} 💎)`,
                                `━━━━━━━━━━━━━━━━━━`,
                                `🏆 *দৈনিক মান:* ${gradeLabel} | *নেট পয়েন্ট:* ${toBn(netDiamonds)} 💎`,
                                row.teacher_notes ? `💬 *উস্তাদের মন্তব্য:* ${row.teacher_notes}` : null,
                                `✍️ *স্বাক্ষর:* ${row.teacher_name || activeBatch.defaultTeacher}`,
                              ].filter(Boolean).join('\n') : [
                                `📖 *দৈনিক হিফজ রিপোর্ট — ${row.dayName}বার (${row.dateStr})*`,
                                `👤 *ছাত্র:* ${activeStudent.name} (রোল: ${activeStudent.roll})`,
                                `━━━━━━━━━━━━━━━━━━`,
                                `🔹 *১. আজকের সবক:* ${sabakLine}`,
                                `🔹 *২. সাত সবক:* ${row.sabqi_amount} [${sabqiComputedRange}] — ভুল: ${row.sabqi_mistakes}টি`,
                                `🔹 *৩. আমোক্তা:* ${manzilComputedRange} (${row.manzil_amount}) — ভুল: ${row.manzil_mistakes}টি`,
                                `🔹 *৪. তেলাওয়াত:* সাধারণ ${row.tilawat_amount} | নামাজে ${row.salah_tilawat_amount}`,
                                `━━━━━━━━━━━━━━━━━━`,
                                `🏆 *দৈনিক মান:* ${gradeLabel} | *নেট পয়েন্ট:* ${toBn(netDiamonds)} 💎`,
                                row.teacher_notes ? `💬 *উস্তাদের মন্তব্য:* ${row.teacher_notes}` : null,
                                `✍️ *স্বাক্ষর:* ${row.teacher_name || activeBatch.defaultTeacher}`,
                              ].filter(Boolean).join('\n')

                              const ta = document.createElement('textarea')
                              ta.value = report
                              document.body.appendChild(ta)
                              ta.select()
                              document.execCommand('copy')
                              document.body.removeChild(ta)
                              toast.success('হোয়াটসঅ্যাপ রিপোর্ট ক্লিপবোর্ডে কপি হয়েছে!')
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-3xs"
                          >
                            <span className="text-emerald-600 text-sm">💬</span>
                            <span className="truncate">হোয়াটসঅ্যাপ রিপোর্ট</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* ── TEACHER ESCALATE TICKET MODAL ── */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-border max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-heading">জিম্মাদারকে সমস্যা এস্কেলেট করুন</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
                className="text-muted hover:text-heading cursor-pointer text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
              <span>শিক্ষার্থী: <strong>{activeStudent.name}</strong> (রোল {activeStudent.roll})</span>
              <span>ব্যাচ: <strong>{activeBatch.name}</strong></span>
            </div>

            <form onSubmit={handleCreateEscalationTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">কার কাছে পাঠাবেন?</label>
                <select
                  value={escalateTargetRole}
                  onChange={(e) => setEscalateTargetRole(e.target.value as 'zimmadar' | 'central_admin')}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-slate-50 cursor-pointer"
                >
                  <option value="zimmadar">শাখা জিম্মাদার (Zimmadar)</option>
                  <option value="central_admin">সুপার অ্যাডমিন / প্রিন্সিপাল (Super Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">জরুরিত্ব (Priority)</label>
                <select
                  value={escalatePriority}
                  onChange={(e) => setEscalatePriority(e.target.value as 'normal' | 'urgent')}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-slate-50 cursor-pointer"
                >
                  <option value="urgent">জরুরি (Urgent - দ্রুত ব্যবস্থা প্রয়োজন)</option>
                  <option value="normal">সাধারণ (Normal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">সমস্যার বিষয়</label>
                <input
                  type="text"
                  placeholder="যেমন: ৩ দিন ধরে ক্লাসে অনুপস্থিত / আমোক্তায় লাগাতার বেশি ভুল"
                  value={escalateSubject}
                  onChange={(e) => setEscalateSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">বিস্তারিত বিবরণ ও সুপারিশ</label>
                <textarea
                  rows={3}
                  placeholder="অভিভাবকের সাথে যোগাযোগের জন্য বিস্তারিত নোট বা পরামর্শ লিখুন..."
                  value={escalateDetails}
                  onChange={(e) => setEscalateDetails(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEscalateModal(false)} className="rounded-xl text-xs cursor-pointer">
                  বাতিল
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-xs">
                  <Send className="w-3.5 h-3.5" /> এস্কেলেট করুন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. PRINTABLE A4 REGISTER KHATA & PDF EXPORT MODAL ── */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 overflow-hidden">
            {/* Modal Controls Bar (Hidden during window.print()) */}
            <div className="no-print bg-white px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    রেজিস্টার খাতা প্রিন্ট ও PDF প্রিভিউ
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    A4 Landscape ভিউ | দারুল কুরআন ওয়াত-তাজবীদ
                  </p>
                </div>
              </div>

              {/* Date Range Selector */}
              <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPrintRange('first_half')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                    printRange === 'first_half'
                      ? 'bg-emerald-academy text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  ০১ – ১৫ তারিখ
                </button>
                <button
                  type="button"
                  onClick={() => setPrintRange('second_half')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                    printRange === 'second_half'
                      ? 'bg-emerald-academy text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  ১৬ – ৩১ তারিখ
                </button>
                <button
                  type="button"
                  onClick={() => setPrintRange('full_month')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                    printRange === 'full_month'
                      ? 'bg-emerald-academy text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  পূর্ণাঙ্গ মাস (০১–৩১)
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-emerald-academy hover:bg-emerald-academy-dark text-white text-xs font-bold rounded-xl px-4 py-2 cursor-pointer gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট / PDF সংরক্ষণ</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Help Note (Hidden in Print) */}
            <div className="no-print bg-emerald-50/80 border-b border-emerald-200/60 px-4 py-2 text-[11px] text-emerald-900 flex items-center justify-between">
              <span>
                💡 <strong>প্রিন্ট টিপস:</strong> ব্রাউজারের প্রিন্ট ডায়ালগে Destination হিসেবে <strong>Save as PDF</strong> এবং Layout <strong>Landscape</strong> নির্বাচন করুন।
              </span>
              <span className="font-mono text-emerald-700 font-bold">A4 সাইজ রেডি</span>
            </div>

            {/* Scrollable Sheet Wrapper */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70">
              {/* ── ACTUAL PRINTABLE PAPER CANVAS (id="printable-register-khata") ── */}
              <div
                id="printable-register-khata"
                className="bg-white text-slate-900 border border-slate-300 shadow-md p-6 mx-auto rounded-lg"
                style={{ maxWidth: '1080px', minHeight: '680px' }}
              >
                {/* Madrasa Official Header */}
                <div className="text-center pb-3 border-b-2 border-emerald-900 mb-4">
                  <div className="text-xs font-serif text-slate-600 mb-0.5 tracking-wider">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-emerald-academy tracking-tight">
                    দারুল কুরআন ওয়াত-তাজবীদ / আইওএম ইতকান একাডেমি
                  </h1>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
                    {isNajera ? 'নাজেরা ও তাজবীদ বিভাগীয়' : 'হিফজুল কুরআন বিভাগীয়'} দৈনিক পাঠ ও অগ্রগতি রেজিস্টার খাতা
                  </h2>

                  {/* Student Academic Meta Strip */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-left">
                    <div>
                      <span className="text-slate-500 font-medium">শিক্ষার্থী:</span>{' '}
                      <strong className="text-slate-900">{activeStudent.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">রোল নং:</span>{' '}
                      <strong className="text-slate-900">{activeStudent.roll}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">শাখা / জামাত:</span>{' '}
                      <strong className="text-slate-900">{activeBatch.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">তত্ত্বাবধায়ক:</span>{' '}
                      <strong className="text-slate-900">{activeBatch.defaultTeacher}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">মাস ও সন:</span>{' '}
                      <strong className="text-slate-900">নভেম্বর ২০২৬</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">তারিখ সীমা:</span>{' '}
                      <strong className="text-slate-900">
                        {printRange === 'first_half'
                          ? '০১ থেকে ১৫ তারিখ'
                          : printRange === 'second_half'
                            ? '১৬ থেকে ৩১ তারিখ'
                            : '০১ থেকে ৩১ তারিখ (সম্পূর্ণ মাস)'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">উপস্থিতি:</span>{' '}
                      <strong className="text-emerald-800">{toBn(printSummary.presentDays)} দিন</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">মোট অর্জিত ডায়মন্ড:</span>{' '}
                      <strong className="text-emerald-800 font-mono">{toBn(printSummary.netDiamonds)} 💎</strong>
                    </div>
                  </div>
                </div>

                {/* Printable Register Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-[10px] border-collapse border border-slate-700">
                    <thead>
                      <tr className="bg-slate-800 text-white font-bold border-b border-slate-700">
                        <th rowSpan={2} className="py-1.5 px-1 border border-slate-600 w-8">তারিখ</th>
                        <th rowSpan={2} className="py-1.5 px-1 border border-slate-600 w-10">বার</th>
                        {isNajera ? (
                          <>
                            <th colSpan={4} className="py-1.5 px-2 border border-slate-600 bg-sky-900 text-sky-100">
                              ১. আজকের সবক
                            </th>
                            <th colSpan={4} className="py-1.5 px-2 border border-slate-600 bg-indigo-900 text-indigo-100">
                              ২. পুরাতন সবক
                            </th>
                            <th colSpan={2} className="py-1.5 px-2 border border-slate-600 bg-amber-900 text-amber-100">
                              ৩. তাজবীদ ও তারতীল
                            </th>
                          </>
                        ) : (
                          <>
                            <th colSpan={4} className="py-1.5 px-2 border border-slate-600 bg-sky-900 text-sky-100">
                              ১. আজকের সবক
                            </th>
                            <th colSpan={4} className="py-1.5 px-2 border border-slate-600 bg-indigo-900 text-indigo-100">
                              ২. সাত সবক
                            </th>
                            <th colSpan={4} className="py-1.5 px-2 border border-slate-600 bg-amber-900 text-amber-100">
                              ৩. আমোক্তা / দোর
                            </th>
                            <th colSpan={2} className="py-1.5 px-2 border border-slate-600 bg-emerald-900 text-emerald-100">
                              ৪. তেলাওয়াত
                            </th>
                          </>
                        )}
                        <th rowSpan={2} className="py-1.5 px-1 border border-slate-600 w-16 bg-slate-900 text-white">
                          মান
                        </th>
                        <th rowSpan={2} className="py-1.5 px-1 border border-slate-600 w-12 bg-slate-900 text-white">
                          ডায়মন্ড
                        </th>
                        <th rowSpan={2} className="py-1.5 px-1 border border-slate-600 w-16 bg-slate-900 text-white">
                          স্বাক্ষর
                        </th>
                      </tr>
                      <tr className="bg-slate-700 text-slate-100 font-semibold border-b border-slate-600 text-[9px]">
                        {/* আজকের সবক */}
                        <th className="py-1 px-1 border border-slate-600">পারা</th>
                        <th className="py-1 px-1 border border-slate-600">পৃষ্ঠা</th>
                        <th className="py-1 px-1 border border-slate-600">পরিমাণ</th>
                        <th className="py-1 px-1 border border-slate-600">ভুল</th>

                        {isNajera ? (
                          <>
                            {/* পুরাতন সবক */}
                            <th className="py-1 px-1 border border-slate-600">পারা</th>
                            <th className="py-1 px-1 border border-slate-600">পৃষ্ঠা</th>
                            <th className="py-1 px-1 border border-slate-600">পরিমাণ</th>
                            <th className="py-1 px-1 border border-slate-600">ভুল</th>
                            {/* তাজবীদ ও তারতীল */}
                            <th className="py-1 px-1 border border-slate-600">পাঠের মান</th>
                            <th className="py-1 px-1 border border-slate-600">পয়েন্ট</th>
                          </>
                        ) : (
                          <>
                            {/* সাত সবক */}
                            <th className="py-1 px-1 border border-slate-600">পারা</th>
                            <th className="py-1 px-1 border border-slate-600">পরিমাণ</th>
                            <th className="py-1 px-1 border border-slate-600">রেঞ্জ</th>
                            <th className="py-1 px-1 border border-slate-600">ভুল</th>
                            {/* আমোক্তা */}
                            <th className="py-1 px-1 border border-slate-600">পারা</th>
                            <th className="py-1 px-1 border border-slate-600">কোয়ার্টার</th>
                            <th className="py-1 px-1 border border-slate-600">পরিমাণ</th>
                            <th className="py-1 px-1 border border-slate-600">ভুল</th>
                            {/* তেলাওয়াত */}
                            <th className="py-1 px-1 border border-slate-600">সাধারণ</th>
                            <th className="py-1 px-1 border border-slate-600">নামাজে</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-400">
                      {printRows.map((row) => {
                        const totalMistakes = isNajera
                          ? row.sabaq_mistakes + (row.puratan_mistakes || 0)
                          : row.sabaq_mistakes + row.sabqi_mistakes + row.manzil_mistakes
                        const tajweedPoints = isNajera ? (row.tajweed_points || 0) : 0
                        const netDiamonds = calculateNetDiamonds(row.grade, totalMistakes, tajweedPoints)

                        const gradeName =
                          row.grade === 'mumtaz'
                            ? 'মুমতাজ'
                            : row.grade === 'jayyid_jiddan'
                              ? 'জায়্যিদ জিদ্দান'
                              : row.grade === 'jayyid'
                                ? 'জায়্যিদ'
                                : 'মাকবুল'

                        return (
                          <tr key={row.dayNum} className="border-b border-slate-300 hover:bg-slate-50 font-medium">
                            <td className="py-1 px-1 border border-slate-400 font-bold bg-slate-50">{row.dayNum}</td>
                            <td className="py-1 px-1 border border-slate-400 font-semibold">{row.dayName}</td>

                            {/* আজকের সবক */}
                            <td className="py-1 px-1 border border-slate-300">{row.sabaq_para}</td>
                            <td className="py-1 px-1 border border-slate-300">{row.sabaq_page}</td>
                            <td className="py-1 px-1 border border-slate-300">{row.sabaq_amount}</td>
                            <td className={cn('py-1 px-1 border border-slate-300 font-bold', row.sabaq_mistakes > 0 ? 'text-rose-700' : 'text-slate-600')}>
                              {toBn(row.sabaq_mistakes)}
                            </td>

                            {isNajera ? (
                              <>
                                {/* পুরাতন সবক */}
                                <td className="py-1 px-1 border border-slate-300">{row.puratan_para || '১'}</td>
                                <td className="py-1 px-1 border border-slate-300">{row.puratan_page || '৫'}</td>
                                <td className="py-1 px-1 border border-slate-300">{row.puratan_amount || '২ পৃষ্ঠা'}</td>
                                <td className={cn('py-1 px-1 border border-slate-300 font-bold', (row.puratan_mistakes || 0) > 0 ? 'text-rose-700' : 'text-slate-600')}>
                                  {toBn(row.puratan_mistakes || 0)}
                                </td>

                                {/* তাজবীদ ও তারতীল */}
                                <td className="py-1 px-1 border border-slate-300 text-[9px] text-slate-800">
                                  {row.tajweed_quality ? row.tajweed_quality.replace(/^[^\w\u0980-\u09FF]+/, '') : 'বিশুদ্ধ পাঠ'}
                                </td>
                                <td className={cn('py-1 px-1 border border-slate-300 font-mono font-bold', (row.tajweed_points || 0) > 0 ? 'text-emerald-700' : (row.tajweed_points || 0) < 0 ? 'text-rose-700' : 'text-slate-600')}>
                                  {(row.tajweed_points || 0) > 0 ? `+${toBn(row.tajweed_points || 0)}` : toBn(row.tajweed_points || 0)}
                                </td>
                              </>
                            ) : (
                              <>
                                {/* সাত সবক */}
                                <td className="py-1 px-1 border border-slate-300">{row.sabqi_para}</td>
                                <td className="py-1 px-1 border border-slate-300">{row.sabqi_amount}</td>
                                <td className="py-1 px-1 border border-slate-300 text-[9px]">{row.sabqi_page_range || '-'}</td>
                                <td className={cn('py-1 px-1 border border-slate-300 font-bold', row.sabqi_mistakes > 0 ? 'text-rose-700' : 'text-slate-600')}>
                                  {toBn(row.sabqi_mistakes)}
                                </td>

                                {/* আমোক্তা */}
                                <td className="py-1 px-1 border border-slate-300">{row.manzil_para || '৩'}</td>
                                <td className="py-1 px-1 border border-slate-300">{row.manzil_quarter || '১-৫'}</td>
                                <td className="py-1 px-1 border border-slate-300">{row.manzil_amount || '৫ পৃষ্ঠা'}</td>
                                <td className={cn('py-1 px-1 border border-slate-300 font-bold', row.manzil_mistakes > 0 ? 'text-rose-700' : 'text-slate-600')}>
                                  {toBn(row.manzil_mistakes)}
                                </td>

                                {/* তেলাওয়াত */}
                                <td className="py-1 px-1 border border-slate-300">{row.tilawat_amount}</td>
                                <td className="py-1 px-1 border border-slate-300">{row.salah_tilawat_amount}</td>
                              </>
                            )}

                            {/* মূল্যায়ন */}
                            <td className="py-1 px-1 border border-slate-400 font-bold text-slate-800">
                              {gradeName}
                            </td>
                            <td className="py-1 px-1 border border-slate-400 font-mono font-bold text-emerald-800">
                              {toBn(netDiamonds)}
                            </td>
                            <td className="py-1 px-1 border border-slate-400 text-[9px] text-slate-700">
                              ✓ {row.teacher_name ? row.teacher_name.split(' ')[0] : 'উস্তাদ'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary & Performance Box */}
                <div className="mt-4 pt-3 border-t-2 border-slate-400 grid grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-2 border border-slate-300 rounded bg-slate-50">
                    <span className="text-slate-500 block text-[10px]">মোট উপস্থিত কার্যদিবস</span>
                    <strong className="text-sm text-slate-900 font-black">{toBn(printSummary.presentDays)} দিন</strong>
                  </div>
                  <div className="p-2 border border-slate-300 rounded bg-slate-50">
                    <span className="text-slate-500 block text-[10px]">মোট কৃত ভুল</span>
                    <strong className="text-sm text-rose-700 font-black">{toBn(printSummary.totalMistakes)} টি</strong>
                  </div>
                  <div className="p-2 border border-slate-300 rounded bg-slate-50">
                    <span className="text-slate-500 block text-[10px]">অর্জিত সর্বমোট ডায়মন্ড</span>
                    <strong className="text-sm text-emerald-800 font-mono font-black">{toBn(printSummary.netDiamonds)} 💎</strong>
                  </div>
                  <div className="p-2 border border-slate-300 rounded bg-slate-50">
                    <span className="text-slate-500 block text-[10px]">সামগ্রিক মাসিক মান</span>
                    <strong className="text-sm text-teal-900 font-black">🌟 মুমতাজ (Mumtaz)</strong>
                  </div>
                </div>

                {/* Official Madrasa Signatures Section */}
                <div className="mt-8 pt-6 grid grid-cols-4 gap-4 text-center text-xs">
                  <div>
                    <div className="border-b border-dashed border-slate-800 pb-1 mb-1 min-h-[30px] flex items-end justify-center font-serif text-slate-700">
                      {activeBatch.defaultTeacher}
                    </div>
                    <span className="text-slate-700 font-bold block text-[11px]">শ্রেণি উস্তাদের স্বাক্ষর</span>
                    <span className="text-slate-400 text-[9px]">তারিখ: .......................</span>
                  </div>

                  <div>
                    <div className="border-b border-dashed border-slate-800 pb-1 mb-1 min-h-[30px] flex items-end justify-center font-serif text-slate-700">
                      {isNajera ? 'মুফতী আবরারুল হক' : 'মাওলানা আবু বকর সিদ্দিক'}
                    </div>
                    <span className="text-slate-700 font-bold block text-[11px]">বিভাগীয় জিম্মাদারের স্বাক্ষর</span>
                    <span className="text-slate-400 text-[9px]">তারিখ: .......................</span>
                  </div>

                  <div>
                    <div className="border-b border-dashed border-slate-800 pb-1 mb-1 min-h-[30px] flex items-end justify-center">
                    </div>
                    <span className="text-slate-700 font-bold block text-[11px]">অভিভাবকের স্বাক্ষর</span>
                    <span className="text-slate-400 text-[9px]">তারিখ: .......................</span>
                  </div>

                  <div>
                    <div className="border-b border-dashed border-slate-800 pb-1 mb-1 min-h-[30px] flex items-end justify-center">
                    </div>
                    <span className="text-slate-700 font-bold block text-[11px]">মুহতামিম / প্রিন্সিপালের সিল</span>
                    <span className="text-slate-400 text-[9px]">দারুল কুরআন ওয়াত-তাজবীদ</span>
                  </div>
                </div>

                {/* Print Verification Hash */}
                <div className="mt-5 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
                  IOM-ITQAAN-SYSTEM • REGISTER-REF: ITQ-{activeStudent.roll}-{printRange.toUpperCase()}-202611 • GENERATED ON {new Date().toLocaleDateString('bn-BD')}
                </div>
              </div>
            </div>
          </div>

          {/* High-fidelity Vector Print Stylesheet for A4 Landscape */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 landscape;
                  margin: 6mm 8mm;
                }
                body * {
                  visibility: hidden !important;
                }
                #printable-register-khata, #printable-register-khata * {
                  visibility: visible !important;
                }
                #printable-register-khata {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100vw !important;
                  min-height: 100vh !important;
                  padding: 12px !important;
                  margin: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                  color: black !important;
                  z-index: 9999999 !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `
          }} />
        </div>
      )}
    </div>
  )
}
