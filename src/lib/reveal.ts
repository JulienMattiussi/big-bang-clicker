/**
 * Within-era progressive disclosure: guide the player without overwhelming.
 * Machines reveal one by one (the first is always visible, the next reveals
 * once the previous reaches level >= 1); a resource reveals with the machine
 * that produces it. Pure and testable.
 */

import type { EraDef, GameDefs, GameState } from './types'

function machineLevel(state: GameState, id: string): number {
  return state.generators[id]?.level ?? state.converters[id]?.level ?? 0
}

/** Machine ids currently revealed in the era (generators then converters, in order). */
export function revealedMachines(state: GameState, era: EraDef): Set<string> {
  const sequence = [...era.generators, ...era.converters]
  const revealed = new Set<string>()
  for (let i = 0; i < sequence.length; i++) {
    if (i === 0) {
      revealed.add(sequence[i])
      continue
    }
    if (machineLevel(state, sequence[i - 1]) < 1) break
    revealed.add(sequence[i])
  }
  return revealed
}

/**
 * Resource ids currently revealed: the click resource, the outputs of revealed
 * machines, or any resource the player already has.
 */
export function revealedResources(state: GameState, defs: GameDefs, era: EraDef): Set<string> {
  const machines = revealedMachines(state, era)
  const outputs = new Set<string>()
  for (const id of machines) {
    const gen = defs.generators[id]
    if (gen) outputs.add(gen.output)
    const conv = defs.converters[id]
    if (conv) for (const output of conv.outputs) outputs.add(output.resource)
  }

  const revealed = new Set<string>()
  for (const id of era.resources) {
    if (id === era.clickResource || outputs.has(id) || (state.resources[id] ?? 0) > 0) {
      revealed.add(id)
    }
  }
  return revealed
}
