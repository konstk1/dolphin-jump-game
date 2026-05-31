// Async animation timeline (TECH_DESIGN.md §3.2). Consumes the engine's
// replayable TurnEvent[] and glides the dolphin pawns along the winding path,
// awaiting each step so timing is obvious and tweakable. (M3 tweak: movement
// animation. The rest of M4 — die spin, special-spot effects, win party — builds
// on this.)

import type { DolphinColor } from './engine/types'
import type { TurnEvent } from './engine/game'
import { spotCenterPercent } from './render/board'

export interface AnimateOptions {
  /** Set the die face shown in the UI (called repeatedly during the roll spin). */
  setDie?: (value: number) => void
  /** The die button element — gets a `dj-die--rolling` class toggled during the spin. */
  dieEl?: HTMLElement | null
  /** ms per single-spot hop while swimming along the path. */
  hopMs?: number
  /** ms for a switch glide (a magical swap, not a path swim). */
  switchMs?: number
  /** ms pause when "roll again" fires, before the bonus roll. */
  pauseMs?: number
  /** how many random faces to flash before settling, and ms per flash. */
  spinFrames?: number
  spinFrameMs?: number
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Tumble the die through random faces, then settle on the real rolled value. */
async function spinDie(opts: AnimateOptions, finalValue: number): Promise<void> {
  if (!opts.setDie) return
  const frames = opts.spinFrames ?? 7
  const frameMs = opts.spinFrameMs ?? 55
  opts.dieEl?.classList.add('dj-die--rolling')
  for (let i = 0; i < frames; i++) {
    opts.setDie(1 + Math.floor(Math.random() * 6))
    await delay(frameMs)
  }
  opts.setDie(finalValue)
  await delay(160)
  opts.dieEl?.classList.remove('dj-die--rolling')
}

function pawn(board: HTMLElement, color: DolphinColor): HTMLElement | null {
  return board.querySelector<HTMLElement>(`.dj-pawn[data-color="${color}"]`)
}

function setPos(el: HTMLElement, index: number): void {
  const { x, y } = spotCenterPercent(index)
  el.style.left = `${x}%`
  el.style.top = `${y}%`
}

/** Swim a dolphin spot-by-spot from `from` to `to` (follows the winding path). */
async function swim(board: HTMLElement, color: DolphinColor, from: number, to: number, hopMs: number): Promise<void> {
  if (from === to) return
  const el = pawn(board, color)
  if (!el) return
  const dir = to > from ? 1 : -1
  for (let s = from + dir; ; s += dir) {
    setPos(el, s)
    await delay(hopMs)
    if (s === to) break
  }
}

/** Glide a dolphin straight to a spot (used for the switch swap). */
async function glide(board: HTMLElement, color: DolphinColor, to: number, ms: number): Promise<void> {
  const el = pawn(board, color)
  if (!el) return
  setPos(el, to)
  await delay(ms)
}

/** Replay a turn's events as animation on the live board. */
export async function animateTurn(
  board: HTMLElement,
  events: TurnEvent[],
  opts: AnimateOptions = {},
): Promise<void> {
  const hopMs = opts.hopMs ?? 130
  const switchMs = opts.switchMs ?? 380
  const pauseMs = opts.pauseMs ?? 260

  for (const ev of events) {
    switch (ev.type) {
      case 'roll':
        await spinDie(opts, ev.value)
        await swim(board, ev.color, ev.from, ev.to, hopMs)
        break
      case 'forward':
      case 'back':
        await delay(120) // beat before the special whisks them off
        await swim(board, ev.color, ev.from, ev.to, hopMs)
        break
      case 'switch':
        await delay(120)
        await Promise.all([
          glide(board, ev.color, ev.to, switchMs),
          glide(board, ev.otherColor, ev.otherTo, switchMs),
        ])
        break
      case 'rollAgain':
        await delay(pauseMs)
        break
      case 'finish':
        await delay(150) // a small beat as they reach the chest
        break
    }
  }
}
