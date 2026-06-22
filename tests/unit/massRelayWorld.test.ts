import { describe, it, expect } from 'vitest'
import {
  ALIGN_TOL,
  CHARGE_PER_CLICK,
  addCharge,
  angularGap,
  fire,
  freshRelay,
  step,
} from '@/components/game/widgets/massRelayWorld'

describe('angularGap', () => {
  it('mesure le plus petit écart angulaire (avec wrap 360)', () => {
    expect(angularGap(10, 10)).toBe(0)
    expect(angularGap(10, 350)).toBe(20)
    expect(angularGap(0, 180)).toBe(180)
    expect(angularGap(350, 10)).toBe(angularGap(10, 350))
  })
})

describe('addCharge', () => {
  it('ajoute une dose de charge et plafonne à 100', () => {
    expect(addCharge(freshRelay()).charge).toBe(CHARGE_PER_CLICK)
    expect(addCharge({ ...freshRelay(), charge: 95 }).charge).toBe(100)
  })

  it('ne charge pas pendant un lancement', () => {
    const launching = { ...freshRelay(), launch: 0.5 }
    expect(addCharge(launching)).toBe(launching)
  })
})

describe('fire', () => {
  it("ne fait rien si le noyau n'est pas plein", () => {
    const w = { ...freshRelay(), charge: 50 }
    expect(fire(w)).toBe(w)
  })

  it('catapulte un vaisseau quand le faisceau est aligné', () => {
    const w = { ...freshRelay(), charge: 100, spin: 90, target: 90 }
    const after = fire(w)
    expect(after.result).toBe('hit')
    expect(after.launch).toBe(0)
  })

  it('rate et purge de la charge quand le faisceau est désaligné', () => {
    const w = { ...freshRelay(), charge: 100, spin: 0, target: 180 }
    const after = fire(w)
    expect(after.result).toBe('miss')
    expect(after.charge).toBeLessThan(100)
    expect(angularGap(w.spin, w.target)).toBeGreaterThan(ALIGN_TOL)
  })
})

describe('step', () => {
  it('reste inerte (même référence) quand rien ne bouge', () => {
    const idle = freshRelay() // launch -1, pas de miss, charge < 100
    expect(step(idle, 0.05)).toBe(idle)
  })

  it('fait progresser le vaisseau lancé puis crédite une fédération', () => {
    const launched = { ...freshRelay(), charge: 100, launch: 0.9 }
    const after = step(launched, 1) // dt large: dépasse 1 -> arrivée
    expect(after.arrived).toBe(1)
    expect(after.launch).toBe(-1)
    expect(after.charge).toBe(0)
  })

  it('fait tourner le faisceau une fois le noyau plein', () => {
    const charged = { ...freshRelay(), charge: 100, spin: 0 }
    expect(step(charged, 0.1).spin).toBeGreaterThan(0)
  })
})
