import { create } from 'zustand'

/**
 * Transient (not persisted) UI signal for the renaissances log button: a one-shot
 * highlight fired when the FIRST rebirth modal closes, so the player sees the new
 * button land in the header (mirrors the memory / inventory feature buttons).
 */
interface RebirthStore {
  highlight: boolean
  flash: () => void
  clearHighlight: () => void
}

export const useRebirthStore = create<RebirthStore>((set) => ({
  highlight: false,
  flash: () => set({ highlight: true }),
  clearHighlight: () => set({ highlight: false }),
}))
