import { useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { Icon } from '@/components/ui/Icon'
import { defs } from '@/data'
import { WidgetHint } from './WidgetHint'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

type Status = 'neutral' | 'trade' | 'war'
// Regions spread over the continents (viewBox 100x60, equirectangular-ish), so the
// edge network draws clean territories. 0-4 N.America, 5-8 S.America, 9-10 Europe,
// 11-16 Africa, 17-23 Asia, 24 India, 25-26 Oceania.
const REGIONS = [
  { x: 12, y: 12 },
  { x: 19, y: 11 },
  { x: 24, y: 16 },
  { x: 16, y: 19 },
  { x: 21, y: 25 },
  { x: 28, y: 33 },
  { x: 32, y: 39 },
  { x: 29, y: 44 },
  { x: 28, y: 49 },
  { x: 46, y: 11 },
  { x: 52, y: 14 },
  { x: 48, y: 22 },
  { x: 58, y: 23 },
  { x: 53, y: 28 },
  { x: 49, y: 34 },
  { x: 52, y: 40 },
  { x: 51, y: 46 },
  { x: 57, y: 17 },
  { x: 63, y: 10 },
  { x: 72, y: 8 },
  { x: 82, y: 11 },
  { x: 85, y: 16 },
  { x: 78, y: 19 },
  { x: 70, y: 19 },
  { x: 65, y: 28 },
  { x: 82, y: 41 },
  { x: 87, y: 44 },
  { x: 60, y: 42 },
]
const EDGES: [number, number][] = [
  [0, 1],
  [0, 3],
  [1, 2],
  [3, 4],
  [2, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [6, 9],
  [9, 10],
  [9, 11],
  [11, 12],
  [11, 13],
  [12, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [10, 17],
  [12, 17],
  [17, 23],
  [18, 23],
  [18, 19],
  [19, 20],
  [20, 21],
  [21, 22],
  [22, 23],
  [23, 24],
  [22, 24],
  [22, 25],
  [25, 26],
  [15, 27],
  [24, 27],
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
  'M60,38 Q62,40 61,44 Q60,47 59,44 Q58,39 60,38 Z', // Madagascar
]

/** Expansion seeds in Europe; a region's neighbours are revealed only once it is
 *  claimed, so the map unfolds outward from there. */
const START = 9 // Europe (west)
const neighborsOf = (i: number) => EDGES.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : []))

/** Trade mark: two coins. Negotiated holds (and the hover preview) wear it. */
function TradeMark({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return (
    <g fill={color} aria-hidden>
      <circle cx={cx - 0.7} cy={cy + 0.3} r="1" />
      <circle cx={cx + 0.7} cy={cy - 0.4} r="1" />
    </g>
  )
}

/** War mark: an upright sword (blade, crossguard, pommel). Conquered holds (and
 *  the hover preview) wear it. */
function WarMark({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return (
    <g aria-hidden transform={`rotate(38 ${cx} ${cy})`}>
      <line
        x1={cx}
        y1={cy - 1.6}
        x2={cx}
        y2={cy + 1.1}
        stroke={color}
        strokeWidth="0.6"
        strokeLinecap="round"
      />
      <line
        x1={cx - 0.9}
        y1={cy + 0.4}
        x2={cx + 0.9}
        y2={cy + 0.4}
        stroke={color}
        strokeWidth="0.6"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy + 1.4} r="0.45" fill={color} />
    </g>
  )
}

/**
 * Era 13 (Nations): a stylised world map. Expansion starts in Europe; a region's
 * neighbours are revealed only once it is claimed, so the map unfolds outward.
 * Choose a stance: Negotiate forms a peaceful trade hold (+trade), Conquer annexes
 * for an empire (+empire). Unify the whole map and it resets. Full-width.
 */
export function WorldMap({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const [status, setStatus] = useState<Status[]>(() => REGIONS.map(() => 'neutral'))
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set([START]))
  const [mode, setMode] = useState<'negotiate' | 'conquer'>('negotiate')
  const [bloom, setBloom] = useState(0)
  const timer = useRef<number | undefined>(undefined)

  // Effect icons echoed on the stance buttons: Negotiate yields the base resource
  // (trade), Conquer yields the recipe output (empires).
  const tradeIcon = defs.resources[era.clickResource]?.icon
  const converterId = era.converters[0]
  const empireRes = converterId ? defs.converters[converterId]?.outputs[0]?.resource : undefined
  const empireIcon = empireRes ? defs.resources[empireRes]?.icon : undefined

  const claim = (i: number) => {
    if (!revealed.has(i) || status[i] !== 'neutral') return
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
    // Claiming a region reveals its neighbours (they become reachable).
    setRevealed((prev) => {
      const s = new Set(prev)
      for (const n of neighborsOf(i)) s.add(n)
      return s
    })
    if (next.every((s) => s !== 'neutral')) {
      complete() // the whole map united: a new world opens
      setBloom((b) => b + 1)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        setStatus(REGIONS.map(() => 'neutral'))
        setRevealed(new Set([START]))
      }, 850)
    }
    setStatus(next)
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <span className="text-base font-semibold text-fg">{verb}</span>

      <div role="radiogroup" aria-label={t('map.mode')} className="flex gap-2">
        {(['negotiate', 'conquer'] as const).map((m) => {
          const effectIcon = m === 'negotiate' ? tradeIcon : empireIcon
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                mode === m
                  ? 'border-accent bg-accent/15 text-fg'
                  : 'border-border text-muted hover:text-fg'
              }`}
            >
              <svg viewBox="0 0 6 6" className="h-4 w-4" aria-hidden>
                {m === 'negotiate' ? (
                  <TradeMark cx={3} cy={3} color="var(--stone-light)" />
                ) : (
                  <WarMark cx={3} cy={3} color="var(--color-accent)" />
                )}
              </svg>
              {t(m === 'negotiate' ? 'map.negotiate' : 'map.conquer')}
              <span aria-hidden className="text-muted">
                +
              </span>
              {effectIcon ? <Icon name={effectIcon} className="h-4 w-4" /> : null}
            </button>
          )
        })}
      </div>

      <svg
        viewBox="0 0 100 60"
        className="h-80 w-full max-w-4xl overflow-visible"
        role="group"
        aria-label={verb}
        key={bloom}
      >
        <rect
          x="0"
          y="0"
          width="100"
          height="60"
          rx="3"
          fill="var(--color-secondary)"
          opacity="0.12"
        />
        <g fill="var(--part-4)" opacity="0.7" aria-hidden>
          {CONTINENTS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {EDGES.filter(([a, b]) => revealed.has(a) && revealed.has(b)).map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={REGIONS[a]!.x}
            y1={REGIONS[a]!.y}
            x2={REGIONS[b]!.x}
            y2={REGIONS[b]!.y}
            stroke="var(--color-border)"
            strokeWidth="0.7"
            strokeDasharray="1 1.2"
          />
        ))}
        {REGIONS.map((r, i) =>
          revealed.has(i) ? (
            <g key={i} className={`group ${bloom && status[i] !== 'neutral' ? 'bloom' : ''}`}>
              <circle
                cx={r.x}
                cy={r.y}
                r="2"
                fill="var(--color-surface)"
                stroke="var(--color-fg)"
                strokeWidth="0.5"
                opacity="0.95"
              />
              {status[i] === 'trade' ? (
                <TradeMark cx={r.x} cy={r.y} color="var(--stone-light)" />
              ) : status[i] === 'war' ? (
                <WarMark cx={r.x} cy={r.y} color="var(--color-accent)" />
              ) : (
                <g className="opacity-0 transition group-hover:opacity-90">
                  {mode === 'negotiate' ? (
                    <TradeMark cx={r.x} cy={r.y} color="var(--color-muted)" />
                  ) : (
                    <WarMark cx={r.x} cy={r.y} color="var(--color-muted)" />
                  )}
                </g>
              )}
              <circle
                cx={r.x}
                cy={r.y}
                r="3.4"
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
                className="cursor-pointer stroke-transparent outline-none transition hover:stroke-accent focus-visible:stroke-accent"
                strokeWidth="1.2"
              />
            </g>
          ) : null,
        )}
      </svg>
      <WidgetHint>{t('map.hint')}</WidgetHint>
    </div>
  )
}
