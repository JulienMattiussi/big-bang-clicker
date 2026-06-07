/**
 * Infinity pebbles (galets): pure helpers. Discovery is tied to a milestone
 * becoming REACHABLE (Complexity reaches the era's unlock threshold), before the
 * player crosses it. "Found once" is handled by the caller via GameState.galets.
 */

import type { GaletDef, GameDefs, GameState } from './types'

/** Pebbles whose milestone is reachable now and that are not yet found. */
export function discoverableGalets(state: GameState, defs: GameDefs): GaletDef[] {
  return defs.galets.filter((galet) => {
    if (state.galets?.[galet.id]?.found) return false
    const era = defs.eras.find((e) => e.id === galet.discoverEraId)
    const threshold = era?.unlock.complexity
    return threshold !== undefined && state.complexity >= threshold
  })
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
    (g) =>
      state.galets?.[g.id]?.found && g.effect.type === type && eraIdx <= g.effect.maxEraIndex,
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
