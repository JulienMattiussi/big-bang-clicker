import { describe, it, expect } from 'vitest'
import { applyClick, buyGenerator, canAfford, costAtLevel, nextCost, tick } from '@/lib/engine'
import { makeState as stateWith } from '../helpers'
import type { GameDefs } from '@/lib/types'

const defs: GameDefs = {
  eras: [],
  resources: {
    quark: { id: 'quark', eraId: 'e0', nameKey: '', tier: 0, isBase: true },
    proton: { id: 'proton', eraId: 'e0', nameKey: '', tier: 1 },
  },
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
  converters: {
    fuse: {
      id: 'fuse',
      eraId: 'e0',
      nameKey: '',
      inputs: [{ resource: 'quark', amount: 3 }],
      outputs: [{ resource: 'proton', amount: 1 }],
      baseRate: 1,
      cost: [{ resource: 'quark', base: 50, growth: 1.2 }],
    },
  },
  upgrades: {},
  crises: {},
}

describe('coûts', () => {
  it('calcule un coût géométrique', () => {
    expect(costAtLevel({ resource: 'quark', base: 10, growth: 1.1 }, 0)).toBe(10)
    expect(costAtLevel({ resource: 'quark', base: 10, growth: 1.1 }, 1)).toBeCloseTo(11)
  })

  it('agrège les coûts multi-ressources', () => {
    expect(nextCost(defs.generators.quarkGen.cost, 0)).toEqual({ quark: 10 })
  })

  it("vérifie l'abordabilité", () => {
    expect(canAfford({ quark: 10 }, { quark: 10 })).toBe(true)
    expect(canAfford({ quark: 9 }, { quark: 10 })).toBe(false)
  })
})

describe('achats', () => {
  it('achète un générateur et débite la ressource', () => {
    const next = buyGenerator(stateWith({ resources: { quark: 10 } }), defs, 'quarkGen')
    expect(next).not.toBeNull()
    expect(next!.resources.quark).toBe(0)
    expect(next!.generators.quarkGen.level).toBe(1)
  })

  it('refuse un achat non abordable', () => {
    expect(buyGenerator(stateWith({ resources: { quark: 5 } }), defs, 'quarkGen')).toBeNull()
  })
})

describe('tick', () => {
  it('produit via les générateurs', () => {
    const next = tick(stateWith({ generators: { quarkGen: { level: 2 } } }), defs, 1)
    expect(next.resources.quark).toBeCloseTo(2)
  })

  it('convertit et crédite la Complexité (pondérée par le tier)', () => {
    const next = tick(
      stateWith({
        resources: { quark: 30 },
        converters: { fuse: { level: 1, enabled: true } },
      }),
      defs,
      1,
    )
    expect(next.resources.quark).toBeCloseTo(27)
    expect(next.resources.proton).toBeCloseTo(1)
    expect(next.complexity).toBeCloseTo(1)
    expect(next.totalComplexityEver).toBeCloseTo(1)
  })

  it('borne la conversion aux entrées disponibles (pas de blocage dur)', () => {
    const next = tick(
      stateWith({
        resources: { quark: 2 },
        converters: { fuse: { level: 1, enabled: true } },
      }),
      defs,
      1,
    )
    expect(next.resources.quark).toBeCloseTo(0)
    expect(next.resources.proton ?? 0).toBeGreaterThan(0)
    expect(next.resources.quark).toBeGreaterThanOrEqual(0)
  })

  it('ignore un convertisseur désactivé', () => {
    const next = tick(
      stateWith({
        resources: { quark: 30 },
        converters: { fuse: { level: 1, enabled: false } },
      }),
      defs,
      1,
    )
    expect(next.resources.quark).toBeCloseTo(30)
  })

  it('applyClick ajoute à une ressource', () => {
    expect(applyClick(stateWith({}), 'quark', 5).resources.quark).toBe(5)
  })
})
