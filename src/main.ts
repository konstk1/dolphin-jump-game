import './styles/main.css'
import { renderMockup } from './render'

// M1: render the static Sunny Lagoon art mockup (full board, dolphins, icons,
// die, win banner) for family reaction. Interactive screens land in M3.
const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app root not found')

renderMockup(app)
