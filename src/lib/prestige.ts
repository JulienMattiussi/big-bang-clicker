/**
 * Prestige (new Big Bang): Echo computation and New Game+ reset.
 * See docs/GAME-DESIGN.md section 3.3 and docs/ARCHITECTURE.md section 8.
 */

import type { GameState } from './types'

export const ECHO_K = 1
export const ECHO_BASE = 1000

/** "Earned" Echoes over the whole run (monotonic with total Complexity). */
export function lifetimeEchoes(state: GameState): number {
  if (state.totalComplexityEver <= 0) return 0
  return Math.floor(ECHO_K * Math.sqrt(state.totalComplexityEver / ECHO_BASE))
}

/** Echoes gainable by prestiging now (beyond those already held). */
export function echoesGain(state: GameState): number {
  return Math.max(0, lifetimeEchoes(state) - state.echoes)
}

export function canPrestige(state: GameState): boolean {
  return echoesGain(state) >= 1
}

/**
 * Triggers prestige: full run reset. Keeps Echoes (plus the gain), meta-upgrades,
 * the cumulative total Complexity, and the infinity pebbles (kept across rebirths).
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
    upgrades: {},
    crises: {},
    multipliers: {},
    complexity: 0,
    echoes: state.echoes + echoesGain(state),
    metaUpgrades: state.metaUpgrades,
    totalComplexityEver: state.totalComplexityEver,
    discovered: {},
    seenEvents: {},
    galets: state.galets ?? {},
    memoryLevels: {},
    complexityBoosts: {},
    cityPairs: [],
  }
}
