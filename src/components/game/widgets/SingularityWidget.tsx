import { useRef, useState, type ReactElement } from 'react'
import { useClickPulse } from '@/store/clickPulse'
import { useEndgameStore } from '@/store/endgameStore'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

const CONTRACT_CLICKS = 20 // taps to squeeze the universe down to a point
const COLLAPSE_MS = 800 // hold on the final point before the end-game modal
const MIN_SCALE = 0.015 // the ellipse never quite reaches 0 (the point remains)

/**
 * Era 19 widget: the whole universe as one vast ellipse. Each click contracts it
 * a notch; on the last one it snaps to a single central point, and after a beat the
 * end-game modal (rebirth) opens via the endgame store. Full width.
 */
export function SingularityWidget({ era }: { era: EraDef }): ReactElement {
  const { t } = useTranslation()
  const collapse = useEndgameStore((s) => s.collapse)
  const setProgress = useEndgameStore((s) => s.setProgress)
  const [clicks, setClicks] = useState(0)
  const sealed = useRef(false)
  const verb = t(era.verbKey as TranslationKey)

  const progress = clicks / CONTRACT_CLICKS
  const scale = Math.max(MIN_SCALE, 1 - progress)
  const reached = clicks >= CONTRACT_CLICKS

  const contract = () => {
    if (sealed.current) return
    useClickPulse.getState().pulse()
    const next = Math.min(CONTRACT_CLICKS, clicks + 1)
    setClicks(next)
    setProgress(next / CONTRACT_CLICKS) // drains the era-19 complexity gauge
    if (next >= CONTRACT_CLICKS) {
      sealed.current = true
      // The collapse is the renaissance: credit its Echo now, then open the modal
      // with the meta-upgrades owned so far (so this run's picks stay refundable).
      window.setTimeout(() => {
        const baseMeta = { ...useGameStore.getState().state.metaUpgrades }
        useGameStore.getState().gainEcho()
        collapse(baseMeta)
      }, COLLAPSE_MS)
    }
  }

  return (
    <div className="mt-2 flex w-full flex-col items-center gap-3">
      <div className="relative h-[58vh] w-full max-w-6xl">
        <svg
          viewBox="0 0 300 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            {/* Radial fill over the whole disc, brightest at the core and fading out. */}
            <radialGradient id="singularity-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.9" />
              <stop offset="50%" stopColor="var(--color-accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.08" />
            </radialGradient>
          </defs>
          <g
            style={{ transition: 'transform 0.45s cubic-bezier(0.5, 0, 0.75, 0)' }}
            transform={`translate(150 50) scale(${scale})`}
          >
            <ellipse cx="0" cy="0" rx="146" ry="46" fill="url(#singularity-core)" />
          </g>
          {/* The lone central point: faint at first, ablaze once everything has converged. */}
          <circle
            cx="150"
            cy="50"
            r={reached ? 5 : 2.5}
            fill="var(--color-fg)"
            opacity={0.5 + progress * 0.5}
            style={{ transition: 'r 0.4s ease, opacity 0.4s ease' }}
          />
        </svg>

        <button
          type="button"
          onClick={contract}
          aria-label={verb}
          className="absolute inset-0 h-full w-full rounded-xl transition select-none active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </div>

      <span className="text-base font-semibold text-fg">{verb}</span>
      <div
        className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={CONTRACT_CLICKS}
        aria-valuenow={clicks}
        aria-label={t('singularity.hint')}
      >
        <div
          className="h-full rounded-full bg-octarine transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="max-w-prose text-center text-sm text-muted">{t('singularity.hint')}</span>
    </div>
  )
}
