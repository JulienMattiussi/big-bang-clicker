import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { WidgetGalet } from './WidgetGalet'
import { useGameStore } from '@/store/gameStore'
import { announceGalet } from '@/hooks/useGalets'
import { widgetGaletForEra } from '@/lib/galets'
import { Galet } from '@/components/art/Galet'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

const COLS = 8
const ROWS = 5
const CELLS = COLS * ROWS
/** Most copies of one building type a single city may hold (forces diversity). */
const PER_TYPE_LIMIT = 10
/** Cap on the thriving-cities multiplier applied to the widget's effects. */
const MAX_THRIVE_MULT = 10
/** Harmony the full city must reach for the thriving-city bonus to fire. */
const HARMONY_GOAL = 40
/** Higher harmony of a full city that also awards the painted society pebble. */
const SUPER_GOAL = 60

interface Building {
  key: string
  tint: string
  /** Building keys that give a harmony bonus when placed next to this one. */
  pairs: string[]
  /** Building keys that clash (harmony penalty) when placed next to this one. */
  bad?: string[]
  glyph: (props: { className: string }) => ReactElement
}

// 16x16 glyphs; fillRule="evenodd" cutouts let the tile tint show through the
// door/window holes, so no second colour is needed.
const BUILDINGS: Building[] = [
  {
    key: 'house',
    tint: 'var(--part-1)',
    pairs: ['farm', 'church', 'workshop'],
    glyph: ({ className }) => (
      <path
        className={className}
        fillRule="evenodd"
        d="M8,1.5 L14.5,7 L13,7 L13,14.5 L3,14.5 L3,7 L1.5,7 Z M6.5,14.5 L6.5,10 L9.5,10 L9.5,14.5 Z M9.6,8 L11.6,8 L11.6,10 L9.6,10 Z"
      />
    ),
  },
  {
    key: 'farm',
    tint: 'var(--part-3)',
    pairs: ['house', 'market'],
    glyph: ({ className }) => (
      <g className={className}>
        <g transform="rotate(45 8 6)">
          <rect x="7.2" y="0.8" width="1.6" height="10.4" rx="0.4" />
          <rect x="2.8" y="5.2" width="10.4" height="1.6" rx="0.4" />
        </g>
        <circle cx="8" cy="6" r="1.3" />
        <path d="M6,15 L7,8.2 L9,8.2 L10,15 Z" />
      </g>
    ),
  },
  {
    key: 'workshop',
    tint: 'var(--part-4)',
    pairs: ['market', 'house'],
    bad: ['church'],
    glyph: ({ className }) => (
      <path
        className={className}
        d="M2,5.5 L12,5.5 L12,7.5 L2,7.5 Z M12,5.8 L15,6.5 L12,7.2 Z M6,7.5 L9,7.5 L8.2,10 L6.8,10 Z M4,10 L11,10 L12,13 L3,13 Z"
      />
    ),
  },
  {
    key: 'market',
    tint: 'var(--color-muted)',
    pairs: ['workshop', 'farm'],
    glyph: ({ className }) => (
      <path
        className={className}
        d="M2,3.5 L14,3.5 L14,6.5 q-1.5,1.4 -3,0 q-1.5,-1.4 -3,0 q-1.5,1.4 -3,0 q-1.5,-1.4 -3,0 Z M3.5,6.5 L4.5,6.5 L4.5,11 L3.5,11 Z M11.5,6.5 L12.5,6.5 L12.5,11 L11.5,11 Z M2.5,11 L13.5,11 L13.5,13 L2.5,13 Z"
      />
    ),
  },
  {
    key: 'church',
    tint: 'var(--color-era)',
    pairs: ['house'],
    bad: ['church', 'workshop'],
    glyph: ({ className }) => (
      <path
        className={className}
        fillRule="evenodd"
        d="M7.6,1 L8.4,1 L8.4,2 L9.2,2 L9.2,2.8 L8.4,2.8 L8.4,3.6 L7.6,3.6 L7.6,2.8 L6.8,2.8 L6.8,2 L7.6,2 Z M8,3.6 L11.2,7 L4.8,7 Z M5,7 L11,7 L11,14.5 L5,14.5 Z M6.9,14.5 L6.9,10.6 Q6.9,9.4 8,9.4 Q9.1,9.4 9.1,10.6 L9.1,14.5 Z M7.1,8.2 a0.9,0.9 0 1,0 1.8,0 a0.9,0.9 0 1,0 -1.8,0 Z"
      />
    ),
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

/** +1 if the two buildings are good neighbours, -1 if they clash, else 0. */
const pairScore = (a: Building, b: Building) => {
  if (a.pairs.includes(b.key) || b.pairs.includes(a.key)) return 1
  if (a.bad?.includes(b.key) || b.bad?.includes(a.key)) return -1
  return 0
}

/** Total harmony of the grid: every adjacent pair scored once (right + down). */
const scoreGrid = (g: (number | null)[]) => {
  let s = 0
  for (let i = 0; i < CELLS; i++) {
    const t = g[i]
    if (t === null || t === undefined) continue
    const me = BUILDINGS[t]!
    const c = i % COLS
    const r = Math.floor(i / COLS)
    if (c < COLS - 1 && g[i + 1] != null) s += pairScore(me, BUILDINGS[g[i + 1] as number]!)
    if (r < ROWS - 1 && g[i + COLS] != null) s += pairScore(me, BUILDINGS[g[i + COLS] as number]!)
  }
  return s
}

/** Stable key for an unordered building pair (indices into BUILDINGS). */
const pairKey = (a: number, b: number) => (a < b ? `${a}|${b}` : `${b}|${a}`)

interface Pair {
  a: number
  b: number
  kind: 'good' | 'bad'
}

/** Unique neighbour pairs (good and bad), derived from the BUILDINGS data. */
const PAIRS: Pair[] = (() => {
  const seen = new Set<string>()
  const out: Pair[] = []
  const add = (i: number, otherKey: string, kind: Pair['kind']) => {
    const j = BUILDINGS.findIndex((x) => x.key === otherKey)
    if (j < 0) return
    const key = pairKey(i, j)
    if (seen.has(key)) return
    seen.add(key)
    out.push({ a: Math.min(i, j), b: Math.max(i, j), kind })
  }
  // Good pairs first, so a key claimed as good is never also listed as bad.
  BUILDINGS.forEach((b, i) => b.pairs.forEach((k) => add(i, k, 'good')))
  BUILDINGS.forEach((b, i) => b.bad?.forEach((k) => add(i, k, 'bad')))
  return out
})()

function Mark({ idx, className }: { idx: number; className?: string }): ReactElement {
  const b = BUILDINGS[idx]!
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-4 w-4 ${className ?? ''}`}
      aria-hidden
      style={{ color: b.tint }}
    >
      <b.glyph className="fill-current" />
    </svg>
  )
}

function HarmonyMark({ className }: { className?: string }): ReactElement {
  return (
    <svg viewBox="0 0 16 16" className={`h-4 w-4 text-accent ${className ?? ''}`} aria-hidden>
      <g className="fill-current">
        <circle cx="8" cy="4.4" r="2.7" />
        <circle cx="11.4" cy="6.9" r="2.7" />
        <circle cx="10.1" cy="10.9" r="2.7" />
        <circle cx="5.9" cy="10.9" r="2.7" />
        <circle cx="4.6" cy="6.9" r="2.7" />
        <circle cx="8" cy="8" r="2.4" />
      </g>
    </svg>
  )
}

function DiscordMark({ className }: { className?: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-4 w-4 ${className ?? ''}`}
      aria-hidden
      style={{ color: 'var(--danger)' }}
    >
      <g className="fill-current" transform="rotate(45 8 8)">
        <rect x="6.8" y="2" width="2.4" height="12" rx="1" />
        <rect x="2" y="6.8" width="12" height="2.4" rx="1" />
      </g>
    </svg>
  )
}

/** Era 12 (Societies): place buildings on a grid; good neighbours raise the
 *  city's harmony, bad ones lower it. Fill the whole grid with harmony at or
 *  above HARMONY_GOAL and a thriving city is born (free), then the plan resets.
 *  Full-width. */
export function CityGrid({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const discoverCityPairs = useGameStore((s) => s.discoverCityPairs)
  const discovered = new Set(useGameStore((s) => s.state.cityPairs))

  const galetDef = widgetGaletForEra(
    useGameStore((s) => s.defs),
    era.id,
  )
  const galetFound = useGameStore((s) => (galetDef ? !!s.state.galets[galetDef.id]?.found : false))

  const [grid, setGrid] = useState<(number | null)[]>(() => new Array(CELLS).fill(null))
  const [selected, setSelected] = useState(0)
  const [harmony, setHarmony] = useState(0)
  const [thriving, setThriving] = useState(0)
  const [bloomCell, setBloomCell] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<{ success: boolean; score: number; mult: number } | null>(
    null,
  )
  const [reactGood, setReactGood] = useState<number[]>([])
  const [reactBad, setReactBad] = useState<number[]>([])
  const bloomTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const reactTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(
    () => () => {
      clearTimeout(bloomTimer.current)
      clearTimeout(reactTimer.current)
      clearTimeout(resetTimer.current)
    },
    [],
  )

  const discover = (found: Set<string>) => discoverCityPairs([...found])

  const typeCount = (g: (number | null)[], type: number) => g.filter((c) => c === type).length

  const place = (i: number) => {
    if (grid[i] !== null) return // a placed building stays put: not clickable
    if (typeCount(grid, selected) >= PER_TYPE_LIMIT) return // this type is used up

    const next = [...grid]
    next[i] = selected
    setGrid(next)

    // If that placement used up the type, jump to one that still has room.
    if (typeCount(next, selected) >= PER_TYPE_LIMIT) {
      const free = BUILDINGS.findIndex((_, idx) => typeCount(next, idx) < PER_TYPE_LIMIT)
      if (free >= 0) setSelected(free)
    }

    const me = BUILDINGS[selected]!
    const good: number[] = []
    const bad: number[] = []
    const found = new Set<string>()
    for (const n of neighbors(i)) {
      const t2 = next[n]
      if (t2 === null || t2 === undefined) continue
      const nKey = BUILDINGS[t2]!.key
      if (me.pairs.includes(nKey)) {
        good.push(n)
        found.add(pairKey(selected, t2))
      } else if (me.bad?.includes(nKey)) {
        bad.push(n)
        found.add(pairKey(selected, t2))
      }
    }

    // Each thriving city already built multiplies every effect of the widget (capped).
    const mult = Math.min(1 + thriving, MAX_THRIVE_MULT)
    // Base resource scales with good neighbours: x2 for one, x3 for two, etc.
    gainBase((good.length + 1) * mult)

    if (good.length || bad.length) {
      // The placed tile flashes with whichever it triggered; neighbours by kind.
      clearTimeout(reactTimer.current)
      setReactGood([...(good.length ? [i] : []), ...good])
      setReactBad([...(good.length === 0 && bad.length ? [i] : []), ...bad])
      reactTimer.current = setTimeout(() => {
        setReactGood([])
        setReactBad([])
      }, 600)
      discover(found)
    }

    const score = scoreGrid(next)
    setHarmony(score)

    // A full city pays out if harmonious enough; an outcome message shows over
    // the grid, then the plan starts over.
    if (next.every((c) => c !== null)) {
      const success = score >= HARMONY_GOAL
      if (success) {
        complete(mult)
        setThriving((c) => c + 1)
        setBloomCell(i)
        clearTimeout(bloomTimer.current)
        bloomTimer.current = setTimeout(() => setBloomCell(null), 520)
        // Super bonus: a flawless, very harmonious city awards the society pebble.
        if (score >= SUPER_GOAL && galetDef && !galetFound) announceGalet(galetDef)
      }
      setOutcome({ success, score, mult })
      clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => {
        setGrid(new Array(CELLS).fill(null))
        setHarmony(0)
        setOutcome(null)
      }, 1900)
    }
  }

  const renderPair = ({ a, b, kind }: Pair) => {
    const known = discovered.has(pairKey(a, b))
    const outcome = kind === 'good' ? t('city.harmony') : t('city.discord')
    const label = known
      ? `${t(`city.${BUILDINGS[a]!.key}` as TranslationKey)} + ${t(`city.${BUILDINGS[b]!.key}` as TranslationKey)} = ${outcome}`
      : t('city.locked')
    return (
      <li
        key={pairKey(a, b)}
        aria-label={label}
        className={`flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1.5 ${
          known ? 'border-border bg-bg/50' : 'border-dashed border-border/50'
        }`}
      >
        {known ? (
          <>
            <Mark idx={a} />
            <span aria-hidden className="text-xs text-muted">
              +
            </span>
            <Mark idx={b} />
            <span aria-hidden className="text-xs text-muted">
              =
            </span>
            {kind === 'good' ? <HarmonyMark /> : <DiscordMark />}
          </>
        ) : (
          <span aria-hidden className="text-sm text-muted/60">
            ? + ? = ?
          </span>
        )}
      </li>
    )
  }

  const goodPairs = PAIRS.filter((p) => p.kind === 'good')
  const badPairs = PAIRS.filter((p) => p.kind === 'bad')

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <span className="text-base font-semibold text-fg">{verb}</span>

      <div className="grid w-full max-w-4xl gap-3 md:grid-cols-[1fr_20rem] md:items-start">
        <div
          role="radiogroup"
          aria-label={verb}
          className="flex w-full flex-nowrap justify-center gap-1.5 md:col-start-1 md:row-start-1"
        >
          {BUILDINGS.map((b, i) => {
            const left = PER_TYPE_LIMIT - typeCount(grid, i)
            return (
              <button
                key={b.key}
                type="button"
                role="radio"
                aria-checked={selected === i}
                disabled={left <= 0}
                onClick={() => setSelected(i)}
                className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border bg-surface/90 px-2 py-1.5 text-sm transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 ${
                  selected === i
                    ? 'border-accent text-accent'
                    : 'border-border text-muted hover:text-fg'
                }`}
              >
                <Mark idx={i} className="h-3.5 w-3.5" />
                {t(`city.${b.key}` as TranslationKey)}
                <span className="tabular-nums text-muted">{left}</span>
              </button>
            )
          })}
        </div>

        <div
          role="group"
          aria-label={verb}
          className="relative grid w-full gap-1 rounded-lg border border-border bg-surface/80 p-2 md:col-start-1 md:row-start-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {outcome ? (
            <div className="modal-in absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-bg/85 p-4 text-center">
              <div className="flex flex-col gap-1">
                <span
                  className={`text-base font-bold ${outcome.success ? 'text-accent' : 'text-red-400'}`}
                >
                  {t(outcome.success ? 'city.success.title' : 'city.fail.title')}
                </span>
                <span className="text-sm text-muted">
                  {t(outcome.success ? 'city.success.body' : 'city.fail.body')
                    .replace('{score}', String(outcome.score))
                    .replace('{goal}', String(HARMONY_GOAL))
                    .replace('{mult}', String(outcome.mult))}
                </span>
              </div>
            </div>
          ) : null}
          {grid.map((type, i) => {
            const b = type === null ? null : BUILDINGS[type]!
            return (
              <button
                key={i}
                type="button"
                onClick={() => place(i)}
                disabled={b !== null}
                aria-label={b ? t(`city.${b.key}` as TranslationKey) : t('city.empty')}
                className={`group relative flex aspect-square items-center justify-center rounded-sm border transition select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
                  b ? 'border-border' : 'border-border/40 bg-bg/50 hover:bg-secondary/20'
                } ${bloomCell === i ? 'bloom' : ''} ${reactGood.includes(i) ? 'harmony-react' : ''} ${
                  reactBad.includes(i) ? 'discord-react' : ''
                }`}
                style={b ? { backgroundColor: b.tint } : undefined}
              >
                {b ? (
                  <svg viewBox="0 0 16 16" className="h-3/5 w-3/5" aria-hidden>
                    <b.glyph className="fill-bg" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 16 16"
                    className="h-3/5 w-3/5 text-muted opacity-0 transition-opacity group-hover:opacity-50"
                    aria-hidden
                  >
                    {BUILDINGS[selected]!.glyph({ className: 'fill-current' })}
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        <span className="flex items-center justify-center gap-1.5 whitespace-pre-line text-center text-xs text-muted md:col-start-2 md:row-start-1">
          {t('city.hint')}
          <WidgetGalet />
        </span>

        <aside
          aria-label={t('city.sidebar')}
          className="flex w-full flex-col gap-3 md:col-start-2 md:row-start-2 md:self-stretch"
        >
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface/80 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <HarmonyMark className="h-3.5 w-3.5" />
                {t('city.harmony')}
              </span>
              <span className="text-xs tabular-nums text-fg">
                {harmony} / {HARMONY_GOAL}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={t('city.harmony')}
              aria-valuemin={0}
              aria-valuemax={HARMONY_GOAL}
              aria-valuenow={Math.max(0, Math.min(harmony, HARMONY_GOAL))}
              className="h-2 overflow-hidden rounded-full bg-bg/50"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${Math.max(0, Math.min(harmony / HARMONY_GOAL, 1)) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted">
              {t('city.thriving')} : <span className="tabular-nums text-fg">{thriving}</span>{' '}
              <span className="tabular-nums text-accent">
                {`(×${Math.min(1 + thriving, MAX_THRIVE_MULT)}${
                  1 + thriving >= MAX_THRIVE_MULT ? ` ${t('city.max')}` : ''
                })`}
              </span>
            </span>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-3 rounded-lg border border-border bg-surface/80 p-3">
            <div className="flex flex-col gap-2">
              <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted">
                {t('city.alliances')}
              </span>
              <ul className="flex flex-col gap-1.5">{goodPairs.map(renderPair)}</ul>
            </div>
            <div className="flex flex-col gap-2">
              <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted">
                {t('city.clashes')}
              </span>
              <ul className="flex flex-col gap-1.5">{badPairs.map(renderPair)}</ul>

              <div
                aria-label={
                  galetFound && galetDef ? t(galetDef.nameKey as TranslationKey) : t('city.mystery')
                }
                className={`mt-1 flex flex-col items-center gap-1 rounded-md border p-2 ${
                  galetFound ? 'border-border bg-bg/50' : 'border-dashed border-border/50'
                }`}
              >
                {galetFound && galetDef ? (
                  <Galet
                    color={galetDef.color}
                    motif={galetDef.motif}
                    shape={galetDef.shape}
                    size={34}
                  />
                ) : (
                  <span aria-hidden className="text-lg leading-none text-muted/60">
                    ?
                  </span>
                )}
                <span
                  aria-hidden
                  className="text-center text-[10px] uppercase tracking-wide text-muted"
                >
                  {galetFound && galetDef
                    ? `${t(galetDef.nameKey as TranslationKey)} ${t('city.found')}`
                    : t('city.mystery')}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
