import { Panel } from '@/components/ui/Panel'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslation } from '@/i18n/useTranslation'
import {
  canAfford,
  canManualConvert,
  converterCyclesPerSec,
  converterOutputMultiplier,
  converterOutputPerSec,
  galetConsumptionMultiplier,
  generatorPerSec,
  nextCost,
} from '@/lib/engine'
import { revealedMachines } from '@/lib/reveal'
import { isSplitMachines } from '@/components/layout/eraLayout'
import {
  galetsAffectingConverter,
  galetsAffectingGenerator,
  galetsAffectingTerminalConverter,
} from '@/lib/galets'
import {
  MachineFlows,
  MachineRow,
  type FlowEntry,
  type GaletBadge,
} from '@/components/game/MachineRow'
import { formatNumber } from '@/lib/format'
import type { Translate, TranslationKey } from '@/i18n/types'
import type {
  ConverterDef,
  EraDef,
  GaletDef,
  GameDefs,
  ResourceAmount,
  ResourceId,
} from '@/lib/types'

function describeCost(cost: Record<ResourceId, number>, defs: GameDefs, t: Translate): string {
  return Object.entries(cost)
    .map(
      ([id, amount]) =>
        `${formatNumber(amount)} ${t(defs.resources[id]!.nameKey as TranslationKey)}`,
    )
    .join(', ')
}

/** Tooltip for the manual "Produce" button: what one recipe consumes and produces. */
function describeRecipe(conv: ConverterDef, defs: GameDefs, t: Translate): string {
  const side = (list: ResourceAmount[]) =>
    list
      .map(
        (io) =>
          `${formatNumber(io.amount)} ${t(defs.resources[io.resource]!.nameKey as TranslationKey)}`,
      )
      .join(', ')
  return `${t('machine.consumes')} ${side(conv.inputs)} → ${t('machine.produces')} ${side(conv.outputs)}`
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
  // 'wide-split' eras give one card extra width (e.g. the Unification's long,
  // one-input-per-era recipe) so its inputs fit on several columns; its partner
  // (rendered first, a generator) is squeezed accordingly.
  const wideGrid =
    revealedCount <= 2
      ? isSplitMachines(era.layout)
        ? 'grid grid-cols-1 gap-2 sm:grid-cols-[2fr_3fr]'
        : 'grid grid-cols-1 gap-2 sm:grid-cols-2'
      : 'grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'

  // Era a resource belongs to, only when it differs from the current one
  // (so the player knows which tab to open to find it).
  const eraTag = (resource: ResourceId): FlowEntry['era'] => {
    const eraId = defs.resources[resource]!.eraId
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

  // Infinity-pebble badges next to a machine's name (gen = primary, conv = secondary).
  const toBadges = (galets: GaletDef[]): GaletBadge[] =>
    galets.map((g) => {
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
  const genBadges = (id: string) => toBadges(galetsAffectingGenerator(state, defs, id))
  const convBadges = (id: string) =>
    toBadges([
      ...galetsAffectingConverter(state, defs, id),
      ...galetsAffectingTerminalConverter(state, defs, id),
    ])

  const craft = (id: string) => {
    const def = defs.converters[id]!
    if (!canManualConvert(state, defs, id)) return
    manualConvert(id)
    const consume = galetConsumptionMultiplier(state, defs, id)
    for (const i of def.inputs)
      spawn(`res:${i.resource}`, `-${formatNumber(i.amount * consume)}`, 'spend')
    for (const o of def.outputs)
      spawn(
        `res:${o.resource}`,
        `+${formatNumber(o.amount * converterOutputMultiplier(state, defs, id, o.resource))}`,
        'resource',
      )
  }

  return (
    <Panel title={t(era.machinesKey as TranslationKey)}>
      <ul className={wide ? wideGrid : 'flex flex-col gap-2'}>
        {era.generators
          .filter((id) => revealed.has(id))
          .map((id) => {
            const def = defs.generators[id]!
            const level = state.generators[id]?.level ?? 0
            const cost = nextCost(def.cost, level)
            const produce: FlowEntry[] = [
              {
                icon: defs.resources[def.output]!.icon,
                symbol: defs.resources[def.output]!.symbol,
                name: t(defs.resources[def.output]!.nameKey as TranslationKey),
                perSec: generatorPerSec(state, defs, id, level),
                nextPerSec: generatorPerSec(state, defs, id, level + 1),
              },
            ]
            return (
              <MachineRow
                key={id}
                t={t}
                name={t(def.nameKey as TranslationKey)}
                badges={genBadges(id)}
                outputIcon={defs.resources[def.output]!.icon}
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
            const def = defs.converters[id]!
            const converterState = state.converters[id]
            const level = converterState?.level ?? 0
            const cost = nextCost(def.cost, level)
            const cycles = converterCyclesPerSec(defs, id, level)
            const nextCycles = converterCyclesPerSec(defs, id, level + 1)
            // Consumption is the recipe rate, eased by any pebble on a terminal
            // converter; production carries the output multipliers via the helper.
            const consume = galetConsumptionMultiplier(state, defs, id)
            const consumeFlow = (resource: ResourceId, amount: number): FlowEntry => ({
              icon: defs.resources[resource]!.icon,
              symbol: defs.resources[resource]!.symbol,
              name: t(defs.resources[resource]!.nameKey as TranslationKey),
              perSec: amount * consume * cycles,
              nextPerSec: amount * consume * nextCycles,
              era: eraTag(resource),
            })
            const produceFlow = (resource: ResourceId, amount: number): FlowEntry => ({
              icon: defs.resources[resource]!.icon,
              symbol: defs.resources[resource]!.symbol,
              name: t(defs.resources[resource]!.nameKey as TranslationKey),
              perSec: converterOutputPerSec(state, defs, id, resource, amount, level),
              nextPerSec: converterOutputPerSec(state, defs, id, resource, amount, level + 1),
              era: eraTag(resource),
            })
            return (
              <MachineRow
                key={id}
                t={t}
                name={t(def.nameKey as TranslationKey)}
                badges={convBadges(id)}
                outputIcon={defs.resources[def.outputs[0]!.resource]!.icon}
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
                    consume={def.inputs.map((i) => consumeFlow(i.resource, i.amount))}
                    produce={def.outputs.map((o) => produceFlow(o.resource, o.amount))}
                  />
                }
              />
            )
          })}
      </ul>
    </Panel>
  )
}
