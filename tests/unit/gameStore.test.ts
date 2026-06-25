import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import { useGameStore } from '@/store/gameStore'
import { makeState } from '../helpers'

/**
 * Action-level tests for the orchestrating store. Ids are derived from the real
 * defs at runtime (robust to data edits): we just need *a* generator, converter,
 * crisis, meta-upgrade, etc. The store is a per-file singleton; each test resets
 * its state first.
 */
const { defs } = useGameStore.getState()
const era0 = defs.eras[0]!
const genId = era0.generators[0]!
const convId = Object.keys(defs.converters)[0]!
const crisisId = Object.keys(defs.crises)[0]!
const metaDef = defs.metaUpgrades[0]!

// Plenty of every base resource so purchases/recipes always afford.
const rich = Object.fromEntries(Object.keys(defs.resources).map((r) => [r, 1e9]))

function reset(overrides: Parameters<typeof makeState>[0] = {}) {
  useGameStore.setState({
    state: makeState({
      unlockedEras: [era0.id],
      currentEraId: era0.id,
      resources: { ...rich },
      ...overrides,
    }),
    epoch: 0,
  })
}

const cur = () => useGameStore.getState().state

beforeEach(() => {
  localStorage.clear()
  reset()
})
afterEach(() => localStorage.clear())

describe('achats', () => {
  it('buyGenerator monte le niveau et persiste', () => {
    useGameStore.getState().buyGenerator(genId)
    expect(cur().generators[genId]?.level).toBe(1)
  })

  it('buyGenerator no-op si non abordable', () => {
    reset({ resources: {} })
    useGameStore.getState().buyGenerator(genId)
    expect(cur().generators[genId]?.level ?? 0).toBe(0)
  })

  it('buyConverter monte le niveau', () => {
    useGameStore.getState().buyConverter(convId)
    expect(cur().converters[convId]?.level).toBe(1)
  })

  it('toggleConverter bascule l activation, no-op si absent', () => {
    reset({ converters: { [convId]: { level: 1, enabled: true } } })
    useGameStore.getState().toggleConverter(convId)
    expect(cur().converters[convId]?.enabled).toBe(false)
    reset()
    useGameStore.getState().toggleConverter(convId)
    expect(cur().converters[convId]).toBeUndefined()
  })
})

describe('gestes manuels', () => {
  it('click crédite la ressource de clic', () => {
    reset({ resources: {} })
    useGameStore.getState().click(era0.clickResource)
    expect(cur().resources[era0.clickResource] ?? 0).toBeGreaterThan(0)
  })

  it('manualConvert et manualProduce créditent la Complexité', () => {
    useGameStore.getState().manualConvert(convId)
    expect(cur().complexity).toBeGreaterThan(0)
    reset()
    useGameStore.getState().manualProduce(convId)
    expect(cur().complexity).toBeGreaterThan(0)
  })
})

describe('ères', () => {
  it('setEra bascule vers une ère débloquée, ignore une verrouillée', () => {
    reset({ unlockedEras: [era0.id, defs.eras[1]!.id], currentEraId: era0.id })
    useGameStore.getState().setEra(defs.eras[1]!.id)
    expect(cur().currentEraId).toBe(defs.eras[1]!.id)
    useGameStore.getState().setEra('nonexistent')
    expect(cur().currentEraId).toBe(defs.eras[1]!.id)
  })

  it('unlockNextEra franchit le palier suivant quand abordable', () => {
    reset({ complexity: 1e15, resources: { ...rich } })
    useGameStore.getState().unlockNextEra()
    expect(cur().unlockedEras).toContain(defs.eras[1]!.id)
  })
})

describe('crises', () => {
  it('triggerCrisis arme une crise une seule fois, ignore une def inconnue', () => {
    const threshold = defs.crises[crisisId]!.risk.threshold
    useGameStore.getState().triggerCrisis(crisisId)
    expect(cur().crises[crisisId]?.risk).toBe(threshold)
    // Re-trigger: no change (already armed).
    useGameStore.getState().triggerCrisis(crisisId)
    expect(cur().crises[crisisId]?.risk).toBe(threshold)
    useGameStore.getState().triggerCrisis('unknown')
    expect(cur().crises['unknown']).toBeUndefined()
  })

  it('resolveCrisis marque la crise résolue', () => {
    reset({ crises: { [crisisId]: { risk: 1e6, resolved: false, count: 0 } } })
    useGameStore.getState().resolveCrisis(crisisId)
    expect(cur().crises[crisisId]?.resolved).toBe(true)
  })
})

describe('prestige et échos', () => {
  it('gainEcho crédite un Écho', () => {
    reset({ echoes: 2 })
    useGameStore.getState().gainEcho()
    expect(cur().echoes).toBe(3)
  })

  it('prestige réinitialise la partie en gardant les échos et incrémente epoch', () => {
    reset({ echoes: 4, complexity: 500, generators: { [genId]: { level: 9 } } })
    const epochBefore = useGameStore.getState().epoch
    useGameStore.getState().prestige()
    expect(cur().echoes).toBe(4)
    expect(cur().complexity).toBe(0)
    expect(cur().generators).toEqual({})
    expect(cur().currentEraId).toBe(era0.id)
    expect(useGameStore.getState().epoch).toBe(epochBefore + 1)
  })

  it('buyMetaUpgrade puis refundMetaUpgrade font un aller-retour', () => {
    reset({ echoes: metaDef.echoCost })
    useGameStore.getState().buyMetaUpgrade(metaDef.id)
    expect(cur().metaUpgrades[metaDef.id]).toBe(true)
    expect(cur().echoes).toBe(0)
    useGameStore.getState().refundMetaUpgrade(metaDef.id)
    expect(cur().metaUpgrades[metaDef.id]).toBe(false)
    expect(cur().echoes).toBe(metaDef.echoCost)
  })
})

describe('galets et mini-jeux', () => {
  it('toggleGalet bascule un galet trouvé, no-op sinon', () => {
    reset({ galets: { g: { found: true, active: true } } })
    useGameStore.getState().toggleGalet('g')
    expect(cur().galets['g']?.active).toBe(false)
    useGameStore.getState().toggleGalet('absent')
    expect(cur().galets['absent']).toBeUndefined()
  })

  it('startMemoryGame débite si abordable, échoue sinon', () => {
    reset({ complexity: 1000 })
    expect(useGameStore.getState().startMemoryGame()).toBe(true)
    expect(cur().complexity).toBeLessThan(1000)
    reset({ complexity: 0 })
    expect(useGameStore.getState().startMemoryGame()).toBe(false)
  })

  it('winMemoryGame incrémente le niveau de mémoire de l ère courante', () => {
    useGameStore.getState().winMemoryGame()
    expect(cur().memoryLevels[era0.id]).toBe(1)
  })

  it('awardComplexityBoost incrémente et renvoie le compte', () => {
    expect(useGameStore.getState().awardComplexityBoost()).toBe(1)
    expect(cur().complexityBoosts[era0.id]).toBe(1)
  })
})

describe('découvertes de widget', () => {
  it('discoverCityPairs ajoute les paires neuves, ignore les doublons', () => {
    useGameStore.getState().discoverCityPairs(['a', 'b'])
    expect(cur().cityPairs).toEqual(['a', 'b'])
    useGameStore.getState().discoverCityPairs(['b', 'c'])
    expect(cur().cityPairs).toEqual(['a', 'b', 'c'])
  })

  it('discoverInvention avance et monte le pic ; resetInventions remet à zéro mais garde le pic', () => {
    useGameStore.getState().discoverInvention()
    useGameStore.getState().discoverInvention()
    expect(cur().inventions).toBe(2)
    expect(cur().inventionsPeak).toBe(2)
    useGameStore.getState().resetInventions()
    expect(cur().inventions).toBe(0)
    expect(cur().inventionsPeak).toBe(2) // le pic survit au reset (rejeu moins cher)
  })
})

describe('sauvegarde et reset', () => {
  it('exportSave / importSave font un aller-retour (ok)', () => {
    reset({ complexity: 777 })
    const code = useGameStore.getState().exportSave()
    reset({ complexity: 0 })
    expect(useGameStore.getState().importSave(code)).toBe('ok')
    expect(cur().complexity).toBe(777)
  })

  it('importSave signale une chaîne illisible (invalid)', () => {
    expect(useGameStore.getState().importSave('not-a-save')).toBe('invalid')
  })

  it('reset repart d un état neuf et incrémente epoch', () => {
    reset({ complexity: 999 })
    const epochBefore = useGameStore.getState().epoch
    useGameStore.getState().reset()
    expect(cur().complexity).toBe(0)
    expect(useGameStore.getState().epoch).toBe(epochBefore + 1)
  })

  it('clearTampered abaisse le drapeau', () => {
    useGameStore.setState({ tampered: true })
    useGameStore.getState().clearTampered()
    expect(useGameStore.getState().tampered).toBe(false)
  })

  it('persist met à jour lastSeen et écrit la sauvegarde', () => {
    reset()
    useGameStore.getState().persist()
    expect(localStorage.length).toBeGreaterThan(0)
  })
})
