/**
 * Réseau de ressources : flux nets pour l'affichage, dépendances entre
 * ressources et tri topologique (détection de cycles).
 * Voir docs/ARCHITECTURE.md section 6.
 */

import type { GameDefs, GameState, ResourceId } from './types'

/**
 * Production nette nominale par ressource (unités/s), pour l'affichage des
 * flux (+entrées / -consommation). "Nominal" = au plein régime des usines,
 * sans tenir compte d'un éventuel manque d'entrées à l'instant t.
 */
export function netFlows(state: GameState, defs: GameDefs): Record<ResourceId, number> {
  const flows: Record<ResourceId, number> = {}
  const add = (resource: ResourceId, n: number) => {
    flows[resource] = (flows[resource] ?? 0) + n
  }

  for (const id in state.generators) {
    const level = state.generators[id].level
    if (level <= 0) continue
    const gen = defs.generators[id]
    if (!gen) continue
    add(gen.output, level * gen.baseRate)
  }

  for (const id in state.converters) {
    const cState = state.converters[id]
    if (!cState.enabled || cState.level <= 0) continue
    const conv = defs.converters[id]
    if (!conv) continue
    const cycles = cState.level * conv.baseRate
    for (const input of conv.inputs) add(input.resource, -input.amount * cycles)
    for (const output of conv.outputs) add(output.resource, output.amount * cycles)
  }

  return flows
}

/** Pour chaque ressource, les ressources qui la nourrissent (entrées directes). */
export function resourceDependencies(defs: GameDefs): Record<ResourceId, ResourceId[]> {
  const deps: Record<ResourceId, Set<ResourceId>> = {}
  for (const id in defs.converters) {
    const conv = defs.converters[id]
    for (const output of conv.outputs) {
      const set = (deps[output.resource] ??= new Set<ResourceId>())
      for (const input of conv.inputs) set.add(input.resource)
    }
  }
  const result: Record<ResourceId, ResourceId[]> = {}
  for (const resource in deps) result[resource] = [...deps[resource]]
  return result
}

/**
 * Tri topologique des ressources (entrées avant sorties). `hasCycle` signale
 * un cycle de combinaison (à éviter dans les données).
 */
export function topologicalOrder(defs: GameDefs): { order: ResourceId[]; hasCycle: boolean } {
  const deps = resourceDependencies(defs)
  const all = new Set<ResourceId>(Object.keys(defs.resources))
  for (const resource in deps) {
    all.add(resource)
    for (const dep of deps[resource]) all.add(dep)
  }

  const order: ResourceId[] = []
  const mark: Record<ResourceId, 'temp' | 'done'> = {}
  let hasCycle = false

  const visit = (node: ResourceId) => {
    if (mark[node] === 'done') return
    if (mark[node] === 'temp') {
      hasCycle = true
      return
    }
    mark[node] = 'temp'
    for (const dep of deps[node] ?? []) visit(dep)
    mark[node] = 'done'
    order.push(node)
  }

  for (const node of all) visit(node)
  return { order, hasCycle }
}
