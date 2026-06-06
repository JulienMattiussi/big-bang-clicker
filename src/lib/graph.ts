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
