/**
 * Save: initial state, versioned serialization + migrations, offline-idle
 * computation, localStorage persistence and export/import.
 * See docs/ARCHITECTURE.md section 9.
 */

import type { EraId, GameDefs, GameState } from './types'
import { tick } from './engine'
import { sign } from './integrity'

/** v2 introduced the signed save envelope; v3 stopped baking memory/crisis
 *  multipliers into `multipliers` (now derived from levels/counts); v4 merged the
 *  Intergalactic era into the Intergalactic Voyage and shifted later era ids; v5
 *  dropped the dead `upgrades` field; v6 renumbered era ids to 1-based. */
export const SAVE_VERSION = 6
const SAVE_KEY = 'big-bang-clicker:save'
/** Cap on the offline-idle credit (anti clock-cheat). */
const DEFAULT_OFFLINE_CAP_SECONDS = 60 * 60 * 8
/** Thrown when a save fails its integrity check (edited outside the game). */
export const TAMPER_ERROR = 'save-tampered'

export function createInitialState(now: number, firstEraId: EraId = ''): GameState {
  return {
    version: SAVE_VERSION,
    startedAt: now,
    lastSeen: now,
    currentEraId: firstEraId,
    unlockedEras: firstEraId ? [firstEraId] : [],
    resources: {},
    generators: {},
    converters: {},
    crises: {},
    multipliers: {},
    complexity: 0,
    echoes: 0,
    metaUpgrades: {},
    totalComplexityEver: 0,
    discovered: {},
    seenEvents: {},
    galets: {},
    memoryLevels: {},
    complexityBoosts: {},
    cityPairs: [],
    inventions: 0,
    pendingEvents: [],
    eventsInitialized: false,
  }
}

type Migration = (state: GameState) => GameState

/**
 * Schema migrations vN -> vN+1. Any save-schema change adds an entry here; we
 * never break a save without a migration.
 */
const migrations: Record<number, Migration> = {
  // v1 -> v2: the signed envelope is a storage-layer concern, no state change.
  1: (state) => ({ ...state, version: 2 }),
  // v2 -> v3: memory/crisis multipliers are no longer baked into `multipliers`
  // (the engine derives them from memoryLevels + crisis counts). Drop the baked
  // values so they are not double-counted; meta is recomputed by applyMeta on
  // load, memory/crisis are derived live (so the current data values apply).
  2: (state) => ({ ...state, multipliers: {}, version: 3 }),
  // v3 -> v4: the standalone "Intergalactic" era (bridges/clusters) was merged into
  // the Intergalactic Voyage (e16). Later eras shift down one slot: old e18
  // Unification -> e17, old e19 Explosion -> e18. Remap the saved era ids (a save
  // stranded mid-merge falls back to e16). Resource/generator/converter ids are
  // unchanged, so their stocks carry over untouched.
  3: (state) => {
    const remap = (id: string): EraId =>
      id === 'e17' ? 'e16' : id === 'e18' ? 'e17' : id === 'e19' ? 'e18' : (id as EraId)
    return {
      ...state,
      unlockedEras: [...new Set(state.unlockedEras.map(remap))],
      currentEraId: remap(state.currentEraId),
      version: 4,
    }
  },
  // v4 -> v5: the per-era "upgrades" system (scaffolded since init, never built)
  // was removed. Drop the dead persisted field so it stops carrying over.
  4: (state) => {
    const next = { ...state, version: 5 } as GameState & { upgrades?: unknown }
    delete next.upgrades
    return next
  },
  // v5 -> v6: era ids renumbered 0-based -> 1-based (e0..e18 becomes e1..e19) to
  // match the in-game "Ère N" display. Shift every persisted era id and the
  // era-keyed maps.
  5: (state) => {
    const shift = (id: string): EraId => `e${(Number(id.slice(1)) || 0) + 1}`
    const remapKeys = (rec: Record<string, number>): Record<string, number> => {
      const out: Record<string, number> = {}
      for (const k in rec) out[shift(k)] = rec[k]!
      return out
    }
    return {
      ...state,
      currentEraId: shift(state.currentEraId),
      unlockedEras: state.unlockedEras.map(shift),
      memoryLevels: remapKeys(state.memoryLevels),
      complexityBoosts: remapKeys(state.complexityBoosts),
      version: 6,
    }
  },
}

export function migrate(state: GameState): GameState {
  let current = state
  while (current.version < SAVE_VERSION) {
    const step = migrations[current.version]
    if (!step) {
      current = { ...current, version: SAVE_VERSION }
      break
    }
    current = step(current)
  }
  return current
}

export function serialize(state: GameState): string {
  return JSON.stringify(state)
}

/** Fills a loaded save with default fields that may be missing. */
function withDefaults(state: GameState): GameState {
  return { ...createInitialState(state.startedAt, state.currentEraId), ...state }
}

export function deserialize(raw: string): GameState {
  return withDefaults(migrate(JSON.parse(raw) as GameState))
}

/** Signed envelope written by the game: the serialized state plus its fingerprint. */
interface SignedSave {
  d: string
  s: string
}

/** Serializes a state into a signed envelope `{ d, s }` (the on-disk format). */
export function serializeSigned(state: GameState): string {
  const d = serialize(state)
  return JSON.stringify({ d, s: sign(d) } satisfies SignedSave)
}

/**
 * Parses a stored/imported payload, verifying integrity. Only a **signed envelope**
 * `{ d, s }` is accepted; anything else (unsigned/bare data, stripped envelope) is
 * rejected with TAMPER_ERROR. The legacy tolerance for unsigned saves was a
 * transition aid and has been removed now that all saves are signed.
 *
 * RESILIENT TO GAME EVOLUTION (do not break these two invariants):
 * 1. We verify the EXACT stored bytes `parsed.d` against `parsed.s`, never a
 *    re-serialization. Adding a field to the game later cannot change those bytes,
 *    so a legit untouched save still matches.
 * 2. Verification happens BEFORE deserialize() (migrate + withDefaults). New
 *    fields are added AFTER the check, so a save made before a field existed is
 *    accepted and simply gains the field's default. Likewise, the integrity SALT
 *    must stay constant forever, or every existing save would wrongly be rejected.
 */
export function parseSaved(raw: string): GameState {
  const parsed = JSON.parse(raw) as Partial<SignedSave>
  if (typeof parsed.d !== 'string' || typeof parsed.s !== 'string') throw new Error(TAMPER_ERROR)
  if (sign(parsed.d) !== parsed.s) throw new Error(TAMPER_ERROR)
  return deserialize(parsed.d)
}

/**
 * Credits production accumulated since `lastSeen`, capped. Updates `lastSeen`.
 * Call on resume.
 */
export function applyOffline(
  state: GameState,
  defs: GameDefs,
  now: number,
  capSeconds = DEFAULT_OFFLINE_CAP_SECONDS,
): GameState {
  const elapsed = Math.max(0, (now - state.lastSeen) / 1000)
  const capped = Math.min(elapsed, capSeconds)
  const advanced = capped > 0 ? tick(state, defs, capped) : state
  return { ...advanced, lastSeen: now }
}

export function saveToStorage(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, serializeSigned(state))
  } catch {
    // Storage unavailable (private mode, quota...): ignore silently.
  }
}

/** Result of a load: the state (null when none/rejected) and whether a stored save
 *  was rejected for failing its integrity check (so the UI can react). */
export interface LoadResult {
  state: GameState | null
  tampered: boolean
}

export function loadFromStorage(): LoadResult {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(SAVE_KEY)
  } catch {
    return { state: null, tampered: false }
  }
  if (!raw) return { state: null, tampered: false }
  try {
    return { state: parseSaved(raw), tampered: false }
  } catch (e) {
    // A failed integrity check is reported so the player learns the save was
    // rejected; any other parse error just yields a fresh game.
    return { state: null, tampered: e instanceof Error && e.message === TAMPER_ERROR }
  }
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(b64: string): string {
  const binary = atob(b64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Exportable string (base64 of the signed envelope), for copy or download. */
export function exportSave(state: GameState): string {
  return toBase64(serializeSigned(state))
}

/** Rebuilds a state from an exported string (integrity-checked and migrated).
 *  Throws TAMPER_ERROR if the code was edited, or on any malformed input. */
export function importSave(encoded: string): GameState {
  return parseSaved(fromBase64(encoded.trim()))
}
