import type { ConverterDef, EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * Era 0 - Big Bang & cooling. Cooling the plasma freezes out particles; binding
 * them (confinement) forms the first nucleons.
 */

export const era0Resources: ResourceDef[] = [
  { id: 'particle', eraId: 'e0', nameKey: 'res.particle', icon: 'sparkles', tier: 0, isBase: true },
  { id: 'nucleon', eraId: 'e0', nameKey: 'res.nucleon', icon: 'nucleon', tier: 1 },
]

export const era0Generators: GeneratorDef[] = [
  {
    id: 'expansion',
    eraId: 'e0',
    nameKey: 'gen.expansion',
    output: 'particle',
    baseRate: 1,
    // Level 1 reachable after 100 clicks (each click = +1 particle).
    cost: [{ resource: 'particle', base: 100, growth: 1.12 }],
  },
]

export const era0Converters: ConverterDef[] = [
  {
    id: 'confinement',
    eraId: 'e0',
    nameKey: 'conv.confinement',
    inputs: [{ resource: 'particle', amount: 5 }],
    outputs: [{ resource: 'nucleon', amount: 1 }],
    baseRate: 0.5,
    // After expansion: automate production first, then conversion.
    cost: [{ resource: 'particle', base: 250, growth: 1.15 }],
  },
]

export const era0: EraDef = {
  id: 'e0',
  index: 0,
  nameKey: 'era.e0.name',
  accrocheKey: 'era.e0.accroche',
  stockKey: 'era.e0.stock',
  machinesKey: 'era.e0.machines',
  verbKey: 'era.e0.verb',
  clickResource: 'particle',
  icon: 'flame',
  uiTier: 'cosmos',
  widget: 'cooling',
  unlock: {}, // unlocked from the start
  resources: ['particle', 'nucleon'],
  generators: ['expansion'],
  converters: ['confinement'],
  upgrades: [],
  crises: [],
}
