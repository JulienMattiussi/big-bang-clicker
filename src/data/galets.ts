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
  {
    id: 'diversity',
    nameKey: 'galet.diversity.name',
    descKey: 'galet.diversity.desc',
    loreKey: 'galet.diversity.lore',
    color: 'var(--galet-diversity)',
    motif: 'rainbow',
    shape: 2,
    // Found by CLICKING it as it rides the Cambrian assembly belt (era 9), not by a
    // milestone. Boosts the Complexity gained from every era up to the Cambrian.
    discovery: 'widget',
    discoverEraId: 'e9',
    effect: { type: 'complexityMultiplier', maxEraIndex: 9, value: 8 },
  },
  {
    id: 'society',
    nameKey: 'galet.society.name',
    descKey: 'galet.society.desc',
    loreKey: 'galet.society.lore',
    color: 'var(--galet-society)',
    motif: 'family',
    shape: 0,
    // Earned in the Societies city widget by reaching the super-bonus harmony.
    discovery: 'widget',
    discoverEraId: 'e12',
    // Halves the input cost of every era's terminal converter up to the Societies.
    effect: { type: 'terminalConsumption', maxEraIndex: 12, value: 0.5 },
  },
  {
    id: 'spacetime',
    nameKey: 'galet.spacetime.name',
    descKey: 'galet.spacetime.desc',
    loreKey: 'galet.spacetime.lore',
    color: 'var(--galet-spacetime)',
    motif: 'hourglasses',
    shape: 1,
    // Found on the FIRST landing in the Space-conquest rocket widget.
    discovery: 'widget',
    discoverEraId: 'e15',
    // Quadruples every era's WIDGET reward (useEraMechanic), never the factories.
    effect: { type: 'widgetMultiplier', maxEraIndex: 18, value: 4 },
  },
  {
    id: 'force',
    nameKey: 'galet.force.name',
    descKey: 'galet.force.desc',
    loreKey: 'galet.force.lore',
    color: 'var(--octarine)',
    motif: 'rebel',
    shape: 3, // the saucer-ish freighter silhouette
    // Granted by overcoming the era-16 encounter crisis (the hooded fighters).
    discovery: 'crisis',
    discoverEraId: 'e16',
    // Mind control: the memory mini-game costs only 1% (eased with joker cards).
    effect: { type: 'memoryBoost', maxEraIndex: 18, value: 0.01 },
  },
]

/** Planned size of the collection (a wink at the six infinity stones). */
export const GALET_SLOTS = 6
