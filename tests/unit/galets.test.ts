import { describe, it, expect } from 'vitest'
import {
  discoverableGalets,
  galetsAffectingComplexity,
  galetsAffectingConverter,
  galetsAffectingGenerator,
  widgetGaletForEra,
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
    discoverEraId: 'e1',
    effect: { type: 'generatorMultiplier', maxEraIndex: 4, value: 10 },
    ...overrides,
  }
}

const gen: GeneratorDef = { id: 'gen1', eraId: 'e2', nameKey: '', output: 'r', baseRate: 1, cost: [] }
const conv: ConverterDef = {
  id: 'conv1',
  eraId: 'e2',
  nameKey: '',
  inputs: [],
  outputs: [],
  baseRate: 1,
  cost: [],
}

const defs = makeDefs({
  eras: [makeEra({ id: 'e1', unlock: { complexity: 100 } })],
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
    expect(discoverableGalets(makeState({ complexity: 100 }), defs).map((g) => g.id)).toContain('g1')
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
    expect(widgetGaletForEra(defs, 'e1')?.id).toBe('wid')
    expect(widgetGaletForEra(defs, 'e2')).toBeUndefined()
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
})
