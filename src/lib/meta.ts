/**
 * Prestige meta-upgrades logic: compute the global meta multiplier from owned
 * upgrades, and buy one. The meta multiplier is stored in `multipliers.meta`
 * so the engine applies it to all production. See docs/GAME-DESIGN.md.
 */

import type { GameDefs, GameState } from './types'

/** Product of the multipliers of all owned meta-upgrades (1 if none). */
export function metaMultiplier(state: GameState, defs: GameDefs): number {
  let total = 1
  for (const def of defs.metaUpgrades) {
    if (state.metaUpgrades[def.id]) total *= def.multiplier
  }
  return total
}

export function canBuyMeta(state: GameState, defs: GameDefs, id: string): boolean {
  const def = defs.metaUpgrades.find((m) => m.id === id)
  return !!def && !state.metaUpgrades[id] && state.echoes >= def.echoCost
}

/** Stores the current meta multiplier into `multipliers.meta`. */
export function applyMeta(state: GameState, defs: GameDefs): GameState {
  return { ...state, multipliers: { ...state.multipliers, meta: metaMultiplier(state, defs) } }
}

/** Buys a meta-upgrade if affordable and not owned, then refreshes the multiplier. */
export function buyMeta(state: GameState, defs: GameDefs, id: string): GameState {
  if (!canBuyMeta(state, defs, id)) return state
  const def = defs.metaUpgrades.find((m) => m.id === id)!
  const next: GameState = {
    ...state,
    echoes: state.echoes - def.echoCost,
    metaUpgrades: { ...state.metaUpgrades, [id]: true },
  }
  return applyMeta(next, defs)
}
