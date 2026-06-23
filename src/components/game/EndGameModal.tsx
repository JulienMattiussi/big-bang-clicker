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
      className="complexity-glow modal-in w-full max-w-2xl rounded-xl border border-octarine/50 bg-surface p-7 text-fg shadow-xl"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-octarine uppercase">
          <span aria-hidden>✦</span>
          {t('prestige.title')}
          <span aria-hidden>✦</span>
        </span>
        <h2 id="endgame-title" className="text-3xl font-bold">
          {t('endgame.title')}
        </h2>
        <p className="max-w-prose leading-relaxed text-muted">{t('endgame.body')}</p>
        <p className="mt-1 flex items-center gap-2 text-lg">
          <span>{t('endgame.echoes')}</span>
          <span className="font-bold tabular-nums text-octarine">+{formatNumber(gain)}</span>
          <Icon name="echo" className="h-5 w-5 text-octarine" aria-hidden />
        </p>
      </div>

      {/* Read-only legend: deliberately borderless/flat so it never reads as a
          clickable tile (the meta cards below carry the border + hover affordance). */}
      <div className="mt-5 grid gap-x-6 gap-y-3 rounded-lg bg-bg/30 px-4 py-3 text-left text-sm sm:grid-cols-2">
        <div>
          <span className="text-xs font-semibold tracking-wide text-orange-400 uppercase">
            {t('endgame.resets.label')}
          </span>
          <p className="mt-0.5 leading-snug text-muted">{t('endgame.resets.list')}</p>
        </div>
        <div className="sm:border-l sm:border-border/60 sm:pl-6">
          <span className="text-xs font-semibold tracking-wide text-octarine uppercase">
            {t('endgame.keeps.label')}
          </span>
          <p className="mt-0.5 leading-snug text-fg/80">{t('endgame.keeps.list')}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <div id="endgame-meta-title" className="text-xs font-semibold tracking-wide text-muted uppercase">
          {t('meta.title')}
        </div>
        <div role="radiogroup" aria-labelledby="endgame-meta-title" className="grid gap-3 sm:grid-cols-2">
          {defs.metaUpgrades.map((meta) => {
            const ownedBefore = !!baseMeta[meta.id] // locked in from past rebirths
            const picked = !!state.metaUpgrades[meta.id] && !ownedBefore // chosen this run
            // Pickable if affordable outright, or by swapping off the current pick.
            const selectable = state.echoes >= meta.echoCost || pickedThisRun
            return (
              <button
                key={meta.id}
                type="button"
                role="radio"
                aria-checked={picked}
                aria-label={t(meta.nameKey as TranslationKey)}
                disabled={ownedBefore || (!selectable && !picked)}
                onClick={() => pick(meta.id)}
                className={`flex flex-col gap-1.5 rounded-lg border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  ownedBefore
                    ? 'cursor-default border-border bg-bg/30 opacity-60'
                    : picked
                      ? 'border-octarine bg-octarine/10 ring-1 ring-octarine/40'
                      : 'border-border bg-bg/40 hover:border-octarine/50 disabled:cursor-not-allowed disabled:opacity-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="leading-tight font-semibold">
                    {t(meta.nameKey as TranslationKey)}
                  </span>
                  <span className="flex h-5 shrink-0 items-center gap-1 text-xs font-semibold tracking-wide tabular-nums">
                    {ownedBefore ? (
                      <span className="text-muted uppercase">{t('meta.owned')}</span>
                    ) : picked ? (
                      <span className="flex items-center gap-1 text-octarine uppercase">
                        <span aria-hidden>✓</span>
                        {t('meta.chosen')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-octarine">
                        {meta.echoCost}
                        <Icon name="echo" className="h-3 w-3" aria-hidden />
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-xs leading-snug text-muted">
                  {t(meta.descKey as TranslationKey)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button autoFocus onClick={rebirth} disabled={mustSpend}>
          {t('endgame.button')}
        </Button>
      </div>
    </Modal>
  )
}
