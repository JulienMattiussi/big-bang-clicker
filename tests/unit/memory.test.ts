import { describe, it, expect } from 'vitest'
import {
  MEMORY_MAX_LEVEL,
  MEMORY_UNLOCK_CONVERTER,
  memoryCost,
  memoryEraMaxed,
  memoryLevel,
  memoryStart,
  memoryUnlocked,
  memoryWin,
} from '@/lib/memory'
import { makeState, makeEra, makeDefs } from '../helpers'

const defs = makeDefs({ eras: [makeEra({ id: 'e7', clickResource: 'beast' })] })

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
    expect(memoryLevel(makeState(), 'e7')).toBe(1)
    expect(memoryLevel(makeState({ memoryLevels: { e7: 1 } }), 'e7')).toBe(2)
    expect(memoryLevel(makeState({ memoryLevels: { e7: 99 } }), 'e7')).toBe(MEMORY_MAX_LEVEL)
  })

  it('maxé une fois MEMORY_MAX_LEVEL réussites atteintes', () => {
    expect(memoryEraMaxed(makeState({ memoryLevels: { e7: MEMORY_MAX_LEVEL - 1 } }), 'e7')).toBe(
      false,
    )
    expect(memoryEraMaxed(makeState({ memoryLevels: { e7: MEMORY_MAX_LEVEL } }), 'e7')).toBe(true)
  })
})

describe('memoryCost', () => {
  it('coûte 10% de la Complexité, au minimum 1', () => {
    expect(memoryCost(makeState({ complexity: 1000 }))).toBe(100)
    expect(memoryCost(makeState({ complexity: 0 }))).toBe(1)
  })
})

describe('memoryStart', () => {
  it('débite la mise et renvoie le nouvel état si abordable', () => {
    const next = memoryStart(makeState({ complexity: 1000 }))
    expect(next?.complexity).toBe(900)
  })

  it('renvoie null quand la Complexité est insuffisante', () => {
    // coût minimal 1, mais complexité 0 < 1
    expect(memoryStart(makeState({ complexity: 0 }))).toBeNull()
  })
})

describe('memoryWin', () => {
  it('incrémente le niveau sans graver de multiplicateur (dérivé par le moteur)', () => {
    const a = memoryWin(makeState({ currentEraId: 'e7' }), defs)
    expect(a.memoryLevels.e7).toBe(1)
    expect(a.multipliers.beast ?? 1).toBe(1) // pas gravé

    const b = memoryWin(a, defs)
    expect(b.memoryLevels.e7).toBe(2)
    expect(b.multipliers.beast ?? 1).toBe(1)
  })

  it('no-op si l ère est déjà maxée', () => {
    const maxed = makeState({ currentEraId: 'e7', memoryLevels: { e7: MEMORY_MAX_LEVEL } })
    expect(memoryWin(maxed, defs)).toBe(maxed)
  })
})
