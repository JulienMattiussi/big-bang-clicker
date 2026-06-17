import { describe, it, expect } from 'vitest'
import {
  GROUND_Y,
  STEP_MS,
  freshWorld,
  step,
  type CrisisWorld,
} from '@/components/game/crisisWorld'

describe('freshWorld', () => {
  it('démarre vide', () => {
    const w = freshWorld()
    expect(w.creatures).toEqual([])
    expect(w.meteors).toEqual([])
    expect(w.time).toBe(0)
  })
})

describe('step', () => {
  it('avance le temps d\'un tick et renvoie un nouvel état', () => {
    const w = freshWorld()
    const after = step(w)
    expect(after).not.toBe(w)
    expect(after.time).toBe(STEP_MS)
  })

  it('un météore qui touche le sol foudroie la créature dessous et laisse un flash', () => {
    const world: CrisisWorld = {
      creatures: [
        { id: 1, x: 50, vx: 0, kind: 'rat', state: 'run', t0: 0 },
      ],
      // Juste au-dessus du sol : un tick l\'amène à l\'impact, à la même abscisse.
      meteors: [{ id: 2, x: 50, y: GROUND_Y - 1, vy: 200 }],
      flashes: [],
      next: 3,
      time: 0,
      meteorTimer: 9999, // pas de spawn parasite ce tick
      creatureTimer: 9999,
    }
    const after = step(world)
    expect(after.creatures[0]?.state).toBe('hit')
    expect(after.flashes.length).toBeGreaterThan(0)
    // Le météore au sol est retiré du ciel.
    expect(after.meteors.every((m) => m.y < GROUND_Y)).toBe(true)
  })
})
