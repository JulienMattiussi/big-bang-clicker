import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'
import { FloaterLayer } from '@/components/ui/FloaterLayer'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslation } from '@/i18n/useTranslation'
import { formatFixed, formatNumber } from '@/lib/format'

/** How often (ms) we float the accumulated Complexity gain. */
const PULSE_MS = 1000

/** Highlighted Complexity badge: the game's major objective (octarine). */
export function ComplexityBadge() {
  const { t } = useTranslation()
  const complexity = useGameStore((s) => s.state.complexity)

  // Float the gain accumulated over each interval, so progression stays
  // visible even when the absolute number barely moves at large magnitudes.
  const previous = useRef(complexity)
  useEffect(() => {
    previous.current = useGameStore.getState().state.complexity
    const timer = setInterval(() => {
      const current = useGameStore.getState().state.complexity
      const delta = current - previous.current
      previous.current = current
      if (delta > 0)
        useFeedbackStore.getState().spawn('complexity', `+${formatNumber(delta)}`, 'gain')
    }, PULSE_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="complexity-glow relative flex items-center gap-2 rounded-full border border-octarine/40 bg-octarine/10 px-4 py-1.5">
      <Icon name="gem" className="h-5 w-5 shrink-0 text-octarine" />
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
