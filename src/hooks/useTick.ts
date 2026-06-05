import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'

/** Cadence du moteur (ms). Découplée de la cadence d'affichage. */
const TICK_MS = 100
/** Intervalle d'autosauvegarde (ms). */
const SAVE_MS = 10_000

/**
 * Boucle de jeu : avance le moteur à intervalle régulier (dt mesuré à
 * l'horloge) et autosauvegarde périodiquement. À appeler une fois dans App.
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
    return () => clearInterval(interval)
  }, [])
}
