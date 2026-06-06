import { describe, it, expect } from 'vitest'
import { revealedMachines, revealedResources } from '@/lib/reveal'
import { makeState } from '../helpers'
import type { EraDef, GameDefs } from '@/lib/types'

const era = {
  generators: ['g'],
  converters: ['c'],
  clickResource: 'base',
  resources: ['base', 'out'],
} as unknown as EraDef

const defs = {
  generators: { g: { output: 'base' } },
  converters: {
    c: { inputs: [{ resource: 'base', amount: 1 }], outputs: [{ resource: 'out', amount: 1 }] },
  },
} as unknown as GameDefs

describe('progressive reveal', () => {
  it('reveals only the verb generator and the click resource at start', () => {
    const state = makeState({})
    expect([...revealedMachines(state, defs, era)]).toEqual(['g'])
    expect([...revealedResources(state, defs, era)]).toEqual(['base'])
  })

  it('does not reveal the recipe until the previous machine is level 1', () => {
    const state = makeState({ resources: { base: 5 } })
    expect(revealedMachines(state, defs, era).has('c')).toBe(false)
  })

  it('reveals the recipe once the previous machine reaches level 1 (output still hidden)', () => {
    const state = makeState({ generators: { g: { level: 1 } } })
    expect(revealedMachines(state, defs, era).has('c')).toBe(true)
    expect([...revealedResources(state, defs, era)]).toEqual(['base'])
  })

  it('reveals the output resource only once the recipe machine reaches level 1', () => {
    const state = makeState({
      generators: { g: { level: 1 } },
      converters: { c: { level: 1, enabled: true } },
    })
    expect(revealedResources(state, defs, era).has('out')).toBe(true)
  })

  it('stays revealed via discovered even when the stock is back to 0', () => {
    const state = makeState({ discovered: { out: true } })
    expect(revealedMachines(state, defs, era).has('c')).toBe(true)
    expect(revealedResources(state, defs, era).has('out')).toBe(true)
  })
})
