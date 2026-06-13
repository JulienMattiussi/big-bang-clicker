/**
 * Shared types for the headless balance simulation and its viewer.
 * The simulation reuses the REAL game engine (src/lib) and data (src/data), so
 * the stats reflect the actual balance, not a reimplementation.
 */

export type UnlockPolicy = 'asap' | 'ready'
export type BuyStrategy = 'cheapest' | 'tierFirst'

/** A simulated player archetype. */
export interface ProfileConfig {
  id: string
  label: string
  /** Manual verb clicks per second (base resource of the active era). */
  clicksPerSecond: number
  /** Widget "complete" (free combined output) per second. */
  completesPerSecond: number
  /** How often (game-seconds) the player re-evaluates purchases. */
  decisionIntervalS: number
  strategy: BuyStrategy
  /**
   * Click behaviour:
   * - 'rate' (default): clicks at `clicksPerSecond` continuously.
   * - 'bootstrap': clicks ONLY to afford the era's first generator (the minimum
   *   to start automation), then hands off; `clicksPerSecond` caps the burst.
   */
  clickMode?: 'rate' | 'bootstrap'
  /**
   * Memory mini-game success rate PER LEVEL (index 0 = level 1, ... up to
   * MEMORY_MAX_LEVEL). Omit (or empty) for profiles that never play memory. Once
   * unlocked, the profile stakes 10% Complexity per attempt and, on success,
   * doubles the era's main-resource multiplier (so it also speeds Complexity).
   */
  memoryWinRate?: number[]
}

/** Per-era completeness at the moment the player leaves that era. */
export interface Completeness {
  generators: { total: number; active: number }
  converters: { total: number; active: number }
  resources: { total: number; revealed: number }
  fullyActivated: boolean
  /** Machine ids never activated (level 0) when leaving the era. */
  missing: string[]
}

/** Stats for one era ("palier") of one run. */
export interface MilestoneStat {
  eraId: string
  eraIndex: number
  eraName: string
  /** When this era's milestone first became reachable (canUnlock), or null. */
  reachableAtS: number | null
  /** When this era was actually unlocked, or null if never reached. */
  unlockedAtS: number | null
  /** unlockedAtS - reachableAtS: time spent grinding past the threshold. */
  grindS: number | null
  /** Starvation episodes of an upstream feeder while in this era (back-trips). */
  backTrips: number
  /** Crises of this era resolved during the run. */
  crisesResolved: number
  /** Completeness of this era when leaving it (or at run end for the last one). */
  completeness: Completeness | null
}

/** One sampled point of the progression curve. */
export interface SeriesPoint {
  t: number
  complexity: number
  eraIndex: number
}

/** The full result of one simulated run (one profile x one unlock policy). */
export interface RunResult {
  label: string
  profileId: string
  profileLabel: string
  unlockPolicy: UnlockPolicy
  config: ProfileConfig
  /** Snapshot this run belongs to (one `make sim` invocation): a sortable id and
   *  a readable label, so successive runs can be overlaid and told apart. */
  runId: string
  runLabel: string
  /** Short git commit and a hash of the game data, to know which balance this is. */
  gitCommit: string
  defsHash: string
  generatedAt: string
  /** Total simulated game-seconds. */
  totalTimeS: number
  /** Highest era index reached. */
  finalEraIndex: number
  reachedFinal: boolean
  /** True if the run hit a wall (stuck, could not progress) before the end. */
  stuck: boolean
  milestones: MilestoneStat[]
  series: SeriesPoint[]
}
