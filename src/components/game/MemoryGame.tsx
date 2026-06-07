import { useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { formatFixed } from '@/lib/format'
import { MEMORY_MISTAKES, MEMORY_PAIRS, memoryCost } from '@/lib/memory'
import type { ResourceDef } from '@/lib/types'
import type { TranslationKey } from '@/i18n/types'

type Phase = 'start' | 'play' | 'won' | 'lost'
interface Card {
  key: number
  res: ResourceDef
  flipped: boolean
  matched: boolean
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Build a shuffled deck of MEMORY_PAIRS distinct resources, each duplicated. */
function dealCards(pool: ResourceDef[]): Card[] {
  const unique: ResourceDef[] = []
  const seen = new Set<string>()
  for (const r of pool) {
    if (r && !seen.has(r.id)) {
      seen.add(r.id)
      unique.push(r)
    }
  }
  const chosen = unique.slice(0, MEMORY_PAIRS)
  const cards = chosen.flatMap((res, i) => [
    { key: i * 2, res, flipped: false, matched: false },
    { key: i * 2 + 1, res, flipped: false, matched: false },
  ])
  return shuffle(cards)
}

/** A roughly realistic playing-card back: diamond lattice, frame, centre pip. */
function CardBack() {
  const lines = []
  for (let i = -9; i <= 9; i++) {
    const o = i * 8
    lines.push(<line key={`u${i}`} x1={o} y1={0} x2={o + 70} y2={70} />)
    lines.push(<line key={`d${i}`} x1={o} y1={70} x2={o + 70} y2={0} />)
  }
  return (
    <svg viewBox="0 0 50 70" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <rect width="50" height="70" fill="var(--color-octarine)" fillOpacity="0.14" />
      <g stroke="var(--color-octarine)" strokeWidth="0.7" opacity="0.5">
        {lines}
      </g>
      <rect x="4" y="4" width="42" height="62" rx="4" fill="none" stroke="var(--color-octarine)" strokeWidth="1.2" opacity="0.85" />
      <path d="M25 26 L33 35 L25 44 L17 35 Z" fill="var(--color-octarine)" opacity="0.9" />
      <path d="M25 31 L29.5 35 L25 39 L20.5 35 Z" fill="var(--color-bg)" />
    </svg>
  )
}

/** The card's face: chemical symbol if any, otherwise the resource icon. */
function CardFace({ res }: { res: ResourceDef }) {
  const { t } = useTranslation()
  return (
    <span className="flex flex-col items-center gap-0.5 text-secondary">
      {res.symbol ? (
        <span className="text-xl font-bold">{res.symbol}</span>
      ) : (
        <Icon name={res.icon} className="h-9 w-9" />
      )}
      <span className="max-w-full truncate px-0.5 text-[10px] text-muted">
        {t(res.nameKey as TranslationKey)}
      </span>
    </span>
  )
}

/**
 * Near-fullscreen memory (concentration) game. Staking Complexity deals a board
 * of resource-icon pairs; clearing it (within the mistake budget) doubles the
 * current era's main resource production. See src/lib/memory.ts.
 */
export function MemoryGame({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const defs = useGameStore((s) => s.defs)
  const complexity = useGameStore((s) => s.state.complexity)
  const currentEraId = useGameStore((s) => s.state.currentEraId)
  const startMemoryGame = useGameStore((s) => s.startMemoryGame)
  const winMemoryGame = useGameStore((s) => s.winMemoryGame)
  const cost = useGameStore((s) => memoryCost(s.state))

  const era = defs.eras.find((e) => e.id === currentEraId) ?? defs.eras[0]
  const mainRes = era ? defs.resources[era.clickResource] : undefined
  const mainName = mainRes ? t(mainRes.nameKey as TranslationKey) : ''

  // Always 42 cards (21 pairs): discovered resources first, then top up with
  // others (unknown next-era resources are allowed) to reach the count.
  const makeDeck = () => {
    const discovered = useGameStore.getState().state.discovered
    const pool = Object.keys(discovered)
      .filter((id) => discovered[id])
      .map((id) => defs.resources[id])
      .filter(Boolean)
    shuffle(pool)
    if (pool.length < MEMORY_PAIRS) {
      const extra = Object.values(defs.resources).filter((r) => !discovered[r.id])
      shuffle(extra)
      pool.push(...extra)
    }
    return dealCards(pool)
  }

  const [phase, setPhase] = useState<Phase>('start')
  // Deal a board immediately so it shows (face-down) behind the start text.
  const [cards, setCards] = useState<Card[]>(makeDeck)
  const [first, setFirst] = useState<number | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [busy, setBusy] = useState(false)
  const [confirmQuit, setConfirmQuit] = useState(false)

  // Leaving mid-game forfeits the staked Complexity, so confirm first.
  const requestClose = () => (phase === 'play' ? setConfirmQuit(true) : onClose())

  const affordable = complexity >= cost

  const play = () => {
    if (!startMemoryGame()) return
    setCards(makeDeck())
    setFirst(null)
    setMistakes(0)
    setBusy(false)
    setPhase('play')
  }

  const flip = (i: number) => {
    if (busy) return
    const card = cards[i]
    if (!card || card.flipped || card.matched) return

    if (first === null) {
      setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)))
      setFirst(i)
      return
    }
    if (i === first) return

    const matchId = cards[first].res.id
    if (card.res.id === matchId) {
      // Match: lock both face-up. If that was the last pair, it is a win.
      setCards((prev) =>
        prev.map((c) => (c.res.id === matchId ? { ...c, flipped: true, matched: true } : c)),
      )
      setFirst(null)
      const remaining = cards.filter((c) => !c.matched && c.res.id !== matchId).length
      if (remaining === 0) {
        winMemoryGame()
        window.setTimeout(() => setPhase('won'), 450)
      }
    } else {
      // Mismatch: reveal briefly, then flip both back and count the mistake.
      setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)))
      setBusy(true)
      const used = mistakes + 1
      setMistakes(used)
      const firstIdx = first
      window.setTimeout(() => {
        setCards((prev) =>
          prev.map((c, idx) => (idx === i || idx === firstIdx ? { ...c, flipped: false } : c)),
        )
        setFirst(null)
        setBusy(false)
        if (used > MEMORY_MISTAKES) setPhase('lost')
      }, 850)
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    if (confirmQuit) setConfirmQuit(false)
    else requestClose()
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onKeyDown={onKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-title"
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
            </div>
          </div>
          <div className="flex items-center gap-4">
            {phase === 'play' ? (
              <span className="text-sm text-muted">
                {t('memory.mistakesLeft')} :{' '}
                <span className="font-bold tabular-nums text-fg">
                  {Math.max(0, MEMORY_MISTAKES - mistakes)}
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
                  aria-label={up ? t(c.res.nameKey as TranslationKey) : t('memory.cardBack')}
                  className={`flex aspect-5/7 items-center justify-center overflow-hidden rounded-md border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    c.matched
                      ? 'border-accent/70 bg-accent/15 opacity-80'
                      : up
                        ? 'border-accent bg-accent/10'
                        : 'border-octarine/40 bg-bg hover:brightness-125'
                  }`}
                >
                  {up ? <CardFace res={c.res} /> : <CardBack />}
                </button>
              )
            })}
          </div>

          {/* Start / won / lost panel, centred over the (dimmed) board. */}
          {phase !== 'play' ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="modal-in flex max-w-md flex-col items-center gap-3 rounded-xl border border-octarine/40 bg-surface/95 p-6 text-center shadow-2xl backdrop-blur">
                {phase === 'won' ? (
                  <p className="text-lg font-bold text-accent">{t('memory.win.title')}</p>
                ) : null}
                {phase === 'lost' ? (
                  <p className="text-lg font-bold text-muted">{t('memory.lose.title')}</p>
                ) : null}
                {phase === 'won' ? (
                  <p className="text-muted">{t('memory.win.body')}</p>
                ) : phase === 'lost' ? (
                  <p className="text-muted">{t('memory.lose.body')}</p>
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
                <p className="text-sm text-muted">
                  {t('memory.consumes')}{' '}
                  <span className="inline-flex items-center gap-1 align-middle font-bold text-octarine">
                    <Icon name="gem" className="h-4 w-4" aria-hidden />
                    {formatFixed(cost)}
                  </span>{' '}
                  {t('app.complexity')}
                </p>
                <div className="flex items-center gap-3">
                  {phase !== 'start' ? (
                    <Button variant="ghost" onClick={onClose}>
                      {t('memory.giveUp')}
                    </Button>
                  ) : null}
                  <Button onClick={play} disabled={!affordable}>
                    {phase === 'start' ? t('memory.play') : t('memory.replay')}
                  </Button>
                </div>
                {!affordable ? <p className="text-xs text-muted">{t('memory.tooPoor')}</p> : null}
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
      </div>
    </div>
  )
}
