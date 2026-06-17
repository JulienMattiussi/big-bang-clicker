import { type ReactElement } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { WidgetGalet } from './WidgetGalet'
import { StarField } from './StarField'
import { useSimLoop } from '@/hooks/useSimLoop'
import { useArrivalReward } from '@/hooks/useArrivalReward'
import { useTranslation } from '@/i18n/useTranslation'
import { addCharge, ALIGN_TOL, angularGap, fire, freshRelay, step } from './massRelayWorld'
import type { EraDef } from '@/lib/types'

const STEP_MS = 50
const CX = 50
const CY = 50
const GAL_R = 38 // galaxy orbit radius around the relay

const STARS = [
  [12, 18],
  [30, 80],
  [78, 22],
  [88, 70],
  [20, 52],
  [66, 86],
  [50, 12],
  [84, 40],
]

function pos(angleDeg: number, r: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180
  return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r }
}

// Archimedean spiral (~2.25 turns), vertically squashed for a tilted-disk look.
const GALAXY_SPIRAL =
  'M0.7,0 L0.78,0.07 L0.81,0.16 L0.79,0.26 L0.7,0.35 L0.54,0.45 L0.32,0.52 L0.04,0.58 L-0.28,0.61 L-0.63,0.61 L-0.99,0.57 L-1.34,0.49 L-1.65,0.38 L-1.9,0.23 L-2.07,0.05 L-2.14,-0.14 L-2.11,-0.35 L-1.96,-0.56 L-1.68,-0.76 L-1.3,-0.93 L-0.82,-1.06 L-0.25,-1.15 L0.36,-1.19 L1.01,-1.17 L1.64,-1.08 L2.23,-0.93 L2.75,-0.73 L3.15,-0.47 L3.42,-0.18 L3.53,0.14 L3.46,0.48 L3.21,0.8 L2.79,1.11 L2.2,1.37 L1.47,1.58 L0.63,1.71 L-0.28,1.77 L-1.22,1.74 L-2.15,1.63 L-3,1.42 L-3.75,1.14 L-4.34,0.78 L-4.74,0.37 L-4.91,-0.07 L-4.85,-0.53 L-4.55,-0.98 L-4,-1.4 L-3.24,-1.77 L-2.28,-2.06 L-1.18,-2.26 L0.02,-2.35 L1.27,-2.33 L2.49,-2.2 L3.64,-1.95 L4.64,-1.6 L5.44,-1.15 L6,-0.63 L6.29,-0.07 L6.27,0.52 L5.94,1.09 L5.3,1.64 L4.39,2.11 L3.23,2.5 L1.88,2.78 L0.4,2.92'

/** A four-point sparkle (upright), pinched at the waist. */
function Sparkle({ cx, cy, r, o }: { cx: number; cy: number; r: number; o: number }): ReactElement {
  const i = r * 0.18
  return (
    <path
      transform={`translate(${cx} ${cy})`}
      d={`M0,${-r} L${i},${-i} L${r},0 L${i},${i} L0,${r} L${-i},${i} L${-r},0 L${-i},${-i} Z`}
      fill="var(--color-fg)"
      opacity={o}
    />
  )
}

/**
 * A small spiral galaxy seen at a tilt: a glowing disk with a dark dust-lane
 * spiral carved through it, a bright nucleus, and a few sparkles. Brighter and a
 * touch larger when the beam is locked onto it.
 */
function Galaxy({ x, y, near }: { x: number; y: number; near: boolean }): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${near ? 1.15 : 1})`}>
      {/* Tilted disk + spiral lane + core share the same rotation. */}
      <g transform="rotate(-18)">
        <ellipse rx="7.6" ry="3.2" fill="var(--color-accent)" opacity={near ? 0.9 : 0.6} />
        <path
          d={GALAXY_SPIRAL}
          fill="none"
          stroke="var(--color-bg)"
          strokeWidth="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.75"
        />
        <circle r={near ? 1.5 : 1.2} fill="var(--color-fg)" opacity="0.95" />
      </g>
      <Sparkle cx={8.5} cy={-5.5} r={near ? 1.8 : 1.4} o={near ? 0.9 : 0.6} />
      <Sparkle cx={-9} cy={5} r={1.1} o={near ? 0.7 : 0.45} />
      <Sparkle cx={6.5} cy={6.5} r={1.3} o={near ? 0.75 : 0.5} />
    </g>
  )
}

/**
 * Era 16 (Intergalactic voyage): charge the mass-effect relay, then catapult a
 * ship into a galaxy when the sweeping beam crosses it. A clean shot federates a
 * distant world (free Federation). Full-width. Simulation in massRelayWorld.ts.
 */
export function MassRelay({ era }: { era: EraDef }): ReactElement {
  const { t } = useTranslation()
  const { verb, gainBase, gainCombinedScaled } = useEraMechanic(era)
  const [world, setWorld] = useSimLoop(freshRelay, (w) => step(w, STEP_MS / 1000), STEP_MS)
  useArrivalReward(world.arrived, gainCombinedScaled)

  const charged = world.charge >= 100
  const tap = () => {
    if (world.launch >= 0) return
    if (!charged) {
      setWorld(addCharge)
      gainBase(1)
      return
    }
    setWorld(fire)
  }

  const g = pos(world.target, GAL_R)
  const near = charged && world.launch < 0 && angularGap(world.spin, world.target) <= ALIGN_TOL
  const beam = pos(world.spin, GAL_R + 4)
  const ship = world.launch >= 0 ? pos(world.target, 12 + world.launch * (GAL_R - 12)) : null
  const lit = world.charge / 100

  return (
    <div className="mt-2 flex w-full flex-col items-center gap-2">
      <span className="inline-flex items-center gap-2 text-base font-semibold text-fg">
        {verb}
        <WidgetGalet />
      </span>

      <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-surface/80">
        <button
          type="button"
          onClick={tap}
          aria-label={charged ? t('massrelay.fire') : verb}
          className="block w-full transition active:scale-[0.995] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg viewBox="0 0 100 100" className="h-60 w-full" role="img" aria-hidden>
            <StarField stars={STARS} big={0.8} small={0.5} />
            <Galaxy x={g.x} y={g.y} near={near} />

            {charged && world.launch < 0 ? (
              <line
                x1={CX}
                y1={CY}
                x2={beam.x}
                y2={beam.y}
                stroke="var(--color-accent)"
                strokeWidth={near ? 2.6 : 1.2}
                strokeLinecap="round"
                opacity={near ? 1 : 0.5}
                strokeDasharray={near ? undefined : '3 3'}
              />
            ) : null}

            {ship ? (
              <>
                <line x1={CX} y1={CY} x2={g.x} y2={g.y} stroke="var(--color-accent)" strokeWidth="2.4" opacity="0.7" />
                <circle cx={ship.x} cy={ship.y} r="2.2" fill="var(--color-fg)" />
              </>
            ) : null}

            {/* relay arms */}
            <g fill="none" stroke="var(--color-fg)" strokeWidth="3" strokeLinecap="round" opacity="0.55">
              <path d="M34 20 Q16 50 34 80" />
              <path d="M66 20 Q84 50 66 80" />
            </g>
            {/* gyroscopic ring, spinning once charged */}
            <g transform={`rotate(${world.spin} ${CX} ${CY})`} opacity={0.3 + 0.5 * lit}>
              <ellipse cx={CX} cy={CY} rx="13" ry="5" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" />
            </g>
            {/* core, brightening with charge */}
            <circle cx={CX} cy={CY} r="16" fill="var(--color-accent)" opacity={0.12 + 0.25 * lit} />
            <circle cx={CX} cy={CY} r={6 + 3 * lit} fill="var(--color-accent)" opacity={0.4 + 0.6 * lit} />

            {world.result === 'miss' ? (
              <circle
                cx={CX}
                cy={CY}
                r="20"
                fill="none"
                stroke="var(--color-fg)"
                strokeWidth="1.5"
                opacity={Math.max(0, world.flash) * 0.6}
              />
            ) : null}
          </svg>
        </button>

        <div className="flex flex-col gap-1.5 px-5 pt-1 pb-4">
          <span className="text-center text-xs tracking-wide text-muted uppercase">
            {charged ? t('massrelay.aligned') : t('massrelay.charge')}
          </span>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(world.charge)}
            aria-label={t('massrelay.charge')}
            className="h-3 w-full overflow-hidden rounded-full border border-border bg-bg/60"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-100"
              style={{ width: `${world.charge}%` }}
            />
          </div>
        </div>
      </div>

      <span className="text-center text-sm text-muted">
        {charged ? t('massrelay.hint.fire') : t('massrelay.hint.charge')}
      </span>
    </div>
  )
}
