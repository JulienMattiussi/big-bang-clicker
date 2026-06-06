import type { ReactNode } from 'react'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { IconBadge } from '@/components/ui/IconBadge'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslation } from '@/i18n/useTranslation'
import { canAfford, nextCost } from '@/lib/engine'
import { revealedMachines } from '@/lib/reveal'
import { formatFixed, formatNumber } from '@/lib/format'
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

/** A machine flow entry: a resource and its per-second rate now and next level. */
interface FlowEntry {
  icon: string
  name: string
  perSec: number
  nextPerSec: number
}

function FlowLine({ label, entries }: { label: string; entries: FlowEntry[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="shrink-0">{label}</span>
      {entries.map((e, i) => (
        <span
          key={i}
          title={e.name}
          className="inline-flex items-center gap-1 tabular-nums text-secondary"
        >
          <Icon name={e.icon} className="h-3 w-3" aria-hidden />
          <span className="sr-only">{e.name}</span>
          {formatFixed(e.perSec)}
          <span className="text-muted/60">&rarr; {formatFixed(e.nextPerSec)}/s</span>
        </span>
      ))}
    </div>
  )
}

/** Explicit inputs/outputs of a machine, at the current and next level. */
function MachineFlows({
  t,
  consume,
  produce,
}: {
  t: T
  consume: FlowEntry[]
  produce: FlowEntry[]
}) {
  return (
    <div className="mb-2 flex flex-col gap-0.5 text-xs text-muted">
      {consume.length > 0 ? <FlowLine label={t('machine.consumes')} entries={consume} /> : null}
      <FlowLine label={t('machine.produces')} entries={produce} />
    </div>
  )
}

interface RowProps {
  name: string
  outputIcon: string
  level: number
  costLabel: string
  affordable: boolean
  onBuy: () => void
  t: T
  flows: ReactNode
  /** Converters only: enabled state and toggle. */
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
  flows,
  enabled,
  onToggle,
}: RowProps) {
  const toggleLabel = enabled ? t('machine.pause') : t('machine.resume')
  return (
    <li
      className={`rounded-md border border-border bg-bg/40 p-2 ${enabled === false ? 'opacity-60' : ''}`}
    >
      <div className="mb-2 flex items-center gap-2">
        {/* Gear: marks a machine that automates production. */}
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
      {flows}
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

/** Machines of the active era (generators and converters) to upgrade. */
export function PurchasePanel({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const buyGenerator = useGameStore((s) => s.buyGenerator)
  const buyConverter = useGameStore((s) => s.buyConverter)
  const toggleConverter = useGameStore((s) => s.toggleConverter)
  const spawn = useFeedbackStore((s) => s.spawn)

  const revealed = revealedMachines(state, era)

  // Floats a "-X" on each consumed resource counter when a machine is bought.
  const floatSpend = (cost: Record<ResourceId, number>) => {
    for (const [id, amount] of Object.entries(cost)) {
      spawn(`res:${id}`, `-${formatNumber(amount)}`, 'spend')
    }
  }

  return (
    <Panel title={t(era.machinesKey as TranslationKey)}>
      <ul className="flex flex-col gap-2">
        {era.generators
          .filter((id) => revealed.has(id))
          .map((id) => {
            const def = defs.generators[id]
            const level = state.generators[id]?.level ?? 0
            const cost = nextCost(def.cost, level)
            const produce: FlowEntry[] = [
              {
                icon: defs.resources[def.output].icon,
                name: t(defs.resources[def.output].nameKey as TranslationKey),
                perSec: level * def.baseRate,
                nextPerSec: (level + 1) * def.baseRate,
              },
            ]
            return (
              <MachineRow
                key={id}
                t={t}
                name={t(def.nameKey as TranslationKey)}
                outputIcon={defs.resources[def.output].icon}
                level={level}
                costLabel={describeCost(cost, defs, t)}
                affordable={canAfford(state.resources, cost)}
                onBuy={() => {
                  buyGenerator(id)
                  floatSpend(cost)
                }}
                flows={<MachineFlows t={t} consume={[]} produce={produce} />}
              />
            )
          })}
        {era.converters
          .filter((id) => revealed.has(id))
          .map((id) => {
            const def = defs.converters[id]
            const converterState = state.converters[id]
            const level = converterState?.level ?? 0
            const cost = nextCost(def.cost, level)
            const cycles = level * def.baseRate
            const nextCycles = (level + 1) * def.baseRate
            const toFlow = (resource: ResourceId, amount: number): FlowEntry => ({
              icon: defs.resources[resource].icon,
              name: t(defs.resources[resource].nameKey as TranslationKey),
              perSec: amount * cycles,
              nextPerSec: amount * nextCycles,
            })
            return (
              <MachineRow
                key={id}
                t={t}
                name={t(def.nameKey as TranslationKey)}
                outputIcon={defs.resources[def.outputs[0].resource].icon}
                level={level}
                costLabel={describeCost(cost, defs, t)}
                affordable={canAfford(state.resources, cost)}
                onBuy={() => {
                  buyConverter(id)
                  floatSpend(cost)
                }}
                enabled={converterState?.enabled ?? true}
                onToggle={() => toggleConverter(id)}
                flows={
                  <MachineFlows
                    t={t}
                    consume={def.inputs.map((i) => toFlow(i.resource, i.amount))}
                    produce={def.outputs.map((o) => toFlow(o.resource, o.amount))}
                  />
                }
              />
            )
          })}
      </ul>
    </Panel>
  )
}
