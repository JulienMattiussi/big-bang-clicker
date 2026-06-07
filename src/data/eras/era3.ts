import type { ConverterDef, EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * Era 3 - Stellar forges. Inside stars, fusion forges ever heavier elements.
 * Interactive widget (periodic table): the player clicks element cells to fuse
 * lighter elements into heavier ones (manual recipes). The `pressure` generator
 * provides the fusion fuel passively; the verb cell also makes fuel by hand.
 */

export const era3Resources: ResourceDef[] = [
  { id: 'fusion', eraId: 'e3', nameKey: 'res.fusion', icon: 'flame', tier: 4, isBase: true },
  // Only HEAVY elements reward meaningful Complexity; the intermediate elements
  // contribute very little (low tier), so the chain only really pays off at iron.
  { id: 'helium', eraId: 'e3', nameKey: 'res.helium', icon: 'atom', symbol: 'He', tier: 1 },
  { id: 'carbon', eraId: 'e3', nameKey: 'res.carbon', icon: 'hexagon', symbol: 'C', tier: 1 },
  { id: 'silicon', eraId: 'e3', nameKey: 'res.silicon', icon: 'box', symbol: 'Si', tier: 2 },
  {
    id: 'heavyElement',
    eraId: 'e3',
    nameKey: 'res.heavyElement',
    icon: 'gem',
    symbol: 'Fe',
    tier: 18,
  },
]

export const era3Generators: GeneratorDef[] = [
  {
    id: 'pressure',
    eraId: 'e3',
    nameKey: 'gen.pressure',
    output: 'fusion',
    baseRate: 1,
    cost: [{ resource: 'fusion', base: 100, growth: 1.12 }],
  },
]

/**
 * Fusion recipes. Each is clickable by hand (the periodic table cells) AND
 * automatable by buying levels (auto-fusion), like every recipe now.
 */
export const era3Converters: ConverterDef[] = [
  {
    id: 'fuseHelium',
    eraId: 'e3',
    nameKey: 'res.helium',
    inputs: [{ resource: 'fusion', amount: 4 }],
    outputs: [{ resource: 'helium', amount: 1 }],
    baseRate: 0.5,
    cost: [{ resource: 'fusion', base: 80, growth: 1.18 }],
  },
  {
    id: 'fuseCarbon',
    eraId: 'e3',
    nameKey: 'res.carbon',
    inputs: [{ resource: 'helium', amount: 3 }],
    outputs: [{ resource: 'carbon', amount: 1 }],
    baseRate: 0.4,
    // Upgrading also needs the previous element, which scales like the fusion cost.
    cost: [
      { resource: 'fusion', base: 200, growth: 1.18 },
      { resource: 'helium', base: 30, growth: 1.18 },
    ],
  },
  {
    id: 'fuseSilicon',
    eraId: 'e3',
    nameKey: 'res.silicon',
    inputs: [
      { resource: 'carbon', amount: 1 },
      { resource: 'helium', amount: 1 },
    ],
    outputs: [{ resource: 'silicon', amount: 1 }],
    baseRate: 0.3,
    cost: [
      { resource: 'fusion', base: 500, growth: 1.18 },
      { resource: 'carbon', base: 25, growth: 1.18 },
    ],
  },
  {
    id: 'fuseIron',
    eraId: 'e3',
    nameKey: 'res.heavyElement',
    inputs: [{ resource: 'silicon', amount: 2 }],
    outputs: [{ resource: 'heavyElement', amount: 1 }],
    baseRate: 0.25,
    cost: [
      { resource: 'fusion', base: 1200, growth: 1.18 },
      { resource: 'silicon', base: 20, growth: 1.18 },
    ],
  },
]

export const era3: EraDef = {
  id: 'e3',
  index: 3,
  nameKey: 'era.e3.name',
  taglineKey: 'era.e3.tagline',
  stockKey: 'era.e3.stock',
  machinesKey: 'era.e3.machines',
  verbKey: 'era.e3.verb',
  clickResource: 'fusion',
  icon: 'hexagon',
  uiTier: 'cosmos',
  widget: 'periodic',
  unlock: { complexity: 600 },
  resources: ['fusion', 'helium', 'carbon', 'silicon', 'heavyElement'],
  generators: ['pressure'],
  converters: ['fuseHelium', 'fuseCarbon', 'fuseSilicon', 'fuseIron'],
  upgrades: [],
  crises: [],
}
