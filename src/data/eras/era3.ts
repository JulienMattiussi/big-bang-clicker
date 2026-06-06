import type { ConverterDef, EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * Era 3 - Stellar forges. Inside stars, fusion forges heavy elements. The forge
 * consumes era 2 stars (cohabitation): matter transforms (Lavoisier).
 */

export const era3Resources: ResourceDef[] = [
  { id: 'fusion', eraId: 'e3', nameKey: 'res.fusion', icon: 'flame', tier: 4, isBase: true },
  { id: 'heavyElement', eraId: 'e3', nameKey: 'res.heavyElement', icon: 'hexagon', tier: 6 },
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

export const era3Converters: ConverterDef[] = [
  {
    id: 'forge',
    eraId: 'e3',
    nameKey: 'conv.forge',
    inputs: [
      { resource: 'fusion', amount: 10 },
      { resource: 'star', amount: 1 },
    ],
    outputs: [{ resource: 'heavyElement', amount: 1 }],
    baseRate: 0.5,
    cost: [{ resource: 'fusion', base: 250, growth: 1.15 }],
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
  resources: ['fusion', 'heavyElement'],
  generators: ['pressure'],
  converters: ['forge'],
  upgrades: [],
  crises: [],
}
