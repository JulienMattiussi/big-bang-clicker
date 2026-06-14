import { describe, it, expect } from 'vitest'
import {
  applyClick,
  buyGenerator,
  canAfford,
  canManualConvert,
  canUnlockNextEra,
  complexityPerUnit,
  converterOutputPerSec,
  costAtLevel,
  generatorPerSec,
  manualConvert,
  manualProduce,
  nextCost,
  tick,
  unlockNextEra,
} from '@/lib/engine'
import { makeState as stateWith } from '../helpers'
import type { EraDef, GameDefs } from '@/lib/types'

const defs: GameDefs = {
  eras: [],
  resources: {
    quark: { id: 'quark', eraId: 'e0', nameKey: '', tier: 0, isBase: true },
    proton: { id: 'proton', eraId: 'e0', nameKey: '', tier: 1 },
  },
  generators: {
    quarkGen: {
      id: 'quarkGen',
      eraId: 'e0',
      nameKey: '',
      output: 'quark',
      baseRate: 1,
      cost: [{ resource: 'quark', base: 10, growth: 1.1 }],
    },
  },
  converters: {
    fuse: {
      id: 'fuse',
      eraId: 'e0',
      nameKey: '',
      inputs: [{ resource: 'quark', amount: 3 }],
      outputs: [{ resource: 'proton', amount: 1 }],
      baseRate: 1,
      cost: [{ resource: 'quark', base: 50, growth: 1.2 }],
    },
  },
  upgrades: {},
  crises: {},
}

describe('coûts', () => {
  it('calcule un coût géométrique', () => {
    expect(costAtLevel({ resource: 'quark', base: 10, growth: 1.1 }, 0)).toBe(10)
    expect(costAtLevel({ resource: 'quark', base: 10, growth: 1.1 }, 1)).toBeCloseTo(11)
  })

  it('agrège les coûts multi-ressources', () => {
    expect(nextCost(defs.generators.quarkGen.cost, 0)).toEqual({ quark: 10 })
  })

  it("arrondit le coût à l'échelle affichée (unité <10, sinon 0 ou 5)", () => {
    expect(nextCost([{ resource: 'quark', base: 247.6, growth: 1 }], 0)).toEqual({ quark: 250 })
    expect(nextCost([{ resource: 'quark', base: 112, growth: 1 }], 0)).toEqual({ quark: 110 })
    expect(nextCost([{ resource: 'quark', base: 8340, growth: 1 }], 0)).toEqual({ quark: 8000 })
    expect(nextCost([{ resource: 'quark', base: 116390, growth: 1 }], 0)).toEqual({ quark: 115000 })
  })

  it("vérifie l'abordabilité", () => {
    expect(canAfford({ quark: 10 }, { quark: 10 })).toBe(true)
    expect(canAfford({ quark: 9 }, { quark: 10 })).toBe(false)
  })
})

describe('achats', () => {
  it('achète un générateur et débite la ressource', () => {
    const next = buyGenerator(stateWith({ resources: { quark: 10 } }), defs, 'quarkGen')
    expect(next).not.toBeNull()
    expect(next!.resources.quark).toBe(0)
    expect(next!.generators.quarkGen.level).toBe(1)
  })

  it('refuse un achat non abordable', () => {
    expect(buyGenerator(stateWith({ resources: { quark: 5 } }), defs, 'quarkGen')).toBeNull()
  })
})

describe('tick', () => {
  it('produit via les générateurs', () => {
    const next = tick(stateWith({ generators: { quarkGen: { level: 2 } } }), defs, 1)
    expect(next.resources.quark).toBeCloseTo(2)
  })

  it('convertit et crédite la Complexité (pondérée par le tier)', () => {
    const next = tick(
      stateWith({
        resources: { quark: 30 },
        converters: { fuse: { level: 1, enabled: true } },
      }),
      defs,
      1,
    )
    expect(next.resources.quark).toBeCloseTo(27)
    expect(next.resources.proton).toBeCloseTo(1)
    expect(next.complexity).toBeCloseTo(1)
    expect(next.totalComplexityEver).toBeCloseTo(1)
  })

  it('borne la conversion aux entrées disponibles (pas de blocage dur)', () => {
    const next = tick(
      stateWith({
        resources: { quark: 2 },
        converters: { fuse: { level: 1, enabled: true } },
      }),
      defs,
      1,
    )
    expect(next.resources.quark).toBeCloseTo(0)
    expect(next.resources.proton ?? 0).toBeGreaterThan(0)
    expect(next.resources.quark).toBeGreaterThanOrEqual(0)
  })

  it('ignore un convertisseur désactivé', () => {
    const next = tick(
      stateWith({
        resources: { quark: 30 },
        converters: { fuse: { level: 1, enabled: false } },
      }),
      defs,
      1,
    )
    expect(next.resources.quark).toBeCloseTo(30)
  })

  it('applyClick ajoute à une ressource', () => {
    expect(applyClick(stateWith({}), 'quark', 5).resources.quark).toBe(5)
  })
})

describe('conversion manuelle', () => {
  it('refuse sans les intrants suffisants', () => {
    const state = stateWith({ resources: { quark: 2 } })
    expect(canManualConvert(state, defs, 'fuse')).toBe(false)
    expect(manualConvert(state, defs, 'fuse').resources.proton ?? 0).toBe(0)
  })

  it('applique une recette une fois, consomme, produit et crédite la Complexité', () => {
    const state = stateWith({ resources: { quark: 5 } })
    expect(canManualConvert(state, defs, 'fuse')).toBe(true)
    const next = manualConvert(state, defs, 'fuse')
    expect(next.resources.quark).toBe(2)
    expect(next.resources.proton).toBeCloseTo(1)
    expect(next.complexity).toBeCloseTo(1)
    expect(next.discovered.proton).toBe(true) // sticky discovery
  })

  it('manualProduce produit la sortie sans rien consommer, et crédite la Complexité', () => {
    const next = manualProduce(stateWith({ resources: { quark: 5 } }), defs, 'fuse')
    expect(next.resources.quark).toBe(5) // intrant non consommé
    expect(next.resources.proton).toBeCloseTo(1)
    expect(next.complexity).toBeCloseTo(1)
  })
})

describe('franchissement de palier', () => {
  const eraDefs: GameDefs = {
    ...defs,
    eras: [
      { id: 'a', unlock: {} } as unknown as EraDef,
      { id: 'b', unlock: { complexity: 100 } } as unknown as EraDef,
    ],
  }

  it('ne peut pas franchir sans la Complexité suffisante', () => {
    const state = stateWith({ unlockedEras: ['a'], complexity: 50 })
    expect(canUnlockNextEra(state, eraDefs)).toBe(false)
    expect(unlockNextEra(state, eraDefs).unlockedEras).toEqual(['a'])
  })

  it('franchir débloque et bascule sans dépenser la Complexité', () => {
    const state = stateWith({ unlockedEras: ['a'], complexity: 150, currentEraId: 'a' })
    expect(canUnlockNextEra(state, eraDefs)).toBe(true)
    const next = unlockNextEra(state, eraDefs)
    expect(next.unlockedEras).toContain('b')
    expect(next.complexity).toBe(150)
    expect(next.currentEraId).toBe('b')
  })

  it('cappe la Complexité au coût du prochain palier', () => {
    const state = stateWith({
      unlockedEras: ['a'],
      complexity: 99,
      resources: { quark: 300 },
      converters: { fuse: { level: 10, enabled: true } },
    })
    const next = tick(state, eraDefs, 1)
    expect(next.complexity).toBe(100)
  })
})

describe('décroissance de Complexité par ère', () => {
  const decayDefs: GameDefs = {
    ...defs,
    eras: [
      { id: 'e0', unlock: {} } as unknown as EraDef,
      { id: 'e1', unlock: {} } as unknown as EraDef,
    ],
    resources: {
      quark: { id: 'quark', eraId: 'e0', nameKey: '', tier: 0, isBase: true },
      proton: { id: 'proton', eraId: 'e0', nameKey: '', tier: 1 },
      helium: { id: 'helium', eraId: 'e1', nameKey: '', tier: 1 },
    },
    converters: {
      old: {
        id: 'old',
        eraId: 'e0',
        nameKey: '',
        inputs: [{ resource: 'quark', amount: 1 }],
        outputs: [{ resource: 'proton', amount: 1 }],
        baseRate: 1,
        cost: [],
      },
      recent: {
        id: 'recent',
        eraId: 'e1',
        nameKey: '',
        inputs: [{ resource: 'quark', amount: 1 }],
        outputs: [{ resource: 'helium', amount: 1 }],
        baseRate: 1,
        cost: [],
      },
    },
  }

  it('une ère antérieure rapporte 1/50 de la plus récente', () => {
    const base = { resources: { quark: 100 }, unlockedEras: ['e0', 'e1'] }
    const recent = tick(
      stateWith({ ...base, converters: { recent: { level: 1, enabled: true } } }),
      decayDefs,
      1,
    )
    const old = tick(
      stateWith({ ...base, converters: { old: { level: 1, enabled: true } } }),
      decayDefs,
      1,
    )
    expect(recent.complexity).toBeCloseTo(1)
    expect(old.complexity).toBeCloseTo(1 / 50)
  })
})

// La source unique des taux : les helpers que l'UI et le moteur réutilisent.
// On vérifie surtout que la Complexité suit les multiplicateurs (memory/galet),
// le bug que Julien a diagnostiqué (le stock multiplié mais pas la Complexité).
describe('calculs consolidés (source unique)', () => {
  it('generatorPerSec applique niveau x baseRate x multiplicateur de ressource', () => {
    const state = stateWith({ multipliers: { quark: 3 } })
    expect(generatorPerSec(state, defs, 'quarkGen', 2)).toBeCloseTo(6) // 2 x 1 x 3
  })

  it('converterOutputPerSec applique le multiplicateur de sortie (pas la conso)', () => {
    const state = stateWith({ multipliers: { proton: 10 } })
    expect(converterOutputPerSec(state, defs, 'fuse', 'proton', 1, 1)).toBeCloseTo(10)
  })

  it('complexityPerUnit = tier x décroissance par ère', () => {
    const s = stateWith({})
    expect(complexityPerUnit(s, defs, 'proton', 0)).toBeCloseTo(1) // tier 1, ère courante
    expect(complexityPerUnit(s, defs, 'proton', 1)).toBeCloseTo(1 / 50) // une ère en retard
  })

  it('un galet de Complexité actif multiplie le gain (jusqu à son maxEraIndex)', () => {
    const galetDefs: GameDefs = {
      ...defs,
      galets: [
        {
          id: 'div',
          nameKey: '',
          descKey: '',
          loreKey: '',
          color: '',
          motif: '',
          discoverEraId: 'e0',
          effect: { type: 'complexityMultiplier', maxEraIndex: 0, value: 3 },
        },
      ],
    }
    const on = stateWith({ galets: { div: { found: true, active: true } } })
    expect(complexityPerUnit(on, galetDefs, 'proton', 0)).toBeCloseTo(3) // tier 1 x1 x3
    // Inactif (ou non trouvé) -> pas de bonus.
    const off = stateWith({ galets: { div: { found: true, active: false } } })
    expect(complexityPerUnit(off, galetDefs, 'proton', 0)).toBeCloseTo(1)
  })

  it('la Complexité du tick suit le multiplicateur de sortie (stock ET Complexité x10)', () => {
    const state = stateWith({
      resources: { quark: 30 },
      converters: { fuse: { level: 1, enabled: true } },
      multipliers: { proton: 10 },
    })
    const next = tick(state, defs, 1)
    expect(next.resources.proton).toBeCloseTo(10) // 1 produit x10
    expect(next.complexity).toBeCloseTo(10) // et la Complexité aussi, pas 1
  })

  it('manualProduce crédite la Complexité sur la quantité multipliée', () => {
    const state = stateWith({ resources: { quark: 5 }, multipliers: { proton: 4 } })
    const next = manualProduce(state, defs, 'fuse')
    expect(next.resources.proton).toBeCloseTo(4)
    expect(next.complexity).toBeCloseTo(4)
  })
})

// Une crise déclenchée gèle la production des ressources touchées et verrouille
// le franchissement de palier tant qu'elle n'est pas résolue.
describe('gel de production et palier pendant une crise', () => {
  const crisisDefs: GameDefs = {
    ...defs,
    eras: [
      { id: 'e0', unlock: {} } as unknown as EraDef,
      { id: 'e1', unlock: { complexity: 100 } } as unknown as EraDef,
    ],
    crises: {
      ext: {
        id: 'ext',
        eraId: 'e0',
        risk: { sourceResource: 'quark', threshold: 10, telegraph: true },
        trigger: 'threshold',
        regression: [{ type: 'resetResource', target: 'proton', value: 0 }],
        rebound: [],
        textKeys: { warnKey: '', triggerKey: '', reboundKey: '' },
      },
    },
  }
  const ready = { ext: { risk: 100, resolved: false, count: 0 } }

  it('gèle le générateur de la ressource source et le convertisseur produisant la cible', () => {
    const state = stateWith({
      resources: { quark: 30 },
      generators: { quarkGen: { level: 2 } },
      converters: { fuse: { level: 1, enabled: true } },
      crises: ready,
    })
    const next = tick(state, crisisDefs, 1)
    expect(next.resources.quark).toBe(30) // générateur gelé (sortie quark)
    expect(next.resources.proton ?? 0).toBe(0) // recette gelée (sortie proton)
    expect(next.complexity).toBe(0)
  })

  it('reprend la production une fois la crise résolue', () => {
    const resolved = { ext: { risk: 100, resolved: true, count: 1 } }
    const state = stateWith({
      resources: { quark: 30 },
      generators: { quarkGen: { level: 2 } },
      crises: resolved,
    })
    expect(tick(state, crisisDefs, 1).resources.quark).toBeCloseTo(32)
  })

  it('bloque le franchissement de palier tant qu une crise est déclenchée', () => {
    const state = stateWith({ unlockedEras: ['e0'], complexity: 150, crises: ready })
    expect(canUnlockNextEra(state, crisisDefs)).toBe(false)
    // Résolue, le palier redevient franchissable.
    const cleared = { ...state, crises: { ext: { risk: 100, resolved: true, count: 1 } } }
    expect(canUnlockNextEra(cleared, crisisDefs)).toBe(true)
  })
})

// Les multiplicateurs de mémoire et de rebond de crise ne sont PAS gravés dans la
// save : le moteur les DÉRIVE des niveaux/compteurs persistés + des données, donc
// un ajustement des valeurs se répercute sur une partie en cours.
describe('multiplicateurs dérivés (mémoire + crise), rétroactifs', () => {
  const derivedDefs = (reboundValue: number): GameDefs => ({
    ...defs,
    eras: [{ id: 'e7', clickResource: 'beast', generators: ['beastGen'] } as unknown as EraDef],
    generators: {
      beastGen: {
        id: 'beastGen',
        eraId: 'e7',
        nameKey: '',
        output: 'beast',
        baseRate: 1,
        cost: [],
      },
    },
    crises: {
      ext: {
        id: 'ext',
        eraId: 'e7',
        risk: { threshold: 1, telegraph: false },
        trigger: 'threshold',
        regression: [],
        rebound: [{ type: 'multiplier', target: 'beast', value: reboundValue }],
        textKeys: { warnKey: '', triggerKey: '', reboundKey: '' },
      },
    },
  })

  it('la mémoire dérive 2^niveau sur la production (rien dans multipliers)', () => {
    const s = stateWith({ memoryLevels: { e7: 2 } })
    expect(generatorPerSec(s, derivedDefs(10), 'beastGen', 1)).toBeCloseTo(4) // 2^2
  })

  it('un rebond de crise résolue dérive value^count, et un ajustement se répercute', () => {
    const s = stateWith({ crises: { ext: { risk: 0, resolved: true, count: 1 } } })
    expect(generatorPerSec(s, derivedDefs(10), 'beastGen', 1)).toBeCloseTo(10)
    // Même save, donnée passée de 10 à 20 -> rétroactif (pas de valeur gravée).
    expect(generatorPerSec(s, derivedDefs(20), 'beastGen', 1)).toBeCloseTo(20)
  })

  it('non résolue (count 0) : pas de bonus', () => {
    const s = stateWith({ crises: { ext: { risk: 0, resolved: false, count: 0 } } })
    expect(generatorPerSec(s, derivedDefs(20), 'beastGen', 1)).toBeCloseTo(1)
  })
})
