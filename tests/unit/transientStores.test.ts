import { describe, it, expect } from 'vitest'
import { useCrisisStore } from '@/store/crisisStore'
import { useEndgameStore } from '@/store/endgameStore'
import { useGaletStore } from '@/store/galetStore'

describe('crisisStore', () => {
  it('start fixe la crise et remet les sauvés à zéro, rescue incrémente, stop nettoie', () => {
    useCrisisStore.getState().start('extinction')
    expect(useCrisisStore.getState().fighting).toBe('extinction')
    expect(useCrisisStore.getState().saved).toBe(0)
    useCrisisStore.getState().rescue()
    useCrisisStore.getState().rescue()
    expect(useCrisisStore.getState().saved).toBe(2)
    useCrisisStore.getState().stop()
    expect(useCrisisStore.getState().fighting).toBeNull()
    expect(useCrisisStore.getState().saved).toBe(0)
  })
})

describe('endgameStore', () => {
  it('setProgress, collapse (ouvre la modale + garde baseMeta), reset', () => {
    useEndgameStore.getState().setProgress(0.4)
    expect(useEndgameStore.getState().progress).toBe(0.4)
    useEndgameStore.getState().collapse({ m1: true })
    expect(useEndgameStore.getState().collapsed).toBe(true)
    expect(useEndgameStore.getState().progress).toBe(1)
    expect(useEndgameStore.getState().baseMeta).toEqual({ m1: true })
    useEndgameStore.getState().reset()
    expect(useEndgameStore.getState()).toMatchObject({ collapsed: false, progress: 0, baseMeta: {} })
  })
})

describe('galetStore', () => {
  it('flash mémorise l id, clear le remet à null', () => {
    useGaletStore.getState().flash('matter')
    expect(useGaletStore.getState().flashed).toBe('matter')
    useGaletStore.getState().clear()
    expect(useGaletStore.getState().flashed).toBeNull()
  })
})
