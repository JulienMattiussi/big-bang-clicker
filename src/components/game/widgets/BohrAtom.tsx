import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { WidgetGalet } from './WidgetGalet'
import { useTranslation } from '@/i18n/useTranslation'
import { clickYield } from '@/lib/engine'
import { formatNumber } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

/** Eccentric orbit of the free electron (period, centre offset, radii). */
const ORBIT_PERIOD_S = 2.8
const ORBIT_CX = 60
const ORBIT_CY = 50
const ORBIT_RX = 24
const ORBIT_RY = 13
/** The electron is capturable while within this distance of the nucleus. */
const CAPTURE_RADIUS = 22

/**
 * Era 1 (Recombination): an interactive Bohr atom. A free electron sweeps an
 * eccentric orbit, approaching the nucleus. Capturing (click/Enter) while it is
 * inside the capture zone binds it -> hydrogen + a flash of light projecting
 * outward; the electron fades and a fresh one swings back in. Mistimed (or no
 * nucleus), you still grab a loose electron (lesser reward, never a hard fail).
 * Buying the recipe's levels automates a perfect capture. Replaces the verb.
 */
export function BohrAtom({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const click = useGameStore((s) => s.click)
  const manualConvert = useGameStore((s) => s.manualConvert)
  const spawn = useFeedbackStore((s) => s.spawn)

  const [flash, setFlash] = useState(0)
  const [captured, setCaptured] = useState({ id: 0, x: 0, y: 0 })

  const electronRef = useRef<SVGCircleElement>(null)
  const zoneRef = useRef<SVGCircleElement>(null)
  const glowRef = useRef<SVGCircleElement>(null)
  const posRef = useRef({ x: ORBIT_CX + ORBIT_RX, y: ORBIT_CY })
  const closeRef = useRef(false)
  const startRef = useRef(0)

  // Drive the free electron imperatively (smooth, and the hit-test reads the
  // exact same position - no visual/logic drift).
  useEffect(() => {
    let raf = 0
    startRef.current = performance.now()
    const loop = (now: number) => {
      const theta = (((now - startRef.current) / 1000 / ORBIT_PERIOD_S) % 1) * Math.PI * 2
      const x = ORBIT_CX + ORBIT_RX * Math.cos(theta)
      const y = ORBIT_CY + ORBIT_RY * Math.sin(theta)
      const dist = Math.hypot(x - 50, y - 50)
      const close = dist < CAPTURE_RADIUS
      posRef.current = { x, y }
      closeRef.current = close

      const el = electronRef.current
      if (el) {
        el.setAttribute('cx', x.toFixed(2))
        el.setAttribute('cy', y.toFixed(2))
        // Grows as it approaches (depth cue).
        el.setAttribute('r', (2.4 + 3.6 * Math.max(0, 1 - dist / 34)).toFixed(2))
      }
      zoneRef.current?.setAttribute('opacity', close ? '0.6' : '0.16')
      glowRef.current?.setAttribute('opacity', close ? '0.4' : '0.16')

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const capture = () => {
    const { state, defs } = useGameStore.getState()
    const recipe = era.converters[0]
    const conv = recipe ? defs.converters[recipe] : undefined
    const nucleon = conv?.inputs.find((i) => i.resource !== era.clickResource)
    const haveNucleon = !nucleon || (state.resources[nucleon.resource] ?? 0) >= nucleon.amount

    const yield_ = clickYield(state, defs, era)
    if (closeRef.current && recipe && conv && haveNucleon) {
      // Capture electrons (scales with the generator level): one binds into
      // hydrogen, the rest stay with you -> net `yield_` electrons.
      click(era.clickResource, yield_ + 1)
      manualConvert(recipe)
      spawn(`res:${era.clickResource}`, `+${formatNumber(yield_)}`, 'resource')
      for (const o of conv.outputs)
        spawn(`res:${o.resource}`, `+${formatNumber(o.amount)}`, 'resource')
      if (nucleon) spawn(`res:${nucleon.resource}`, `-${formatNumber(nucleon.amount)}`, 'spend')
      // Bound electron fades; light bursts; a fresh free electron swings back in.
      setCaptured((c) => ({ id: c.id + 1, x: posRef.current.x, y: posRef.current.y }))
      setFlash((f) => f + 1)
      startRef.current = performance.now()
    } else {
      // Mistimed (or no nucleus): you still capture loose electrons (scaled).
      click(era.clickResource, yield_)
      spawn(`res:${era.clickResource}`, `+${formatNumber(yield_)}`, 'resource')
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label={t(era.verbKey as TranslationKey)}
        onClick={capture}
        className="group rounded-full p-2 transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
      >
        <svg
          viewBox="0 0 100 100"
          className="h-60 w-60 overflow-visible transition group-hover:brightness-110"
        >
          <defs>
            {/* Soft light flash: bright core fading to transparent (projects out). */}
            <radialGradient id="bbc-light" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-fg)" stopOpacity="0.95" />
              <stop offset="55%" stopColor="var(--color-fg)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-fg)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer shell (hint of future shells when the widget returns). */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeDasharray="2 4"
            opacity="0.5"
          />
          <circle
            cx="50"
            cy="50"
            r="28"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1.5"
          />
          <g className="electron-orbit">
            <circle cx="78" cy="50" r="2.4" fill="var(--color-secondary)" opacity="0.8" />
          </g>

          <circle
            ref={zoneRef}
            cx="50"
            cy="50"
            r={CAPTURE_RADIUS}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.16"
          />
          <circle ref={glowRef} cx="50" cy="50" r="15" fill="var(--color-accent)" opacity="0.16" />

          <g fill="var(--color-accent)">
            <circle cx="47" cy="49" r="5" />
            <circle cx="53" cy="49" r="5" />
            <circle cx="50" cy="54" r="4.6" />
            <circle cx="50" cy="45" r="4.4" />
          </g>

          <circle ref={electronRef} cx="84" cy="50" r="3" fill="var(--color-secondary)" />

          {captured.id > 0 ? (
            <circle
              key={captured.id}
              cx={captured.x}
              cy={captured.y}
              r="3.4"
              fill="var(--color-secondary)"
              className="electron-fade"
            />
          ) : null}

          {flash > 0 ? (
            <circle
              key={flash}
              cx="50"
              cy="50"
              r="26"
              fill="url(#bbc-light)"
              className="light-burst"
            />
          ) : null}
        </svg>
      </button>
      <span className="text-base font-semibold text-fg">{t(era.verbKey as TranslationKey)}</span>
      <span className="flex flex-col items-center gap-1.5 text-xs text-muted">
        {t('bohr.hint')}
        <WidgetGalet />
      </span>
    </div>
  )
}
