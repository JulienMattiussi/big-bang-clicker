import { describe, it, expect } from 'vitest'
import { netFlows, resourceDependencies, topologicalOrder } from '@/lib/graph'
import { createInitialState } from '@/lib/save'
import type { GameDefs } from '@/lib/types'

const defs: GameDefs = {
  eras: [],
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
