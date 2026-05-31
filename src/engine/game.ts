// Core rules engine (GAME_DESIGN.md §5–§7). Pure & deterministic: the die is
// injected, and takeTurn() returns a NEW state plus an ordered event list the
// animation sequencer (M4) can replay. Zero DOM.

import {
  type DolphinColor,
  type Die,
  type GameState,
  type Player,
  FINISH,
  START,
} from './types'
import { type PlayerSetup, buildPlayers, SETUP_ORDER } from './turnOrder'
import { SPECIAL_BY_INDEX } from '../board'
import type { SpecialSpot } from './types'

/** Board lookup: index → special spot. Injectable so the engine is board-agnostic. */
export type BoardLookup = (index: number) => SpecialSpot | undefined

const defaultBoard: BoardLookup = (i) => SPECIAL_BY_INDEX.get(i)

/** Ordered, replayable description of everything that happened during a turn. */
export type TurnEvent =
  | { type: 'roll'; color: DolphinColor; value: number; from: number; to: number }
  | { type: 'forward'; color: DolphinColor; value: number; from: number; to: number }
  | { type: 'back'; color: DolphinColor; value: number; from: number; to: number }
  | {
      type: 'switch'
      color: DolphinColor
      from: number
      to: number
      otherColor: DolphinColor
      otherFrom: number
      otherTo: number
    }
  | { type: 'rollAgain'; color: DolphinColor }
  | { type: 'finish'; color: DolphinColor; place: number }

export interface TurnResult {
  state: GameState
  events: TurnEvent[]
}

/** Build the initial game state from a start-screen setup. */
export function createGame(setups: readonly PlayerSetup[]): GameState {
  const players = buildPlayers(setups)
  return { players, current: 0, nextPlace: 1, hasWinner: false, over: false }
}

const rank = (c: DolphinColor) => SETUP_ORDER.indexOf(c)

/**
 * Choose the switch target for `me` (GAME_DESIGN.md §5): the nearest OTHER,
 * unfinished dolphin by absolute distance; ties prefer the one ahead; a dolphin
 * sharing the exact spot is skipped; returns null if there's no valid target.
 */
export function findSwitchTarget(state: GameState, me: Player): Player | null {
  const candidates = state.players.filter(
    (p) => p !== me && p.place === null && p.position !== me.position,
  )
  if (candidates.length === 0) return null
  candidates.sort((a, b) => {
    const da = Math.abs(a.position - me.position)
    const db = Math.abs(b.position - me.position)
    if (da !== db) return da - db
    const aAhead = a.position > me.position
    const bAhead = b.position > me.position
    if (aAhead !== bAhead) return aAhead ? -1 : 1 // ahead wins the tie
    return rank(a.color) - rank(b.color) // deterministic final tiebreak
  })
  return candidates[0]!
}

function finish(state: GameState, player: Player, events: TurnEvent[]): void {
  player.position = FINISH
  player.place = state.nextPlace++
  events.push({ type: 'finish', color: player.color, place: player.place })
  if (player.place === 1) state.hasWinner = true
  if (state.players.every((p) => p.place !== null)) state.over = true
}

/**
 * Move `player` forward by a freshly-ROLLED `value`, emit the roll, and — because
 * arriving by a roll counts — resolve whatever spot they land on. Recurses for
 * "roll again". (Jumps/switches displace WITHOUT re-triggering; see resolveLanding.)
 */
function rollAndResolve(
  state: GameState,
  player: Player,
  value: number,
  die: Die,
  board: BoardLookup,
  events: TurnEvent[],
): void {
  const from = player.position
  const to = from + value
  if (to >= FINISH) {
    events.push({ type: 'roll', color: player.color, value, from, to: FINISH })
    finish(state, player, events)
    return
  }
  player.position = to
  events.push({ type: 'roll', color: player.color, value, from, to })
  resolveLanding(state, player, die, board, events)
}

/** Resolve the special action for the spot a dolphin ROLLED onto (if any). */
function resolveLanding(
  state: GameState,
  player: Player,
  die: Die,
  board: BoardLookup,
  events: TurnEvent[],
): void {
  const special = board(player.position)
  if (!special) return

  switch (special.kind) {
    case 'forward': {
      const from = player.position
      const to = from + (special.value ?? 0)
      if (to >= FINISH) {
        events.push({ type: 'forward', color: player.color, value: special.value ?? 0, from, to: FINISH })
        finish(state, player, events)
        return
      }
      player.position = to
      events.push({ type: 'forward', color: player.color, value: special.value ?? 0, from, to })
      // Displaced, not rolled → destination does NOT re-trigger.
      return
    }
    case 'back': {
      const from = player.position
      const to = Math.max(START, from - (special.value ?? 0))
      player.position = to
      events.push({ type: 'back', color: player.color, value: special.value ?? 0, from, to })
      return // displaced → no re-trigger
    }
    case 'switch': {
      const other = findSwitchTarget(state, player)
      if (!other) return // no valid target → no-op
      const from = player.position
      const otherFrom = other.position
      player.position = otherFrom
      other.position = from
      events.push({
        type: 'switch',
        color: player.color,
        from,
        to: player.position,
        otherColor: other.color,
        otherFrom,
        otherTo: other.position,
      })
      return // displaced → no re-trigger for either dolphin
    }
    case 'rollAgain': {
      events.push({ type: 'rollAgain', color: player.color })
      // The bonus roll is a real roll, so ITS landing activates (may chain).
      rollAndResolve(state, player, die(), die, board, events)
      return
    }
  }
}

/**
 * Play the active player's full turn: roll, move, resolve, then advance to the
 * next unfinished player. Returns a new state + the ordered event list.
 */
export function takeTurn(
  prev: GameState,
  die: Die,
  board: BoardLookup = defaultBoard,
): TurnResult {
  if (prev.over) return { state: prev, events: [] }
  const state: GameState = structuredClone(prev)
  const player = state.players[state.current]!
  const events: TurnEvent[] = []

  rollAndResolve(state, player, die(), die, board, events)

  // Advance to the next player who hasn't finished (if any remain).
  if (!state.over) {
    const n = state.players.length
    for (let step = 1; step <= n; step++) {
      const idx = (state.current + step) % n
      if (state.players[idx]!.place === null) {
        state.current = idx
        break
      }
    }
  }
  return { state, events }
}
