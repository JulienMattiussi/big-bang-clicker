import type { EraDef, GameDefs, GameState } from '../types'
import { readyCrises } from '../crises'

export function eraIndexOf(defs: GameDefs, eraId: string): number {
  return defs.eras.find((e) => e.id === eraId)?.index ?? 0
}

export function latestUnlockedIndex(state: GameState, defs: GameDefs): number {
  let max = 0
  for (const id of state.unlockedEras) {
    const n = eraIndexOf(defs, id)
    if (n > max) max = n
  }
  return max
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
