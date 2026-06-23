import { describe, it, expect } from 'vitest'
import {
  MEMORY_MAX_LEVEL,
  MEMORY_UNLOCK_CONVERTER,
  memoryCost,
  memoryEraMaxed,
  memoryJokerSets,
  memoryLevel,
  memoryStart,
  memoryUnlocked,
  memoryWin,
} from '@/lib/memory'
import { makeState, makeEra, makeDefs } from '../helpers'
import type { GaletDef } from '@/lib/types'

const defs = makeDefs({ eras: [makeEra({ id: 'e8', clickResource: 'beast' })] })

// A Force pebble (mind control): its `value` is the cheaper cost fraction (1%).
const forceGalet: GaletDef = {
  id: 'force',
  nameKey: '',
  descKey: '',
  loreKey: '',
  color: '',
  motif: '',
  discoverEraId: 'e16',
  discovery: 'crisis',
  effect: { type: 'memoryBoost', maxEraIndex: 99, value: 0.01 },
}
const forceDefs = makeDefs({
  eras: [makeEra({ id: 'e8', clickResource: 'beast' })],
  galets: [forceGalet],
})
const withForce = (overrides = {}) =>
  makeState({ galets: { force: { found: true, active: true } }, ...overrides })

describe('memoryUnlocked', () => {
  it('verrouillé tant que le convertisseur de déblocage n a pas été monté', () => {
    expect(memoryUnlocked(makeState())).toBe(false)
    expect(
      memoryUnlocked(
        makeState({ converters: { [MEMORY_UNLOCK_CONVERTER]: { level: 1, enabled: true } } }),
      ),
    ).toBe(true)
  })
})

describe('memoryLevel / memoryEraMaxed', () => {
  it('part au niveau 1 puis suit le nombre de réussites, plafonné au max', () => {
    expect(memoryLevel(makeState(), 'e8')).toBe(1)
    expect(memoryLevel(makeState({ memoryLevels: { e8: 1 } }), 'e8')).toBe(2)
    expect(memoryLevel(makeState({ memoryLevels: { e8: 99 } }), 'e8')).toBe(MEMORY_MAX_LEVEL)
  })

  it('maxé une fois MEMORY_MAX_LEVEL réussites atteintes', () => {
    expect(memoryEraMaxed(makeState({ memoryLevels: { e8: MEMORY_MAX_LEVEL - 1 } }), 'e8')).toBe(
      false,
    )
    expect(memoryEraMaxed(makeState({ memoryLevels: { e8: MEMORY_MAX_LEVEL } }), 'e8')).toBe(true)
  })
})

describe('memoryCost', () => {
  it('coûte 10% de la Complexité, au minimum 1', () => {
    expect(memoryCost(makeState({ complexity: 1000 }), defs)).toBe(100)
    expect(memoryCost(makeState({ complexity: 0 }), defs)).toBe(1)
  })

  it('chute à la fraction du galet Force (1%), au minimum 1', () => {
    expect(memoryCost(withForce({ complexity: 1000 }), forceDefs)).toBe(10)
    expect(memoryCost(withForce({ complexity: 0 }), forceDefs)).toBe(1)
  })

  it('devient gratuit quand le méta puissance des galets amplifie le galet Force', () => {
    const amplified = withForce({ complexity: 1000, multipliers: { metaGalet: 2 } })
    expect(memoryCost(amplified, forceDefs)).toBe(0)
  })
})

describe('memoryJokerSets', () => {
  it('aucun joker sans galet Force', () => {
    expect(memoryJokerSets(makeState(), defs, 2)).toBe(0)
  })

  it('2 jokers avec le galet, +1 par niveau une fois amplifié', () => {
    expect(memoryJokerSets(withForce(), forceDefs, 3)).toBe(2)
    const amplified = withForce({ multipliers: { metaGalet: 2 } })
    expect(memoryJokerSets(amplified, forceDefs, 3)).toBe(5) // 2 + niveau 3
  })
})

describe('memoryStart', () => {
  it('débite la mise et renvoie le nouvel état si abordable', () => {
    const next = memoryStart(makeState({ complexity: 1000 }), defs)
    expect(next?.complexity).toBe(900)
  })

  it('renvoie null quand la Complexité est insuffisante', () => {
    // coût minimal 1, mais complexité 0 < 1
    expect(memoryStart(makeState({ complexity: 0 }), defs)).toBeNull()
  })
})

describe('memoryWin', () => {
  it('incrémente le niveau sans graver de multiplicateur (dérivé par le moteur)', () => {
    const a = memoryWin(makeState({ currentEraId: 'e8' }), defs)
    expect(a.memoryLevels.e8).toBe(1)
    expect(a.multipliers.beast ?? 1).toBe(1) // pas gravé

    const b = memoryWin(a, defs)
    expect(b.memoryLevels.e8).toBe(2)
    expect(b.multipliers.beast ?? 1).toBe(1)
  })

  it('no-op si l ère est déjà maxée', () => {
    const maxed = makeState({ currentEraId: 'e8', memoryLevels: { e8: MEMORY_MAX_LEVEL } })
    expect(memoryWin(maxed, defs)).toBe(maxed)
  })
})
