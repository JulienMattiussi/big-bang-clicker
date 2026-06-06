import { create } from 'zustand'
import type { ConverterId, EraId, GameDefs, GameState, GeneratorId, ResourceId } from '@/lib/types'
import { applyClick, buyConverter, buyGenerator, tick, unlockEras } from '@/lib/engine'
import { updateRisk } from '@/lib/crises'
import {
  applyOffline,
  createInitialState,
  exportSave as encodeSave,
  importSave as decodeSave,
  loadFromStorage,
  saveToStorage,
} from '@/lib/save'
import { defs } from '@/data'

interface GameStore {
  state: GameState
  defs: GameDefs
  /** Avance le jeu de `dt` secondes (production, risques, déblocages d'ères). */
  tick: (dt: number) => void
  /** Clic manuel sur une ressource (le "verbe" de l'ère). */
  click: (resource: ResourceId, amount?: number) => void
  buyGenerator: (id: GeneratorId) => void
  buyConverter: (id: ConverterId) => void
  /** Active/désactive un convertisseur (éviter qu'il draine une ressource). */
  toggleConverter: (id: ConverterId) => void
  /** Change l'ère active (parmi les ères débloquées). */
  setEra: (id: EraId) => void
  /** Met à jour lastSeen et persiste l'état dans le localStorage. */
  persist: () => void
  /** Chaîne exportable de la sauvegarde courante. */
  exportSave: () => string
  /** Importe une sauvegarde encodée ; renvoie false si le code est invalide. */
  importSave: (encoded: string) => boolean
  /** Réinitialise complètement la partie (efface la sauvegarde). */
  reset: () => void
}

function loadInitialState(now: number): GameState {
  const loaded = loadFromStorage()
  if (loaded) return applyOffline(loaded, defs, now)
  return createInitialState(now, defs.eras[0]?.id)
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: loadInitialState(Date.now()),
  defs,
  tick: (dt) =>
    set((s) => ({ state: unlockEras(updateRisk(tick(s.state, s.defs, dt), s.defs, dt), s.defs) })),
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
  setEra: (id) =>
    set((s) =>
      s.state.unlockedEras.includes(id) ? { state: { ...s.state, currentEraId: id } } : {},
    ),
  toggleConverter: (id) =>
    set((s) => {
      const current = s.state.converters[id]
      if (!current) return {}
      return {
        state: {
          ...s.state,
          converters: { ...s.state.converters, [id]: { ...current, enabled: !current.enabled } },
        },
      }
    }),
  persist: () =>
    set((s) => {
      const state = { ...s.state, lastSeen: Date.now() }
      saveToStorage(state)
      return { state }
    }),
  exportSave: () => encodeSave(get().state),
  importSave: (encoded) => {
    try {
      const next = applyOffline(decodeSave(encoded), defs, Date.now())
      saveToStorage(next)
      set({ state: next })
      return true
    } catch {
      return false
    }
  },
  reset: () => {
    const fresh = createInitialState(Date.now(), defs.eras[0]?.id)
    saveToStorage(fresh)
    set({ state: fresh })
  },
}))
