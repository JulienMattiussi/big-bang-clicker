import { useEffect, useRef, useState } from 'react'
import { useCrisisStore } from '@/store/crisisStore'
import { useGameStore } from '@/store/gameStore'
import { useCrisisWin } from '@/hooks/useCrisisWin'
import { useTranslation } from '@/i18n/useTranslation'
import { CrisisScene } from '@/components/art/CrisisScene'
import { crisisGaletForEra } from '@/lib/galets'
import { announceGalet } from '@/hooks/useGalets'
import type { TranslationKey } from '@/i18n/types'

// The bar resists: it drains on its own, so surviving means clicking faster than
// it slips back. Tuned so a steady mash (~5+/s) gains ground, idling loses it.
const STEP_MS = 100
const DECAY_PER_STEP = 0.018
const CLICK_GAIN = 0.045

/**
 * Shared survival mini-game for the era-14 crises (the "era of crises" stacks
 * five of them, so they all resolve the same simple way rather than each owning a
 * bespoke game): mash the button to push the "survive" bar to the far end against
 * its natural decay. Filling it resolves the crisis and queues its rebound modal.
 */
export function SurviveGame() {
  const { t } = useTranslation()
  const fighting = useCrisisStore((s) => s.fighting)
  const resetInventions = useGameStore((s) => s.resetInventions)
  const defs = useGameStore((s) => s.defs)
  const win = useCrisisWin()
  // Fresh per fight: the game unmounts when a crisis resolves (the banner takes
  // over), so a new crisis remounts it with a clean bar.
  const [progress, setProgress] = useState(0)
  const won = useRef(false)

  // Natural decay: the bar slips back while the player is not clicking.
  useEffect(() => {
    const handle = setInterval(() => {
      setProgress((p) => (won.current ? p : Math.max(0, p - DECAY_PER_STEP)))
    }, STEP_MS)
    return () => clearInterval(handle)
  }, [])

  const def = fighting ? defs.crises[fighting] : undefined

  const tap = () => {
    if (won.current) return
    const next = Math.min(1, progress + CLICK_GAIN)
    setProgress(next)
    if (next < 1) return
    won.current = true
    win()
    resetInventions() // the invention discovery restarts from the first one
    if (def) {
      // Some crises hand out a pebble for overcoming them (e.g. the Force pebble
      // from the era-16 encounter); its discovery popup follows the rebound one.
      const galet = crisisGaletForEra(defs, def.eraId)
      if (galet && !useGameStore.getState().state.galets[galet.id]?.found) announceGalet(galet)
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <CrisisScene id={fighting ?? ''} className="h-24 w-auto" />
      {def ? (
        <p className="max-w-prose text-center text-base font-semibold text-red-400">
          {t(def.textKeys.triggerKey as TranslationKey)}
        </p>
      ) : null}
      <span className="text-sm text-muted">{t('crisisGame.survive.hint')}</span>
      <button
        type="button"
        onClick={tap}
        aria-label={t('crisisGame.survive.label')}
        className="relative h-16 w-full max-w-5xl overflow-hidden rounded-xl border border-red-500/50 bg-surface transition select-none active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div
          className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-75"
          style={{ width: `${progress * 100}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        />
        <span className="relative flex h-full items-center justify-center text-lg font-bold tracking-[0.2em] text-fg uppercase">
          {t('crisisGame.survive.label')}
        </span>
      </button>
    </div>
  )
}
