import { describe, it, expect, beforeEach } from 'vitest'
import { useEventStore } from '@/store/eventStore'
import { triggeredEvents } from '@/lib/events'
import type { GameEvent } from '@/lib/events'
import { defs } from '@/data'
import { makeState } from '../helpers'

const ev = (id: string): GameEvent => ({ id, tone: 'transition', titleKey: '', bodyKey: '' })

describe('eventStore', () => {
  beforeEach(() => useEventStore.setState({ queue: [] }))

  it('enqueues and dedupes by id', () => {
    const { enqueue } = useEventStore.getState()
    enqueue(ev('a'))
    enqueue(ev('a'))
    enqueue(ev('b'))
    expect(useEventStore.getState().queue.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('dismiss removes the front event', () => {
    const { enqueue, dismiss } = useEventStore.getState()
    enqueue(ev('a'))
    enqueue(ev('b'))
    dismiss()
    expect(useEventStore.getState().queue.map((e) => e.id)).toEqual(['b'])
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
