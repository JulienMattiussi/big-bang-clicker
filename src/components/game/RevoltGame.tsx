import { useEffect, useRef, useState } from 'react'
import { useCrisisStore, CRISIS_GOAL } from '@/store/crisisStore'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import {
  H,
  PARL_LEFT,
  PARL_RIGHT,
  SEAT_TIERS,
  SPLIT_X,
  STEP_MS,
  W,
  enfranchise,
  freshCrowd,
  stepCrowd,
  type CrowdWorld,
} from './revoltWorld'
import { ProtesterGlyph } from '@/components/art/Protester'

const GREEN = 'var(--part-4)'
const RED = 'var(--danger)'

/**
 * Crisis mini-game (Starpacus's revolt): the square is split into the street
 * (left, 2/3) and the Parliament (right, 1/3). Click a red protester to free it;
 * it walks right to take a seat. A red protester bumping a walker makes it blink
 * red, and three bumps turn it red again. Fill the Parliament (CRISIS_GOAL seats)
 * and society reforms: the crisis resolves and a victory modal is queued. The
 * world/tick lives in revoltWorld.ts, the figure in art/Protester.tsx.
 */
export function RevoltGame() {
  const { t } = useTranslation()
  const fighting = useCrisisStore((s) => s.fighting)
  const stop = useCrisisStore((s) => s.stop)
  const resolveCrisis = useGameStore((s) => s.resolveCrisis)
  const enqueueEvent = useGameStore((s) => s.enqueueEvent)

  const [world, setWorld] = useState<CrowdWorld>(freshCrowd)
  const won = useRef(false)

  useEffect(() => {
    won.current = false
    const handle = setInterval(() => setWorld(stepCrowd), STEP_MS)
    return () => clearInterval(handle)
  }, [])

  const seated = world.people.filter((p) => p.state === 'seated').length

  useEffect(() => {
    if (won.current || seated < CRISIS_GOAL) return
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
  }, [seated, fighting, resolveCrisis, enqueueEvent, stop])

  const free = (id: number) => setWorld((prev) => enfranchise(prev, id))

  const pct = Math.min(1, seated / CRISIS_GOAL)

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className="text-base font-semibold text-red-400">{t('revoltGame.hint')}</span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-72 w-full max-w-5xl overflow-hidden rounded-xl border border-red-500/40"
        role="group"
        aria-label={t('revoltGame.aria')}
      >
        <rect x="0" y="0" width={W} height={H} fill="#1a0d12" opacity="0.55" />
        {/* Parliament wing (right third): green, the victory zone. */}
        <rect x={SPLIT_X} y="0" width={W - SPLIT_X} height={H} fill={GREEN} opacity="0.12" />
        <line
          x1={SPLIT_X}
          y1="0"
          x2={SPLIT_X}
          y2={H}
          stroke="var(--color-fg)"
          strokeOpacity="0.3"
          strokeWidth="0.6"
        />

        {/* Greek temple facade: pediment, architrave and a colonnade. */}
        <g fill="var(--color-muted)" opacity="0.4">
          <polygon
            points={`${(PARL_LEFT + PARL_RIGHT) / 2},2 ${PARL_RIGHT - 2},12 ${PARL_LEFT + 2},12`}
          />
          <rect x={PARL_LEFT + 1} y="12.5" width={PARL_RIGHT - PARL_LEFT - 2} height="2.6" />
          {[0, 1, 2, 3].map((k) => (
            <rect
              key={k}
              x={PARL_LEFT + 6 + k * ((PARL_RIGHT - PARL_LEFT - 14) / 3)}
              y="16"
              width="2"
              height="9"
              rx="0.6"
            />
          ))}
          <rect x={PARL_LEFT + 1} y="25" width={PARL_RIGHT - PARL_LEFT - 2} height="2.2" />
        </g>

        {/* Gradins: stone tiers the senators sit on. */}
        {SEAT_TIERS.map((y) => (
          <rect
            key={y}
            x={PARL_LEFT - 1}
            y={y}
            width={PARL_RIGHT - PARL_LEFT + 2}
            height="2.4"
            rx="1"
            fill="var(--color-muted)"
            opacity="0.35"
          />
        ))}

        {world.people.map((p) => {
          if (p.state === 'seated') {
            return (
              <g
                key={p.id}
                style={{ color: GREEN }}
                transform={`translate(${p.x} ${p.y}) scale(0.5)`}
                aria-hidden
              >
                <ProtesterGlyph angry={false} />
              </g>
            )
          }
          if (p.state === 'walking') {
            const blinking = p.blinkUntil > world.time
            return (
              <g
                key={p.id}
                style={{ color: blinking ? RED : GREEN }}
                transform={`translate(${p.x} ${p.y})`}
                aria-hidden
              >
                <ProtesterGlyph angry={false} />
              </g>
            )
          }
          return (
            <g key={p.id} className="group">
              <g
                style={{ color: RED }}
                transform={`translate(${p.x} ${p.y})`}
                className="group-hover:brightness-125"
              >
                <ProtesterGlyph angry />
              </g>
              <circle
                cx={p.x}
                cy={p.y - 6}
                r="7"
                fill="transparent"
                role="button"
                tabIndex={0}
                aria-label={t('revoltGame.citizen')}
                onClick={() => free(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    free(p.id)
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
          {t('revoltGame.saved')} {seated} / {CRISIS_GOAL}
        </span>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={CRISIS_GOAL}
          aria-valuenow={seated}
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
