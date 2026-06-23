import { describe, it, expect } from 'vitest'
import {
  crisisGaletForEra,
  discoverableGalets,
  galetsAffectingComplexity,
  galetsAffectingConverter,
  galetsAffectingGenerator,
  galetsAffectingTerminalConverter,
  memoryGalet,
  widgetGaletForEra,
  widgetGaletMultiplier,
} from '@/lib/galets'
import { makeState, makeEra, makeDefs } from '../helpers'
import type { ConverterDef, GaletDef, GeneratorDef } from '@/lib/types'

function galet(id: string, overrides: Partial<GaletDef> = {}): GaletDef {
  return {
    id,
    nameKey: '',
    descKey: '',
    loreKey: '',
    color: '',
    motif: '',
    discoverEraId: 'e2',
    effect: { type: 'generatorMultiplier', maxEraIndex: 4, value: 10 },
    ...overrides,
  }
}

const gen: GeneratorDef = {
  id: 'gen1',
  eraId: 'e3',
  nameKey: '',
  output: 'r',
  baseRate: 1,
  cost: [],
}
const conv: ConverterDef = {
  id: 'conv1',
  eraId: 'e3',
  nameKey: '',
  inputs: [],
  outputs: [],
  baseRate: 1,
  cost: [],
}

const defs = makeDefs({
  eras: [makeEra({ id: 'e2', unlock: { complexity: 100 } }), makeEra({ id: 'e3', index: 2 })],
  generators: { gen1: gen },
  converters: { conv1: conv },
  galets: [
    galet('g1', { effect: { type: 'generatorMultiplier', maxEraIndex: 4, value: 10 } }),
    galet('g2', { effect: { type: 'converterMultiplier', maxEraIndex: 2, value: 5 } }),
    galet('gFar', { effect: { type: 'generatorMultiplier', maxEraIndex: 1, value: 3 } }),
    galet('wid', {
      discovery: 'widget',
      effect: { type: 'complexityMultiplier', maxEraIndex: 9, value: 3 },
    }),
  ],
})

describe('discoverableGalets', () => {
  it('révèle un galet quand le seuil de son ère est atteint, jamais avant', () => {
    expect(discoverableGalets(makeState({ complexity: 99 }), defs)).toHaveLength(0)
    expect(discoverableGalets(makeState({ complexity: 100 }), defs).map((g) => g.id)).toContain(
      'g1',
    )
  })

  it('exclut les galets déjà trouvés', () => {
    const state = makeState({ complexity: 100, galets: { g1: { found: true, active: true } } })
    expect(discoverableGalets(state, defs).map((g) => g.id)).not.toContain('g1')
  })

  it('exclut les galets découverts par widget (leur widget les déclenche)', () => {
    expect(discoverableGalets(makeState({ complexity: 100 }), defs).map((g) => g.id)).not.toContain(
      'wid',
    )
  })
})

describe('widgetGaletForEra', () => {
  it('renvoie le galet à découverte widget de l ère, sinon undefined', () => {
    expect(widgetGaletForEra(defs, 'e2')?.id).toBe('wid')
    expect(widgetGaletForEra(defs, 'e3')).toBeUndefined()
  })
})

describe('galetsAffectingComplexity', () => {
  it('ne renvoie que les galets de Complexité trouvés', () => {
    expect(galetsAffectingComplexity(makeState(), defs)).toHaveLength(0)
    const found = makeState({ galets: { wid: { found: true, active: true } } })
    expect(galetsAffectingComplexity(found, defs).map((g) => g.id)).toEqual(['wid'])
  })
})

describe('galetsAffectingGenerator', () => {
  it('renvoie les galets trouvés du bon type couvrant l index de l ère de la machine', () => {
    const state = makeState({ galets: { g1: { found: true, active: true } } })
    expect(galetsAffectingGenerator(state, defs, 'gen1').map((g) => g.id)).toEqual(['g1'])
  })

  it('ignore un galet dont maxEraIndex est inférieur à l ère de la machine (e2 > 1)', () => {
    const state = makeState({ galets: { gFar: { found: true, active: true } } })
    expect(galetsAffectingGenerator(state, defs, 'gen1')).toHaveLength(0)
  })

  it('ignore un galet non trouvé et une machine inconnue', () => {
    expect(galetsAffectingGenerator(makeState(), defs, 'gen1')).toHaveLength(0)
    const found = makeState({ galets: { g1: { found: true, active: true } } })
    expect(galetsAffectingGenerator(found, defs, 'unknown')).toHaveLength(0)
  })
})

describe('galetsAffectingConverter', () => {
  it('ne renvoie que les galets de type converterMultiplier', () => {
    const state = makeState({
      galets: { g1: { found: true, active: true }, g2: { found: true, active: true } },
    })
    expect(galetsAffectingConverter(state, defs, 'conv1').map((g) => g.id)).toEqual(['g2'])
  })

  it('renvoie [] pour un convertisseur inconnu', () => {
    expect(galetsAffectingConverter(makeState(), defs, 'unknown')).toHaveLength(0)
  })
})

describe('crisisGaletForEra', () => {
  it('renvoie le galet à découverte de crise de l ère, sinon undefined', () => {
    const crisisDefs = makeDefs({
      eras: [makeEra({ id: 'e5' })],
      galets: [
        galet('cg', { discovery: 'crisis', discoverEraId: 'e5' }),
        galet('plain', { discoverEraId: 'e5' }),
      ],
    })
    expect(crisisGaletForEra(crisisDefs, 'e5')?.id).toBe('cg')
    expect(crisisGaletForEra(crisisDefs, 'e9')).toBeUndefined()
  })
})

describe('memoryGalet', () => {
  const memDefs = makeDefs({
    galets: [galet('mind', { effect: { type: 'memoryBoost', maxEraIndex: 99, value: 0.01 } })],
  })
  it('renvoie le galet memoryBoost trouvé ET actif, sinon undefined', () => {
    expect(memoryGalet(makeState(), memDefs)).toBeUndefined()
    const inactive = makeState({ galets: { mind: { found: true, active: false } } })
    expect(memoryGalet(inactive, memDefs)).toBeUndefined()
    const on = makeState({ galets: { mind: { found: true, active: true } } })
    expect(memoryGalet(on, memDefs)?.id).toBe('mind')
  })
})

describe('widgetGaletMultiplier', () => {
  const wDefs = makeDefs({
    galets: [galet('w', { effect: { type: 'widgetMultiplier', maxEraIndex: 4, value: 3 } })],
  })
  it('vaut 1 sans galet actif, le facteur sinon', () => {
    expect(widgetGaletMultiplier(makeState(), wDefs, 2)).toBe(1)
    const on = makeState({ galets: { w: { found: true, active: true } } })
    expect(widgetGaletMultiplier(on, wDefs, 2)).toBe(3)
    expect(widgetGaletMultiplier(on, wDefs, 9)).toBe(1) // au-delà de maxEraIndex
  })

  it('le méta-upgrade puissance des galets amplifie le bonus au-dessus de 1', () => {
    const on = makeState({
      galets: { w: { found: true, active: true } },
      multipliers: { metaGalet: 2 },
    })
    // 1 + (3 - 1) * 2 = 5
    expect(widgetGaletMultiplier(on, wDefs, 2)).toBe(5)
  })
})

describe('galetsAffectingTerminalConverter', () => {
  const termDefs = makeDefs({
    eras: [makeEra({ id: 'e3', index: 2, converters: ['a', 'last'] })],
    converters: {
      a: { id: 'a', eraId: 'e3', nameKey: '', inputs: [], outputs: [], baseRate: 1, cost: [] },
      last: { id: 'last', eraId: 'e3', nameKey: '', inputs: [], outputs: [], baseRate: 1, cost: [] },
    },
    galets: [galet('t', { effect: { type: 'terminalConsumption', maxEraIndex: 4, value: 0.5 } })],
  })
  it('ne s applique qu au DERNIER convertisseur de l ère', () => {
    const on = makeState({ galets: { t: { found: true, active: true } } })
    expect(galetsAffectingTerminalConverter(on, termDefs, 'last').map((g) => g.id)).toEqual(['t'])
    expect(galetsAffectingTerminalConverter(on, termDefs, 'a')).toHaveLength(0)
    expect(galetsAffectingTerminalConverter(on, termDefs, 'unknown')).toHaveLength(0)
  })
})
