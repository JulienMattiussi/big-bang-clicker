import type { ConverterDef, EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * Ère 1 - Recombinaison. Les électrons se lient aux nucléons (produits par
 * l'ère 0, qui doit donc continuer de tourner) pour former les premiers atomes
 * d'hydrogène. Démontre la cohabitation et le chaînage inter-ères.
 */

export const era1Resources: ResourceDef[] = [
  { id: 'electron', eraId: 'e1', nameKey: 'res.electron', icon: 'zap', tier: 1, isBase: true },
  { id: 'hydrogene', eraId: 'e1', nameKey: 'res.hydrogene', icon: 'atom', tier: 2 },
]

export const era1Generators: GeneratorDef[] = [
  {
    id: 'capture',
    eraId: 'e1',
    nameKey: 'gen.capture',
    output: 'electron',
    baseRate: 1,
    // Niveau 1 atteignable après 100 clics (chaque clic = +1 électron).
    cost: [{ resource: 'electron', base: 100, growth: 1.13 }],
  },
]

export const era1Converters: ConverterDef[] = [
  {
    id: 'recombinaison',
    eraId: 'e1',
    nameKey: 'conv.recombinaison',
    inputs: [
      { resource: 'nucleon', amount: 1 },
      { resource: 'electron', amount: 1 },
    ],
    outputs: [{ resource: 'hydrogene', amount: 1 }],
    baseRate: 0.5,
    // Après la capture : on automatise d'abord les électrons, puis la recombinaison.
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
  unlock: { complexity: 50 },
  resources: ['electron', 'hydrogene'],
  generators: ['capture'],
  converters: ['recombinaison'],
  upgrades: [],
  crises: [],
}
