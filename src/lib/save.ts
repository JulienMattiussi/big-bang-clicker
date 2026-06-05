/**
 * Sauvegarde : état initial, sérialisation versionnée + migrations, calcul de
 * l'idle hors-ligne, persistance localStorage et export/import.
 * Voir docs/ARCHITECTURE.md section 9.
 */

import type { EraId, GameDefs, GameState } from './types'
import { tick } from './engine'

export const SAVE_VERSION = 1
export const SAVE_KEY = 'big-bang-clicker:save'
/** Plafond du crédit d'idle hors-ligne (anti-triche d'horloge). */
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
  }
}

type Migration = (state: GameState) => GameState

/**
 * Migrations de schéma vN -> vN+1. Toute évolution du schéma de sauvegarde
 * ajoute une entrée ici ; on ne casse jamais une save sans migration.
 */
const migrations: Record<number, Migration> = {
  // 1: (state) => ({ ...state, version: 2 /* nouveau champ... */ }),
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

/** Complète une sauvegarde lue avec les champs par défaut éventuellement absents. */
function withDefaults(state: GameState): GameState {
  return { ...createInitialState(state.startedAt, state.currentEraId), ...state }
}

export function deserialize(raw: string): GameState {
  return withDefaults(migrate(JSON.parse(raw) as GameState))
}

/**
 * Crédite la production accumulée depuis `lastSeen`, plafonnée. Met à jour
 * `lastSeen`. À appeler à la reprise.
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
    // Stockage indisponible (mode privé, quota...) : on ignore silencieusement.
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

/** Chaîne exportable (base64 de JSON), pour copie ou téléchargement. */
export function exportSave(state: GameState): string {
  return toBase64(serialize(state))
}

/** Reconstruit un état depuis une chaîne exportée (validée et migrée). */
export function importSave(encoded: string): GameState {
  return deserialize(fromBase64(encoded.trim()))
}
