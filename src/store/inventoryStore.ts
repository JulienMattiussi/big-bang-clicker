import { create } from 'zustand'

/**
 * Transient (not persisted) UI signal for the backpack inventory: a one-shot
 * highlight of its button, fired when the unlock modal is dismissed so the
 * player sees where the new overview lives (mirrors the memory feature).
 */
interface InventoryStore {
  highlight: boolean
  flash: () => void
  clearHighlight: () => void
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  highlight: false,
  flash: () => set({ highlight: true }),
  clearHighlight: () => set({ highlight: false }),
}))
