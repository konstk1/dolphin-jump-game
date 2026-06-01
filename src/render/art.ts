// Sunny Lagoon art primitives (M1) — code-drawn SVG, the chosen art direction.
// All art is reusable by the real game (M3+). Dolphins recolor via a single hex
// fill injected directly into the SVG `fill` attribute — NOT a CSS var() inside
// SVG, which is unreliable in iPad WebKit (flagged during concept review).

export type DolphinColor = 'purple' | 'pink' | 'blue' | 'green'

/** Canonical dolphin token colors (GAME_DESIGN.md). */
export const DOLPHIN_HEX: Record<DolphinColor, string> = {
  purple: '#9b5de5',
  pink: '#ff5db1',
  blue: '#2d8fff',
  green: '#2ecc71',
}

export const DOLPHIN_ORDER: DolphinColor[] = ['purple', 'pink', 'blue', 'green']

/**
 * Shared SVG <defs>: the reusable dolphin <symbol> + the white glow-rim filter.
 * Injected once into the document; tokens reference it via <use>.
 */
export const SVG_DEFS = /* html */ `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="dj-dolphin" viewBox="0 0 120 120">
      <!-- tail -->
      <path d="M14 60 C 6 46, 4 36, 12 32 C 18 40, 22 48, 26 54 C 22 58, 18 60, 14 60 Z" />
      <path d="M14 62 C 6 76, 4 86, 12 90 C 18 82, 22 74, 26 68 C 22 64, 18 62, 14 62 Z" />
      <!-- dorsal fin -->
      <path d="M58 26 C 60 12, 70 8, 78 12 C 74 22, 70 30, 64 38 Z" />
      <!-- main body -->
      <path d="M24 60 C 24 40, 42 28, 66 30 C 86 31, 102 40, 110 54 C 112 58, 112 62, 110 66 C 100 76, 96 78, 90 80 C 78 90, 58 94, 42 88 C 28 83, 24 74, 24 60 Z" />
      <!-- snout tip -->
      <path d="M104 54 C 114 52, 119 54, 118 58 C 117 62, 112 64, 104 64 C 102 60, 102 57, 104 54 Z" />
      <!-- pectoral fin -->
      <path d="M52 78 C 50 92, 56 100, 66 100 C 66 92, 64 84, 60 78 Z" />
      <!-- light belly patch -->
      <path d="M40 78 C 52 90, 74 92, 90 82 C 80 88, 60 90, 48 82 C 44 80, 42 79, 40 78 Z" fill="#ffffff" opacity="0.55" />
      <!-- glossy highlight -->
      <path d="M40 42 C 56 34, 78 35, 94 44 C 80 39, 58 39, 44 47 C 42 45, 41 43, 40 42 Z" fill="#ffffff" opacity="0.7" />
      <!-- smile -->
      <path d="M96 66 C 104 72, 112 71, 116 67" fill="none" stroke="#1a3a4f" stroke-width="3" stroke-linecap="round" opacity="0.55" />
      <!-- eye -->
      <circle cx="92" cy="54" r="9" fill="#fff" />
      <circle cx="93" cy="55" r="6" fill="#16384a" />
      <circle cx="95.5" cy="52.5" r="2.4" fill="#fff" />
      <circle cx="90" cy="57" r="1.3" fill="#fff" opacity="0.85" />
      <!-- cheek blush -->
      <circle cx="80" cy="64" r="5" fill="#ff8fb0" opacity="0.5" />
    </symbol>

    <filter id="dj-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="rim" />
      <feFlood flood-color="#ffffff" flood-opacity="1" />
      <feComposite in2="rim" operator="in" result="rimcol" />
      <feGaussianBlur in="rimcol" stdDeviation="1.6" result="rimblur" />
      <feDropShadow dx="0" dy="3" stdDeviation="2.4" flood-color="#0a3a5c" flood-opacity="0.35" />
      <feMerge>
        <feMergeNode in="rimblur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <linearGradient id="dj-die-shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="0.4" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="1" stop-color="#bfe9f7" stop-opacity="0.4" />
    </linearGradient>
  </defs>
</svg>`

/** A single recolored dolphin token. `color` is injected as a direct hex fill. */
export function dolphinSVG(color: DolphinColor, className = 'dj-token'): string {
  return /* html */ `<svg class="${className}" viewBox="0 0 120 120" aria-label="${color} dolphin"><g filter="url(#dj-glow)"><use href="#dj-dolphin" fill="${DOLPHIN_HEX[color]}" /></g></svg>`
}

/** Pip layouts for die faces 1–6 (unit coords on a 0..6 grid). */
const DIE_PIPS: Record<number, Array<[number, number]>> = {
  1: [[3, 3]],
  2: [[1.6, 1.6], [4.4, 4.4]],
  3: [[1.6, 1.6], [3, 3], [4.4, 4.4]],
  4: [[1.6, 1.6], [4.4, 1.6], [1.6, 4.4], [4.4, 4.4]],
  5: [[1.6, 1.6], [4.4, 1.6], [3, 3], [1.6, 4.4], [4.4, 4.4]],
  6: [[1.6, 1.5], [4.4, 1.5], [1.6, 3], [4.4, 3], [1.6, 4.5], [4.4, 4.5]],
}

/** The die showing a given face (1–6). */
export function dieSVG(face = 5, className = 'dj-die'): string {
  const pips = (DIE_PIPS[face] ?? DIE_PIPS[5]!)
    .map(([x, y]) => `<circle cx="${(x / 6) * 80}" cy="${(y / 6) * 80}" r="6" />`)
    .join('')
  return /* html */ `<svg class="${className}" viewBox="0 0 80 80" aria-label="die showing ${face}">
    <rect x="6" y="6" width="68" height="68" rx="18" fill="#ffffff" stroke="#cfeefa" stroke-width="3" />
    <rect x="6" y="6" width="68" height="68" rx="18" fill="url(#dj-die-shine)" />
    <g fill="#1487b0">${pips}</g>
  </svg>`
}

/**
 * The four special-spot icons (themed + color-coded). `flipX` mirrors the icon
 * horizontally — used so the forward arrow points along the row's direction of
 * travel on the serpentine board (right-to-left rows get a flipped arrow).
 */
export function specialIconSVG(
  kind: 'forward' | 'back' | 'switch' | 'rollAgain',
  flipX = false,
): string {
  switch (kind) {
    case 'forward': {
      // Mirror about the 48-unit viewBox so the arrow faces the travel direction.
      const t = flipX ? ` transform="translate(48 0) scale(-1 1)"` : ''
      return /* html */ `<svg viewBox="0 0 48 48" aria-label="jump forward"><g${t}>
        <path d="M6 30 C 14 22, 26 22, 34 28" fill="none" stroke="#0f7a3b" stroke-width="3.5" stroke-linecap="round" opacity="0.55" />
        <path d="M6 36 C 16 30, 28 30, 38 34" fill="none" stroke="#0f7a3b" stroke-width="3.5" stroke-linecap="round" opacity="0.55" />
        <path d="M24 14 L40 26 L24 38 L24 30 L12 30 L12 22 L24 22 Z" fill="#ffffff" stroke="#0f7a3b" stroke-width="2" stroke-linejoin="round" />
        <circle cx="9" cy="20" r="3" fill="#eafff2" /><circle cx="14" cy="14" r="2" fill="#eafff2" />
      </g></svg>`
    }
    case 'back':
      return /* html */ `<svg viewBox="0 0 48 48" aria-label="jump back">
        <path d="M16 10 C 26 8, 34 14, 34 22 C 34 28, 30 32, 25 33 L 23 33 C 18 32, 14 28, 14 22 C 14 16, 12 12, 16 10 Z" fill="#fff" stroke="#b81616" stroke-width="2" />
        <g fill="none" stroke="#b81616" stroke-width="2" stroke-linecap="round">
          <path d="M16 30 C 12 38, 8 40, 6 44" /><path d="M21 33 C 20 40, 18 43, 16 46" />
          <path d="M27 33 C 28 40, 30 43, 32 46" /><path d="M32 30 C 36 38, 40 40, 42 44" />
          <path d="M24 34 C 24 41, 24 44, 24 47" />
        </g>
        <circle cx="21" cy="21" r="2.4" fill="#b81616" /><circle cx="28" cy="21" r="2.4" fill="#b81616" />
      </svg>`
    case 'switch':
      return /* html */ `<svg viewBox="0 0 48 48" aria-label="switch places">
        <path d="M24 8 C 36 8, 42 16, 40 26 C 38 34, 30 38, 23 36 C 17 35, 14 30, 16 25 C 18 21, 23 20, 26 23 C 28 25, 27 28, 25 28" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.9" />
        <g stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 18 L16 12 L16 16" /><path d="M38 30 L32 36 L32 32" />
        </g>
      </svg>`
    case 'rollAgain':
      return /* html */ `<svg viewBox="0 0 48 48" aria-label="roll again">
        <g transform="rotate(-12 24 24)">
          <rect x="13" y="13" width="22" height="22" rx="6" fill="#fff" stroke="#c9870a" stroke-width="2" />
          <circle cx="19" cy="19" r="2.4" fill="#c9870a" /><circle cx="29" cy="19" r="2.4" fill="#c9870a" />
          <circle cx="24" cy="24" r="2.4" fill="#c9870a" /><circle cx="19" cy="29" r="2.4" fill="#c9870a" />
          <circle cx="29" cy="29" r="2.4" fill="#c9870a" />
        </g>
        <path d="M38 8 l1.6 4.2 4.4 1.6 -4.4 1.6 -1.6 4.2 -1.6 -4.2 -4.4 -1.6 4.4 -1.6 Z" fill="#fff8dc" />
      </svg>`
  }
}

/** The glowing treasure chest (the finish). */
export function treasureChestSVG(): string {
  return /* html */ `<svg viewBox="0 0 64 64" aria-label="treasure chest finish">
    <rect x="10" y="30" width="44" height="24" rx="5" fill="#8a5a22" stroke="#5e3a12" stroke-width="2" />
    <circle cx="20" cy="32" r="5" fill="#ffd23f" stroke="#c9870a" stroke-width="1.5" />
    <circle cx="32" cy="30" r="6" fill="#ffe066" stroke="#c9870a" stroke-width="1.5" />
    <circle cx="44" cy="32" r="5" fill="#ffd23f" stroke="#c9870a" stroke-width="1.5" />
    <path d="M8 30 C 8 18, 16 12, 32 12 C 48 12, 56 18, 56 30 Z" fill="#a86a28" stroke="#5e3a12" stroke-width="2" />
    <rect x="8" y="28" width="48" height="6" rx="2" fill="#c9870a" stroke="#5e3a12" stroke-width="1.5" />
    <rect x="28" y="30" width="8" height="9" rx="2" fill="#ffe066" stroke="#5e3a12" stroke-width="1.5" />
    <path d="M16 18 C 24 15, 40 15, 48 18" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.6" />
  </svg>`
}

/** The bouncy rounded "Dolphin Jump" title. */
export function titleHTML(): string {
  return /* html */ `<div class="dj-title"><span class="dj-word dj-word--dolphin">Dolphin</span><span class="dj-word dj-word--jump">Jump</span></div>`
}

/** A celebratory "You Win!" banner featuring the winning dolphin. */
export function winBannerHTML(winner: DolphinColor): string {
  return /* html */ `<div class="dj-banner">
    <span class="dj-banner__text">YOU<br>WIN!</span>
    ${dolphinSVG(winner, 'dj-win-dolphin')}
    <svg class="dj-banner__stars" viewBox="0 0 160 64" aria-hidden="true">
      <g fill="#fff">
        <path d="M14 10 l1.4 3.6 3.8 1.4 -3.8 1.4 -1.4 3.6 -1.4 -3.6 -3.8 -1.4 3.8 -1.4 Z" />
        <path d="M150 14 l1.2 3 3.2 1.2 -3.2 1.2 -1.2 3 -1.2 -3 -3.2 -1.2 3.2 -1.2 Z" />
        <path d="M138 50 l1 2.6 2.8 1 -2.8 1 -1 2.6 -1 -2.6 -2.8 -1 2.8 -1 Z" />
      </g>
      <g fill="#ff5db1"><circle cx="6" cy="40" r="2.5" /><circle cx="156" cy="46" r="2.5" /></g>
    </svg>
  </div>`
}
