# Dolphin Jump 🐬

A browser-based kids' board game — a deep-sea dolphin race. Roll a die, swim your dolphin
along a 100-spot board, and be first to reach the treasure-chest finish. Built for an
**iPad mini** (works on a laptop too), playable by ages 4+ with no reading required.

> 🌊 **A family project.** This is built as an exercise for the kids to design a game and
> for me (dad) use AI to build it. The initial gameplay idea, many of the design
> decisions, and the playtesting come from my kids (ages 4 & 7) — the design docs
> (`IDEA.md` and `GAME_DESIGN.md`) and milestone tracker (`IMPLEMENTATION_PLAN.md`)
> capture that journey.

## Getting started

### Prerequisites
- **Node.js** ≥ 20 (developed on v25)
- **pnpm** ≥ 10 — this project pins pnpm via the `packageManager` field and uses
  pnpm-only features. If you don't have it:
  ```bash
  npm install -g pnpm     # or: corepack enable pnpm
  ```

### Install
```bash
git clone https://github.com/<your-account>/dolphin-jump-game.git
cd dolphin-jump-game
pnpm install
```

### Run it
```bash
pnpm dev          # start the dev server (HTTP) → open the printed http://localhost:5173/... URL
```
That's all you need for everyday development on the laptop.

## Common commands
| Command | What it does |
|---------|--------------|
| `pnpm dev` | Dev server over **HTTP** for laptop development (hot-reload). |
| `pnpm dev:ipad` | Dev server over **HTTPS** + `--host` for testing on the iPad (see below). |
| `pnpm test` | Run the rules-engine unit tests (Vitest), one-shot. |
| `pnpm test:watch` | Run the tests in watch mode. |
| `pnpm build` | Strict type-check (`tsc --noEmit`) + production build → `dist/`. |
| `pnpm preview` | Serve the production build locally to sanity-check it. |

> **Note:** the app is served under the `/dolphin-jump-game/` base path (so it matches
> GitHub Pages). The dev server prints the full URL including that path — use it as-is.

## Testing on the iPad over wifi (HTTPS)

The game is a PWA, and a service worker only works over HTTPS — so testing the real
install/offline experience on the iPad needs a locally-trusted certificate. HTTPS is
**opt-in** (everyday `pnpm dev` stays plain HTTP and needs no admin rights).

1. On the laptop (same wifi as the iPad), run:
   ```bash
   pnpm dev:ipad
   ```
   The **first run** prompts for your macOS password once — this lets
   [`vite-plugin-mkcert`](https://github.com/liuweiGL/vite-plugin-mkcert) trust a local
   certificate authority. It's silent on every run after that.
2. Find your laptop's LAN IP (e.g. System Settings → Wi-Fi → Details, something like
   `192.168.x.x`). The dev server also prints a `Network:` URL.
3. On the iPad, open `https://<laptop-LAN-ip>:5173/dolphin-jump-game/` in Safari and accept
   the certificate trust prompt the first time.
4. Edits on the laptop hot-reload on the iPad.

## Project structure
```
src/
  engine/        pure rules + game state (zero DOM, unit-tested)
  board.ts       the 100-spot board layout as data
  sequencer.ts   async animation timeline (drives render from engine results)
  render/        SVG + CSS draw layer (board, dolphins, die, screens)
  persistence.ts localStorage (remembers last players)
  styles/        CSS (deep-sea theme + animations)
test/            Vitest specs for the engine
```

## Docs & status
- **`CLAUDE.md`** — orientation for AI-assisted sessions (read first when resuming).
- **`IMPLEMENTATION_PLAN.md`** — milestone tracker: what's done and what's next.
- **`GAME_DESIGN.md`** — rules, mechanics, and art direction (the *what*).
- **`TECH_DESIGN.md`** — stack and architecture decisions (the *how*).
- **`IDEA.md`** — the original concept.

## Tech stack
Vanilla **TypeScript + Vite**, code-drawn **SVG + CSS** art (no image pipeline),
**Vitest** for the rules engine, shipped as an installable **PWA**, hosted on
**GitHub Pages**.
