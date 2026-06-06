import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameShell } from '@/components/layout/GameShell'
import { useI18nStore } from '@/i18n/i18nStore'
import { useGameStore } from '@/store/gameStore'
import { createInitialState } from '@/lib/save'

describe('GameShell', () => {
  beforeEach(() => {
    useI18nStore.setState({ locale: 'fr' })
    useGameStore.setState({ state: createInitialState(0, 'e0') })
  })

  it('le clic sur le verbe produit la ressource de clic', async () => {
    const user = userEvent.setup()
    render(<GameShell />)
    await user.click(screen.getByRole('button', { name: 'Refroidir' }))
    expect(useGameStore.getState().state.resources.particule).toBe(1)
  })

  it("n'affiche pas d'onglet pour une ère non débloquée (anti-spoiler)", () => {
    render(<GameShell />)
    expect(screen.queryByRole('button', { name: 'Recombinaison' })).toBeNull()
  })
})
