import type { ConverterDef, EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * Ère 0 - Big Bang & refroidissement. En refroidissant le plasma, des
 * particules se figent ; en les confinant, on forme les premiers nucléons.
 */

export const era0Resources: ResourceDef[] = [
  {
    id: 'particule',
    eraId: 'e0',
    nameKey: 'res.particule',
    icon: 'sparkles',
    tier: 0,
    isBase: true,
  },
  { id: 'nucleon', eraId: 'e0', nameKey: 'res.nucleon', icon: 'circle-dot', tier: 1 },
]

export const era0Generators: GeneratorDef[] = [
  {
    id: 'expansion',
    eraId: 'e0',
    nameKey: 'gen.expansion',
    output: 'particule',
    baseRate: 1,
    // Niveau 1 atteignable après 100 clics (chaque clic = +1 particule).
    cost: [{ resource: 'particule', base: 100, growth: 1.12 }],
  },
]

export const era0Converters: ConverterDef[] = [
  {
    id: 'confinement',
    eraId: 'e0',
    nameKey: 'conv.confinement',
    inputs: [{ resource: 'particule', amount: 5 }],
    outputs: [{ resource: 'nucleon', amount: 1 }],
    baseRate: 0.5,
    // Après l'expansion : on automatise d'abord la production, puis la conversion.
    cost: [{ resource: 'particule', base: 250, growth: 1.15 }],
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
  clickResource: 'particule',
  icon: 'flame',
  uiTier: 'cosmos',
  widget: 'cooling',
  unlock: {}, // débloquée d'office au démarrage
  resources: ['particule', 'nucleon'],
  generators: ['expansion'],
  converters: ['confinement'],
  upgrades: [],
  crises: [],
}
