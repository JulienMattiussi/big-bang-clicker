import { defs } from '@/data'
import { fr } from '@/i18n/translations/fr'
import { createInitialState } from '@/lib/save'
import { applyMeta } from '@/lib/meta'
import {
  applyComplete,
  applyGainBase,
  applyGainCombinedScaled,
  buyConverter,
  buyGenerator,
  canAfford,
  canUnlockNextEra,
  MAX_COMPLEXITY_BOOST,
  nextCost,
  nextLockedEra,
  tick,
  unlockNextEra,
} from '@/lib/engine'
import { readyCrises, resolveCrisis, updateRisk } from '@/lib/crises'
import { memoryUnlocked, memoryLevel, memoryEraMaxed, memoryStart, memoryWin } from '@/lib/memory'
import { revealedMachines, revealedResources } from '@/lib/reveal'
import { decliningResources, netFlows } from '@/lib/graph'
import { crisisGaletForEra, discoverableGalets, widgetGaletForEra } from '@/lib/galets'
import type { EraDef, GameState } from '@/lib/types'
import type {
  Completeness,
  MilestoneStat,
  ProfileConfig,
  RebirthConfig,
  RunResult,
  UnlockPolicy,
} from './types'

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
/** Idea constellation (Simon, widget 'memory'): a skilled profile clears a full
 *  10-sequence about this often, doubling the era's Complexity (capped). */
const SIMON_INTERVAL_S = 900
const SIMON_MIN_SKILL = 1 // completesPerSecond >= this (active/optimal): clears a 10-run
/** City widget (era 12): an active player completes a prosperous city about this
 *  often; each one raises a thriving multiplier scaling the widget's whole output
 *  (the gain per gesture AND the free recipe payout), as in CityGrid. Capped so a
 *  long stay in the era can't blow up the per-tick work into a runaway loop. */
const CITY_THRIVE_INTERVAL_S = 30
/** Caps cityThriving so cityMult (1 + thriving) tops out at 10, like the widget. */
const CITY_THRIVE_MAX = 9
/** Player-triggered crises (Industry, e14): spacing between forced triggers, so an
 *  active player reaches and overcomes them one after another across the era. */
const CRISIS_TRIGGER_INTERVAL_S = 150
/** Era-19 destruction finale, mirroring the UI sequence (useEndgame ->
 *  GasLeakGame -> SingularityWidget): the unwinnable gas-leak countdown
 *  (GasLeakGame LIMIT_MS = 15 s) then the singularity contraction
 *  (SingularityWidget CONTRACT_CLICKS taps, played at the profile's click rate). */
const GAS_CRISIS_S = 15
const SINGULARITY_CLICKS = 20
const MIN_CONTRACT_RATE = 0.5 // clicks/s floor so the contraction always terminates

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

/** 0-based era index (matches EraDef.index and the milestones array). NOT the
 *  1-based era number: `e15` -> 14, not 15. */
function eraIndexOf(eraId: string): number {
  return ERA_BY_ID[eraId]?.index ?? 0
}

function nameOf(era: EraDef): string {
  return (fr as Record<string, string>)[era.nameKey] ?? era.id
}

/** Eras whose widget reward is a factory-scaled +1 of the combined resource
 *  (Industry inventions + every space era) instead of the free full recipe. */
function usesScaledCombined(era: EraDef): boolean {
  return era.widget === 'inventions' || era.uiTier === 'space'
}

/** Applies `n` widget completions to `era`, via the SAME pure gestures the UI uses
 *  (so the sim can't drift from the real game): scaled eras grant a factory-scaled
 *  +combined, the others the free full recipe (the map widget doubles it via its
 *  bloc bonus). Generic space eras carry their combined on clicks, not completions. */
function applyCompletes(state: GameState, era: EraDef, n: number): GameState {
  if (n <= 0 || !era.converters[0]) return state
  if (usesScaledCombined(era)) {
    return era.widget === 'generic' ? state : applyGainCombinedScaled(state, defs, era, n).state
  }
  return applyComplete(state, defs, era, n * (era.widget === 'map' ? 2 : 1)).state
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

/** Surplus factor required on the base resource before switching on a converter
 *  that consumes it: production must exceed the new converter's draw by 50%, so
 *  the base keeps accumulating (to afford the next, deeper link) instead of being
 *  pinned at zero. Below this, the converter is held back and the base generator
 *  is grown first. */
const BASE_SURPLUS_FACTOR = 1.5

/** Buys the single best affordable revealed machine, or returns null. When
 *  `seedMachines` is set, an un-built machine (level 0) takes priority over
 *  leveling up an existing one - cheapest first - so every feeder in a chain gets
 *  switched on. A converter that draws on its era's BASE resource is held back
 *  until the base flow (real net, via `flows`) has the surplus to sustain it;
 *  meanwhile the base generator is grown (or the turn saved) so the chain can
 *  climb to its deepest element instead of starving on the first link. */
function purchaseOnce(
  state: GameState,
  strategy: ProfileConfig['strategy'],
  seedMachines = false,
  flows: Record<string, number> | null = null,
): GameState | null {
  let best: { id: string; isConv: boolean; costSum: number; tier: number } | null = null
  let bestSeed: { id: string; isConv: boolean; costSum: number } | null = null
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
      // Hold back (in seed mode) a level-0 converter that draws on its era's base
      // until the base flow can sustain it: it then counts for NEITHER pick, and
      // its generator is grown first - no starvation deadlock on the first link.
      if (seedMachines && level === 0 && conv && flows) {
        const baseInput = conv.inputs.find((inp) => inp.resource === era.clickResource)
        if (baseInput) {
          const draw = baseInput.amount * (conv.baseRate ?? 0.5)
          if ((flows[era.clickResource] ?? 0) < draw * BASE_SURPLUS_FACTOR) continue
        }
      }
      const cand = { id, isConv, costSum, tier }
      if (seedMachines && level === 0 && (!bestSeed || costSum < bestSeed.costSum)) {
        bestSeed = { id, isConv, costSum }
      }
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
  // Priority 1: switch on a not-yet-built machine that IS affordable.
  if (bestSeed) {
    return bestSeed.isConv
      ? buyConverter(state, defs, bestSeed.id)
      : buyGenerator(state, defs, bestSeed.id)
  }
  // Priority 2 (seedMachines): the earliest era whose cascade is still incomplete
  // gets its BASE generator grown, so feedstock builds up to climb toward the
  // deepest element (e.g. enough stellar pressure for fusion to reach iron) rather
  // than the chain stalling on its first link. Only the earliest pending chain is
  // chased (a `break`), and only if its generator is affordable; otherwise we fall
  // through to the normal pick (which, with starved base-consumers held back, just
  // grows that same generator or saves when nothing else is affordable).
  if (seedMachines) {
    for (const eraId of state.unlockedEras) {
      const era = ERA_BY_ID[eraId]
      if (!era) continue
      const revealed = revealedMachines(state, defs, era)
      const pending = era.converters.some(
        (id) => revealed.has(id) && (state.converters[id]?.level ?? 0) === 0,
      )
      if (!pending) continue
      const genId = era.generators[0]
      if (genId) {
        const gen = defs.generators[genId]
        const cost = nextCost(gen.cost, state.generators[genId]?.level ?? 0)
        if (canAfford(state.resources, cost)) return buyGenerator(state, defs, genId)
      }
      break
    }
  }
  if (!best) return null
  return best.isConv ? buyConverter(state, defs, best.id) : buyGenerator(state, defs, best.id)
}

function doPurchases(
  state: GameState,
  strategy: ProfileConfig['strategy'],
  seedMachines = false,
): { state: GameState; count: number } {
  let count = 0
  for (let i = 0; i < MAX_BUYS_PER_DECISION; i++) {
    // Real net flows drive the base-surplus gate; only needed (and only paid for)
    // when seeding, and refreshed each buy since growing the generator shifts them.
    const flows = seedMachines ? netFlows(state, defs) : null
    const next = purchaseOnce(state, strategy, seedMachines, flows)
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
  rebirth: RebirthConfig = { rebirths: 0, metaUpgrades: [] },
): RunResult {
  const wallStart = Date.now()
  // Start directly at the requested renaissance level with its Echo allocation
  // pre-applied (no multi-tour): the meta-upgrades are owned and their multipliers
  // baked in by applyMeta, and the unspent Echoes are credited.
  const ownedMeta = Object.fromEntries(rebirth.metaUpgrades.map((id) => [id, true]))
  let state = applyMeta(
    {
      ...createInitialState(0, defs.eras[0]?.id),
      rebirths: rebirth.rebirths,
      echoes: Math.max(0, rebirth.rebirths - rebirth.metaUpgrades.length),
      metaUpgrades: ownedMeta,
    },
    defs,
  )

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
  let nextSimonT = SIMON_INTERVAL_S
  // City widget (era 12): thriving cities completed so far, raising the multiplier.
  let cityThriving = 0
  let nextCityThriveT = CITY_THRIVE_INTERVAL_S
  let nextCrisisT = CRISIS_TRIGGER_INTERVAL_S
  // Single pass: time of first reaching the final era, and the collapse time.
  let firstFinalT: number | null = null
  let destroyedAtS: number | null = null

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
    // once the main converter is leveled enough. minimal never clicks it.
    if (profile.completesPerSecond > 0) {
      const wg = widgetGaletForEra(defs, state.currentEraId)
      const conv = currentEra.converters[0]
      const convLevel = conv ? (state.converters[conv]?.level ?? 0) : 0
      if (wg && !state.galets[wg.id]?.found && convLevel >= WIDGET_GALET_LEVEL) {
        state = { ...state, galets: { ...state.galets, [wg.id]: { found: true, active: true } } }
      }
    }

    // Idea constellation (Simon, widget 'memory'): a skilled profile periodically
    // clears a full 10-sequence, doubling this era's Complexity (capped at x8).
    if (
      profile.completesPerSecond >= SIMON_MIN_SKILL &&
      currentEra.widget === 'memory' &&
      t >= nextSimonT &&
      (state.complexityBoosts[currentEra.id] ?? 0) < MAX_COMPLEXITY_BOOST
    ) {
      const era = currentEra.id
      state = {
        ...state,
        complexityBoosts: { ...state.complexityBoosts, [era]: (state.complexityBoosts[era] ?? 0) + 1 },
      }
      nextSimonT = t + SIMON_INTERVAL_S
    }

    // City widget (era 12): each prosperous city raises a thriving multiplier
    // that scales the gain per gesture (modelled on the clicks below), as the
    // player keeps building. Only profiles that play the widget benefit; capped
    // like the widget (CityGrid) so the multiplier tops out.
    if (
      profile.completesPerSecond > 0 &&
      currentEra.widget === 'city' &&
      t >= nextCityThriveT &&
      cityThriving < CITY_THRIVE_MAX
    ) {
      cityThriving++
      nextCityThriveT = t + CITY_THRIVE_INTERVAL_S
    }
    const cityMult = currentEra.widget === 'city' ? 1 + cityThriving : 1
    // World map (era 13): expansion is forced-contiguous (revealed from Europe),
    // so almost every claim lands the bloc bonus -> x2 on both gain and output.
    const mapMult = currentEra.widget === 'map' ? 2 : 1

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
    const scaled = usesScaledCombined(currentEra)
    // Generic space eras (e16/e17): no bespoke widget, so the combined resource
    // rides on each CLICK (gainBase + gainCombinedScaled), as in ClickArea.
    const spaceGeneric = scaled && currentEra.widget === 'generic'
    if (clicks > 0) {
      // Same gainBase the UI uses: the click yields clickYield (scales with the
      // generator level + multipliers), not a flat +1. The city/map widgets pass a
      // bigger `n`, modelled here as the cityMult/mapMult factor on the click count.
      state = applyGainBase(state, defs, currentEra, clicks * cityMult * mapMult).state
      if (spaceGeneric) state = applyGainCombinedScaled(state, defs, currentEra, clicks).state
    }

    if (profile.clickMode !== 'bootstrap') {
      completeCarry += profile.completesPerSecond * DT
      const completes = Math.floor(completeCarry)
      completeCarry -= completes
      // Widgets only ever produce RESOURCES for the era being played (the latest):
      // they never touch factory levels. Earlier factories are grown by PURCHASES
      // (below), not by replaying old widgets.
      if (completes > 0) state = applyCompletes(state, currentEra, completes)
    }

    // Crises an engaged player reaches and overcomes in the current era: the
    // player-triggered ones (Industry inventions) AND the GATED threshold crises
    // (e.g. the e17 encounter, gated by federation >= 500k) that a complexity-
    // rushing run would otherwise skip. Force them one at a time (waiting for each
    // to resolve), meeting any gate so the crisis can ready - modelling the player
    // having built up to it. Their rebound multipliers AND their reward pebble
    // (granted on resolution below) then shape the late economy.
    if (profile.completesPerSecond > 0 && t >= nextCrisisT) {
      const eraCrises = Object.keys(defs.crises).filter((id) => {
        const d = defs.crises[id]
        return (
          d.eraId === currentEra.id &&
          (d.trigger === 'player' || (d.trigger === 'threshold' && !!d.risk.gate))
        )
      })
      const anyPending = eraCrises.some(
        (id) =>
          !state.crises[id]?.resolved &&
          (state.crises[id]?.risk ?? 0) >= defs.crises[id].risk.threshold,
      )
      const nextC = anyPending ? undefined : eraCrises.find((id) => !state.crises[id]?.resolved)
      if (nextC) {
        const def = defs.crises[nextC]
        const resources = { ...state.resources }
        if (def.risk.gate) {
          resources[def.risk.gate.resource] = Math.max(
            resources[def.risk.gate.resource] ?? 0,
            def.risk.gate.level,
          )
        }
        state = {
          ...state,
          resources,
          crises: {
            ...state.crises,
            [nextC]: { risk: def.risk.threshold, resolved: false, count: state.crises[nextC]?.count ?? 0 },
          },
        }
        nextCrisisT = t + CRISIS_TRIGGER_INTERVAL_S
      }
    }

    // Crises resolved as soon as ready. Overcoming one grants its reward pebble
    // (mirrors useCrisisWin/announceGalet): notably the e17 encounter yields the
    // Force pebble, which cuts the memory game's cost from 10% to 1% of Complexity.
    for (const cid of readyCrises(state, defs)) {
      const def = defs.crises[cid]
      state = resolveCrisis(state, defs, cid)
      const eIdx = eraIndexOf(def.eraId)
      if (milestones[eIdx]) milestones[eIdx].crisesResolved++
      const galet = crisisGaletForEra(defs, def.eraId)
      if (galet && !state.galets[galet.id]?.found) {
        state = { ...state, galets: { ...state.galets, [galet.id]: { found: true, active: true } } }
      }
    }

    // Purchases + back-trip detection on the decision cadence.
    let bought = 0
    if (iter % decisionEvery === 0) {
      const res = doPurchases(state, profile.strategy, profile.seedMachines)
      state = res.state
      bought = res.count
      // Engaged players (active/optimal) don't let earlier eras' resources sit idle:
      // a second, cheapest-first pass spends each era's accumulated surplus on its
      // own factory upgrades, so OLDER factories keep climbing - not only the latest.
      // (A no-op for 'cheapest' profiles, whose first pass already did this; it's the
      // 'tierFirst' optimal player, biased to the latest high tier, that it corrects.)
      if (profile.levelsEarlierFactories) {
        const mop = doPurchases(state, 'cheapest', false)
        state = mop.state
        bought += mop.count
      }
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
        const staked = memoryStart(state, defs)
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
        if (milestones[currentEra.index].completeness === null)
          milestones[currentEra.index].completeness = measureCompleteness(state, currentEra)
        state = unlockNextEra(state, defs)
        const m = milestones[next.index]
        if (m.unlockedAtS === null) {
          m.unlockedAtS = t
          m.grindS = m.reachableAtS === null ? 0 : t - m.reachableAtS
        }
        stepsSinceProgress = 0
        wasStarved = false
      }
    }

    if (t - lastSample >= SAMPLE_INTERVAL_S && series.length < MAX_SAMPLES) {
      series.push({ t, complexity: state.complexity, eraIndex: currentEra.index })
      lastSample = t
    }

    const latestIdx = currentEra.index
    if (latestIdx >= defs.eras.length - 1) {
      // Reached the final era: play the destruction finale once, then stop (single
      // pass, no replay). Mirrors useEndgame -> GasLeakGame -> SingularityWidget:
      // arm + resolve the unwinnable gas crisis, then contract the singularity
      // (SINGULARITY_CLICKS taps at the player's click rate); the collapse ends it.
      firstFinalT = t
      const gasThreshold = defs.crises.gasLeak?.risk.threshold ?? 1
      state = {
        ...state,
        crises: {
          ...state.crises,
          gasLeak: { risk: gasThreshold, resolved: false, count: state.crises.gasLeak?.count ?? 0 },
        },
      }
      state = resolveCrisis(state, defs, 'gasLeak')
      if (milestones[latestIdx]) milestones[latestIdx].crisesResolved++
      const contractRate = Math.max(MIN_CONTRACT_RATE, profile.clicksPerSecond)
      t += GAS_CRISIS_S + SINGULARITY_CLICKS / contractRate
      destroyedAtS = t
      break
    }
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

  const rebirthLabel =
    rebirth.rebirths > 0
      ? ` / r${rebirth.rebirths}${rebirth.metaUpgrades.length ? `(${rebirth.metaUpgrades.join('+')})` : ''}`
      : ''
  return {
    label: `${profile.id} / ${policy}${rebirthLabel}`,
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
    reachedFinal: firstFinalT !== null,
    reachedDestruction: destroyedAtS !== null,
    destroyedAtS,
    stuck,
    prestige: rebirth.rebirths > 0,
    rebirths: rebirth.rebirths,
    metaUpgrades: rebirth.metaUpgrades,
    echoes: rebirth.rebirths,
    wallMs: Date.now() - wallStart,
    cycle1S: firstFinalT,
    cycle2S: null,
    milestones,
    series,
  }
}
