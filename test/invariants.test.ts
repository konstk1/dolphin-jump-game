import { describe, it, expect } from 'vitest'
import { createGame, takeTurn } from '../src/engine/game'
import type { Die } from '../src/engine/types'
import { FINISH, START } from '../src/engine/types'
import type { PlayerSetup } from '../src/engine/turnOrder'

// Property test: play many full games with a real (seeded) random die and assert
// the engine's invariants hold every turn. Guards against edge cases the
// hand-written cases miss — important since the engine is largely AI-written.

/** Tiny deterministic PRNG (mulberry32) → reproducible "random" die. */
function seededDie(seed: number): Die {
  let s = seed >>> 0
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296
    return 1 + Math.floor(r * 6) // 1..6
  }
}

const FOUR: PlayerSetup[] = [
  { color: 'blue', age: 4 },
  { color: 'pink', age: 7 },
  { color: 'green', age: 9 },
  { color: 'purple', age: 38 },
]

describe('engine invariants (randomized full games)', () => {
  it('plays 200 full games without ever violating an invariant', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const die = seededDie(seed)
      let state = createGame(FOUR)
      let guard = 0
      const seenPlaces = new Set<number>()

      while (!state.over) {
        const before = state.players.map((p) => p.place)
        const { state: next } = takeTurn(state, die)
        state = next

        // positions always in [START, FINISH]
        for (const p of state.players) {
          expect(p.position).toBeGreaterThanOrEqual(START)
          expect(p.position).toBeLessThanOrEqual(FINISH)
          // a finished dolphin is parked on FINISH with a place
          if (p.place !== null) {
            expect(p.position).toBe(FINISH)
          }
        }

        // places are assigned 1,2,3,… uniquely and monotonically
        for (const p of state.players) {
          if (p.place !== null) {
            if (!before.includes(p.place)) {
              expect(seenPlaces.has(p.place)).toBe(false)
              seenPlaces.add(p.place)
            }
          }
        }

        // the active player is never one who already finished (unless game over)
        if (!state.over) {
          expect(state.players[state.current]!.place).toBeNull()
        }

        expect(++guard).toBeLessThan(100000) // games must terminate
      }

      // at game end: everyone finished, places are exactly 1..N
      expect(state.players.every((p) => p.place !== null)).toBe(true)
      const places = state.players.map((p) => p.place!).sort((a, b) => a - b)
      expect(places).toEqual(state.players.map((_, i) => i + 1))
      expect(state.hasWinner).toBe(true)
    }
  })
})
