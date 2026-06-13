import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useEventStore } from '@/store/eventStore'
import { discoverableGalets } from '@/lib/galets'
import type { GaletDef } from '@/lib/types'

/**
 * Marks a pebble found and enqueues its discovery modal (once). Shared by the
 * milestone watcher below and by widgets that hand out a pebble on a click (the
 * Cambrian assembly belt), so the discovery flow lives in one place.
 */
export function announceGalet(galet: GaletDef): void {
  useEventStore.getState().enqueue({
    id: `galet:${galet.id}`,
    tone: 'transition',
    titleKey: 'galet.found.title',
    bodyKey: galet.descKey,
    icon: 'gem',
    galetId: galet.id,
  })
  useGameStore.getState().discoverGalet(galet.id)
}

/**
 * Watches the game state and, when an infinity pebble's milestone becomes
 * reachable, announces it (once). Widget-discovered pebbles are excluded here
 * (their widget triggers the discovery). Call in App alongside useEvents.
 */
export function useGalets(): void {
  useEffect(() => {
    const check = () => {
      const { state, defs } = useGameStore.getState()
      for (const galet of discoverableGalets(state, defs)) announceGalet(galet)
    }
    check()
    return useGameStore.subscribe(check)
  }, [])
}
