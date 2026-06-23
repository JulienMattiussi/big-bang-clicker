import { describe, it, expect } from 'vitest'
import { applyMeta, buyMeta, canBuyMeta, metaMultiplier, refundMeta } from '@/lib/meta'
import { makeState, makeDefs } from '../helpers'
import type { MetaUpgradeDef } from '@/lib/types'

const META: MetaUpgradeDef[] = [
  { id: 'm1', nameKey: '', descKey: '', echoCost: 10, target: 'production', multiplier: 2 },
  { id: 'm2', nameKey: '', descKey: '', echoCost: 20, target: 'production', multiplier: 3 },
]
const defs = makeDefs({ metaUpgrades: META })

const ALL_TARGETS: MetaUpgradeDef[] = [
  { id: 'prod', nameKey: '', descKey: '', echoCost: 1, target: 'production', multiplier: 2 },
  { id: 'cplx', nameKey: '', descKey: '', echoCost: 1, target: 'complexity', multiplier: 1.5 },
  { id: 'clic', nameKey: '', descKey: '', echoCost: 1, target: 'click', multiplier: 2 },
  { id: 'galet', nameKey: '', descKey: '', echoCost: 1, target: 'galet', multiplier: 2 },
]
const allDefs = makeDefs({ metaUpgrades: ALL_TARGETS })

describe('metaMultiplier', () => {
  it('vaut 1 sans méta-upgrade, produit des multiplicateurs possédés sinon', () => {
    expect(metaMultiplier(makeState(), defs)).toBe(1)
    expect(metaMultiplier(makeState({ metaUpgrades: { m1: true } }), defs)).toBe(2)
    expect(metaMultiplier(makeState({ metaUpgrades: { m1: true, m2: true } }), defs)).toBe(6)
  })
})

describe('canBuyMeta', () => {
  it('vrai seulement si défini, non possédé et abordable', () => {
    expect(canBuyMeta(makeState({ echoes: 10 }), defs, 'm1')).toBe(true)
    expect(canBuyMeta(makeState({ echoes: 9 }), defs, 'm1')).toBe(false)
    expect(canBuyMeta(makeState({ echoes: 99, metaUpgrades: { m1: true } }), defs, 'm1')).toBe(
      false,
    )
    expect(canBuyMeta(makeState({ echoes: 99 }), defs, 'unknown')).toBe(false)
  })
})

describe('metaMultiplier par cible', () => {
  it('isole chaque cible (production, complexité, clic, galet)', () => {
    const owned = makeState({ metaUpgrades: { cplx: true, galet: true } })
    expect(metaMultiplier(owned, allDefs, 'production')).toBe(1)
    expect(metaMultiplier(owned, allDefs, 'complexity')).toBe(1.5)
    expect(metaMultiplier(owned, allDefs, 'click')).toBe(1)
    expect(metaMultiplier(owned, allDefs, 'galet')).toBe(2)
  })
})

describe('applyMeta', () => {
  it('écrit le multiplicateur courant dans multipliers.meta', () => {
    expect(applyMeta(makeState({ metaUpgrades: { m1: true } }), defs).multipliers.meta).toBe(2)
  })

  it('renseigne les quatre emplacements de multiplicateur', () => {
    const owned = makeState({ metaUpgrades: { prod: true, cplx: true, clic: true, galet: true } })
    const m = applyMeta(owned, allDefs).multipliers
    expect(m.meta).toBe(2)
    expect(m.metaComplexity).toBe(1.5)
    expect(m.metaClick).toBe(2)
    expect(m.metaGalet).toBe(2)
  })
})

describe('refundMeta', () => {
  it('rend l Écho, retire la possession et rafraîchit le multiplicateur', () => {
    const bought = buyMeta(makeState({ echoes: 10 }), defs, 'm1')
    expect(bought.echoes).toBe(0)
    const refunded = refundMeta(bought, defs, 'm1')
    expect(refunded.echoes).toBe(10)
    expect(refunded.metaUpgrades.m1).toBe(false)
    expect(refunded.multipliers.meta).toBe(1)
  })

  it('no-op si non possédé ou inconnu', () => {
    const s = makeState({ echoes: 5 })
    expect(refundMeta(s, defs, 'm1')).toBe(s)
    expect(refundMeta(s, defs, 'unknown')).toBe(s)
  })
})

describe('buyMeta', () => {
  it('débite les échos, possède l upgrade et rafraîchit multipliers.meta', () => {
    const next = buyMeta(makeState({ echoes: 30 }), defs, 'm2')
    expect(next.echoes).toBe(10)
    expect(next.metaUpgrades.m2).toBe(true)
    expect(next.multipliers.meta).toBe(3)
  })

  it('no-op si non abordable', () => {
    const poor = makeState({ echoes: 5 })
    expect(buyMeta(poor, defs, 'm1')).toBe(poor)
  })
})
