import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useEventStore } from '@/store/eventStore'
import { triggeredEvents } from '@/lib/events'

/**
 * Watches the game state and enqueues newly-satisfied narrative events once
 * (deduped via GameState.seenEvents). Call once in App, alongside useTick.
 */
export function useEvents(): void {
  useEffect(() => {
    const check = () => {
      const { state, defs, markEventSeen } = useGameStore.getState()
      const enqueue = useEventStore.getState().enqueue
      for (const event of triggeredEvents(state, defs)) {
        if (!state.seenEvents[event.id]) {
          markEventSeen(event.id)
          enqueue(event)
        }
      }
    }
    check()
    return useGameStore.subscribe(check)
  }, [])
}
