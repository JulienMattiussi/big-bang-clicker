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
  /** Meta-upgrades owned when the modal opened: the ones bought now (this
   *  renaissance) are refundable, the others are locked-in from past rebirths. */
  baseMeta: Record<string, boolean>
  setProgress: (p: number) => void
  collapse: (baseMeta: Record<string, boolean>) => void
  reset: () => void
}

export const useEndgameStore = create<EndgameStore>((set) => ({
  collapsed: false,
  progress: 0,
  baseMeta: {},
  setProgress: (p) => set({ progress: p }),
  collapse: (baseMeta) => set({ collapsed: true, progress: 1, baseMeta }),
  reset: () => set({ collapsed: false, progress: 0, baseMeta: {} }),
}))
