import { describe, it, expect } from 'vitest'
import { echoesGain, prestige } from '@/lib/prestige'
import { makeState as stateWith } from '../helpers'

describe('calcul des Échos', () => {
  it('echoesGain : un Écho fixe par renaissance', () => {
    expect(echoesGain()).toBe(1)
  })
})

describe('prestige', () => {
  it('reset la partie, conserve les Échos (crédités au collapse) + méta + total cumulé', () => {
    const state = stateWith({
      totalComplexityEver: 4000,
      complexity: 50,
      echoes: 3,
      resources: { x: 5 },
      generators: { g: { level: 3 } },
      metaUpgrades: { boost: true },
    })
    const next = prestige(state, 9999)
    expect(next.echoes).toBe(3) // l'Écho est crédité à l'effondrement, pas au reset
    expect(next.complexity).toBe(0)
    expect(next.resources).toEqual({})
    expect(next.generators).toEqual({})
    expect(next.totalComplexityEver).toBe(4000)
    expect(next.metaUpgrades).toEqual({ boost: true })
    expect(next.lastSeen).toBe(9999)
  })
})
