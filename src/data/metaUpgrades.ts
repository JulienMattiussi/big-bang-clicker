import type { MetaUpgradeDef } from '@/lib/types'

/**
 * Prestige meta-upgrades: permanent global production multipliers bought with
 * Echoes. They persist across rebirths (kept in GameState.metaUpgrades).
 */
export const metaUpgradeDefs: MetaUpgradeDef[] = [
  {
    id: 'spark',
    nameKey: 'meta.spark.name',
    descKey: 'meta.spark.desc',
    echoCost: 1,
    multiplier: 2,
  },
  {
    id: 'memory',
    nameKey: 'meta.memory.name',
    descKey: 'meta.memory.desc',
    echoCost: 5,
    multiplier: 2,
  },
  { id: 'echo', nameKey: 'meta.echo.name', descKey: 'meta.echo.desc', echoCost: 25, multiplier: 3 },
  {
    id: 'rebirth',
    nameKey: 'meta.rebirth.name',
    descKey: 'meta.rebirth.desc',
    echoCost: 100,
    multiplier: 5,
  },
]
