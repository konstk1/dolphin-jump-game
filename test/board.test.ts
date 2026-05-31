import { describe, it, expect } from 'vitest'
import {
  SPECIAL_SPOTS,
  validateBoard,
  specialAt,
  PROTECTED_START,
  PROTECTED_FINISH,
} from '../src/board'
import type { SpecialSpot } from '../src/engine/types'
import { FINISH } from '../src/engine/types'

describe('board layout & invariants', () => {
  it('the shipped board satisfies all invariants', () => {
    expect(validateBoard()).toEqual([])
  })

  it('has a balanced, light count of specials (~10–12)', () => {
    expect(SPECIAL_SPOTS.length).toBeGreaterThanOrEqual(10)
    expect(SPECIAL_SPOTS.length).toBeLessThanOrEqual(12)
  })

  it('specialAt finds and misses correctly', () => {
    expect(specialAt(17)).toMatchObject({ kind: 'forward', value: 5 })
    expect(specialAt(2)).toBeUndefined()
  })

  it('keeps the start and finish zones clear', () => {
    for (const s of SPECIAL_SPOTS) {
      expect(s.index).toBeGreaterThan(PROTECTED_START)
      expect(s.index).toBeLessThanOrEqual(FINISH - PROTECTED_FINISH)
    }
  })

  // The validator must CATCH bad layouts — prove each rule fires.
  it('flags a jump that targets another special (chaining)', () => {
    const bad: SpecialSpot[] = [
      { index: 30, kind: 'forward', value: 5 },
      { index: 35, kind: 'switch' },
    ]
    expect(validateBoard(bad).some((e) => /chaining/.test(e))).toBe(true)
  })

  it('flags a back-jump that underflows past spot 1', () => {
    const bad: SpecialSpot[] = [{ index: 16, kind: 'back', value: 20 }]
    expect(validateBoard(bad).some((e) => /underflow/.test(e))).toBe(true)
  })

  it('flags specials in the protected start/finish zones', () => {
    expect(validateBoard([{ index: 5, kind: 'rollAgain' }]).some((e) => /start zone/.test(e))).toBe(true)
    expect(validateBoard([{ index: 95, kind: 'rollAgain' }]).some((e) => /finish stretch/.test(e))).toBe(true)
  })
})
