import { create } from 'zustand'

/**
 * Transient (not persisted) UI signal for the memory feature: a one-shot
 * highlight of the memory button, fired when its unlock modal is dismissed so
 * the player sees where the new power lives.
 */
interface MemoryStore {
  highlight: boolean
  flash: () => void
  clearHighlight: () => void
}

export const useMemoryStore = create<MemoryStore>((set) => ({
  highlight: false,
  flash: () => set({ highlight: true }),
  clearHighlight: () => set({ highlight: false }),
}))
