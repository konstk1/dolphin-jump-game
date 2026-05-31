// M3 screens: start (pick dolphins + ages), game (board + die + turn HUD), and
// win (places). Pure HTML builders — main.ts owns state and wires listeners.
// Movement is "snap" here (no animation); the M4 sequencer adds the juice.

import { DOLPHIN_ORDER, dolphinSVG, dieSVG, titleHTML, type DolphinColor } from './art'
import { boardHTML, spotCenterPercent } from './board'
import type { GameState } from '../engine/types'
import type { TurnEvent } from '../engine/game'

/** Small per-color horizontal spread so dolphins sharing a spot don't fully overlap. */
const SPREAD: Record<DolphinColor, number> = { purple: -10, pink: -4, blue: 4, green: 10 }

/** The movable dolphin pawn layer (one absolutely-positioned pawn per player). */
export function pawnsHTML(game: GameState): string {
  const pawns = game.players
    .map((p) => {
      const { x, y } = spotCenterPercent(p.position)
      return `<span class="dj-pawn" data-color="${p.color}" style="left:${x}%;top:${y}%;--spread:${SPREAD[p.color]}px">${dolphinSVG(p.color, 'dj-mini')}</span>`
    })
    .join('')
  return `<div class="dj-tokens" aria-hidden="true">${pawns}</div>`
}

const NAME: Record<DolphinColor, string> = {
  purple: 'Purple',
  pink: 'Pink',
  blue: 'Blue',
  green: 'Green',
}

const cap = (c: DolphinColor) => NAME[c]

/** Short, kid-readable summary of a turn (for the playtest log). */
export function describeTurn(events: TurnEvent[]): string {
  if (events.length === 0) return ''
  const first = events[0]!
  const roll = events.find((e) => e.type === 'roll')
  const who = cap(first.color)
  let msg = roll ? `${who} rolled ${roll.value}` : who
  if (events.some((e) => e.type === 'forward')) msg += ' → 💨 zoomed ahead!'
  if (events.some((e) => e.type === 'back')) msg += ' → 🐙 pulled back!'
  if (events.some((e) => e.type === 'switch')) msg += ' → 🌀 switched places!'
  if (events.some((e) => e.type === 'rollAgain')) msg += ' → 🎲 rolls again!'
  const fin = events.find((e) => e.type === 'finish')
  if (fin && fin.type === 'finish') msg += ` → 🏁 finished #${fin.place}!`
  return msg
}

/** The last die value rolled this turn (to show on the die face). */
export function lastRollValue(events: TurnEvent[]): number | null {
  let v: number | null = null
  for (const e of events) if (e.type === 'roll') v = e.value
  return v
}

function stageShell(inner: string): string {
  return `<div class="dj-stage">
    <div class="dj-rays"></div>
    <div class="dj-sandglow"></div>
    <div class="dj-content">${inner}</div>
  </div>`
}

// ===== Start screen =====
export function startScreenHTML(prefill: Partial<Record<DolphinColor, number>> = {}): string {
  const rows = DOLPHIN_ORDER.map((c) => {
    const val = prefill[c] !== undefined ? String(prefill[c]) : ''
    return `<label class="dj-setup-row">
      <span class="dj-setup-dolphin">${dolphinSVG(c, 'dj-token')}</span>
      <span class="dj-setup-name">${cap(c)}</span>
      <input class="dj-age" type="number" inputmode="numeric" min="1" max="120"
             data-color="${c}" placeholder="age" value="${val}" aria-label="${cap(c)} age" />
    </label>`
  }).join('')

  return stageShell(`
    ${titleHTML()}
    <p class="dj-subtitle">Enter an age for each dolphin who's playing. Leave blank to sit out.</p>
    <div class="dj-setup">${rows}</div>
    <p class="dj-hint" id="dj-start-hint">Add at least 2 dolphins to play.</p>
    <button class="dj-btn dj-btn--go" id="dj-dive" type="button">🌊 Dive in!</button>
  `)
}

// ===== Game screen =====
export function gameScreenHTML(game: GameState, dieFace: number, message: string): string {
  const current = game.players[game.current]!
  return stageShell(`
    <div class="dj-hud">
      <span class="dj-hud__dolphin">${dolphinSVG(current.color, 'dj-token')}</span>
      <span class="dj-hud__turn">${cap(current.color)}'s turn</span>
    </div>
    ${boardHTML(pawnsHTML(game))}
    <div class="dj-controls">
      <button class="dj-die-btn" id="dj-roll" type="button" aria-label="Roll the die">${dieSVG(dieFace, 'dj-die')}</button>
      <p class="dj-log" id="dj-log">${message || 'Tap the die to roll!'}</p>
    </div>
  `)
}

// ===== Win screen =====
export function winScreenHTML(game: GameState): string {
  const medals = ['🥇', '🥈', '🥉', '4️⃣']
  const ranked = [...game.players].sort((a, b) => (a.place ?? 99) - (b.place ?? 99))
  const winner = ranked[0]!
  const places = ranked
    .map((p, i) => `<li class="dj-place">
        <span class="dj-place__medal">${medals[i] ?? ''}</span>
        <span class="dj-place__dolphin">${dolphinSVG(p.color, 'dj-token')}</span>
        <span class="dj-place__name">${cap(p.color)}</span>
      </li>`)
    .join('')

  return stageShell(`
    <div class="dj-win">
      <div class="dj-win__stars" aria-hidden="true">✨ ⭐ ✨</div>
      <div class="dj-win__hero">${dolphinSVG(winner.color, 'dj-win-dolphin')}</div>
      <h1 class="dj-win__title">${cap(winner.color)} Wins!</h1>
      <ol class="dj-places">${places}</ol>
      <button class="dj-btn dj-btn--go" id="dj-again" type="button">🔁 Play again</button>
    </div>
  `)
}
