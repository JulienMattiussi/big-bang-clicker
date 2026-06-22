import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

/**
 * Drives the era-19 finale: once in e19, ARM the gas-leak crisis (it is a 'player'
 * trigger, so it never arms by itself). Arming makes the standard crisis intro
 * modal ("Soudain...") appear; dismissing it drops into the full-screen mini-game
 * (EventModal's crisis handoff). Idempotent: triggerCrisis no-ops once armed or
 * resolved.
 */
export function useEndgame() {
  const inEra19 = useGameStore((s) => s.state.currentEraId === 'e19')
  const resolved = useGameStore((s) => !!s.state.crises['gasLeak']?.resolved)

  useEffect(() => {
    if (inEra19 && !resolved) useGameStore.getState().triggerCrisis('gasLeak')
  }, [inEra19, resolved])
}
