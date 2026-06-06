import { describe, it, expect } from 'vitest'
import { defs } from '@/data'
import { topologicalOrder } from '@/lib/graph'

describe('intégrité des données', () => {
  it('chaque ère référence des entités existantes', () => {
    for (const era of defs.eras) {
      expect(defs.resources[era.clickResource]).toBeDefined()
      for (const id of era.resources) expect(defs.resources[id]).toBeDefined()
      for (const id of era.generators) expect(defs.generators[id]).toBeDefined()
      for (const id of era.converters) expect(defs.converters[id]).toBeDefined()
    }
  })

  it('les recettes référencent des ressources existantes', () => {
    for (const conv of Object.values(defs.converters)) {
      for (const io of [...conv.inputs, ...conv.outputs]) {
        expect(defs.resources[io.resource]).toBeDefined()
      }
    }
  })

  it('les générateurs produisent une ressource existante', () => {
    for (const gen of Object.values(defs.generators)) {
      expect(defs.resources[gen.output]).toBeDefined()
    }
  })

  it('le graphe de ressources est acyclique', () => {
    expect(topologicalOrder(defs).hasCycle).toBe(false)
  })
})
