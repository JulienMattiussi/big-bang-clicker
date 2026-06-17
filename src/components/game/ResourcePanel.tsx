import { Panel } from '@/components/ui/Panel'
import { IconBadge } from '@/components/ui/IconBadge'
import { Icon } from '@/components/ui/Icon'
import { AlertBadge } from '@/components/ui/AlertBadge'
import { MemoryBadge } from '@/components/game/memory/MemoryBadge'
import { ResourceCrisisBadge } from '@/components/game/ResourceCrisisBadge'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { decliningResources, netFlows, stalledResources } from '@/lib/graph'
import { revealedMachines, revealedResources } from '@/lib/reveal'
import { COMPLEXITY_ERA_DECAY, complexityPerUnit } from '@/lib/engine'
import { FloaterLayer } from '@/components/ui/FloaterLayer'
import { formatFixed, formatNumber } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

/** Lists the active era's resources: icon, name, amount + net flow. */
export function ResourcePanel({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const flows = netFlows(state, defs)
  const declining = decliningResources(state, defs)
  const stalled = stalledResources(state, defs)
  const revealed = revealedResources(state, defs, era)
  // Memory mini-game boosts this era's main resource: completions -> ×2^n.
  const memoryBoost = state.memoryLevels?.[era.id] ?? 0
  // Idea-constellation bonus doubles this era's Complexity per cleared 10-sequence.
  const complexityBoost = 2 ** (state.complexityBoosts?.[era.id] ?? 0)

  const eraIndex = (eraId: string) => Number(eraId.slice(1)) || 0
  const latestIndex = state.unlockedEras.reduce((max, id) => Math.max(max, eraIndex(id)), 0)

  // Machines that consume a resource (so the player knows where it goes) -
  // only the ones already revealed, never a machine from a not-yet-reached era.
  const consumedBy = (id: string) => {
    const names = Object.values(defs.converters)
      .filter((c) => {
        if (!c.inputs.some((i) => i.resource === id)) return false
        const owner = defs.eras.find((e) => e.id === c.eraId)
        return (
          !!owner &&
          state.unlockedEras.includes(c.eraId) &&
          revealedMachines(state, defs, owner).has(c.id)
        )
      })
      .map((c) => t(c.nameKey as TranslationKey))
    return names.length ? `${t('machine.consumedBy')} : ${names.join(', ')}` : undefined
  }

  // Resources that produce Complexity (outputs of a recipe), with the per-unit
  // contribution and the era-decay "debuff" applied to older eras.
  const producesComplexity = (id: string) =>
    Object.values(defs.converters).some((c) => c.outputs.some((o) => o.resource === id))

  // Teaser: the era still has a key (Complexity-producing) resource left to
  // discover -> hint at it without spoiling what it is.
  const hasHiddenKey = era.resources.some((id) => !revealed.has(id) && producesComplexity(id))
  const complexityTip = (id: string) => {
    const def = defs.resources[id]
    const gap = latestIndex - eraIndex(def.eraId)
    // Value from the engine's single source, so the tooltip never drifts from
    // what is actually credited.
    const perUnit = `${t('complexity.source')} : +${formatFixed(complexityPerUnit(state, defs, id, latestIndex))}/u`
    return gap > 0
      ? `${perUnit} (${t('complexity.reduced')} ÷${formatNumber(COMPLEXITY_ERA_DECAY ** gap)})`
      : perUnit
  }

  return (
    <Panel title={t(era.stockKey as TranslationKey)}>
      <ul className="flex flex-col gap-3 py-1">
        {era.resources
          .filter((id) => revealed.has(id))
          .map((id) => {
            const def = defs.resources[id]
            const amount = state.resources[id] ?? 0
            const flow = flows[id] ?? 0
            const sign = flow >= 0 ? '+' : ''
            const consumers = consumedBy(id)
            return (
              <li
                key={id}
                title={consumers}
                className="relative flex items-center justify-between gap-3 py-1"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {/* Notification badge overlapping the icon's corner: red when
                      the resource is declining (consumed faster than produced),
                      yellow when its production is stalled at zero (starved). */}
                  <span
                    className="relative inline-flex shrink-0"
                    title={
                      declining.has(id)
                        ? t('alert.declining')
                        : stalled.has(id)
                          ? t('alert.stalled')
                          : undefined
                    }
                  >
                    <IconBadge icon={def.icon} symbol={def.symbol} kind="resource" />
                    {declining.has(id) ? (
                      <AlertBadge kind="decline" labelKey="alert.declining" />
                    ) : stalled.has(id) ? (
                      <AlertBadge kind="stall" labelKey="alert.stalled" />
                    ) : null}
                  </span>
                  <span className="truncate">{t(def.nameKey as TranslationKey)}</span>
                  {producesComplexity(id) ? (
                    <span
                      title={complexityTip(id)}
                      className="inline-flex shrink-0 items-center gap-0.5 text-octarine"
                    >
                      {complexityBoost > 1 ? (
                        <span className="text-xs font-bold tabular-nums">×{complexityBoost}</span>
                      ) : null}
                      <Icon name="gem" className="h-5 w-5" aria-hidden />
                      <span className="sr-only">{complexityTip(id)}</span>
                    </span>
                  ) : null}
                  {id === era.clickResource && memoryBoost > 0 ? (
                    <MemoryBadge factor={2 ** memoryBoost} title={t('memory.badge')} />
                  ) : null}
                  {/* Crisis marker: danger once triggered, rebirth once overcome. */}
                  <ResourceCrisisBadge resourceId={id} />
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatFixed(amount)}{' '}
                  <span className="text-xs text-muted">
                    ({sign}
                    {formatFixed(flow)}
                    {t('ui.perSecond')})
                  </span>
                </span>
                {consumers ? <span className="sr-only">{consumers}</span> : null}
                <FloaterLayer target={`res:${id}`} />
              </li>
            )
          })}

        {hasHiddenKey ? (
          <li
            title={t('complexity.toDiscover')}
            className="flex items-center justify-between gap-3 py-1 opacity-70"
          >
            <span className="flex min-w-0 items-center gap-2">
              <IconBadge icon="circle-dot" symbol="?" kind="resource" />
              <span className="text-muted">…</span>
              <span className="inline-flex shrink-0 text-octarine">
                <Icon name="gem" className="h-3 w-3" aria-hidden />
              </span>
            </span>
            <span className="sr-only">{t('complexity.toDiscover')}</span>
          </li>
        ) : null}
      </ul>
    </Panel>
  )
}
