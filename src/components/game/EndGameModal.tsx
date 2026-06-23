import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { useGameStore } from '@/store/gameStore'
import { useEndgameStore } from '@/store/endgameStore'
import { useRebirthStore } from '@/store/rebirthStore'
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
  const baseMeta = useEndgameStore((s) => s.baseMeta)
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const prestige = useGameStore((s) => s.prestige)
  const buyMetaUpgrade = useGameStore((s) => s.buyMetaUpgrade)
  const refundMetaUpgrade = useGameStore((s) => s.refundMetaUpgrade)

  if (!collapsed) return null

  const gain = echoesGain()
  // Radio pick: the upgrades chosen THIS renaissance (refundable), and whether any
  // is still affordable. The earned Echo must be assigned before rebirthing.
  const pickedThisRun = defs.metaUpgrades.some((m) => state.metaUpgrades[m.id] && !baseMeta[m.id])
  const canPickAny = defs.metaUpgrades.some((m) => canBuyMeta(state, defs, m.id))
  const mustSpend = canPickAny && !pickedThisRun
  // Choosing one refunds any other pick made this renaissance, then buys it.
  const pick = (id: string) => {
    defs.metaUpgrades.forEach((m) => {
      if (m.id !== id && state.metaUpgrades[m.id] && !baseMeta[m.id]) refundMetaUpgrade(m.id)
    })
    if (!state.metaUpgrades[id]) buyMetaUpgrade(id)
  }
  const rebirth = () => {
    if (mustSpend) return
    const firstRebirth = state.rebirths === 0
    prestige()
    reset()
    // First rebirth: land the new log button in the header (FLIP intro), but only
    // after the reset has re-laid the header (Complexity drops to 0, shifting the
    // badge) so the button is measured at its final spot, not a transient one.
    if (firstRebirth) requestAnimationFrame(() => useRebirthStore.getState().flash())
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
          <Icon name="echo" className="h-5 w-5 text-octarine" aria-hidden />
        </p>
      </div>

      {/* Spells out the irreversible reset so the player knows what is lost vs kept. */}
      <div className="mt-4 w-full rounded-md border border-border bg-bg/40 p-3 text-left text-sm">
        <p className="flex gap-2">
          <span className="shrink-0 font-semibold text-fg">{t('endgame.resets.label')}</span>
          <span className="text-muted">{t('endgame.resets.list')}</span>
        </p>
        <p className="mt-1.5 flex gap-2">
          <span className="shrink-0 font-semibold text-octarine">{t('endgame.keeps.label')}</span>
          <span className="text-muted">{t('endgame.keeps.list')}</span>
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="text-xs font-semibold tracking-wide text-muted uppercase">
          {t('meta.title')}
        </div>
        <ul className="flex flex-col gap-2">
          {defs.metaUpgrades.map((meta) => {
            const ownedBefore = !!baseMeta[meta.id] // locked in from past rebirths
            const picked = !!state.metaUpgrades[meta.id] && !ownedBefore // chosen this run
            // Pickable if affordable outright, or by swapping off the current pick.
            const selectable = state.echoes >= meta.echoCost || pickedThisRun
            return (
              <li
                key={meta.id}
                className={`flex items-center justify-between gap-3 rounded-md border bg-bg/40 p-2 ${
                  picked ? 'border-octarine/60' : 'border-border'
                }`}
              >
                <span className="min-w-0 text-left">
                  <span className="block leading-tight">{t(meta.nameKey as TranslationKey)}</span>
                  <span className="text-xs text-muted">{t(meta.descKey as TranslationKey)}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {/* Fixed-height cost line, always reserved so every tile matches. */}
                  <span className="flex h-4 items-center gap-1 text-xs tabular-nums text-octarine">
                    {ownedBefore || picked ? null : (
                      <>
                        {meta.echoCost}
                        <Icon name="echo" className="h-3 w-3" aria-hidden />
                      </>
                    )}
                  </span>
                  {ownedBefore ? (
                    <Button variant="ghost" className="whitespace-nowrap" disabled>
                      {t('meta.owned')}
                    </Button>
                  ) : picked ? (
                    <Button variant="ghost" className="whitespace-nowrap text-octarine" disabled>
                      {t('meta.chosen')}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="whitespace-nowrap"
                      disabled={!selectable}
                      onClick={() => pick(meta.id)}
                    >
                      {t('meta.choose')}
                    </Button>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-5 flex justify-center">
        <Button autoFocus onClick={rebirth} disabled={mustSpend}>
          {t('endgame.button')}
        </Button>
      </div>
    </Modal>
  )
}
