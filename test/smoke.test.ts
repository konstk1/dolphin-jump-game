import { describe, it, expect } from 'vitest'
import { ENGINE_READY } from '../src/engine'

// M0 smoke test: proves the Vitest runner + engine import wiring work end to end,
// de-risking the M2 engine test suite.
describe('scaffold', () => {
  it('runs the test runner', () => {
    expect(1 + 1).toBe(2)
  })

  it('imports the engine module', () => {
    expect(ENGINE_READY).toBe(true)
  })
})
