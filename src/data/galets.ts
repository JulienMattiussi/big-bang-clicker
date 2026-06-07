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
    color: 'var(--galet-matter)',
    motif: 'atom',
    shape: 0,
    // Found when the Life milestone (era 5) becomes reachable, before crossing it.
    discoverEraId: 'e5',
    effect: { type: 'generatorMultiplier', maxEraIndex: 4, value: 10 },
  },
]

/** Planned size of the collection (a wink at the six infinity stones). */
export const GALET_SLOTS = 6
