import type { GameDefs, GameState, ResourceId } from '../types'
import { eraIndexOf, nextLockedEra } from './eras'
import { galetComplexityMultiplier } from './multipliers'

/** Each era older than the latest unlocked one contributes this much LESS Complexity. */
export const COMPLEXITY_ERA_DECAY = 50

/** Each cleared 10-sequence of an era's idea constellation (Simon) doubles that
 *  era's Complexity. DERIVED from the persisted clear count, so it re-applies. */
const COMPLEXITY_BOOST = 2
/** Max clears of a 10-sequence rewarded per era; the Complexity bonus caps at 2^this. */
export const MAX_COMPLEXITY_BOOST = 5

/** Complexity produced PER UNIT of a resource (its tier, decayed by how many eras
 *  back it belongs, boosted by any active Complexity pebble covering its era and by
 *  the era's idea-constellation bonus). Single source of truth: the engine credit
 *  AND the UI tooltip both read this, so the displayed "+x/u" can never diverge. */
export function complexityPerUnit(
  state: GameState,
  defs: GameDefs,
  resource: ResourceId,
  latestEra: number,
): number {
  const def = defs.resources[resource]
  const tier = def?.tier ?? 0
  const eraId = def?.eraId ?? ''
  const gap = latestEra - eraIndexOf(defs, eraId)
  const recency = gap <= 0 ? 1 : 1 / COMPLEXITY_ERA_DECAY ** gap
  const boost = COMPLEXITY_BOOST ** (state.complexityBoosts?.[eraId] ?? 0)
  return (
    tier *
    recency *
    galetComplexityMultiplier(state, defs, eraId) *
    boost *
    (state.multipliers.metaComplexity ?? 1)
  )
}

/** Raw Complexity from producing `amount` of a resource (amount x per-unit). */
export function complexityFor(
  state: GameState,
  defs: GameDefs,
  resource: ResourceId,
  amount: number,
  latestEra: number,
): number {
  return amount * complexityPerUnit(state, defs, resource, latestEra)
}

/** Applies the next-milestone cap to a raw Complexity gain (no passive overshoot). */
export function creditedComplexity(
  state: GameState,
  defs: GameDefs,
  rawGain: number,
): { complexity: number; totalComplexityEver: number } {
  const next = nextLockedEra(state, defs)
  // Collapse era (freezeComplexity): Complexity is frozen, it can only fall.
  const frozen = defs.eras.find((e) => e.id === state.currentEraId)?.freezeComplexity
  const cap = frozen
    ? state.complexity
    : next && next.unlock.complexity !== undefined
      ? next.unlock.complexity
      : Number.POSITIVE_INFINITY
  const credited = Math.min(rawGain, Math.max(0, cap - state.complexity))
  return {
    complexity: state.complexity + credited,
    totalComplexityEver: state.totalComplexityEver + credited,
  }
}
