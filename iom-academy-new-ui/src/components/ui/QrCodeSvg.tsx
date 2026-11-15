import { useMemo } from 'react'

/**
 * Generates a deterministic 21x21 QR-style verification matrix SVG
 * with canonical 7x7 finder patterns in 3 corners and timing lines.
 */
export function QrCodeSvg({
  value,
  size = 112,
  className = '',
}: {
  value: string
  size?: number
  className?: string
}) {
  const modules = useMemo(() => {
    const dim = 21
    const grid: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false))
    const reserved: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false))

    const placeFinder = (row0: number, col0: number) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = row0 + r
          const cc = col0 + c
          if (rr < 0 || rr >= dim || cc < 0 || cc >= dim) continue
          reserved[rr][cc] = true
          if (r === -1 || r === 7 || c === -1 || c === 7) {
            grid[rr][cc] = false
          } else if (r === 0 || r === 6 || c === 0 || c === 6) {
            grid[rr][cc] = true
          } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
            grid[rr][cc] = true
          } else {
            grid[rr][cc] = false
          }
        }
      }
    }

    placeFinder(0, 0)
    placeFinder(0, dim - 7)
    placeFinder(dim - 7, 0)

    // Timing patterns
    for (let i = 8; i < dim - 8; i++) {
      reserved[6][i] = true
      grid[6][i] = i % 2 === 0
      reserved[i][6] = true
      grid[i][6] = i % 2 === 0
    }

    // Deterministic FNV-1a / Xorshift stream from payload text
    let h1 = 0x811c9dc5
    for (let i = 0; i < value.length; i++) {
      h1 ^= value.charCodeAt(i)
      h1 = Math.imul(h1, 0x01000193) >>> 0
    }
    let state = (h1 || 0x13579bdf) >>> 0

    for (let r = 0; r < dim; r++) {
      for (let c = 0; c < dim; c++) {
        if (reserved[r][c]) continue
        state ^= state << 13
        state ^= state >>> 17
        state ^= state << 5
        const ch = value.charCodeAt((r * dim + c) % Math.max(1, value.length)) || 0
        grid[r][c] = ((state ^ ch) & 1) === 1
      }
    }
    return grid
  }, [value])

  const dim = modules.length
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${dim + 2} ${dim + 2}`}
      className={`bg-white p-1.5 rounded-lg border border-border ${className}`}
      role="img"
      aria-label={`Verification QR for ${value}`}
    >
      <rect x={0} y={0} width={dim + 2} height={dim + 2} fill="#FFFFFF" />
      {modules.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c + 1}
              y={r + 1}
              width={0.94}
              height={0.94}
              rx={0.12}
              fill="#065F46"
            />
          ) : null,
        ),
      )}
    </svg>
  )
}

