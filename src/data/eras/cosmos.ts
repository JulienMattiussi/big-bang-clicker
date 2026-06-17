import { buildEra, type EraBundle } from './factory'

/**
 * COSMOS tier (eras 0 to 4): from the Big Bang to the solar system. These early
 * eras were once bespoke files; they now go through the same factory as the
 * rest. Eras 0/1/4 are single-recipe; eras 2 and 3 are genuine chains (a star
 * becomes a galaxy; fusion forges helium -> carbon -> silicon -> heavy elements).
 */
const bundles: EraBundle[] = [
  // Big Bang & cooling: cooling the plasma freezes out particles; binding them
  // (confinement) forms the first nucleons.
  buildEra({
    id: 'e1',
    index: 0,
    uiTier: 'cosmos',
    icon: 'flame',
    widget: 'cooling',
    base: { id: 'particle', icon: 'sparkles', tier: 0 },
    generatorId: 'expansion',
    // No unlockComplexity: the starting era is unlocked from the start.
    chain: [
      {
        produces: { id: 'nucleon', icon: 'nucleon', tier: 1 },
        converterId: 'confinement',
        inputs: [{ resource: 'particle', amount: 5 }],
      },
    ],
  }),
  // Recombination: electrons bind to nucleons (from era 0, which must keep
  // running) to form the first hydrogen atoms. Cross-era chaining.
  buildEra({
    id: 'e2',
    index: 1,
    uiTier: 'cosmos',
    icon: 'orbit',
    widget: 'bohr',
    base: { id: 'electron', icon: 'electron', tier: 1 },
    generatorId: 'capture',
    generatorGrowth: 1.13,
    unlockComplexity: 30,
    chain: [
      {
        produces: { id: 'hydrogen', icon: 'atom', tier: 2, symbol: 'H' },
        converterId: 'recombination',
        inputs: [
          { resource: 'nucleon', amount: 1 },
          { resource: 'electron', amount: 1 },
        ],
      },
    ],
  }),
  // First stars & galaxies: gravity collapses gas clouds; ignition consumes era 1
  // hydrogen to form stars, which assemble into galaxies.
  buildEra({
    id: 'e3',
    index: 2,
    uiTier: 'cosmos',
    icon: 'star-cluster',
    widget: 'galaxy',
    base: { id: 'gasCloud', icon: 'cloud', tier: 3 },
    generatorId: 'collapse',
    unlockComplexity: 250,
    chain: [
      {
        produces: { id: 'star', icon: 'star', tier: 4 },
        converterId: 'ignition',
        inputs: [
          { resource: 'gasCloud', amount: 10 },
          { resource: 'hydrogen', amount: 1 },
        ],
      },
      {
        produces: { id: 'galaxy', icon: 'ellipse', tier: 5 },
        converterId: 'galaxyAssembly',
        inputs: [{ resource: 'star', amount: 5 }],
        baseRate: 0.3,
        cost: [{ resource: 'star', base: 30, growth: 1.18 }],
      },
    ],
  }),
  // Stellar forges: inside stars, fusion forges ever heavier elements. The
  // periodic-table widget labels each recipe by its product element, so the
  // converters use `res.<element>` keys. Only heavy elements (iron) really pay
  // off in Complexity (high tier); intermediates are low tier on purpose.
  buildEra({
    id: 'e4',
    index: 3,
    uiTier: 'cosmos',
    icon: 'hexagon',
    widget: 'periodic',
    layout: 'wide',
    base: { id: 'fusion', icon: 'fusion', tier: 4 },
    generatorId: 'pressure',
    generatorRate: 1.1, // +10% productivity across this era's machines
    unlockComplexity: 600,
    chain: [
      {
        produces: { id: 'helium', icon: 'atom', tier: 1, symbol: 'He' },
        converterId: 'fuseHelium',
        nameKey: 'res.helium',
        outputAmount: 1.1,
        inputs: [{ resource: 'fusion', amount: 3.8 }], // -5% consumption
        cost: [{ resource: 'fusion', base: 80, growth: 1.18 }],
      },
      {
        produces: { id: 'carbon', icon: 'hexagon', tier: 1, symbol: 'C' },
        converterId: 'fuseCarbon',
        nameKey: 'res.carbon',
        outputAmount: 1.1,
        inputs: [{ resource: 'helium', amount: 2.85 }], // -5% consumption
        baseRate: 0.4,
        // Upgrading also needs the previous element, which scales like the fusion cost.
        cost: [
          { resource: 'fusion', base: 200, growth: 1.18 },
          { resource: 'helium', base: 30, growth: 1.18 },
        ],
      },
      {
        produces: { id: 'silicon', icon: 'box', tier: 2, symbol: 'Si' },
        converterId: 'fuseSilicon',
        nameKey: 'res.silicon',
        outputAmount: 1.1,
        inputs: [
          { resource: 'carbon', amount: 0.95 }, // -5% consumption
          { resource: 'helium', amount: 0.95 },
        ],
        baseRate: 0.3,
        cost: [
          { resource: 'fusion', base: 500, growth: 1.18 },
          { resource: 'carbon', base: 25, growth: 1.18 },
        ],
      },
      {
        produces: { id: 'heavyElement', icon: 'gem', tier: 18, symbol: 'Fe' },
        converterId: 'fuseIron',
        nameKey: 'res.heavyElement',
        outputAmount: 1.1,
        inputs: [{ resource: 'silicon', amount: 1.9 }], // -5% consumption
        baseRate: 0.25,
        cost: [
          { resource: 'fusion', base: 1200, growth: 1.18 },
          { resource: 'silicon', base: 20, growth: 1.18 },
        ],
      },
    ],
  }),
  // Solar system & Earth: gravity accretes dust (enriched with era 3 heavy
  // elements) into planets. A plain single recipe, so the terse form fits.
  buildEra({
    id: 'e5',
    index: 4,
    uiTier: 'cosmos',
    icon: 'solar-system',
    widget: 'accretion',
    layout: 'wide',
    base: { id: 'dust', icon: 'dust', tier: 5 },
    combined: { id: 'planet', icon: 'globe', tier: 7 },
    consumes: 'heavyElement',
    generatorId: 'gravity',
    converterId: 'accretion',
    converterOutput: 2, // 2 planets per recipe: doubled output, same consumption
    unlockComplexity: 2500,
  }),
]

export const cosmosEras = bundles.map((b) => b.era)
export const cosmosResources = bundles.flatMap((b) => b.resources)
export const cosmosGenerators = bundles.flatMap((b) => b.generators)
export const cosmosConverters = bundles.flatMap((b) => b.converters)
