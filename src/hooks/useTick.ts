import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'

/** Engine tick rate (ms). Decoupled from the render rate. */
const TICK_MS = 100
/** Autosave interval (ms). */
const SAVE_MS = 10_000

/**
 * Game loop: advances the engine at a fixed interval (dt measured from the
 * clock) and autosaves periodically. Call once in App.
 */
export function useTick(): void {
  const last = useRef(0)
  const lastSave = useRef(0)

  useEffect(() => {
    last.current = Date.now()
    lastSave.current = Date.now()
    const interval = setInterval(() => {
      const now = Date.now()
      const dt = (now - last.current) / 1000
      last.current = now
      if (dt > 0) useGameStore.getState().tick(dt)
      if (now - lastSave.current >= SAVE_MS) {
        lastSave.current = now
        useGameStore.getState().persist()
      }
    }, TICK_MS)

    // Also persist when leaving or backgrounding the page, so clicks made
    // between two autosaves are never lost on reload/close.
    const save = () => useGameStore.getState().persist()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save()
    }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
}
