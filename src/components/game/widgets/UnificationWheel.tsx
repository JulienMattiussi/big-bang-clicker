import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { WidgetGalet } from './WidgetGalet'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useClickPulse } from '@/store/clickPulse'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

// Flattened wide ellipse (viewBox 200x100, same 2:1 ratio as the box, so strokes
// stay uniform). Centre (100,50); radii below are in those viewBox units.
const CX = 100
const CY = 50
const RING_X = 86
const RING_Y = 40
const SPOKE_IN = 0.4 // spoke endpoints as a fraction of the ring radius
const SPOKE_OUT = 0.74
const PULSE_MS = 450
const BURST_MS = 600
const PERFECT_BONUS = 2 // reward multiplier for a full chronological-order sweep
const SPEED_BONUS = 2 // reward multiplier for completing the ring before the timer runs out
const PER_ERA_MS = 1000 // length of the speed window, per lit era to channel
const TIMER_R = 47 // countdown arc radius, in its own 100x100 overlay viewBox
const TIMER_C = 2 * Math.PI * TIMER_R // arc circumference, for the depleting dash

/**
 * Era 17 (The Great Unification): the conclusive system. The era's recipe draws
 * one unit of EACH earlier era's base resource (see data/index.ts); this wheel
 * makes that legible AND playable. Each earlier era is a node on the ring, lit
 * while it still feeds the city. The gesture is to CHANNEL the lit eras one by
 * one (an impulse runs its spoke into the core); once every lit era is channelled
 * the universe-city core fires on its own, granting a scaled combined reward.
 * Channelling in chronological order yields a "perfect sweep" bonus (soft-fail:
 * out of order still channels, it only forfeits the bonus). Full-width.
 */
export function UnificationWheel({ era }: { era: EraDef }): ReactElement {
  const { t } = useTranslation()
  const { verb, gainBase, gainCombinedScaled } = useEraMechanic(era)
  const defs = useGameStore((s) => s.defs)
  const resources = useGameStore((s) => s.state.resources)
  const [reduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )

  // One node per earlier era (e0..e16), in chronological order.
  const feeders = defs.eras.filter((e) => e.index < 17)
  const n = feeders.length
  const lit = (eraDef: EraDef) => (resources[eraDef.clickResource] ?? 0) > 0
  const litIds = feeders.filter(lit).map((e) => e.id)

  // Cycle state (local to the widget): which lit eras are channelled so far, and
  // whether the sweep is still in chronological order (for the perfect bonus).
  const [channelled, setChannelled] = useState<ReadonlySet<string>>(() => new Set())
  const [perfect, setPerfect] = useState(true)
  const [pulses, setPulses] = useState<{ key: number; x: number; y: number }[]>([])
  const [fireSeq, setFireSeq] = useState(0)
  const seqRef = useRef(0)

  // Speed window: the timer starts on the first channel of a cycle and the core
  // ring shrinks as it elapses (rAF, set imperatively for perfect visual/logic
  // sync). Completing the ring before it expires adds the speed bonus; it never
  // punishes (the cycle stays channellable, only the bonus is forfeited).
  const [racing, setRacing] = useState(false)
  const windowRef = useRef(0)
  const expiredRef = useRef(false)
  const ringRef = useRef<SVGCircleElement | null>(null)

  useEffect(() => {
    if (!racing || reduced) return
    let raf = 0
    const start = performance.now()
    const tick = () => {
      const frac = Math.max(0, 1 - (performance.now() - start) / windowRef.current)
      const el = ringRef.current
      // Deplete the purple core ring: hide a growing fraction of its circumference.
      if (el) el.setAttribute('stroke-dashoffset', String(TIMER_C * (1 - frac)))
      if (frac <= 0) {
        expiredRef.current = true
        setRacing(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [racing, reduced])

  const at = (i: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    return { cos: Math.cos(a), sin: Math.sin(a) }
  }
  const nodePos = (i: number) => {
    const { cos, sin } = at(i)
    return { x: CX + RING_X * cos, y: CY + RING_Y * sin }
  }

  const channelledCount = litIds.filter((id) => channelled.has(id)).length
  const progress = litIds.length > 0 ? channelledCount / litIds.length : 0

  // The raw verb tap stays available on the core (keyboard-friendly quick gesture).
  const tapCore = () => {
    gainBase(1)
    useClickPulse.getState().pulse()
  }

  const channel = (eraDef: EraDef, i: number) => {
    if (!lit(eraDef) || channelled.has(eraDef.id)) return
    gainBase(1)
    // Expected next era for a chronological sweep = first lit era not yet channelled.
    const expected = litIds.find((id) => !channelled.has(id))
    const stillPerfect = perfect && expected === eraDef.id

    const isFirst = channelled.size === 0
    if (isFirst) {
      windowRef.current = litIds.length * PER_ERA_MS
      expiredRef.current = false
    }

    if (!reduced) {
      const { x, y } = nodePos(i)
      const key = seqRef.current++
      setPulses((p) => [...p, { key, x, y }])
      window.setTimeout(() => setPulses((p) => p.filter((q) => q.key !== key)), PULSE_MS)
    }

    const next = new Set(channelled).add(eraDef.id)
    const complete = litIds.length > 0 && litIds.every((id) => next.has(id))
    if (complete) {
      // Verdicts of THIS final channel (state is stale here), combined as multipliers.
      const mult = (stillPerfect ? PERFECT_BONUS : 1) * (expiredRef.current ? 1 : SPEED_BONUS)
      gainCombinedScaled(litIds.length * mult)
      setChannelled(new Set())
      setPerfect(true)
      setRacing(false)
      setFireSeq((s) => s + 1)
      useClickPulse.getState().pulse()
    } else {
      if (isFirst) setRacing(true)
      setChannelled(next)
      setPerfect(stillPerfect)
    }
  }

  return (
    <div className="mt-2 flex w-full flex-col items-center gap-2">
      <div className="flex w-full max-w-4xl items-center gap-5">
        <div className="relative aspect-9/4 min-w-0 flex-1" role="group" aria-label={verb}>
          <svg
            viewBox="0 0 200 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden
          >
            {feeders.map((e, i) => {
              const { cos, sin } = at(i)
              const ok = lit(e)
              const done = channelled.has(e.id)
              return (
                <line
                  key={e.id}
                  x1={CX + RING_X * SPOKE_IN * cos}
                  y1={CY + RING_Y * SPOKE_IN * sin}
                  x2={CX + RING_X * SPOKE_OUT * cos}
                  y2={CY + RING_Y * SPOKE_OUT * sin}
                  stroke={done ? 'var(--color-octarine)' : 'var(--color-accent)'}
                  strokeWidth={done ? 3.4 : ok ? 1.1 : 0.7}
                  strokeLinecap="round"
                  opacity={done ? 1 : ok ? 0.45 : 0.12}
                />
              )
            })}
            {/* universe-city core glow (flattened to match the disk), swells with progress */}
            <ellipse cx={CX} cy={CY} rx="28" ry="14" fill="var(--color-accent)" opacity="0.12" />
            <ellipse
              cx={CX}
              cy={CY}
              rx={19 + progress * 6}
              ry={(19 + progress * 6) / 2}
              fill="var(--color-accent)"
              opacity={0.22 + progress * 0.25}
            />
            {pulses.map((p) => (
              <circle key={p.key} r="2.2" fill="var(--color-accent)">
                <animate
                  attributeName="cx"
                  from={p.x}
                  to={CX}
                  dur={`${PULSE_MS}ms`}
                  fill="freeze"
                />
                <animate
                  attributeName="cy"
                  from={p.y}
                  to={CY}
                  dur={`${PULSE_MS}ms`}
                  fill="freeze"
                />
                <animate
                  attributeName="opacity"
                  from="0.9"
                  to="0"
                  dur={`${PULSE_MS}ms`}
                  fill="freeze"
                />
              </circle>
            ))}
          </svg>

          {/* Convergence meter for non-visual readers. */}
          <div
            className="sr-only"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={litIds.length}
            aria-valuenow={channelledCount}
            aria-label={t('unification.progress')}
          />

          {/* The core: a quick verb tap, and the auto-firing convergence target. */}
          <button
            type="button"
            onClick={tapCore}
            aria-label={verb}
            className={`absolute top-1/2 left-1/2 flex aspect-square h-[46%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-bg/70 text-accent transition select-none hover:bg-bg/90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              perfect && channelledCount > 0 ? 'border-octarine' : 'border-accent'
            }`}
          >
            <Icon name="universe-city" className="h-8 w-8" aria-hidden />
          </button>

          {/* Countdown: the purple core ring depletes (rAF) while the speed window runs. */}
          {racing && !reduced && (
            <svg
              viewBox="0 0 100 100"
              className="pointer-events-none absolute top-1/2 left-1/2 aspect-square h-[46%] -translate-x-1/2 -translate-y-1/2 -rotate-90"
              aria-hidden
            >
              <circle
                ref={ringRef}
                cx="50"
                cy="50"
                r={TIMER_R}
                fill="none"
                stroke="var(--color-octarine)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={TIMER_C}
                strokeDashoffset={0}
              />
            </svg>
          )}

          {/* Core convergence burst when the ring completes. */}
          {!reduced && fireSeq > 0 && (
            <span
              key={fireSeq}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-1/2 aspect-square h-[46%] -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border-2 border-accent"
              style={{ animationIterationCount: 1, animationDuration: `${BURST_MS}ms` }}
              onAnimationEnd={() => setFireSeq(0)}
            />
          )}

          {/* One channellable era node per ring position. */}
          {feeders.map((e, i) => {
            const { cos, sin } = at(i)
            const def = defs.resources[e.clickResource]
            const ok = lit(e)
            const done = channelled.has(e.id)
            const label = def ? t(def.nameKey as TranslationKey) : e.id
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => channel(e, i)}
                disabled={!ok || done}
                aria-label={`${t('unification.channel')} ${label}`}
                title={label}
                className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  done
                    ? 'border-octarine bg-surface text-octarine'
                    : ok
                      ? 'cursor-pointer border-accent bg-surface text-accent hover:scale-110 active:scale-95'
                      : 'border-border bg-bg text-muted opacity-40'
                }`}
                style={{ left: `${50 + (RING_X / 2) * cos}%`, top: `${50 + RING_Y * sin}%` }}
              >
                {def?.symbol ? (
                  <span className="text-[11px] font-bold">{def.symbol}</span>
                ) : (
                  <Icon name={def?.icon ?? 'circle-dot'} className="h-4 w-4" aria-hidden />
                )}
              </button>
            )
          })}
        </div>

        <div className="flex w-44 shrink-0 flex-col gap-2">
          <span className="inline-flex items-center gap-2 text-base font-semibold text-fg">
            {verb}
            <WidgetGalet />
          </span>
          <span className="text-sm text-muted">{t('unification.hint')}</span>
        </div>
      </div>
    </div>
  )
}
