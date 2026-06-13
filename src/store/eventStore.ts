import { create } from 'zustand'
import type { GameEvent } from '@/lib/events'

/** Queue of narrative events to show in the modal (transient, not persisted). */
interface EventStore {
  queue: GameEvent[]
  /** Adds an event unless one with the same id is already queued. */
  enqueue: (event: GameEvent) => void
  dismiss: () => void
}

export const useEventStore = create<EventStore>((set) => ({
  queue: [],
  enqueue: (event) =>
    set((s) => (s.queue.some((e) => e.id === event.id) ? s : { queue: [...s.queue, event] })),
  dismiss: () => set((s) => ({ queue: s.queue.slice(1) })),
}))
