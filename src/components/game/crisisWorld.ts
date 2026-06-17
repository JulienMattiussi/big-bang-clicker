/**
 * Crisis survival mini-game (mass extinction) world: pure state + tick. The React
 * component (CrisisGame.tsx) renders it; the creature/meteor art lives in
 * art/CrisisCreatures.tsx.
 *
 * Play field in viewBox units. The width matches the rendered box aspect
 * (max-w-5xl over h-72 ~ 3.55:1) so the scene fills the full width instead of
 * being letterboxed by preserveAspectRatio.
 */
export const W = 356
export const H = 100
export const GROUND_Y = 82
export const STEP_MS = 80
const FALL_MS = 1500
export const IMPACT_R = 19
const TARGET_ALIVE = 9

type Kind = 'rat' | 'raptor'
interface Creature {
  id: number
  x: number
  vx: number
  kind: Kind
  state: 'run' | 'saved' | 'hit'
  t0: number
}
interface Meteor {
  id: number
  x: number
  y: number
  vy: number
}
interface Flash {
  id: number
  x: number
  born: number
}
export interface CrisisWorld {
  creatures: Creature[]
  meteors: Meteor[]
  flashes: Flash[]
  next: number
  time: number
  meteorTimer: number
  creatureTimer: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export const freshWorld = (): CrisisWorld => ({
  creatures: [],
  meteors: [],
  flashes: [],
  next: 1,
  time: 0,
  meteorTimer: 600,
  creatureTimer: 0,
})

/** Advances the world one STEP_MS tick (pure: returns a new world). */
export function step(prev: CrisisWorld): CrisisWorld {
  const dt = STEP_MS / 1000
  const time = prev.time + STEP_MS
  let next = prev.next

  let meteorTimer = prev.meteorTimer - STEP_MS
  const meteors = prev.meteors.map((m) => ({ ...m, y: m.y + m.vy * dt }))
  if (meteorTimer <= 0) {
    meteors.push({
      id: next++,
      x: rand(12, W - 12),
      y: -12,
      vy: (GROUND_Y + 12) / (FALL_MS / 1000),
    })
    meteorTimer = rand(650, 1300)
  }
  const landed = meteors.filter((m) => m.y >= GROUND_Y)
  const flashes = prev.flashes.filter((f) => time - f.born < 520)
  for (const m of landed) flashes.push({ id: next++, x: m.x, born: time })

  let creatures = prev.creatures.map((c) => {
    if (c.state === 'run' && landed.some((m) => Math.abs(c.x - m.x) < IMPACT_R)) {
      return { ...c, state: 'hit' as const, t0: time }
    }
    if (c.state !== 'run') return c
    let x = c.x + c.vx * dt
    let vx = c.vx
    if (x < 6) {
      x = 6
      vx = Math.abs(vx)
    } else if (x > W - 6) {
      x = W - 6
      vx = -Math.abs(vx)
    }
    return { ...c, x, vx }
  })

  let creatureTimer = prev.creatureTimer - STEP_MS
  const aliveRun = creatures.filter((c) => c.state === 'run').length
  if (aliveRun < TARGET_ALIVE && creatureTimer <= 0) {
    creatures.push({
      id: next++,
      x: rand(14, W - 14),
      vx: rand(7, 15) * (Math.random() < 0.5 ? -1 : 1),
      kind: Math.random() < 0.5 ? 'rat' : 'raptor',
      state: 'run',
      t0: time,
    })
    creatureTimer = rand(350, 700)
  }

  creatures = creatures.filter(
    (c) => !(c.state === 'saved' && time - c.t0 > 360) && !(c.state === 'hit' && time - c.t0 > 320),
  )

  return {
    creatures,
    meteors: meteors.filter((m) => m.y < GROUND_Y),
    flashes,
    next,
    time,
    meteorTimer,
    creatureTimer,
  }
}
