import { create } from 'zustand'
import type { ConverterId, EraId, GameDefs, GameState, GeneratorId, ResourceId } from '@/lib/types'
import {
  applyClick,
  buyConverter,
  buyGenerator,
  manualConvert as runManualConvert,
  manualProduce as runManualProduce,
  tick,
  unlockNextEra as runUnlockNextEra,
} from '@/lib/engine'
import { resolveCrisis as runResolveCrisis, updateRisk } from '@/lib/crises'
import { prestige as runPrestige } from '@/lib/prestige'
import { applyMeta, buyMeta } from '@/lib/meta'
import { triggeredEvents } from '@/lib/events'
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
  /** Advances the game by `dt` seconds (production, risk, era unlocks). */
  tick: (dt: number) => void
  /** Manual click on a resource (the era's "verb"). */
  click: (resource: ResourceId, amount?: number) => void
  buyGenerator: (id: GeneratorId) => void
  buyConverter: (id: ConverterId) => void
  /** Applies a manual recipe once (interactive widgets, e.g. the periodic table). */
  manualConvert: (id: ConverterId) => void
  /** Produces a recipe's outputs once for free (no input consumed), with Complexity. */
  manualProduce: (id: ConverterId) => void
  /** Enables/disables a converter (to avoid draining a resource). */
  toggleConverter: (id: ConverterId) => void
  /** Resolves a ready crisis (applies regression then rebound). */
  resolveCrisis: (id: string) => void
  /** Switches the active era (among unlocked ones). */
  setEra: (id: EraId) => void
  /** Crosses the next milestone: spends the cost, unlocks and switches to it. */
  unlockNextEra: () => void
  /** Updates lastSeen and persists the state to localStorage. */
  persist: () => void
  /** Exportable string of the current save. */
  exportSave: () => string
  /** Imports an encoded save; returns false if the code is invalid. */
  importSave: (encoded: string) => boolean
  /** Fully resets the game (clears the save). */
  reset: () => void
  /** Triggers prestige (new Big Bang): reset except Echoes/meta-upgrades. */
  prestige: () => void
  /** Buys a prestige meta-upgrade with Echoes. */
  buyMetaUpgrade: (id: string) => void
  /** Marks a narrative event as shown (so it never fires again). */
  markEventSeen: (id: string) => void
}

function loadInitialState(now: number): GameState {
  const loaded = loadFromStorage()
  const base = loaded ? applyOffline(loaded, defs, now) : createInitialState(now, defs.eras[0]?.id)
  const ready = applyMeta(base, defs)
  // Pre-mark already-satisfied events as seen so a returning save doesn't replay
  // its whole past on load; only genuinely new events fire from now on.
  const seenEvents = { ...ready.seenEvents }
  for (const event of triggeredEvents(ready, defs)) seenEvents[event.id] = true
  return { ...ready, seenEvents }
}

export const useGameStore = create<GameStore>((set, get) => ({
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
  manualConvert: (id) => set((s) => ({ state: runManualConvert(s.state, s.defs, id) })),
  manualProduce: (id) => set((s) => ({ state: runManualProduce(s.state, s.defs, id) })),
  setEra: (id) =>
    set((s) =>
      s.state.unlockedEras.includes(id) ? { state: { ...s.state, currentEraId: id } } : {},
    ),
  unlockNextEra: () => set((s) => ({ state: runUnlockNextEra(s.state, s.defs) })),
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
  resolveCrisis: (id) => set((s) => ({ state: runResolveCrisis(s.state, s.defs, id) })),
  exportSave: () => encodeSave(get().state),
  importSave: (encoded) => {
    try {
      const next = applyMeta(applyOffline(decodeSave(encoded), defs, Date.now()), defs)
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
  prestige: () => {
    const next = runPrestige(get().state, Date.now())
    // The starting era stays unlocked after rebirth.
    const reborn = applyMeta(
      {
        ...next,
        currentEraId: defs.eras[0]?.id ?? '',
        unlockedEras: defs.eras[0] ? [defs.eras[0].id] : [],
      },
      defs,
    )
    saveToStorage(reborn)
    set({ state: reborn })
  },
  buyMetaUpgrade: (id) => set((s) => ({ state: buyMeta(s.state, s.defs, id) })),
  markEventSeen: (id) =>
    set((s) =>
      s.state.seenEvents[id]
        ? {}
        : { state: { ...s.state, seenEvents: { ...s.state.seenEvents, [id]: true } } },
    ),
}))
