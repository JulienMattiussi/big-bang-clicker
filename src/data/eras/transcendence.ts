import type { EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * TRANSCENDENCE tier (era 18) - Explosion. Final era: the forgotten-gas crisis
 * (GasLeakGame) then the singularity widget (contract to a point) drive the New
 * Big Bang. No converter; the prestige reset is triggered from EndGameModal.
 */

export const era18Resources: ResourceDef[] = [
  { id: 'tension', eraId: 'e19', nameKey: 'res.tension', icon: 'zap', tier: 20, isBase: true },
]

export const era18Generators: GeneratorDef[] = [
  {
    id: 'instability',
    eraId: 'e19',
    nameKey: 'gen.instability',
    output: 'tension',
    baseRate: 1,
    cost: [{ resource: 'tension', base: 100, growth: 1.12 }],
  },
]

export const era18: EraDef = {
  id: 'e19',
  index: 18,
  nameKey: 'era.e19.name',
  taglineKey: 'era.e19.tagline',
  stockKey: 'era.e19.stock',
  machinesKey: 'era.e19.machines',
  verbKey: 'era.e19.verb',
  clickResource: 'tension',
  icon: 'burst',
  uiTier: 'transcendence',
  widget: 'singularity',
  layout: 'solo',
  unlock: { complexity: 18_000_000_000 },
  resources: ['tension'],
  generators: ['instability'],
  converters: [],
  crises: [],
  freezeComplexity: true,
}
