import { buildEra, type EraBundle } from './factory'

/** CIVILIZATION tier (eras 11 to 14): from intelligence to technology. */
const bundles: EraBundle[] = [
  buildEra({
    id: 'e11',
    index: 11,
    uiTier: 'civilization',
    icon: 'brain',
    widget: 'memory',
    base: { id: 'tool', icon: 'hammer', tier: 12 },
    combined: { id: 'knowledge', icon: 'brain', tier: 14 },
    consumes: 'fauna',
    generatorId: 'toolmaking',
    converterId: 'learning',
    unlockComplexity: 8_000_000,
  }),
  buildEra({
    id: 'e12',
    index: 12,
    uiTier: 'civilization',
    icon: 'landmark',
    widget: 'city',
    base: { id: 'population', icon: 'users', tier: 13 },
    combined: { id: 'city', icon: 'city', tier: 15 },
    consumes: 'knowledge',
    generatorId: 'birthRate',
    converterId: 'construction',
    unlockComplexity: 25_000_000,
  }),
  buildEra({
    id: 'e13',
    index: 13,
    uiTier: 'civilization',
    icon: 'swords',
    widget: 'map',
    base: { id: 'trade', icon: 'coins', tier: 14 },
    combined: { id: 'empire', icon: 'crown', tier: 16 },
    consumes: 'city',
    generatorId: 'market',
    converterId: 'conquest',
    unlockComplexity: 80_000_000,
  }),
  buildEra({
    id: 'e14',
    index: 14,
    uiTier: 'civilization',
    // Era icon (industry) kept distinct from its resources (research, technology).
    icon: 'hammer',
    base: { id: 'research', icon: 'flask', tier: 15 },
    combined: { id: 'technology', icon: 'cpu', tier: 17 },
    consumes: 'empire',
    generatorId: 'laboratory',
    converterId: 'invention',
    unlockComplexity: 250_000_000,
  }),
]

export const civilizationEras = bundles.map((b) => b.era)
export const civilizationResources = bundles.flatMap((b) => b.resources)
export const civilizationGenerators = bundles.flatMap((b) => b.generators)
export const civilizationConverters = bundles.flatMap((b) => b.converters)
