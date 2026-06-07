import type { GaletDef } from '@/lib/types'

/**
 * "Pebbles of infinity" (galets de l'infini): collectible stones found at
 * milestones, each with its own colour and a toggleable effect. Data-driven -
 * adding a pebble is just another entry here (+ its i18n keys + colour token).
 */
export const galetDefs: GaletDef[] = [
  {
    id: 'matter',
    nameKey: 'galet.matter.name',
    descKey: 'galet.matter.desc',
    loreKey: 'galet.matter.lore',
    color: 'var(--galet-matter)',
    motif: 'atom',
    shape: 0,
    // Found when the Life milestone (era 5) becomes reachable, before crossing it.
    discoverEraId: 'e5',
    effect: { type: 'generatorMultiplier', maxEraIndex: 4, value: 10 },
  },
  {
    id: 'life',
    nameKey: 'galet.life.name',
    descKey: 'galet.life.desc',
    loreKey: 'galet.life.lore',
    color: 'var(--galet-life)',
    motif: 'cell',
    shape: 1,
    // Found once First life (e6) is reached and the next milestone (e7, 80k)
    // becomes reachable. Boosts secondary factories up to the First-life era.
    discoverEraId: 'e7',
    effect: { type: 'converterMultiplier', maxEraIndex: 6, value: 5 },
  },
]

/** Planned size of the collection (a wink at the six infinity stones). */
export const GALET_SLOTS = 6
