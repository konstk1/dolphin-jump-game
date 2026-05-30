# Dolphin Jump — Technical Design Document

This document specifies **how** Dolphin Jump is built, run, tested, and hosted. It is a
companion to `GAME_DESIGN.md` (the *what* — rules, mechanics, art direction) and the
original `IDEA.md`. Decisions here were reached through a question-by-question tech
interview.

**Primary target:** an **iPad mini**, used by a 7- and 4-year-old. Must also work on a
laptop. Locally testable by serving from the laptop and pointing the iPad's browser at
it; hostable online when complete.

---

## 1. Summary of decisions

| # | Area | Decision |
|---|------|----------|
| T1 | Language / framework | **Vanilla TypeScript + Vite** (strict), no UI framework |
| T2 | Art assets | **Code-drawn SVG + CSS** (no image pipeline) |
| T3 | App mode | **Installable + offline PWA**, full-screen |
| T4 | Orientation | **Portrait, locked** |
| T5 | Hosting | **GitHub Pages** via GitHub Actions (HTTPS) |
| T6 | Persistence | **`localStorage`** — remember last dolphins + ages |
| T7 | Package manager | **pnpm** (pinned via `packageManager`) |
| T8 | Unit tests | **Vitest**, rules engine only |
| T9 | Local HTTPS for iPad | **`vite-plugin-mkcert`** |
| T10 | Repo / base path | repo `dolphin-jump-game` → base `/dolphin-jump-game/` |

---

## 2. Why this stack (rationale)

- **Vanilla TS over React** — the game is three screens + a turn state machine + a
  **sequenced animation timeline** (die spin → hop dolphin spot-by-spot → resolve landing
  → play special-spot effect → maybe roll-again chain → next player). That timeline maps
  directly onto a readable `async/await` sequence, with no framework indirection
  (`useEffect`/refs/animation libs) to trace or debug. Tiny bundle = instant load on the
  iPad. Since the code is largely AI-written, "familiar to hand-write" stopped being the
  deciding factor; "easy to **read, review, and debug**" won, and that favors vanilla here.
- **SVG + CSS art** — razor-crisp on the retina screen at any size, tiny files, no asset
  pipeline, and recoloring the four dolphins is a one-line change. Glossy shine, idle bob,
  happy flip, and whirlpool spin all animate natively via CSS/SVG transforms.
- **PWA** — full-screen home-screen launch means **no Safari chrome** for kids to
  fat-finger (no address bar, no pull-to-refresh mid-turn, no accidental tab-swipe), plus
  **offline play** in the car / on planes.
- **Portrait-locked** — maximizes the vertical climb and the shallow→deep gradient
  (depth = progress), gives the 100-spot snake room to breathe, and prevents annoying
  mid-game rotation when an excited kid tilts the iPad.
- **GitHub Pages** — free static hosting straight from the repo with automatic HTTPS
  (which the PWA requires); deploy on push via a small Actions workflow.

---

## 3. Architecture

Four clean layers. The point of the split: keep the rules **pure and testable**, and keep
the animation timeline **readable** and isolated from rendering.

```
┌───────────────────────────────────────────────────────────┐
│ 1. Rules / State Engine   (pure TypeScript, ZERO DOM)      │
│    board config · turn order · all rule resolution         │
│    → pure functions, unit-tested with Vitest               │
├───────────────────────────────────────────────────────────┤
│ 2. Animation Sequencer    (async timeline)                 │
│    spin die → hop dolphin → resolve landing → effect →     │
│    (roll-again chain) → next player                        │
├───────────────────────────────────────────────────────────┤
│ 3. Render Layer           (SVG + CSS, draws from state)    │
│    board · 4 dolphins · die · screens · win celebration    │
├───────────────────────────────────────────────────────────┤
│ 4. Persistence            (localStorage)                   │
│    load/save last dolphins + ages                          │
└───────────────────────────────────────────────────────────┘
```

### 3.1 Rules / State Engine (pure)
- No DOM access whatsoever — just data in, new state out. This is what makes the tricky
  rules trivially testable.
- Owns:
  - **Board config** — the 100 spots and the ~10–12 special spots (type + value +
    position), defined as data so the layout is easy to tune (see §4).
  - **Turn order** — youngest → oldest, repeating (age used for order only).
  - **Rule resolution**, exactly per `GAME_DESIGN.md`:
    - **Overshoot wins** — reach *or pass* spot 100 = win.
    - **Resolution rule** — a spot's action fires only when reached **by rolling** (normal
      or bonus roll); displacement via jump/switch does **not** re-trigger.
    - **Switch with nearest** — fewest spots away; tie → the dolphin **ahead**; nearest on
      your own spot → next-nearest, else no-op.
    - **Roll again** — bonus roll is a real roll, so its landing activates (can chain).
    - **Board invariants** that make edge cases impossible: jump targets are always plain
      (no chaining); back-jumps can never underflow past spot 1; no specials in the first
      ~10–15 spots or the final stretch.

### 3.2 Animation Sequencer (async)
- A single readable `async` flow per turn that **awaits** each visual step, so timing is
  obvious and tweakable ("slow the hop", "pause before the octopus grab").
- Calls the engine for *what happens*, then drives the render layer for *how it looks*.
- Handles the roll-again chain and the win → "everyone keeps finishing" → ribbons flow.

### 3.3 Render Layer (SVG + CSS)
- Draws the winding S-snake board (start bottom → treasure-chest finish top), the four
  glossy mascot dolphins (each with its color + bright glow rim), the die, the start
  screen, and the treasure-chest win celebration.
- 100 near-identical tiles + 4 near-identical dolphins are produced by a small render
  helper (a loop) — the one place React would have been tidier, trivially handled here.
- Numbers stay large and high-contrast; dolphin tokens float slightly above the path so
  they never cover a spot number.

### 3.4 Persistence (localStorage)
- Saves the last dolphins + ages; pre-fills the start screen next launch so the kids can
  tap **"Dive in!"** and go. No accounts, no server; clearable.

---

## 4. Board data model

The board is **data, not code** — an array/config describing each special spot so the
layout and the ~10–12 specials are easy to tune without touching logic:

```ts
type SpecialKind = 'forward' | 'back' | 'switch' | 'rollAgain'

interface SpecialSpot {
  index: number          // 1..100
  kind: SpecialKind
  value?: number         // spaces for forward/back; unused for switch/rollAgain
}
```

Authoring the layout must respect the **board invariants** (§3.1) so chaining and
backward-underflow are structurally impossible. A small dev-time assertion can validate a
layout against those invariants (e.g. "no forward/back target lands on a special spot",
"min(index − value) ≥ 1", "no special in protected zones") to catch mistakes early.

---

## 5. PWA & iPad behavior

- **`vite-plugin-pwa`** generates the **web-app manifest** + **service worker**
  (precache the static build for offline play).
- Manifest: `display: 'standalone'`, `orientation: 'portrait'`, deep-sea theme/background
  colors, app icons, name "Dolphin Jump".
- iPad-Safari hardening (kid-proofing): disable double-tap-to-zoom and pinch where
  appropriate, prevent text selection / long-press callout on game elements, lock the
  viewport (`viewport-fit=cover`, no user scaling), suppress pull-to-refresh
  (`overscroll-behavior: none`), full-bleed safe-area-aware layout.
- **Install flow:** "Add to Home Screen" on the iPad → launches full-screen with no Safari
  chrome.

---

## 6. Local development & iPad testing

The workflow that satisfies "serve on the laptop, point the iPad at it":

- **`vite-plugin-mkcert`** provides **local HTTPS** on the dev server. This is essential:
  a service worker (PWA install + offline) **will not register over plain `http://`** on a
  LAN address, so without HTTPS you couldn't test the PWA features on the iPad.
- Run the dev server bound to the network:

  ```bash
  pnpm dev --host
  ```

- On the iPad mini (same wifi), open `https://<laptop-LAN-ip>:5173`.
  - One-time: trust the locally-generated mkcert certificate on the iPad.
- Hot-reload works on the iPad while you edit on the laptop.

---

## 7. Testing

- **Vitest**, focused on the **pure rules engine** (§3.1) — the layer where the designed
  edge cases silently break. Minimum coverage:
  - Overshoot win (reach and pass 100; via roll, forward jump, and bonus roll).
  - Switch-with-nearest: ahead vs. behind, the **tie → ahead** rule, nearest-on-same-spot
    → next-nearest, and no-op fallback.
  - Roll-again chain, including roll-again → roll-again.
  - Back-jump clamp / no underflow past spot 1.
  - Turn order: youngest → oldest, repeating; 2-, 3-, and 4-player setups; sit-outs.
  - Board-invariant validator (no jump lands on a special; protected zones respected).
- Animation/render layers are verified by manual playtest (§9), not unit tests.

---

## 8. Hosting & deployment

- **GitHub Pages**, repo **`dolphin-jump-game`**.
- Vite `base: '/dolphin-jump-game/'` (Pages serves under the repo subpath).
- **GitHub Actions** workflow: on push to the default branch → install with pnpm → build →
  publish the `dist/` to Pages. HTTPS is automatic (PWA requirement satisfied in prod).
  - Uses `pnpm/action-setup` + `actions/setup-node` with `cache: 'pnpm'`.
- Result: a stable HTTPS link the family can open and "Add to Home Screen."
- *(Vercel / Netlify / Cloudflare Pages are equivalent fallbacks if the subpath ever
  becomes annoying — all serve the same static build over HTTPS.)*

---

## 9. End-to-end verification

1. `pnpm dev --host`, open on the iPad mini over local HTTPS; confirm full-screen,
   portrait-locked, no Safari chrome after "Add to Home Screen."
2. Play through with 2, 3, and 4 dolphins; confirm a sit-out (blank age) is omitted and
   turn order is youngest → oldest.
3. Exercise each special spot: forward, back (gentle + a dramatic slide), switch
   (incl. tie → ahead), roll-again (incl. roll-again → roll-again).
4. Confirm overshoot win, then the **winner celebration → everyone keeps finishing →
   ribbons (2nd/3rd/4th)** flow.
5. Kill wifi and relaunch from the home-screen icon → confirm **offline** play works.
6. Relaunch → confirm the **last dolphins + ages are pre-filled** (persistence).
7. `pnpm test` green. Push → confirm the GitHub Pages deploy is live over HTTPS and
   installable on the iPad.

---

## 10. Project layout (proposed)

```
dolphin-jump-game/
├─ IDEA.md
├─ GAME_DESIGN.md
├─ TECH_DESIGN.md            ← this file
├─ index.html
├─ package.json             (packageManager: pnpm@9.x)
├─ pnpm-lock.yaml
├─ vite.config.ts           (base, PWA plugin, mkcert plugin)
├─ tsconfig.json            (strict)
├─ src/
│  ├─ main.ts               app bootstrap, screen routing
│  ├─ engine/               pure rules + board config + turn order
│  ├─ board.ts              the 100-spot / special-spot data (§4)
│  ├─ sequencer.ts          async animation timeline
│  ├─ render/               SVG/CSS draw layer (board, dolphins, die, screens)
│  ├─ persistence.ts        localStorage load/save
│  └─ styles/               CSS (deep-sea theme, animations)
├─ public/                  PWA icons, manifest assets
├─ test/                    Vitest specs for engine/
└─ .github/workflows/       Pages deploy (pnpm)
```

---

## Appendix: commands

```bash
pnpm install            # install deps
pnpm dev --host         # dev server on laptop + iPad over local HTTPS
pnpm test               # run rules-engine unit tests (Vitest)
pnpm build              # static production build → dist/
pnpm preview            # preview the production build locally
# push to default branch → GitHub Actions deploys to Pages
```
