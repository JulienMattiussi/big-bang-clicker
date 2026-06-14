import { useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

type Status = 'neutral' | 'trade' | 'war'
// Regions spread over the continents (viewBox 100x60, equirectangular-ish), so the
// edge network hugs the land. 0-3 N.America, 4-6 S.America, 7-8 Europe, 9-13 Africa,
// 14-19 Asia, 20 India, 21 Oceania.
const REGIONS = [
  { x: 13, y: 13 },
  { x: 20, y: 13 },
  { x: 17, y: 20 },
  { x: 22, y: 27 },
  { x: 29, y: 35 },
  { x: 32, y: 40 },
  { x: 28, y: 47 },
  { x: 47, y: 12 },
  { x: 52, y: 14 },
  { x: 49, y: 22 },
  { x: 58, y: 24 },
  { x: 52, y: 30 },
  { x: 50, y: 38 },
  { x: 51, y: 45 },
  { x: 57, y: 16 },
  { x: 66, y: 11 },
  { x: 75, y: 10 },
  { x: 84, y: 14 },
  { x: 78, y: 20 },
  { x: 70, y: 18 },
  { x: 65, y: 27 },
  { x: 84, y: 42 },
]
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [4, 6],
  [5, 6],
  [1, 7],
  [7, 8],
  [7, 9],
  [9, 10],
  [9, 11],
  [10, 11],
  [11, 12],
  [12, 13],
  [8, 14],
  [10, 14],
  [14, 19],
  [15, 19],
  [15, 16],
  [16, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [18, 21],
]
/** Stylised continent silhouettes (filled land), drawn behind the regions. */
const CONTINENTS = [
  'M9,10 Q17,7 25,9 Q29,11 26,14 Q28,16 25,18 Q27,21 23,22 Q25,26 21,27 L23,30 Q20,31 19,28 Q16,26 16,22 Q11,21 10,16 Q7,13 9,10 Z', // N. America
  'M25,31 Q32,29 34,34 Q36,38 32,40 Q34,43 30,45 Q29,49 27,51 Q25,46 26,42 Q23,39 25,35 Q23,32 25,31 Z', // S. America
  'M44,11 Q48,8 51,10 Q53,8 55,10 Q54,13 51,13 Q53,16 49,16 Q47,18 46,15 Q43,13 44,11 Z', // Europe
  'M45,19 Q55,17 62,21 Q64,24 61,26 Q63,29 59,31 Q58,38 54,45 Q51,49 49,45 Q47,38 48,32 Q44,28 45,24 Q43,21 45,19 Z', // Africa
  'M52,10 Q60,6 70,7 Q80,6 87,11 Q90,14 85,16 Q88,18 83,19 Q85,22 80,22 Q74,24 69,21 Q64,23 60,20 Q55,19 53,15 Q50,12 52,10 Z', // Asia
  'M63,22 Q67,22 68,26 Q67,31 65,31 Q63,28 62,24 Q62,22 63,22 Z', // India
  'M79,39 Q85,37 90,40 Q92,43 88,46 Q83,48 79,45 Q76,42 79,39 Z', // Oceania
]

const neighborsOf = (i: number) => EDGES.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : []))
const fillFor = (s: Status) =>
  s === 'trade'
    ? 'var(--color-secondary)'
    : s === 'war'
      ? 'var(--color-accent)'
      : 'var(--color-surface)'

/**
 * Era 13 (Nations): a stylised world map of the real continents. Choose a stance,
 * then bring regions into your state. Negotiate forms a peaceful trade hold
 * (+trade), Conquer annexes for an empire (+empire). Claiming next to a region you
 * already hold forms a bloc and pays a bonus. Unify the whole map and it resets.
 * Territory control with a diplomacy-vs-war choice. Full-width.
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
        className="h-80 w-full max-w-4xl overflow-visible"
        role="group"
        aria-label={verb}
        key={bloom}
      >
        <rect x="0" y="0" width="100" height="60" rx="3" fill="var(--color-secondary)" opacity="0.12" />
        <g fill="var(--part-4)" opacity="0.7" aria-hidden>
          {CONTINENTS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
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
              r="2.5"
              fill={fillFor(status[i])}
              stroke="var(--color-fg)"
              strokeWidth="0.6"
              opacity="0.95"
            />
            <circle
              cx={r.x}
              cy={r.y}
              r="4"
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
              strokeWidth="1.2"
            />
          </g>
        ))}
      </svg>
      <span className="text-xs text-muted">{t('map.hint')}</span>
    </div>
  )
}
