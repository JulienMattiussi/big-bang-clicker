import type { CrisisDef } from '@/lib/types'

/**
 * Crises (regressions): a resource partially collapses, then rebounds (permanent
 * multiplier). Risk rises with over-exploitation of the source resource.
 * See docs/GAME-DESIGN.md section 6 and docs/NARRATIVE.md.
 */
export const crisisDefs: CrisisDef[] = [
  {
    id: 'extinction',
    eraId: 'e10',
    risk: { sourceResource: 'fauna', threshold: 200_000, telegraph: true, floor: 2_000 },
    trigger: 'threshold',
    // The extinction hits flora as hard as fauna; both rebound (the post-crisis
    // "fern spike": devastated land, then a richer recovery).
    regression: [
      { type: 'resetResource', target: 'fauna', value: 0.2 },
      { type: 'resetResource', target: 'flora', value: 0.2 },
    ],
    rebound: [
      { type: 'multiplier', target: 'fauna', value: 10 },
      { type: 'multiplier', target: 'flora', value: 10 },
    ],
    textKeys: {
      warnKey: 'crisis.extinction.warn',
      triggerKey: 'crisis.extinction.trigger',
      reboundKey: 'crisis.extinction.rebound',
    },
  },
  {
    id: 'revolt',
    eraId: 'e12',
    risk: { sourceResource: 'population', threshold: 1_000_000, telegraph: true },
    trigger: 'threshold',
    regression: [{ type: 'resetResource', target: 'population', value: 0.5 }],
    rebound: [{ type: 'multiplier', target: 'global', value: 1.5 }],
    textKeys: {
      warnKey: 'crisis.revolt.warn',
      triggerKey: 'crisis.revolt.trigger',
      reboundKey: 'crisis.revolt.rebound',
    },
  },
  {
    id: 'atomic',
    eraId: 'e14',
    risk: { sourceResource: 'technology', threshold: 5_000_000, telegraph: true },
    trigger: 'threshold',
    regression: [{ type: 'resetResource', target: 'technology', value: 0.3 }],
    rebound: [{ type: 'multiplier', target: 'technology', value: 2 }],
    textKeys: {
      warnKey: 'crisis.atomic.warn',
      triggerKey: 'crisis.atomic.trigger',
      reboundKey: 'crisis.atomic.rebound',
    },
  },
]
