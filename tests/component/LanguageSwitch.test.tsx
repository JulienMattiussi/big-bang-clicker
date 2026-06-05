import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'
import { useI18nStore } from '@/i18n/i18nStore'

describe('LanguageSwitch', () => {
  beforeEach(() => {
    useI18nStore.setState({ locale: 'fr' })
  })

  it('change la langue au clic', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitch />)
    await user.click(screen.getByRole('button', { name: 'EN' }))
    expect(useI18nStore.getState().locale).toBe('en')
  })

  it('indique la langue active', () => {
    render(<LanguageSwitch />)
    expect(screen.getByRole('button', { name: 'FR' })).toHaveAttribute('aria-pressed', 'true')
  })
})
