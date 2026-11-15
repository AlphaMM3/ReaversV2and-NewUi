/**
 * DOMAIN ENTITY / POLICY: Quranic Syllabi & Gamification Business Invariants
 * Pure, framework-independent business rules for Madrasa Hifz & Najera curriculums.
 * Robert C. Martin Clean Architecture: Core Policy Layer (Inward-pointing, 0 outer dependencies).
 */

export type SabaqGrade = 'mumtaz' | 'jayyid_jiddan' | 'jayyid' | 'maqbool'

const BN_TO_EN: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
}

/**
 * Converts Bengali numeral string or number to integer
 */
export function parseBnInt(str: string | number | null | undefined): number {
  if (typeof str === 'number') return Math.floor(str)
  if (!str) return 0
  const enStr = String(str).replace(/[০-৯]/g, (match) => BN_TO_EN[match] || match)
  const parsed = parseInt(enStr.replace(/\D/g, ''), 10)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Formats integer or number to Bengali numeral string
 */
export function toBn(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '০'
  const num = typeof n === 'number' ? n : parseBnInt(n)
  return num.toLocaleString('bn-BD')
}

/**
 * 1. Sat Sabak Range Calculation Invariant:
 * 1 Para = 20 Pages.
 * Sat Sabak is the immediately preceding revision window based on amount of pages.
 */
export function computeSatSabakRange(
  sabakParaStr: string,
  sabakPageStr: string,
  amountPagesStr: string,
): string {
  const sabakPara = parseBnInt(sabakParaStr) || 1
  const sabakPage = parseBnInt(sabakPageStr) || 1
  const amountPages = parseBnInt(amountPagesStr) || 5

  if (sabakPageStr === 'সবক বন্ধ / রিভিশন' || !sabakPage) {
    return 'সবক বন্ধ (রিভিশন চলছে)'
  }

  const endGlobalPage = (sabakPara - 1) * 20 + sabakPage - 1
  if (endGlobalPage <= 0) {
    return 'পারা ১ (নতুন শুরু — পেছনে পৃষ্ঠা নেই)'
  }
  const startGlobalPage = Math.max(1, endGlobalPage - amountPages + 1)

  const startPara = Math.floor((startGlobalPage - 1) / 20) + 1
  const startPage = ((startGlobalPage - 1) % 20) + 1

  const endPara = Math.floor((endGlobalPage - 1) / 20) + 1
  const endPage = ((endGlobalPage - 1) % 20) + 1

  if (startPara === endPara) {
    return `পারা ${toBn(startPara)} (পৃষ্ঠা ${toBn(startPage)}–${toBn(endPage)})`
  } else {
    return `পারা ${toBn(startPara)} (${toBn(startPage)}–২০), পারা ${toBn(endPara)} (১–${toBn(endPage)})`
  }
}

/**
 * 2. Amukhta (Manzil/Dour) Range Calculation Invariant:
 * Calculates the exact quarter and overflow into next Para if range exceeds 20 pages.
 */
export function computeManzilRange(
  paraStr: string,
  quarterStr: string,
  amountStr: string,
): string {
  const para = parseBnInt(paraStr) || 1
  const amount = parseBnInt(amountStr) || 5

  let startPage = 1
  if (quarterStr === '৬-১০' || quarterStr === '6') startPage = 6
  else if (quarterStr === '১১-১৫' || quarterStr === '11') startPage = 11
  else if (quarterStr === '১৬-২০' || quarterStr === '16') startPage = 16

  if (startPage === 1 && amount >= 20) {
    return `সম্পূর্ণ পারা ${toBn(para)} (১–২০)`
  }

  const endPageRaw = startPage + amount - 1
  if (endPageRaw <= 20) {
    return `পারা ${toBn(para)} (${toBn(startPage)}–${toBn(endPageRaw)})`
  }

  // Crosses into next para
  const overflow = endPageRaw - 20
  const nextPara = para < 30 ? para + 1 : 1
  return `পারা ${toBn(para)} (${toBn(startPage)}–২০) ও পারা ${toBn(nextPara)} (১–${toBn(overflow)})`
}

/**
 * 3. Diamond Gamification Engine Invariant:
 * Base scores by grade:
 * - Mumtaz: 40 Diamonds
 * - Jayyid Jiddan: 30 Diamonds
 * - Jayyid: 25 Diamonds
 * - Maqbool: 20 Diamonds
 * Deductions: 2 diamonds per mistake.
 * Adjustments: Tajweed bonus or penalty points.
 * Rule: Diamond points cannot fall below 0.
 */
export function calculateNetDiamonds(
  grade: SabaqGrade,
  totalMistakes: number,
  tajweedPoints: number = 0,
): number {
  const baseScores: Record<SabaqGrade, number> = {
    mumtaz: 40,
    jayyid_jiddan: 30,
    jayyid: 25,
    maqbool: 20,
  }
  const base = baseScores[grade] ?? 20
  const deduction = Math.max(0, totalMistakes) * 2
  return Math.max(0, base - deduction + tajweedPoints)
}

