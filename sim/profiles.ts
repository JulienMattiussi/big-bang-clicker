import type { ProfileConfig, UnlockPolicy } from './types'

/**
 * Four player archetypes, to bracket the time range rather than rely on a
 * single fragile number. Widget skill is abstracted as a manual-action rate
 * (clicks + completes per second), not the actual mini-game.
 */
export const PROFILES: ProfileConfig[] = [
  {
    id: 'minimal',
    label: 'Minimal (bootstrap)',
    // Clicks only to launch each era's first machine, then lets it run - but
    // still seeds one level of every machine so the feeder chains actually flow
    // (e.g. iron at era 3, required by the era-4 accretion recipe).
    clicksPerSecond: 8,
    completesPerSecond: 0,
    decisionIntervalS: 1,
    strategy: 'cheapest',
    clickMode: 'bootstrap',
    seedMachines: true,
  },
  {
    id: 'casual',
    label: 'Casual',
    clicksPerSecond: 2,
    completesPerSecond: 0.3,
    decisionIntervalS: 3,
    strategy: 'cheapest',
    // Plays memory occasionally; rarely clears the hardest level.
    memoryWinRate: [0.85, 0.5, 0.2],
  },
  {
    id: 'active',
    label: 'Active',
    clicksPerSecond: 6,
    completesPerSecond: 1,
    decisionIntervalS: 2,
    strategy: 'cheapest',
    memoryWinRate: [0.95, 0.78, 0.5],
    levelsEarlierFactories: true,
  },
  {
    id: 'optimal',
    label: 'Optimal',
    clicksPerSecond: 8,
    completesPerSecond: 2,
    decisionIntervalS: 1,
    strategy: 'tierFirst',
    memoryWinRate: [1, 0.9, 0.75],
    levelsEarlierFactories: true,
  },
]

export const UNLOCK_POLICIES: UnlockPolicy[] = ['asap', 'ready']
