import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useEventStore } from '@/store/eventStore'
import { discoverableGalets } from '@/lib/galets'

/**
 * Watches the game state and, when an infinity pebble's milestone becomes
 * reachable, marks it found and enqueues its discovery modal (once). Call in App
 * alongside useEvents.
 */
export function useGalets(): void {
  useEffect(() => {
    const check = () => {
      const { state, defs, discoverGalet } = useGameStore.getState()
      const enqueue = useEventStore.getState().enqueue
      for (const galet of discoverableGalets(state, defs)) {
        enqueue({
          id: `galet:${galet.id}`,
          tone: 'transition',
          titleKey: 'galet.found.title',
          bodyKey: galet.descKey,
          icon: 'gem',
          galetId: galet.id,
        })
        discoverGalet(galet.id)
      }
    }
    check()
    return useGameStore.subscribe(check)
  }, [])
}
