import { create } from 'zustand'

/** Number of creatures the player must shelter to overcome a crisis. */
export const CRISIS_GOAL = 50

/** Crises that have a survival mini-game (others resolve straight from the banner). */
export const CRISIS_GAMES = new Set(['extinction'])

/**
 * Transient (not persisted) state of the crisis mini-game: which crisis is being
 * fought and how many creatures have been sheltered so far. Reaching CRISIS_GOAL
 * resolves the crisis (handled by the widget).
 */
interface CrisisStore {
  fighting: string | null
  saved: number
  start: (id: string) => void
  rescue: () => void
  stop: () => void
}

export const useCrisisStore = create<CrisisStore>((set) => ({
  fighting: null,
  saved: 0,
  start: (id) => set({ fighting: id, saved: 0 }),
  rescue: () => set((s) => ({ saved: s.saved + 1 })),
  stop: () => set({ fighting: null, saved: 0 }),
}))
