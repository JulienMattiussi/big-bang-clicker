import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PurchasePanel } from '@/components/game/PurchasePanel'
import { useI18nStore } from '@/i18n/i18nStore'
import { useGameStore } from '@/store/gameStore'
import { createInitialState } from '@/lib/save'

describe('PurchasePanel', () => {
  beforeEach(() => {
    useI18nStore.setState({ locale: 'fr' })
    useGameStore.setState({
      state: {
        ...createInitialState(0, 'e0'),
        converters: { confinement: { level: 1, enabled: true } },
      },
    })
  })

  it('permet de mettre une usine en pause', async () => {
    const user = userEvent.setup()
    const era = useGameStore.getState().defs.eras[0]
    render(<PurchasePanel era={era} />)
    await user.click(screen.getByRole('button', { name: 'Mettre en pause' }))
    expect(useGameStore.getState().state.converters.confinement.enabled).toBe(false)
  })
})
