import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/store/gameStore'
import { triggeredEvents } from '@/lib/events'
import type { GameEvent } from '@/lib/events'
import { defs } from '@/data'
import { makeState } from '../helpers'

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
})
