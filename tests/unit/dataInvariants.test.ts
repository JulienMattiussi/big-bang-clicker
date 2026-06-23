import { describe, it, expect } from 'vitest'
import { defs } from '@/data'
import { fr } from '@/i18n/translations/fr'
import { en } from '@/i18n/translations/en'
import { CRISIS_GAMES } from '@/store/crisisStore'
import { isCrisisReady, resolveCrisis } from '@/lib/crises'
import { applyMeta, metaMultiplier } from '@/lib/meta'
import { crisisGaletForEra, widgetGaletForEra } from '@/lib/galets'
import { tick } from '@/lib/engine'
import { makeState } from '../helpers'
import type { MetaTarget } from '@/lib/types'

/**
 * Invariants on the REAL game data (all 19 eras and their content), beyond
 * referential integrity (see data.test.ts). These assert that every game element
 * is in a valid, reachable state across the variety the eras introduce: chemical
 * resources, multi-input recipes, the three crisis trigger kinds, each galet
 * effect type, each meta target, and per-era i18n text.
 */

const hasKey = (k: string) => Object.prototype.hasOwnProperty.call(fr, k)

describe('progression des ères', () => {
  it('les ères sont indexées dans l ordre, sans trou', () => {
    defs.eras.forEach((era, i) => expect(era.index).toBe(i))
  })

  it('seule la première ère n a pas de condition de déblocage ; les autres ont un seuil positif', () => {
    defs.eras.forEach((era, i) => {
      const u = era.unlock
      if (i === 0) {
        expect(u.complexity ?? u.resource).toBeUndefined()
      } else {
        const threshold = u.complexity ?? u.amount
        expect(threshold).toBeDefined()
        expect(threshold!).toBeGreaterThan(0)
      }
    })
  })

  it('chaque ère a une ressource de clic révélée parmi ses ressources connues', () => {
    for (const era of defs.eras) {
      expect(defs.resources[era.clickResource]).toBeDefined()
    }
  })
})

describe('clés i18n des données (parité FR/EN stricte)', () => {
  // Collect every translation key the data references, per element kind.
  const keys = new Set<string>()
  defs.eras.forEach((era, i) => {
    keys.add(era.nameKey)
    keys.add(era.taglineKey)
    keys.add(era.stockKey)
    keys.add(era.machinesKey)
    keys.add(era.verbKey)
    // The starting era never fires a transition (events.ts skips it), so it needs
    // no transition key; every later era does.
    if (i > 0) keys.add(`era.${era.id}.transition`)
  })
  for (const r of Object.values(defs.resources)) keys.add(r.nameKey)
  for (const g of Object.values(defs.generators)) keys.add(g.nameKey)
  for (const c of Object.values(defs.converters)) keys.add(c.nameKey)
  for (const c of Object.values(defs.crises)) {
    keys.add(c.textKeys.warnKey)
    keys.add(c.textKeys.triggerKey)
    keys.add(c.textKeys.reboundKey)
  }
  for (const g of defs.galets) {
    keys.add(g.nameKey)
    keys.add(g.descKey)
    keys.add(g.loreKey)
  }
  for (const m of defs.metaUpgrades) {
    keys.add(m.nameKey)
    keys.add(m.descKey)
  }

  it('toute clé référencée par les données existe en FR', () => {
    const missing = [...keys].filter((k) => k && !Object.prototype.hasOwnProperty.call(fr, k))
    expect(missing).toEqual([])
  })

  it('toute clé référencée par les données existe en EN', () => {
    const missing = [...keys].filter((k) => k && !Object.prototype.hasOwnProperty.call(en, k))
    expect(missing).toEqual([])
  })
})

describe('crises réelles', () => {
  it('chaque crise a un déclencheur connu, un seuil positif et un gate valide', () => {
    for (const c of Object.values(defs.crises)) {
      expect(['threshold', 'player', 'probabilistic']).toContain(c.trigger)
      expect(c.risk.threshold).toBeGreaterThan(0)
      if (c.risk.gate) expect(defs.resources[c.risk.gate.resource]).toBeDefined()
    }
  })

  it('chaque crise se résout (régression + rebond appliqués, marquée résolue)', () => {
    for (const id of Object.keys(defs.crises)) {
      const def = defs.crises[id]!
      const armed = makeState({
        crises: { [id]: { risk: def.risk.threshold + 1, resolved: false, count: 0 } },
      })
      const resolved = resolveCrisis(armed, defs, id)
      expect(resolved.crises[id]?.resolved).toBe(true)
      expect(resolved.crises[id]?.count).toBe(1)
      expect(resolved.crises[id]?.risk).toBe(0)
    }
  })

  it('chaque mini-jeu de crise (CRISIS_GAMES) correspond à une crise réelle', () => {
    for (const id of CRISIS_GAMES) {
      expect(defs.crises[id], `crise inconnue dans CRISIS_GAMES: ${id}`).toBeDefined()
    }
  })

  it('une crise à seuil prête bloque effectivement le palier (telegraph)', () => {
    const threshold = Object.values(defs.crises).find((c) => c.trigger === 'threshold')
    expect(threshold).toBeDefined()
    const armed = makeState({
      crises: { [threshold!.id]: { risk: threshold!.risk.threshold, resolved: false, count: 0 } },
      ...(threshold!.risk.gate
        ? { resources: { [threshold!.risk.gate.resource]: threshold!.risk.gate.level } }
        : {}),
    })
    expect(isCrisisReady(armed, defs, threshold!.id)).toBe(true)
  })
})

describe('galets réels', () => {
  it('chaque galet pointe vers une ère existante et a un effet borné', () => {
    for (const g of defs.galets) {
      expect(defs.eras.some((e) => e.id === g.discoverEraId)).toBe(true)
      if ('maxEraIndex' in g.effect) expect(g.effect.maxEraIndex).toBeGreaterThanOrEqual(0)
    }
  })

  it('chaque galet à découverte widget/crise est retrouvé par son ère', () => {
    for (const g of defs.galets) {
      if (g.discovery === 'widget') expect(widgetGaletForEra(defs, g.discoverEraId)?.id).toBe(g.id)
      if (g.discovery === 'crisis') expect(crisisGaletForEra(defs, g.discoverEraId)?.id).toBe(g.id)
    }
  })

  it('les six types d effet de galet sont représentés dans les données', () => {
    const types = new Set(defs.galets.map((g) => g.effect.type))
    for (const t of [
      'generatorMultiplier',
      'converterMultiplier',
      'complexityMultiplier',
      'terminalConsumption',
      'widgetMultiplier',
      'memoryBoost',
    ]) {
      expect(types.has(t as never), `type d effet manquant: ${t}`).toBe(true)
    }
  })
})

describe('méta-upgrades réels', () => {
  it('chaque méta a un coût positif, une cible connue et est intégré par applyMeta', () => {
    const targets: MetaTarget[] = ['production', 'complexity', 'click', 'galet']
    for (const m of defs.metaUpgrades) {
      expect(m.echoCost).toBeGreaterThan(0)
      expect(targets).toContain(m.target)
      expect(m.multiplier).toBeGreaterThan(0)
      const owned = makeState({ metaUpgrades: { [m.id]: true } })
      expect(metaMultiplier(owned, defs, m.target)).toBeCloseTo(m.multiplier)
    }
  })

  it('les quatre cibles méta sont couvertes par les données', () => {
    const targets = new Set(defs.metaUpgrades.map((m) => m.target))
    for (const t of ['production', 'complexity', 'click', 'galet'] as MetaTarget[]) {
      expect(targets.has(t), `cible méta manquante: ${t}`).toBe(true)
    }
    // applyMeta renseigne les quatre emplacements même sans aucune possession.
    const m = applyMeta(makeState(), defs).multipliers
    expect(m.meta).toBe(1)
    expect(m.metaComplexity).toBe(1)
    expect(m.metaClick).toBe(1)
    expect(m.metaGalet).toBe(1)
  })
})

describe('chaque ère produit un état sain quand on la simule', () => {
  it('un tick avec générateurs au niveau 1 ne produit ni NaN ni quantité négative', () => {
    for (const era of defs.eras) {
      const generators = Object.fromEntries(era.generators.map((id) => [id, { level: 1 }]))
      // Stock de départ généreux pour que les recettes tournent.
      const resources = Object.fromEntries(Object.keys(defs.resources).map((r) => [r, 1e6]))
      const converters = Object.fromEntries(
        era.converters.map((id) => [id, { level: 1, enabled: true }]),
      )
      const state = makeState({
        currentEraId: era.id,
        unlockedEras: [era.id],
        generators,
        converters,
        resources,
      })
      const next = tick(state, defs, 1)
      for (const [id, qty] of Object.entries(next.resources)) {
        expect(Number.isFinite(qty), `${era.id}/${id} non fini`).toBe(true)
        expect(qty, `${era.id}/${id} négatif`).toBeGreaterThanOrEqual(0)
      }
      expect(Number.isFinite(next.complexity)).toBe(true)
      expect(next.complexity).toBeGreaterThanOrEqual(0)
      // The production -> Complexity loop must actually credit an era that has a
      // running converter, except the frozen collapse era (e19).
      if (era.converters.length > 0 && !era.freezeComplexity) {
        expect(next.complexity, `${era.id} ne crédite pas de Complexité`).toBeGreaterThan(0)
      }
    }
  })
})

describe('clés i18n inutilisées (gardes anti-coquille)', () => {
  it('FR et EN exposent exactement le même ensemble de clés', () => {
    const frKeys = Object.keys(fr).sort()
    const enKeys = Object.keys(en).sort()
    expect(enKeys).toEqual(frKeys)
  })

  it('hasKey reflète la présence réelle (sanity du helper)', () => {
    expect(hasKey(defs.eras[0]!.nameKey)).toBe(true)
  })
})
