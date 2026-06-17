import { describe, it, expect } from 'vitest'
import { applyEffect, isCrisisReady, readyCrises, resolveCrisis, updateRisk } from '@/lib/crises'
import { makeState as stateWith } from '../helpers'
import type { GameDefs } from '@/lib/types'

const defs: GameDefs = {
  eras: [],
  resources: {},
  generators: {},
  converters: {},
  crises: {
    revolte: {
      id: 'revolte',
      eraId: 'e12',
      risk: { sourceResource: 'esclaves', threshold: 10, telegraph: true },
      trigger: 'threshold',
      regression: [{ type: 'resetResource', target: 'production', value: 0 }],
      rebound: [
        { type: 'transformResource', target: 'esclaves', to: 'citoyens', value: 1 },
        { type: 'multiplier', target: 'global', value: 2 },
      ],
      textKeys: { warnKey: '', triggerKey: '', reboundKey: '' },
    },
  },
}

describe('applyEffect', () => {
  it('resetResource remet à zéro (ou multiplie)', () => {
    expect(
      applyEffect(stateWith({ resources: { p: 100 } }), {
        type: 'resetResource',
        target: 'p',
        value: 0,
      }).resources.p,
    ).toBe(0)
    expect(
      applyEffect(stateWith({ resources: { p: 100 } }), {
        type: 'resetResource',
        target: 'p',
        value: 0.5,
      }).resources.p,
    ).toBe(50)
  })

  it('transformResource déplace une ressource vers une autre', () => {
    const next = applyEffect(stateWith({ resources: { esclaves: 10 } }), {
      type: 'transformResource',
      target: 'esclaves',
      to: 'citoyens',
      value: 1,
    })
    expect(next.resources.esclaves).toBe(0)
    expect(next.resources.citoyens).toBe(10)
  })

  it('multiplier applique un facteur', () => {
    const next = applyEffect(stateWith({}), { type: 'multiplier', target: 'global', value: 2 })
    expect(next.multipliers.global).toBe(2)
  })

  it('unlock débloque une ère', () => {
    const next = applyEffect(stateWith({}), { type: 'unlock', target: 'era-1' })
    expect(next.unlockedEras).toContain('era-1')
  })
})

describe('risque et résolution', () => {
  it('fait monter le risque selon la ressource-source', () => {
    const next = updateRisk(stateWith({ resources: { esclaves: 5 } }), defs, 1)
    expect(next.crises.revolte.risk).toBeCloseTo(5)
  })

  it('reste dormante sous le plancher, monte sur l’excès au-dessus', () => {
    const floored: GameDefs = {
      ...defs,
      crises: {
        ext: {
          id: 'ext',
          eraId: 'e10',
          risk: { sourceResource: 'fauna', threshold: 100, telegraph: true, floor: 2000 },
          trigger: 'threshold',
          regression: [],
          rebound: [],
          textKeys: { warnKey: '', triggerKey: '', reboundKey: '' },
        },
      },
    }
    // Below the floor (barely any fauna): the crisis never charges.
    const dormant = updateRisk(stateWith({ resources: { fauna: 16 } }), floored, 10)
    expect(dormant.crises.ext?.risk ?? 0).toBe(0)
    // Above the floor: risk builds on the excess only (2500 - 2000 = 500).
    const active = updateRisk(stateWith({ resources: { fauna: 2500 } }), floored, 1)
    expect(active.crises.ext.risk).toBeCloseTo(500)
  })

  it('signale une crise prête au seuil', () => {
    const state = stateWith({ crises: { revolte: { risk: 10, resolved: false, count: 0 } } })
    expect(isCrisisReady(state, defs, 'revolte')).toBe(true)
  })

  it('liste les crises prêtes', () => {
    const none = stateWith({ crises: { revolte: { risk: 3, resolved: false, count: 0 } } })
    const ready = stateWith({ crises: { revolte: { risk: 12, resolved: false, count: 0 } } })
    expect(readyCrises(none, defs)).toEqual([])
    expect(readyCrises(ready, defs)).toEqual(['revolte'])
  })

  it('résout : régression puis rebond, et marque résolue', () => {
    const state = stateWith({
      resources: { production: 100, esclaves: 10 },
      crises: { revolte: { risk: 10, resolved: false, count: 0 } },
    })
    const next = resolveCrisis(state, defs, 'revolte')
    expect(next.resources.production).toBe(0) // régression
    expect(next.resources.esclaves).toBe(0) // rebond : transformation (stock)
    expect(next.resources.citoyens).toBe(10)
    // Le multiplicateur du rebond n'est PAS gravé : il est dérivé du compteur par
    // le moteur (resourceMultiplier), donc un ajustement de données se répercute.
    expect(next.multipliers.global ?? 1).toBe(1)
    expect(next.crises.revolte.resolved).toBe(true)
    expect(next.crises.revolte.count).toBe(1)
  })
})
