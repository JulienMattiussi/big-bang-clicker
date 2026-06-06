/**
 * Game engine: PURE functions (no React, no side effects). Everything is
 * testable and deterministic (`dt` is provided, never read from the clock).
 * See docs/ARCHITECTURE.md section 5.
 */

import type { ConverterId, CostCurve, GameDefs, GameState, GeneratorId, ResourceId } from './types'

/** Geometric cost of the next level (0-indexed level). */
export function costAtLevel(curve: CostCurve, level: number): number {
  return curve.base * curve.growth ** level
}

/** Cost (multi-resource) to go from `level` to `level + 1`. */
export function nextCost(cost: CostCurve[], level: number): Record<ResourceId, number> {
  const total: Record<ResourceId, number> = {}
  for (const curve of cost) {
    total[curve.resource] = (total[curve.resource] ?? 0) + costAtLevel(curve, level)
  }
  return total
}

export function canAfford(
  resources: Record<ResourceId, number>,
  cost: Record<ResourceId, number>,
): boolean {
  for (const id in cost) {
    if ((resources[id] ?? 0) < cost[id]) return false
  }
  return true
}

function spend(
  resources: Record<ResourceId, number>,
  cost: Record<ResourceId, number>,
): Record<ResourceId, number> {
  const next = { ...resources }
  for (const id in cost) {
    next[id] = (next[id] ?? 0) - cost[id]
  }
  return next
}

/** Production multiplier for a resource (specific x global x prestige meta). */
function resourceMultiplier(state: GameState, resource: ResourceId): number {
  return (
    (state.multipliers[resource] ?? 1) *
    (state.multipliers.global ?? 1) *
    (state.multipliers.meta ?? 1)
  )
}

/** Manual click: adds an amount to a resource (the era's "verb"). */
export function applyClick(state: GameState, resource: ResourceId, amount = 1): GameState {
  return {
    ...state,
    resources: { ...state.resources, [resource]: (state.resources[resource] ?? 0) + amount },
  }
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

/**
 * Unlocks eras whose `unlock` condition is met. An era without a condition is
 * never auto-unlocked here (the starting era is unlocked at init).
 */
export function unlockEras(state: GameState, defs: GameDefs): GameState {
  let unlocked = state.unlockedEras
  let changed = false
  for (const era of defs.eras) {
    if (unlocked.includes(era.id)) continue
    const { resource, amount, complexity } = era.unlock
    if (resource === undefined && complexity === undefined) continue
    const resourceOk = resource === undefined || (state.resources[resource] ?? 0) >= (amount ?? 0)
    const complexityOk = complexity === undefined || state.complexity >= complexity
    if (resourceOk && complexityOk) {
      if (!changed) {
        unlocked = [...unlocked]
        changed = true
      }
      unlocked.push(era.id)
    }
  }
  return changed ? { ...state, unlockedEras: unlocked } : state
}

/**
 * Advances the state by one time step `dt` (in seconds):
 * 1. generator production;
 * 2. conversions (bounded by available inputs, never a hard block);
 * 3. Complexity gain, weighted by the depth (tier) of the outputs.
 */
export function tick(state: GameState, defs: GameDefs, dt: number): GameState {
  if (dt <= 0) return state

  const resources = { ...state.resources }
  let gained = 0

  // 1. Generators: direct production.
  for (const id in state.generators) {
    const level = state.generators[id].level
    if (level <= 0) continue
    const gen = defs.generators[id]
    if (!gen) continue
    resources[gen.output] =
      (resources[gen.output] ?? 0) +
      level * gen.baseRate * dt * resourceMultiplier(state, gen.output)
  }

  // 2. Converters: combination, bounded by available inputs.
  for (const id in state.converters) {
    const cState = state.converters[id]
    if (!cState.enabled || cState.level <= 0) continue
    const conv = defs.converters[id]
    if (!conv) continue

    let cycles = cState.level * conv.baseRate * dt
    for (const input of conv.inputs) {
      if (input.amount <= 0) continue
      const max = (resources[input.resource] ?? 0) / input.amount
      if (max < cycles) cycles = max
    }
    if (cycles <= 0) continue

    for (const input of conv.inputs) {
      resources[input.resource] = (resources[input.resource] ?? 0) - input.amount * cycles
    }
    for (const output of conv.outputs) {
      resources[output.resource] =
        (resources[output.resource] ?? 0) +
        output.amount * cycles * resourceMultiplier(state, output.resource)
      const tier = defs.resources[output.resource]?.tier ?? 0
      gained += output.amount * cycles * tier
    }
  }

  return {
    ...state,
    resources,
    complexity: state.complexity + gained,
    totalComplexityEver: state.totalComplexityEver + gained,
  }
}
