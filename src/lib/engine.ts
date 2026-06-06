/**
 * Moteur de jeu : fonctions PURES (zéro React, zéro effet de bord). Tout est
 * testable et déterministe (le `dt` est fourni, jamais lu sur l'horloge).
 * Voir docs/ARCHITECTURE.md section 5.
 */

import type { ConverterId, CostCurve, GameDefs, GameState, GeneratorId, ResourceId } from './types'

/** Coût géométrique du passage au niveau suivant (niveau 0-indexé). */
export function costAtLevel(curve: CostCurve, level: number): number {
  return curve.base * curve.growth ** level
}

/** Coût (multi-ressources) pour passer de `level` à `level + 1`. */
export function nextCost(cost: CostCurve[], level: number): Record<ResourceId, number> {
  const total: Record<ResourceId, number> = {}
  for (const curve of cost) {
    total[curve.resource] = (total[curve.resource] ?? 0) + costAtLevel(curve, level)
  }
  return total
}

export function canAfford(
  resources: Record<ResourceId, number>,
  cost: Record<ResourceId, number>,
): boolean {
  for (const id in cost) {
    if ((resources[id] ?? 0) < cost[id]) return false
  }
  return true
}

function spend(
  resources: Record<ResourceId, number>,
  cost: Record<ResourceId, number>,
): Record<ResourceId, number> {
  const next = { ...resources }
  for (const id in cost) {
    next[id] = (next[id] ?? 0) - cost[id]
  }
  return next
}

/** Multiplicateur de production d'une ressource (spécifique x global). */
function resourceMultiplier(state: GameState, resource: ResourceId): number {
  return (state.multipliers[resource] ?? 1) * (state.multipliers.global ?? 1)
}

/** Clic manuel : ajoute une quantité à une ressource (le "verbe" de l'ère). */
export function applyClick(state: GameState, resource: ResourceId, amount = 1): GameState {
  return {
    ...state,
    resources: { ...state.resources, [resource]: (state.resources[resource] ?? 0) + amount },
  }
}

/** Achète un niveau de générateur si abordable, sinon renvoie null. */
export function buyGenerator(state: GameState, defs: GameDefs, id: GeneratorId): GameState | null {
  const gen = defs.generators[id]
  if (!gen) return null
  const level = state.generators[id]?.level ?? 0
  const cost = nextCost(gen.cost, level)
  if (!canAfford(state.resources, cost)) return null
  return {
    ...state,
    resources: spend(state.resources, cost),
    generators: { ...state.generators, [id]: { level: level + 1 } },
  }
}

/** Achète un niveau de convertisseur si abordable, sinon renvoie null. */
export function buyConverter(state: GameState, defs: GameDefs, id: ConverterId): GameState | null {
  const conv = defs.converters[id]
  if (!conv) return null
  const current = state.converters[id]
  const level = current?.level ?? 0
  const cost = nextCost(conv.cost, level)
  if (!canAfford(state.resources, cost)) return null
  return {
    ...state,
    resources: spend(state.resources, cost),
    converters: {
      ...state.converters,
      [id]: { level: level + 1, enabled: current?.enabled ?? true },
    },
  }
}

/**
 * Débloque les ères dont la condition (`unlock`) est remplie. Une ère sans
 * condition n'est jamais auto-débloquée ici (l'ère de départ l'est à l'init).
 */
export function unlockEras(state: GameState, defs: GameDefs): GameState {
  let unlocked = state.unlockedEras
  let changed = false
  for (const era of defs.eras) {
    if (unlocked.includes(era.id)) continue
    const { resource, amount, complexity } = era.unlock
    if (resource === undefined && complexity === undefined) continue
    const resourceOk = resource === undefined || (state.resources[resource] ?? 0) >= (amount ?? 0)
    const complexityOk = complexity === undefined || state.complexity >= complexity
    if (resourceOk && complexityOk) {
      if (!changed) {
        unlocked = [...unlocked]
        changed = true
      }
      unlocked.push(era.id)
    }
  }
  return changed ? { ...state, unlockedEras: unlocked } : state
}

/**
 * Avance l'état d'un pas de temps `dt` (en secondes) :
 * 1. production des générateurs ;
 * 2. conversions (limitées par les entrées disponibles, jamais de blocage dur) ;
 * 3. gain de Complexité, pondéré par la profondeur (tier) des sorties.
 */
export function tick(state: GameState, defs: GameDefs, dt: number): GameState {
  if (dt <= 0) return state

  const resources = { ...state.resources }
  let gained = 0

  // 1. Générateurs : production directe.
  for (const id in state.generators) {
    const level = state.generators[id].level
    if (level <= 0) continue
    const gen = defs.generators[id]
    if (!gen) continue
    resources[gen.output] =
      (resources[gen.output] ?? 0) +
      level * gen.baseRate * dt * resourceMultiplier(state, gen.output)
  }

  // 2. Convertisseurs : combinaison, bornée par les entrées disponibles.
  for (const id in state.converters) {
    const cState = state.converters[id]
    if (!cState.enabled || cState.level <= 0) continue
    const conv = defs.converters[id]
    if (!conv) continue

    let cycles = cState.level * conv.baseRate * dt
    for (const input of conv.inputs) {
      if (input.amount <= 0) continue
      const max = (resources[input.resource] ?? 0) / input.amount
      if (max < cycles) cycles = max
    }
    if (cycles <= 0) continue

    for (const input of conv.inputs) {
      resources[input.resource] = (resources[input.resource] ?? 0) - input.amount * cycles
    }
    for (const output of conv.outputs) {
      resources[output.resource] =
        (resources[output.resource] ?? 0) +
        output.amount * cycles * resourceMultiplier(state, output.resource)
      const tier = defs.resources[output.resource]?.tier ?? 0
      gained += output.amount * cycles * tier
    }
  }

  return {
    ...state,
    resources,
    complexity: state.complexity + gained,
    totalComplexityEver: state.totalComplexityEver + gained,
  }
}
