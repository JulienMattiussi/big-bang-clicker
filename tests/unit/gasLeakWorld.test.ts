import { describe, it, expect } from 'vitest'
import {
  H,
  STEP_MS,
  W,
  extinguish,
  freshGasLeak,
  step,
} from '@/components/game/gasLeakWorld'

describe('gasLeakWorld', () => {
  it('starts empty at time 0', () => {
    const w = freshGasLeak()
    expect(w.leaks).toHaveLength(0)
    expect(w.time).toBe(0)
  })

  it('advances time by one step and keeps leaks inside the box', () => {
    let w = freshGasLeak()
    // The first leak appears once the initial spawnTimer (300ms) elapses.
    for (let i = 0; i < 5; i++) w = step(w)
    expect(w.time).toBe(5 * STEP_MS)
    expect(w.leaks.length).toBeGreaterThanOrEqual(1)
    for (const l of w.leaks) {
      expect(l.x).toBeGreaterThan(0)
      expect(l.x).toBeLessThan(W)
      expect(l.y).toBeGreaterThan(0)
      expect(l.y).toBeLessThan(H)
    }
  })

  it('keeps spawning (unwinnable: more leaks over time)', () => {
    let w = freshGasLeak()
    for (let i = 0; i < 60; i++) w = step(w)
    expect(w.leaks.length).toBeGreaterThan(2)
  })

  it('extinguish removes one leak by id without touching the rest', () => {
    let w = freshGasLeak()
    for (let i = 0; i < 20; i++) w = step(w)
    const target = w.leaks[0]!.id
    const before = w.leaks.length
    w = extinguish(w, target)
    expect(w.leaks).toHaveLength(before - 1)
    expect(w.leaks.some((l) => l.id === target)).toBe(false)
  })
})
