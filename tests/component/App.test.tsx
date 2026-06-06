import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '@/App'
import { useI18nStore } from '@/i18n/i18nStore'
import { useGameStore } from '@/store/gameStore'
import { createInitialState } from '@/lib/save'

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useI18nStore.setState({ locale: 'fr' })
    useGameStore.setState({ state: createInitialState(0, 'e0') })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("affiche l'ère de départ et son verbe (FR)", () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Big Bang' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refroidir' })).toBeInTheDocument()
  })

  it('traduit le verbe en anglais', () => {
    useI18nStore.setState({ locale: 'en' })
    render(<App />)
    expect(screen.getByRole('button', { name: 'Cool down' })).toBeInTheDocument()
  })
})
