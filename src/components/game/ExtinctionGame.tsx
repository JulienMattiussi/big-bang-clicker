import { useEffect, useRef, useState } from 'react'
import { useCrisisStore, CRISIS_GOAL } from '@/store/crisisStore'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { GROUND_Y, H, IMPACT_R, STEP_MS, W, freshWorld, step, type CrisisWorld } from './crisisWorld'
import { CritterGlyph, MeteorGlyph } from '@/components/art/CrisisCreatures'

/**
 * Crisis survival mini-game (mass extinction): meteors rain down at random across
 * the full width while little creatures wander the ground. Click a creature to
 * send it diving into a burrow (sheltered); meteors wipe out any still in the
 * open. Shelter CRISIS_GOAL creatures and life springs back: the crisis resolves
 * and a victory modal is queued. The world/tick lives in crisisWorld.ts, the art
 * in art/CrisisCreatures.tsx.
 */
export function ExtinctionGame() {
  const { t } = useTranslation()
  const fighting = useCrisisStore((s) => s.fighting)
  const saved = useCrisisStore((s) => s.saved)
  const rescue = useCrisisStore((s) => s.rescue)
  const stop = useCrisisStore((s) => s.stop)
  const resolveCrisis = useGameStore((s) => s.resolveCrisis)
  const enqueueEvent = useGameStore((s) => s.enqueueEvent)

  const [world, setWorld] = useState<CrisisWorld>(freshWorld)
  const won = useRef(false)

  useEffect(() => {
    won.current = false
    const handle = setInterval(() => setWorld(step), STEP_MS)
    return () => clearInterval(handle)
  }, [])

  const shelter = (id: number) => {
    const c = world.creatures.find((k) => k.id === id)
    if (!c || c.state !== 'run') return
    setWorld((prev) => ({
      ...prev,
      creatures: prev.creatures.map((k) =>
        k.id === id ? { ...k, state: 'saved', t0: prev.time } : k,
      ),
    }))
    rescue()
    if (won.current) return
    if (useCrisisStore.getState().saved >= CRISIS_GOAL) {
      won.current = true
      const { defs } = useGameStore.getState()
      const def = fighting ? defs.crises[fighting] : undefined
      resolveCrisis(fighting as string)
      if (def) {
        enqueueEvent({
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
        <rect x="0" y="0" width={W} height={H} fill="#1a0d12" opacity="0.55" />
        <rect
          x="0"
          y={GROUND_Y}
          width={W}
          height={H - GROUND_Y}
          fill="var(--color-fg)"
          opacity="0.12"
        />
        <line
          x1="0"
          y1={GROUND_Y}
          x2={W}
          y2={GROUND_Y}
          stroke="var(--color-fg)"
          strokeOpacity="0.25"
          strokeWidth="0.6"
        />

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

        {world.meteors.map((m) => (
          <g key={`m${m.id}`} transform={`translate(${m.x} ${m.y})`} aria-hidden>
            <MeteorGlyph />
          </g>
        ))}

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
                  <CritterGlyph kind={c.kind} />
                </g>
              </g>
            )
          }
          if (c.state === 'hit') {
            const k = Math.max(0, 1 - age / 320)
            return (
              <g
                key={c.id}
                transform={`translate(${c.x} ${GROUND_Y}) scale(${dir} 1)`}
                opacity={k}
                aria-hidden
              >
                <CritterGlyph kind={c.kind} />
              </g>
            )
          }
          return (
            <g key={c.id} className="group">
              <g
                transform={`translate(${c.x} ${GROUND_Y}) scale(${dir} 1)`}
                className="group-hover:brightness-125"
              >
                <CritterGlyph kind={c.kind} />
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
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
