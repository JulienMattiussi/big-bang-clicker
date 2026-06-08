import type { KeyboardEvent } from 'react'
import { Icon } from '@/components/ui/Icon'
import { IconBadge } from '@/components/ui/IconBadge'
import { AlertBadge } from '@/components/ui/AlertBadge'
import { EraIcon } from '@/components/game/EraIcon'
import { useGameStore } from '@/store/gameStore'
import { knownResourcesByEra } from '@/lib/inventory'
import { decliningResources, stalledResources } from '@/lib/graph'
import { formatFixed } from '@/lib/format'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'

/**
 * Global inventory ("backpack"): every KNOWN resource across unlocked eras, in
 * columns tinted by their era's tier, with live quantities and a "!" when a
 * resource is declining (red) or stalled at zero (yellow). Clicking a resource
 * jumps to its production era and closes the modal.
 */
export function InventoryModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const setEra = useGameStore((s) => s.setEra)

  const groups = knownResourcesByEra(state, defs)
  const declining = decliningResources(state, defs)
  const stalled = stalledResources(state, defs)

  const goTo = (eraId: string) => {
    setEra(eraId)
    onClose()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onKeyDown={onKeyDown}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-title"
        className="modal-in flex h-full max-h-[92vh] w-full max-w-3xl flex-col rounded-lg border border-border bg-surface text-fg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Icon name="backpack" className="h-6 w-6 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 id="inventory-title" className="text-lg font-bold">
              {t('inventory.title')}
            </h2>
            <p className="text-xs text-muted">{t('inventory.hint')}</p>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label={t('inventory.close')}
            className="rounded-md p-1.5 text-muted transition hover:bg-bg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="close" className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Masonry: era blocks flow into several columns and stack within each
            to fill the space (a column is NOT one era). Full available height. */}
        <div className="overflow-y-auto p-5">
          <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
            {groups.map(({ era, resources }) => (
              <section
                key={era.id}
                data-tier={era.uiTier}
                className="mb-3 break-inside-avoid rounded-lg border border-accent/30 bg-bg/40"
              >
                <header className="flex items-center gap-2 border-b border-accent/20 px-3 py-2">
                  <EraIcon icon={era.icon} className="h-5 w-5 shrink-0" />
                  <span className="truncate text-sm font-semibold text-accent">
                    {t(era.nameKey as TranslationKey)}
                  </span>
                </header>
                <ul className="flex flex-col gap-1 p-2">
                  {resources.map((id) => {
                    const def = defs.resources[id]
                    const amount = state.resources[id] ?? 0
                    const isDeclining = declining.has(id)
                    const isStalled = stalled.has(id)
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => goTo(era.id)}
                          title={t('inventory.goto')}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                        >
                          <span
                            className="relative inline-flex shrink-0"
                            title={
                              isDeclining
                                ? t('alert.declining')
                                : isStalled
                                  ? t('alert.stalled')
                                  : undefined
                            }
                          >
                            <IconBadge icon={def.icon} symbol={def.symbol} kind="resource" />
                            {isDeclining ? (
                              <AlertBadge kind="decline" labelKey="alert.declining" />
                            ) : isStalled ? (
                              <AlertBadge kind="stall" labelKey="alert.stalled" />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {t(def.nameKey as TranslationKey)}
                          </span>
                          <span className="shrink-0 text-sm tabular-nums text-muted">
                            {formatFixed(amount)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
