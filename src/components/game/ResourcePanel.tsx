import { Panel } from '@/components/ui/Panel'
import { IconBadge } from '@/components/ui/IconBadge'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { netFlows } from '@/lib/graph'
import { revealedResources } from '@/lib/reveal'
import { FloaterLayer } from '@/components/ui/FloaterLayer'
import { formatFixed } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

/** Lists the active era's resources: icon, name, amount + net flow. */
export function ResourcePanel({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const flows = netFlows(state, defs)
  const revealed = revealedResources(state, defs, era)

  // Machines that consume a resource (so the player knows where it goes).
  const consumedBy = (id: string) => {
    const names = Object.values(defs.converters)
      .filter((c) => c.inputs.some((i) => i.resource === id))
      .map((c) => t(c.nameKey as TranslationKey))
    return names.length ? `${t('machine.consumedBy')} : ${names.join(', ')}` : undefined
  }

  return (
    <Panel title={t(era.stockKey as TranslationKey)}>
      <ul className="flex flex-col gap-2">
        {era.resources
          .filter((id) => revealed.has(id))
          .map((id) => {
            const def = defs.resources[id]
            const amount = state.resources[id] ?? 0
            const flow = flows[id] ?? 0
            const sign = flow >= 0 ? '+' : ''
            return (
              <li
                key={id}
                title={consumedBy(id)}
                className="relative flex items-center justify-between gap-3"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <IconBadge icon={def.icon} symbol={def.symbol} kind="resource" />
                  <span className="truncate">{t(def.nameKey as TranslationKey)}</span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatFixed(amount)}{' '}
                  <span className="text-xs text-muted">
                    ({sign}
                    {formatFixed(flow)}
                    {t('ui.perSecond')})
                  </span>
                </span>
                <FloaterLayer target={`res:${id}`} />
              </li>
            )
          })}
      </ul>
    </Panel>
  )
}
