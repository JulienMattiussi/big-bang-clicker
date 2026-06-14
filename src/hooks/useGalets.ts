import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { discoverableGalets } from '@/lib/galets'
import type { GaletDef, GameEvent } from '@/lib/types'

/**
 * Enqueues a pebble's discovery popup. The pebble itself is granted only when
 * the popup is dismissed (dismissEvent reads the event's galetId), so a missed
 * popup never leaves the player with the effect but no story. enqueueEvent
 * dedupes, so calling this every tick while the pebble is still pending is safe.
 * Shared by the milestone watcher below and by widgets that hand out a pebble.
 */
function galetEvent(galet: GaletDef): GameEvent {
  return {
    id: `galet:${galet.id}`,
    tone: 'transition',
    titleKey: 'galet.found.title',
    bodyKey: galet.descKey,
    icon: 'gem',
    galetId: galet.id,
  }
}

export function announceGalet(galet: GaletDef): void {
  useGameStore.getState().enqueueEvent(galetEvent(galet))
}

/**
 * Watches the game state and, when an infinity pebble's milestone becomes
 * reachable, announces it. Widget-discovered pebbles are excluded here (their
 * widget triggers the discovery). Call in App alongside useEvents.
 */
export function useGalets(): void {
  useEffect(() => {
    const check = () => {
      const { state, defs, enqueueEvents } = useGameStore.getState()
      enqueueEvents(discoverableGalets(state, defs).map(galetEvent))
    }
    check()
    return useGameStore.subscribe(check)
  }, [])
}
