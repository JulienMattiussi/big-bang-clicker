/**
 * Resource network: net flows for display, dependencies between resources, and
 * topological order (cycle detection). See docs/ARCHITECTURE.md section 6.
 */

import type { GameDefs, GameState, ResourceId } from './types'
import { tick } from './engine'

/**
 * REAL net change per resource (units/s), by simulating one second of the
 * engine. Unlike a nominal sum, this matches what actually happens to the
 * stock: a resource consumed as fast as it is produced (flow-through, pinned at
 * 0) shows ~0, not a misleading negative. Used for the resources panel.
 */
export function netFlows(state: GameState, defs: GameDefs): Record<ResourceId, number> {
  const after = tick(state, defs, 1)
  const flows: Record<ResourceId, number> = {}
  for (const id in defs.resources) {
    flows[id] = (after.resources[id] ?? 0) - (state.resources[id] ?? 0)
  }
  return flows
}

/**
 * NOMINAL net flow per resource: full production capacity (with multipliers)
 * minus full consumption demand, ignoring current stock. Unlike `netFlows`, a
 * structural deficit shows here even when the stock has already hit 0 (the
 * resource is starved, not merely stable). Used for the shortage alert.
 */
export function nominalFlows(state: GameState, defs: GameDefs): Record<ResourceId, number> {
  const mult = (r: ResourceId) =>
    (state.multipliers[r] ?? 1) * (state.multipliers.global ?? 1) * (state.multipliers.meta ?? 1)
  const flows: Record<ResourceId, number> = {}
  const add = (resource: ResourceId, n: number) => {
    flows[resource] = (flows[resource] ?? 0) + n
  }

  for (const id in state.generators) {
    const level = state.generators[id].level
    if (level <= 0) continue
    const gen = defs.generators[id]
    if (!gen) continue
    add(gen.output, level * gen.baseRate * mult(gen.output))
  }
  for (const id in state.converters) {
    const cState = state.converters[id]
    if (!cState.enabled || cState.level <= 0) continue
    const conv = defs.converters[id]
    if (!conv) continue
    const cycles = cState.level * conv.baseRate
    for (const input of conv.inputs) add(input.resource, -input.amount * cycles)
    for (const output of conv.outputs)
      add(output.resource, output.amount * cycles * mult(output.resource))
  }
  return flows
}

/**
 * Resources in deficit: consumption capacity exceeds production capacity, so the
 * stock is draining (or already starved at 0). Based on nominal flows, so the
 * alert persists even once the stock reaches 0.
 */
export function decliningResources(state: GameState, defs: GameDefs): Set<ResourceId> {
  const flows = nominalFlows(state, defs)
  const declining = new Set<ResourceId>()
  for (const id in flows) {
    if (flows[id] < -1e-6) declining.add(id)
  }
  return declining
}

/**
 * Resources STALLED at zero: an enabled machine has the capacity to produce them
 * (nominal flow > 0) but the real flow is ~0 because it is starved of an input.
 * Distinct from `decliningResources` (a negative nominal flow): here production
 * is simply blocked. Used for the "production at zero" alert.
 */
export function stalledResources(state: GameState, defs: GameDefs): Set<ResourceId> {
  const nominal = nominalFlows(state, defs)
  const real = netFlows(state, defs)
  const stalled = new Set<ResourceId>()
  for (const id in nominal) {
    if (nominal[id] > 1e-6 && (real[id] ?? 0) <= 1e-6) stalled.add(id)
  }
  return stalled
}

/** For each resource, the resources that feed it (direct inputs). */
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
 * Topological order of resources (inputs before outputs). `hasCycle` flags a
 * combination cycle (to avoid in the data).
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
