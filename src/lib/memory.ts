import type { GameDefs, GameState } from './types'
import { memoryGalet } from './galets'

/**
 * "Memory" mini-game: spend Complexity to play a concentration game with
 * resource icons; clearing the board doubles (cumulatively) the current era's
 * main resource. Introduced at era 7 when oxidation is first leveled, then
 * available in every era afterwards. Pure helpers only - the board/shuffle lives
 * in the widget (UI), the reward/spend in the store.
 *
 * Each era's main resource can be boosted three times (x2 -> x4 -> x8), through
 * three escalating stages (see MEMORY_LEVELS).
 */

/** The mechanic unlocks the first time this converter reaches this level. */
export const MEMORY_UNLOCK_CONVERTER = 'oxidation'
const MEMORY_UNLOCK_LEVEL = 1

/** Times an era's main resource can be boosted (x2 -> x4 -> x8). */
export const MEMORY_MAX_LEVEL = 3
/** Factor applied per cleared level. The win only persists the LEVEL; the engine
 *  derives MEMORY_BOOST^level live, so tuning this re-applies to existing saves. */
export const MEMORY_BOOST = 2

export interface MemoryLevelConfig {
  /** Total cards dealt on the board. */
  cards: number
  /** Identical cards to gather to clear a set (2 = pairs, 3 = triplets). */
  group: number
  /** Distinct symbols on the board (cards / group). */
  symbols: number
  /** Mismatches tolerated before the attempt fails. */
  mistakes: number
}

/**
 * Three escalating stages, keyed by level (1..MEMORY_MAX_LEVEL):
 * - 1: only 21 cards but TRIPLETS - small enough to never need more resource
 *   icons than exist that early ("half the memory of the universe").
 * - 2: the classic 42-card PAIRS board.
 * - 3: 42 cards AND triplets.
 * 42 is the Answer; 21 is half of it (see the modal copy).
 */
export const MEMORY_LEVELS: Record<number, MemoryLevelConfig> = {
  1: { cards: 21, group: 3, symbols: 7, mistakes: 15 },
  2: { cards: 42, group: 2, symbols: 21, mistakes: 28 },
  3: { cards: 42, group: 3, symbols: 14, mistakes: 30 },
}

/** Available once oxidation has been leveled at least once (era 7 onward). */
export function memoryUnlocked(state: GameState): boolean {
  return (state.converters[MEMORY_UNLOCK_CONVERTER]?.level ?? 0) >= MEMORY_UNLOCK_LEVEL
}

/** How many times this era's resource has already been boosted (0..MAX). */
export function memoryCompletions(state: GameState, eraId: string): number {
  return state.memoryLevels?.[eraId] ?? 0
}

/** The level (1..MAX) the next attempt for this era plays. */
export function memoryLevel(state: GameState, eraId: string): number {
  return Math.min(memoryCompletions(state, eraId) + 1, MEMORY_MAX_LEVEL)
}

/** True once this era's resource has been boosted the maximum number of times. */
export function memoryEraMaxed(state: GameState, eraId: string): boolean {
  return memoryCompletions(state, eraId) >= MEMORY_MAX_LEVEL
}

/** Complexity cost of one attempt: 10% of the current Complexity, dropped to the
 *  Force pebble's fraction (1%) while that mind-control pebble is active. */
export function memoryCost(state: GameState, defs: GameDefs): number {
  const galet = memoryGalet(state, defs)
  const fraction = galet ? galet.effect.value : 0.1
  return Math.max(1, Math.round(state.complexity * fraction))
}

/** Pays the attempt's stake. Returns the new state, or `null` if the player can't
 *  afford it. Pure: the store and the sim both reuse this. */
export function memoryStart(state: GameState, defs: GameDefs): GameState | null {
  const cost = memoryCost(state, defs)
  if (state.complexity < cost) return null
  return { ...state, complexity: state.complexity - cost }
}

/** Records a win for the CURRENT era: +1 level (the engine derives the resource
 *  multiplier as MEMORY_BOOST^level). No-op if the era is already maxed. Pure
 *  (shared by store and sim). */
export function memoryWin(state: GameState, defs: GameDefs): GameState {
  const era = defs.eras.find((e) => e.id === state.currentEraId) ?? defs.eras[0]
  if (!era || memoryEraMaxed(state, era.id)) return state
  return {
    ...state,
    memoryLevels: { ...state.memoryLevels, [era.id]: (state.memoryLevels[era.id] ?? 0) + 1 },
  }
}
