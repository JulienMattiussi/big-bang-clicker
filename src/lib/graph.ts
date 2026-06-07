/**
 * Resource network: net flows for display, dependencies between resources, and
 * topological order (cycle detection). See docs/ARCHITECTURE.md section 6.
 */

import type { GameDefs, GameState, ResourceId } from './types'
import { tick } from './engine'
import { revealedResources } from './reveal'

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
 * Resources whose stock is REALLY decreasing right now (real net flow negative
 * at the displayed scale). Red alert. The 0.05 threshold matches the one-decimal
 * display (below shows "+0.0/s").
 */
export function decliningResources(state: GameState, defs: GameDefs): Set<ResourceId> {
  const real = netFlows(state, defs)
  const declining = new Set<ResourceId>()
  for (const id in real) {
    if (real[id] < -0.05) declining.add(id)
  }
  return declining
}

/**
 * Resources a machine COULD produce (revealed output of an unlocked generator
 * OR converter) whose stock is NOT growing: the displayed net flow rounds to 0/s
 * (and it is not declining, which is the red alert). Yellow alert ("production
 * at zero"): machine not built, starved, or fully consumed - the stock just
 * isn't building up. Covers BASE resources too (a generator output fully eaten
 * downstream, e.g. oxygen consumed as fast as it is produced). 0.05 matches the
 * one-decimal display ("+0.0/s").
 */
export function stalledResources(state: GameState, defs: GameDefs): Set<ResourceId> {
  const real = netFlows(state, defs)
  const stalled = new Set<ResourceId>()
  for (const era of defs.eras) {
    if (!state.unlockedEras.includes(era.id)) continue
    const revealed = revealedResources(state, defs, era)
    // Every resource this era's machines are meant to output (base + combined).
    const produced = new Set<ResourceId>()
    for (const gid of era.generators) {
      const gen = defs.generators[gid]
      if (gen) produced.add(gen.output)
    }
    for (const cid of era.converters) {
      const conv = defs.converters[cid]
      if (!conv) continue
      for (const output of conv.outputs) produced.add(output.resource)
    }
    for (const r of produced) {
      const flow = real[r] ?? 0
      if (revealed.has(r) && flow >= -0.05 && flow < 0.05) stalled.add(r)
    }
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
