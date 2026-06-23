import { describe, it, expect } from 'vitest'
import { createHighlightStore } from '@/store/highlightStore'

describe('createHighlightStore', () => {
  it('starts cleared, flashes on, and clears again', () => {
    const useStore = createHighlightStore()
    expect(useStore.getState().highlight).toBe(false)
    useStore.getState().flash()
    expect(useStore.getState().highlight).toBe(true)
    useStore.getState().clearHighlight()
    expect(useStore.getState().highlight).toBe(false)
  })

  it('produces independent instances', () => {
    const a = createHighlightStore()
    const b = createHighlightStore()
    a.getState().flash()
    expect(a.getState().highlight).toBe(true)
    expect(b.getState().highlight).toBe(false)
  })
})
