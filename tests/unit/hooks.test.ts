import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useGameStore } from '@/store/gameStore'
import { useCrisisStore } from '@/store/crisisStore'
import { useCrisisWin } from '@/hooks/useCrisisWin'
import { useGalets, announceGalet } from '@/hooks/useGalets'
import { useMilestone } from '@/hooks/useMilestone'
import { useIdle } from '@/hooks/useIdle'
import { useSimLoop } from '@/hooks/useSimLoop'
import { useArrivalReward } from '@/hooks/useArrivalReward'
import { usePageHidden } from '@/hooks/usePageHidden'
import { useFlipIntro } from '@/hooks/useFlipIntro'
import { useEndgame } from '@/hooks/useEndgame'
import { discoverableGalets } from '@/lib/galets'
import { makeState, makeDefs, makeEra } from '../helpers'

const { defs } = useGameStore.getState()
const crisisId = Object.keys(defs.crises)[0]!

const setState = (overrides: Parameters<typeof makeState>[0] = {}) =>
  useGameStore.setState({ state: makeState(overrides), epoch: 0 })

beforeEach(() => {
  localStorage.clear()
  setState()
  useCrisisStore.getState().stop()
})
afterEach(() => localStorage.clear())

describe('useCrisisWin', () => {
  it('résout la crise courante, file la modale de rebond et arrête le combat', () => {
    setState({ crises: { [crisisId]: { risk: 1e6, resolved: false, count: 0 } } })
    useCrisisStore.getState().start(crisisId)
    const { result } = renderHook(() => useCrisisWin())
    act(() => result.current())
    expect(useGameStore.getState().state.crises[crisisId]?.resolved).toBe(true)
    expect(useGameStore.getState().state.pendingEvents.map((e) => e.id)).toContain(
      `crisis-won:${crisisId}`,
    )
    expect(useCrisisStore.getState().fighting).toBeNull()
  })

  it('no-op quand aucune crise n est en cours', () => {
    const { result } = renderHook(() => useCrisisWin())
    act(() => result.current())
    expect(useGameStore.getState().state.pendingEvents).toHaveLength(0)
  })
})

describe('useGalets / announceGalet', () => {
  it('announceGalet met en file la découverte du galet', () => {
    announceGalet({
      id: 'matter',
      nameKey: '',
      descKey: 'galet.matter.desc',
      loreKey: '',
      color: '',
      motif: '',
      discoverEraId: 'e2',
      effect: { type: 'generatorMultiplier', maxEraIndex: 9, value: 2 },
    })
    expect(useGameStore.getState().state.pendingEvents.map((e) => e.id)).toContain('galet:matter')
  })

  it('useGalets annonce les galets dont le palier est atteint au montage', () => {
    setState({ complexity: 1e15 })
    const expected = discoverableGalets(useGameStore.getState().state, defs)
    renderHook(() => useGalets())
    const ids = useGameStore.getState().state.pendingEvents.map((e) => e.id)
    for (const g of expected) expect(ids).toContain(`galet:${g.id}`)
  })
})

describe('useMilestone', () => {
  it('décrit le prochain palier, null quand toutes les ères sont débloquées', () => {
    setState({ unlockedEras: [defs.eras[0]!.id], complexity: 0 })
    const { result } = renderHook(() => useMilestone())
    expect(result.current).not.toBeNull()
    expect(result.current!.target).toBeGreaterThan(0)
    expect(result.current!.ready).toBe(false)

    setState({ unlockedEras: defs.eras.map((e) => e.id) })
    const { result: none } = renderHook(() => useMilestone())
    expect(none.current).toBeNull()
  })
})

describe('useIdle', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('passe inactif après le délai, et se réveille à une interaction', () => {
    const { result } = renderHook(() => useIdle(1000))
    expect(result.current).toBe(false)
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current).toBe(true)
    act(() => window.dispatchEvent(new Event('pointermove')))
    expect(result.current).toBe(false)
  })
})

describe('useSimLoop', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('avance le monde à chaque pas', () => {
    const { result } = renderHook(() =>
      useSimLoop(
        () => 0,
        (n) => n + 1,
        100,
      ),
    )
    expect(result.current[0]).toBe(0)
    act(() => vi.advanceTimersByTime(350))
    expect(result.current[0]).toBe(3)
  })
})

describe('useArrivalReward', () => {
  it('récompense le delta à chaque hausse du total', () => {
    const onReward = vi.fn()
    const { rerender } = renderHook(({ total }) => useArrivalReward(total, onReward), {
      initialProps: { total: 3 },
    })
    expect(onReward).toHaveBeenCalledWith(3) // montage : 3 - 0
    rerender({ total: 7 })
    expect(onReward).toHaveBeenLastCalledWith(4) // 7 - 3
    rerender({ total: 7 })
    expect(onReward).toHaveBeenCalledTimes(2) // pas de delta : pas d appel
  })
})

describe('usePageHidden', () => {
  it('rend false quand l onglet est visible (jsdom)', () => {
    const { result } = renderHook(() => usePageHidden())
    expect(result.current).toBe(false)
  })

  it('rend true quand l onglet est masqué', () => {
    const spy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    const { result } = renderHook(() => usePageHidden())
    expect(result.current).toBe(true)
    spy.mockRestore()
  })
})

describe('useMilestone (palier ressource)', () => {
  afterEach(() => useGameStore.setState({ defs }))

  it('décrit un palier basé sur une ressource une fois celle-ci découverte', () => {
    const resourceDefs = makeDefs({
      eras: [
        makeEra({ id: 'a' }),
        makeEra({ id: 'b', index: 1, unlock: { resource: 'gold', amount: 100 } }),
      ],
      resources: { gold: { id: 'gold', eraId: 'b', nameKey: '', tier: 1, icon: 'coin' } },
    })
    useGameStore.setState({
      defs: resourceDefs,
      state: makeState({ unlockedEras: ['a'], resources: { gold: 40 } }),
    })
    const { result } = renderHook(() => useMilestone())
    expect(result.current).toMatchObject({ kind: 'resource', target: 100, current: 40, icon: 'coin' })

    // Avant découverte (stock nul) : pas de palier ressource (anti-spoiler).
    useGameStore.setState({ state: makeState({ unlockedEras: ['a'], resources: {} }) })
    const { result: hidden } = renderHook(() => useMilestone())
    expect(hidden.current).toBeNull()
  })
})

describe('useEndgame', () => {
  it('arme la crise du gaz en ère 19, ne fait rien ailleurs', () => {
    useGameStore.setState({ state: makeState({ currentEraId: 'e1' }) })
    renderHook(() => useEndgame())
    expect(useGameStore.getState().state.crises['gasLeak']).toBeUndefined()

    useGameStore.setState({ state: makeState({ currentEraId: 'e19' }) })
    renderHook(() => useEndgame())
    expect(useGameStore.getState().state.crises['gasLeak']).toBeDefined()
  })
})

describe('useFlipIntro', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('mesure le bouton, lance le clone géant puis l atterrit et nettoie', () => {
    const clear = vi.fn()
    const { result, rerender } = renderHook(({ h }) => useFlipIntro(h, clear), {
      initialProps: { h: false },
    })
    // Attache un faux bouton mesurable (jsdom renvoie 0 par défaut).
    result.current.btnRef.current = {
      getBoundingClientRect: () => ({ left: 100, top: 100, width: 50, height: 50 }),
    } as unknown as HTMLButtonElement

    act(() => rerender({ h: true }))
    expect(result.current.intro).not.toBeNull()
    expect(result.current.intro!.transform).toContain('scale')

    act(() => vi.advanceTimersByTime(20)) // requestAnimationFrame -> landed
    expect(result.current.landed).toBe(true)

    act(() => vi.advanceTimersByTime(1100)) // timeout final : nettoyage
    expect(result.current.intro).toBeNull()
    expect(clear).toHaveBeenCalled()
  })

  it('annule (clear) si le bouton n est pas mesurable', () => {
    const clear = vi.fn()
    const { rerender } = renderHook(({ h }) => useFlipIntro(h, clear), {
      initialProps: { h: false },
    })
    act(() => rerender({ h: true })) // btnRef vide -> width 0 -> clear immédiat
    expect(clear).toHaveBeenCalled()
  })
})
