import { buildEra, type EraBundle } from './factory'

/** SPACE tier (eras 15 to 18): from space conquest to the universe-city. */
const bundles: EraBundle[] = [
  buildEra({
    id: 'e15',
    index: 15,
    uiTier: 'space',
    icon: 'rocket',
    widget: 'rocket',
    base: { id: 'fuel', icon: 'flame', tier: 16 },
    combined: { id: 'colony', icon: 'rocket', tier: 18 },
    consumes: 'technology',
    generatorId: 'refinery',
    converterId: 'launch',
    unlockComplexity: 800_000_000,
  }),
  buildEra({
    id: 'e16',
    index: 16,
    uiTier: 'space',
    icon: 'satellite',
    base: { id: 'ship', icon: 'rocket', tier: 17 },
    combined: { id: 'federation', icon: 'satellite', tier: 19 },
    consumes: 'colony',
    generatorId: 'shipyard',
    converterId: 'colonization',
    unlockComplexity: 2_500_000_000,
  }),
  buildEra({
    id: 'e17',
    index: 17,
    uiTier: 'space',
    icon: 'network',
    base: { id: 'bridge', icon: 'network', tier: 18 },
    combined: { id: 'cluster', icon: 'disc', tier: 20 },
    consumes: 'federation',
    generatorId: 'engineering',
    converterId: 'link',
    unlockComplexity: 8_000_000_000,
  }),
  buildEra({
    id: 'e18',
    index: 18,
    uiTier: 'space',
    // Era icon (crowning unification) kept distinct from its resources (district, universe-city).
    icon: 'crown',
    base: { id: 'district', icon: 'city', tier: 19 },
    combined: { id: 'universeCity', icon: 'globe', tier: 21 },
    consumes: 'cluster',
    generatorId: 'urbanism',
    converterId: 'unification',
    unlockComplexity: 25_000_000_000,
  }),
]

export const spaceEras = bundles.map((b) => b.era)
export const spaceResources = bundles.flatMap((b) => b.resources)
export const spaceGenerators = bundles.flatMap((b) => b.generators)
export const spaceConverters = bundles.flatMap((b) => b.converters)
