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
  converters: { c: { outputs: [{ resource: 'out', amount: 1 }] } },
} as unknown as GameDefs

describe('progressive reveal', () => {
  it('reveals only the first machine and the click resource at start', () => {
    const state = makeState({})
    expect([...revealedMachines(state, era)]).toEqual(['g'])
    expect([...revealedResources(state, defs, era)]).toEqual(['base'])
  })

  it('reveals the converter and its output once the generator reaches level 1', () => {
    const state = makeState({ generators: { g: { level: 1 } } })
    expect(revealedMachines(state, era).has('c')).toBe(true)
    expect([...revealedResources(state, defs, era)].sort()).toEqual(['base', 'out'])
  })
})
