import { IconBadge } from '@/components/ui/IconBadge'
import { Button } from '@/components/ui/Button'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { formatFixed, formatNumber } from '@/lib/format'

/**
 * Progress toward the next milestone (unlocking the next era). Anti-spoiler:
 * shows the threshold to reach, never what it unlocks.
 * - Complexity milestone: always shown (central objective, in octarine).
 * - Resource milestone: shown once the resource is discovered (produced).
 */
export function NextGoal() {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const unlockNextEra = useGameStore((s) => s.unlockNextEra)

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

  // Resource milestone: nothing until the resource is discovered.
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
        aria-valuetext={`${formatFixed(current)} / ${formatNumber(target)}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-border"
      >
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {current >= target ? (
        <Button className="mt-1 w-full text-center" onClick={() => unlockNextEra()}>
          {t('app.unlock')}
        </Button>
      ) : null}
    </div>
  )
}
