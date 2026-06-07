import { describe, it, expect } from 'vitest'
import {
  decliningResources,
  netFlows,
  resourceDependencies,
  stalledResources,
  topologicalOrder,
} from '@/lib/graph'
import { createInitialState } from '@/lib/save'
import type { GameDefs } from '@/lib/types'

const defs: GameDefs = {
  eras: [
    {
      id: 'e',
      index: 0,
      nameKey: '',
      taglineKey: '',
      stockKey: '',
      machinesKey: '',
      verbKey: '',
      clickResource: 'a',
      icon: '',
      uiTier: 'cosmos',
      widget: 'generic',
      unlock: {},
      resources: ['a', 'b', 'c'],
      generators: ['genA'],
      converters: ['makeB', 'makeC'],
      upgrades: [],
      crises: [],
    },
  ],
  resources: {
    a: { id: 'a', eraId: 'e', nameKey: '', tier: 0, isBase: true },
    b: { id: 'b', eraId: 'e', nameKey: '', tier: 1 },
    c: { id: 'c', eraId: 'e', nameKey: '', tier: 2 },
  },
  generators: {
    genA: { id: 'genA', eraId: 'e', nameKey: '', output: 'a', baseRate: 2, cost: [] },
  },
  converters: {
    makeB: {
      id: 'makeB',
      eraId: 'e',
      nameKey: '',
      inputs: [{ resource: 'a', amount: 1 }],
      outputs: [{ resource: 'b', amount: 1 }],
      baseRate: 1,
      cost: [],
    },
    makeC: {
      id: 'makeC',
      eraId: 'e',
      nameKey: '',
      inputs: [{ resource: 'b', amount: 1 }],
      outputs: [{ resource: 'c', amount: 1 }],
      baseRate: 1,
      cost: [],
    },
  },
  upgrades: {},
  crises: {},
}

describe('netFlows', () => {
  it('calcule la variation réelle par ressource', () => {
    const state = {
      ...createInitialState(0),
      generators: { genA: { level: 1 } },
      converters: { makeB: { level: 1, enabled: true }, makeC: { level: 1, enabled: true } },
    }
    const flows = netFlows(state, defs)
    expect(flows.a).toBeCloseTo(1) // +2 produit, -1 consommé
    expect(flows.b).toBeCloseTo(0) // +1 produit, -1 consommé
    expect(flows.c).toBeCloseTo(1)
  })

  it('une ressource entièrement consommée reste à ~0 (pas de négatif trompeur)', () => {
    const state = {
      ...createInitialState(0),
      generators: { genA: { level: 1 } }, // +2 a/s
      converters: { makeB: { level: 5, enabled: true } }, // veut 5 a/s, borné à 2
    }
    const flows = netFlows(state, defs)
    expect(flows.a).toBeCloseTo(0) // produit 2, consommé 2 (borné aux entrées)
    expect(flows.b).toBeCloseTo(2)
  })
})

describe('decliningResources', () => {
  it('repère une ressource consommée plus vite que produite', () => {
    const state = {
      ...createInitialState(0),
      resources: { a: 10 }, // stock présent, pas de générateur actif
      converters: { makeB: { level: 1, enabled: true } }, // consomme 1 a/s
    }
    const declining = decliningResources(state, defs)
    expect(declining.has('a')).toBe(true) // -1/s
    expect(declining.has('b')).toBe(false) // +1/s
  })

  it('repère une ressource qui se vide car sa production amont est à sec', () => {
    const state = {
      ...createInitialState(0),
      resources: { a: 0, b: 10 }, // makeB à sec (pas de 'a'), 'b' en stock
      converters: { makeB: { level: 1, enabled: true }, makeC: { level: 1, enabled: true } },
    }
    // makeB produit 0 (a=0), makeC consomme 1 b/s -> 'b' réel -1/s (capacité nominale trompeuse)
    expect(decliningResources(state, defs).has('b')).toBe(true)
  })
})

describe('stalledResources', () => {
  it("repère une production bloquée à zéro (machine affamée d'un intrant)", () => {
    const state = {
      ...createInitialState(0),
      unlockedEras: ['e'],
      resources: { a: 0 }, // pas d'intrant, pas de générateur
      converters: { makeB: { level: 1, enabled: true } }, // pourrait produire b, mais à sec
    }
    const stalled = stalledResources(state, defs)
    expect(stalled.has('b')).toBe(true) // recette dispo, b révélé, mais réel 0/s
    expect(stalled.has('a')).toBe(false) // 'a' n'est pas une sortie de recette
  })

  it('ne signale pas une production qui tourne réellement', () => {
    const state = {
      ...createInitialState(0),
      unlockedEras: ['e'],
      generators: { genA: { level: 1 } }, // alimente 'a'
      converters: { makeB: { level: 1, enabled: true } },
    }
    expect(stalledResources(state, defs).has('b')).toBe(false)
  })
})

describe('dépendances', () => {
  it('liste les entrées directes de chaque ressource', () => {
    const deps = resourceDependencies(defs)
    expect(deps.b).toEqual(['a'])
    expect(deps.c).toEqual(['b'])
  })
})

describe('tri topologique', () => {
  it('ordonne les entrées avant les sorties', () => {
    const { order, hasCycle } = topologicalOrder(defs)
    expect(hasCycle).toBe(false)
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'))
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('c'))
  })

  it('détecte un cycle', () => {
    const cyclic: GameDefs = {
      ...defs,
      converters: {
        xy: {
          id: 'xy',
          eraId: 'e',
          nameKey: '',
          inputs: [{ resource: 'x', amount: 1 }],
          outputs: [{ resource: 'y', amount: 1 }],
          baseRate: 1,
          cost: [],
        },
        yx: {
          id: 'yx',
          eraId: 'e',
          nameKey: '',
          inputs: [{ resource: 'y', amount: 1 }],
          outputs: [{ resource: 'x', amount: 1 }],
          baseRate: 1,
          cost: [],
        },
      },
    }
    expect(topologicalOrder(cyclic).hasCycle).toBe(true)
  })
})
