import type { EraDef, GeneratorDef, ResourceDef } from '@/lib/types'

/**
 * TRANSCENDENCE tier (era 18) - Explosion. Final era: accumulate tension until
 * you can transcend (prestige / new Big Bang). No converter; the prestige action
 * happens via PrestigeBanner.
 */

export const era18Resources: ResourceDef[] = [
  { id: 'tension', eraId: 'e18', nameKey: 'res.tension', icon: 'zap', tier: 20, isBase: true },
]

export const era18Generators: GeneratorDef[] = [
  {
    id: 'instability',
    eraId: 'e18',
    nameKey: 'gen.instability',
    output: 'tension',
    baseRate: 1,
    cost: [{ resource: 'tension', base: 100, growth: 1.12 }],
  },
]

export const era18: EraDef = {
  id: 'e18',
  index: 18,
  nameKey: 'era.e18.name',
  taglineKey: 'era.e18.tagline',
  stockKey: 'era.e18.stock',
  machinesKey: 'era.e18.machines',
  verbKey: 'era.e18.verb',
  clickResource: 'tension',
  icon: 'burst',
  uiTier: 'transcendence',
  widget: 'cooling',
  unlock: { complexity: 25_000_000_000 },
  resources: ['tension'],
  generators: ['instability'],
  converters: [],
  upgrades: [],
  crises: [],
}
