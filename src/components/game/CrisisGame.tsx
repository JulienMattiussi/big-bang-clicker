import { useEffect, useRef, useState } from 'react'
import { useCrisisStore, CRISIS_GOAL } from '@/store/crisisStore'
import { useGameStore } from '@/store/gameStore'
import { useEventStore } from '@/store/eventStore'
import { useTranslation } from '@/i18n/useTranslation'

// Play field in viewBox units. The width matches the rendered box aspect
// (max-w-5xl over h-72 ~ 3.55:1) so the scene fills the full width instead of
// being letterboxed by preserveAspectRatio.
const W = 356
const H = 100
const GROUND_Y = 82
const STEP_MS = 80
const FALL_MS = 1500
const IMPACT_R = 19
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
interface World {
  creatures: Creature[]
  meteors: Meteor[]
  flashes: Flash[]
  next: number
  time: number
  meteorTimer: number
  creatureTimer: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

const freshWorld = (): World => ({
  creatures: [],
  meteors: [],
  flashes: [],
  next: 1,
  time: 0,
  meteorTimer: 600,
  creatureTimer: 0,
})

/** Advances the world one STEP_MS tick (pure: returns a new world). */
function step(prev: World): World {
  const dt = STEP_MS / 1000
  const time = prev.time + STEP_MS
  let next = prev.next

  // Meteors fall; spawn on a random cadence.
  let meteorTimer = prev.meteorTimer - STEP_MS
  const meteors = prev.meteors.map((m) => ({ ...m, y: m.y + m.vy * dt }))
  if (meteorTimer <= 0) {
    meteors.push({ id: next++, x: rand(12, W - 12), y: -12, vy: (GROUND_Y + 12) / (FALL_MS / 1000) })
    meteorTimer = rand(650, 1300)
  }
  const landed = meteors.filter((m) => m.y >= GROUND_Y)
  const flashes = prev.flashes.filter((f) => time - f.born < 520)
  for (const m of landed) flashes.push({ id: next++, x: m.x, born: time })

  // Creatures wander and bounce; meteors wipe any caught in the open.
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

  // Keep a few creatures alive.
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

  // Drop spent creatures (sheltered / hit) once their little animation is done.
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

/** A falling meteor: a cratered rocky head leading, with a flame trailing up
 *  behind it. Drawn at the local origin (rock centre); the caller translates it. */
function Meteor() {
  return (
    <g aria-hidden>
      {/* Flame trailing upward (the meteor falls downward). */}
      <path
        d="M-2.8 0 Q-3.3 -5 -1.6 -8 L-2.3 -11.5 L-0.6 -8 L0 -14 L0.7 -8 L2.3 -10.8 Q3.3 -5 2.8 0 Z"
        fill="#f4641e"
      />
      <path d="M-1.5 0 Q-1.7 -4 -0.6 -6.5 L0 -9.8 L0.7 -6.5 Q1.7 -4 1.5 0 Z" fill="#ffcf3f" />
      {/* Cratered rocky head. */}
      <circle cx="0" cy="0" r="2.8" fill="#5b5b5b" stroke="#2e2e2e" strokeWidth="0.5" />
      <circle cx="-0.9" cy="-0.6" r="0.75" fill="#3f3f3f" />
      <circle cx="0.9" cy="0.5" r="0.55" fill="#3f3f3f" />
      <circle cx="-0.1" cy="1.1" r="0.4" fill="#3f3f3f" />
    </g>
  )
}

/** A small creature silhouette - a rat or a raptor (the survivors of the
 *  extinction) - feet at the local origin, facing right (mirror via the parent). */
function Critter({ kind }: { kind: Kind }) {
  if (kind === 'raptor') {
    // Bipedal theropod: stiff raised tail, body, neck rising to a snouted head,
    // two digitigrade legs.
    return (
      <g fill="var(--color-fg)" stroke="var(--color-fg)" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-7 -3 Q-3 -4 0 -4.5 Q2 -4.8 3 -4.2 Q4 -6 4.8 -7.6 Q5.2 -8.3 6 -8.1 Q7 -7.9 6.6 -7.1 Q6 -6.7 5.2 -6.7 Q4.6 -5.7 4 -4.9 Q3.2 -3.9 2.4 -3.5 Q1 -3.1 -1 -3.3 Q-4 -3.3 -7 -3 Z" />
        <path d="M0.6 -3.3 L1.5 -1.4 L0.5 0 M2.2 -3.1 L3 -1.4 L2.2 0" fill="none" strokeWidth="0.85" />
        {/* little theropod arm tucked under the chest */}
        <path d="M3.4 -4.1 L4.2 -3.1 L3.7 -2.4" fill="none" strokeWidth="0.55" />
      </g>
    )
  }
  // Rodent: rounded body, head with a pointed snout and ear, long trailing tail.
  return (
    <g fill="var(--color-fg)" stroke="var(--color-fg)" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="-0.4" cy="-1.8" rx="3" ry="1.5" />
      <path d="M2 -2.5 Q4.3 -3 5.1 -1.9 Q5.3 -1.2 4.2 -1.1 Q3.1 -1.1 2.2 -1.7 Z" />
      <circle cx="2.5" cy="-3.1" r="0.75" />
      <path d="M-3.3 -1.9 q-3 -0.2 -4.4 1.1" fill="none" strokeWidth="0.6" />
      <path d="M-1.4 -0.5 V0 M1 -0.6 V0" fill="none" strokeWidth="0.7" />
    </g>
  )
}

/**
 * Crisis survival mini-game (mass extinction): meteors rain down at random across
 * the full width while little creatures wander the ground. Click a creature to
 * send it diving into a burrow (sheltered); meteors wipe out any still in the
 * open. Shelter CRISIS_GOAL creatures and life springs back: the crisis resolves
 * and a victory modal is queued.
 */
export function CrisisGame() {
  const { t } = useTranslation()
  const fighting = useCrisisStore((s) => s.fighting)
  const saved = useCrisisStore((s) => s.saved)
  const rescue = useCrisisStore((s) => s.rescue)
  const stop = useCrisisStore((s) => s.stop)
  const resolveCrisis = useGameStore((s) => s.resolveCrisis)
  const enqueue = useEventStore((s) => s.enqueue)

  const [world, setWorld] = useState<World>(freshWorld)
  const won = useRef(false)

  useEffect(() => {
    // The component mounts fresh for each fight, so useState's initial world is
    // already clean; just run the loop.
    won.current = false
    const handle = setInterval(() => setWorld(step), STEP_MS)
    return () => clearInterval(handle)
  }, [])

  const shelter = (id: number) => {
    const c = world.creatures.find((k) => k.id === id)
    if (!c || c.state !== 'run') return
    setWorld((prev) => ({
      ...prev,
      creatures: prev.creatures.map((k) => (k.id === id ? { ...k, state: 'saved', t0: prev.time } : k)),
    }))
    rescue()
    if (won.current) return
    if (useCrisisStore.getState().saved >= CRISIS_GOAL) {
      won.current = true
      const { defs } = useGameStore.getState()
      const def = fighting ? defs.crises[fighting] : undefined
      resolveCrisis(fighting as string)
      if (def) {
        enqueue({
          id: `crisis-won:${fighting}`,
          tone: 'transition',
          titleKey: 'crisis.overcome.title',
          bodyKey: def.textKeys.reboundKey,
        })
      }
      stop()
    }
  }

  const pct = Math.min(1, saved / CRISIS_GOAL)

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className="text-base font-semibold text-red-400">{t('crisisGame.hint')}</span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-72 w-full max-w-5xl overflow-hidden rounded-xl border border-red-500/40"
        role="group"
        aria-label={t('crisisGame.aria')}
      >
        <defs>
          <radialGradient id="cg-flash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffcf6b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* A darkened, blood-red catastrophe sky and a solid ground band. */}
        <rect x="0" y="0" width={W} height={H} fill="#1a0d12" opacity="0.55" />
        <rect x="0" y={GROUND_Y} width={W} height={H - GROUND_Y} fill="var(--color-fg)" opacity="0.12" />
        <line x1="0" y1={GROUND_Y} x2={W} y2={GROUND_Y} stroke="var(--color-fg)" strokeOpacity="0.25" strokeWidth="0.6" />

        {/* Landing-spot shadows telegraph where each meteor will hit. */}
        {world.meteors.map((m) => {
          const grow = Math.min(1, m.y / GROUND_Y)
          return (
            <ellipse
              key={`s${m.id}`}
              cx={m.x}
              cy={GROUND_Y}
              rx={IMPACT_R * grow}
              ry={IMPACT_R * grow * 0.3}
              fill="#ef4444"
              opacity={0.18 * grow}
              aria-hidden
            />
          )
        })}

        {/* Impact flashes (fading). */}
        {world.flashes.map((f) => {
          const age = (world.time - f.born) / 520
          return (
            <circle
              key={`f${f.id}`}
              cx={f.x}
              cy={GROUND_Y}
              r={IMPACT_R * (0.6 + age)}
              fill="url(#cg-flash)"
              opacity={1 - age}
              aria-hidden
            />
          )
        })}

        {/* Falling meteors (rocky head + flame trail). */}
        {world.meteors.map((m) => (
          <g key={`m${m.id}`} transform={`translate(${m.x} ${m.y})`} aria-hidden>
            <Meteor />
          </g>
        ))}

        {/* Creatures. Sheltered ones dive into a burrow; hit ones fade out. */}
        {world.creatures.map((c) => {
          const age = world.time - c.t0
          const dir = c.vx < 0 ? -1 : 1
          if (c.state === 'saved') {
            // Dive into a sloped burrow: the creature slides nose-first DOWN THE
            // TUNNEL AXIS (same angle as the hole, ~52° below horizontal) while
            // tilting along it and shrinking away.
            const p = Math.min(1, age / 400)
            const k = 1 - p
            const FROM_VERT = 38 // tunnel angle from vertical (~52deg from horizontal)
            const rad = (FROM_VERT * Math.PI) / 180
            const ux = dir * Math.sin(rad) // tunnel axis, toward the creature's side
            const uy = Math.cos(rad)
            const T = 15 // travel distance along the tunnel
            return (
              <g key={c.id} aria-hidden opacity={Math.min(1, (1 - p) * 1.6)}>
                <g transform={`translate(${c.x} ${GROUND_Y}) rotate(${-FROM_VERT * dir})`}>
                  <ellipse cx="0" cy="3.6" rx="2.1" ry="6.8" fill="#140a0e" />
                </g>
                <g
                  transform={`translate(${c.x + ux * T * p} ${GROUND_Y + uy * T * p}) scale(${dir} 1) rotate(${72 * p}) scale(${k} ${k})`}
                >
                  <Critter kind={c.kind} />
                </g>
              </g>
            )
          }
          if (c.state === 'hit') {
            const k = Math.max(0, 1 - age / 320)
            return (
              <g key={c.id} transform={`translate(${c.x} ${GROUND_Y}) scale(${dir} 1)`} opacity={k} aria-hidden>
                <Critter kind={c.kind} />
              </g>
            )
          }
          return (
            <g key={c.id} className="group">
              <g transform={`translate(${c.x} ${GROUND_Y}) scale(${dir} 1)`} className="group-hover:brightness-125">
                <Critter kind={c.kind} />
              </g>
              <circle
                cx={c.x}
                cy={GROUND_Y - 2.5}
                r="5"
                fill="transparent"
                role="button"
                tabIndex={0}
                aria-label={t('crisisGame.creature')}
                onClick={() => shelter(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    shelter(c.id)
                  }
                }}
                className="cursor-pointer outline-none transition hover:stroke-accent focus-visible:stroke-accent"
                strokeWidth="1.5"
              />
            </g>
          )
        })}
      </svg>

      {/* Progress toward the goal. */}
      <div className="flex w-full max-w-5xl items-center gap-3">
        <span className="text-sm font-semibold text-fg">
          {t('crisisGame.saved')} {saved} / {CRISIS_GOAL}
        </span>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={CRISIS_GOAL}
          aria-valuenow={saved}
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${pct * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
