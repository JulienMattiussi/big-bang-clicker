/**
 * Within-era progressive disclosure: guide the player without overwhelming.
 * Machines reveal one by one: the first is visible, the next appears once the
 * previous reaches level >= 1. A recipe also appears once its output has been
 * discovered (e.g. crafted by hand via a widget). Never regresses. Pure/testable.
 */

import type { EraDef, GameDefs, GameState } from './types'

function isKnown(state: GameState, id: string): boolean {
  return (state.resources[id] ?? 0) > 0 || !!state.discovered[id]
}

function machineLevel(state: GameState, id: string): number {
  return state.generators[id]?.level ?? state.converters[id]?.level ?? 0
}

function machineOutputs(defs: GameDefs, id: string): string[] {
  const gen = defs.generators[id]
  if (gen) return [gen.output]
  const conv = defs.converters[id]
  return conv ? conv.outputs.map((o) => o.resource) : []
}

/** Machine ids currently revealed in the era (generators then recipes, in order). */
export function revealedMachines(state: GameState, defs: GameDefs, era: EraDef): Set<string> {
  const sequence = [...era.generators, ...era.converters]
  const revealed = new Set<string>()
  for (let i = 0; i < sequence.length; i++) {
    const id = sequence[i]
    const prevLeveled = i === 0 || machineLevel(state, sequence[i - 1]) >= 1
    const outputKnown = machineOutputs(defs, id).some((r) => isKnown(state, r))
    if (prevLeveled || outputKnown) revealed.add(id)
  }
  return revealed
}

/**
 * Resource ids currently revealed: the click resource, the outputs of revealed
 * machines, any resource the player holds, or any already discovered (sticky:
 * once produced, a resource stays listed even when its stock is back to 0).
 */
export function revealedResources(state: GameState, defs: GameDefs, era: EraDef): Set<string> {
  // Outputs of machines that actually run (level >= 1): don't reveal the next
  // resource just because its machine is visible, only once it's automated.
  const outputs = new Set<string>()
  for (const id of era.generators) {
    if ((state.generators[id]?.level ?? 0) >= 1) outputs.add(defs.generators[id].output)
  }
  for (const id of era.converters) {
    if ((state.converters[id]?.level ?? 0) >= 1) {
      for (const output of defs.converters[id].outputs) outputs.add(output.resource)
    }
  }

  const revealed = new Set<string>()
  for (const id of era.resources) {
    if (
      id === era.clickResource ||
      outputs.has(id) ||
      (state.resources[id] ?? 0) > 0 ||
      state.discovered[id]
    ) {
      revealed.add(id)
    }
  }
  return revealed
}
