import { useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

const MAX_NODES = 31
const MAX_DEPTH = 5
/** Branches grown between two spontaneous fauna blooms. */
const BRANCH_PER_FAUNA = 3

const childrenOf = (parent: number[], i: number) => parent.flatMap((p, j) => (p === i ? [j] : []))

function depthOf(parent: number[], i: number): number {
  let d = 0
  let cur = i
  while (parent[cur] !== -1) {
    cur = parent[cur]
    d++
  }
  return d
}

/** Layered layout: leaves spread evenly, internal nodes centred over children. */
function layout(parent: number[]): { x: number; y: number }[] {
  const order: number[] = []
  const visit = (i: number) => {
    const ch = childrenOf(parent, i)
    if (!ch.length) order.push(i)
    else ch.forEach(visit)
  }
  visit(0)
  const x = new Array<number>(parent.length).fill(0)
  order.forEach((id, k) => (x[id] = ((k + 1) / (order.length + 1)) * 100))
  const setX = (i: number) => {
    const ch = childrenOf(parent, i)
    if (ch.length) {
      ch.forEach(setX)
      x[i] = ch.reduce((s, c) => s + x[c], 0) / ch.length
    }
  }
  setX(0)
  let maxD = 0
  for (let i = 0; i < parent.length; i++) maxD = Math.max(maxD, depthOf(parent, i))
  const rowH = maxD > 0 ? Math.min(13, 52 / maxD) : 0
  return parent.map((_, i) => ({ x: x[i], y: 8 + depthOf(parent, i) * rowH }))
}

/**
 * Era 10 (Conquest of land): the tree of life. Click a living tip to branch it
 * (+1 flora); branches keep producing and periodically a new lineage blooms into
 * fauna (free). Trigger an extinction and most of the tree is pruned - but a
 * surviving branch rebounds with a burst of diversity. A persistent structure
 * coupled to crises, unlike anything earlier. Full-width.
 */
export function TreeOfLife({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const [parent, setParent] = useState<number[]>([-1])
  const [survivor, setSurvivor] = useState<number | null>(null)
  const branchesRef = useRef(0)

  const pos = layout(parent)

  const branch = (i: number) => {
    if (childrenOf(parent, i).length > 0) return // not a tip
    if (parent.length + 2 > MAX_NODES || depthOf(parent, i) + 1 > MAX_DEPTH) {
      complete() // the canopy is full: this tip flowers into fauna
      return
    }
    setParent((p) => [...p, i, i])
    gainBase()
    branchesRef.current += 1
    if (branchesRef.current % BRANCH_PER_FAUNA === 0) complete()
  }

  const extinction = () => {
    const leaves = parent.flatMap((_, i) => (childrenOf(parent, i).length ? [] : [i]))
    if (leaves.length === 0) return
    const lucky = leaves[Math.floor(Math.random() * leaves.length)]
    // Keep only the path from the root to the surviving lineage.
    const keep = new Set<number>()
    let cur = lucky
    while (cur !== -1) {
      keep.add(cur)
      cur = parent[cur]
    }
    const kept = [...keep].sort((a, b) => a - b)
    const remap = new Map(kept.map((id, idx) => [id, idx]))
    const next = kept.map((id) => (parent[id] === -1 ? -1 : remap.get(parent[id])!))
    setParent(next)
    setSurvivor(remap.get(lucky) ?? null)
    branchesRef.current = 0
    complete() // rebound: the survivor radiates into new diversity
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className="text-base font-semibold text-fg">{verb}</span>
      <svg
        viewBox="0 0 100 64"
        className="h-56 w-full max-w-3xl overflow-visible"
        role="group"
        aria-label={verb}
      >
        {/* Branches (edges). */}
        {parent.map((p, i) =>
          p === -1 ? null : (
            <line
              key={`e${i}`}
              x1={pos[p].x}
              y1={pos[p].y}
              x2={pos[i].x}
              y2={pos[i].y}
              stroke="var(--color-border)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          ),
        )}
        {/* Nodes: tips are clickable buttons; internal nodes are dimmer joints. */}
        {parent.map((_, i) => {
          const isTip = childrenOf(parent, i).length === 0
          return (
            <g key={`n${i}`} className={survivor === i ? 'bloom' : undefined}>
              <circle
                cx={pos[i].x}
                cy={pos[i].y}
                r={isTip ? 3 : 2}
                fill={isTip ? 'var(--color-accent)' : 'var(--color-muted)'}
                opacity={isTip ? 1 : 0.6}
              />
              {isTip ? (
                <circle
                  cx={pos[i].x}
                  cy={pos[i].y}
                  r="5"
                  fill="transparent"
                  role="button"
                  tabIndex={0}
                  aria-label={t('tree.branch')}
                  onClick={() => branch(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      branch(i)
                    }
                  }}
                  className="cursor-pointer outline-none focus-visible:stroke-accent"
                  strokeWidth="2"
                />
              ) : null}
            </g>
          )
        })}
      </svg>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={extinction}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted transition select-none hover:border-accent hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
        >
          {t('tree.extinction')}
        </button>
        <span className="text-xs text-muted">{t('tree.hint')}</span>
      </div>
    </div>
  )
}
