/**
 * Crises (regressions): risk build-up, trigger, and applying regression then
 * rebound effects. See docs/GAME-DESIGN.md section 6 and docs/ARCHITECTURE.md
 * section 7.
 */

import type { CrisisId, Effect, GameDefs, GameState } from './types'

/** Risk build-up rate (per unit of source resource and per second). */
export const RISK_RATE = 1

/** Applies a single effect (from a crisis or upgrade) to the state, purely. */
export function applyEffect(state: GameState, effect: Effect): GameState {
  const target = effect.target
  switch (effect.type) {
    case 'resetResource':
      if (!target) return state
      return {
        ...state,
        resources: {
          ...state.resources,
          [target]: (state.resources[target] ?? 0) * (effect.value ?? 0),
        },
      }
    case 'resetGenerator': {
      if (!target) return state
      const level = state.generators[target]?.level ?? 0
      return {
        ...state,
        generators: {
          ...state.generators,
          [target]: { level: Math.floor(level * (effect.value ?? 0)) },
        },
      }
    }
    case 'grantResource':
      if (!target) return state
      return {
        ...state,
        resources: {
          ...state.resources,
          [target]: (state.resources[target] ?? 0) + (effect.value ?? 0),
        },
      }
    case 'transformResource': {
      if (!target || !effect.to) return state
      const moved = (state.resources[target] ?? 0) * (effect.value ?? 1)
      return {
        ...state,
        resources: {
          ...state.resources,
          [target]: 0,
          [effect.to]: (state.resources[effect.to] ?? 0) + moved,
        },
      }
    }
    case 'multiplier':
      if (!target) return state
      return {
        ...state,
        multipliers: {
          ...state.multipliers,
          [target]: (state.multipliers[target] ?? 1) * (effect.value ?? 1),
        },
      }
    case 'unlock':
      if (!target || state.unlockedEras.includes(target)) return state
      return { ...state, unlockedEras: [...state.unlockedEras, target] }
    default:
      // flatBonus and others: not handled yet (no-op).
      return state
  }
}

export function applyEffects(state: GameState, effects: Effect[]): GameState {
  return effects.reduce((acc, effect) => applyEffect(acc, effect), state)
}

/** Raises the risk gauge of unresolved crises. */
export function updateRisk(state: GameState, defs: GameDefs, dt: number): GameState {
  if (dt <= 0) return state
  let changed = false
  const crises = { ...state.crises }
  for (const id in defs.crises) {
    const def = defs.crises[id]
    const runtime = crises[id] ?? { risk: 0, resolved: false, count: 0 }
    if (runtime.resolved) continue
    const source = def.risk.sourceResource
    const level = source ? (state.resources[source] ?? 0) : 0
    const floor = def.risk.floor ?? 0
    // Dormant until the source is genuinely over-exploited (above its floor);
    // risk then builds on the EXCESS, so it ramps up gently past the floor.
    if (source && level < floor) continue
    const inc = source ? (level - floor) * RISK_RATE * dt : RISK_RATE * dt
    if (inc <= 0) continue
    crises[id] = { ...runtime, risk: runtime.risk + inc }
    changed = true
  }
  return changed ? { ...state, crises } : state
}

export function isCrisisReady(state: GameState, defs: GameDefs, id: CrisisId): boolean {
  const def = defs.crises[id]
  if (!def) return false
  const runtime = state.crises[id]
  if (!runtime || runtime.resolved) return false
  const gate = def.risk.gate
  if (gate && (state.resources[gate.resource] ?? 0) < gate.level) return false
  return runtime.risk >= def.risk.threshold
}

export function readyCrises(state: GameState, defs: GameDefs): CrisisId[] {
  return Object.keys(defs.crises).filter((id) => isCrisisReady(state, defs, id))
}

/** Resolves a crisis: regression then rebound, marks resolved, resets risk to 0. */
export function resolveCrisis(state: GameState, defs: GameDefs, id: CrisisId): GameState {
  const def = defs.crises[id]
  if (!def) return state
  // Apply only the STOCK effects once (resetResource, transformResource...). The
  // permanent rebound MULTIPLIERS are NOT baked here: the engine derives them from
  // this crisis's resolve count, so tuning a rebound value re-applies to existing
  // saves. See docs/ARCHITECTURE.md section 8.2.
  const stock = (e: Effect) => e.type !== 'multiplier'
  let next = applyEffects(state, def.regression.filter(stock))
  next = applyEffects(next, def.rebound.filter(stock))
  const runtime = next.crises[id] ?? { risk: 0, resolved: false, count: 0 }
  return {
    ...next,
    crises: { ...next.crises, [id]: { risk: 0, resolved: true, count: runtime.count + 1 } },
  }
}
