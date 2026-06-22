import type { CrisisDef } from '@/lib/types'

/**
 * Crises (regressions): a resource partially collapses, then rebounds (permanent
 * multiplier). Risk rises with over-exploitation of the source resource.
 * See docs/GAME-DESIGN.md section 6 and docs/NARRATIVE.md.
 */
export const crisisDefs: CrisisDef[] = [
  {
    id: 'extinction',
    eraId: 'e11',
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
    eraId: 'e13',
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
    eraId: 'e15',
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
    eraId: 'e15',
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
    eraId: 'e15',
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
    eraId: 'e15',
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
    eraId: 'e15',
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
  // Era 16: a chance encounter on a far galaxy with hooded, torch-wielding types
  // who turn out surprisingly tough. Fires automatically once Federations pass a
  // palier (gate), so it lands well into the era rather than at its start, and is
  // guaranteed. Overcoming it grants the Force pebble. Hits the era's own
  // resources, then a healthy rebound.
  {
    id: 'encounter',
    eraId: 'e17',
    risk: {
      sourceResource: 'federation',
      threshold: 1,
      gate: { resource: 'federation', level: 500_000 },
    },
    trigger: 'threshold',
    regression: [
      { type: 'resetResource', target: 'ship', value: 0.3 },
      { type: 'resetResource', target: 'federation', value: 0.3 },
    ],
    rebound: [
      { type: 'multiplier', target: 'ship', value: 2 },
      { type: 'multiplier', target: 'federation', value: 2 },
    ],
    textKeys: {
      triggerKey: 'crisis.encounter.trigger',
      reboundKey: 'crisis.encounter.rebound',
    },
  },
  // Era 18: once the universe-city concentrates enough wealth, a spice cartel
  // moves in to siphon it (Dune wink). Gated on universeCity so it lands well into
  // the era, guaranteed. The gate level is provisional, to retune against sim.
  // Confronted through the bespoke "reroute the spice" game (SpiceGame.tsx).
  {
    id: 'spice',
    eraId: 'e18',
    risk: {
      sourceResource: 'universeCity',
      threshold: 1,
      gate: { resource: 'universeCity', level: 250_000 },
    },
    trigger: 'threshold',
    regression: [
      { type: 'resetResource', target: 'district', value: 0.5 },
      { type: 'resetResource', target: 'universeCity', value: 0.5 },
    ],
    rebound: [
      { type: 'multiplier', target: 'district', value: 2 },
      { type: 'multiplier', target: 'universeCity', value: 2 },
    ],
    textKeys: {
      triggerKey: 'crisis.spice.trigger',
      reboundKey: 'crisis.spice.rebound',
    },
  },
  // Era 19 finale: the forgotten gas. A 'player' trigger so it never arms on its
  // own (a ready crisis would block reaching e19); useEndgame arms it on entering
  // the era. Unwinnable and effect-free - GasLeakGame just runs the 15 s countdown,
  // then this resolves so the contraction widget can take over.
  {
    id: 'gasLeak',
    eraId: 'e19',
    risk: { threshold: 1 },
    trigger: 'player',
    regression: [],
    rebound: [],
    textKeys: {
      triggerKey: 'crisis.gasLeak.trigger',
      reboundKey: 'crisis.gasLeak.rebound',
    },
  },
]
