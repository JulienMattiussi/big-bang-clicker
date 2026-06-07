import type { ReactElement } from 'react'

/**
 * Ambient scene background, rendered behind the whole UI. It changes by ERA
 * GROUP (finer than the colour tier): primordial gas, then a starfield, then
 * cells, an organic sea, a civilisation web, a galactic field, and finally the
 * collapsing singularity. It harmonises with the active tier theme (it uses the
 * semantic colour tokens), so the radical recolours at era 5 (life) and era 11
 * (civilisation) carry the scene with them. Decorative only: aria-hidden, no
 * pointer events, slow and sober, disabled under prefers-reduced-motion.
 *
 * SVG transforms are limited to scale/opacity/rotate (reliable across browsers);
 * any translate-based motion lives on HTML wrappers.
 */

type Scene = 'plasma' | 'stars' | 'cells' | 'sea' | 'civilization' | 'cosmos' | 'singularity'

function sceneFor(index: number): Scene {
  if (index <= 1) return 'plasma' // e0-e1: formless luminous gas
  if (index <= 4) return 'stars' // e2-e4: first stars, forges, accretion
  if (index <= 6) return 'cells' // e5-e6: building blocks, first life
  if (index <= 10) return 'sea' // e7-e10: oxygen, eukaryotes, animals, land
  if (index <= 14) return 'civilization' // e11-e14: minds, cities, nations, tech
  if (index <= 18) return 'cosmos' // e15-e18: space, galaxies, universe-city
  return 'singularity' // e19: collapse / rebirth
}

/** Deterministic PRNG (no Math.random in render; stable layout across renders). */
function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rs = mulberry32(101)
const STARS = Array.from({ length: 150 }, () => ({
  x: rs() * 100,
  y: rs() * 100,
  r: 0.15 + rs() * 0.29,
  delay: rs() * 5,
  dur: 3 + rs() * 4,
}))

const rc = mulberry32(202)
const CELLS = Array.from({ length: 8 }, () => ({
  x: 10 + rc() * 80,
  y: 12 + rc() * 76,
  rx: 7 + rc() * 8,
  ry: 5 + rc() * 6,
  rot: rc() * 180,
}))

const rb = mulberry32(303)
const BUBBLES = Array.from({ length: 18 }, () => ({
  x: rb() * 100,
  size: 4 + rb() * 12,
  delay: rb() * 9,
  dur: 7 + rb() * 6,
}))

const rn = mulberry32(404)
const NODES = Array.from({ length: 16 }, () => ({ x: 6 + rn() * 88, y: 8 + rn() * 84 }))
const NET_EDGES: [number, number][] = []
NODES.forEach((n, i) => {
  const near = NODES.map((m, j) => ({ j, d: Math.hypot(n.x - m.x, n.y - m.y) }))
    .filter((o) => o.j !== i)
    .sort((a, b) => a.d - b.d)
  for (const o of near.slice(0, 2)) if (i < o.j) NET_EDGES.push([i, o.j])
})

/** Shared gradients/filters for the SVG scenes. */
function Defs(): ReactElement {
  return (
    <defs>
      <radialGradient id="sb-accent" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.55" />
        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="sb-secondary" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.5" />
        <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="sb-core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--color-fg)" stopOpacity="0.5" />
        <stop offset="60%" stopColor="var(--color-accent)" stopOpacity="0.25" />
        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
      </radialGradient>
      <filter id="sb-blur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3.5" />
      </filter>
    </defs>
  )
}

const svgClass = 'absolute inset-0 h-full w-full'
const svgProps = { viewBox: '0 0 100 100', preserveAspectRatio: 'xMidYMid slice' } as const

function PlasmaScene(): ReactElement {
  return (
    <div className="bg-drift absolute inset-0">
      <svg className={svgClass} {...svgProps}>
        <Defs />
        <g filter="url(#sb-blur)">
          <circle cx="30" cy="34" r="36" fill="url(#sb-accent)" className="bg-breathe" />
          <circle
            cx="72"
            cy="62"
            r="42"
            fill="url(#sb-secondary)"
            className="bg-breathe"
            style={{ animationDelay: '-3s' }}
          />
          <circle
            cx="58"
            cy="26"
            r="26"
            fill="url(#sb-accent)"
            className="bg-breathe"
            style={{ animationDelay: '-6s' }}
          />
          <circle
            cx="20"
            cy="74"
            r="30"
            fill="url(#sb-secondary)"
            className="bg-breathe"
            style={{ animationDelay: '-4.5s' }}
          />
        </g>
      </svg>
    </div>
  )
}

function StarsScene(): ReactElement {
  return (
    <svg className={svgClass} {...svgProps}>
      <defs>
        {/* Tiny bright core fading to a soft halo on the near periphery. */}
        <radialGradient id="sb-star" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-fg)" stopOpacity="0.9" />
          <stop offset="30%" stopColor="var(--color-fg)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-fg)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Small diffuse points (a bright core with a soft glow), easy on the eyes. */}
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="url(#sb-star)"
          className="bg-twinkle"
          style={{ animationDelay: `-${s.delay}s`, animationDuration: `${s.dur}s` }}
        />
      ))}
    </svg>
  )
}

function CellsScene(): ReactElement {
  return (
    <div className="bg-sway absolute inset-0">
      <svg className={svgClass} {...svgProps}>
        <Defs />
        {CELLS.map((c, i) => (
          <g key={i} transform={`rotate(${c.rot} ${c.x} ${c.y})`}>
            <ellipse
              cx={c.x}
              cy={c.y}
              rx={c.rx}
              ry={c.ry}
              fill="var(--color-accent)"
              fillOpacity="0.1"
              stroke="var(--color-accent)"
              strokeOpacity="0.3"
              strokeWidth="0.4"
            />
            <circle cx={c.x} cy={c.y} r={c.ry * 0.4} fill="var(--color-accent)" opacity="0.28" />
          </g>
        ))}
      </svg>
    </div>
  )
}

function SeaScene(): ReactElement {
  return (
    <div className="absolute inset-0">
      <div className="bg-sway absolute inset-0">
        <svg className={svgClass} {...svgProps}>
          <Defs />
          <circle
            cx="50"
            cy="60"
            r="46"
            fill="url(#sb-secondary)"
            opacity="0.2"
            className="bg-breathe"
          />
          {/* Fronds swaying near the seabed. */}
          <g
            stroke="var(--color-accent)"
            strokeOpacity="0.3"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
          >
            <path d="M14 101 Q18 80 13 64" />
            <path d="M24 101 Q20 84 26 70" />
            <path d="M80 101 Q84 82 78 66" />
            <path d="M90 101 Q86 86 92 72" />
          </g>
        </svg>
      </div>
      {/* Rising bubbles (HTML so the upward translate is reliable). */}
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="bg-rise absolute bottom-0 rounded-full"
          style={{
            left: `${b.x}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            backgroundColor: 'var(--color-secondary)',
            opacity: 0.25,
            animationDelay: `-${b.delay}s`,
            animationDuration: `${b.dur}s`,
          }}
        />
      ))}
    </div>
  )
}

function CivilizationScene(): ReactElement {
  return (
    <svg className={svgClass} {...svgProps}>
      <Defs />
      <g stroke="var(--color-accent)" strokeOpacity="0.18" strokeWidth="0.4">
        {NET_EDGES.map(([a, b], i) => (
          <line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} />
        ))}
      </g>
      {NODES.map((n, i) => (
        <circle
          key={i}
          cx={n.x}
          cy={n.y}
          r="1.6"
          fill="var(--color-accent)"
          className="bg-pulse"
          style={{ animationDelay: `-${(i % 6) * 1.1}s` }}
        />
      ))}
    </svg>
  )
}

function CosmosScene(): ReactElement {
  return (
    <svg className={svgClass} {...svgProps}>
      <Defs />
      {/* A faint spiral galaxy. */}
      <g className="bg-breathe" style={{ transformOrigin: 'center' }}>
        <g transform="rotate(20 50 48)">
          <ellipse cx="50" cy="48" rx="38" ry="12" fill="url(#sb-secondary)" opacity="0.4" />
          <ellipse cx="50" cy="48" rx="22" ry="8" fill="url(#sb-core)" opacity="0.6" />
        </g>
      </g>
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r * 0.85}
          fill="var(--color-fg)"
          className="bg-twinkle"
          style={{ animationDelay: `-${s.delay}s`, animationDuration: `${s.dur}s` }}
        />
      ))}
    </svg>
  )
}

function SingularityScene(): ReactElement {
  return (
    <svg className={svgClass} {...svgProps}>
      <Defs />
      {/* Lines converging on the core (contraction). */}
      <g stroke="var(--color-accent)" strokeOpacity="0.18" strokeWidth="0.4">
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2
          return (
            <line key={i} x1={50 + Math.cos(a) * 60} y1={50 + Math.sin(a) * 60} x2="50" y2="50" />
          )
        })}
      </g>
      <circle cx="50" cy="50" r="26" fill="url(#sb-core)" className="bg-pulse" />
      <circle
        cx="50"
        cy="50"
        r="6"
        fill="var(--color-fg)"
        opacity="0.5"
        className="bg-pulse"
        style={{ animationDelay: '-2s' }}
      />
    </svg>
  )
}

const SCENES: Record<Scene, () => ReactElement> = {
  plasma: PlasmaScene,
  stars: StarsScene,
  cells: CellsScene,
  sea: SeaScene,
  civilization: CivilizationScene,
  cosmos: CosmosScene,
  singularity: SingularityScene,
}

export function SceneBackground({ eraIndex }: { eraIndex: number }): ReactElement {
  const scene = sceneFor(eraIndex)
  const Scene = SCENES[scene]
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg transition-colors duration-700"
    >
      {/* Keyed so switching era groups fades the new scene in. */}
      <div key={scene} className="bg-scene absolute inset-0">
        <Scene />
      </div>
    </div>
  )
}
