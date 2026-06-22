import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { useGameStore } from '@/store/gameStore'
import { useEndgameStore } from '@/store/endgameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { echoesGain } from '@/lib/prestige'
import { canBuyMeta } from '@/lib/meta'
import { formatNumber } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'

/**
 * End-game / rebirth modal (new Big Bang): opens once the era-19 singularity has
 * been contracted to a point. Announces the Echoes earned, lets the player spend
 * existing Echoes on meta-upgrades, then "Rebirth" performs the prestige reset
 * back to era 1.
 */
export function EndGameModal() {
  const { t } = useTranslation()
  const collapsed = useEndgameStore((s) => s.collapsed)
  const reset = useEndgameStore((s) => s.reset)
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const prestige = useGameStore((s) => s.prestige)
  const buyMetaUpgrade = useGameStore((s) => s.buyMetaUpgrade)

  if (!collapsed) return null

  const gain = echoesGain(state)
  const rebirth = () => {
    prestige()
    reset()
  }

  return (
    <Modal
      labelledBy="endgame-title"
      onClose={rebirth}
      className="complexity-glow modal-in w-full max-w-md rounded-lg border border-octarine/50 bg-surface p-6 text-fg shadow-xl"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-octarine uppercase">
          <span aria-hidden>✦</span>
          {t('prestige.title')}
          <span aria-hidden>✦</span>
        </span>
        <h2 id="endgame-title" className="text-2xl font-bold">
          {t('endgame.title')}
        </h2>
        <p className="max-w-prose leading-relaxed text-muted">{t('endgame.body')}</p>
        <p className="mt-1 flex items-center gap-2 text-lg">
          <span>{t('endgame.echoes')}</span>
          <span className="font-bold tabular-nums text-octarine">+{formatNumber(gain)}</span>
          <Icon name="gem" className="h-5 w-5 text-octarine" aria-hidden />
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
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
                <span className="min-w-0 text-left">
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

      <div className="mt-5 flex justify-center">
        <Button autoFocus onClick={rebirth}>
          {t('endgame.button')}
        </Button>
      </div>
    </Modal>
  )
}
