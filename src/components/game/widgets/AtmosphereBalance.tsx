import { useEffect, useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { WidgetHint } from './WidgetHint'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

const ZONE_LO = 56
const ZONE_HI = 82
const START = 48
const DRIFT = 1.1 // toward CO2 each tick
const STEP = 7 // each "Oxygenate" click pushes toward O2
const TICK_MS = 90
/** Ticks spent inside the zone before a stable atmosphere is produced. */
const STABLE_NEED = 22

const clamp = (v: number) => Math.max(0, Math.min(105, v))
const inZone = (p: number) => p >= ZONE_LO && p <= ZONE_HI

/**
 * Era 7 (Great Oxidation): an atmospheric balance. The needle drifts toward CO2;
 * "Oxygenate" pushes it toward O2. Keep it in the green zone to build a stable
 * atmosphere (free) and earn oxygen on each well-placed push. Push too hard and
 * the oxygen catastrophe strikes - a shake and a reset, but it rebounds with a
 * burst of atmosphere. Homeostasis: a balance to hold, not a stock to maximise.
 */
export function AtmosphereBalance({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const [pos, setPos] = useState(START)
  const [shake, setShake] = useState(0)
  const posRef = useRef(START)
  const stableRef = useRef(0)

  const move = (next: number) => {
    posRef.current = next
    setPos(next)
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = posRef.current
      if (inZone(p)) {
        stableRef.current += 1
        if (stableRef.current >= STABLE_NEED) {
          stableRef.current = 0
          complete()
        }
      }
      move(clamp(p - DRIFT))
    }, TICK_MS)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const oxygenate = () => {
    const next = posRef.current + STEP
    if (next >= 100) {
      // Oxygen catastrophe: overshoot collapses, then rebounds (free bonus).
      complete()
      setShake((s) => s + 1)
      stableRef.current = 0
      move(START)
      return
    }
    if (inZone(next)) gainBase()
    move(clamp(next))
  }

  const zoneNow = inZone(pos)

  return (
    <div className="flex w-64 flex-col items-center gap-3">
      <div className={`flex w-full items-center gap-2 ${shake ? 'widget-shake' : ''}`} key={shake}>
        <span aria-hidden className="text-xs font-semibold text-muted">
          {t('balance.co2')}
        </span>
        <div
          role="progressbar"
          aria-label={t('balance.gauge')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          className="relative h-7 flex-1 overflow-hidden rounded-full border border-border"
          style={{
            // CO2 (blue) -> a GREEN plateau over the exact target zone -> O2
            // (orange). Green is a deliberate "safe zone" colour (not a tier token).
            backgroundImage: `linear-gradient(90deg, var(--color-secondary), #22c55e ${ZONE_LO}%, #22c55e ${ZONE_HI}%, var(--color-accent))`,
          }}
        >
          {/* Target-zone delimiters (the band itself is green from the gradient). */}
          <div
            aria-hidden
            className="absolute inset-y-0 border-x border-fg/40"
            style={{ left: `${ZONE_LO}%`, width: `${ZONE_HI - ZONE_LO}%` }}
          />
          <div
            aria-hidden
            className={`absolute inset-y-0 w-1 -translate-x-1/2 rounded-full transition-[left] duration-75 ${
              zoneNow ? 'bg-fg shadow-[0_0_8px_var(--color-fg)]' : 'bg-fg/70'
            }`}
            style={{ left: `${Math.min(100, pos)}%` }}
          />
        </div>
        <span aria-hidden className="text-xs font-semibold text-accent">
          {t('balance.o2')}
        </span>
      </div>

      <button
        type="button"
        onClick={oxygenate}
        className="rounded-md border border-accent/60 bg-accent/10 px-5 py-2 text-base font-semibold text-fg transition select-none hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
      >
        {verb}
      </button>
      <WidgetHint>{t('balance.hint')}</WidgetHint>
    </div>
  )
}
