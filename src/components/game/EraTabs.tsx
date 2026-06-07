import { EraIcon } from '@/components/game/EraIcon'
import { AlertBadge } from '@/components/ui/AlertBadge'
import { useGameStore } from '@/store/gameStore'
import { decliningResources, stalledResources } from '@/lib/graph'
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

  // A tab flags when one of its era's resources is shrinking (red) or its
  // production is stalled at zero (yellow).
  const declining = decliningResources(state, defs)
  const stalled = stalledResources(state, defs)

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
                : 'border-border bg-bg text-muted hover:bg-surface hover:text-fg'
            }`}
          >
            <EraIcon icon={era.icon} className="h-4 w-4" />
            {t(era.nameKey as TranslationKey)}
            {/* Notification badge overlapping the whole tab's corner:
                red for a declining resource, yellow for a production stalled at zero. */}
            {era.resources.some((r) => declining.has(r)) ? (
              <AlertBadge kind="decline" labelKey="alert.eraDeclining" size="md" />
            ) : era.resources.some((r) => stalled.has(r)) ? (
              <AlertBadge kind="stall" labelKey="alert.eraStalled" size="md" />
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
