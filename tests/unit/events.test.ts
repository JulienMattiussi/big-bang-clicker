import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/store/gameStore'
import { triggeredEvents } from '@/lib/events'
import type { GameEvent } from '@/lib/events'
import { defs } from '@/data'
import { makeState, makeDefs } from '../helpers'

const ev = (id: string, galetId?: string): GameEvent => ({
  id,
  tone: 'transition',
  titleKey: '',
  bodyKey: '',
  ...(galetId ? { galetId } : {}),
})

describe('pending events (gameStore)', () => {
  beforeEach(() => useGameStore.setState({ state: makeState() }))

  it('enqueues, dedupes by id, and skips already-seen events', () => {
    const { enqueueEvent } = useGameStore.getState()
    enqueueEvent(ev('a'))
    enqueueEvent(ev('a'))
    enqueueEvent(ev('b'))
    expect(useGameStore.getState().state.pendingEvents.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('dismiss removes the front event and marks it seen (so it never re-fires)', () => {
    const { enqueueEvent, dismissEvent } = useGameStore.getState()
    enqueueEvent(ev('a'))
    enqueueEvent(ev('b'))
    dismissEvent()
    expect(useGameStore.getState().state.pendingEvents.map((e) => e.id)).toEqual(['b'])
    expect(useGameStore.getState().state.seenEvents['a']).toBe(true)
    enqueueEvent(ev('a'))
    expect(useGameStore.getState().state.pendingEvents.map((e) => e.id)).toEqual(['b'])
  })

  it('grants a pebble only when its discovery popup is dismissed', () => {
    const { enqueueEvent, dismissEvent } = useGameStore.getState()
    enqueueEvent(ev('galet:matter', 'matter'))
    expect(useGameStore.getState().state.galets['matter']?.found).toBeFalsy()
    dismissEvent()
    expect(useGameStore.getState().state.galets['matter']).toEqual({ found: true, active: true })
  })
})

describe('triggeredEvents', () => {
  it('fires an era-transition for unlocked eras, except the starting one', () => {
    const state = makeState({ unlockedEras: [defs.eras[0].id, defs.eras[1].id] })
    const ids = triggeredEvents(state, defs).map((e) => e.id)
    expect(ids).toContain(`era:${defs.eras[1].id}`)
    expect(ids).not.toContain(`era:${defs.eras[0].id}`)
  })

  it('fires the first-machine tutorial once the first recipe is revealed', () => {
    const era0 = defs.eras[0]
    const state = makeState({
      unlockedEras: [era0.id],
      generators: { [era0.generators[0]]: { level: 1 } },
    })
    expect(triggeredEvents(state, defs).map((e) => e.id)).toContain('tuto:firstMachine')
  })

  it('annonce le mini-jeu de mémoire une fois l oxydation montée', () => {
    const state = makeState({ converters: { oxidation: { level: 1, enabled: true } } })
    expect(triggeredEvents(state, defs).map((e) => e.id)).toContain('feature:memory')
  })

  it('annonce le sac à dos à l apparition de sa ressource', () => {
    const state = makeState({ resources: { microbe: 1 } })
    expect(triggeredEvents(state, defs).map((e) => e.id)).toContain('feature:backpack')
  })

  it('annonce une crise prête ou déjà survenue, jamais une crise inconnue de l état', () => {
    const crisisDefs = makeDefs({
      crises: {
        c: {
          id: 'c',
          eraId: 'e1',
          risk: { threshold: 10 },
          trigger: 'threshold',
          regression: [],
          rebound: [],
          textKeys: { warnKey: '', triggerKey: 'crisis.c.trigger', reboundKey: '' },
        },
      },
    })
    // Aucune entrée runtime : pas d'annonce.
    expect(triggeredEvents(makeState({}), crisisDefs).map((e) => e.id)).not.toContain('crisis:c')
    // Prête (risque au seuil).
    const ready = makeState({ crises: { c: { risk: 10, resolved: false, count: 0 } } })
    expect(triggeredEvents(ready, crisisDefs).map((e) => e.id)).toContain('crisis:c')
    // Déjà survenue (count > 0) même résolue.
    const past = makeState({ crises: { c: { risk: 0, resolved: true, count: 1 } } })
    expect(triggeredEvents(past, crisisDefs).map((e) => e.id)).toContain('crisis:c')
  })
})
