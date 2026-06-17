import { buildEra, type EraBundle } from './factory'

/** SPACE tier (eras 15 to 17): from space conquest to the universe-city. */
const bundles: EraBundle[] = [
  buildEra({
    id: 'e15',
    index: 15,
    uiTier: 'space',
    icon: 'telescope',
    widget: 'rocket',
    layout: 'wide',
    base: { id: 'fuel', icon: 'jerrycan', tier: 16 },
    combined: { id: 'colony', icon: 'rocket', tier: 18 },
    consumes: 'technology',
    // Colonising also burns a star (the destination), beyond fuel + technology.
    extraInputs: [{ resource: 'star', amount: 1 }],
    generatorId: 'refinery',
    generatorRate: 1.5,
    converterId: 'launch',
    converterOutput: 1.5,
    unlockComplexity: 800_000_000,
  }),
  buildEra({
    id: 'e16',
    index: 16,
    uiTier: 'space',
    icon: 'radar',
    widget: 'massrelay',
    layout: 'wide',
    base: { id: 'ship', icon: 'ship', tier: 17 },
    combined: { id: 'federation', icon: 'satellite', tier: 19 },
    consumes: 'colony',
    // Federating distant worlds also draws on the galaxies being reached (era 2).
    extraInputs: [{ resource: 'galaxy', amount: 1 }],
    generatorId: 'shipyard',
    converterId: 'colonization',
    unlockComplexity: 2_000_000_000,
  }),
  buildEra({
    id: 'e17',
    index: 17,
    uiTier: 'space',
    // Era icon (grand unification) kept distinct from its resources.
    icon: 'unification',
    widget: 'unification',
    layout: 'wide-split',
    base: { id: 'district', icon: 'district', tier: 19 },
    combined: { id: 'universeCity', icon: 'universe-city', tier: 21 },
    consumes: 'federation',
    generatorId: 'urbanism',
    converterId: 'unification',
    unlockComplexity: 6_400_000_000,
  }),
]

export const spaceEras = bundles.map((b) => b.era)
export const spaceResources = bundles.flatMap((b) => b.resources)
export const spaceGenerators = bundles.flatMap((b) => b.generators)
export const spaceConverters = bundles.flatMap((b) => b.converters)
