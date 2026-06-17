import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { WidgetGalet } from './WidgetGalet'
import { useTranslation } from '@/i18n/useTranslation'
import { addCharge, ALIGN_TOL, angularGap, fire, freshRelay, step, type RelayWorld } from './massRelayWorld'
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

function StarField(): ReactElement {
  return (
    <g aria-hidden>
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 0.8 : 0.5} fill="var(--color-fg)" opacity="0.4" />
      ))}
    </g>
  )
}

/** A small spiral galaxy; brighter when the beam is locked onto it. */
function Galaxy({ x, y, near }: { x: number; y: number; near: boolean }): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) rotate(25)`}>
      <ellipse rx={near ? 7.5 : 6} ry={near ? 3.2 : 2.6} fill="var(--color-accent)" opacity={near ? 0.35 : 0.2} />
      <circle r={near ? 2.2 : 1.6} fill="var(--color-accent)" />
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
  const [world, setWorld] = useState<RelayWorld>(freshRelay)

  useEffect(() => {
    const h = setInterval(() => setWorld((w) => step(w, STEP_MS / 1000)), STEP_MS)
    return () => clearInterval(h)
  }, [])

  const rewarded = useRef(0)
  useEffect(() => {
    const delta = world.arrived - rewarded.current
    if (delta > 0) {
      rewarded.current = world.arrived
      gainCombinedScaled(delta) // +1 Federation per galaxy reached
    }
  }, [world.arrived, gainCombinedScaled])

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
    <div className="mt-4 flex w-full flex-col items-center gap-3">
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
          <svg viewBox="0 0 100 100" className="h-80 w-full" role="img" aria-hidden>
            <StarField />
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
