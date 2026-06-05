import { create } from 'zustand'
import type { ConverterId, GameDefs, GameState, GeneratorId, ResourceId } from '@/lib/types'
import { applyClick, buyConverter, buyGenerator, tick } from '@/lib/engine'
import { updateRisk } from '@/lib/crises'
import { applyOffline, createInitialState, loadFromStorage, saveToStorage } from '@/lib/save'
import { defs } from '@/data'

interface GameStore {
  state: GameState
  defs: GameDefs
  /** Avance le jeu de `dt` secondes. */
  tick: (dt: number) => void
  /** Clic manuel sur une ressource (le "verbe" de l'ère). */
  click: (resource: ResourceId, amount?: number) => void
  buyGenerator: (id: GeneratorId) => void
  buyConverter: (id: ConverterId) => void
  /** Met à jour lastSeen et persiste l'état dans le localStorage. */
  persist: () => void
}

function loadInitialState(now: number): GameState {
  const loaded = loadFromStorage()
  if (loaded) return applyOffline(loaded, defs, now)
  return createInitialState(now)
}

export const useGameStore = create<GameStore>((set) => ({
  state: loadInitialState(Date.now()),
  defs,
  tick: (dt) => set((s) => ({ state: updateRisk(tick(s.state, s.defs, dt), s.defs, dt) })),
  click: (resource, amount = 1) => set((s) => ({ state: applyClick(s.state, resource, amount) })),
  buyGenerator: (id) =>
    set((s) => {
      const next = buyGenerator(s.state, s.defs, id)
      return next ? { state: next } : {}
    }),
  buyConverter: (id) =>
    set((s) => {
      const next = buyConverter(s.state, s.defs, id)
      return next ? { state: next } : {}
    }),
  persist: () =>
    set((s) => {
      const state = { ...s.state, lastSeen: Date.now() }
      saveToStorage(state)
      return { state }
    }),
}))
