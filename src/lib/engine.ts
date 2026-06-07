/**
 * Game engine: PURE functions (no React, no side effects). Everything is
 * testable and deterministic (`dt` is provided, never read from the clock).
 * See docs/ARCHITECTURE.md section 5.
 */

import type {
  ConverterId,
  CostCurve,
  EraDef,
  GameDefs,
  GameState,
  GeneratorId,
  ResourceId,
} from './types'

/** Geometric cost of the next level (0-indexed level). */
export function costAtLevel(curve: CostCurve, level: number): number {
  return curve.base * curve.growth ** level
}

/** Rounds an upgrade cost to the nearest ten (never below 10 for a real cost). */
function roundCost(amount: number): number {
  const rounded = Math.round(amount / 10) * 10
  return rounded === 0 && amount > 0 ? 10 : rounded
}

/** Cost (multi-resource) to go from `level` to `level + 1`, rounded to the nearest ten. */
export function nextCost(cost: CostCurve[], level: number): Record<ResourceId, number> {
  const total: Record<ResourceId, number> = {}
  for (const curve of cost) {
    total[curve.resource] = (total[curve.resource] ?? 0) + costAtLevel(curve, level)
  }
  for (const id in total) total[id] = roundCost(total[id])
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

/** Marks resources currently held (>0) as discovered (sticky, never unset). */
function discoveredWith(
  prev: Record<string, boolean>,
  resources: Record<ResourceId, number>,
): Record<string, boolean> {
  let next = prev
  for (const id in resources) {
    if (resources[id] > 0 && !next[id]) {
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

/** The next locked era (in order) that has an unlock condition, or undefined. */
export function nextLockedEra(state: GameState, defs: GameDefs): EraDef | undefined {
  return defs.eras.find(
    (era) =>
      !state.unlockedEras.includes(era.id) &&
      (era.unlock.resource !== undefined || era.unlock.complexity !== undefined),
  )
}

/** True if the player can currently afford the next era's milestone cost. */
export function canUnlockNextEra(state: GameState, defs: GameDefs): boolean {
  const era = nextLockedEra(state, defs)
  if (!era) return false
  const { resource, amount, complexity } = era.unlock
  if (complexity !== undefined) return state.complexity >= complexity
  if (resource !== undefined) return (state.resources[resource] ?? 0) >= (amount ?? 0)
  return false
}

/**
 * Crosses the next milestone: a manual action that unlocks the era and switches
 * to it. It does NOT spend Complexity. Eras never auto-unlock (no passive
 * cascade, thanks to the cap in `tick`), and Complexity only recedes on
 * regressive events (crises).
 */
export function unlockNextEra(state: GameState, defs: GameDefs): GameState {
  const era = nextLockedEra(state, defs)
  if (!era || !canUnlockNextEra(state, defs)) return state
  return {
    ...state,
    unlockedEras: [...state.unlockedEras, era.id],
    currentEraId: era.id,
  }
}

/** Each era older than the latest unlocked one contributes this much LESS Complexity. */
export const COMPLEXITY_ERA_DECAY = 50

function eraIndexFromId(eraId: string): number {
  const n = Number(eraId.slice(1))
  return Number.isFinite(n) ? n : 0
}

function latestUnlockedIndex(state: GameState): number {
  let max = 0
  for (const id of state.unlockedEras) {
    const n = eraIndexFromId(id)
    if (n > max) max = n
  }
  return max
}

/** Raw Complexity from producing `amount` of a resource, decayed by era recency. */
function complexityFor(
  defs: GameDefs,
  resource: ResourceId,
  amount: number,
  latestEra: number,
): number {
  const def = defs.resources[resource]
  const tier = def?.tier ?? 0
  const gap = latestEra - eraIndexFromId(def?.eraId ?? '')
  const recency = gap <= 0 ? 1 : 1 / COMPLEXITY_ERA_DECAY ** gap
  return amount * tier * recency
}

/** Applies the next-milestone cap to a raw Complexity gain (no passive overshoot). */
function creditedComplexity(
  state: GameState,
  defs: GameDefs,
  rawGain: number,
): { complexity: number; totalComplexityEver: number } {
  const next = nextLockedEra(state, defs)
  const cap =
    next && next.unlock.complexity !== undefined ? next.unlock.complexity : Number.POSITIVE_INFINITY
  const credited = Math.min(rawGain, Math.max(0, cap - state.complexity))
  return {
    complexity: state.complexity + credited,
    totalComplexityEver: state.totalComplexityEver + credited,
  }
}

/** True if the player has the inputs to apply a manual recipe once. */
export function canManualConvert(state: GameState, defs: GameDefs, id: ConverterId): boolean {
  const conv = defs.converters[id]
  if (!conv) return false
  return conv.inputs.every((i) => (state.resources[i.resource] ?? 0) >= i.amount)
}

/**
 * Applies a manual recipe once (one click): consumes the inputs, produces the
 * outputs, credits Complexity. The interactive way to combine resources.
 */
export function manualConvert(state: GameState, defs: GameDefs, id: ConverterId): GameState {
  const conv = defs.converters[id]
  if (!conv || !canManualConvert(state, defs, id)) return state

  const resources = { ...state.resources }
  for (const input of conv.inputs) {
    resources[input.resource] = (resources[input.resource] ?? 0) - input.amount
  }
  const latestEra = latestUnlockedIndex(state)
  let gained = 0
  for (const output of conv.outputs) {
    resources[output.resource] =
      (resources[output.resource] ?? 0) + output.amount * resourceMultiplier(state, output.resource)
    gained += complexityFor(defs, output.resource, output.amount, latestEra)
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
  const latestEra = latestUnlockedIndex(state)
  let gained = 0
  for (const output of conv.outputs) {
    resources[output.resource] =
      (resources[output.resource] ?? 0) + output.amount * resourceMultiplier(state, output.resource)
    gained += complexityFor(defs, output.resource, output.amount, latestEra)
  }
  return {
    ...state,
    resources,
    discovered: discoveredWith(state.discovered, resources),
    ...creditedComplexity(state, defs, gained),
  }
}

/**
 * Advances the state by one time step `dt` (in seconds):
 * 1. generator production;
 * 2. conversions (bounded by available inputs, never a hard block);
 * 3. Complexity gain, dominated by the latest era (older eras decay), and
 *    CAPPED at the next milestone cost (no passive overshoot; cross to continue).
 */
export function tick(state: GameState, defs: GameDefs, dt: number): GameState {
  if (dt <= 0) return state

  const resources = { ...state.resources }
  let gained = 0
  const latestEra = latestUnlockedIndex(state)

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
      gained += complexityFor(defs, output.resource, output.amount * cycles, latestEra)
    }
  }

  // Cap Complexity at the next milestone cost: no passive overshoot, the player
  // must cross the milestone to keep gaining.
  return {
    ...state,
    resources,
    discovered: discoveredWith(state.discovered, resources),
    ...creditedComplexity(state, defs, gained),
  }
}
