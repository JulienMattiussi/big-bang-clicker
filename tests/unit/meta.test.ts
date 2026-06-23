import { describe, it, expect } from 'vitest'
import { applyMeta, buyMeta, canBuyMeta, metaMultiplier } from '@/lib/meta'
import { makeState, makeDefs } from '../helpers'
import type { MetaUpgradeDef } from '@/lib/types'

const META: MetaUpgradeDef[] = [
  { id: 'm1', nameKey: '', descKey: '', echoCost: 10, target: 'production', multiplier: 2 },
  { id: 'm2', nameKey: '', descKey: '', echoCost: 20, target: 'production', multiplier: 3 },
]
const defs = makeDefs({ metaUpgrades: META })

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

describe('applyMeta', () => {
  it('écrit le multiplicateur courant dans multipliers.meta', () => {
    expect(applyMeta(makeState({ metaUpgrades: { m1: true } }), defs).multipliers.meta).toBe(2)
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
