import type { ConverterDef, EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * Era 2 - First stars & galaxies. Gravity collapses gas clouds; stellar ignition
 * consumes era 1 hydrogen (cohabitation) to form stars, which assemble into
 * galaxies.
 */

export const era2Resources: ResourceDef[] = [
  { id: 'gasCloud', eraId: 'e2', nameKey: 'res.gasCloud', icon: 'cloud', tier: 3, isBase: true },
  { id: 'star', eraId: 'e2', nameKey: 'res.star', icon: 'star', tier: 4 },
  { id: 'galaxy', eraId: 'e2', nameKey: 'res.galaxy', icon: 'ellipse', tier: 5 },
]

export const era2Generators: GeneratorDef[] = [
  {
    id: 'collapse',
    eraId: 'e2',
    nameKey: 'gen.collapse',
    output: 'gasCloud',
    baseRate: 1,
    cost: [{ resource: 'gasCloud', base: 100, growth: 1.12 }],
  },
]

export const era2Converters: ConverterDef[] = [
  {
    id: 'ignition',
    eraId: 'e2',
    nameKey: 'conv.ignition',
    inputs: [
      { resource: 'gasCloud', amount: 10 },
      { resource: 'hydrogen', amount: 1 },
    ],
    outputs: [{ resource: 'star', amount: 1 }],
    baseRate: 0.5,
    cost: [{ resource: 'gasCloud', base: 250, growth: 1.15 }],
  },
  {
    id: 'galaxyAssembly',
    eraId: 'e2',
    nameKey: 'conv.galaxyAssembly',
    inputs: [{ resource: 'star', amount: 5 }],
    outputs: [{ resource: 'galaxy', amount: 1 }],
    baseRate: 0.3,
    cost: [{ resource: 'star', base: 30, growth: 1.18 }],
  },
]

export const era2: EraDef = {
  id: 'e2',
  index: 2,
  nameKey: 'era.e2.name',
  taglineKey: 'era.e2.tagline',
  stockKey: 'era.e2.stock',
  machinesKey: 'era.e2.machines',
  verbKey: 'era.e2.verb',
  clickResource: 'gasCloud',
  icon: 'star',
  uiTier: 'cosmos',
  widget: 'galaxy',
  unlock: { complexity: 120 },
  resources: ['gasCloud', 'star', 'galaxy'],
  generators: ['collapse'],
  converters: ['ignition', 'galaxyAssembly'],
  upgrades: [],
  crises: [],
}
