// Turn order (GAME_DESIGN.md §3): youngest → oldest, repeating. Age is used ONLY
// for ordering; it confers no other advantage. Players with no age sit out.

import type { DolphinColor, Player } from './types'
import { START } from './types'

export interface PlayerSetup {
  color: DolphinColor
  /** Entered age, or null/undefined to sit this dolphin out. */
  age: number | null
}

/** Canonical start-screen order, used as the deterministic age-tie-breaker. */
export const SETUP_ORDER: DolphinColor[] = ['purple', 'pink', 'blue', 'green']

/**
 * Build the ordered player list from a start-screen setup. Dolphins with no age
 * are omitted. Order is youngest → oldest; ties break by SETUP_ORDER (stable).
 */
export function buildPlayers(setups: readonly PlayerSetup[]): Player[] {
  const orderRank = (c: DolphinColor) => SETUP_ORDER.indexOf(c)
  return setups
    .filter((s): s is { color: DolphinColor; age: number } => typeof s.age === 'number')
    .slice()
    .sort((a, b) => a.age - b.age || orderRank(a.color) - orderRank(b.color))
    .map((s) => ({ color: s.color, age: s.age, position: START, place: null }))
}
