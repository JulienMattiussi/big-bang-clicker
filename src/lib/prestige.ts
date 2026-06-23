/**
 * Prestige (new Big Bang): Echo computation and New Game+ reset.
 * See docs/GAME-DESIGN.md section 3.3 and docs/ARCHITECTURE.md section 8.
 */

import type { GameState } from './types'

/** Each rebirth grants exactly one Echo (credited when the universe collapses, not
 *  here): the reset only carries the already-earned Echoes over. */
const ECHO_PER_REBIRTH = 1

/** Onboarding events that fire once per PLAYER, not once per run: their "seen"
 *  flag survives the reset so they never replay after a rebirth (the first-machine
 *  tutorial would otherwise reappear when era 1 is played again). */
const PERSISTENT_EVENTS = ['tuto:firstMachine'] as const

/** Echoes gained by transcending: a flat one per rebirth. */
export function echoesGain(): number {
  return ECHO_PER_REBIRTH
}

/**
 * Triggers prestige: full run reset. Keeps Echoes (already credited at the
 * collapse), meta-upgrades, the cumulative total Complexity, and the infinity
 * pebbles (kept across rebirths).
 */
export function prestige(state: GameState, now: number): GameState {
  return {
    version: state.version,
    startedAt: state.startedAt,
    lastSeen: now,
    currentEraId: '',
    unlockedEras: [],
    resources: {},
    generators: {},
    converters: {},
    crises: {},
    multipliers: {},
    complexity: 0,
    echoes: state.echoes,
    metaUpgrades: state.metaUpgrades,
    totalComplexityEver: state.totalComplexityEver,
    rebirths: (state.rebirths ?? 0) + 1,
    discovered: {},
    seenEvents: Object.fromEntries(
      PERSISTENT_EVENTS.filter((id) => state.seenEvents?.[id]).map((id) => [id, true]),
    ),
    galets: state.galets ?? {},
    memoryLevels: {},
    complexityBoosts: {},
    cityPairs: [],
    inventions: 0,
    pendingEvents: [],
    // The fresh run keeps a clean slate; no backlog to suppress on a later load.
    eventsInitialized: true,
  }
}
