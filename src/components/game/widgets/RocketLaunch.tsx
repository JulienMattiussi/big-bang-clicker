import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { WidgetGalet } from './WidgetGalet'
import { Galet } from '@/components/art/Galet'
import { announceGalet } from '@/hooks/useGalets'
import { widgetGaletForEra } from '@/lib/galets'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import {
  addThrust,
  fireStar,
  FLASH,
  freshWorld,
  LOCK_HOLD,
  nudge,
  STAR_HIT,
  STEP_MS,
  URGENT_LEAD,
  steer,
  step,
  type Phase,
  type Ship,
  type World,
} from './rocketWorld'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

// Precomputed star field (a few faint dots), shared across the space scenes.
const STARS = [
  [14, 22],
  [38, 12],
  [62, 30],
  [82, 18],
  [26, 48],
  [72, 56],
  [50, 20],
  [90, 44],
]

/** Palette tokens for the rocket liveries (indexed by Ship.color). */
const LIVERIES = [
  'var(--part-6)', // blue
  'var(--part-1)', // red
  'var(--part-4)', // green
  'var(--part-2)', // orange
  'var(--part-7)', // violet
]
const livery = (i: number) => LIVERIES[i] ?? 'var(--color-accent)'

/** A rocket/ship glyph pointing up, base at the origin; flame grows with `flame`
 *  (0..1). `color` tints the fins, window and flame (the livery). */
function Rocket({
  flame = 0,
  color = 'var(--color-accent)',
}: {
  flame?: number
  color?: string
}): ReactElement {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {flame > 0 ? (
        <path d={`M-3.5 0 L0 ${10 + flame * 16} L3.5 0 Z`} fill={color} opacity={0.85} />
      ) : null}
      <path d="M-6 -2 L-11 6 L-6 4 Z M6 -2 L11 6 L6 4 Z" fill={color} />
      <path
        d="M-6 0 L-6 -26 Q-6 -40 0 -44 Q6 -40 6 -26 L6 0 Z"
        fill="var(--color-surface)"
        stroke="var(--color-fg)"
        strokeWidth="1.4"
      />
      <circle cx="0" cy="-26" r="3.4" fill={color} />
      <path d="M-6 -8 L6 -8" stroke="var(--color-fg)" strokeOpacity="0.4" strokeWidth="1" />
    </g>
  )
}

function StarField(): ReactElement {
  return (
    <>
      {STARS.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 1.3 : 0.8}
          fill="var(--color-fg)"
          opacity="0.4"
        />
      ))}
    </>
  )
}

/** Shared scene frame: a portrait SVG with a soft vertical gradient by phase. */
function Scene({ phase, children }: { phase: Phase; children: ReactNode }): ReactElement {
  return (
    <svg viewBox="0 0 100 150" className="h-64 w-full" aria-hidden>
      <defs>
        <linearGradient id={`sky-${phase}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-bg)" />
          <stop
            offset="100%"
            stopColor={phase === 'launch' ? 'var(--color-secondary)' : 'var(--color-surface)'}
            stopOpacity={phase === 'launch' ? 0.4 : 0.7}
          />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="150" fill={`url(#sky-${phase})`} />
      {children}
    </svg>
  )
}

/** Outcome flash over a finished landing/ascent ship. */
function Outcome({
  ship,
  t,
}: {
  ship: Ship
  t: (k: TranslationKey) => string
}): ReactElement | null {
  if (!ship.result) return null
  const ok = ship.result === 'land'
  return (
    <text
      x="50"
      y="80"
      textAnchor="middle"
      className={`text-[11px] font-bold ${ok ? 'fill-accent' : 'fill-red-400'}`}
    >
      {t(ok ? 'rocket.land' : 'rocket.crash')}
    </text>
  )
}

/**
 * Era 15 (Space conquest): launch ships on a journey across four live phases that
 * run at once (juggle several ships): build thrust, steady the ascent, lock onto a
 * distant star, then land on the pad. A clean landing colonises (free Colony).
 * Full-width. Simulation in rocketWorld.ts.
 */
export function RocketLaunch({ era }: { era: EraDef }): ReactElement {
  const { t } = useTranslation()
  const { verb, gainBase, gainCombinedScaled } = useEraMechanic(era)

  const [world, setWorld] = useState<World>(freshWorld)

  const defs = useGameStore((s) => s.defs)
  const galet = widgetGaletForEra(defs, era.id)
  const galetFound = useGameStore((s) => (galet ? !!s.state.galets[galet.id]?.found : false))

  // The live loop: a pure step every tick (no side effects in the updater).
  useEffect(() => {
    const handle = setInterval(() => setWorld((w) => step(w, STEP_MS / 1000)), STEP_MS)
    return () => clearInterval(handle)
  }, [])

  // Reward each fresh successful landing (the delta since last seen), and on the
  // first one reveal the space-time pebble. Store actions belong in an effect.
  const rewarded = useRef(0)
  useEffect(() => {
    const delta = world.landedTotal - rewarded.current
    if (delta > 0) {
      rewarded.current = world.landedTotal
      gainCombinedScaled(delta) // +1 Colony per landing (galet + era factory mults only)
      if (galet && !galetFound) announceGalet(galet)
    }
  }, [world.landedTotal, gainCombinedScaled, galet, galetFound])

  const [launch, ascent, cruise, landing] = world.slots

  // The side to right a lean is opposite it (-ascent.tilt); blink it near tip-over.
  // -1 = left, +1 = right, 0 = none.
  const urgentDir =
    ascent && !ascent.result && ascent.tilt !== 0 && ascent.react <= URGENT_LEAD ? -ascent.tilt : 0

  const tapLaunch = () => {
    if (!launch || launch.thrust >= 100) return
    setWorld(addThrust)
    gainBase(1)
  }
  const act = (fn: (w: World) => World) => () => setWorld(fn)
  const fire = () => setWorld((w) => fireStar(w).world)

  const colTitle = (p: Phase) => t(`rocket.phase.${p}` as TranslationKey)

  return (
    <div className="mt-4 flex w-full flex-col items-center gap-3">
      <div className="grid w-full divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface/80 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {/* Phase 1: launch - mash the rocket to build thrust. */}
        <Column title={colTitle('launch')}>
          <button
            type="button"
            onClick={tapLaunch}
            aria-label={verb}
            className="relative block w-full overflow-hidden rounded-md transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Scene phase="launch">
              {/* Launch pad: ground, flame trench, platform and a gantry tower. */}
              <path d="M0 132 H100 V150 H0 Z" fill="var(--color-fg)" opacity="0.16" />
              <path d="M43 132 L45 141 L55 141 L57 132 Z" fill="var(--color-bg)" opacity="0.55" />
              <rect
                x="28"
                y="130"
                width="16"
                height="3"
                rx="1"
                fill="var(--color-fg)"
                opacity="0.32"
              />
              <rect
                x="56"
                y="130"
                width="16"
                height="3"
                rx="1"
                fill="var(--color-fg)"
                opacity="0.32"
              />
              <path
                d="M30 133 L26 144 M42 133 L40 144 M58 133 L60 144 M70 133 L74 144"
                stroke="var(--color-fg)"
                strokeOpacity="0.3"
                strokeWidth="1.4"
              />
              <g stroke="var(--color-fg)" strokeOpacity="0.4" strokeWidth="1.3" fill="none">
                <path d="M72 132 V92 M82 132 V92" />
                <path d="M72 124 H82 M72 116 H82 M72 108 H82 M72 100 H82" />
                <path d="M72 132 L82 124 M72 124 L82 116 M72 116 L82 108 M72 108 L82 100" />
                <path d="M72 96 H61" />
              </g>
              <path
                d="M44 130 H47 M53 130 H56"
                stroke="var(--color-accent)"
                strokeOpacity="0.7"
                strokeWidth="1.6"
              />
              {launch ? (
                <g
                  transform={`translate(${50 - (1 - launch.arrive / 100) * 72} ${132 - launch.thrust * 0.12 - launch.lift * 1.7})`}
                  style={{ transition: 'transform 60ms linear' }}
                >
                  <Rocket
                    flame={launch.thrust >= 100 ? 1 : launch.thrust / 140}
                    color={livery(launch.color)}
                  />
                </g>
              ) : null}
            </Scene>
          </button>
          <Gauge value={launch?.thrust ?? 0} max={100} label={t('rocket.thrust')} />
        </Column>

        {/* Phase 2: ascent - keep the tilt inside the green zone. Controls flank
            the rocket (left/right) right inside the image. */}
        <Column title={colTitle('ascent')}>
          <div className="relative overflow-hidden rounded-md">
            <Scene phase="ascent">
              <StarField />
              {ascent ? <AscentScene ship={ascent} /> : <Waiting t={t} />}
            </Scene>
            <SteerButton
              side="left"
              disabled={!ascent || !!ascent.result || ascent.corrected >= ascent.needed}
              urgent={urgentDir === -1}
              onClick={act((w) => nudge(w, -1))}
              label={t('rocket.left')}
            />
            <SteerButton
              side="right"
              disabled={!ascent || !!ascent.result || ascent.corrected >= ascent.needed}
              urgent={urgentDir === 1}
              onClick={act((w) => nudge(w, 1))}
              label={t('rocket.right')}
            />
          </div>
        </Column>

        {/* Phase 3: cruise - fire when the sight crosses the star. */}
        <Column title={colTitle('cruise')}>
          <button
            type="button"
            onClick={fire}
            disabled={!cruise || cruise.locked}
            aria-label={t('rocket.fire')}
            className="relative block w-full overflow-hidden rounded-md transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default"
          >
            <Scene phase="cruise">
              <StarField />
              {cruise ? <CruiseScene ship={cruise} /> : <Waiting t={t} />}
            </Scene>
          </button>
        </Column>

        {/* Phase 4: landing - steer the descent onto the pad. Controls flank the
            ship (left/right) inside the image, like the ascent phase. */}
        <Column title={colTitle('landing')}>
          <div className="relative overflow-hidden rounded-md">
            <Scene phase="landing">
              <StarField />
              <path d="M0 138 Q50 120 100 138 V150 H0 Z" fill="var(--color-fg)" opacity="0.16" />
              {landing ? (
                <>
                  <g transform={`translate(${landing.pad} 137)`}>
                    <path
                      d="M-11 0 H11 M-11 0 V-3 M11 0 V-3"
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="1.6"
                    />
                  </g>
                  <LandingShip ship={landing} />
                  <Outcome ship={landing} t={t} />
                </>
              ) : (
                <Waiting t={t} />
              )}
            </Scene>
            <SteerButton
              side="left"
              disabled={!landing || !!landing.result}
              onClick={act((w) => steer(w, -1))}
              label={t('rocket.left')}
            />
            <SteerButton
              side="right"
              disabled={!landing || !!landing.result}
              onClick={act((w) => steer(w, 1))}
              label={t('rocket.right')}
            />
            {/* The space-time pebble rests on the planet (visible from the start;
                the first landing claims it). */}
            {galet && !galetFound ? (
              <span className="absolute bottom-9 left-1/2 -translate-x-1/2">
                <Galet color={galet.color} motif={galet.motif} shape={galet.shape} size={30} />
              </span>
            ) : null}
          </div>
        </Column>
      </div>

      <span className="flex items-center justify-center gap-2 text-center text-sm text-muted">
        {t('rocket.hint')}
        <WidgetGalet />
      </span>
    </div>
  )
}

/** A round orientation button flanking the rocket inside the scene (left/right). */
function SteerButton({
  side,
  disabled,
  urgent = false,
  onClick,
  label,
}: {
  side: 'left' | 'right'
  disabled: boolean
  urgent?: boolean
  onClick: () => void
  label: string
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-surface/85 text-lg text-accent shadow-sm backdrop-blur-sm transition select-none active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-25 ${
        urgent ? 'animate-urgent border-accent ring-2 ring-accent' : 'border-accent/50'
      } ${side === 'left' ? 'left-2' : 'right-2'}`}
    >
      {side === 'left' ? '◄' : '►'}
    </button>
  )
}

function Column({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <section aria-label={title} className="flex flex-col gap-2 p-2.5">
      <h3 className="text-center text-xs font-semibold tracking-wide text-muted uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Waiting({ t }: { t: (k: TranslationKey) => string }): ReactElement {
  return (
    <text x="50" y="78" textAnchor="middle" className="fill-muted text-[8px]" opacity="0.6">
      {t('rocket.waiting')}
    </text>
  )
}

function Gauge({ value, max, label }: { value: number; max: number; label: string }): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-center text-[10px] tracking-wide text-muted uppercase">{label}</span>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full border border-border bg-bg/60"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-100"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  )
}

/** Rocket blowing up; `p` is 0..1 progress (0 = the instant it pops). */
function Explosion({ x, y, p }: { x: number; y: number; p: number }): ReactElement {
  const fade = 1 - p
  const ease = Math.pow(p, 0.55)
  const coreR = (5 + ease * 9) * (1 - p * 0.5)
  const ringR = 5 + ease * 30
  const SHARDS = 14
  return (
    <g transform={`translate(${x} ${y})`} opacity={fade}>
      <circle
        r={ringR}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={3.5 * fade}
        opacity={0.55 * fade}
      />
      <circle r={coreR * 1.7} fill="var(--color-accent)" opacity={0.4 * fade} />
      <circle r={coreR} fill="var(--color-fg)" opacity={0.85 * fade} />
      {Array.from({ length: SHARDS }, (_, i) => {
        const a = i * 2.39996 // golden angle: an even, non-repeating spread
        const d = ease * (13 + (i % 4) * 6)
        const sr = fade * (1.2 + (i % 3) * 0.7)
        return (
          <circle
            key={i}
            cx={Math.cos(a) * d}
            cy={Math.sin(a) * d}
            r={sr}
            fill="var(--color-accent)"
            opacity={fade}
          />
        )
      })}
    </g>
  )
}

/** Correction progress dots (jolts survived / needed). */
function Pips({ corrected, needed }: { corrected: number; needed: number }): ReactElement {
  const w = (needed - 1) * 9
  return (
    <g>
      {Array.from({ length: needed }, (_, i) => (
        <circle
          key={i}
          cx={50 - w / 2 + i * 9}
          cy="128"
          r="2.4"
          fill="var(--color-accent)"
          opacity={i < corrected ? 1 : 0.25}
        />
      ))}
    </g>
  )
}

/** Ascent scene: the rocket leans on each jolt, climbs away once steadied, or
 *  explodes on a missed/late correction. */
function AscentScene({ ship }: { ship: Ship }): ReactElement {
  const climbing = !ship.result && ship.corrected >= ship.needed
  const y = climbing ? 90 - ship.climb * 1.7 : 90
  return (
    <>
      {ship.result ? (
        <Explosion x={50} y={90} p={1 - Math.max(0, ship.flash) / FLASH} />
      ) : (
        <>
          <g
            transform={`translate(50 ${y}) rotate(${climbing ? 0 : ship.angle})`}
            style={{ transition: 'transform 90ms linear' }}
          >
            <Rocket flame={climbing ? 1 : 0.7} color={livery(ship.color)} />
          </g>
          <Pips corrected={ship.corrected} needed={ship.needed} />
        </>
      )}
    </>
  )
}

function Star({
  x,
  y,
  near,
  locked,
}: {
  x: number
  y: number
  near?: boolean
  locked?: boolean
}): ReactElement {
  const halo = locked ? 0.5 : near ? 0.4 : 0.18
  const r = locked ? 8 : near ? 6.5 : 4
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="var(--color-accent)" opacity={halo} />
      <path
        d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3 Z"
        fill="var(--color-accent)"
      />
    </g>
  )
}

const yOf = (v: number) => 14 + v * 1.1

/** Cruise scene: a horizontal (X) sight sweeps; once caught, a vertical (Y) sight
 *  sweeps; the second catch sends the ship streaking off toward the star. */
function CruiseScene({ ship }: { ship: Ship }): ReactElement {
  const sx = ship.star
  const sy = yOf(ship.starY)
  const stageA = !ship.lockX
  const nearX = stageA && Math.abs(ship.reticle - ship.star) <= STAR_HIT
  const nearY = ship.lockX && !ship.locked && Math.abs(ship.reticleY - ship.starY) <= STAR_HIT
  // On lock, the ship streaks from its rest spot toward the star, turning to point
  // at it (nose-up baseline) and shrinking away.
  const dep = ship.locked ? 1 - Math.max(0, ship.flash) / LOCK_HOLD : 0
  const rx = 50 + (sx - 50) * dep
  const ry = 120 + (sy - 120) * dep
  const aim = (Math.atan2(sx - 50, 120 - sy) * 180) / Math.PI
  const rot = 8 + (aim - 8) * dep
  return (
    <>
      <Star x={sx} y={sy} near={nearX || nearY} locked={ship.locked} />
      <g
        transform={`translate(${rx} ${ry}) rotate(${rot}) scale(${1 - 0.85 * dep})`}
        opacity={1 - dep * 0.9}
      >
        <Rocket flame={0.5 + dep} color={livery(ship.color)} />
      </g>
      {!ship.locked ? (
        <line
          x1={stageA ? ship.reticle : sx}
          y1="6"
          x2={stageA ? ship.reticle : sx}
          y2="120"
          stroke="var(--color-accent)"
          strokeWidth={nearX ? 2.4 : stageA ? 1 : 1.4}
          strokeDasharray={nearX || !stageA ? undefined : '3 3'}
          opacity={stageA ? (nearX ? 1 : 0.7) : 0.5}
        />
      ) : null}
      {ship.lockX && !ship.locked ? (
        <line
          x1="6"
          y1={yOf(ship.reticleY)}
          x2="94"
          y2={yOf(ship.reticleY)}
          stroke="var(--color-accent)"
          strokeWidth={nearY ? 2.4 : 1}
          strokeDasharray={nearY ? undefined : '3 3'}
          opacity={nearY ? 1 : 0.7}
        />
      ) : null}
    </>
  )
}

/** The descending ship. On a crash it topples onto the pad (first half of the
 *  outcome flash) and then explodes (second half); a clean landing just rests. */
function LandingShip({ ship }: { ship: Ship }): ReactElement {
  const y = 14 + ship.descent * 1.18
  const crash = ship.result === 'crash'
  const cp = crash ? 1 - Math.max(0, ship.flash) / FLASH : 0
  const topple = Math.min(1, cp / 0.5)
  const boom = Math.max(0, (cp - 0.5) / 0.5)
  if (crash && boom > 0) return <Explosion x={ship.x} y={y} p={boom} />
  const lean = crash ? (ship.vx >= 0 ? 1 : -1) * topple * 82 : 0
  return (
    <g
      transform={`translate(${ship.x} ${y}) rotate(${lean}) scale(0.7)`}
      style={{ transition: 'transform 80ms linear' }}
    >
      <Rocket flame={ship.result ? 0 : 0.4} color={livery(ship.color)} />
    </g>
  )
}
