import { describe, it, expect } from 'vitest'
import { canPrestige, echoesGain, lifetimeEchoes, prestige } from '@/lib/prestige'
import { makeState as stateWith } from '../helpers'

describe('calcul des Échos', () => {
  it('lifetimeEchoes croît avec la Complexité totale', () => {
    expect(lifetimeEchoes(stateWith({ totalComplexityEver: 0 }))).toBe(0)
    // K=1, base=1000 : sqrt(4000/1000) = 2
    expect(lifetimeEchoes(stateWith({ totalComplexityEver: 4000 }))).toBe(2)
  })

  it('echoesGain retranche les Échos déjà acquis', () => {
    expect(echoesGain(stateWith({ totalComplexityEver: 4000, echoes: 0 }))).toBe(2)
    expect(echoesGain(stateWith({ totalComplexityEver: 4000, echoes: 1 }))).toBe(1)
    expect(echoesGain(stateWith({ totalComplexityEver: 4000, echoes: 2 }))).toBe(0)
  })

  it('canPrestige vrai dès un gain de 1', () => {
    expect(canPrestige(stateWith({ totalComplexityEver: 4000 }))).toBe(true)
    expect(canPrestige(stateWith({ totalComplexityEver: 10 }))).toBe(false)
  })
})

describe('prestige', () => {
  it('reset la partie mais conserve Échos, méta-upgrades et total cumulé', () => {
    const state = stateWith({
      totalComplexityEver: 4000,
      complexity: 50,
      echoes: 0,
      resources: { x: 5 },
      generators: { g: { level: 3 } },
      metaUpgrades: { boost: true },
    })
    const next = prestige(state, 9999)
    expect(next.echoes).toBe(2)
    expect(next.complexity).toBe(0)
    expect(next.resources).toEqual({})
    expect(next.generators).toEqual({})
    expect(next.totalComplexityEver).toBe(4000)
    expect(next.metaUpgrades).toEqual({ boost: true })
    expect(next.lastSeen).toBe(9999)
  })
})
