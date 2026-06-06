/**
 * Save: initial state, versioned serialization + migrations, offline-idle
 * computation, localStorage persistence and export/import.
 * See docs/ARCHITECTURE.md section 9.
 */

import type { EraId, GameDefs, GameState } from './types'
import { tick } from './engine'

export const SAVE_VERSION = 1
export const SAVE_KEY = 'big-bang-clicker:save'
/** Cap on the offline-idle credit (anti clock-cheat). */
export const DEFAULT_OFFLINE_CAP_SECONDS = 60 * 60 * 8

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
    upgrades: {},
    crises: {},
    multipliers: {},
    complexity: 0,
    echoes: 0,
    metaUpgrades: {},
    totalComplexityEver: 0,
    discovered: {},
    seenEvents: {},
  }
}

type Migration = (state: GameState) => GameState

/**
 * Schema migrations vN -> vN+1. Any save-schema change adds an entry here; we
 * never break a save without a migration.
 */
const migrations: Record<number, Migration> = {
  // 1: (state) => ({ ...state, version: 2 /* new field... */ }),
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
    localStorage.setItem(SAVE_KEY, serialize(state))
  } catch {
    // Storage unavailable (private mode, quota...): ignore silently.
  }
}

export function loadFromStorage(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? deserialize(raw) : null
  } catch {
    return null
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

/** Exportable string (base64 of JSON), for copy or download. */
export function exportSave(state: GameState): string {
  return toBase64(serialize(state))
}

/** Rebuilds a state from an exported string (validated and migrated). */
export function importSave(encoded: string): GameState {
  return deserialize(fromBase64(encoded.trim()))
}
