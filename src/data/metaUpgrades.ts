import type { MetaUpgradeDef } from '@/lib/types'

/**
 * Prestige meta-upgrades: permanent global production multipliers bought with
 * Echoes. They persist across rebirths (kept in GameState.metaUpgrades).
 */
export const metaUpgradeDefs: MetaUpgradeDef[] = [
  {
    id: 'boostProduction',
    nameKey: 'meta.boostProduction.name',
    descKey: 'meta.boostProduction.desc',
    echoCost: 1,
    target: 'production',
    multiplier: 2,
  },
  {
    id: 'boostComplexity',
    nameKey: 'meta.boostComplexity.name',
    descKey: 'meta.boostComplexity.desc',
    echoCost: 1,
    target: 'complexity',
    multiplier: 1.5,
  },
  {
    id: 'boostClick',
    nameKey: 'meta.boostClick.name',
    descKey: 'meta.boostClick.desc',
    echoCost: 1,
    target: 'click',
    multiplier: 2,
  },
  {
    id: 'boostGalet',
    nameKey: 'meta.boostGalet.name',
    descKey: 'meta.boostGalet.desc',
    echoCost: 1,
    target: 'galet',
    multiplier: 2,
  },
]
