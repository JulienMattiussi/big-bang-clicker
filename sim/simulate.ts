import { defs } from '@/data'
import { fr } from '@/i18n/translations/fr'
import { createInitialState } from '@/lib/save'
import { applyMeta } from '@/lib/meta'
import {
  applyClick,
  buyConverter,
  buyGenerator,
  canAfford,
  canUnlockNextEra,
  manualProduce,
  nextCost,
  nextLockedEra,
  tick,
  unlockNextEra,
} from '@/lib/engine'
import { readyCrises, resolveCrisis, updateRisk } from '@/lib/crises'
import { memoryUnlocked, memoryLevel, memoryEraMaxed, memoryStart, memoryWin } from '@/lib/memory'
import { revealedMachines, revealedResources } from '@/lib/reveal'
import { decliningResources } from '@/lib/graph'
import { discoverableGalets, widgetGaletForEra } from '@/lib/galets'
import type { EraDef, GameState } from '@/lib/types'
import type { Completeness, MilestoneStat, ProfileConfig, RunResult, UnlockPolicy } from './types'

const DT = 1
const MAX_ITERS = 1_000_000 // ~11.5 game-days: hard cap so a run always terminates
const READY_STALL_S = 600 // "ready" policy: unlock anyway if stuck this long while able
const GLOBAL_STALL_S = 5400 // 90 min with no progress and unable to unlock -> wall
const SAMPLE_INTERVAL_S = 120
const MAX_SAMPLES = 4000
/** Level the era's main converter must reach before its widget pebble can be
 *  found (mirrors GALET_UNLOCK_LEVEL in the assembly widget). */
const WIDGET_GALET_LEVEL = 2
const MAX_BUYS_PER_DECISION = 40
/** Memory: minimum game-seconds between attempts (an occasional deliberate act),
 *  and how many times a profile retries a level before giving up on it. */
const MEMORY_INTERVAL_S = 30
const MEMORY_MAX_TRIES = 5

/** Deterministic PRNG (mulberry32) seeded per run, so memory outcomes are
 *  reproducible (the sim never reads true randomness). */
function makeRng(seedStr: string): () => number {
  let seed = 0x9e3779b9
  for (let i = 0; i < seedStr.length; i++) seed = (Math.imul(seed ^ seedStr.charCodeAt(i), 0x85ebca6b) | 0) >>> 0
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ERA_BY_ID: Record<string, EraDef> = Object.fromEntries(defs.eras.map((e) => [e.id, e]))

function eraIndexOf(eraId: string): number {
  const n = Number(eraId.slice(1))
  return Number.isFinite(n) ? n : 0
}

function nameOf(era: EraDef): string {
  return (fr as Record<string, string>)[era.nameKey] ?? era.id
}

function measureCompleteness(state: GameState, era: EraDef): Completeness {
  const gActive = era.generators.filter((id) => (state.generators[id]?.level ?? 0) >= 1)
  const cActive = era.converters.filter((id) => (state.converters[id]?.level ?? 0) >= 1)
  const revealedRes = revealedResources(state, defs, era)
  const rRevealed = era.resources.filter((r) => revealedRes.has(r))
  const missing = [
    ...era.generators.filter((id) => (state.generators[id]?.level ?? 0) < 1),
    ...era.converters.filter((id) => (state.converters[id]?.level ?? 0) < 1),
  ]
  return {
    generators: { total: era.generators.length, active: gActive.length },
    converters: { total: era.converters.length, active: cActive.length },
    resources: { total: era.resources.length, revealed: rRevealed.length },
    fullyActivated:
      gActive.length === era.generators.length && cActive.length === era.converters.length,
    missing,
  }
}

/** Buys the single best affordable revealed machine, or returns null. */
function purchaseOnce(state: GameState, strategy: ProfileConfig['strategy']): GameState | null {
  let best: { id: string; isConv: boolean; costSum: number; tier: number } | null = null
  for (const eraId of state.unlockedEras) {
    const era = ERA_BY_ID[eraId]
    if (!era) continue
    for (const id of revealedMachines(state, defs, era)) {
      const gen = defs.generators[id]
      const conv = defs.converters[id]
      const def = gen ?? conv
      if (!def) continue
      const level = gen ? (state.generators[id]?.level ?? 0) : (state.converters[id]?.level ?? 0)
      const cost = nextCost(def.cost, level)
      if (!canAfford(state.resources, cost)) continue
      const costSum = Object.values(cost).reduce((a, b) => a + b, 0)
      const isConv = !!conv
      const tier = isConv
        ? Math.max(...conv.outputs.map((o) => defs.resources[o.resource]?.tier ?? 0))
        : (defs.resources[gen.output]?.tier ?? 0)
      const cand = { id, isConv, costSum, tier }
      if (!best) {
        best = cand
      } else if (strategy === 'tierFirst') {
        // Prefer converters (they make Complexity), then higher tier, then cheaper.
        const score =
          Number(cand.isConv) - Number(best.isConv) ||
          cand.tier - best.tier ||
          best.costSum - cand.costSum
        if (score > 0) best = cand
      } else if (cand.costSum < best.costSum) {
        best = cand
      }
    }
  }
  if (!best) return null
  return best.isConv ? buyConverter(state, defs, best.id) : buyGenerator(state, defs, best.id)
}

function doPurchases(
  state: GameState,
  strategy: ProfileConfig['strategy'],
): { state: GameState; count: number } {
  let count = 0
  for (let i = 0; i < MAX_BUYS_PER_DECISION; i++) {
    const next = purchaseOnce(state, strategy)
    if (!next) break
    state = next
    count++
  }
  return { state, count }
}

/** True if an input feeding the era from an EARLIER era is in deficit. */
function feederDeficit(state: GameState, era: EraDef): boolean {
  if (!era.converters.length) return false
  const declining = decliningResources(state, defs)
  for (const cid of era.converters) {
    const conv = defs.converters[cid]
    if (!conv) continue
    for (const inp of conv.inputs) {
      const rdef = defs.resources[inp.resource]
      if (rdef && eraIndexOf(rdef.eraId) < era.index && declining.has(inp.resource)) return true
    }
  }
  return false
}

export function simulate(
  profile: ProfileConfig,
  policy: UnlockPolicy,
  meta: { runId: string; runLabel: string; gitCommit: string; defsHash: string; generatedAt: string },
): RunResult {
  let state = applyMeta(createInitialState(0, defs.eras[0]?.id), defs)

  const milestones: MilestoneStat[] = defs.eras.map((e) => ({
    eraId: e.id,
    eraIndex: e.index,
    eraName: nameOf(e),
    reachableAtS: null,
    unlockedAtS: e.index === 0 ? 0 : null,
    grindS: null,
    backTrips: 0,
    crisesResolved: 0,
    completeness: null,
  }))
  const series: RunResult['series'] = []

  let t = 0
  let lastSample = -Infinity
  let lastComplexity = 0
  let stepsSinceProgress = 0
  let wasStarved = false
  let clickCarry = 0
  let completeCarry = 0
  let stuck = false
  const decisionEvery = Math.max(1, Math.round(profile.decisionIntervalS / DT))
  // Memory (era 7+): a deterministic RNG drives per-level success; a cooldown
  // spaces attempts and a per-level try counter lets a profile give up.
  const rng = makeRng(`${profile.id}:${policy}`)
  const memoryTries: Record<string, number> = {}
  let nextMemoryT = 0

  for (let iter = 0; iter < MAX_ITERS; iter++) {
    state = tick(state, defs, DT)
    state = updateRisk(state, defs, DT)

    // Discover and keep active any reachable infinity pebble (mirrors useGalets),
    // so their production multipliers actually affect the simulated progression.
    const newGalets = discoverableGalets(state, defs)
    if (newGalets.length > 0) {
      const galets = { ...state.galets }
      for (const g of newGalets) galets[g.id] = { found: true, active: true }
      state = { ...state, galets }
    }

    const currentEra = ERA_BY_ID[state.currentEraId] ?? defs.eras[0]

    // Widget pebble (e.g. the Cambrian diversity galet, clicked off the belt):
    // only a profile that plays the widgets finds it, and only while in its era
    // once the main converter is leveled enough. idle/minimal never click it.
    if (profile.completesPerSecond > 0) {
      const wg = widgetGaletForEra(defs, state.currentEraId)
      const conv = currentEra.converters[0]
      const convLevel = conv ? (state.converters[conv]?.level ?? 0) : 0
      if (wg && !state.galets[wg.id]?.found && convLevel >= WIDGET_GALET_LEVEL) {
        state = { ...state, galets: { ...state.galets, [wg.id]: { found: true, active: true } } }
      }
    }

    // Manual actions. Two modes:
    let clicks = 0
    if (profile.clickMode === 'bootstrap') {
      // Click ONLY to afford the era's first generator (start automation), then
      // hand off; the rest is funded by production.
      const gen0 = currentEra.generators[0]
      const running = gen0 ? (state.generators[gen0]?.level ?? 0) >= 1 : true
      if (gen0 && !running) {
        const cost = nextCost(defs.generators[gen0].cost, state.generators[gen0]?.level ?? 0)
        const need = (cost[currentEra.clickResource] ?? 0) - (state.resources[currentEra.clickResource] ?? 0)
        if (need > 0) clicks = Math.min(profile.clicksPerSecond * DT, Math.ceil(need))
      }
    } else {
      // Continuous clicking at the profile's rate (fractional via carry).
      clickCarry += profile.clicksPerSecond * DT
      clicks = Math.floor(clickCarry)
      clickCarry -= clicks
    }
    if (clicks > 0) state = applyClick(state, currentEra.clickResource, clicks)

    if (profile.clickMode !== 'bootstrap') {
      completeCarry += profile.completesPerSecond * DT
      let completes = Math.floor(completeCarry)
      completeCarry -= completes
      if (completes > 0 && currentEra.converters.length > 0) {
        const cid = currentEra.converters[0]
        while (completes-- > 0) state = manualProduce(state, defs, cid)
      }
    }

    // Crises resolved as soon as ready.
    for (const cid of readyCrises(state, defs)) {
      const eIdx = eraIndexOf(defs.crises[cid].eraId)
      state = resolveCrisis(state, defs, cid)
      if (milestones[eIdx]) milestones[eIdx].crisesResolved++
    }

    // Purchases + back-trip detection on the decision cadence.
    let bought = 0
    if (iter % decisionEvery === 0) {
      const res = doPurchases(state, profile.strategy)
      state = res.state
      bought = res.count
      const starved = feederDeficit(state, currentEra)
      if (starved && !wasStarved) milestones[currentEra.index].backTrips++
      wasStarved = starved
    }

    // Memory: an occasional stake of 10% Complexity that, on success, doubles the
    // era's main resource (and thus its Complexity yield). Spaced by a cooldown;
    // a profile gives up a level after MEMORY_MAX_TRIES failures.
    const rates = profile.memoryWinRate
    if (rates && t >= nextMemoryT && memoryUnlocked(state) && !memoryEraMaxed(state, currentEra.id)) {
      const level = memoryLevel(state, currentEra.id)
      const key = `${currentEra.id}:${level}`
      const rate = rates[level - 1] ?? 0
      if (rate > 0 && (memoryTries[key] ?? 0) < MEMORY_MAX_TRIES) {
        const staked = memoryStart(state)
        if (staked) {
          state = staked
          memoryTries[key] = (memoryTries[key] ?? 0) + 1
          nextMemoryT = t + MEMORY_INTERVAL_S
          if (rng() < rate) state = memoryWin(state, defs)
        }
      }
    }

    const next = nextLockedEra(state, defs)
    const canUnlock = !!next && canUnlockNextEra(state, defs)
    if (next && canUnlock && milestones[next.index]?.reachableAtS === null) {
      milestones[next.index].reachableAtS = t
    }

    const progressed = bought > 0 || state.complexity > lastComplexity + 1e-9
    stepsSinceProgress = progressed ? 0 : stepsSinceProgress + DT
    lastComplexity = state.complexity

    if (next && canUnlock) {
      const ready =
        policy === 'asap' ||
        measureCompleteness(state, currentEra).fullyActivated ||
        stepsSinceProgress >= READY_STALL_S
      if (ready) {
        milestones[currentEra.index].completeness = measureCompleteness(state, currentEra)
        state = unlockNextEra(state, defs)
        const m = milestones[next.index]
        m.unlockedAtS = t
        m.grindS = m.reachableAtS === null ? 0 : t - m.reachableAtS
        stepsSinceProgress = 0
        wasStarved = false
      }
    }

    if (t - lastSample >= SAMPLE_INTERVAL_S && series.length < MAX_SAMPLES) {
      series.push({ t, complexity: state.complexity, eraIndex: currentEra.index })
      lastSample = t
    }

    const latestIdx = currentEra.index
    if (latestIdx >= defs.eras.length - 1) break // reached the final era
    if (stepsSinceProgress >= GLOBAL_STALL_S && !canUnlock) {
      stuck = true
      break
    }
    t += DT
  }

  const finalEra = ERA_BY_ID[state.currentEraId] ?? defs.eras[0]
  if (milestones[finalEra.index] && milestones[finalEra.index].completeness === null) {
    milestones[finalEra.index].completeness = measureCompleteness(state, finalEra)
  }
  series.push({ t, complexity: state.complexity, eraIndex: finalEra.index })

  return {
    label: `${profile.id} / ${policy}`,
    profileId: profile.id,
    profileLabel: profile.label,
    unlockPolicy: policy,
    config: profile,
    runId: meta.runId,
    runLabel: meta.runLabel,
    gitCommit: meta.gitCommit,
    defsHash: meta.defsHash,
    generatedAt: meta.generatedAt,
    totalTimeS: t,
    finalEraIndex: finalEra.index,
    reachedFinal: finalEra.index >= defs.eras.length - 1,
    stuck,
    milestones,
    series,
  }
}
