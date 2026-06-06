import type { ConverterDef, EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * Era 1 - Recombination. Electrons bind to nucleons (produced by era 0, which
 * must keep running) to form the first hydrogen atoms. Demonstrates cohabitation
 * and cross-era chaining.
 */

export const era1Resources: ResourceDef[] = [
  { id: 'electron', eraId: 'e1', nameKey: 'res.electron', icon: 'electron', tier: 1, isBase: true },
  { id: 'hydrogen', eraId: 'e1', nameKey: 'res.hydrogen', icon: 'atom', symbol: 'H', tier: 2 },
]

export const era1Generators: GeneratorDef[] = [
  {
    id: 'capture',
    eraId: 'e1',
    nameKey: 'gen.capture',
    output: 'electron',
    baseRate: 1,
    // Level 1 reachable after 100 clicks (each click = +1 electron).
    cost: [{ resource: 'electron', base: 100, growth: 1.13 }],
  },
]

export const era1Converters: ConverterDef[] = [
  {
    id: 'recombination',
    eraId: 'e1',
    nameKey: 'conv.recombination',
    inputs: [
      { resource: 'nucleon', amount: 1 },
      { resource: 'electron', amount: 1 },
    ],
    outputs: [{ resource: 'hydrogen', amount: 1 }],
    baseRate: 0.5,
    // After capture: automate electrons first, then recombination.
    cost: [{ resource: 'electron', base: 250, growth: 1.15 }],
  },
]

export const era1: EraDef = {
  id: 'e1',
  index: 1,
  nameKey: 'era.e1.name',
  accrocheKey: 'era.e1.accroche',
  stockKey: 'era.e1.stock',
  machinesKey: 'era.e1.machines',
  verbKey: 'era.e1.verb',
  clickResource: 'electron',
  icon: 'orbit',
  uiTier: 'cosmos',
  widget: 'bohr',
  unlock: { complexity: 30 },
  resources: ['electron', 'hydrogen'],
  generators: ['capture'],
  converters: ['recombination'],
  upgrades: [],
  crises: [],
}
