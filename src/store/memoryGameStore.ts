import { create } from 'zustand'

/**
 * Transient (not persisted) signal: whether the memory mini-game window is open.
 * Used to hold back an interrupting modal (notably a crisis announcement) while
 * the player is in a memory game - a crisis readied meanwhile stays queued in
 * pendingEvents and surfaces when the window closes, never on top of it.
 * Distinct from memoryStore (the button highlight signal).
 */
interface MemoryGameStore {
  open: boolean
  setOpen: (open: boolean) => void
}

export const useMemoryGameStore = create<MemoryGameStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))
