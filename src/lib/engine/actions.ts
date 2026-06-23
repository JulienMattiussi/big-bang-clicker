import type { ConverterId, GameDefs, GameState, GeneratorId, ResourceId } from '../types'
import { canAfford, nextCost, spend } from './cost'
import { galetConsumptionMultiplier } from './multipliers'
import { converterOutputMultiplier } from './rates'
import { latestUnlockedIndex } from './eras'
import { complexityFor, creditedComplexity } from './complexity'

/** Marks resources currently held (>0) as discovered (sticky, never unset). */
export function discoveredWith(
  prev: Record<string, boolean>,
  resources: Record<ResourceId, number>,
): Record<string, boolean> {
  let next = prev
  for (const id in resources) {
    if (resources[id]! > 0 && !next[id]) {
      if (next === prev) next = { ...prev }
      next[id] = true
    }
  }
  return next
}

/** Manual click: adds an amount to a resource (the era's "verb"). */
export function applyClick(state: GameState, resource: ResourceId, amount = 1): GameState {
  const resources = { ...state.resources, [resource]: (state.resources[resource] ?? 0) + amount }
  return { ...state, resources, discovered: discoveredWith(state.discovered, resources) }
}

/** Buys one generator level if affordable, otherwise returns null. */
export function buyGenerator(state: GameState, defs: GameDefs, id: GeneratorId): GameState | null {
  const gen = defs.generators[id]
  if (!gen) return null
  const level = state.generators[id]?.level ?? 0
  const cost = nextCost(gen.cost, level)
  if (!canAfford(state.resources, cost)) return null
  return {
    ...state,
    resources: spend(state.resources, cost),
    generators: { ...state.generators, [id]: { level: level + 1 } },
  }
}

/** Buys one converter level if affordable, otherwise returns null. */
export function buyConverter(state: GameState, defs: GameDefs, id: ConverterId): GameState | null {
  const conv = defs.converters[id]
  if (!conv) return null
  const current = state.converters[id]
  const level = current?.level ?? 0
  const cost = nextCost(conv.cost, level)
  if (!canAfford(state.resources, cost)) return null
  return {
    ...state,
    resources: spend(state.resources, cost),
    converters: {
      ...state.converters,
      [id]: { level: level + 1, enabled: current?.enabled ?? true },
    },
  }
}

/** True if the player has the inputs to apply a manual recipe once. */
export function canManualConvert(state: GameState, defs: GameDefs, id: ConverterId): boolean {
  const conv = defs.converters[id]
  if (!conv) return false
  const consume = galetConsumptionMultiplier(state, defs, id)
  return conv.inputs.every((i) => (state.resources[i.resource] ?? 0) >= i.amount * consume)
}

/**
 * Applies a manual recipe once (one click): consumes the inputs, produces the
 * outputs, credits Complexity. The interactive way to combine resources.
 */
export function manualConvert(state: GameState, defs: GameDefs, id: ConverterId): GameState {
  const conv = defs.converters[id]
  if (!conv || !canManualConvert(state, defs, id)) return state

  const resources = { ...state.resources }
  const consume = galetConsumptionMultiplier(state, defs, id)
  for (const input of conv.inputs) {
    resources[input.resource] = (resources[input.resource] ?? 0) - input.amount * consume
  }
  const latestEra = latestUnlockedIndex(state, defs)
  let gained = 0
  for (const output of conv.outputs) {
    const produced = output.amount * converterOutputMultiplier(state, defs, id, output.resource)
    resources[output.resource] = (resources[output.resource] ?? 0) + produced
    gained += complexityFor(state, defs, output.resource, produced, latestEra)
  }
  return {
    ...state,
    resources,
    discovered: discoveredWith(state.discovered, resources),
    ...creditedComplexity(state, defs, gained),
  }
}

/**
 * Produces a recipe's outputs once WITHOUT consuming any input (a "free" manual
 * production). Used by widgets where the manual gesture shouldn't drain the
 * player's stock (the inputs stay the fuel of the AUTOMATED recipe). Still
 * credits Complexity like a normal conversion.
 */
export function manualProduce(state: GameState, defs: GameDefs, id: ConverterId): GameState {
  const conv = defs.converters[id]
  if (!conv) return state
  const resources = { ...state.resources }
  const latestEra = latestUnlockedIndex(state, defs)
  let gained = 0
  for (const output of conv.outputs) {
    const produced = output.amount * converterOutputMultiplier(state, defs, id, output.resource)
    resources[output.resource] = (resources[output.resource] ?? 0) + produced
    gained += complexityFor(state, defs, output.resource, produced, latestEra)
  }
  return {
    ...state,
    resources,
    discovered: discoveredWith(state.discovered, resources),
    ...creditedComplexity(state, defs, gained),
  }
}
