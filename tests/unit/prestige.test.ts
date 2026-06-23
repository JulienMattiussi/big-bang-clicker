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

  it('incrémente le compteur de renaissances et conserve les galets', () => {
    const state = stateWith({ rebirths: 2, galets: { matter: { found: true, active: true } } })
    const next = prestige(state, 1)
    expect(next.rebirths).toBe(3)
    expect(next.galets).toEqual({ matter: { found: true, active: true } })
  })

  it('conserve le flag « vu » du tuto première machine, mais pas les évènements narratifs', () => {
    const state = stateWith({ seenEvents: { 'tuto:firstMachine': true, 'era:e5': true } })
    const next = prestige(state, 1)
    expect(next.seenEvents['tuto:firstMachine']).toBe(true) // onboarding : jamais rejoué
    expect(next.seenEvents['era:e5']).toBeUndefined() // récit : peut rejouer
  })

  it('tolère des champs rebirths/galets absents (sauvegarde ancienne)', () => {
    const partial = { ...stateWith({}), rebirths: undefined, galets: undefined }
    const next = prestige(partial as Parameters<typeof prestige>[0], 1)
    expect(next.rebirths).toBe(1)
    expect(next.galets).toEqual({})
  })
})
