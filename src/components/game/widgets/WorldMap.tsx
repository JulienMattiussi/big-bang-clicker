import { useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

type Status = 'neutral' | 'trade' | 'war'
const REGIONS = [
  { x: 16, y: 20 },
  { x: 34, y: 32 },
  { x: 20, y: 47 },
  { x: 48, y: 16 },
  { x: 50, y: 47 },
  { x: 68, y: 28 },
  { x: 85, y: 19 },
  { x: 81, y: 46 },
]
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [3, 4],
  [3, 5],
  [5, 6],
  [5, 7],
  [4, 7],
  [6, 7],
]

const neighborsOf = (i: number) => EDGES.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : []))
const fillFor = (s: Status) =>
  s === 'trade'
    ? 'var(--color-secondary)'
    : s === 'war'
      ? 'var(--color-accent)'
      : 'var(--color-surface)'

/**
 * Era 13 (Nations): a world map. Choose a stance, then claim regions. Negotiate
 * for a peaceful trade hold (+trade), or Conquer for an empire (+empire, raises
 * tension). Claiming next to a region you already hold forms a bloc and pays a
 * bonus. Take the whole map and a new world opens. Territory control with a
 * diplomacy-vs-war choice - strategy, not just clicks. Full-width.
 */
export function WorldMap({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const [status, setStatus] = useState<Status[]>(() => REGIONS.map(() => 'neutral'))
  const [mode, setMode] = useState<'negotiate' | 'conquer'>('negotiate')
  const [bloom, setBloom] = useState(0)
  const timer = useRef<number | undefined>(undefined)

  const claim = (i: number) => {
    if (status[i] !== 'neutral') return
    const bloc = neighborsOf(i).some((n) => status[n] !== 'neutral')
    const next = [...status]
    if (mode === 'negotiate') {
      next[i] = 'trade'
      gainBase(bloc ? 2 : 1) // bloc bonus for adjacent holdings
    } else {
      next[i] = 'war'
      complete()
      if (bloc) complete()
    }
    if (next.every((s) => s !== 'neutral')) {
      complete() // the whole map united: a new world opens
      setBloom((b) => b + 1)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setStatus(REGIONS.map(() => 'neutral')), 850)
    }
    setStatus(next)
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <span className="text-base font-semibold text-fg">{verb}</span>

      <div role="radiogroup" aria-label={t('map.mode')} className="flex gap-2">
        {(['negotiate', 'conquer'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-md border px-3 py-1.5 text-sm transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              mode === m
                ? 'border-accent bg-accent/15 text-fg'
                : 'border-border text-muted hover:text-fg'
            }`}
          >
            {t(m === 'negotiate' ? 'map.negotiate' : 'map.conquer')}
          </button>
        ))}
      </div>

      <svg
        viewBox="0 0 100 60"
        className="h-56 w-full max-w-3xl overflow-visible"
        role="group"
        aria-label={verb}
        key={bloom}
      >
        {/* Stylised landmass. */}
        <ellipse cx="50" cy="32" rx="46" ry="26" fill="var(--color-secondary)" opacity="0.05" />
        {/* Borders between regions. */}
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={REGIONS[a].x}
            y1={REGIONS[a].y}
            x2={REGIONS[b].x}
            y2={REGIONS[b].y}
            stroke="var(--color-border)"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
        ))}
        {REGIONS.map((r, i) => (
          <g key={i} className={bloom && status[i] !== 'neutral' ? 'bloom' : undefined}>
            <circle
              cx={r.x}
              cy={r.y}
              r="5"
              fill={fillFor(status[i])}
              stroke="var(--color-fg)"
              strokeWidth="1"
              opacity="0.9"
            />
            <circle
              cx={r.x}
              cy={r.y}
              r="7"
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label={`${t('map.region')} ${i + 1}`}
              onClick={() => claim(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  claim(i)
                }
              }}
              className="cursor-pointer outline-none focus-visible:stroke-accent"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
      <span className="text-xs text-muted">{t('map.hint')}</span>
    </div>
  )
}
