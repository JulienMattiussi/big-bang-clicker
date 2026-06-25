import { describe, it, expect } from 'vitest'
import { applyComplete, applyGainBase, applyGainCombinedScaled } from '@/lib/engine'
import { makeState, makeEra, makeDefs } from '../helpers'
import type { GaletDef } from '@/lib/types'

const era = makeEra({
  id: 'e1',
  index: 0,
  clickResource: 'base',
  generators: ['gen'],
  converters: ['conv'],
})
const baseDefs = {
  eras: [era],
  resources: {
    base: { id: 'base', eraId: 'e1', nameKey: '', tier: 1, isBase: true },
    combined: { id: 'combined', eraId: 'e1', nameKey: '', tier: 3 },
  },
  generators: {
    gen: { id: 'gen', eraId: 'e1', nameKey: '', output: 'base', baseRate: 1, cost: [] },
  },
  converters: {
    conv: {
      id: 'conv',
      eraId: 'e1',
      nameKey: '',
      inputs: [{ resource: 'base', amount: 2 }],
      outputs: [{ resource: 'combined', amount: 3 }],
      baseRate: 1,
      cost: [],
    },
  },
}
const defs = makeDefs(baseDefs)

describe('applyGainBase', () => {
  it('ajoute n × clickYield (niveau du générateur + 1) à la ressource de base', () => {
    const s = makeState({ unlockedEras: ['e1'], generators: { gen: { level: 4 } } })
    const r = applyGainBase(s, defs, era, 2)
    expect(r.state.resources.base).toBe(10) // 2 × (4 + 1)
    expect(r.floaters).toEqual([{ resource: 'base', amount: 10 }])
  })

  it('amplifié par le galet widget actif', () => {
    const wg: GaletDef = {
      id: 'wg',
      nameKey: '',
      descKey: '',
      loreKey: '',
      color: '',
      motif: '',
      discoverEraId: 'e1',
      discovery: 'widget',
      effect: { type: 'widgetMultiplier', maxEraIndex: 9, value: 2 },
    }
    const withGalet = makeDefs({ ...baseDefs, galets: [wg] })
    const s = makeState({ unlockedEras: ['e1'], galets: { wg: { found: true, active: true } } })
    // genLevel 0 -> clickYield 1, × galet 2 = 2 par clic.
    expect(applyGainBase(s, withGalet, era, 1).state.resources.base).toBe(2)
  })

  it('no-op pour n <= 0', () => {
    const s = makeState({})
    expect(applyGainBase(s, defs, era, 0)).toEqual({ state: s, floaters: [] })
  })
})

describe('applyComplete', () => {
  it('produit la recette ×times (gratuit) et crédite la Complexité', () => {
    const s = makeState({ unlockedEras: ['e1'] })
    const r = applyComplete(s, defs, era, 2)
    expect(r.state.resources.combined).toBeCloseTo(6) // 3 × 2 runs
    expect(r.state.resources.base ?? 0).toBe(0) // aucune entrée consommée
    expect(r.state.complexity).toBeCloseTo(18) // 6 produits × tier 3
    expect(r.floaters).toEqual([{ resource: 'combined', amount: 6 }])
  })

  it('no-op pour times <= 0 ou ère sans convertisseur', () => {
    const s = makeState({ unlockedEras: ['e1'] })
    expect(applyComplete(s, defs, era, 0)).toEqual({ state: s, floaters: [] })
    const noConv = makeEra({ id: 'e1', clickResource: 'base', converters: [] })
    expect(applyComplete(s, defs, noConv, 3)).toEqual({ state: s, floaters: [] })
  })
})

describe('applyGainCombinedScaled', () => {
  it('ajoute la ressource combinée mise à l échelle (niveau convertisseur + 1), SANS Complexité', () => {
    const s = makeState({ unlockedEras: ['e1'], converters: { conv: { level: 2, enabled: true } } })
    const r = applyGainCombinedScaled(s, defs, era, 1)
    expect(r.state.resources.combined).toBe(3) // 1 × (2 + 1)
    expect(r.state.complexity).toBe(0) // geste direct sur la ressource, jamais de Complexité
    expect(r.floaters).toEqual([{ resource: 'combined', amount: 3 }])
  })

  it('no-op pour n <= 0', () => {
    const s = makeState({})
    expect(applyGainCombinedScaled(s, defs, era, 0)).toEqual({ state: s, floaters: [] })
  })
})
