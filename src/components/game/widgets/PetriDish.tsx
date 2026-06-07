import { useEffect, useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

const GRID = 7
const CELLS = GRID * GRID
/** Live cells that trigger a harvest (microbe produced, dish thinned out). */
const HARVEST = 16
/** Cells kept after a harvest (so growth continues). */
const KEEP = 6
const STEP_MS = 1500

const emptyDish = () => new Array<boolean>(CELLS).fill(false)

function liveNeighbors(cells: boolean[], i: number): number {
  const r = Math.floor(i / GRID)
  const c = i % GRID
  let n = 0
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const rr = r + dr
      const cc = c + dc
      if (rr >= 0 && rr < GRID && cc >= 0 && cc < GRID && cells[rr * GRID + cc]) n++
    }
  return n
}

/** One culture step: spread into gaps, die from isolation OR overcrowding. */
function step(cells: boolean[]): boolean[] {
  return cells.map((alive, i) => {
    const n = liveNeighbors(cells, i)
    if (alive) return n >= 2 && n <= 3
    return n === 3
  })
}

const count = (cells: boolean[]) => cells.reduce((s, c) => s + (c ? 1 : 0), 0)

/**
 * Era 6 (First life): a Petri dish. Click an empty cell to divide life into it
 * (+1 cell); click a live cell to prune it. The culture also spreads on its own
 * and dies where it gets too crowded. When the dish fills, you harvest a microbe
 * (free) and thin it out. A living spatial sim - cultivation, not just clicks.
 */
export function PetriDish({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const [cells, setCells] = useState<boolean[]>(emptyDish)
  const [bloom, setBloom] = useState(0)
  const cellsRef = useRef(cells)

  const commit = (next: boolean[]) => {
    cellsRef.current = next
    setCells(next)
  }

  // Harvest when the dish is dense: produce a microbe, keep only a few seeds.
  const maybeHarvest = (arr: boolean[]): boolean[] => {
    if (count(arr) < HARVEST) return arr
    complete()
    setBloom((b) => b + 1)
    const live = arr.flatMap((a, i) => (a ? [i] : []))
    const keep = new Set<number>()
    while (keep.size < KEEP && keep.size < live.length)
      keep.add(live[Math.floor(Math.random() * live.length)])
    const next = emptyDish()
    keep.forEach((i) => (next[i] = true))
    return next
  }

  // Gentle autonomous culture step.
  useEffect(() => {
    const id = window.setInterval(() => commit(maybeHarvest(step(cellsRef.current))), STEP_MS)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = (i: number) => {
    const next = [...cellsRef.current]
    if (next[i]) {
      next[i] = false // prune
      commit(next)
    } else {
      next[i] = true // divide here
      gainBase()
      commit(maybeHarvest(next))
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="group"
        aria-label={verb}
        className="grid aspect-square w-60 gap-1 rounded-full border border-border bg-surface/40 p-4"
        style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
      >
        {cells.map((alive, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            aria-label={t('petri.cell')}
            aria-pressed={alive}
            className={`aspect-square rounded-full transition select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
              alive ? `bg-accent ${bloom ? 'bloom' : ''}` : 'bg-bg/40 hover:bg-secondary/30'
            }`}
          />
        ))}
      </div>
      <span className="text-base font-semibold text-fg">{verb}</span>
      <span className="text-xs text-muted">{t('petri.hint')}</span>
    </div>
  )
}
