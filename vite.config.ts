import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import { VitePWA } from 'vite-plugin-pwa'

// Served by GitHub Pages under the repo subpath (TECH_DESIGN.md §8).
//
// HTTPS is OPT-IN: plain `pnpm dev` / `pnpm preview` serve over HTTP so everyday
// laptop dev (and CI) need no sudo. For iPad PWA testing over wifi, run with the
// HTTPS flag — `pnpm dev:ipad` — which enables vite-plugin-mkcert for local TLS
// (TECH_DESIGN.md §6). The very first HTTPS run needs a one-time `sudo` to trust
// mkcert's local CA; after that it's silent.
const useHttps = process.env.HTTPS === '1'

export default defineConfig({
  base: '/dolphin-jump-game/',
  plugins: [
    ...(useHttps ? [mkcert()] : []),
    // PWA is stubbed off until M6 — installed now to prove it doesn't break the build.
    VitePWA({
      disable: true,
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
    }),
  ],
})
