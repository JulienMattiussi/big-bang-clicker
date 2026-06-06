import { IconBadge } from '@/components/ui/IconBadge'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { formatFixed, formatNumber } from '@/lib/format'

/**
 * Progression vers le prochain palier (déblocage de l'ère suivante). Anti-spoiler :
 * on montre le seuil à atteindre, jamais ce qu'il débloque.
 * - Palier en Complexité : toujours affiché (objectif central, en octarine).
 * - Palier en ressource : affiché une fois la ressource découverte (produite).
 */
export function NextGoal() {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)

  const next = defs.eras.find(
    (era) =>
      !state.unlockedEras.includes(era.id) &&
      (era.unlock.resource !== undefined || era.unlock.complexity !== undefined),
  )
  if (!next) return null

  const byComplexity = next.unlock.complexity !== undefined
  const resourceId = next.unlock.resource

  const current = byComplexity ? state.complexity : (state.resources[resourceId ?? ''] ?? 0)
  const target = byComplexity ? (next.unlock.complexity ?? 0) : (next.unlock.amount ?? 0)
  if (target <= 0) return null

  // Palier ressource : rien tant que la ressource n'est pas découverte.
  if (!byComplexity && current <= 0) return null

  const icon = byComplexity ? 'gem' : resourceId ? defs.resources[resourceId].icon : 'gem'
  const kind = byComplexity ? 'complexity' : 'resource'
  const barColor = byComplexity ? 'bg-octarine' : 'bg-accent'
  const pct = Math.min(100, (current / target) * 100)

  return (
    <div className="flex w-48 flex-col gap-1">
      <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">
        {t('app.nextGoal')}
      </span>
      <div className="flex items-center gap-2">
        <IconBadge icon={icon} kind={kind} />
        <span className="flex-1 text-right text-xs tabular-nums text-muted">
          {formatFixed(current)} / {formatNumber(target)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t('app.nextGoal')}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.floor(current)}
        className="h-1.5 w-full overflow-hidden rounded-full bg-border"
      >
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
