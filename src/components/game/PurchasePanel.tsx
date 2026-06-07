import type { ReactNode } from 'react'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { IconBadge } from '@/components/ui/IconBadge'
import { Icon } from '@/components/ui/Icon'
import { EraIcon } from '@/components/game/EraIcon'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslation } from '@/i18n/useTranslation'
import { canAfford, canManualConvert, nextCost } from '@/lib/engine'
import { revealedMachines } from '@/lib/reveal'
import { galetsAffectingGenerator } from '@/lib/galets'
import { Galet } from '@/components/game/Galet'
import { formatFixed, formatNumber } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'
import type { ConverterDef, EraDef, GameDefs, ResourceAmount, ResourceId } from '@/lib/types'

type T = (key: TranslationKey) => string

function describeCost(cost: Record<ResourceId, number>, defs: GameDefs, t: T): string {
  return Object.entries(cost)
    .map(
      ([id, amount]) =>
        `${formatNumber(amount)} ${t(defs.resources[id].nameKey as TranslationKey)}`,
    )
    .join(', ')
}

/** Tooltip for the manual "Produce" button: what one recipe consumes and produces. */
function describeRecipe(conv: ConverterDef, defs: GameDefs, t: T): string {
  const side = (list: ResourceAmount[]) =>
    list
      .map(
        (io) =>
          `${formatNumber(io.amount)} ${t(defs.resources[io.resource].nameKey as TranslationKey)}`,
      )
      .join(', ')
  return `${t('machine.consumes')} ${side(conv.inputs)} → ${t('machine.produces')} ${side(conv.outputs)}`
}

/** A machine flow entry: a resource and its per-second rate now and next level. */
interface FlowEntry {
  icon: string
  name: string
  perSec: number
  nextPerSec: number
  /** Set when the resource belongs to a different era (which tab to find it). */
  era?: { icon: string; name: string }
}

function FlowLine({ label, entries }: { label: string; entries: FlowEntry[] }) {
  // Stack the resources vertically when there are several (more readable than
  // a long inline row, e.g. recombination consuming nucleons + electrons).
  const stacked = entries.length > 1
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0">{label}</span>
      <div className={stacked ? 'flex flex-col gap-0.5' : 'flex flex-wrap items-center gap-x-2'}>
        {entries.map((e, i) => (
          <span
            key={i}
            title={e.era ? `${e.name} - ${e.era.name}` : e.name}
            className="inline-flex items-center gap-1 tabular-nums text-secondary"
          >
            <Icon name={e.icon} className="h-3 w-3" aria-hidden />
            {e.era ? <EraIcon icon={e.era.icon} className="h-3 w-3" /> : null}
            <span className="sr-only">{e.era ? `${e.name}, ${e.era.name}` : e.name}</span>
            {formatFixed(e.perSec)}
            <span className="text-muted/60">&rarr; {formatFixed(e.nextPerSec)}/s</span>
          </span>
        ))}
      </div>
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

/** A found pebble affecting this machine (shown next to its name). */
interface GaletBadge {
  id: string
  color: string
  motif: string
  shape?: number
  active: boolean
  title: string
}

interface RowProps {
  name: string
  outputIcon: string
  level: number
  badges?: GaletBadge[]
  costLabel: string
  affordable: boolean
  onBuy: () => void
  t: T
  flows: ReactNode
  /** Converters only: manual craft (one recipe per click) + automation toggle. */
  onCraft?: () => void
  canCraft?: boolean
  craftTitle?: string
  enabled?: boolean
  onToggle?: () => void
}

function MachineRow({
  name,
  outputIcon,
  level,
  badges,
  costLabel,
  affordable,
  onBuy,
  t,
  flows,
  onCraft,
  canCraft,
  craftTitle,
  enabled,
  onToggle,
}: RowProps) {
  const toggleLabel = enabled ? t('machine.pause') : t('machine.resume')
  return (
    <li
      className={`flex h-full flex-col rounded-md border border-border bg-bg/40 p-2 ${enabled === false ? 'opacity-60' : ''}`}
    >
      <div className="mb-2 flex items-center gap-2">
        {/* Gear: marks a machine that automates production. */}
        <Icon name="cog" className="h-4 w-4 shrink-0 text-accent" />
        <IconBadge icon={outputIcon} kind="machine" />
        <span className="min-w-0 leading-tight">{name}</span>
        {/* Infinity-pebble badges: a pebble that boosts this machine (dim if off). */}
        {badges?.map((b) => (
          <span key={b.id} title={b.title} className="inline-flex shrink-0">
            <Galet color={b.color} motif={b.motif} shape={b.shape} size={26} dim={!b.active} />
            <span className="sr-only">{b.title}</span>
          </span>
        ))}
        <span className="flex-1" />
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
      <div className="mt-auto flex gap-2">
        {/* Manual craft (orange = the action you trigger), constant width; then
            automation, which flexes to absorb the variable cost label. */}
        {onCraft ? (
          <Button
            className="flex shrink-0 items-center justify-center whitespace-nowrap"
            disabled={!canCraft}
            title={craftTitle}
            onClick={onCraft}
          >
            {t('machine.produce')}
          </Button>
        ) : null}
        {/* Label and cost on separate lines: the button keeps the same shape
            whatever the cost text length (no awkward mid-label wrap). */}
        <Button
          variant="ghost"
          className="flex flex-1 flex-col items-center justify-center leading-tight"
          disabled={!affordable}
          onClick={onBuy}
        >
          <span>{t('ui.buy')}</span>
          <span className="text-muted">({costLabel})</span>
        </Button>
      </div>
    </li>
  )
}

/** Machines of the active era (generators and converters) to upgrade. */
export function PurchasePanel({ era, wide = false }: { era: EraDef; wide?: boolean }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const buyGenerator = useGameStore((s) => s.buyGenerator)
  const buyConverter = useGameStore((s) => s.buyConverter)
  const toggleConverter = useGameStore((s) => s.toggleConverter)
  const manualConvert = useGameStore((s) => s.manualConvert)
  const spawn = useFeedbackStore((s) => s.spawn)

  const revealed = revealedMachines(state, defs, era)

  // Cap the wide layout's columns at the number of revealed machines (max 3),
  // so an era with few machines (e.g. the solar system) doesn't leave gaps.
  const revealedCount =
    era.generators.filter((id) => revealed.has(id)).length +
    era.converters.filter((id) => revealed.has(id)).length
  const wideGrid =
    revealedCount <= 2
      ? 'grid grid-cols-1 gap-2 sm:grid-cols-2'
      : 'grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'

  // Era a resource belongs to, only when it differs from the current one
  // (so the player knows which tab to open to find it).
  const eraTag = (resource: ResourceId): FlowEntry['era'] => {
    const eraId = defs.resources[resource].eraId
    if (eraId === era.id) return undefined
    const owner = defs.eras.find((e) => e.id === eraId)
    return owner ? { icon: owner.icon, name: t(owner.nameKey as TranslationKey) } : undefined
  }

  // Floats a "-X" on each consumed resource counter when a machine is bought.
  const floatSpend = (cost: Record<ResourceId, number>) => {
    for (const [id, amount] of Object.entries(cost)) {
      spawn(`res:${id}`, `-${formatNumber(amount)}`, 'spend')
    }
  }

  // Infinity-pebble badges affecting a generator (shown next to its name).
  const genBadges = (id: string): GaletBadge[] =>
    galetsAffectingGenerator(state, defs, id).map((g) => {
      const active = state.galets[g.id]?.active ?? false
      const label = `${t(g.nameKey as TranslationKey)} - ${t(g.descKey as TranslationKey)}`
      return {
        id: g.id,
        color: g.color,
        motif: g.motif,
        shape: g.shape,
        active,
        title: active ? label : `${label} (${t('galet.inactive')})`,
      }
    })

  // Manual craft: apply one recipe by hand, with floating feedback.
  const craft = (id: string) => {
    const def = defs.converters[id]
    if (!canManualConvert(state, defs, id)) return
    manualConvert(id)
    for (const i of def.inputs) spawn(`res:${i.resource}`, `-${formatNumber(i.amount)}`, 'spend')
    for (const o of def.outputs)
      spawn(`res:${o.resource}`, `+${formatNumber(o.amount)}`, 'resource')
  }

  return (
    <Panel title={t(era.machinesKey as TranslationKey)}>
      <ul className={wide ? wideGrid : 'flex flex-col gap-2'}>
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
                badges={genBadges(id)}
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
              era: eraTag(resource),
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
                onCraft={() => craft(id)}
                canCraft={canManualConvert(state, defs, id)}
                craftTitle={describeRecipe(def, defs, t)}
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
