import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveMenu } from '@/components/layout/SaveMenu'
import { useI18nStore } from '@/i18n/i18nStore'
import { useGameStore } from '@/store/gameStore'
import { createInitialState } from '@/lib/save'
import { defs } from '@/data'

describe('SaveMenu', () => {
  beforeEach(() => {
    useI18nStore.setState({ locale: 'fr' })
    useGameStore.setState({
      state: { ...createInitialState(0, 'e1'), resources: { particule: 5 } },
    })
  })

  it('réinitialise la partie après confirmation', async () => {
    const user = userEvent.setup()
    render(<SaveMenu />)
    await user.click(screen.getByRole('button', { name: /Sauvegarde/ }))
    await user.click(screen.getByRole('button', { name: 'Réinitialiser' }))
    await user.click(screen.getByRole('button', { name: 'Confirmer la réinitialisation ?' }))
    expect(useGameStore.getState().state.resources.particule ?? 0).toBe(0)
  })

  it('exporte puis réimporte la sauvegarde (aller-retour)', () => {
    const code = useGameStore.getState().exportSave()
    useGameStore.getState().reset()
    expect(useGameStore.getState().state.resources.particule ?? 0).toBe(0)
    expect(useGameStore.getState().importSave(code)).toBe('ok')
    expect(useGameStore.getState().state.resources.particule).toBe(5)
  })

  it("n'applique pas de crédit hors-ligne à l'import (restaure le snapshot)", () => {
    // A save with a producing generator and an OLD lastSeen: a load would credit
    // offline production, but an import must restore the snapshot untouched.
    const gen = defs.eras[0].generators[0]
    const out = defs.generators[gen].output
    useGameStore.setState({
      state: {
        ...createInitialState(0, 'e1'),
        generators: { [gen]: { level: 5 } },
        resources: { [out]: 100 },
        lastSeen: 1000,
        eventsInitialized: true,
      },
    })
    const code = useGameStore.getState().exportSave()
    useGameStore.getState().importSave(code)
    const st = useGameStore.getState().state
    expect(st.resources[out]).toBe(100)
    expect(st.lastSeen).toBeGreaterThan(1000)
  })
})
