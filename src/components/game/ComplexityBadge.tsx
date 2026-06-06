import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { formatFixed } from '@/lib/format'

/** Badge mis en avant de la Complexité : l'objectif majeur du jeu (octarine). */
export function ComplexityBadge() {
  const { t } = useTranslation()
  const complexity = useGameStore((s) => s.state.complexity)

  return (
    <div className="complexity-glow flex items-center gap-2 rounded-full border border-octarine/40 bg-octarine/10 px-4 py-1.5">
      <Icon name="gem" className="h-5 w-5 shrink-0 text-octarine" />
      <div className="leading-tight">
        <div className="text-[10px] font-semibold tracking-wide text-muted uppercase">
          {t('app.complexity')}
        </div>
        <div className="text-lg font-bold tabular-nums text-octarine">
          {formatFixed(complexity)}
        </div>
      </div>
    </div>
  )
}
