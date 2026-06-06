/**
 * Resource network: net flows for display, dependencies between resources, and
 * topological order (cycle detection). See docs/ARCHITECTURE.md section 6.
 */

import type { GameDefs, GameState, ResourceId } from './types'

/**
 * Nominal net production per resource (units/s), for displaying flows
 * (+inputs / -consumption). "Nominal" = at full machine throughput, ignoring a
 * possible lack of inputs at instant t.
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
