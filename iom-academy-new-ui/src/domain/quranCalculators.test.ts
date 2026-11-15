import { describe, it, expect } from 'vitest'
import {
  parseBnInt,
  toBn,
  computeSatSabakRange,
  computeManzilRange,
  calculateNetDiamonds,
} from './quranCalculators'

describe('Quran Calculators - Domain Invariants', () => {
  describe('Numeral Conversions (parseBnInt & toBn)', () => {
    it('correctly converts Bengali digits to JavaScript numbers', () => {
      expect(parseBnInt('০')).toBe(0)
      expect(parseBnInt('১২৩৪৫৬৭৮৯০')).toBe(1234567890)
      expect(parseBnInt('পারা ৫')).toBe(5)
      expect(parseBnInt(null)).toBe(0)
      expect(parseBnInt(undefined)).toBe(0)
      expect(parseBnInt(42)).toBe(42)
    })

    it('correctly formats numbers to Bengali numeral strings', () => {
      expect(toBn(0)).toBe('০')
      expect(toBn(15)).toBe('১৫')
      expect(toBn(null)).toBe('০')
      expect(toBn(undefined)).toBe('০')
    })
  })

  describe('Sat Sabak Range Calculation Invariants', () => {
    it('returns boundary alert when student is on Para 1 Page 1', () => {
      const res = computeSatSabakRange('১', '১', '৫')
      expect(res).toBe('পারা ১ (নতুন শুরু — পেছনে পৃষ্ঠা নেই)')
    })

    it('returns revision alert when sabak is stopped', () => {
      const res = computeSatSabakRange('৫', 'সবক বন্ধ / রিভিশন', '৫')
      expect(res).toBe('সবক বন্ধ (রিভিশন চলছে)')
    })

    it('calculates preceding pages inside the same Para', () => {
      // Para 3, Page 10, amount 5 pages -> pages 5 to 9 of Para 3
      const res = computeSatSabakRange('৩', '১০', '৫')
      expect(res).toContain('পারা ৩')
      expect(res).toContain('৫–৯')
    })

    it('calculates preceding pages across Para boundaries', () => {
      // Para 4, Page 2, amount 5 pages -> end is Para 4 Page 1, starts back in Para 3
      const res = computeSatSabakRange('৪', '২', '৫')
      expect(res).toContain('পারা ৩')
      expect(res).toContain('পারা ৪')
    })
  })

  describe('Manzil (Amukhta / Dour) Range Calculation Invariants', () => {
    it('handles full Para revision (20 pages)', () => {
      const res = computeManzilRange('৭', '১-৫', '২০')
      expect(res).toBe('সম্পূর্ণ পারা ৭ (১–২০)')
    })

    it('handles intra-para quarter revisions', () => {
      const res = computeManzilRange('৫', '৬-১০', '৫')
      expect(res).toContain('পারা ৫')
      expect(res).toContain('৬–১০')
    })

    it('handles overflow across Para boundaries (e.g., Para 15 to 16)', () => {
      const res = computeManzilRange('১৫', '১৬-২০', '১০')
      expect(res).toContain('পারা ১৫')
      expect(res).toContain('পারা ১৬')
    })

    it('wraps around to Para 1 after Para 30 on overflow', () => {
      const res = computeManzilRange('৩০', '১৬-২০', '১০')
      expect(res).toContain('পারা ৩০')
      expect(res).toContain('পারা ১')
    })
  })

  describe('Diamond Gamification Policy Invariants', () => {
    it('awards 40 base diamonds for Mumtaz with zero mistakes', () => {
      expect(calculateNetDiamonds('mumtaz', 0, 0)).toBe(40)
    })

    it('deducts 2 diamonds per mistake and adds tajweed bonus', () => {
      // Mumtaz base 40 - (2 mistakes * 2) + 5 tajweed = 41
      expect(calculateNetDiamonds('mumtaz', 2, 5)).toBe(41)
    })

    it('awards correct base diamonds for all grade tiers', () => {
      expect(calculateNetDiamonds('jayyid_jiddan', 0, 0)).toBe(30)
      expect(calculateNetDiamonds('jayyid', 0, 0)).toBe(25)
      expect(calculateNetDiamonds('maqbool', 0, 0)).toBe(20)
    })

    it('enforces non-negative diamond floor invariant (never below 0)', () => {
      // Maqbool base 20 - (15 mistakes * 2 = 30) = -10 -> clamped to 0
      expect(calculateNetDiamonds('maqbool', 15, 0)).toBe(0)
    })
  })
})

