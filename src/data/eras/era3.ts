import type { ConverterDef, EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * Era 3 - Stellar forges. Inside stars, fusion forges ever heavier elements.
 * Interactive widget (periodic table): the player clicks element cells to fuse
 * lighter elements into heavier ones (manual recipes). The `pressure` generator
 * provides the fusion fuel passively; the verb cell also makes fuel by hand.
 */

export const era3Resources: ResourceDef[] = [
  { id: 'fusion', eraId: 'e3', nameKey: 'res.fusion', icon: 'flame', tier: 4, isBase: true },
  { id: 'helium', eraId: 'e3', nameKey: 'res.helium', icon: 'atom', symbol: 'He', tier: 5 },
  { id: 'carbon', eraId: 'e3', nameKey: 'res.carbon', icon: 'hexagon', symbol: 'C', tier: 6 },
  { id: 'silicon', eraId: 'e3', nameKey: 'res.silicon', icon: 'box', symbol: 'Si', tier: 7 },
  {
    id: 'heavyElement',
    eraId: 'e3',
    nameKey: 'res.heavyElement',
    icon: 'gem',
    symbol: 'Fe',
    tier: 8,
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

/** Manual fusion recipes (triggered by clicking the periodic table cells). */
export const era3Converters: ConverterDef[] = [
  {
    id: 'fuseHelium',
    eraId: 'e3',
    nameKey: 'res.helium',
    inputs: [{ resource: 'fusion', amount: 4 }],
    outputs: [{ resource: 'helium', amount: 1 }],
    baseRate: 0,
    cost: [],
    manual: true,
  },
  {
    id: 'fuseCarbon',
    eraId: 'e3',
    nameKey: 'res.carbon',
    inputs: [{ resource: 'helium', amount: 3 }],
    outputs: [{ resource: 'carbon', amount: 1 }],
    baseRate: 0,
    cost: [],
    manual: true,
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
    baseRate: 0,
    cost: [],
    manual: true,
  },
  {
    id: 'fuseIron',
    eraId: 'e3',
    nameKey: 'res.heavyElement',
    inputs: [{ resource: 'silicon', amount: 2 }],
    outputs: [{ resource: 'heavyElement', amount: 1 }],
    baseRate: 0,
    cost: [],
    manual: true,
  },
]

export const era3: EraDef = {
  id: 'e3',
  index: 3,
  nameKey: 'era.e3.name',
  accrocheKey: 'era.e3.accroche',
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
