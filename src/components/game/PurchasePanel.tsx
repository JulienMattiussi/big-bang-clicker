import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { IconBadge } from '@/components/ui/IconBadge'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { canAfford, nextCost } from '@/lib/engine'
import { formatNumber } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef, GameDefs, ResourceId } from '@/lib/types'

type T = (key: TranslationKey) => string

function describeCost(cost: Record<ResourceId, number>, defs: GameDefs, t: T): string {
  return Object.entries(cost)
    .map(
      ([id, amount]) =>
        `${formatNumber(amount)} ${t(defs.resources[id].nameKey as TranslationKey)}`,
    )
    .join(', ')
}

interface RowProps {
  name: string
  outputIcon: string
  level: number
  costLabel: string
  affordable: boolean
  onBuy: () => void
  t: T
  /** Convertisseurs uniquement : état d'activation et bascule. */
  enabled?: boolean
  onToggle?: () => void
}

function MachineRow({
  name,
  outputIcon,
  level,
  costLabel,
  affordable,
  onBuy,
  t,
  enabled,
  onToggle,
}: RowProps) {
  const toggleLabel = enabled ? t('machine.pause') : t('machine.resume')
  return (
    <li
      className={`rounded-md border border-border bg-bg/40 p-2 ${enabled === false ? 'opacity-60' : ''}`}
    >
      <div className="mb-2 flex items-center gap-2">
        {/* Rouage : signale une machine qui automatise la production. */}
        <Icon name="cog" className="h-4 w-4 shrink-0 text-accent" />
        <IconBadge icon={outputIcon} kind="machine" />
        <span className="min-w-0 flex-1 leading-tight">{name}</span>
        <span className="shrink-0 text-xs text-muted">
          {t('ui.level')} {level}
        </span>
        {onToggle && level > 0 ? (
          <Button
            variant="ghost"
            className="shrink-0 px-2 py-1"
            aria-label={toggleLabel}
            aria-pressed={enabled === false}
            title={toggleLabel}
            onClick={onToggle}
          >
            <Icon name={enabled ? 'pause' : 'play'} className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
      <Button
        variant="ghost"
        className="w-full text-center whitespace-nowrap"
        disabled={!affordable}
        onClick={onBuy}
      >
        {t('ui.buy')} <span className="text-muted">({costLabel})</span>
      </Button>
    </li>
  )
}

/** Machines de l'ère active (générateurs et convertisseurs) à améliorer. */
export function PurchasePanel({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const buyGenerator = useGameStore((s) => s.buyGenerator)
  const buyConverter = useGameStore((s) => s.buyConverter)
  const toggleConverter = useGameStore((s) => s.toggleConverter)

  return (
    <Panel title={t(era.machinesKey as TranslationKey)}>
      <ul className="flex flex-col gap-2">
        {era.generators.map((id) => {
          const def = defs.generators[id]
          const level = state.generators[id]?.level ?? 0
          const cost = nextCost(def.cost, level)
          return (
            <MachineRow
              key={id}
              t={t}
              name={t(def.nameKey as TranslationKey)}
              outputIcon={defs.resources[def.output].icon}
              level={level}
              costLabel={describeCost(cost, defs, t)}
              affordable={canAfford(state.resources, cost)}
              onBuy={() => buyGenerator(id)}
            />
          )
        })}
        {era.converters.map((id) => {
          const def = defs.converters[id]
          const converterState = state.converters[id]
          const level = converterState?.level ?? 0
          const cost = nextCost(def.cost, level)
          return (
            <MachineRow
              key={id}
              t={t}
              name={t(def.nameKey as TranslationKey)}
              outputIcon={defs.resources[def.outputs[0].resource].icon}
              level={level}
              costLabel={describeCost(cost, defs, t)}
              affordable={canAfford(state.resources, cost)}
              onBuy={() => buyConverter(id)}
              enabled={converterState?.enabled ?? true}
              onToggle={() => toggleConverter(id)}
            />
          )
        })}
      </ul>
    </Panel>
  )
}
