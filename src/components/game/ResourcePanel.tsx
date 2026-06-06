import { Panel } from '@/components/ui/Panel'
import { IconBadge } from '@/components/ui/IconBadge'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { netFlows } from '@/lib/graph'
import { formatFixed } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

/** Liste les ressources de l'ère active : icône, nom, quantité + flux net. */
export function ResourcePanel({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const flows = netFlows(state, defs)

  return (
    <Panel title={t(era.stockKey as TranslationKey)}>
      <ul className="flex flex-col gap-2">
        {era.resources.map((id) => {
          const def = defs.resources[id]
          const amount = state.resources[id] ?? 0
          const flow = flows[id] ?? 0
          const sign = flow >= 0 ? '+' : ''
          return (
            <li key={id} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <IconBadge icon={def.icon} kind="resource" />
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
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
