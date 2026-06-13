import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Galet } from '@/components/game/Galet'
import { FloaterLayer } from '@/components/ui/FloaterLayer'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslation } from '@/i18n/useTranslation'
import { galetsAffectingComplexity } from '@/lib/galets'
import type { TranslationKey } from '@/i18n/types'
import { formatFixed, formatNumber } from '@/lib/format'

/** How often (ms) we float the accumulated Complexity gain. */
const PULSE_MS = 1000

/** Highlighted Complexity badge: the game's major objective (octarine). */
export function ComplexityBadge() {
  const { t } = useTranslation()
  const complexity = useGameStore((s) => s.state.complexity)
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  // Pebbles that boost Complexity materialise their effect right on the meter
  // (the same way other pebbles show on the machines/resources they speed up).
  const galets = galetsAffectingComplexity(state, defs)

  // Float the gain accumulated over each interval, so progression stays
  // visible even when the absolute number barely moves at large magnitudes.
  const previous = useRef(complexity)
  useEffect(() => {
    previous.current = useGameStore.getState().state.complexity
    const timer = setInterval(() => {
      const current = useGameStore.getState().state.complexity
      const delta = current - previous.current
      previous.current = current
      // Skip floaters too tiny to render as anything but "+0".
      const text = formatNumber(delta)
      if (delta > 0 && text !== formatNumber(0))
        useFeedbackStore.getState().spawn('complexity', `+${text}`, 'gain')
    }, PULSE_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="complexity-glow relative flex items-center gap-2 rounded-full border border-octarine/40 bg-octarine/10 px-4 py-1.5">
      {/* The diamond, with any Complexity-boosting pebble shown right beneath it. */}
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <Icon name="gem" className="h-5 w-5 text-octarine" />
        {galets.map((g) => {
          const active = state.galets[g.id]?.active ?? false
          const label = `${t(g.nameKey as TranslationKey)} - ${t(g.descKey as TranslationKey)}`
          const title = active ? label : `${label} (${t('galet.inactive')})`
          return (
            <span key={g.id} title={title} className="inline-flex">
              <Galet color={g.color} motif={g.motif} shape={g.shape} size={18} dim={!active} />
              <span className="sr-only">{title}</span>
            </span>
          )
        })}
      </div>
      <div className="leading-tight">
        <div className="text-[10px] font-semibold tracking-wide text-muted uppercase">
          {t('app.complexity')}
        </div>
        <div className="text-lg font-bold tabular-nums text-octarine">
          {formatFixed(complexity)}
        </div>
      </div>
      <FloaterLayer target="complexity" />
    </div>
  )
}
