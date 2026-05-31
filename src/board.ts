// Board layout as DATA + a dev-time invariant validator (TECH_DESIGN.md §4).
// The layout is tunable without touching engine logic.

import type { SpecialSpot } from './engine/types'
import { FINISH } from './engine/types'

/**
 * The ~12 special spots — a BALANCED mix (GAME_DESIGN.md §4), authored to satisfy
 * the three board invariants (validated by `validateBoard` below):
 *   1. No jump (forward/back) target lands on another special spot — no chaining.
 *   2. No back-jump can underflow before spot 1.
 *   3. No specials in the protected start zone (≤ PROTECTED_START) or final
 *      stretch (> FINISH - PROTECTED_FINISH).
 *
 * Counts: 4 forward, 4 back (mostly gentle 2–4, one dramatic −8), 2 switch, 2 roll-again.
 */
export const SPECIAL_SPOTS: SpecialSpot[] = [
  { index: 17, kind: 'forward', value: 5 },
  { index: 21, kind: 'back', value: 3 },
  { index: 28, kind: 'rollAgain' },
  { index: 34, kind: 'forward', value: 6 },
  { index: 39, kind: 'switch' },
  { index: 48, kind: 'back', value: 4 },
  { index: 56, kind: 'forward', value: 4 },
  { index: 63, kind: 'back', value: 8 }, // the dramatic slide
  { index: 71, kind: 'rollAgain' },
  { index: 76, kind: 'switch' },
  { index: 80, kind: 'forward', value: 5 },
  { index: 84, kind: 'back', value: 2 },
]

/** Protected zones: no specials in the first/last N spots. */
export const PROTECTED_START = 15
export const PROTECTED_FINISH = 12

/** Fast lookup: index → special spot (built once). */
export const SPECIAL_BY_INDEX: ReadonlyMap<number, SpecialSpot> = new Map(
  SPECIAL_SPOTS.map((s) => [s.index, s]),
)

export function specialAt(index: number): SpecialSpot | undefined {
  return SPECIAL_BY_INDEX.get(index)
}

/**
 * Validate a special-spot layout against the three invariants. Returns the list of
 * violations (empty = valid). Called at engine startup so a bad edit fails loudly
 * rather than producing subtle in-game bugs.
 */
export function validateBoard(spots: readonly SpecialSpot[] = SPECIAL_SPOTS): string[] {
  const errors: string[] = []
  const byIndex = new Map(spots.map((s) => [s.index, s]))

  for (const spot of spots) {
    // bounds + protected zones
    if (spot.index <= PROTECTED_START) {
      errors.push(`spot ${spot.index} (${spot.kind}) is in the protected start zone (≤${PROTECTED_START})`)
    }
    if (spot.index > FINISH - PROTECTED_FINISH) {
      errors.push(`spot ${spot.index} (${spot.kind}) is in the protected finish stretch (>${FINISH - PROTECTED_FINISH})`)
    }
    if (spot.index >= FINISH) {
      errors.push(`spot ${spot.index} (${spot.kind}) is at or past the finish (${FINISH})`)
    }

    if (spot.kind === 'forward' || spot.kind === 'back') {
      if (spot.value === undefined || spot.value <= 0) {
        errors.push(`spot ${spot.index} (${spot.kind}) needs a positive value`)
        continue
      }
      const target = spot.kind === 'forward' ? spot.index + spot.value : spot.index - spot.value
      // invariant 2: no backward underflow
      if (target < 1) {
        errors.push(`spot ${spot.index} (back ${spot.value}) underflows past spot 1 (→${target})`)
      }
      // invariant 1: jump target must be plain (not another special)
      if (byIndex.has(target)) {
        errors.push(`spot ${spot.index} (${spot.kind} ${spot.value}) targets special spot ${target} — chaining`)
      }
    }
  }
  return errors
}
