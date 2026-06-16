import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { canPrestige, echoesGain } from '@/lib/prestige'
import { canBuyMeta } from '@/lib/meta'
import { formatNumber } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'

/**
 * Prestige banner (new Big Bang). Shown once the final era is reached. Converts
 * total Complexity into permanent Echoes, and lets the player spend Echoes on
 * meta-upgrades.
 */
export function PrestigeBanner() {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const prestige = useGameStore((s) => s.prestige)
  const buyMetaUpgrade = useGameStore((s) => s.buyMetaUpgrade)

  if (!state.unlockedEras.includes('e18')) return null

  const gain = echoesGain(state)

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-octarine/40 bg-octarine/10 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-octarine">
          <Icon name="gem" className="h-5 w-5" />
          <span className="font-semibold">{t('prestige.title')}</span>
        </div>
        <p className="max-w-prose text-sm text-muted">{t('prestige.desc')}</p>
        <p className="text-sm">
          {t('prestige.gain')} :{' '}
          <span className="font-bold tabular-nums text-octarine">{formatNumber(gain)}</span>
        </p>
        <Button onClick={() => prestige()} disabled={!canPrestige(state)}>
          {t('prestige.button')}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-muted uppercase">
          <span>{t('meta.title')}</span>
          <span>
            {t('meta.echoes')} :{' '}
            <span className="tabular-nums text-octarine">{formatNumber(state.echoes)}</span>
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {defs.metaUpgrades.map((meta) => {
            const owned = !!state.metaUpgrades[meta.id]
            return (
              <li
                key={meta.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg/40 p-2"
              >
                <span className="min-w-0">
                  <span className="block leading-tight">{t(meta.nameKey as TranslationKey)}</span>
                  <span className="text-xs text-muted">{t(meta.descKey as TranslationKey)}</span>
                </span>
                <Button
                  variant="ghost"
                  className="whitespace-nowrap"
                  disabled={!canBuyMeta(state, defs, meta.id)}
                  onClick={() => buyMetaUpgrade(meta.id)}
                >
                  {owned
                    ? t('meta.owned')
                    : `${t('ui.buy')} (${formatNumber(meta.echoCost)} ${t('meta.echoes')})`}
                </Button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
