// SVG + CSS render layer (TECH_DESIGN.md §3.3). Sunny Lagoon art direction.
// M1 deliverable: a static, non-interactive mockup of the look for family
// reaction — the full board, the dolphins, the special icons, the die, and a
// win banner. Wired into real screens during M3.

import '../styles/theme.css'
import {
  SVG_DEFS,
  DOLPHIN_ORDER,
  dolphinSVG,
  dieSVG,
  titleHTML,
  winBannerHTML,
} from './art'
import { boardHTML } from './board'

export * from './art'
export * from './board'

/** The full static M1 mockup scene. */
export function mockupHTML(): string {
  const lineup = DOLPHIN_ORDER.map((c) => dolphinSVG(c, 'dj-token')).join('')
  return /* html */ `
    <div class="dj-stage">
      <div class="dj-rays"></div>
      <div class="dj-sandglow"></div>
      <div class="dj-content">
        ${titleHTML()}
        <div class="dj-lineup">${lineup}</div>
        ${boardHTML()}
        <div class="dj-bottomrow">
          ${dieSVG(5, 'dj-die')}
          ${winBannerHTML('blue')}
        </div>
      </div>
    </div>`
}

/** Mount the M1 mockup into a root element. */
export function renderMockup(root: HTMLElement): void {
  // Shared SVG defs live once at the top of the document.
  if (!document.getElementById('dj-dolphin')) {
    root.insertAdjacentHTML('afterbegin', SVG_DEFS)
  }
  root.insertAdjacentHTML('beforeend', mockupHTML())
}
