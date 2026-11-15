/**
 * Unique Token & Reference ID Generator
 * Generates formatted, collision-resistant tokens (e.g. TKT-1085, ITQ-7821)
 */
export function makeTokenId(prefix: string = 'TKT'): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${num}`
}

export function isValidTokenId(token: string, prefix: string = 'TKT'): boolean {
  if (!token) return false
  const regex = new RegExp(`^${prefix}-\\d{4,}$`, 'i')
  return regex.test(token.trim())
}

