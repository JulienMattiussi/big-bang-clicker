import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

/**
 * Dedicated Vitest config to RUN the balance simulation headlessly (Vitest is
 * used only as a TS runner with the '@' alias resolved). Separate from the main
 * config so `make check` / `make test` never run the simulation. Launch with
 * `make sim`; it writes sim/results/*.json and does NOT touch the dev server,
 * so you can keep playing the game while it runs.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '..', 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['sim/run.sim.ts'],
    testTimeout: 600_000,
  },
})
