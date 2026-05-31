// Pure rules engine types (TECH_DESIGN.md §3.1). Zero DOM.

export type DolphinColor = 'purple' | 'pink' | 'blue' | 'green'

export type SpecialKind = 'forward' | 'back' | 'switch' | 'rollAgain'

/** A special spot on the board. `value` = spaces for forward/back; unused otherwise. */
export interface SpecialSpot {
  index: number // 1..100
  kind: SpecialKind
  value?: number
}

export interface Player {
  color: DolphinColor
  age: number
  /** Board position, 1..100. Players begin on spot 1 (START). */
  position: number
  /** Set when the dolphin reaches/passes the finish; 1 = winner, 2 = 2nd, … */
  place: number | null
}

/** A pure source of die rolls (1..6). Injected so the engine stays deterministic. */
export type Die = () => number

export interface GameState {
  players: Player[]
  /** Index into `players` whose turn it is. */
  current: number
  /** Place counter — the next finisher gets this place, then it increments. */
  nextPlace: number
  /** True once the first dolphin has finished (the "You Win!" moment fired). */
  hasWinner: boolean
  /** True once every player has finished. */
  over: boolean
}

export const FINISH = 100
export const START = 1
