import { useEffect, useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { WidgetHint } from './WidgetHint'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

/** Depth of a complete tree of life (the tip column). */
const MAX_LEVEL = 7
/** Soft cap on the pre-generated tree size (keeps it drawable). */
const NODE_BUDGET = 28
/** How often a branch leaps straight to the tip column rather than one step. */
const JUMP_CHANCE = 0.35
/** A complete tree never has fewer terminal species than this. */
const MIN_LEAVES = 8
/** Vertical band (viewBox units) the tree occupies: root at TOP_Y (a stub above
 *  links to the parent tree), leaves all at BOTTOM_Y. */
const TOP_Y = 14
const BOTTOM_Y = 70
const ROW_H = (BOTTOM_Y - TOP_Y) / MAX_LEVEL

interface TreeNode {
  parent: number
  depth: number
}

const kids = (nodes: TreeNode[], i: number) => nodes.flatMap((n, j) => (n.parent === i ? [j] : []))

/**
 * Pre-generate the WHOLE tree up front (structure + each branch's random target
 * depth), so the layout is fixed from the start and never reflows. Every node
 * below MAX_LEVEL gets 2 (66%) or 3 (33%) children, each advancing a random
 * number of levels (sometimes straight to the tip column); a node budget forces
 * the deepest ones to terminate so the tree stays a reasonable size.
 */
function buildTree(): TreeNode[] {
  const nodes: TreeNode[] = [{ parent: -1, depth: 0 }]
  const queue = [0]
  while (queue.length > 0) {
    const i = queue.shift() as number
    const d = nodes[i]!.depth
    if (d >= MAX_LEVEL) continue
    const remaining = MAX_LEVEL - d
    const n = Math.random() < 1 / 3 ? 3 : 2
    for (let k = 0; k < n; k++) {
      const jump = nodes.length >= NODE_BUDGET || Math.random() < JUMP_CHANCE
      const advance = jump ? remaining : 1 + Math.floor(Math.random() * remaining)
      const id = nodes.length
      const depth = d + advance
      nodes.push({ parent: i, depth })
      if (depth < MAX_LEVEL) queue.push(id)
    }
  }
  return nodes
}

const leafCount = (nodes: TreeNode[]) => nodes.filter((_, i) => kids(nodes, i).length === 0).length

/** Build a tree, retrying until it has at least MIN_LEAVES terminal species. */
function generateTree(): TreeNode[] {
  let tree = buildTree()
  for (let attempt = 0; attempt < 60 && leafCount(tree) < MIN_LEAVES; attempt++) {
    tree = buildTree()
  }
  return tree
}

/** Layered layout: leaves spread evenly, internal nodes centred over children. */
function layout(nodes: TreeNode[]): { x: number; y: number }[] {
  const order: number[] = []
  const visit = (i: number) => {
    const ch = kids(nodes, i)
    if (!ch.length) order.push(i)
    else ch.forEach(visit)
  }
  visit(0)
  const x = new Array<number>(nodes.length).fill(0)
  order.forEach((id, k) => (x[id] = ((k + 1) / (order.length + 1)) * 200))
  const setX = (i: number) => {
    const ch = kids(nodes, i)
    if (ch.length) {
      ch.forEach(setX)
      // Median (not mean): a 3-way split's middle child sits exactly under the
      // node, so the trunk stays a continuous vertical with the incoming branch.
      const xs = ch.map((c) => x[c]!).sort((a, b) => a - b)
      const m = xs.length
      x[i] = m % 2 === 1 ? xs[(m - 1) / 2]! : (xs[m / 2 - 1]! + xs[m / 2]!) / 2
    }
  }
  setX(0)
  return nodes.map((n, i) => ({ x: x[i]!, y: TOP_Y + n.depth * ROW_H }))
}

/**
 * Era 10 (Conquest of land): the tree of life. The full tree is pre-generated so
 * it never reflows; you start at the root and click a living tip to make it
 * advance and split into 2-3 branches (each leaping a random number of levels,
 * some straight to the tip column). Lead EVERY lineage to the tip column to
 * complete the tree (a free fauna), then a new tree begins. A persistent
 * structure, full-width. Extinction wipes it for a rebound (refined later).
 */
export function TreeOfLife({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const [nodes, setNodes] = useState<TreeNode[]>(generateTree)
  const [revealed, setRevealed] = useState<boolean[]>(() => nodes.map((_, i) => i === 0))
  // grow: clicking tips reveals branches. choose: the tree is complete, pick a
  // final leaf. slide: the whole tree glides so the chosen leaf reaches the start.
  const [phase, setPhase] = useState<'grow' | 'choose' | 'slide'>('grow')
  const [slide, setSlide] = useState({ dx: 0, dy: 0 })
  // The chosen final leaf during the slide (it turns from blue to yellow).
  const [chosen, setChosen] = useState<number | null>(null)
  const slideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (slideTimer.current) clearTimeout(slideTimer.current)
    },
    [],
  )

  const pos = layout(nodes)

  const expandable = (i: number) =>
    revealed[i] && nodes[i]!.depth < MAX_LEVEL && !kids(nodes, i).some((c) => revealed[c])

  const newTree = (tree?: TreeNode[]) => {
    const fresh = tree ?? generateTree()
    setNodes(fresh)
    setRevealed(fresh.map((_, i) => i === 0))
    setSlide({ dx: 0, dy: 0 })
    setChosen(null)
    setPhase('grow')
  }

  const reveal = (i: number) => {
    if (phase !== 'grow' || !expandable(i)) return
    const next = revealed.slice()
    kids(nodes, i).forEach((c) => (next[c] = true))
    setRevealed(next)
    gainBase()
    // Tree complete once no revealed tip can grow further (all reached the tip).
    const stillGrowing = nodes.some(
      (n, j) => next[j] && n.depth < MAX_LEVEL && !kids(nodes, j).some((c) => next[c]),
    )
    if (!stillGrowing) {
      complete() // the tree of life flourishes: a fauna radiates
      setPhase('choose') // now pick the lineage that seeds the next tree
    }
  }

  // Pick a final leaf: pre-generate the next tree so we know exactly where its
  // root will sit, slide the whole tree so the chosen leaf lands precisely there
  // (no jump), then swap to the next tree - that leaf becomes its root.
  const chooseLeaf = (i: number) => {
    if (phase !== 'choose' || nodes[i]!.depth < MAX_LEVEL) return
    const next = generateTree()
    const nextRoot = layout(next)[0]!
    setChosen(i)
    setSlide({ dx: nextRoot.x - pos[i]!.x, dy: nextRoot.y - pos[i]!.y })
    setPhase('slide')
    slideTimer.current = setTimeout(() => newTree(next), 650)
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className="text-base font-semibold text-fg">{verb}</span>
      <svg
        viewBox="0 0 200 78"
        className="h-72 w-full max-w-5xl overflow-visible"
        role="group"
        aria-label={verb}
      >
        {/* The whole tree slides as one when a lineage is chosen. */}
        <g
          style={{
            transform: `translate(${slide.dx}px, ${slide.dy}px)`,
            transition: phase === 'slide' ? 'transform 0.6s ease-in-out' : 'none',
          }}
        >
          {/* Stub above the root: the lineage rises from the parent tree (the
              previous one it sprouted from), fading off the top. */}
          <line
            x1={pos[0]!.x}
            y1={2}
            x2={pos[0]!.x}
            y2={pos[0]!.y}
            stroke="var(--color-muted)"
            strokeWidth="1.4"
            strokeDasharray="2 3"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Branches: rectangular dendrogram. From the parent, a horizontal at
              the parent's level reaches the child's column, then a straight
              vertical drops to the child (one elbow, at the parent's level). */}
          {nodes.map((n, i) => {
            if (n.parent === -1 || !revealed[i]) return null
            return (
              <path
                key={`e${i}`}
                className="branch-grow"
                pathLength={1}
                d={`M ${pos[n.parent]!.x} ${pos[n.parent]!.y} H ${pos[i]!.x} V ${pos[i]!.y}`}
                fill="none"
                stroke="var(--color-muted)"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          })}
          {/* Nodes: living tips (accent), terminal species (blue), internal joints
              hidden. Final leaves stay blue when choosing; the chosen one turns
              yellow progressively as the tree slides. */}
          {nodes.map((n, i) => {
            if (!revealed[i]) return null
            const tip = expandable(i)
            const terminal = n.depth >= MAX_LEVEL
            // Internal joints show no dot: only the branches and the tip/leaf points.
            if (!tip && !terminal) return null
            const choosable = phase === 'choose' && terminal
            const isChosen = chosen === i // turning yellow during the slide
            const clickable = tip || choosable
            return (
              <g
                key={`n${i}`}
                className={`branch-tip ${choosable ? 'widget-pulse' : ''} ${clickable ? 'group' : ''}`}
              >
                <circle
                  cx={pos[i]!.x}
                  cy={pos[i]!.y}
                  r={choosable || isChosen ? 3.6 : tip || terminal ? 3 : 2}
                  fill={
                    tip || isChosen
                      ? 'var(--color-accent)'
                      : terminal
                        ? 'var(--color-secondary)'
                        : 'var(--color-muted)'
                  }
                  opacity={tip || terminal ? 1 : 0.6}
                  // On completion, the tips blink once left to right (delay by x):
                  // a clear "the tree is complete, choose a clade" signal.
                  className={`group-hover:brightness-125 ${choosable ? 'tree-signal' : ''}`}
                  style={{
                    transition: 'fill 0.6s ease, filter 0.15s ease',
                    ...(choosable ? { animationDelay: `${(pos[i]!.x / 200) * 0.6}s` } : {}),
                  }}
                />
                {clickable ? (
                  <circle
                    cx={pos[i]!.x}
                    cy={pos[i]!.y}
                    r="5"
                    fill="transparent"
                    role="button"
                    tabIndex={0}
                    aria-label={tip ? t('tree.branch') : t('tree.chooseLineage')}
                    onClick={() => (tip ? reveal(i) : chooseLeaf(i))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        if (tip) reveal(i)
                        else chooseLeaf(i)
                      }
                    }}
                    className="cursor-pointer outline-none transition hover:stroke-accent focus-visible:stroke-accent"
                    strokeWidth="2"
                  />
                ) : null}
              </g>
            )
          })}
        </g>
      </svg>
      <WidgetHint>{phase === 'choose' ? t('tree.choose') : t('tree.hint')}</WidgetHint>
    </div>
  )
}
