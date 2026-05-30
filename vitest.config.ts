import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts on purpose: the rules engine is pure (no DOM),
// so tests run in the fast `node` environment with none of the app plugins
// (mkcert/PWA) running as side effects. See TECH_DESIGN.md §3.1 / §7.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
  },
})
