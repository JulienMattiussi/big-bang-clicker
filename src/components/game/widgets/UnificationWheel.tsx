import { type ReactElement } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { WidgetGalet } from './WidgetGalet'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useClickPulse } from '@/store/clickPulse'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

const SPOKE_IN = 17 // spoke start radius (svg units, around the core)
const SPOKE_OUT = 33 // spoke end radius
const ICON_R = 44 // era-icon ring radius (% of the square)

/**
 * Era 17 (The Great Unification): the conclusive system. The era's recipe draws
 * one unit of EACH earlier era's base resource (see data/index.ts), and this wheel
 * makes that legible: the universe-city pulses at the centre, ringed by one spoke
 * per era (chronological), lit when that era is still feeding it. Clicking the core
 * is the era's gesture (produces a district + a scaled universe-city). Full-width.
 */
export function UnificationWheel({ era }: { era: EraDef }): ReactElement {
  const { t } = useTranslation()
  const { verb, gainBase, gainCombinedScaled } = useEraMechanic(era)
  const defs = useGameStore((s) => s.defs)
  const resources = useGameStore((s) => s.state.resources)

  // One spoke per earlier era (e0..e16), in chronological order.
  const feeders = defs.eras.filter((e) => e.index < 17)
  const n = feeders.length

  const tap = () => {
    gainBase(1)
    gainCombinedScaled(1)
    useClickPulse.getState().pulse()
  }

  const at = (i: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    return { cos: Math.cos(a), sin: Math.sin(a) }
  }

  return (
    <div className="mt-4 flex w-full flex-col items-center gap-3">
      <span className="inline-flex items-center gap-2 text-base font-semibold text-fg">
        {verb}
        <WidgetGalet />
      </span>

      <div className="relative aspect-square w-full max-w-md">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          {feeders.map((e, i) => {
            const { cos, sin } = at(i)
            const ok = (resources[e.clickResource] ?? 0) > 0
            return (
              <line
                key={e.id}
                x1={50 + SPOKE_IN * cos}
                y1={50 + SPOKE_IN * sin}
                x2={50 + SPOKE_OUT * cos}
                y2={50 + SPOKE_OUT * sin}
                stroke="var(--color-accent)"
                strokeWidth={ok ? 1.4 : 0.8}
                strokeLinecap="round"
                opacity={ok ? 0.8 : 0.2}
              />
            )
          })}
          {/* universe-city core */}
          <circle cx="50" cy="50" r="15" fill="var(--color-accent)" opacity="0.12" />
          <circle cx="50" cy="50" r="10" fill="var(--color-accent)" opacity="0.22" />
        </svg>

        {/* The gesture: forge the unification at the core. */}
        <button
          type="button"
          onClick={tap}
          aria-label={verb}
          className="absolute top-1/2 left-1/2 flex h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-accent bg-bg/70 text-accent transition select-none hover:bg-bg/90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Icon name="universe-city" className="h-8 w-8" aria-hidden />
        </button>

        {/* One era resource per node around the ring. */}
        {feeders.map((e, i) => {
          const { cos, sin } = at(i)
          const def = defs.resources[e.clickResource]
          const ok = (resources[e.clickResource] ?? 0) > 0
          return (
            <span
              key={e.id}
              className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs transition ${
                ok ? 'border-accent bg-surface text-accent' : 'border-border bg-bg text-muted opacity-40'
              }`}
              style={{ left: `${50 + ICON_R * cos}%`, top: `${50 + ICON_R * sin}%` }}
              title={def ? t(def.nameKey as TranslationKey) : e.id}
            >
              {def?.symbol ? (
                <span className="text-[11px] font-bold">{def.symbol}</span>
              ) : (
                <Icon name={def?.icon ?? 'circle-dot'} className="h-4 w-4" aria-hidden />
              )}
            </span>
          )
        })}
      </div>

      <span className="max-w-prose text-center text-sm text-muted">{t('unification.hint')}</span>
    </div>
  )
}
