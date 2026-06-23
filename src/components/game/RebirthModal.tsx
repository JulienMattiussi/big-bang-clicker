import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'

/**
 * Renaissances log: how many Big Bangs the player has gone through, and the
 * Echoes spent so far (each owned meta-upgrade is one consumed Echo). Read-only
 * recap opened from the header button.
 */
export function RebirthModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const consumed = defs.metaUpgrades.filter((m) => state.metaUpgrades[m.id]).length

  return (
    <Modal
      labelledBy="rebirth-title"
      onClose={onClose}
      closeOnBackdrop
      className="complexity-glow modal-in w-full max-w-md rounded-lg border border-octarine/50 bg-surface p-6 text-fg shadow-xl"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-octarine uppercase">
          <span aria-hidden>✦</span>
          {t('prestige.title')}
          <span aria-hidden>✦</span>
        </span>
        <h2 id="rebirth-title" className="text-2xl font-bold">
          {t('rebirth.title')}
        </h2>
        <p className="text-3xl font-bold tabular-nums text-octarine">{state.rebirths}</p>
        <p className="text-sm text-muted">{t('rebirth.count')}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm">
          {t('rebirth.consumed')}
          <span className="font-bold tabular-nums text-octarine">{consumed}</span>
          <Icon name="echo" className="h-4 w-4 text-octarine" aria-hidden />
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {defs.metaUpgrades.map((m) => {
          const has = !!state.metaUpgrades[m.id]
          return (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg/40 p-2"
            >
              <span className="min-w-0 text-left">
                <span className="block leading-tight">{t(m.nameKey as TranslationKey)}</span>
                <span className="text-xs text-muted">{t(m.descKey as TranslationKey)}</span>
              </span>
              <span className={`shrink-0 text-xs ${has ? 'text-octarine' : 'text-muted'}`}>
                {has ? t('meta.owned') : '—'}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-5 flex justify-center">
        <Button autoFocus onClick={onClose}>
          {t('event.continue')}
        </Button>
      </div>
    </Modal>
  )
}
