import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { CrisisScene } from '@/components/game/CrisisScene'
import { useGameStore } from '@/store/gameStore'
import { useCrisisStore, CRISIS_GAMES } from '@/store/crisisStore'
import { useTranslation } from '@/i18n/useTranslation'
import { readyCrises } from '@/lib/crises'
import type { TranslationKey } from '@/i18n/types'

/** Crisis banner: announces ready crises and lets the player confront them. */
export function CrisisBanner() {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const resolveCrisis = useGameStore((s) => s.resolveCrisis)
  const startFight = useCrisisStore((s) => s.start)

  // Only the crisis(es) belonging to the era currently shown (a crisis stays
  // localised to its era).
  const ready = readyCrises(state, defs).filter((id) => defs.crises[id].eraId === state.currentEraId)
  if (ready.length === 0) return null

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {ready.map((id) => {
        const def = defs.crises[id]
        return (
          <div
            key={id}
            className="crisis-card modal-in flex w-full max-w-lg flex-col items-center gap-3 rounded-xl border border-red-500/50 bg-red-500/10 p-6 text-center"
          >
            {/* Big symbolic illustration (meteor impact for the mass extinction). */}
            <CrisisScene id={id} className="h-28 w-auto" />
            <div className="flex items-center gap-2 text-red-400">
              <Icon name="skull" className="h-5 w-5" />
              <span className="text-lg font-bold tracking-[0.2em] uppercase">
                {t('crisis.title')}
              </span>
            </div>
            <p className="max-w-prose text-base font-semibold">
              {t(def.textKeys.triggerKey as TranslationKey)}
            </p>
            {/* A crisis with a survival mini-game is confronted (launches the
                widget); the outcome reveals only once won. Others resolve directly. */}
            {CRISIS_GAMES.has(id) ? (
              <Button onClick={() => startFight(id)}>{t('crisis.confront')}</Button>
            ) : (
              <Button onClick={() => resolveCrisis(id)}>{t('crisis.resolve')}</Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
