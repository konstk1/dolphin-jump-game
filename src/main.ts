import './styles/main.css'
import { ENGINE_READY } from './engine'

// M0 boot screen — proves the Vite + TS pipeline renders. Real screens land in M3.
const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app root not found')

app.innerHTML = `
  <main class="boot">
    <div class="boot__dolphin" aria-hidden="true">🐬</div>
    <h1 class="boot__title">Dolphin Jump</h1>
    <p class="boot__tag">Deep-sea adventure — coming soon</p>
    <p class="boot__status">scaffold ready${ENGINE_READY ? ' · engine wired' : ''}</p>
  </main>
`
