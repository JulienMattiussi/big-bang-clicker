import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
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
 * Global inventory ("backpack"), themed as the Galactic Resource Guide: every
 * KNOWN resource across unlocked eras, in columns tinted by their era's tier,
 * with live quantities and a "!" when a resource is declining (red) or stalled
 * (yellow). Clicking a resource jumps to its production era. A page-turn button
 * flips the guide over to its cover, which simply reads "DON'T PANIC".
 */
export function InventoryModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const setEra = useGameStore((s) => s.setEra)
  const [flipped, setFlipped] = useState(false)

  const groups = knownResourcesByEra(state, defs)
  const declining = decliningResources(state, defs)
  const stalled = stalledResources(state, defs)

  const goTo = (eraId: string) => {
    setEra(eraId)
    onClose()
  }

  // Both faces share the same cell so the guide keeps one size as it turns.
  const face =
    'relative col-start-1 row-start-1 flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface text-fg shadow-xl [backface-visibility:hidden]'

  return (
    <Modal
      onClose={onClose}
      closeOnBackdrop
      labelledBy="inventory-title"
      className="modal-in h-full max-h-[92vh] w-full max-w-6xl perspective-[2200px]"
    >
      <div
        className={`grid h-full transition-transform duration-500 transform-3d ${
          flipped ? 'transform-[rotateY(180deg)]' : 'transform-[rotateY(0deg)]'
        }`}
      >
        {/* Front: the guide itself. */}
        <div className={face} aria-hidden={flipped}>
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
              to fill the space (a column is NOT one era). */}
          <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-16">
            <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
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
                      const def = defs.resources[id]!
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

          <FlipButton icon="arrow-down-right" label={t('guide.flip')} onClick={() => setFlipped(true)} />
        </div>

        {/* Back: the cover. */}
        <div
          className={`${face} items-center justify-center transform-[rotateY(180deg)]`}
          aria-hidden={!flipped}
        >
          <p className="px-6 text-center text-6xl font-black tracking-tight text-accent sm:text-8xl">
            {t('guide.dontPanic')}
          </p>
          <FlipButton icon="arrow-down-right" label={t('guide.flip')} onClick={() => setFlipped(false)} />
        </div>
      </div>
    </Modal>
  )
}

/** Page-turn button in the bottom-right corner of a guide face. */
function FlipButton({
  icon,
  label,
  onClick,
}: {
  icon: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="absolute right-3 bottom-3 z-10 flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:text-accent active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Icon name={icon} className="h-5 w-5" aria-hidden />
    </button>
  )
}
