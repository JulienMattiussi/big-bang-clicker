import type { ReactElement } from 'react'

const FLAME = '#f59e0b'
const FLAME_CORE = '#fde68a'

// A wheel of districts (echoing the unification wheel) wired to a core. Fire
// spreads along the perfect links; nodes 0/2/4 are ablaze and the centre collapses.
const CX = 120
const CY = 70
const NODES = [0, 1, 2, 3, 4, 5].map((i) => {
  const a = (i / 6) * Math.PI * 2
  return { i, x: CX + 82 * Math.cos(a), y: CY + 44 * Math.sin(a) }
})
const RING: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 0],
]
const BURNING = new Set([0, 2, 4])

/**
 * Chain-reaction illustration (era-19 end of crisis): the perfectly interconnected
 * universe-city, its links carrying the blaze, collapsing toward a single point.
 * Decorative (aria-hidden). Drawn with the accent token (forced red by the danger
 * hero) plus amber flames.
 */
export function ChainReactionScene({
  className = 'h-28 w-auto',
}: {
  className?: string
}): ReactElement {
  const edgeColor = (burning: boolean) => (burning ? FLAME : 'var(--color-accent)')
  return (
    <svg viewBox="0 0 240 140" className={className} fill="none" aria-hidden>
      {/* Spokes to the core; those from a burning node carry the fire. */}
      {NODES.map((n) => (
        <line
          key={`s${n.i}`}
          x1={CX}
          y1={CY}
          x2={n.x}
          y2={n.y}
          stroke={edgeColor(BURNING.has(n.i))}
          strokeOpacity={BURNING.has(n.i) ? 0.8 : 0.35}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ))}
      {/* Ring links: every one touches a burning node, so the blaze runs the ring. */}
      {RING.map(([a, b]) => (
        <line
          key={`r${a}${b}`}
          x1={NODES[a]!.x}
          y1={NODES[a]!.y}
          x2={NODES[b]!.x}
          y2={NODES[b]!.y}
          stroke={FLAME}
          strokeOpacity="0.7"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ))}
      {/* District nodes; the burning ones wear a flame. */}
      {NODES.map((n) => (
        <g key={`n${n.i}`}>
          <circle cx={n.x} cy={n.y} r="4" fill="var(--color-accent)" opacity="0.85" />
          {BURNING.has(n.i) ? (
            <path
              d={`M${n.x} ${n.y - 11} C ${n.x + 5} ${n.y - 3} ${n.x + 4} ${n.y + 2} ${n.x} ${n.y + 3} C ${n.x - 4} ${n.y + 2} ${n.x - 5} ${n.y - 3} ${n.x} ${n.y - 11} Z`}
              fill={FLAME}
            />
          ) : null}
        </g>
      ))}
      {/* The core collapsing to a point. */}
      <ellipse cx={CX} cy={CY} rx="22" ry="22" fill={FLAME} opacity="0.16" />
      <circle cx={CX} cy={CY} r="6" fill={FLAME} />
      <circle cx={CX} cy={CY} r="2.5" fill={FLAME_CORE} />
    </svg>
  )
}
