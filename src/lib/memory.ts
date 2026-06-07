import type { EraDef, GameState, ResourceId } from './types'

/**
 * "Memory" mini-game: spend Complexity to play a concentration game with
 * resource icons; clearing the board doubles (cumulatively) the production of
 * the current era's main resource. Introduced at era 7 when oxidation is first
 * leveled, then available in every era afterwards. Pure helpers only - the
 * board/shuffle lives in the widget (UI), the reward/spend in the store.
 */

/** The mechanic unlocks the first time this converter reaches this level. */
export const MEMORY_UNLOCK_CONVERTER = 'oxidation'
export const MEMORY_UNLOCK_LEVEL = 1

/**
 * Board size (pairs) and how many mismatched flips are tolerated before fail.
 * 21 pairs = 42 cards (the Answer to Life, the Universe and Everything).
 */
export const MEMORY_PAIRS = 21
export const MEMORY_MISTAKES = 15

/** Available once oxidation has been leveled at least once (era 7 onward). */
export function memoryUnlocked(state: GameState): boolean {
  return (state.converters[MEMORY_UNLOCK_CONVERTER]?.level ?? 0) >= MEMORY_UNLOCK_LEVEL
}

/** The current era's main (base) resource: the one the reward doubles. */
export function memoryMainResource(era: EraDef): ResourceId {
  return era.clickResource
}

/** Complexity cost of one attempt: 10% of the current Complexity. */
export function memoryCost(state: GameState): number {
  return Math.max(1, Math.round(state.complexity * 0.1))
}
