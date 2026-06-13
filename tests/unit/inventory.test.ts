import { describe, it, expect } from 'vitest'
import { BACKPACK_UNLOCK_RESOURCE, backpackUnlocked, knownResourcesByEra } from '@/lib/inventory'
import { makeState, makeEra, makeDefs } from '../helpers'

const defs = makeDefs({
  eras: [
    makeEra({ id: 'e6', clickResource: 'microbe', resources: ['microbe', 'enzyme'] }),
    makeEra({ id: 'e7', clickResource: 'beast', resources: ['beast'] }),
  ],
})

describe('backpackUnlocked', () => {
  it('verrouillé tant que la ressource de déblocage n est pas apparue', () => {
    expect(backpackUnlocked(makeState())).toBe(false)
  })

  it('déverrouillé dès que la ressource est détenue ou découverte', () => {
    expect(backpackUnlocked(makeState({ resources: { [BACKPACK_UNLOCK_RESOURCE]: 1 } }))).toBe(true)
    expect(backpackUnlocked(makeState({ discovered: { [BACKPACK_UNLOCK_RESOURCE]: true } }))).toBe(true)
  })
})

describe('knownResourcesByEra', () => {
  it('ne liste que les ères débloquées, dans l ordre', () => {
    const groups = knownResourcesByEra(makeState({ unlockedEras: ['e6'] }), defs)
    expect(groups.map((g) => g.era.id)).toEqual(['e6'])
  })

  it('ne garde que les ressources révélées (clickResource collante, le reste si découvert)', () => {
    // Seule la ressource de clic est révélée d office ; enzyme reste cachée.
    const base = knownResourcesByEra(makeState({ unlockedEras: ['e6'] }), defs)
    expect(base[0].resources).toEqual(['microbe'])

    // enzyme découverte -> elle apparaît.
    const withEnzyme = knownResourcesByEra(
      makeState({ unlockedEras: ['e6'], discovered: { enzyme: true } }),
      defs,
    )
    expect(withEnzyme[0].resources).toEqual(['microbe', 'enzyme'])
  })

  it('inclut chaque ère débloquée via sa ressource de clic', () => {
    const groups = knownResourcesByEra(makeState({ unlockedEras: ['e6', 'e7'] }), defs)
    expect(groups.map((g) => g.era.id)).toEqual(['e6', 'e7'])
    expect(groups[1].resources).toEqual(['beast'])
  })
})
