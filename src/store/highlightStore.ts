import { create } from 'zustand'

/**
 * Factory for the transient (not persisted) "highlight" stores shared by the
 * feature buttons (memory, inventory, renaissances log): a one-shot flag fired
 * when a feature's unlock modal closes, so the player sees its button land.
 */
export interface HighlightStore {
  highlight: boolean
  flash: () => void
  clearHighlight: () => void
}

export const createHighlightStore = () =>
  create<HighlightStore>((set) => ({
    highlight: false,
    flash: () => set({ highlight: true }),
    clearHighlight: () => set({ highlight: false }),
  }))
