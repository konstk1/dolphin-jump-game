import './styles/main.css'
import './styles/theme.css'
import { SVG_DEFS, DOLPHIN_ORDER, dieSVG, type DolphinColor } from './render/art'
import { startScreenHTML, gameScreenHTML, winScreenHTML, describeTurn, lastRollValue } from './render/screens'
import { createGame, takeTurn } from './engine/game'
import type { GameState } from './engine/types'
import type { PlayerSetup } from './engine/turnOrder'
import { animateTurn } from './sequencer'

// M3 app controller: a small screen state machine. Dolphins now glide along the
// path (sequencer); the rest of the M4 juice builds on this.

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app root not found')

// Shared SVG defs (dolphin symbol + glow filter) live once on the body so they
// survive re-rendering #app.
document.body.insertAdjacentHTML('afterbegin', SVG_DEFS)

type Screen = 'start' | 'game' | 'win'

const state = {
  screen: 'start' as Screen,
  game: null as GameState | null,
  dieFace: 1,
  message: '',
  lastSetups: [] as PlayerSetup[],
}
let animating = false

const randomDie = (): number => 1 + Math.floor(Math.random() * 6)

function render(): void {
  if (state.screen === 'start') {
    const prefill: Partial<Record<DolphinColor, number>> = {}
    for (const s of state.lastSetups) if (typeof s.age === 'number') prefill[s.color] = s.age
    app!.innerHTML = startScreenHTML(prefill)
    wireStart()
  } else if (state.screen === 'game') {
    app!.innerHTML = gameScreenHTML(state.game!, state.dieFace, state.message)
    wireGame()
  } else {
    app!.innerHTML = winScreenHTML(state.game!)
    wireWin()
  }
}

function wireStart(): void {
  const dive = app!.querySelector<HTMLButtonElement>('#dj-dive')
  const hint = app!.querySelector<HTMLParagraphElement>('#dj-start-hint')
  dive?.addEventListener('click', () => {
    const setups: PlayerSetup[] = DOLPHIN_ORDER.map((color) => {
      const input = app!.querySelector<HTMLInputElement>(`.dj-age[data-color="${color}"]`)
      const raw = input?.value.trim() ?? ''
      const age = raw === '' ? null : Number(raw)
      return { color, age: age !== null && Number.isFinite(age) && age > 0 ? age : null }
    })
    if (setups.filter((s) => s.age !== null).length < 2) {
      if (hint) {
        hint.textContent = '🐬 Add an age for at least 2 dolphins!'
        hint.classList.add('dj-hint--error')
      }
      return
    }
    state.lastSetups = setups
    state.game = createGame(setups)
    state.dieFace = 1
    state.message = ''
    state.screen = 'game'
    render()
  })
}

function wireGame(): void {
  app!.querySelector<HTMLButtonElement>('#dj-roll')?.addEventListener('click', () => void rollTurn())
}

function wireWin(): void {
  app!.querySelector<HTMLButtonElement>('#dj-again')?.addEventListener('click', () => {
    state.screen = 'start'
    render()
  })
}

/** Roll for the current player: take the turn, animate it, then commit + re-render. */
async function rollTurn(): Promise<void> {
  if (!state.game || state.game.over || animating) return
  animating = true

  const die = app!.querySelector<HTMLButtonElement>('#dj-roll')
  if (die) die.disabled = true
  const board = app!.querySelector<HTMLElement>('.dj-board')

  const { state: next, events } = takeTurn(state.game, randomDie)

  if (board) {
    await animateTurn(board, events, {
      dieEl: die,
      setDie: (value) => {
        if (die) die.innerHTML = dieSVG(value, 'dj-die')
      },
    })
  }

  state.game = next
  state.dieFace = lastRollValue(events) ?? state.dieFace
  state.message = describeTurn(events)
  state.screen = next.over ? 'win' : 'game'
  animating = false
  render()
}

// Spacebar rolls the die (works regardless of focus; the `animating` guard and
// preventDefault stop double-fires and page scroll).
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === ' ') {
    if (state.screen === 'game') {
      e.preventDefault()
      void rollTurn()
    }
  }
})

render()
