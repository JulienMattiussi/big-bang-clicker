import { IconBadge } from '@/components/ui/IconBadge'
import { useTranslation } from '@/i18n/useTranslation'
import { formatFixed, formatNumber } from '@/lib/format'
import { useMilestone } from '@/hooks/useMilestone'

/**
 * Progress gauge toward the next milestone (unlocking the next era). The unlock
 * action itself is the separate MilestoneButton. Anti-spoiler: shows the
 * threshold to reach, never what it unlocks.
 */
export function NextGoal() {
  const { t } = useTranslation()
  const m = useMilestone()
  if (!m) return null

  return (
    <div className="flex w-48 flex-col gap-1">
      <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">
        {t('app.nextGoal')}
      </span>
      <div className="flex items-center gap-2">
        <IconBadge icon={m.icon} kind={m.kind} />
        {/* Extra precision on the current value: a near-but-not-reached milestone
            must read as "almost" (e.g. 2.48M), not as a misleading "2.5M / 2.5M"
            while ~50k of Complexity are still being ground out. */}
        <span className="flex-1 text-right text-xs tabular-nums text-muted">
          {formatFixed(m.current, 2)} / {formatNumber(m.target)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t('app.nextGoal')}
        aria-valuemin={0}
        aria-valuemax={m.target}
        aria-valuenow={Math.floor(m.current)}
        aria-valuetext={`${formatFixed(m.current, 2)} / ${formatNumber(m.target)}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-border"
      >
        {/* Keep a sliver unfilled until it is actually crossable: a visually full
            bar must mean the unlock button is there. */}
        <div
          className={`h-full rounded-full ${m.barColor}`}
          style={{ width: `${m.ready ? 100 : Math.min(99, m.pct)}%` }}
        />
      </div>
    </div>
  )
}
