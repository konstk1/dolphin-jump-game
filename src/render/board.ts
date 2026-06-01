// Board view: renders the full 100-spot winding S-snake (start bottom →
// treasure-chest finish top) as a sandy ribbon road with stepping-stone spots.
// Dolphin tokens are NOT baked into spots — they live in a separate absolutely-
// positioned "pawn" layer (see screens.ts) so the sequencer can glide them along
// the path. `spotCenterPercent` maps a spot index → that pawn coordinate.

import { specialIconSVG, treasureChestSVG } from './art'
import type { SpecialKind } from '../engine/types'
import { SPECIAL_BY_INDEX } from '../board'

const COLS = 10
const ROWS = 10
const TOTAL = COLS * ROWS

/** viewBox is a square 1000×1000 matching the (square) board box. */
const VB = 1000
const CELL = VB / COLS // 100 units per cell

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

/** A spot's center as a percentage of the board box — used to position pawns. */
export function spotCenterPercent(index: number): { x: number; y: number } {
  const { row, col } = spotToGridCell(index)
  return { x: (col - 0.5) * (100 / COLS), y: (row - 0.5) * (100 / ROWS) }
}

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
  const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, dist: number) => {
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
      (prev.x === cur.x && cur.x === next.x) || (prev.y === cur.y && cur.y === next.y)
    if (collinear) continue
    const entry = lerp(cur, prev, R)
    const exit = lerp(cur, next, R)
    d += ` L ${entry.x} ${entry.y} Q ${cur.x} ${cur.y} ${exit.x} ${exit.y}`
  }
  const last = pts[pts.length - 1]!
  d += ` L ${last.x} ${last.y}`
  return d
}

function renderSpot(index: number): string {
  const { row, col } = spotToGridCell(index)
  const style = `style="grid-row:${row};grid-column:${col}"`

  if (index === TOTAL) {
    return `<div class="dj-spot dj-spot--finish" ${style} aria-label="finish">${treasureChestSVG()}</div>`
  }
  if (index === 1) {
    return `<div class="dj-spot dj-spot--start" ${style} aria-label="start">
      <svg class="dj-start-arrow" viewBox="0 0 24 24"><path d="M5 4 L20 12 L5 20 Z" fill="#fff" /></svg>
      <span class="dj-spot__lbl">START</span>
    </div>`
  }

  const special = SPECIAL_BY_INDEX.get(index)
  if (special) {
    const num =
      special.value !== undefined
        ? `<span class="dj-spot__num">${special.kind === 'forward' ? '+' : ''}${special.value}</span>`
        : ''
    // On the snake board, even rows (from the bottom) run left→right and odd rows
    // run right→left, so the forward arrow must flip to face the way of travel.
    const travelsRight = Math.floor((index - 1) / COLS) % 2 === 0
    const flipX = special.kind === 'forward' && !travelsRight
    return `<div class="dj-spot dj-spot--special dj-spot--${KIND_CLASS[special.kind]}" ${style} aria-label="${special.kind} spot">
      ${specialIconSVG(special.kind, flipX)}${num}
    </div>`
  }

  return `<div class="dj-spot dj-spot--plain" ${style}><span class="dj-spot__num">${index}</span></div>`
}

/** The sandy ribbon road that winds through every spot in order. */
function roadHTML(): string {
  const d = roadPathD()
  return `<svg class="dj-road" viewBox="0 0 ${VB} ${VB}" preserveAspectRatio="none" aria-hidden="true">
    <path class="dj-road__fill" d="${d}" />
    <path class="dj-road__dash" d="${d}" />
  </svg>`
}

/**
 * Render the whole 100-spot board. `overlay` is extra markup placed inside the
 * board box (the dolphin pawn layer) so its percentage coordinates map to spots.
 */
export function boardHTML(overlay = ''): string {
  const spots: string[] = []
  for (let i = 1; i <= TOTAL; i++) spots.push(renderSpot(i))
  return `<div class="dj-board" role="img" aria-label="Dolphin Jump board, 100 spots">${roadHTML()}${spots.join('')}${overlay}</div>`
}
