/**
 * Narrative events that feed the event modal: era transitions, the first-machine
 * tutorial, and crisis (regression) announcements. Pure: returns every event
 * whose trigger condition currently holds; "fire once" is handled by the caller
 * via GameState.seenEvents. i18n keys are plain strings (resolved in the UI).
 */

import type { GameDefs, GameState } from './types'
import { revealedMachines } from './reveal'

export type EventTone = 'transition' | 'regression' | 'tutorial'

export interface GameEvent {
  id: string
  tone: EventTone
  titleKey: string
  bodyKey: string
  icon?: string
}

/** All events whose condition is currently satisfied (regardless of "seen"). */
export function triggeredEvents(state: GameState, defs: GameDefs): GameEvent[] {
  const events: GameEvent[] = []
  const startEra = defs.eras[0]

  // Era transitions: each unlocked era except the starting one (you begin there).
  for (const era of defs.eras) {
    if (era.id === startEra?.id) continue
    if (!state.unlockedEras.includes(era.id)) continue
    events.push({
      id: `era:${era.id}`,
      tone: 'transition',
      titleKey: era.nameKey,
      bodyKey: `era.${era.id}.transition`,
      icon: era.icon,
    })
  }

  // Tutorial: fired once the starting era's first recipe (the first machine) is
  // revealed - doubles as the "how machines work" onboarding.
  const firstRecipe = startEra?.converters[0]
  if (startEra && firstRecipe && revealedMachines(state, defs, startEra).has(firstRecipe)) {
    events.push({
      id: 'tuto:firstMachine',
      tone: 'tutorial',
      titleKey: 'tuto.firstMachine.title',
      bodyKey: 'tuto.firstMachine.body',
      icon: 'cog',
    })
  }

  // Crises: announced when the risk reaches its threshold or once it has occurred.
  for (const id in defs.crises) {
    const def = defs.crises[id]
    const runtime = state.crises[id]
    if (!runtime) continue
    const ready = !runtime.resolved && runtime.risk >= def.risk.threshold
    if (ready || runtime.count > 0) {
      events.push({
        id: `crisis:${id}`,
        tone: 'regression',
        titleKey: 'crisis.title',
        bodyKey: def.textKeys.triggerKey,
        icon: 'skull',
      })
    }
  }

  return events
}
