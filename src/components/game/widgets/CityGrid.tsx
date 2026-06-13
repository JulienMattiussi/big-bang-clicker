import { useRef, useState, type ReactElement } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

const COLS = 8
const ROWS = 5
const CELLS = COLS * ROWS
/** Adjacency points to accumulate before a thriving city emerges. */
const NEED = 5

interface Building {
  key: string
  tint: string
  /** Building keys that give an adjacency bonus next to this one. */
  pairs: string[]
  glyph: (props: { className: string }) => ReactElement
}

const BUILDINGS: Building[] = [
  {
    key: 'house',
    tint: 'var(--color-accent)',
    pairs: ['farm'],
    glyph: ({ className }) => <polygon points="8,2 14,14 2,14" className={className} />,
  },
  {
    key: 'farm',
    tint: 'var(--color-secondary)',
    pairs: ['house'],
    glyph: ({ className }) => <circle cx="8" cy="8" r="6" className={className} />,
  },
  {
    key: 'workshop',
    tint: 'var(--color-octarine)',
    pairs: ['market'],
    glyph: ({ className }) => <rect x="3" y="3" width="10" height="10" className={className} />,
  },
  {
    key: 'market',
    tint: 'var(--color-muted)',
    pairs: ['workshop'],
    glyph: ({ className }) => <polygon points="8,2 14,8 8,14 2,8" className={className} />,
  },
]

const neighbors = (i: number) => {
  const r = Math.floor(i / COLS)
  const c = i % COLS
  const out: number[] = []
  if (r > 0) out.push(i - COLS)
  if (r < ROWS - 1) out.push(i + COLS)
  if (c > 0) out.push(i - 1)
  if (c < COLS - 1) out.push(i + 1)
  return out
}

/**
 * Era 12 (Societies): a city plan. Pick a building, then place it on the grid
 * (+1 population). Buildings that sit next to a good neighbour (homes by farms,
 * workshops by markets) earn harmony; enough harmony and a thriving city is born
 * (free). Click a tile to clear it. A spatial optimisation puzzle - placement
 * matters, a fresh way to handle production. Full-width.
 */
export function CityGrid({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const [grid, setGrid] = useState<(number | null)[]>(() => new Array(CELLS).fill(null))
  const [selected, setSelected] = useState(0)
  const [bloomCell, setBloomCell] = useState<number | null>(null)
  const accRef = useRef(0)

  const place = (i: number) => {
    setGrid((prev) => {
      const next = [...prev]
      if (next[i] !== null) {
        next[i] = null
        return next
      }
      next[i] = selected
      gainBase()
      // Adjacency bonus from good neighbours.
      const me = BUILDINGS[selected]
      let bonus = 0
      for (const n of neighbors(i)) {
        const b = next[n]
        if (b !== null && me.pairs.includes(BUILDINGS[b].key)) bonus++
      }
      if (bonus > 0) {
        accRef.current += bonus
        if (accRef.current >= NEED) {
          accRef.current -= NEED
          complete()
          setBloomCell(i)
        }
      }
      return next
    })
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <span className="text-base font-semibold text-fg">{verb}</span>

      <div role="radiogroup" aria-label={verb} className="flex flex-wrap justify-center gap-2">
        {BUILDINGS.map((b, i) => (
          <button
            key={b.key}
            type="button"
            role="radio"
            aria-checked={selected === i}
            onClick={() => setSelected(i)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              selected === i
                ? 'border-accent bg-accent/15 text-fg'
                : 'border-border text-muted hover:text-fg'
            }`}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden style={{ color: b.tint }}>
              <b.glyph className="fill-current" />
            </svg>
            {t(`city.${b.key}` as TranslationKey)}
          </button>
        ))}
      </div>

      <div
        role="group"
        aria-label={verb}
        className="grid w-full max-w-2xl gap-1 rounded-lg border border-border bg-surface/30 p-2"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {grid.map((type, i) => {
          const b = type === null ? null : BUILDINGS[type]
          return (
            <button
              key={i}
              type="button"
              onClick={() => place(i)}
              aria-label={b ? t(`city.${b.key}` as TranslationKey) : t('city.empty')}
              className={`flex aspect-square items-center justify-center rounded-sm border transition select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
                b ? 'border-border' : 'border-border/40 bg-bg/30 hover:bg-secondary/20'
              } ${bloomCell === i ? 'bloom' : ''}`}
              style={b ? { backgroundColor: b.tint } : undefined}
            >
              {b ? (
                <svg viewBox="0 0 16 16" className="h-3/5 w-3/5" aria-hidden>
                  <b.glyph className="fill-bg" />
                </svg>
              ) : null}
            </button>
          )
        })}
      </div>
      <span className="text-xs text-muted">{t('city.hint')}</span>
    </div>
  )
}
