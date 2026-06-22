/**
 * "Forgotten gas" end-game crisis (era 19) world: pure state + tick. Gas leaks pop
 * up across the full width and grow ever more frequent; the player taps them to
 * snuff them out, but it is hopeless by design - there is NO win, only the 15 s
 * countdown that always ends in the chain reaction. SpiceGame-style separation:
 * the React component (GasLeakGame.tsx) renders and runs the loop.
 *
 * Coordinates are viewBox units; W matches the rendered box aspect for full width.
 */
export const W = 356
export const H = 100
export const STEP_MS = 80
export const LIMIT_MS = 15_000 // the countdown: the universe goes up regardless
const SPAWN_START_MS = 900 // initial gap between leaks
const SPAWN_END_MS = 220 // gap once the leaks are raging
const RAMP_MS = 12_000 // time over which the spawn gap tightens
const MARGIN = 14

interface Leak {
  id: number
  x: number
  y: number
  born: number
}
export interface GasLeakWorld {
  leaks: Leak[]
  spawnTimer: number
  time: number
  next: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export const freshGasLeak = (): GasLeakWorld => ({ leaks: [], spawnTimer: 300, time: 0, next: 1 })

/** Advances the world one STEP_MS tick (pure: returns a new world). */
export function step(prev: GasLeakWorld): GasLeakWorld {
  const time = prev.time + STEP_MS
  let spawnTimer = prev.spawnTimer - STEP_MS
  const leaks = prev.leaks.slice()
  let next = prev.next
  if (spawnTimer <= 0) {
    leaks.push({ id: next++, x: rand(MARGIN, W - MARGIN), y: rand(MARGIN, H - MARGIN), born: time })
    const ramp = Math.min(1, time / RAMP_MS)
    spawnTimer = SPAWN_START_MS + (SPAWN_END_MS - SPAWN_START_MS) * ramp
  }
  return { leaks, spawnTimer, time, next }
}

/** Snuffs one leak (futile feedback: more will come). */
export function extinguish(world: GasLeakWorld, id: number): GasLeakWorld {
  return { ...world, leaks: world.leaks.filter((l) => l.id !== id) }
}
