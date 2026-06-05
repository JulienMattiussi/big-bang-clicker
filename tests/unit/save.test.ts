import { describe, it, expect } from 'vitest'
import {
  SAVE_VERSION,
  applyOffline,
  createInitialState,
  deserialize,
  exportSave,
  importSave,
  migrate,
  serialize,
} from '@/lib/save'
import type { GameDefs } from '@/lib/types'

const defs: GameDefs = {
  eras: [],
  resources: { quark: { id: 'quark', eraId: 'e0', nameKey: '', tier: 0, isBase: true } },
  generators: {
    quarkGen: {
      id: 'quarkGen',
      eraId: 'e0',
      nameKey: '',
      output: 'quark',
      baseRate: 1,
      cost: [{ resource: 'quark', base: 10, growth: 1.1 }],
    },
  },
  converters: {},
  upgrades: {},
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
