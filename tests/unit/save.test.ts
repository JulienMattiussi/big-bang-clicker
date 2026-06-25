import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import {
  SAVE_VERSION,
  TAMPER_ERROR,
  applyOffline,
  createInitialState,
  deserialize,
  exportSave,
  importSave,
  loadFromStorage,
  migrate,
  parseSaved,
  saveToStorage,
  serialize,
  serializeSigned,
} from '@/lib/save'
import { sign } from '@/lib/integrity'
import type { GameDefs, GameState } from '@/lib/types'

const defs: GameDefs = {
  eras: [],
  resources: { quark: { id: 'quark', eraId: 'e1', nameKey: '', tier: 0, isBase: true } },
  generators: {
    quarkGen: {
      id: 'quarkGen',
      eraId: 'e1',
      nameKey: '',
      output: 'quark',
      baseRate: 1,
      cost: [{ resource: 'quark', base: 10, growth: 1.1 }],
    },
  },
  converters: {},
  crises: {},
}

describe('état initial', () => {
  it('crée un état à la version courante', () => {
    const state = createInitialState(1000)
    expect(state.version).toBe(SAVE_VERSION)
    expect(state.complexity).toBe(0)
    expect(state.lastSeen).toBe(1000)
  })

  it('initialise la première ère si fournie', () => {
    const state = createInitialState(0, 'era-0')
    expect(state.currentEraId).toBe('era-0')
    expect(state.unlockedEras).toEqual(['era-0'])
  })
})

describe('sérialisation', () => {
  it('fait un aller-retour fidèle', () => {
    const state = createInitialState(42)
    expect(deserialize(serialize(state))).toEqual(state)
  })
})

describe('migrations', () => {
  it('relève une sauvegarde plus ancienne à la version courante', () => {
    const old = { ...createInitialState(0), version: 0 }
    expect(migrate(old).version).toBe(SAVE_VERSION)
  })

  it('v2 -> v3 : purge les multiplicateurs gravés (désormais dérivés)', () => {
    const v2 = { ...createInitialState(0), version: 2, multipliers: { fauna: 10, global: 1.5 } }
    const migrated = migrate(v2)
    expect(migrated.version).toBe(SAVE_VERSION)
    expect(migrated.multipliers).toEqual({})
  })

  it('v1 -> ... : traverse toute la chaîne de migrations sans casser', () => {
    const v1 = { ...createInitialState(0), version: 1 }
    const migrated = migrate(v1)
    expect(migrated.version).toBe(SAVE_VERSION)
    expect(migrated.rebirths).toBe(0) // ajouté par la migration v6 -> v7
  })

  it('v7 -> v8 : amorce inventionsPeak depuis le compte courant', () => {
    const v7: GameState = { ...createInitialState(0), version: 7, inventions: 4 }
    delete (v7 as Partial<GameState>).inventionsPeak
    const migrated = migrate(v7)
    expect(migrated.version).toBe(SAVE_VERSION)
    expect(migrated.inventionsPeak).toBe(4)
  })

  it('v8 -> v9 : renomme les ids de méta-upgrades possédés sans les perdre', () => {
    const v8: GameState = {
      ...createInitialState(0),
      version: 8,
      metaUpgrades: { spark: true, rebirth: true },
    }
    const migrated = migrate(v8)
    expect(migrated.version).toBe(SAVE_VERSION)
    expect(migrated.metaUpgrades).toEqual({ boostProduction: true, boostGalet: true })
  })

  it('v5 -> v6 : renumérote les ids d ère (0-based -> 1-based)', () => {
    const v5 = {
      ...createInitialState(0),
      version: 5,
      currentEraId: 'e0',
      unlockedEras: ['e0', 'e1'],
      memoryLevels: { e0: 2 },
      complexityBoosts: { e1: 1 },
    }
    const migrated = migrate(v5)
    expect(migrated.currentEraId).toBe('e1')
    expect(migrated.unlockedEras).toEqual(['e1', 'e2'])
    expect(migrated.memoryLevels).toEqual({ e1: 2 })
    expect(migrated.complexityBoosts).toEqual({ e2: 1 })
  })
})

describe('loadFromStorage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('renvoie null sans sauvegarde stockée', () => {
    expect(loadFromStorage()).toEqual({ state: null, tampered: false })
  })

  it('relit une sauvegarde valide écrite par le jeu', () => {
    const state = { ...createInitialState(7), complexity: 321 }
    saveToStorage(state)
    const loaded = loadFromStorage()
    expect(loaded.tampered).toBe(false)
    expect(loaded.state?.complexity).toBe(321)
  })

  it('signale une sauvegarde altérée (tampered) sans la charger', () => {
    saveToStorage(createInitialState(0))
    const key = localStorage.key(0)!
    const env = JSON.parse(localStorage.getItem(key)!)
    const hacked = { ...JSON.parse(env.d), complexity: 999_999 }
    localStorage.setItem(key, JSON.stringify({ d: JSON.stringify(hacked), s: env.s }))
    expect(loadFromStorage()).toEqual({ state: null, tampered: true })
  })

  it('renvoie un état nul (non altéré) sur un JSON illisible', () => {
    saveToStorage(createInitialState(0))
    const key = localStorage.key(0)!
    localStorage.setItem(key, 'not json{')
    expect(loadFromStorage()).toEqual({ state: null, tampered: false })
  })
})

describe('idle hors-ligne', () => {
  it('crédite la production écoulée et met à jour lastSeen', () => {
    const state = { ...createInitialState(0), generators: { quarkGen: { level: 1 } } }
    const next = applyOffline(state, defs, 5000)
    expect(next.resources.quark).toBeCloseTo(5)
    expect(next.lastSeen).toBe(5000)
  })

  it('plafonne le temps hors-ligne', () => {
    const state = { ...createInitialState(0), generators: { quarkGen: { level: 1 } } }
    const next = applyOffline(state, defs, 1_000_000, 10)
    expect(next.resources.quark).toBeCloseTo(10)
  })
})

describe('export / import', () => {
  it('fait un aller-retour fidèle', () => {
    const state = { ...createInitialState(7), complexity: 123, resources: { quark: 5 } }
    expect(importSave(exportSave(state))).toEqual(state)
  })
})

describe('intégrité', () => {
  it('accepte une enveloppe signée par le jeu (aller-retour)', () => {
    const state = { ...createInitialState(7), complexity: 123 }
    expect(parseSaved(serializeSigned(state))).toEqual(state)
  })

  it('rejette une enveloppe dont les données ont été modifiées', () => {
    const env = JSON.parse(serializeSigned(createInitialState(7)))
    const hacked = { ...JSON.parse(env.d), complexity: 999_999 }
    const raw = JSON.stringify({ d: JSON.stringify(hacked), s: env.s })
    expect(() => parseSaved(raw)).toThrow(TAMPER_ERROR)
  })

  it('rejette toute sauvegarde non signée (données brutes, plus de tolérance legacy)', () => {
    const bareOld = serialize({ ...createInitialState(0), version: 1 })
    const bareCurrent = serialize(createInitialState(0))
    expect(() => parseSaved(bareOld)).toThrow(TAMPER_ERROR)
    expect(() => parseSaved(bareCurrent)).toThrow(TAMPER_ERROR)
  })

  it("survit à l'ajout d'une variable depuis la sauvegarde (aucun faux rejet)", () => {
    // Save d'une version antérieure qui ne connaissait pas encore un champ : on
    // signe les octets TELS QU'ILS ÉTAIENT, le champ manquant est rajouté après.
    const old: Partial<GameState> = { ...createInitialState(7) }
    delete old.memoryLevels
    const d = JSON.stringify(old)
    const envelope = JSON.stringify({ d, s: sign(d) })
    const loaded = parseSaved(envelope)
    expect(loaded.memoryLevels).toEqual({}) // restauré par défaut, pas de rejet
  })
})
