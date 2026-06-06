import { describe, it, expect, beforeEach } from 'vitest'
import { useFeedbackStore } from '@/store/feedbackStore'

describe('feedbackStore', () => {
  beforeEach(() => useFeedbackStore.setState({ floaters: [] }))

  it('spawns a floater on a target', () => {
    useFeedbackStore.getState().spawn('complexity', '+5', 'gain')
    const floaters = useFeedbackStore.getState().floaters
    expect(floaters).toHaveLength(1)
    expect(floaters[0]).toMatchObject({ target: 'complexity', text: '+5', tone: 'gain' })
  })

  it('removes a floater by id', () => {
    useFeedbackStore.getState().spawn('res:star', '-3', 'spend')
    const { id } = useFeedbackStore.getState().floaters[0]
    useFeedbackStore.getState().remove(id)
    expect(useFeedbackStore.getState().floaters).toHaveLength(0)
  })

  it('gives each floater a distinct id', () => {
    const spawn = useFeedbackStore.getState().spawn
    spawn('complexity', '+1', 'gain')
    spawn('complexity', '+2', 'gain')
    const ids = useFeedbackStore.getState().floaters.map((f) => f.id)
    expect(new Set(ids).size).toBe(2)
  })
})
