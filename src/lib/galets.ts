/**
 * Infinity pebbles (galets): pure helpers. Discovery is tied to a milestone
 * becoming REACHABLE (Complexity reaches the era's unlock threshold), before the
 * player crosses it. "Found once" is handled by the caller via GameState.galets.
 */

import type { GaletDef, GameDefs, GameState } from './types'

/** Pebbles whose milestone is reachable now and that are not yet found. Pebbles
 *  found through a widget (discovery: 'widget') are excluded: their widget drives
 *  their discovery, not the milestone threshold. */
export function discoverableGalets(state: GameState, defs: GameDefs): GaletDef[] {
  return defs.galets.filter((galet) => {
    if (galet.discovery === 'widget') return false
    if (state.galets?.[galet.id]?.found) return false
    const era = defs.eras.find((e) => e.id === galet.discoverEraId)
    const threshold = era?.unlock.complexity
    return threshold !== undefined && state.complexity >= threshold
  })
}

/** The widget-discovered pebble tied to `eraId` (found or not), if any. The era's
 *  interactive widget uses it to know whether to surface the pebble for a click. */
export function widgetGaletForEra(defs: GameDefs, eraId: string): GaletDef | undefined {
  return defs.galets.find((g) => g.discovery === 'widget' && g.discoverEraId === eraId)
}

/** Product of active 'widgetMultiplier' pebbles reaching `eraIdx`. Applied to the
 *  manual widget gestures (useEraMechanic), never to automated factory output. */
export function widgetGaletMultiplier(state: GameState, defs: GameDefs, eraIdx: number): number {
  let m = 1
  for (const g of defs.galets ?? []) {
    if (g.effect.type !== 'widgetMultiplier') continue
    const owned = state.galets?.[g.id]
    if (owned?.found && owned.active && eraIdx <= g.effect.maxEraIndex) m *= g.effect.value
  }
  return m
}

/** Found pebbles that boost the Complexity gain (for the effect badge on the meter). */
export function galetsAffectingComplexity(state: GameState, defs: GameDefs): GaletDef[] {
  return defs.galets.filter(
    (g) => g.effect.type === 'complexityMultiplier' && state.galets?.[g.id]?.found,
  )
}

/** Found pebbles affecting a machine of `eraId` for the given effect type. */
function galetsAffecting(
  state: GameState,
  defs: GameDefs,
  eraId: string,
  type: GaletDef['effect']['type'],
): GaletDef[] {
  const eraIdx = Number(eraId.slice(1)) || 0
  return defs.galets.filter(
    (g) => state.galets?.[g.id]?.found && g.effect.type === type && eraIdx <= g.effect.maxEraIndex,
  )
}

/** Found pebbles affecting a generator's output (primary factory badge). */
export function galetsAffectingGenerator(
  state: GameState,
  defs: GameDefs,
  generatorId: string,
): GaletDef[] {
  const gen = defs.generators[generatorId]
  return gen ? galetsAffecting(state, defs, gen.eraId, 'generatorMultiplier') : []
}

/** Found pebbles affecting a converter's output (secondary factory badge). */
export function galetsAffectingConverter(
  state: GameState,
  defs: GameDefs,
  converterId: string,
): GaletDef[] {
  const conv = defs.converters[converterId]
  return conv ? galetsAffecting(state, defs, conv.eraId, 'converterMultiplier') : []
}

/** Found pebbles easing the consumption of a TERMINAL converter (badge shown only
 *  on the last converter of each era). Empty for any other converter. */
export function galetsAffectingTerminalConverter(
  state: GameState,
  defs: GameDefs,
  converterId: string,
): GaletDef[] {
  const conv = defs.converters[converterId]
  if (!conv) return []
  const list = defs.eras.find((e) => e.id === conv.eraId)?.converters
  if (!list || list[list.length - 1] !== converterId) return []
  return galetsAffecting(state, defs, conv.eraId, 'terminalConsumption')
}
