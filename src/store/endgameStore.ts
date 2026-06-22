import { create } from 'zustand'

/**
 * Transient (not persisted) end-game signal: set once the era-19 singularity widget
 * has been contracted to a point, which opens the rebirth modal (EndGameModal).
 */
interface EndgameStore {
  collapsed: boolean
  /** Contraction progress of the singularity widget, 0..1 (drives the collapsing
   *  complexity gauge in the era-19 header). */
  progress: number
  setProgress: (p: number) => void
  collapse: () => void
  reset: () => void
}

export const useEndgameStore = create<EndgameStore>((set) => ({
  collapsed: false,
  progress: 0,
  setProgress: (p) => set({ progress: p }),
  collapse: () => set({ collapsed: true, progress: 1 }),
  reset: () => set({ collapsed: false, progress: 0 }),
}))
