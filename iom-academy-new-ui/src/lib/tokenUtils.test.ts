import { describe, it, expect } from 'vitest'
import { makeTokenId, isValidTokenId } from './tokenUtils'

describe('Token Utilities', () => {
  it('generates valid token ID with default prefix TKT', () => {
    const token = makeTokenId()
    expect(token).toMatch(/^TKT-\d{4}$/)
    expect(isValidTokenId(token)).toBe(true)
  })

  it('generates valid token ID with custom prefix', () => {
    const token = makeTokenId('ADM')
    expect(token).toMatch(/^ADM-\d{4}$/)
    expect(isValidTokenId(token, 'ADM')).toBe(true)
  })

  it('correctly validates tokens', () => {
    expect(isValidTokenId('TKT-1085')).toBe(true)
    expect(isValidTokenId('tkt-9999')).toBe(true)
    expect(isValidTokenId('TKT-123')).toBe(false) // too short
    expect(isValidTokenId('INVALID')).toBe(false)
    expect(isValidTokenId('')).toBe(false)
  })
})

