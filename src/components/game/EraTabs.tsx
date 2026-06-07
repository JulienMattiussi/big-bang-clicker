import { EraIcon } from '@/components/game/EraIcon'
import { useGameStore } from '@/store/gameStore'
import { decliningResources } from '@/lib/graph'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'

const TAB_BASE =
  'relative flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/**
 * Navigation across UNLOCKED eras only (cohabitation). "Chip" style distinct
 * from the verb button: the active tab is an accent outline (non-clickable),
 * not a filled button. No future era is shown (anti-spoiler).
 */
export function EraTabs() {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const current = state.currentEraId
  const setEra = useGameStore((s) => s.setEra)

  const visible = defs.eras.filter((era) => state.unlockedEras.includes(era.id))
  if (visible.length <= 1) return null

  // A tab flags when one of its era's resources is shrinking (supply issue).
  const declining = decliningResources(state, defs)

  return (
    <nav aria-label={t('nav.eras')} className="flex flex-wrap gap-2">
      {visible.map((era) => {
        const active = era.id === current
        return (
          <button
            key={era.id}
            type="button"
            disabled={active}
            aria-current={active ? 'true' : undefined}
            onClick={() => setEra(era.id)}
            className={`${TAB_BASE} ${
              active
                ? 'cursor-default border-accent bg-surface text-accent'
                : 'border-border text-muted hover:bg-surface hover:text-fg'
            }`}
          >
            <EraIcon icon={era.icon} className="h-4 w-4" />
            {t(era.nameKey as TranslationKey)}
            {/* Notification badge overlapping the whole tab's corner (not inside). */}
            {era.resources.some((r) => declining.has(r)) ? (
              <span
                title={t('alert.eraDeclining')}
                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs leading-none font-bold text-white shadow"
              >
                <span aria-hidden>!</span>
                <span className="sr-only">{t('alert.eraDeclining')}</span>
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
