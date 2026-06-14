import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { triggeredEvents } from '@/lib/events'

/**
 * Watches the game state and enqueues newly-satisfied narrative events. The
 * queue lives in GameState.pendingEvents (persisted); enqueueEvent dedupes
 * against what is already pending or already dismissed, so an event stays
 * queued until the player closes its modal. Call once in App, alongside useTick.
 */
export function useEvents(): void {
  useEffect(() => {
    const check = () => {
      const { state, defs, enqueueEvents } = useGameStore.getState()
      enqueueEvents(triggeredEvents(state, defs))
    }
    check()
    return useGameStore.subscribe(check)
  }, [])
}
