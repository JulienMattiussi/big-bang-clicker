import { create } from 'zustand'
import type {
  ConverterId,
  EraId,
  GameDefs,
  GameEvent,
  GameState,
  GeneratorId,
  ResourceId,
} from '@/lib/types'
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
import { INVENTIONS } from '@/data/inventions'

interface GameStore {
  state: GameState
  defs: GameDefs
  /** Bumped whenever the whole state is replaced (import, reset, prestige) so views
   *  with transient local state (interactive widgets) remount instead of lingering. */
  epoch: number
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
  /** Adds narrative popups to the persisted pending queue in one update (deduped;
   *  skipped if already pending or dismissed). The popups survive a reload. */
  enqueueEvents: (events: GameEvent[]) => void
  /** Convenience: enqueue a single popup. */
  enqueueEvent: (event: GameEvent) => void
  /** Dismisses the front popup: marks it seen, applies its deferred effect (a
   *  pebble grant), and removes it from the queue. */
  dismissEvent: () => void
  /** Toggles a found pebble's effect on/off. */
  toggleGalet: (id: string) => void
  /** Pays the memory game's Complexity cost to start an attempt; false if too poor. */
  startMemoryGame: () => boolean
  /** Memory game cleared: doubles (cumulatively) the current era's main resource. */
  winMemoryGame: () => void
  /** Idea-constellation 10-sequence cleared: doubles the current era's Complexity.
   *  Returns the new boost count (for a unique announcement). */
  awardComplexityBoost: () => number
  /** City widget: records newly discovered neighbour pairings (kept across reloads). */
  discoverCityPairs: (keys: string[]) => void
  /** Inventions widget: reveals the next invention (persisted across reloads). */
  discoverInvention: () => void
  /** Inventions widget: restarts the discovery from the first invention (after a crisis). */
  resetInventions: () => void
  /** Inventions widget: makes a player-triggered crisis ready (once; never re-fires). */
  triggerCrisis: (id: string) => void
}

/**
 * One-time backlog suppression for a state that just entered play (a loaded or
 * imported save). The FIRST time, mark every already-satisfied event as seen so
 * its whole history is not replayed as fresh popups. After that we trust
 * seenEvents (set on dismiss) and pendingEvents (the persisted queue), so a popup
 * the player never closed - or one that came due offline - still shows.
 */
function initEvents(state: GameState): GameState {
  if (state.eventsInitialized) return state
  const seenEvents = { ...state.seenEvents }
  for (const event of triggeredEvents(state, defs)) seenEvents[event.id] = true
  return { ...state, seenEvents, eventsInitialized: true }
}

function loadInitialState(now: number): { state: GameState; tampered: boolean } {
  const { state: loaded, tampered } = loadFromStorage()
  const base = loaded ? applyOffline(loaded, defs, now) : createInitialState(now, defs.eras[0]?.id)
  const meta = applyMeta(base, defs)
  const ready = initEvents(meta)
  if (ready !== meta) saveToStorage(ready) // initialised this load: persist the flag
  return { state: ready, tampered }
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
  epoch: 0,
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
      // Restore the snapshot as saved: NO offline catch-up (it would credit hours
      // of production and could cross thresholds the save was below, e.g. a crisis
      // gate), just reset lastSeen. initEvents suppresses the backlog like a load.
      const decoded = { ...decodeSave(encoded), lastSeen: Date.now() }
      const next = initEvents(applyMeta(decoded, defs))
      saveToStorage(next)
      set((s) => ({ state: next, epoch: s.epoch + 1 }))
      return 'ok'
    } catch (e) {
      return e instanceof Error && e.message === TAMPER_ERROR ? 'tampered' : 'invalid'
    }
  },
  reset: () => {
    const fresh = createInitialState(Date.now(), defs.eras[0]?.id)
    saveToStorage(fresh)
    set((s) => ({ state: fresh, epoch: s.epoch + 1 }))
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
    set((s) => ({ state: reborn, epoch: s.epoch + 1 }))
  },
  buyMetaUpgrade: (id) => set((s) => commit(buyMeta(s.state, s.defs, id))),
  // Adds every not-seen, not-already-pending event in ONE set. We compute the
  // fresh list via get() and call set only when there is something new: a no-op
  // set would still notify subscribers, and useEvents enqueues from inside a
  // subscriber, so an empty set would recurse forever.
  enqueueEvents: (events) => {
    const s = get()
    const have = new Set(s.state.pendingEvents.map((e) => e.id))
    const fresh: GameEvent[] = []
    for (const e of events) {
      if (s.state.seenEvents[e.id] || have.has(e.id)) continue
      have.add(e.id)
      fresh.push(e)
    }
    if (fresh.length === 0) return
    set(commit({ ...s.state, pendingEvents: [...s.state.pendingEvents, ...fresh] }))
  },
  enqueueEvent: (event) => get().enqueueEvents([event]),
  dismissEvent: () =>
    set((s) => {
      const [front, ...rest] = s.state.pendingEvents
      if (!front) return {}
      const galets = front.galetId
        ? { ...s.state.galets, [front.galetId]: { found: true, active: true } }
        : s.state.galets
      return commit({
        ...s.state,
        galets,
        pendingEvents: rest,
        seenEvents: { ...s.state.seenEvents, [front.id]: true },
      })
    }),
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
    set((s) =>
      commit({ ...s.state, complexityBoosts: { ...s.state.complexityBoosts, [era]: count } }),
    )
    return count
  },
  discoverCityPairs: (keys) =>
    set((s) => {
      const fresh = keys.filter((k) => !s.state.cityPairs.includes(k))
      if (fresh.length === 0) return {}
      return commit({ ...s.state, cityPairs: [...s.state.cityPairs, ...fresh] })
    }),
  discoverInvention: () =>
    set((s) =>
      commit({ ...s.state, inventions: Math.min(s.state.inventions + 1, INVENTIONS.length) }),
    ),
  resetInventions: () => set((s) => commit({ ...s.state, inventions: 0 })),
  triggerCrisis: (id) =>
    set((s) => {
      const def = s.defs.crises[id]
      if (!def) return {}
      const runtime = s.state.crises[id]
      // Already resolved or already active: never re-fire (the looped USB/etc.
      // inventions reach the same crisis again, but it must trigger only once).
      if (runtime?.resolved || (runtime?.risk ?? 0) >= def.risk.threshold) return {}
      return commit({
        ...s.state,
        crises: {
          ...s.state.crises,
          [id]: { risk: def.risk.threshold, resolved: false, count: runtime?.count ?? 0 },
        },
      })
    }),
}))
