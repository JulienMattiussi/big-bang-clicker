import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTick } from '@/hooks/useTick'
import { useGameStore } from '@/store/gameStore'

describe('useTick', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('avance le moteur à intervalle régulier', () => {
    let calls = 0
    useGameStore.setState({
      tick: () => {
        calls += 1
      },
    })

    const { unmount } = renderHook(() => useTick())
    act(() => {
      vi.advanceTimersByTime(350)
    })
    expect(calls).toBeGreaterThan(0)
    unmount()
  })
})
