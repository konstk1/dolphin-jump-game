import { describe, it, expect } from 'vitest'
import { buildPlayers, type PlayerSetup } from '../src/engine/turnOrder'
import { START } from '../src/engine/types'

describe('turn order (youngest → oldest, sit-outs)', () => {
  it('orders youngest first', () => {
    const setups: PlayerSetup[] = [
      { color: 'purple', age: 38 },
      { color: 'pink', age: 7 },
      { color: 'blue', age: 4 },
      { color: 'green', age: 41 },
    ]
    expect(buildPlayers(setups).map((p) => p.color)).toEqual(['blue', 'pink', 'purple', 'green'])
  })

  it('omits dolphins with no age (sit-outs)', () => {
    const setups: PlayerSetup[] = [
      { color: 'purple', age: 7 },
      { color: 'pink', age: null },
      { color: 'blue', age: 4 },
      { color: 'green', age: null },
    ]
    const players = buildPlayers(setups)
    expect(players.map((p) => p.color)).toEqual(['blue', 'purple'])
  })

  it('breaks age ties by start-screen order (stable & deterministic)', () => {
    const setups: PlayerSetup[] = [
      { color: 'green', age: 5 },
      { color: 'pink', age: 5 },
      { color: 'purple', age: 5 },
    ]
    // SETUP_ORDER is purple, pink, blue, green → purple, pink, green
    expect(buildPlayers(setups).map((p) => p.color)).toEqual(['purple', 'pink', 'green'])
  })

  it('supports 2, 3, and 4 player counts', () => {
    expect(buildPlayers([{ color: 'purple', age: 7 }, { color: 'blue', age: 4 }])).toHaveLength(2)
    expect(buildPlayers([{ color: 'purple', age: 7 }, { color: 'blue', age: 4 }, { color: 'pink', age: 9 }])).toHaveLength(3)
    expect(
      buildPlayers([
        { color: 'purple', age: 7 },
        { color: 'blue', age: 4 },
        { color: 'pink', age: 9 },
        { color: 'green', age: 38 },
      ]),
    ).toHaveLength(4)
  })

  it('starts every dolphin on spot 1 with no place', () => {
    const players = buildPlayers([{ color: 'blue', age: 4 }, { color: 'pink', age: 7 }])
    for (const p of players) {
      expect(p.position).toBe(START)
      expect(p.place).toBeNull()
    }
  })
})
