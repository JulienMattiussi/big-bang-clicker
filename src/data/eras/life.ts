import { buildEra, type EraBundle } from './factory'

/** LIFE tier (eras 5 to 10): from prebiotic chemistry to the conquest of land. */
const bundles: EraBundle[] = [
  buildEra({
    id: 'e5',
    index: 5,
    uiTier: 'life',
    icon: 'dna',
    widget: 'molecule',
    base: { id: 'molecule', icon: 'molecule', tier: 6 },
    combined: { id: 'rna', icon: 'dna', tier: 8 },
    consumes: 'carbon',
    generatorId: 'chemistry',
    converterId: 'synthesis',
    unlockComplexity: 8_000,
    generatorBase: 50, // cheaper first usine for this era (less grind to start)
  }),
  buildEra({
    id: 'e6',
    index: 6,
    uiTier: 'life',
    icon: 'cell',
    widget: 'cell',
    base: { id: 'cell', icon: 'circle-dot', tier: 7 },
    combined: { id: 'microbe', icon: 'virus', tier: 9 },
    consumes: 'rna',
    generatorId: 'metabolism',
    converterId: 'division',
    unlockComplexity: 25_000,
  }),
  buildEra({
    id: 'e7',
    index: 7,
    uiTier: 'life',
    icon: 'leaf',
    widget: 'balance',
    base: { id: 'oxygen', icon: 'atom', tier: 8, symbol: 'O' },
    combined: { id: 'atmosphere', icon: 'atmosphere', tier: 10 },
    consumes: 'microbe',
    generatorId: 'cyanobacteria',
    converterId: 'oxidation',
    unlockComplexity: 80_000,
  }),
  buildEra({
    id: 'e8',
    index: 8,
    uiTier: 'life',
    icon: 'circle-dot',
    widget: 'endosymbiosis',
    base: { id: 'organelle', icon: 'hexagon', tier: 9 },
    combined: { id: 'eukaryote', icon: 'circle-dot', tier: 11 },
    consumes: 'atmosphere',
    generatorId: 'symbiosis',
    converterId: 'endosymbiosis',
    unlockComplexity: 250_000,
  }),
  buildEra({
    id: 'e9',
    index: 9,
    uiTier: 'life',
    icon: 'fish',
    widget: 'assembly',
    base: { id: 'tissue', icon: 'network', tier: 10 },
    combined: { id: 'organism', icon: 'fish', tier: 12 },
    consumes: 'eukaryote',
    generatorId: 'cellGrowth',
    converterId: 'differentiation',
    unlockComplexity: 800_000,
  }),
  buildEra({
    id: 'e10',
    index: 10,
    uiTier: 'life',
    icon: 'trees',
    widget: 'tree',
    base: { id: 'flora', icon: 'leaf', tier: 11 },
    combined: { id: 'fauna', icon: 'paw', tier: 13 },
    consumes: 'organism',
    generatorId: 'plantGrowth',
    converterId: 'evolution',
    unlockComplexity: 2_500_000,
  }),
]

export const lifeEras = bundles.map((b) => b.era)
export const lifeResources = bundles.flatMap((b) => b.resources)
export const lifeGenerators = bundles.flatMap((b) => b.generators)
export const lifeConverters = bundles.flatMap((b) => b.converters)
