import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { isCrisisReady } from '@/lib/crises'
import type { TranslationKey } from '@/i18n/types'

/**
 * Marks a resource hit by a crisis: once the crisis is triggered, a danger icon
 * (skull) with a summary of what is collapsing; once overcome, it turns into a
 * rebirth icon (sparkles) summarising the new, improved situation. Nothing shows
 * while the crisis is still only a building risk.
 */
export function ResourceCrisisBadge({ resourceId }: { resourceId: string }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)

  // The marker shows on any resource the crisis hits: its risk source, or a
  // target of its regression / rebound effects (e.g. flora alongside fauna).
  const id = Object.keys(defs.crises).find((cid) => {
    const c = defs.crises[cid]
    return (
      c.risk.sourceResource === resourceId ||
      c.regression.some((e) => e.target === resourceId) ||
      c.rebound.some((e) => e.target === resourceId)
    )
  })
  if (!id) return null
  const runtime = state.crises[id]
  if (!runtime) return null

  const def = defs.crises[id]
  const resolved = runtime.resolved
  const active = !resolved && isCrisisReady(state, defs, id)
  if (!resolved && !active) return null

  // Spell out the concrete effects on THIS resource, in plain language.
  const stockCut = def.regression.find((e) => e.target === resourceId && e.type === 'resetResource')?.value
  const boost = def.rebound.find((e) => e.target === resourceId && e.type === 'multiplier')?.value
  const loss = stockCut != null ? Math.round((1 - stockCut) * 100) : null
  const resName = t(defs.resources[resourceId]?.nameKey as TranslationKey)

  let tip: string
  if (resolved) {
    // Simple, upbeat: the crisis is over and life thrives.
    tip = t('crisis.effect.recovered').replace('{mult}', String(boost ?? 1))
  } else {
    // While the crisis rages: the dramatic line plus the concrete loss.
    const narrative = t(def.textKeys.triggerKey as TranslationKey)
    tip =
      loss != null
        ? `${narrative} ${t('crisis.effect.struck').replace('{pct}', String(loss)).replace('{res}', resName)}`
        : narrative
  }
  return (
    <span title={tip} className={`inline-flex shrink-0 ${resolved ? 'text-accent' : 'text-red-400'}`}>
      <Icon name={resolved ? 'sparkles' : 'skull'} className="h-5 w-5" aria-hidden />
      <span className="sr-only">{tip}</span>
    </span>
  )
}
