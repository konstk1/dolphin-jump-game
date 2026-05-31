// Pure rules engine (TECH_DESIGN.md §3.1) — zero DOM, fully unit-tested.

export * from './types'
export * from './turnOrder'
export * from './game'

/** Sentinel proving the engine module is wired into the app + tests. */
export const ENGINE_READY = true
