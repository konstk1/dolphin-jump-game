# Dolphin Jump — Implementation Plan & Progress Tracker

> **This is the living cross-session tracker.** Status markers are kept current as work
> proceeds. A fresh session should read `CLAUDE.md` → this file → `git log` to orient.
>
> **Status legend:** ✅ done · ▶ in progress · ⬜ pending · 👀 needs user/family eval ·
> 🧪 prototyping spike

## Status at a glance
| Milestone | Status | Notes |
|-----------|--------|-------|
| M0 — Scaffold & iPad pipeline | ✅ done (👀 iPad-HTTPS check pending user) | builds/tests/serves over HTTP; HTTPS opt-in |
| M1 — Visual deep-sea art mockup | ✅ done — **Sunny Lagoon** (👀 verified Chromium; iPad check pending) | full 100-spot board renders; kids picked Sunny Lagoon |
| M2 — Pure rules engine + tests | ⬜ next | independent of M1 |
| M3 — Playable vertical slice | ⬜ pending | depends on M1 + M2; "is it fun" gate |
| M4 — Animation sequencer & juice | ⬜ pending | depends on M3 |
| M5 — Start-screen polish & persistence | ⬜ pending | independent of M4 |
| M6 — PWA install, offline, kid-proofing | ⬜ pending | |
| M7 — Deploy to GitHub Pages | ⬜ pending | |

**Next action:** M2 (pure rules engine + tests) — independent of the art.
**Pending user checkpoints:** (1) run `pnpm dev:ipad`, trust the mkcert CA, open on the
iPad mini over HTTPS to confirm the wifi workflow (M0 👀); (2) see the M1 Sunny Lagoon
mockup on the real iPad — verified clean in Chromium, but device/WebKit unseen (watch:
`-webkit-text-stroke` title, SVG glow filter, board legibility at true iPad-mini size).

**M1 build notes:** chosen art lives in `src/render/art.ts` (Sunny Lagoon primitives:
recolorable dolphin symbol, die, 4 special icons, treasure chest, title, win banner),
`src/render/board.ts` (full 100-spot boustrophedon snake; start bottom-left → chest
top-left), `src/styles/theme.css`. Dolphin colors injected as **direct hex fills** (not
SVG `var()`) for WebKit safety. Board uses a square 10×10 CSS grid that fills the portrait
stage. `src/render/board.ts` currently renders a **SAMPLE** special-spot layout
(`SAMPLE_SPECIALS`/`SAMPLE_TOKENS`) — M3 swaps this for real engine data from
`src/board.ts`. Also fixed a pre-existing build break: added `@types/node` +
`tsconfig` `types: [..., "node"]` for the user's `process.env.HTTPS` in `vite.config.ts`.

---

## Context
Design is fully specified across three committed docs:
- `IDEA.md` — original concept.
- `GAME_DESIGN.md` — the **what**: rules, mechanics, art direction (gameplay source of
  truth; supersedes earlier drafts — final rules use **switch-with-nearest** and
  **~10–12 special spots**).
- `TECH_DESIGN.md` — the **how**: Vanilla TS + Vite, code-drawn SVG/CSS, installable
  portrait PWA, pnpm, Vitest, GitHub Pages, localStorage.

Milestones are sized for **separate sessions**, each ending runnable + reviewable, with
explicit **user-eval checkpoints** so we never build the whole spec without family
feedback. **Build order: visual-first** (M1 before M2) so the kids react to art early.
**Commits:** only when the user explicitly asks.

---

## M0 — Scaffold & the iPad pipeline ✅ DONE (👀 iPad-HTTPS spike pending user)
**Goal:** running Vite+TS app reachable from the iPad over local HTTPS, tests & build wired.

Done: deps installed (Vite 8, TS 6, Vitest 4, pnpm 10.26 pinned); `pnpm test` (2 passing),
`pnpm build` (clean strict types, ~1KB bundles), `pnpm dev`/`pnpm preview` over HTTP all
verified; deep-sea boot screen renders.
**Deviation from plan:** mkcert's CA install needs one-time interactive `sudo`, so HTTPS is
**opt-in** via `pnpm dev:ipad` / `pnpm preview:ipad` (gated on `HTTPS=1`) — everyday dev +
CI stay sudo-free.
**Remaining (user, on real laptop+iPad):** `pnpm dev:ipad` → enter macOS password to trust
the mkcert CA → open `https://<laptop-LAN-ip>:5173/dolphin-jump-game/` on iPad, trust cert,
confirm load + hot-reload.

---

## M1 — Visual spike: static deep-sea art mockup (kids react) ⬜ NEXT
**Goal:** non-interactive rendered mockup of the look for family reaction. No game logic.
Reused directly as the real render layer (`src/render/`).

Tasks (code-drawn SVG + CSS, recolorable):
- Deep-sea theme: depth gradient (sunlit shallows → deep blue), light rays, drifting bubbles.
- 4 glossy mascot dolphins as one recolorable SVG (purple/pink/blue/green) + bright glow rim.
- Board tiles: plain, start, treasure-chest finish; the 4 themed color-coded special icons
  (green bubble-current fwd, red octopus-grab back, blue whirlpool switch, gold sparkle-die
  roll-again), each with a number.
- Die; bouncy rounded "Dolphin Jump" title; small "You Win!" banner.
- Full 100-spot winding S-snake (start bottom → chest top) static, with numbers + a couple
  of dolphin tokens (incl. two sharing a spot).

Spikes: 🧪 snake-fit on iPad mini (tile size/rows/legibility); 🧪 blue-on-blue contrast.
Verification: ✅ renders cleanly laptop + iPad portrait, numbers crisp · 👀 **family art
reaction gate** — iterate until happy before any interactivity.

---

## M2 — Pure rules engine + full unit tests ⬜ (independent of M1)
**Goal:** complete game brain as pure TS, zero DOM, exhaustively tested (`TECH_DESIGN §3.1`).
Tasks (`src/engine/`, `src/board.ts`): types (`Player`, `SpecialSpot`, `GameState`); board
layout data (~10–12 balanced specials) + dev-time invariant validator; turn order
(youngest→oldest, sit-outs); movement + resolution rule ("only what you ROLL onto fires");
overshoot win; specials (forward, back+clamp, switch-with-nearest tie→ahead/same-spot
fallback, roll-again chain); end-of-game places.
Verification: ✅ `pnpm test` full edge-case suite (`TECH_DESIGN §7`) · 👀 optional console
playthrough printout.

---

## M3 — Playable vertical slice (engine + UI, minimal animation) ⬜
**Goal:** first fully playable game end-to-end, ugly-fast (snap moves, no juice) — validate
fun before animating. Start screen (plain inputs ok) → board (tap die → snap move → resolve
→ next) → win flow (snap-finish + places). Routing in `src/main.ts`.
Verification: ✅ playthroughs at 2/3/4 dolphins, every special triggers, overshoot+places
correct · 👀 **critical "is it fun" playtest** — cheapest place to tune board data (M2).

---

## M4 — Animation sequencer & juice ⬜
**Goal:** async timeline (`TECH_DESIGN §3.2`). Die spin; spot-by-spot hop; idle bob; happy
flip; special effects (bubble whoosh / octopus grab / whirlpool swap / sparkle die) with
correct roll-again chain timing; treasure-chest win party → ribbons fill 2nd/3rd/4th. Timings
centralized.
Verification: ✅ right animation per event, chain reads clearly, no races · 👀 feel-test.

---

## M5 — Start-screen polish & persistence ⬜ (independent of M4)
`+/−` age steppers (no keyboard) + tap-to-join glow; `src/persistence.ts` localStorage
save/pre-fill/clear of last dolphins + ages.
Verification: ✅ relaunch pre-fills, clearing works, steppers at extremes · 👀 kids set up
unaided.

---

## M6 — PWA install, offline & iPad kid-proofing ⬜
`vite-plugin-pwa` manifest (standalone, portrait, deep-sea colors, name) + SW precache; app
icons. Hardening: no double-tap-zoom/pinch, no selection/long-press callout,
`overscroll-behavior: none`, safe-area full-bleed. **Flip mkcert/PWA from stub to live.**
Verification: ✅ installable check passes · 👀 Add-to-Home-Screen full-screen, offline after
wifi-kill, kids can't zoom/refresh/swipe away.

---

## M7 — Deploy to GitHub Pages ⬜
`.github/workflows/` on push to `main`: `pnpm/action-setup` + `setup-node` (cache pnpm) →
build → publish `dist/`. Confirm `base: '/dolphin-jump-game/'`; enable Pages.
Verification: ✅ push deploys, live HTTPS URL, PWA installable from prod · 👀 family opens
live link on iPad, adds to home screen.

---

## Sequencing notes
- Order: M0 → **M1** → M2 → M3 → M4 → M5 → M6 → M7 (visual-first).
- Independent/reorderable: M1 ⇄ M2; M5 ⇄ M6. Hard deps: M3 needs M1+M2; M4 needs M3.
- Cheapest time to change rules/balance: M3 checkpoint (data-only tweaks to M2's board).
- Don't-skip gates: M0 iPad-HTTPS spike, M1 family art reaction, M3 "is it fun" playtest.
