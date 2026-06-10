/**
 * Game engine: PURE functions (no React, no side effects). Everything is
 * testable and deterministic (`dt` is provided, never read from the clock).
 * See docs/ARCHITECTURE.md section 5.
 */

import type {
  ConverterId,
  CostCurve,
  EraDef,
  EraId,
  GameDefs,
  GameState,
  GeneratorId,
  ResourceId,
} from './types'
import { isCrisisReady, readyCrises } from './crises'

/** Geometric cost of the next level (0-indexed level). */
export function costAtLevel(curve: CostCurve, level: number): number {
  return curve.base * curve.growth ** level
}

/**
 * Rounds an upgrade cost cleanly at its displayed scale (the mantissa shown
 * before the k/M/... suffix, in [1, 1000), grouped by 1000 like format.ts):
 * - mantissa < 10  -> to the unit (e.g. 3k, 9k, 4M);
 * - mantissa >= 10 -> to the nearest 5, so the last digit is 0 or 5 (15, 20k,
 *   105k, 305k, 200M).
 */
function roundCost(amount: number): number {
  if (amount <= 0) return 0
  const tier = amount < 1000 ? 0 : Math.floor(Math.log10(amount) / 3)
  const scale = 1000 ** tier
  const mantissa = amount / scale
  const rounded = mantissa < 10 ? Math.round(mantissa) : Math.round(mantissa / 5) * 5
  return Math.max(1, rounded) * scale
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

/** Product of active galet multipliers of `type` that reach a machine's era. */
function galetMachineMultiplier(
  state: GameState,
  defs: GameDefs,
  eraId: EraId,
  type: 'generatorMultiplier' | 'converterMultiplier',
): number {
  const eraIdx = eraIndexFromId(eraId)
  let m = 1
  for (const galet of defs.galets ?? []) {
    if (galet.effect.type !== type) continue
    const owned = state.galets?.[galet.id]
    if (owned?.found && owned.active && eraIdx <= galet.effect.maxEraIndex) m *= galet.effect.value
  }
  return m
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

/**
 * Yield of one manual "verb" action from a widget: it scales with the era's
 * primary generator level (level + 1, so 1 at level 0, 66 at level 65) and with
 * any active pebble boosting that generator (so 660 at level 65 with a x10 galet).
 */
export function clickYield(state: GameState, defs: GameDefs, era: EraDef): number {
  const genId = era.generators[0]
  if (!genId) return 1
  const level = state.generators[genId]?.level ?? 0
  // Mirror passive production: the era's resource multiplier (memory bonus,
  // global, meta) boosts the manual click too, not just automation.
  return (
    (level + 1) *
    galetGeneratorMultiplier(state, defs, genId) *
    resourceMultiplier(state, era.clickResource)
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
  // A triggered, unresolved crisis blocks progression until it is overcome.
  if (readyCrises(state, defs).length > 0) return false
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
  const galet = galetConverterMultiplier(state, defs, id)
  let gained = 0
  for (const output of conv.outputs) {
    resources[output.resource] =
      (resources[output.resource] ?? 0) +
      output.amount * resourceMultiplier(state, output.resource) * galet
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
  const galet = galetConverterMultiplier(state, defs, id)
  let gained = 0
  for (const output of conv.outputs) {
    resources[output.resource] =
      (resources[output.resource] ?? 0) +
      output.amount * resourceMultiplier(state, output.resource) * galet
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

  // Resources frozen by a triggered, unresolved crisis: their production halts
  // until the crisis is overcome, so the player cannot progress around it.
  const frozen = new Set<string>()
  for (const id in defs.crises) {
    if (!isCrisisReady(state, defs, id)) continue
    const def = defs.crises[id]
    if (def.risk.sourceResource) frozen.add(def.risk.sourceResource)
    for (const e of def.regression) if (e.target) frozen.add(e.target)
    for (const e of def.rebound) if (e.target) frozen.add(e.target)
  }

  // 1. Generators: direct production.
  for (const id in state.generators) {
    const level = state.generators[id].level
    if (level <= 0) continue
    const gen = defs.generators[id]
    if (!gen) continue
    if (frozen.has(gen.output)) continue
    resources[gen.output] =
      (resources[gen.output] ?? 0) +
      level *
        gen.baseRate *
        dt *
        resourceMultiplier(state, gen.output) *
        galetGeneratorMultiplier(state, defs, id)
  }

  // 2. Converters: combination, bounded by available inputs.
  for (const id in state.converters) {
    const cState = state.converters[id]
    if (!cState.enabled || cState.level <= 0) continue
    const conv = defs.converters[id]
    if (!conv) continue
    // A frozen output (crisis) halts the whole recipe: no output, no input drain.
    if (conv.outputs.some((o) => frozen.has(o.resource))) continue

    let cycles = cState.level * conv.baseRate * dt
    for (const input of conv.inputs) {
      if (input.amount <= 0) continue
      const max = (resources[input.resource] ?? 0) / input.amount
      if (max < cycles) cycles = max
    }
    if (cycles <= 0) continue

    const convGalet = galetConverterMultiplier(state, defs, id)
    for (const input of conv.inputs) {
      resources[input.resource] = (resources[input.resource] ?? 0) - input.amount * cycles
    }
    for (const output of conv.outputs) {
      resources[output.resource] =
        (resources[output.resource] ?? 0) +
        output.amount * cycles * resourceMultiplier(state, output.resource) * convGalet
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
