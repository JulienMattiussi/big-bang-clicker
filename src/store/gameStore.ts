import { create } from 'zustand'
import type { ConverterId, EraId, GameDefs, GameState, GeneratorId, ResourceId } from '@/lib/types'
import {
  applyClick,
  buyConverter,
  buyGenerator,
  manualConvert as runManualConvert,
  manualProduce as runManualProduce,
  MAX_COMPLEXITY_BOOST,
  tick,
  unlockNextEra as runUnlockNextEra,
} from '@/lib/engine'
import { resolveCrisis as runResolveCrisis, updateRisk } from '@/lib/crises'
import { prestige as runPrestige } from '@/lib/prestige'
import { applyMeta, buyMeta } from '@/lib/meta'
import { triggeredEvents } from '@/lib/events'
import { memoryStart, memoryWin } from '@/lib/memory'
import {
  applyOffline,
  createInitialState,
  exportSave as encodeSave,
  importSave as decodeSave,
  loadFromStorage,
  saveToStorage,
  TAMPER_ERROR,
} from '@/lib/save'
import { defs } from '@/data'

interface GameStore {
  state: GameState
  defs: GameDefs
  /** True when a stored save was rejected at startup for failing its integrity check. */
  tampered: boolean
  /** Clears the startup tamper flag (once the rejection notice has been shown). */
  clearTampered: () => void
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
  /** Imports an encoded save: 'ok', 'invalid' (malformed), or 'tampered' (edited). */
  importSave: (encoded: string) => 'ok' | 'invalid' | 'tampered'
  /** Fully resets the game (clears the save). */
  reset: () => void
  /** Triggers prestige (new Big Bang): reset except Echoes/meta-upgrades. */
  prestige: () => void
  /** Buys a prestige meta-upgrade with Echoes. */
  buyMetaUpgrade: (id: string) => void
  /** Marks a narrative event as shown (so it never fires again). */
  markEventSeen: (id: string) => void
  /** Marks an infinity pebble as found (starts active). */
  discoverGalet: (id: string) => void
  /** Toggles a found pebble's effect on/off. */
  toggleGalet: (id: string) => void
  /** Pays the memory game's Complexity cost to start an attempt; false if too poor. */
  startMemoryGame: () => boolean
  /** Memory game cleared: doubles (cumulatively) the current era's main resource. */
  winMemoryGame: () => void
  /** Idea-constellation 10-sequence cleared: doubles the current era's Complexity.
   *  Returns the new boost count (for a unique announcement). */
  awardComplexityBoost: () => number
}

function loadInitialState(now: number): { state: GameState; tampered: boolean } {
  const { state: loaded, tampered } = loadFromStorage()
  const base = loaded ? applyOffline(loaded, defs, now) : createInitialState(now, defs.eras[0]?.id)
  const ready = applyMeta(base, defs)
  // Pre-mark already-satisfied events as seen so a returning save doesn't replay
  // its whole past on load; only genuinely new events fire from now on.
  const seenEvents = { ...ready.seenEvents }
  for (const event of triggeredEvents(ready, defs)) seenEvents[event.id] = true
  return { state: { ...ready, seenEvents }, tampered }
}

/**
 * Stamp + persist a state immediately, returning the store patch. Discrete
 * progress actions (a level, unlock, prestige, crisis, pebble, memory win) use
 * this so a hot-reload or quick refresh can't roll them back before the periodic
 * autosave runs. Continuous, high-frequency changes (tick, clicks) skip it and
 * rely on the autosave to avoid hammering localStorage.
 */
function commit(state: GameState): { state: GameState } {
  const stamped = { ...state, lastSeen: Date.now() }
  saveToStorage(stamped)
  return { state: stamped }
}

const initial = loadInitialState(Date.now())

export const useGameStore = create<GameStore>((set, get) => ({
  state: initial.state,
  defs,
  tampered: initial.tampered,
  clearTampered: () => set({ tampered: false }),
  tick: (dt) => set((s) => ({ state: updateRisk(tick(s.state, s.defs, dt), s.defs, dt) })),
  click: (resource, amount = 1) => set((s) => ({ state: applyClick(s.state, resource, amount) })),
  buyGenerator: (id) =>
    set((s) => {
      const next = buyGenerator(s.state, s.defs, id)
      return next ? commit(next) : {}
    }),
  buyConverter: (id) =>
    set((s) => {
      const next = buyConverter(s.state, s.defs, id)
      return next ? commit(next) : {}
    }),
  manualConvert: (id) => set((s) => ({ state: runManualConvert(s.state, s.defs, id) })),
  manualProduce: (id) => set((s) => ({ state: runManualProduce(s.state, s.defs, id) })),
  setEra: (id) =>
    set((s) => (s.state.unlockedEras.includes(id) ? commit({ ...s.state, currentEraId: id }) : {})),
  unlockNextEra: () => set((s) => commit(runUnlockNextEra(s.state, s.defs))),
  toggleConverter: (id) =>
    set((s) => {
      const current = s.state.converters[id]
      if (!current) return {}
      return commit({
        ...s.state,
        converters: { ...s.state.converters, [id]: { ...current, enabled: !current.enabled } },
      })
    }),
  persist: () =>
    set((s) => {
      const state = { ...s.state, lastSeen: Date.now() }
      saveToStorage(state)
      return { state }
    }),
  resolveCrisis: (id) => set((s) => commit(runResolveCrisis(s.state, s.defs, id))),
  exportSave: () => encodeSave(get().state),
  importSave: (encoded) => {
    try {
      const next = applyMeta(applyOffline(decodeSave(encoded), defs, Date.now()), defs)
      saveToStorage(next)
      set({ state: next })
      return 'ok'
    } catch (e) {
      return e instanceof Error && e.message === TAMPER_ERROR ? 'tampered' : 'invalid'
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
  buyMetaUpgrade: (id) => set((s) => commit(buyMeta(s.state, s.defs, id))),
  markEventSeen: (id) =>
    set((s) =>
      s.state.seenEvents[id]
        ? {}
        : { state: { ...s.state, seenEvents: { ...s.state.seenEvents, [id]: true } } },
    ),
  discoverGalet: (id) =>
    set((s) =>
      s.state.galets[id]?.found
        ? {}
        : commit({
            ...s.state,
            galets: { ...s.state.galets, [id]: { found: true, active: true } },
          }),
    ),
  toggleGalet: (id) =>
    set((s) => {
      const galet = s.state.galets[id]
      if (!galet?.found) return {}
      return commit({
        ...s.state,
        galets: { ...s.state.galets, [id]: { ...galet, active: !galet.active } },
      })
    }),
  startMemoryGame: () => {
    const next = memoryStart(get().state)
    if (!next) return false
    set(commit(next))
    return true
  },
  winMemoryGame: () => set((s) => commit(memoryWin(s.state, s.defs))),
  awardComplexityBoost: () => {
    const era = get().state.currentEraId
    const count = Math.min((get().state.complexityBoosts[era] ?? 0) + 1, MAX_COMPLEXITY_BOOST)
    set((s) => commit({ ...s.state, complexityBoosts: { ...s.state.complexityBoosts, [era]: count } }))
    return count
  },
}))
