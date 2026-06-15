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
    risk: { sourceResource: 'fauna', threshold: 200_000, floor: 2_000 },
    trigger: 'threshold',
    // The extinction hits flora as hard as fauna; both rebound (the post-crisis
    // "fern spike": devastated land, then a richer recovery).
    regression: [
      { type: 'resetResource', target: 'fauna', value: 0.2 },
      { type: 'resetResource', target: 'flora', value: 0.2 },
    ],
    rebound: [
      { type: 'multiplier', target: 'fauna', value: 20 },
      { type: 'multiplier', target: 'flora', value: 20 },
    ],
    textKeys: {
      triggerKey: 'crisis.extinction.trigger',
      reboundKey: 'crisis.extinction.rebound',
    },
  },
  {
    id: 'revolt',
    eraId: 'e12',
    risk: {
      sourceResource: 'population',
      threshold: 1_000_000,
      gate: { resource: 'city', level: 100_000 },
    },
    trigger: 'threshold',
    regression: [{ type: 'resetResource', target: 'population', value: 0.5 }],
    rebound: [
      { type: 'multiplier', target: 'population', value: 8 },
      { type: 'multiplier', target: 'city', value: 8 },
    ],
    textKeys: {
      triggerKey: 'crisis.revolt.trigger',
      reboundKey: 'crisis.revolt.rebound',
    },
  },
  // Reached, not over-exploited: these e14 crises fire when the player discovers
  // the matching invention in the widget (player trigger), so they never build
  // risk on their own. threshold 1 = ready as soon as triggerCrisis sets the risk.
  {
    id: 'atomic',
    eraId: 'e14',
    risk: { threshold: 1 },
    trigger: 'player',
    regression: [
      { type: 'resetResource', target: 'research', value: 0.2 },
      { type: 'resetResource', target: 'technology', value: 0.2 },
      { type: 'resetResource', target: 'population', value: 0.2 },
      { type: 'resetResource', target: 'city', value: 0.2 },
      { type: 'resetResource', target: 'trade', value: 0.2 },
      { type: 'resetResource', target: 'empire', value: 0.2 },
    ],
    rebound: [
      { type: 'multiplier', target: 'research', value: 2 },
      { type: 'multiplier', target: 'technology', value: 2 },
      { type: 'multiplier', target: 'population', value: 2 },
      { type: 'multiplier', target: 'city', value: 2 },
      { type: 'multiplier', target: 'trade', value: 2 },
      { type: 'multiplier', target: 'empire', value: 2 },
    ],
    textKeys: {
      triggerKey: 'crisis.atomic.trigger',
      reboundKey: 'crisis.atomic.rebound',
    },
  },
  {
    id: 'crash',
    eraId: 'e14',
    risk: { threshold: 1 },
    trigger: 'player',
    regression: [
      { type: 'resetResource', target: 'research', value: 0.5 },
      { type: 'resetResource', target: 'technology', value: 0.5 },
    ],
    rebound: [
      { type: 'multiplier', target: 'research', value: 2 },
      { type: 'multiplier', target: 'technology', value: 2 },
    ],
    textKeys: {
      triggerKey: 'crisis.crash.trigger',
      reboundKey: 'crisis.crash.rebound',
    },
  },
  {
    id: 'climate',
    eraId: 'e14',
    risk: { threshold: 1 },
    trigger: 'player',
    // Same toll as the machine rebellion / nuclear war: a civilisation-wide blow.
    regression: [
      { type: 'resetResource', target: 'research', value: 0.2 },
      { type: 'resetResource', target: 'technology', value: 0.2 },
      { type: 'resetResource', target: 'population', value: 0.2 },
      { type: 'resetResource', target: 'city', value: 0.2 },
      { type: 'resetResource', target: 'trade', value: 0.2 },
      { type: 'resetResource', target: 'empire', value: 0.2 },
    ],
    rebound: [
      { type: 'multiplier', target: 'research', value: 2 },
      { type: 'multiplier', target: 'technology', value: 2 },
      { type: 'multiplier', target: 'population', value: 2 },
      { type: 'multiplier', target: 'city', value: 2 },
      { type: 'multiplier', target: 'trade', value: 2 },
      { type: 'multiplier', target: 'empire', value: 2 },
    ],
    textKeys: {
      triggerKey: 'crisis.climate.trigger',
      reboundKey: 'crisis.climate.rebound',
    },
  },
  // The bug that wasn't: global panic, a single unit of Technology lost, then a
  // healthy rebound (the derisory damage is the joke).
  {
    id: 'y2k',
    eraId: 'e14',
    risk: { threshold: 1 },
    trigger: 'player',
    regression: [{ type: 'grantResource', target: 'technology', value: -1 }],
    rebound: [{ type: 'multiplier', target: 'technology', value: 2 }],
    textKeys: {
      triggerKey: 'crisis.y2k.trigger',
      reboundKey: 'crisis.y2k.rebound',
    },
  },
  {
    id: 'machineRebellion',
    eraId: 'e14',
    risk: { threshold: 1 },
    trigger: 'player',
    // Same toll as the nuclear war: the machines turning is just as devastating.
    regression: [
      { type: 'resetResource', target: 'research', value: 0.2 },
      { type: 'resetResource', target: 'technology', value: 0.2 },
      { type: 'resetResource', target: 'population', value: 0.2 },
      { type: 'resetResource', target: 'city', value: 0.2 },
      { type: 'resetResource', target: 'trade', value: 0.2 },
      { type: 'resetResource', target: 'empire', value: 0.2 },
    ],
    rebound: [
      { type: 'multiplier', target: 'research', value: 2 },
      { type: 'multiplier', target: 'technology', value: 2 },
      { type: 'multiplier', target: 'population', value: 2 },
      { type: 'multiplier', target: 'city', value: 2 },
      { type: 'multiplier', target: 'trade', value: 2 },
      { type: 'multiplier', target: 'empire', value: 2 },
    ],
    textKeys: {
      triggerKey: 'crisis.machineRebellion.trigger',
      reboundKey: 'crisis.machineRebellion.rebound',
    },
  },
]
