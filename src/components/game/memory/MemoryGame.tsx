import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { EraIcon } from '@/components/game/EraIcon'
import { Galet } from '@/components/art/Galet'
import { EraSymbolCluster } from '@/components/game/memory/Answer42'
import { CardBack, CardFace } from '@/components/game/memory/MemoryCards'
import {
  applyJokers,
  dealCards,
  shuffle,
  JOKER_LABEL,
  type Card,
} from '@/components/game/memory/memoryDeck'
import { memoryGalet } from '@/lib/galets'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { formatFixed } from '@/lib/format'
import {
  MEMORY_LEVELS,
  MEMORY_MAX_LEVEL,
  memoryCost,
  memoryEraMaxed,
  memoryLevel,
  type MemoryLevelConfig,
} from '@/lib/memory'
import type { TranslationKey } from '@/i18n/types'

type Phase = 'start' | 'play' | 'won' | 'lost'

/**
 * Near-fullscreen memory (concentration) game. Staking Complexity deals a board
 * of resource-icon SETS (pairs or triplets, by level); clearing it within the
 * mistake budget doubles the current era's main resource production. Each era
 * can be boosted three times, through three escalating levels. See
 * src/lib/memory.ts.
 */
export function MemoryGame({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const defs = useGameStore((s) => s.defs)
  const complexity = useGameStore((s) => s.state.complexity)
  const currentEraId = useGameStore((s) => s.state.currentEraId)
  const startMemoryGame = useGameStore((s) => s.startMemoryGame)
  const winMemoryGame = useGameStore((s) => s.winMemoryGame)
  const cost = useGameStore((s) => memoryCost(s.state, s.defs))
  // The level the NEXT attempt plays, and whether this era is fully boosted.
  const upcomingLevel = useGameStore((s) => memoryLevel(s.state, s.state.currentEraId))
  const maxed = useGameStore((s) => memoryEraMaxed(s.state, s.state.currentEraId))
  // The Force pebble (octarine), when active, drives this game's discount + jokers.
  const force = useGameStore((s) => memoryGalet(s.state, s.defs))
  const upcomingCfg = MEMORY_LEVELS[upcomingLevel]!

  const era = defs.eras.find((e) => e.id === currentEraId) ?? defs.eras[0]!
  const mainRes = era ? defs.resources[era.clickResource] : undefined
  const mainName = mainRes ? t(mainRes.nameKey as TranslationKey) : ''
  const eraName = era ? t(era.nameKey as TranslationKey) : ''

  // Deck for a given level config: discovered resources first, then top up with
  // others (unknown next-era resources allowed) to reach the symbol count.
  const makeDeck = (cfg: MemoryLevelConfig) => {
    const discovered = useGameStore.getState().state.discovered
    const pool = Object.keys(discovered)
      .filter((id) => discovered[id])
      .map((id) => defs.resources[id]!)
      .filter(Boolean)
    shuffle(pool)
    if (pool.length < cfg.symbols) {
      const extra = Object.values(defs.resources).filter((r) => !discovered[r.id])
      shuffle(extra)
      pool.push(...extra)
    }
    const deck = dealCards(pool, cfg.symbols, cfg.group)
    // The Force pebble pre-solves two sets as sith/jedi jokers.
    const forceActive = !!memoryGalet(useGameStore.getState().state, defs)
    return forceActive ? applyJokers(deck) : deck
  }

  const [phase, setPhase] = useState<Phase>('start')
  // Config of the attempt currently being played (captured when dealt).
  const [cfg, setCfg] = useState<MemoryLevelConfig>(upcomingCfg)
  // Deal a board immediately so it shows (face-down) behind the start text.
  const [cards, setCards] = useState<Card[]>(() => makeDeck(upcomingCfg))
  const [mistakes, setMistakes] = useState(0)
  const [busy, setBusy] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)

  // Leaving mid-game forfeits the staked Complexity, so confirm first.
  const requestClose = () => (phase === 'play' ? setConfirmQuit(true) : onClose())

  const affordable = complexity >= cost

  const play = () => {
    if (maxed) return
    if (!startMemoryGame()) return
    // Capture the level afresh (it may have just advanced after a previous win).
    const lvl = memoryLevel(useGameStore.getState().state, era?.id ?? '')
    const config = MEMORY_LEVELS[lvl]!
    setCfg(config)
    setCards(makeDeck(config))
    setMistakes(0)
    setBusy(false)
    setPhase('play')
  }

  const flip = (i: number) => {
    if (busy) return
    const card = cards[i]
    if (!card || card.flipped || card.matched) return

    // The set in progress = cards already face-up but not yet validated. Derived
    // from the cards themselves (not a separate state) so it can never desync.
    const inProgress = cards.filter((c) => c.flipped && !c.matched)
    const setId = inProgress.length > 0 ? inProgress[0]!.res.id : card.res.id
    const matches = card.res.id === setId
    const count = inProgress.length + 1

    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)))

    if (!matches) {
      // Mismatch: reveal briefly, then flip the whole attempt back, count it.
      setBusy(true)
      const used = mistakes + 1
      setMistakes(used)
      const hide = new Set([...inProgress.map((c) => c.key), card.key])
      window.setTimeout(() => {
        setCards((prev) =>
          prev.map((c) => (hide.has(c.key) && !c.matched ? { ...c, flipped: false } : c)),
        )
        setBusy(false)
        if (used > cfg.mistakes) setPhase('lost')
      }, 850)
      return
    }

    // Still matching, but the set needs more cards: leave them face-up and wait.
    if (count < cfg.group) return

    // Set complete: lock every card of this symbol face-up. Win if it was the last.
    setCards((prev) =>
      prev.map((c) => (c.res.id === setId ? { ...c, flipped: true, matched: true } : c)),
    )
    const remaining = cards.filter((c) => !c.matched && c.res.id !== setId).length
    if (remaining === 0) {
      winMemoryGame()
      window.setTimeout(() => setPhase('won'), 450)
    }
  }

  // Escape backs out of the quit confirmation first, otherwise requests close.
  const onEscape = () => (confirmQuit ? setConfirmQuit(false) : requestClose())

  // Wording for the next attempt described by the start/result panels.
  const goalKey: TranslationKey =
    upcomingCfg.group === 3 ? 'memory.goal.triplets' : 'memory.goal.pairs'
  const isHalf = upcomingCfg.cards === 21

  return (
    <Modal
      onClose={onEscape}
      labelledBy="memory-title"
      className="modal-in relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded-lg border border-octarine/40 bg-surface p-6 text-fg shadow-xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon name="card" className="h-10 w-10 shrink-0 text-octarine" />
          <div>
            <h2 id="memory-title" className="text-xl font-bold">
              {t('memory.title')}
            </h2>
            <p className="text-sm text-muted">{t('memory.subtitle')}</p>
            {era ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm">
                <span className="text-muted">{t('memory.forEra')} :</span>
                <span
                  data-tier={era.uiTier}
                  className="inline-flex items-center gap-1 font-semibold text-accent"
                >
                  <EraIcon icon={era.icon} className="h-4 w-4" />
                  {eraName}
                </span>
              </p>
            ) : null}
          </div>
          {force ? (
            <Galet color={force.color} motif={force.motif} shape={force.shape} size={40} />
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          {phase === 'play' ? (
            <span className="text-sm text-muted">
              {t('memory.mistakesLeft')} :{' '}
              <span className="font-bold tabular-nums text-fg">
                {Math.max(0, cfg.mistakes - mistakes)}
              </span>
            </span>
          ) : null}
          <Button variant="ghost" onClick={requestClose}>
            {t('memory.close')}
          </Button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-y-auto py-4">
        {/* Board: interactive while playing, dimmed behind the panel otherwise. */}
        <div
          className={`grid w-full max-w-xl grid-cols-7 gap-2 transition duration-300 ${
            phase === 'play' ? '' : 'pointer-events-none scale-[0.98] opacity-30 blur-[2px]'
          }`}
        >
          {cards.map((c, i) => {
            const up = c.flipped || c.matched
            // Tint a revealed face in its resource's era palette (data-tier).
            const tier = defs.eras.find((e) => e.id === c.res.eraId)?.uiTier
            return (
              <button
                key={c.key}
                type="button"
                data-tier={up ? tier : undefined}
                onClick={() => flip(i)}
                disabled={phase !== 'play' || up || busy}
                aria-label={
                  up
                    ? c.joker
                      ? t(JOKER_LABEL[c.joker])
                      : t(c.res.nameKey as TranslationKey)
                    : t('memory.cardBack')
                }
                className={`flex aspect-5/7 items-center justify-center overflow-hidden rounded-md border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  c.matched
                    ? 'border-accent/70 bg-accent/15 opacity-80'
                    : up
                      ? 'border-accent bg-accent/10'
                      : 'border-octarine/40 bg-bg hover:brightness-125'
                }`}
              >
                {up ? <CardFace card={c} /> : <CardBack />}
              </button>
            )
          })}
        </div>

        {phase !== 'play' ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="modal-in flex max-w-md flex-col items-center gap-3 rounded-xl border border-octarine/40 bg-surface/95 p-6 text-center shadow-2xl backdrop-blur">
              {/* At level 1 (21 cards): only half the universe's memory is open yet. */}
              {isHalf ? (
                <p className="text-sm text-octarine/90 italic">{t('memory.half')}</p>
              ) : null}
              {phase === 'won' ? (
                <p className="text-lg font-bold text-accent">{t('memory.win.title')}</p>
              ) : null}
              {phase === 'lost' ? (
                <p className="text-lg font-bold text-muted">{t('memory.lose.title')}</p>
              ) : null}
              {phase === 'won' ? (
                <p className="text-muted">
                  {t('memory.win.production')}{' '}
                  <span className="inline-flex items-center gap-1 align-middle font-semibold text-secondary">
                    {mainRes?.symbol ? (
                      <span className="text-sm font-bold">{mainRes.symbol}</span>
                    ) : mainRes ? (
                      <Icon name={mainRes.icon} className="h-4 w-4" aria-hidden />
                    ) : null}
                    {mainName}
                  </span>
                  {' ('}
                  <span
                    data-tier={era?.uiTier}
                    className="inline-flex items-center gap-1 align-middle font-semibold text-accent"
                  >
                    <EraIcon icon={era.icon} className="h-4 w-4" />
                    {eraName}
                  </span>
                  {') '}
                  {t('memory.win.doubled')}
                </p>
              ) : phase === 'lost' ? (
                <p className="text-muted">{t('memory.lose.body')}</p>
              ) : maxed ? (
                <>
                  <p className="text-lg font-bold text-accent">{t('memory.maxed.title')}</p>
                  <p className="text-muted">{t('memory.maxed.body')}</p>
                  <Icon name="trophy" className="mx-auto mt-2 h-16 w-16 text-octarine" aria-hidden />
                </>
              ) : (
                <p className="text-muted">
                  {t('memory.reward')}{' '}
                  <span className="inline-flex items-center gap-1 align-middle font-semibold text-secondary">
                    {mainRes?.symbol ? (
                      <span className="text-sm font-bold">{mainRes.symbol}</span>
                    ) : mainRes ? (
                      <Icon name={mainRes.icon} className="h-4 w-4" aria-hidden />
                    ) : null}
                    {mainName}
                  </span>
                  .
                </p>
              )}

              {!maxed ? (
                <>
                  {/* Large era-symbol cluster (pair or triplet) between title and rules. */}
                  {era ? (
                    <span data-tier={era.uiTier} className="my-1 text-accent">
                      <EraSymbolCluster
                        eraIcon={era.icon}
                        count={upcomingCfg.group}
                        className="h-20"
                      />
                    </span>
                  ) : null}
                  <div className="flex flex-col gap-1 text-sm text-muted">
                    <p>
                      <span className="font-semibold text-octarine">
                        {t('memory.level')} {upcomingLevel}/{MEMORY_MAX_LEVEL}
                      </span>{' '}
                      - {upcomingCfg.cards} {t('memory.cards')}, {t(goalKey)}
                    </p>
                    <p>
                      {t('memory.consumes')}{' '}
                      <span className="inline-flex items-center gap-1 align-middle font-bold text-octarine">
                        <Icon name="gem" className="h-4 w-4" aria-hidden />
                        {formatFixed(cost)}
                      </span>{' '}
                      {t('app.complexity')}
                    </p>
                    <p>
                      {t('memory.mistakesAllowed')} :{' '}
                      <span className="font-bold tabular-nums text-fg">{upcomingCfg.mistakes}</span>
                    </p>
                  </div>
                </>
              ) : null}

              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={onClose}>
                  {maxed
                    ? t('memory.close')
                    : phase === 'start'
                      ? t('memory.cancel')
                      : phase === 'won'
                        ? t('memory.stop')
                        : t('memory.giveUp')}
                </Button>
                {!maxed ? (
                  <Button onClick={play} disabled={!affordable}>
                    {phase === 'start' ? t('memory.play') : t('memory.replay')}
                  </Button>
                ) : null}
                {!maxed && force ? (
                  <Galet color={force.color} motif={force.motif} shape={force.shape} size={34} />
                ) : null}
              </div>
              {!maxed && !affordable ? (
                <p className="text-xs text-muted">{t('memory.tooPoor')}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Quit confirmation: leaving mid-game forfeits the staked Complexity. */}
      {confirmQuit ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/60 p-4">
          <div className="modal-in flex max-w-sm flex-col items-center gap-4 rounded-xl border border-octarine/40 bg-surface p-6 text-center shadow-2xl">
            <p className="leading-relaxed text-fg">{t('memory.quit.body')}</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setConfirmQuit(false)}>
                {t('memory.quit.cancel')}
              </Button>
              <Button onClick={onClose}>{t('memory.quit.confirm')}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
