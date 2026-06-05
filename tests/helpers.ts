import { createInitialState } from '@/lib/save'
import type { GameState } from '@/lib/types'

/** État de jeu de test, avec surcharges partielles. */
export function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(0), ...overrides }
}
