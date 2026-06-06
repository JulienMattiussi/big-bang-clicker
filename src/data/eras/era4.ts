import type { ConverterDef, EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * Era 4 - Solar system & Earth. Gravity accretes dust (enriched with era 3 heavy
 * elements) into planetesimals and then planets.
 */

export const era4Resources: ResourceDef[] = [
  { id: 'dust', eraId: 'e4', nameKey: 'res.dust', icon: 'sparkles', tier: 5, isBase: true },
  { id: 'planet', eraId: 'e4', nameKey: 'res.planet', icon: 'globe', tier: 7 },
]

export const era4Generators: GeneratorDef[] = [
  {
    id: 'gravity',
    eraId: 'e4',
    nameKey: 'gen.gravity',
    output: 'dust',
    baseRate: 1,
    cost: [{ resource: 'dust', base: 100, growth: 1.12 }],
  },
]

export const era4Converters: ConverterDef[] = [
  {
    id: 'accretion',
    eraId: 'e4',
    nameKey: 'conv.accretion',
    inputs: [
      { resource: 'dust', amount: 10 },
      { resource: 'heavyElement', amount: 1 },
    ],
    outputs: [{ resource: 'planet', amount: 1 }],
    baseRate: 0.5,
    cost: [{ resource: 'dust', base: 250, growth: 1.15 }],
  },
]

export const era4: EraDef = {
  id: 'e4',
  index: 4,
  nameKey: 'era.e4.name',
  accrocheKey: 'era.e4.accroche',
  stockKey: 'era.e4.stock',
  machinesKey: 'era.e4.machines',
  verbKey: 'era.e4.verb',
  clickResource: 'dust',
  icon: 'globe',
  uiTier: 'cosmos',
  widget: 'accretion',
  unlock: { complexity: 2500 },
  resources: ['dust', 'planet'],
  generators: ['gravity'],
  converters: ['accretion'],
  upgrades: [],
  crises: [],
}
