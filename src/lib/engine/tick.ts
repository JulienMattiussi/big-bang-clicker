import type { GameDefs, GameState } from '../types'
import { isCrisisReady } from '../crises'
import { latestUnlockedIndex } from './eras'
import { galetConsumptionMultiplier } from './multipliers'
import { converterOutputMultiplier, generatorPerSec } from './rates'
import { complexityFor, creditedComplexity } from './complexity'
import { discoveredWith } from './actions'

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
  const latestEra = latestUnlockedIndex(state, defs)

  // Resources frozen by a triggered, unresolved crisis: their production halts
  // until the crisis is overcome, so the player cannot progress around it.
  const frozen = new Set<string>()
  for (const id in defs.crises) {
    if (!isCrisisReady(state, defs, id)) continue
    const def = defs.crises[id]!
    if (def.risk.sourceResource) frozen.add(def.risk.sourceResource)
    for (const e of def.regression) if (e.target) frozen.add(e.target)
    for (const e of def.rebound) if (e.target) frozen.add(e.target)
    // The whole era stalls during its crisis (you cannot click around it).
    const era = defs.eras.find((e) => e.id === def.eraId)
    if (era?.resources) for (const r of era.resources) frozen.add(r)
  }

  for (const id in state.generators) {
    const level = state.generators[id]!.level
    if (level <= 0) continue
    const gen = defs.generators[id]
    if (!gen) continue
    if (frozen.has(gen.output)) continue
    resources[gen.output] =
      (resources[gen.output] ?? 0) + generatorPerSec(state, defs, id, level) * dt
  }

  // Converters are bounded by the inputs actually available this tick.
  for (const id in state.converters) {
    const cState = state.converters[id]!
    if (!cState.enabled || cState.level <= 0) continue
    const conv = defs.converters[id]
    if (!conv) continue
    // A frozen output (crisis) halts the whole recipe: no output, no input drain.
    if (conv.outputs.some((o) => frozen.has(o.resource))) continue

    const consume = galetConsumptionMultiplier(state, defs, id)
    let cycles = cState.level * conv.baseRate * dt
    for (const input of conv.inputs) {
      if (input.amount <= 0) continue
      const max = (resources[input.resource] ?? 0) / (input.amount * consume)
      if (max < cycles) cycles = max
    }
    if (cycles <= 0) continue

    for (const input of conv.inputs) {
      resources[input.resource] = (resources[input.resource] ?? 0) - input.amount * consume * cycles
    }
    for (const output of conv.outputs) {
      // Complexity follows the ACTUAL output (multipliers included), so a memory
      // bonus / crisis rebound / galet boosts progression as much as the stock.
      const produced =
        output.amount * cycles * converterOutputMultiplier(state, defs, id, output.resource)
      resources[output.resource] = (resources[output.resource] ?? 0) + produced
      gained += complexityFor(state, defs, output.resource, produced, latestEra)
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
