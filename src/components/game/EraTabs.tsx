import { EraIcon } from '@/components/game/EraIcon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'

const TAB_BASE =
  'flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/**
 * Navigation entre ères DÉBLOQUÉES uniquement (cohabitation). Style de "chip"
 * distinct du bouton de verbe : l'onglet actif est un contour accent (non
 * cliquable), pas un bouton plein. Aucune ère future n'est affichée (anti-spoiler).
 */
export function EraTabs() {
  const { t } = useTranslation()
  const unlocked = useGameStore((s) => s.state.unlockedEras)
  const current = useGameStore((s) => s.state.currentEraId)
  const setEra = useGameStore((s) => s.setEra)
  const eras = useGameStore((s) => s.defs.eras)

  const visible = eras.filter((era) => unlocked.includes(era.id))
  if (visible.length <= 1) return null

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
          </button>
        )
      })}
    </nav>
  )
}
