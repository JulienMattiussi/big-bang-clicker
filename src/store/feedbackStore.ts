import { create } from 'zustand'

/**
 * Transient UI feedback: ephemeral floating +X / -X numbers on counters.
 * - gain: the objective, Complexity (octarine)
 * - resource: a resource produced/clicked (resource color)
 * - spend: a resource consumed (action color)
 */
export type FloaterTone = 'gain' | 'resource' | 'spend'

interface Floater {
  id: number
  /** Counter the floater is anchored to, e.g. 'complexity' or 'res:star'. */
  target: string
  text: string
  tone: FloaterTone
}

let nextId = 0

interface FeedbackStore {
  floaters: Floater[]
  /** Spawns a floating delta on a counter (decorative; auto-removed by the UI). */
  spawn: (target: string, text: string, tone: FloaterTone) => void
  remove: (id: number) => void
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  floaters: [],
  spawn: (target, text, tone) =>
    set((s) => ({ floaters: [...s.floaters, { id: nextId++, target, text, tone }] })),
  remove: (id) => set((s) => ({ floaters: s.floaters.filter((f) => f.id !== id) })),
}))
