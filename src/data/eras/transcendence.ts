import type { EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * TRANSCENDENCE tier (era 19) - Explosion. Final era: accumulate tension until
 * you can transcend (prestige / new Big Bang). No converter; the prestige action
 * happens via PrestigeBanner.
 */

export const era19Resources: ResourceDef[] = [
  { id: 'tension', eraId: 'e19', nameKey: 'res.tension', icon: 'zap', tier: 20, isBase: true },
]

export const era19Generators: GeneratorDef[] = [
  {
    id: 'instability',
    eraId: 'e19',
    nameKey: 'gen.instability',
    output: 'tension',
    baseRate: 1,
    cost: [{ resource: 'tension', base: 100, growth: 1.12 }],
  },
]

export const era19: EraDef = {
  id: 'e19',
  index: 19,
  nameKey: 'era.e19.name',
  taglineKey: 'era.e19.tagline',
  stockKey: 'era.e19.stock',
  machinesKey: 'era.e19.machines',
  verbKey: 'era.e19.verb',
  clickResource: 'tension',
  icon: 'burst',
  uiTier: 'transcendence',
  widget: 'cooling',
  unlock: { complexity: 80_000_000_000 },
  resources: ['tension'],
  generators: ['instability'],
  converters: [],
  upgrades: [],
  crises: [],
}
