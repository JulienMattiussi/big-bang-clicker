import { useCallback } from 'react'
import { useCrisisStore } from '@/store/crisisStore'
import { useGameStore } from '@/store/gameStore'

/**
 * Shared victory sequence for crisis mini-games (extinction, revolt, spice,
 * survive): resolve the active crisis, queue its rebound modal, and stop the
 * full-screen fight. Reads the live ids from the stores at call time, so callers
 * just invoke win() once their own goal is met.
 */
export function useCrisisWin(): () => void {
  const stop = useCrisisStore((s) => s.stop)
  const resolveCrisis = useGameStore((s) => s.resolveCrisis)
  const enqueueEvent = useGameStore((s) => s.enqueueEvent)

  return useCallback(() => {
    const fighting = useCrisisStore.getState().fighting
    if (!fighting) return
    const def = useGameStore.getState().defs.crises[fighting]
    resolveCrisis(fighting)
    if (def) {
      enqueueEvent({
        id: `crisis-won:${fighting}`,
        tone: 'transition',
        titleKey: 'crisis.overcome.title',
        bodyKey: def.textKeys.reboundKey,
      })
    }
    stop()
  }, [resolveCrisis, enqueueEvent, stop])
}
