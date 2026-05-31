# Dolphin Jump — project guide for Claude

A browser-based kids' board game (deep-sea dolphin race) built by a dad with his 7- and
4-year-old kids. Roll a die, swim along a 100-spot board, first dolphin to the finish wins.
**Primary device: iPad mini**; must also work on a laptop.

## Resuming work (read this first)
1. Open **`IMPLEMENTATION_PLAN.md`** — the living cross-session tracker. The "Status at a
   glance" table and **"Next action"** line tell you exactly where we are and what's next.
2. Check `git log --oneline` for what's committed (we commit one milestone at a time).
3. Then continue the next ⬜/▶ milestone. Stop at 👀 checkpoints for family/user eval.

## The three design docs (source of truth — don't re-litigate settled decisions)
- **`IDEA.md`** — original concept.
- **`GAME_DESIGN.md`** — the *what*: rules, mechanics, art direction. Gameplay source of
  truth. (Supersedes earlier drafts: final rules use **switch-with-nearest** and
  **~10–12 special spots**.)
- **`TECH_DESIGN.md`** — the *how*: stack, architecture, PWA, hosting.

## Stack & conventions
- **Vanilla TypeScript + Vite**, no UI framework. **Strict** TS.
- **Code-drawn SVG + CSS** for all art — no image pipeline; dolphins recolor via one var.
- **pnpm** (pinned `packageManager`). Use `pnpm`, never `npm`/`yarn`.
- **Vitest** for the pure rules engine only (the layer with the tricky edge cases).
- **PWA**: installable, offline, **portrait-locked**, full-screen (wired in M6; stubbed now).
- **Hosting**: GitHub Pages, base path `/dolphin-jump-game/` (set in `vite.config.ts`).
- **Persistence**: `localStorage` (last dolphins + ages).

## Architecture (4 layers — keep them separated)
1. `src/engine/` + `src/board.ts` — **pure rules**, zero DOM, unit-tested.
2. `src/sequencer.ts` — **async animation timeline** (drives render from engine results).
3. `src/render/` — **SVG/CSS draw layer**.
4. `src/persistence.ts` — localStorage.

## Commands
```bash
pnpm install          # install deps
pnpm dev              # dev server over HTTP (everyday laptop dev)
pnpm dev:ipad         # dev server over HTTPS (mkcert) + --host, for iPad PWA testing
pnpm test             # rules-engine unit tests (Vitest)
pnpm build            # strict type-check + production build → dist/
pnpm preview          # preview the production build (HTTP)
```
**HTTPS is opt-in:** plain `pnpm dev`/`preview` use HTTP (no sudo). `dev:ipad`/`preview:ipad`
enable mkcert local TLS; the first HTTPS run needs a one-time `sudo` to trust the CA.

## Verify before handoff (don't ship "should work")
When asked to implement a feature or fix a bug, **self-verify it actually works before
handing it back.** "Done" means verified, not just written.
- **Bugs:** reproduce the broken behavior *first*, then prove it's gone after the fix.
- **Gates:** `pnpm build` (strict TS) clean; `pnpm test` green for anything touching
  logic (`engine/`, `board.ts`, `persistence.ts`).
- **Actually run it** with the Claude Preview MCP: drive the real interaction
  (`preview_click`/`preview_fill` — tap the die, enter ages, trigger the spot in
  question), `preview_screenshot` the result, and check `preview_console_logs` for
  errors/warnings. Use `preview_inspect` for exact CSS (contrast/size/layout) and
  `preview_resize` to iPad-mini portrait.
- **Hand off with evidence:** state what you verified and how (screenshot/log), not just
  "done."
- **Honest limit:** the Preview loop is headless **Chromium**; the device truth is **iPad
  WebKit**. Self-verify everything possible in Chromium, then call out explicitly any
  residual that needs the real iPad (known WebKit risks: `var()` in SVG attrs,
  `-webkit-text-stroke`, animation timing) and tell the user exactly what to tap.

## Working agreements
- **Commits: only when the user explicitly asks.** Otherwise leave the tree clean and
  report what changed. Each milestone should end runnable + reviewable.
- This is a fun project the user does *with his kids* — the 👀 checkpoints in the plan are
  real family playtests; don't skip past them.
- Keep the 4-year-old (non-reader) in mind: icons over text, automatic actions, big targets.
- Update `IMPLEMENTATION_PLAN.md` status markers as milestones progress.
