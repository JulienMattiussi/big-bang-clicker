import { describe, it, expect } from 'vitest'
import {
  PARTS,
  PART_IDS,
  colorOf,
  freshQueue,
  partsOf,
  pickOrg,
  planFor,
} from '@/components/game/widgets/assemblyPlan'

describe('parts catalogue', () => {
  it('expose un id et une couleur par pièce, ids dérivés de PARTS', () => {
    expect(PART_IDS).toEqual(PARTS.map((p) => p.id))
    expect(colorOf('eye')).toBe('var(--part-1)')
  })
})

describe('partsOf / planFor', () => {
  it('donne les pièces d\'un organisme connu, vide sinon', () => {
    expect(partsOf('trilobite')).toEqual(['segment', 'eye', 'leg'])
    expect(partsOf('inconnu')).toEqual([])
  })

  it('construit un plan dont les emplacements suivent les pièces, tous vides', () => {
    const plan = planFor('trilobite')
    expect(plan.org).toBe('trilobite')
    expect(plan.slots.map((s) => s.id)).toEqual(['segment', 'eye', 'leg'])
    expect(plan.slots.every((s) => !s.filled)).toBe(true)
  })
})

describe('pickOrg', () => {
  it('évite les organismes déjà en file', () => {
    // Exclure tous sauf un rend le choix déterministe.
    const everyOrg = [
      'trilobite',
      'anomalocaris',
      'opabinia',
      'hallucigenia',
      'wiwaxia',
      'pikaia',
      'haikouichthys',
      'marrella',
      'brachiopod',
      'sponge',
    ]
    const exclude = everyOrg.filter((id) => id !== 'sponge')
    expect(pickOrg(exclude)).toBe('sponge')
  })
})

describe('freshQueue', () => {
  it('fournit un plan courant et deux organismes à venir, tous distincts', () => {
    const { plan, upcoming } = freshQueue()
    expect(upcoming).toHaveLength(2)
    const ids = [plan.org, ...upcoming]
    expect(new Set(ids).size).toBe(ids.length)
  })
})
