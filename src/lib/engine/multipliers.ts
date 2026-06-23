import type {
  ConverterId,
  EraId,
  GaletEffect,
  GameDefs,
  GameState,
  GeneratorId,
  ResourceId,
} from '../types'
import { MEMORY_BOOST } from '../memory'
import { eraIndexOf } from './eras'

/**
 * Multiplier from cleared memory games on a resource: each win on its era doubles
 * it. DERIVED from the persisted level (not baked into `multipliers`), so tuning
 * MEMORY_BOOST retroactively re-applies to existing saves.
 */
function memoryResourceMultiplier(state: GameState, defs: GameDefs, resource: ResourceId): number {
  const era = defs.eras.find((e) => e.clickResource === resource)
  const level = era ? (state.memoryLevels?.[era.id] ?? 0) : 0
  return MEMORY_BOOST ** level
}

/**
 * Permanent multiplier from RESOLVED crises whose rebound multiplies `target`.
 * DERIVED from each crisis's resolve count and the data value (not baked into
 * `multipliers`), so tuning a rebound value re-applies to existing saves.
 */
function crisisReboundMultiplier(state: GameState, defs: GameDefs, target: string): number {
  let m = 1
  for (const id in defs.crises) {
    const count = state.crises?.[id]?.count ?? 0
    if (count <= 0) continue
    for (const e of defs.crises[id]!.rebound) {
      if (e.type === 'multiplier' && e.target === target) m *= (e.value ?? 1) ** count
    }
  }
  return m
}

/**
 * Production multiplier for a resource. The direct `multipliers` record now only
 * carries the prestige meta (and a manual slot); the per-resource memory bonus and
 * the crisis rebounds are DERIVED from persisted levels/counts, so adjusting their
 * data values always re-applies (the save stores the effect as a level/flag, never
 * a baked multiplier). See docs/ARCHITECTURE.md section 8.2.
 */
export function resourceMultiplier(state: GameState, defs: GameDefs, resource: ResourceId): number {
  return (
    (state.multipliers[resource] ?? 1) *
    (state.multipliers.global ?? 1) *
    (state.multipliers.meta ?? 1) *
    memoryResourceMultiplier(state, defs, resource) *
    crisisReboundMultiplier(state, defs, resource) *
    crisisReboundMultiplier(state, defs, 'global')
  )
}

/** Product of active galet multipliers of `type` that reach a machine's era. */
function galetMachineMultiplier(
  state: GameState,
  defs: GameDefs,
  eraId: EraId,
  type: GaletEffect['type'],
): number {
  const eraIdx = eraIndexOf(defs, eraId)
  let m = 1
  for (const galet of defs.galets ?? []) {
    if (galet.effect.type !== type) continue
    const owned = state.galets?.[galet.id]
    if (owned?.found && owned.active && eraIdx <= galet.effect.maxEraIndex) m *= galet.effect.value
  }
  // The "pebble power" meta-upgrade amplifies the pebbles' bonus above 1.
  return 1 + (m - 1) * (state.multipliers.metaGalet ?? 1)
}

/** Multiplier from active pebbles on a generator's (primary factory) output. */
export function galetGeneratorMultiplier(
  state: GameState,
  defs: GameDefs,
  generatorId: GeneratorId,
): number {
  const gen = defs.generators[generatorId]
  return gen ? galetMachineMultiplier(state, defs, gen.eraId, 'generatorMultiplier') : 1
}

/** Multiplier from active pebbles on a converter's (secondary factory) output. */
export function galetConverterMultiplier(
  state: GameState,
  defs: GameDefs,
  converterId: ConverterId,
): number {
  const conv = defs.converters[converterId]
  return conv ? galetMachineMultiplier(state, defs, conv.eraId, 'converterMultiplier') : 1
}

/** Multiplier from active pebbles on the Complexity gained from an era's resources. */
export function galetComplexityMultiplier(state: GameState, defs: GameDefs, eraId: EraId): number {
  return galetMachineMultiplier(state, defs, eraId, 'complexityMultiplier')
}

/** True if `converterId` is the terminal (last) converter of its era. */
function isTerminalConverter(defs: GameDefs, converterId: ConverterId): boolean {
  const conv = defs.converters[converterId]
  if (!conv) return false
  const list = defs.eras.find((e) => e.id === conv.eraId)?.converters
  return !!list && list.length > 0 && list[list.length - 1] === converterId
}

/** Input-cost multiplier from active pebbles that ease a TERMINAL converter's
 *  consumption (e.g. the multitude pebble halves it). 1 for any other converter. */
export function galetConsumptionMultiplier(
  state: GameState,
  defs: GameDefs,
  converterId: ConverterId,
): number {
  const conv = defs.converters[converterId]
  if (!conv || !isTerminalConverter(defs, converterId)) return 1
  return galetMachineMultiplier(state, defs, conv.eraId, 'terminalConsumption')
}
