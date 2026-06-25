/**
 * Manual widget gestures as PURE state transitions - the single source of truth
 * for "what a widget gesture produces", shared by the UI (useEraMechanic, which
 * adds the floaters/store dispatch) AND the headless balance sim. Keeping the
 * composition here (not only in the React hook) is what stops the two from
 * drifting apart (e.g. a click forgetting its clickYield factor).
 */

import type { EraDef, GameDefs, GameState, ResourceId } from '../types'
import { widgetGaletMultiplier } from '../galets'
import { applyClick, manualProduce } from './actions'
import { clickYield, converterOutputMultiplier } from './rates'

export interface GestureResult {
  state: GameState
  /** What was produced, for the caller to show as floating "+N" (UI only). */
  floaters: { resource: ResourceId; amount: number }[]
}

/** The raw "verb" click: +n of the era's base resource, scaled by clickYield (the
 *  era's generator level + all its multipliers) and the widget pebble. */
export function applyGainBase(
  state: GameState,
  defs: GameDefs,
  era: EraDef,
  n = 1,
): GestureResult {
  if (n <= 0) return { state, floaters: [] }
  const amount = n * clickYield(state, defs, era) * widgetGaletMultiplier(state, defs, era.index)
  return {
    state: applyClick(state, era.clickResource, amount),
    floaters: [{ resource: era.clickResource, amount }],
  }
}

/** A FREE completion of the era's recipe `times` (no input consumed), multiplied by
 *  the widget pebble - the manual reward that never strands the player. */
export function applyComplete(
  state: GameState,
  defs: GameDefs,
  era: EraDef,
  times = 1,
): GestureResult {
  const recipeId = era.converters[0]
  const conv = recipeId ? defs.converters[recipeId] : undefined
  if (!recipeId || !conv || times <= 0) return { state, floaters: [] }
  const runs = times * widgetGaletMultiplier(state, defs, era.index)
  let next = state
  for (let k = 0; k < runs; k++) next = manualProduce(next, defs, recipeId)
  return { state: next, floaters: conv.outputs.map((o) => ({ resource: o.resource, amount: o.amount * runs })) }
}

/** +n of the era's combined resource for a fixed base `n`, scaled by the converter
 *  LEVEL and its output multipliers + the widget pebble (dropping the recipe's flat
 *  late-game easing, so the reward stays small but grows with the factory). */
export function applyGainCombinedScaled(
  state: GameState,
  defs: GameDefs,
  era: EraDef,
  n = 1,
): GestureResult {
  const recipeId = era.converters[0]
  const combined = recipeId ? defs.converters[recipeId]?.outputs[0]?.resource : undefined
  if (!recipeId || !combined || n <= 0) return { state, floaters: [] }
  const level = state.converters[recipeId]?.level ?? 0
  const amount =
    n *
    (level + 1) *
    converterOutputMultiplier(state, defs, recipeId, combined) *
    widgetGaletMultiplier(state, defs, era.index)
  return {
    state: applyClick(state, combined, amount),
    floaters: [{ resource: combined, amount }],
  }
}
