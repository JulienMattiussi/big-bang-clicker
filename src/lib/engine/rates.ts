import type { ConverterId, EraDef, GameDefs, GameState, GeneratorId, ResourceId } from '../types'
import {
  galetConverterMultiplier,
  galetGeneratorMultiplier,
  resourceMultiplier,
} from './multipliers'

// --- Production rates (the SINGLE source the tick AND the UI both read, so the
// "x/s" shown on a machine can never diverge from what is actually produced). ---

/** A generator's output per second at `level` (all multipliers included). */
export function generatorPerSec(
  state: GameState,
  defs: GameDefs,
  id: GeneratorId,
  level: number,
): number {
  const gen = defs.generators[id]
  if (!gen) return 0
  return (
    level *
    gen.baseRate *
    resourceMultiplier(state, defs, gen.output) *
    galetGeneratorMultiplier(state, defs, id)
  )
}

/** A converter's recipe rate (cycles/s) at `level`, uncapped (the input cap is
 *  tick-only; the machine panel shows this theoretical rate). */
export function converterCyclesPerSec(defs: GameDefs, id: ConverterId, level: number): number {
  const conv = defs.converters[id]
  return conv ? level * conv.baseRate : 0
}

/** Combined multiplier on ONE converter product (resource bonuses x its pebbles).
 *  The single source the tick, manual recipes, floaters and panel all reuse, so
 *  every "amount produced" agrees. Consumption is never multiplied. */
export function converterOutputMultiplier(
  state: GameState,
  defs: GameDefs,
  id: ConverterId,
  resource: ResourceId,
): number {
  return resourceMultiplier(state, defs, resource) * galetConverterMultiplier(state, defs, id)
}

/** Per-second amount of one converter PRODUCT at `level` (output multipliers
 *  included). Consumption rates use plain `inputAmount * cycles` (no multiplier). */
export function converterOutputPerSec(
  state: GameState,
  defs: GameDefs,
  id: ConverterId,
  resource: ResourceId,
  amount: number,
  level: number,
): number {
  return (
    amount *
    converterCyclesPerSec(defs, id, level) *
    converterOutputMultiplier(state, defs, id, resource)
  )
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
    resourceMultiplier(state, defs, era.clickResource) *
    (state.multipliers.metaClick ?? 1)
  )
}
