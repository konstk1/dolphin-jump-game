// Board view (M1): renders the full 100-spot winding S-snake, start at the
// bottom → treasure-chest finish at the top. The snake GEOMETRY is a render
// concern; WHICH spots are special is engine data (M2). To keep M1 independent
// of M2, this renders against a small inline SAMPLE layout, clearly marked, that
// M3 will replace with real board data from src/board.ts.

import {
  dolphinSVG,
  specialIconSVG,
  treasureChestSVG,
  type DolphinColor,
} from './art'

export type SpecialKind = 'forward' | 'back' | 'switch' | 'rollAgain'

export interface SpotSpec {
  kind: SpecialKind
  value?: number
}

/** index (1..100) → special spec. M1 SAMPLE ONLY — real data arrives in M2. */
export const SAMPLE_SPECIALS: Record<number, SpotSpec> = {
  7: { kind: 'forward', value: 5 },
  15: { kind: 'rollAgain' },
  23: { kind: 'back', value: 3 },
  34: { kind: 'switch' },
  46: { kind: 'forward', value: 6 },
  52: { kind: 'back', value: 4 },
  61: { kind: 'rollAgain' },
  70: { kind: 'switch' },
  78: { kind: 'forward', value: 4 },
  88: { kind: 'back', value: 5 },
}

/** Dolphin tokens currently sitting on a given spot index (M1 sample). */
export const SAMPLE_TOKENS: Record<number, DolphinColor[]> = {
  1: ['purple'],
  7: ['blue', 'green'], // two sharing a spot — proves stacked legibility
  23: ['pink'],
}

const COLS = 10
const ROWS = 10
const TOTAL = COLS * ROWS

/** viewBox is a square 1000×1000 matching the (square) board box. */
const VB = 1000
const CELL = VB / COLS // 100 units per cell

/** Center of a spot's cell in viewBox coordinates (for the ribbon road path). */
function spotToViewBox(index: number): { x: number; y: number } {
  const { row, col } = spotToGridCell(index)
  return { x: (col - 1) * CELL + CELL / 2, y: (row - 1) * CELL + CELL / 2 }
}

/**
 * The winding "road": a single fat stroke threaded through every spot center in
 * order. Straight runs stay straight; at each row end (where the path turns from
 * horizontal to vertical and back) the sharp corner is replaced with a smooth
 * quadratic bend, giving a proper serpentine path rather than a square grid.
 */
function roadPathD(): string {
  const pts: Array<{ x: number; y: number }> = []
  for (let i = 1; i <= TOTAL; i++) pts.push(spotToViewBox(i))

  const R = 40 // corner radius (viewBox units; cells are 100, so < half a cell)
  const lerp = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    dist: number,
  ) => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    return { x: a.x + (dx / len) * dist, y: a.y + (dy / len) * dist }
  }

  const first = pts[0]!
  let d = `M ${first.x} ${first.y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1]!
    const cur = pts[i]!
    const next = pts[i + 1]!
    const collinear =
      (prev.x === cur.x && cur.x === next.x) ||
      (prev.y === cur.y && cur.y === next.y)
    if (collinear) continue // straight run — handled by the L into the next bend
    const entry = lerp(cur, prev, R) // pull back toward prev
    const exit = lerp(cur, next, R) // push out toward next
    d += ` L ${entry.x} ${entry.y} Q ${cur.x} ${cur.y} ${exit.x} ${exit.y}`
  }
  const last = pts[pts.length - 1]!
  d += ` L ${last.x} ${last.y}`
  return d
}

const KIND_CLASS: Record<SpecialKind, string> = {
  forward: 'jumpf',
  back: 'jumpb',
  switch: 'switch',
  rollAgain: 'roll',
}

/**
 * Boustrophedon (snake) mapping: spot 1 is bottom-left; each row alternates
 * direction; the row climbs as the index grows so the finish (100) is top.
 * Returns the CSS grid row/column (1-based) for a given spot index.
 */
export function spotToGridCell(index: number): { row: number; col: number } {
  const r = Math.floor((index - 1) / COLS) // 0 = bottom row
  const within = (index - 1) % COLS
  const col = r % 2 === 0 ? within : COLS - 1 - within // alternate L→R / R→L
  const row = ROWS - r // CSS grid row 1 = top, so invert
  return { row, col: col + 1 }
}

function tokenStack(colors: DolphinColor[]): string {
  if (colors.length === 0) return ''
  const minis = colors
    .map(
      (c, i) =>
        `<span class="dj-spot__token" style="--i:${i}">${dolphinSVG(c, 'dj-mini')}</span>`,
    )
    .join('')
  return `<span class="dj-spot__tokens">${minis}</span>`
}

function renderSpot(index: number): string {
  const { row, col } = spotToGridCell(index)
  const style = `style="grid-row:${row};grid-column:${col}"`
  const tokens = tokenStack(SAMPLE_TOKENS[index] ?? [])

  if (index === TOTAL) {
    return `<div class="dj-spot dj-spot--finish" ${style} aria-label="finish">${treasureChestSVG()}${tokens}</div>`
  }
  if (index === 1) {
    return `<div class="dj-spot dj-spot--start" ${style} aria-label="start">
      <svg class="dj-start-arrow" viewBox="0 0 24 24"><path d="M5 4 L20 12 L5 20 Z" fill="#fff" /></svg>
      <span class="dj-spot__lbl">START</span>${tokens}
    </div>`
  }

  const special = SAMPLE_SPECIALS[index]
  if (special) {
    const num =
      special.value !== undefined
        ? `<span class="dj-spot__num">${special.kind === 'forward' ? '+' : ''}${special.value}</span>`
        : ''
    return `<div class="dj-spot dj-spot--special dj-spot--${KIND_CLASS[special.kind]}" ${style} aria-label="${special.kind} spot">
      ${specialIconSVG(special.kind)}${num}${tokens}
    </div>`
  }

  return `<div class="dj-spot dj-spot--plain" ${style}><span class="dj-spot__num">${index}</span>${tokens}</div>`
}

/** The sandy ribbon road that winds through every spot in order. */
function roadHTML(): string {
  const d = roadPathD()
  return `<svg class="dj-road" viewBox="0 0 ${VB} ${VB}" preserveAspectRatio="none" aria-hidden="true">
    <path class="dj-road__edge" d="${d}" />
    <path class="dj-road__fill" d="${d}" />
    <path class="dj-road__dash" d="${d}" />
  </svg>`
}

/** Render the entire 100-spot board: a winding road with stepping-stone spots. */
export function boardHTML(): string {
  const spots: string[] = []
  for (let i = 1; i <= TOTAL; i++) spots.push(renderSpot(i))
  return `<div class="dj-board" role="img" aria-label="Dolphin Jump board, 100 spots">${roadHTML()}${spots.join('')}</div>`
}
