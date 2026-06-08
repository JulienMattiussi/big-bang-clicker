/**
 * Global resource inventory (the "backpack"): a cross-era overview unlocked
 * mid-game, once the player juggles enough eras at once to need it. Pure helpers
 * only; the modal/button live in the UI, the announcement in events.ts.
 */

import type { EraDef, GameDefs, GameState, ResourceId } from './types'
import { revealedResources } from './reveal'

/**
 * Resource whose first appearance reveals the backpack (and fires its
 * announcement). TUNABLE: change this id to move WHEN the feature appears (see
 * the event timeline in events.ts). Default `microbe`, era 6: by then there are
 * already enough resources across eras to warrant an overview.
 */
export const BACKPACK_UNLOCK_RESOURCE = 'microbe'

/** True once the backpack is available (its unlock resource has appeared). */
export function backpackUnlocked(state: GameState): boolean {
  return (
    (state.resources[BACKPACK_UNLOCK_RESOURCE] ?? 0) > 0 ||
    !!state.discovered[BACKPACK_UNLOCK_RESOURCE]
  )
}

export interface EraInventory {
  era: EraDef
  resources: ResourceId[]
}

/**
 * Known resources grouped by era for the inventory: only unlocked eras, only
 * resources currently revealed there (sticky once produced). Era order kept.
 */
export function knownResourcesByEra(state: GameState, defs: GameDefs): EraInventory[] {
  const groups: EraInventory[] = []
  for (const era of defs.eras) {
    if (!state.unlockedEras.includes(era.id)) continue
    const revealed = revealedResources(state, defs, era)
    const resources = era.resources.filter((id) => revealed.has(id))
    if (resources.length > 0) groups.push({ era, resources })
  }
  return groups
}
