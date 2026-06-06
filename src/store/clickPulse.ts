import { create } from 'zustand'

/**
 * Generic "the era's verb was activated" signal, fired by ClickArea on every
 * verb activation (mouse OR keyboard). Lets passive widgets react to the click
 * without nesting interactive elements - e.g. the cooling gauge cools here, so
 * it works for keyboard users too. Transient (not persisted).
 */
interface ClickPulse {
  count: number
  pulse: () => void
}

export const useClickPulse = create<ClickPulse>((set) => ({
  count: 0,
  pulse: () => set((s) => ({ count: s.count + 1 })),
}))
