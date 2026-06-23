/**
 * Prestige meta-upgrades logic: compute the global meta multiplier from owned
 * upgrades, and buy one. The meta multiplier is stored in `multipliers.meta`
 * so the engine applies it to all production. See docs/GAME-DESIGN.md.
 */

import type { GameDefs, GameState, MetaTarget } from './types'

/** Product of the multipliers of owned meta-upgrades for one target (1 if none). */
export function metaMultiplier(
  state: GameState,
  defs: GameDefs,
  target: MetaTarget = 'production',
): number {
  let total = 1
  for (const def of defs.metaUpgrades) {
    if (def.target === target && state.metaUpgrades[def.id]) total *= def.multiplier
  }
  return total
}

export function canBuyMeta(state: GameState, defs: GameDefs, id: string): boolean {
  const def = defs.metaUpgrades.find((m) => m.id === id)
  return !!def && !state.metaUpgrades[id] && state.echoes >= def.echoCost
}

/** Stores each target's meta multiplier into its `multipliers` slot (read by the
 *  engine: production, Complexity, click power, pebble power). */
export function applyMeta(state: GameState, defs: GameDefs): GameState {
  return {
    ...state,
    multipliers: {
      ...state.multipliers,
      meta: metaMultiplier(state, defs, 'production'),
      metaComplexity: metaMultiplier(state, defs, 'complexity'),
      metaClick: metaMultiplier(state, defs, 'click'),
      metaGalet: metaMultiplier(state, defs, 'galet'),
    },
  }
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

/** Refunds a meta-upgrade (gives the Echo back), to undo a choice before rebirth.
 *  The caller restricts this to upgrades bought in the current session. */
export function refundMeta(state: GameState, defs: GameDefs, id: string): GameState {
  const def = defs.metaUpgrades.find((m) => m.id === id)
  if (!def || !state.metaUpgrades[id]) return state
  const next: GameState = {
    ...state,
    echoes: state.echoes + def.echoCost,
    metaUpgrades: { ...state.metaUpgrades, [id]: false },
  }
  return applyMeta(next, defs)
}
