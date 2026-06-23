import { describe, it, expect } from 'vitest'
import {
  ROWS,
  SRC_ROW,
  STAGES,
  computeFlow,
  freshSpice,
  openings,
  rotate,
  type SpiceWorld,
} from '@/components/game/spiceWorld'

// A straight pipe at rot 1 opens West (3) and East (1); a full row 1 of those
// links the inlet to the outlet, so the puzzle is solved.
function solvedRow(cols: number): SpiceWorld {
  const tiles = Array.from({ length: ROWS * cols }, (_, i) =>
    Math.floor(i / cols) === SRC_ROW
      ? { type: 'straight' as const, rot: 1 }
      : { type: 'straight' as const, rot: 0 },
  )
  return { cols, tiles }
}

describe('spiceWorld openings', () => {
  it('reflects the rotation of each piece', () => {
    expect(openings({ type: 'straight', rot: 0 })).toEqual([0, 2])
    expect(openings({ type: 'straight', rot: 1 })).toEqual([1, 3])
    expect(openings({ type: 'elbow', rot: 0 })).toEqual([0, 1])
    expect(openings({ type: 'tee', rot: 0 })).toEqual([0, 1, 2])
  })
})

describe('spiceWorld rotate', () => {
  it('turns only the targeted tile a quarter-turn clockwise (wrapping)', () => {
    const world: SpiceWorld = { cols: 2, tiles: [{ type: 'elbow', rot: 3 }, { type: 'tee', rot: 0 }] }
    const next = rotate(world, 0)
    expect(next.tiles[0]!.rot).toBe(0)
    expect(next.tiles[1]!.rot).toBe(0)
    expect(world.tiles[0]!.rot).toBe(3) // original untouched (pure)
  })
})

describe('spiceWorld computeFlow', () => {
  it('flows end to end on a solved row', () => {
    const flow = computeFlow(solvedRow(6))
    expect(flow.solved).toBe(true)
    expect(flow.reach).toBe(5)
  })

  it('is unsolved when the outlet tile is turned away', () => {
    const world = solvedRow(6)
    const outlet = SRC_ROW * world.cols + (world.cols - 1)
    world.tiles[outlet] = { type: 'straight', rot: 0 } // outlet no longer opens East
    const flow = computeFlow(world)
    expect(flow.solved).toBe(false)
  })
})

describe('spiceWorld freshSpice', () => {
  it('builds a grid sized for the requested stage', () => {
    for (let stage = 1; stage <= STAGES; stage++) {
      const world = freshSpice(stage)
      expect(world.cols).toBe(6 + stage * 2)
      expect(world.tiles).toHaveLength(ROWS * world.cols)
    }
  })
})
