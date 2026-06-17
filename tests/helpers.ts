import { createInitialState } from '@/lib/save'
import type { EraDef, GameDefs, GameState } from '@/lib/types'

/** État de jeu de test, avec surcharges partielles. */
export function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(0), ...overrides }
}

/** Ère de test minimale (champs non pertinents vides), avec surcharges. */
export function makeEra(overrides: Partial<EraDef> = {}): EraDef {
  return {
    id: 'e0',
    index: 0,
    nameKey: '',
    taglineKey: '',
    stockKey: '',
    machinesKey: '',
    verbKey: '',
    clickResource: 'r0',
    icon: '',
    uiTier: 'cosmos',
    widget: 'none',
    unlock: {},
    resources: [],
    generators: [],
    converters: [],
    crises: [],
    ...overrides,
  }
}

/** Définitions de jeu de test vides, avec surcharges (records partiels acceptés). */
export function makeDefs(overrides: Partial<GameDefs> = {}): GameDefs {
  return {
    eras: [],
    resources: {},
    generators: {},
    converters: {},
    crises: {},
    metaUpgrades: [],
    galets: [],
    ...overrides,
  }
}
