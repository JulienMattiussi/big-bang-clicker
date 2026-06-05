import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '@/App'
import { useI18nStore } from '@/i18n/i18nStore'

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useI18nStore.setState({ locale: 'fr' })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('affiche le titre du jeu', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Big Bang Clicker' })).toBeInTheDocument()
  })

  it('affiche la tagline en anglais quand la langue est EN', () => {
    useI18nStore.setState({ locale: 'en' })
    render(<App />)
    expect(screen.getByText(/Your move\./)).toBeInTheDocument()
  })
})
