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
      eraId: 'e13',
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

  it('resetGenerator multiplie (et plancher) le niveau', () => {
    const next = applyEffect(stateWith({ generators: { g: { level: 7 } } }), {
      type: 'resetGenerator',
      target: 'g',
      value: 0.5,
    })
    expect(next.generators.g.level).toBe(3) // floor(7 * 0.5)
  })

  it('grantResource ajoute à la ressource', () => {
    const next = applyEffect(stateWith({ resources: { p: 10 } }), {
      type: 'grantResource',
      target: 'p',
      value: 5,
    })
    expect(next.resources.p).toBe(15)
  })

  it('unlock ne duplique pas une ère déjà débloquée', () => {
    const s = stateWith({ unlockedEras: ['era-1'] })
    expect(applyEffect(s, { type: 'unlock', target: 'era-1' })).toBe(s)
  })

  it('no-op sans cible, et sur un effet non géré (flatBonus)', () => {
    const s = stateWith({ resources: { p: 1 } })
    expect(applyEffect(s, { type: 'resetResource' })).toBe(s)
    expect(applyEffect(s, { type: 'grantResource' })).toBe(s)
    expect(applyEffect(s, { type: 'resetGenerator' })).toBe(s)
    expect(applyEffect(s, { type: 'transformResource', target: 'p' })).toBe(s) // pas de `to`
    expect(applyEffect(s, { type: 'multiplier' })).toBe(s)
    expect(applyEffect(s, { type: 'unlock' })).toBe(s)
    expect(applyEffect(s, { type: 'flatBonus', target: 'p', value: 9 })).toBe(s)
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
          eraId: 'e11',
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

  it('isCrisisReady : faux pour une def inconnue, une crise résolue, ou un gate non atteint', () => {
    expect(isCrisisReady(stateWith({}), defs, 'inconnue')).toBe(false)
    const resolved = stateWith({ crises: { revolte: { risk: 99, resolved: true, count: 1 } } })
    expect(isCrisisReady(resolved, defs, 'revolte')).toBe(false)
    const gated: GameDefs = {
      ...defs,
      crises: {
        g: {
          id: 'g',
          eraId: 'e1',
          risk: { threshold: 1, gate: { resource: 'key', level: 5 } },
          trigger: 'threshold',
          regression: [],
          rebound: [],
          textKeys: { warnKey: '', triggerKey: '', reboundKey: '' },
        },
      },
    }
    const below = stateWith({ resources: { key: 4 }, crises: { g: { risk: 9, resolved: false, count: 0 } } })
    const above = stateWith({ resources: { key: 5 }, crises: { g: { risk: 9, resolved: false, count: 0 } } })
    expect(isCrisisReady(below, gated, 'g')).toBe(false)
    expect(isCrisisReady(above, gated, 'g')).toBe(true)
  })

  it('updateRisk : ignore les crises joueur, les résolues, et dt <= 0', () => {
    const playerDef: GameDefs = {
      ...defs,
      crises: {
        p: {
          id: 'p',
          eraId: 'e1',
          risk: { threshold: 1 },
          trigger: 'player',
          regression: [],
          rebound: [],
          textKeys: { warnKey: '', triggerKey: '', reboundKey: '' },
        },
      },
    }
    expect(updateRisk(stateWith({}), playerDef, 5).crises.p).toBeUndefined()
    const s = stateWith({ resources: { esclaves: 5 } })
    expect(updateRisk(s, defs, 0)).toBe(s) // dt nul : pas de changement
    const done = stateWith({
      resources: { esclaves: 5 },
      crises: { revolte: { risk: 0, resolved: true, count: 1 } },
    })
    expect(updateRisk(done, defs, 1).crises.revolte.risk).toBe(0) // résolue : gelée
  })

  it('resolveCrisis : no-op pour une def inconnue', () => {
    const s = stateWith({})
    expect(resolveCrisis(s, defs, 'inconnue')).toBe(s)
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
