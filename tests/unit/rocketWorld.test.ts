import { describe, it, expect } from 'vitest'
import {
  PAD_HALF,
  THRUST_PER_CLICK,
  addThrust,
  fireStar,
  freshWorld,
  nudge,
  steer,
  step,
  type Ship,
} from '@/components/game/widgets/rocketWorld'

/** A baseline ship (the fresh launch one), to override into any phase. */
const baseShip = (): Ship => freshWorld().slots[0] as Ship

describe('freshWorld', () => {
  it('démarre avec une fusée prête sur le pas de tir, les autres créneaux vides', () => {
    const w = freshWorld()
    expect(w.slots).toHaveLength(4)
    expect(w.slots[0]?.arrive).toBe(100)
    expect(w.slots[0]?.thrust).toBe(0)
    expect(w.slots.slice(1)).toEqual([null, null, null])
  })
})

describe('addThrust', () => {
  it('ajoute de la poussée et plafonne à 100', () => {
    expect(addThrust(freshWorld()).slots[0]?.thrust).toBe(THRUST_PER_CLICK)
    const almost = freshWorld()
    almost.slots[0] = { ...baseShip(), thrust: 98 }
    expect(addThrust(almost).slots[0]?.thrust).toBe(100)
  })
})

describe('nudge (phase ascension)', () => {
  const withAscent = (over: Partial<Ship>) => {
    const w = freshWorld()
    w.slots[1] = { ...baseShip(), tilt: 1, angle: 6, react: 1.5, needed: 3, ...over }
    return w
  }

  it('le bon côté (opposé au penché) redresse et compte une correction', () => {
    const after = nudge(withAscent({}), -1)
    expect(after.slots[1]?.tilt).toBe(0)
    expect(after.slots[1]?.corrected).toBe(1)
  })

  it('le mauvais côté fait exploser la fusée', () => {
    const after = nudge(withAscent({}), 1)
    expect(after.slots[1]?.result).toBe('crash')
  })

  it('ne fait rien quand la fusée est droite', () => {
    const w = withAscent({ tilt: 0, angle: 0 })
    expect(nudge(w, 1)).toBe(w)
  })
})

describe('fireStar (phase croisière)', () => {
  it('verrouille X puis Y, deux tirs réussis sur la cible', () => {
    const w = freshWorld()
    w.slots[2] = { ...baseShip(), reticle: 50, star: 50, reticleY: 30, starY: 30 }
    const x = fireStar(w)
    expect(x.hit).toBe(true)
    expect(x.world.slots[2]?.lockX).toBe(true)
    const y = fireStar(x.world)
    expect(y.hit).toBe(true)
    expect(y.world.slots[2]?.locked).toBe(true)
  })

  it("rate quand la mire est loin de l'étoile", () => {
    const w = freshWorld()
    w.slots[2] = { ...baseShip(), reticle: 0, star: 80 }
    expect(fireStar(w).hit).toBe(false)
  })
})

describe('steer + atterrissage', () => {
  it('oriente la dérive du vaisseau en approche', () => {
    const w = freshWorld()
    w.slots[3] = { ...baseShip(), x: 50, vx: 0, pad: 50, descent: 50 }
    expect(steer(w, 1).slots[3]?.vx).toBeGreaterThan(0)
    expect(steer(w, -1).slots[3]?.vx).toBeLessThan(0)
  })

  it('pose la fusée quand elle touche dans la zone du pad, sinon crash', () => {
    const onPad = freshWorld()
    onPad.slots[3] = { ...baseShip(), x: 50, vx: 0, pad: 50, descent: 99.9 }
    const landed = step(onPad, 0.1)
    expect(landed.slots[3]?.result).toBe('land')
    expect(landed.landedTotal).toBe(1)

    const offPad = freshWorld()
    offPad.slots[3] = { ...baseShip(), x: 10, vx: 0, pad: 50 + PAD_HALF + 20, descent: 99.9 }
    expect(step(offPad, 0.1).slots[3]?.result).toBe('crash')
  })
})

describe('step', () => {
  it('reste inerte (même référence) quand la fusée attend sur le pas de tir', () => {
    const idle = freshWorld() // pad prêt, thrust 0, rien d\'autre en vol
    expect(step(idle, 0.05)).toBe(idle)
  })
})
