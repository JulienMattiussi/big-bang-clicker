import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { readyCrises } from '@/lib/crises'
import type { TranslationKey } from '@/i18n/types'

/** Crisis banner: shows ready crises and lets the player overcome them. */
export function CrisisBanner() {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const resolveCrisis = useGameStore((s) => s.resolveCrisis)

  const ready = readyCrises(state, defs)
  if (ready.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {ready.map((id) => {
        const def = defs.crises[id]
        return (
          <div
            key={id}
            className="flex flex-col items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-center"
          >
            <div className="flex items-center gap-2 text-red-400">
              <Icon name="skull" className="h-5 w-5" />
              <span className="font-semibold">{t('crisis.title')}</span>
            </div>
            <p className="text-sm">{t(def.textKeys.triggerKey as TranslationKey)}</p>
            <p className="max-w-prose text-xs text-muted">
              {t(def.textKeys.reboundKey as TranslationKey)}
            </p>
            <Button onClick={() => resolveCrisis(id)}>{t('crisis.resolve')}</Button>
          </div>
        )
      })}
    </div>
  )
}
