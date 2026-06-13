import { useEffect, useRef, type ReactElement } from 'react'
import { Sauropod } from '@/components/layout/Sauropod'
import { useGameStore } from '@/store/gameStore'
import { isCrisisReady } from '@/lib/crises'

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

type Scene =
  | 'plasma'
  | 'stars'
  | 'cells'
  | 'sea'
  | 'land'
  | 'civilization'
  | 'cosmos'
  | 'singularity'

function sceneFor(index: number): Scene {
  if (index <= 1) return 'plasma' // e0-e1: formless luminous gas
  if (index <= 4) return 'stars' // e2-e4: first stars, forges, accretion
  if (index <= 6) return 'cells' // e5-e6: building blocks, first life
  if (index <= 9) return 'sea' // e7-e9: oxygen, eukaryotes, cambrian seas
  if (index === 10) return 'land' // e10: conquest of land (terrestrial)
  if (index <= 14) return 'civilization' // e11-e14: minds, cities, nations, tech (neuron field)
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
const CELLS = Array.from({ length: 26 }, () => {
  const rx = 1.5 + rc() * 2.3
  const ry = 1 + rc() * 1.6
  // Slight tint variation between cells: mostly accent with a touch of secondary.
  const mix = 62 + rc() * 33
  return {
    x: 6 + rc() * 88,
    y: 8 + rc() * 84,
    rx,
    ry,
    rot: rc() * 180,
    // Nucleus offset within the cell (not always centred), organic look.
    nx: (rc() - 0.5) * rx * 0.9,
    ny: (rc() - 0.5) * ry * 0.9,
    tint: `color-mix(in srgb, var(--color-accent) ${mix.toFixed(0)}%, var(--color-secondary))`,
    // Per-cell drift (Lissajous), desynchronised: amplitudes, frequencies, phases.
    ax: 1.5 + rc() * 3,
    ay: 1.5 + rc() * 3,
    fx: 0.05 + rc() * 0.12,
    fy: 0.05 + rc() * 0.12,
    phx: rc() * Math.PI * 2,
    phy: rc() * Math.PI * 2,
    rotSpeed: (rc() - 0.5) * 12,
  }
})

const rb = mulberry32(303)
const BUBBLES = Array.from({ length: 18 }, () => ({
  x: rb() * 100,
  size: 4 + rb() * 12,
  delay: rb() * 9,
  dur: 7 + rb() * 6,
}))

// Civilization tier (e11-e14): a neuron field. Built so it reads as real synapses:
// every fibre ROOTS in a neuron (dendrites radiate from a soma, axons link two
// somas), each dendrite ends in a synaptic bouton, and sparks sit ON the fibres
// (never floating). Generated deterministically (stable layout). See the comment
// blocks below for each part.
type Pt = [number, number]
const clampC = (v: number) => Math.max(-6, Math.min(106, v))
const rsy = mulberry32(606)
const synR = (a: number, b: number) => a + rsy() * (b - a)

/** A point at fraction `t` along a polyline (to drop a spark ON a fibre). */
function alongPolyline(pts: Pt[], t: number): Pt {
  const segs = pts.length - 1
  const f = Math.max(0, Math.min(0.999, t)) * segs
  const i = Math.floor(f)
  const u = f - i
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]
}

/** A FILLED ribbon around a centreline: each point carries its own half-width, so
 *  the fibre tapers and its thickness FLUCTUATES (organic, not a fixed-width stroke).
 *  Outline = down one offset side of the centreline, then back up the other. */
function ribbon(pts: Pt[], halfWidths: number[]): string {
  const n = pts.length
  if (n < 2) return ''
  const normal = (i: number): Pt => {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(n - 1, i + 1)]
    const nx = -(b[1] - a[1])
    const ny = b[0] - a[0]
    const len = Math.hypot(nx, ny) || 1
    return [nx / len, ny / len]
  }
  const L: Pt[] = []
  const R: Pt[] = []
  for (let i = 0; i < n; i++) {
    const [nx, ny] = normal(i)
    const h = halfWidths[i]
    L.push([pts[i][0] + nx * h, pts[i][1] + ny * h])
    R.push([pts[i][0] - nx * h, pts[i][1] - ny * h])
  }
  let d = `M ${L[0][0].toFixed(1)} ${L[0][1].toFixed(1)}`
  for (let i = 1; i < n; i++) d += ` L ${L[i][0].toFixed(1)} ${L[i][1].toFixed(1)}`
  for (let i = n - 1; i >= 0; i--) d += ` L ${R[i][0].toFixed(1)} ${R[i][1].toFixed(1)}`
  return d + ' Z'
}

/** An irregular blob outline (a neuron cell body, not a perfect disc). */
function blobPath(cx: number, cy: number, r: number): string {
  const n = 8
  const P: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const rr = r * (0.62 + rsy() * 0.7)
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]
  })
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const m0 = mid(P[n - 1], P[0])
  let d = `M ${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const m = mid(P[i], P[(i + 1) % n])
    d += ` Q ${P[i][0].toFixed(1)} ${P[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`
  }
  return d + ' Z'
}

interface SynFibre {
  d: string
  color: string
  o: number
  depth: number
}
interface SynDot {
  x: number
  y: number
  r: number
  delay: number
  dur: number
  depth: number
}
interface SynSoma {
  x: number
  y: number
  r: number
  delay: number
  depth: number
  blob: string
}

// Cell bodies on a jittered 3x3 grid, each at a random DEPTH (0 = far/blurred,
// 1 = near/sharp), drawn as an irregular blob (not a disc).
const SYN_SOMAS: SynSoma[] = Array.from({ length: 9 }, (_, i) => {
  const x = 16 + (i % 3) * 34 + synR(-10, 10)
  const y = 18 + Math.floor(i / 3) * 32 + synR(-9, 9)
  const depth = rsy()
  const r = 4 + depth * 5 // nearer neurons read bigger
  return { x, y, r, delay: synR(0, 6), depth, blob: blobPath(x, y, r) }
})

const SYN_FIBRES: SynFibre[] = []
const SYN_TERMINALS: SynDot[] = []
const SYN_SPARKS: SynDot[] = []
const spark = (p: Pt, depth: number) =>
  SYN_SPARKS.push({ x: p[0], y: p[1], r: 0.5 + depth, delay: synR(0, 5), dur: synR(2.4, 5), depth })

// Dendrites: each soma sprouts many wandering branches (a dendritic tree). The
// ribbon tapers from the soma (thick) to a fine tip, its thickness fluctuating.
SYN_SOMAS.forEach((s, si) => {
  const branches = 5 + Math.floor(rsy() * 4)
  for (let b = 0; b < branches; b++) {
    let ang = synR(0, Math.PI * 2)
    let x = s.x
    let y = s.y
    const pts: Pt[] = [[x, y]]
    const segs = 4 + Math.floor(rsy() * 4)
    for (let k = 0; k < segs; k++) {
      ang += synR(-0.9, 0.9) // sharper wander -> small organic curves
      const step = synR(4, 8)
      x = clampC(x + Math.cos(ang) * step)
      y = clampC(y + Math.sin(ang) * step)
      pts.push([x, y])
    }
    const root = 0.5 + s.depth * 0.7 // nearer dendrites thicker
    const hw = pts.map((_, k) => {
      const taper = 1 - k / (pts.length - 1) // 1 at soma -> 0 at tip
      return Math.max(0.06, root * (0.15 + 0.85 * taper) * synR(0.7, 1.25))
    })
    SYN_FIBRES.push({
      d: ribbon(pts, hw),
      color: si % 2 ? 'var(--color-secondary)' : 'var(--color-accent)',
      o: 0.2 + s.depth * 0.3,
      depth: s.depth,
    })
    SYN_TERMINALS.push({ x, y, r: 0.7 + s.depth * 0.7, delay: synR(0, 5), dur: 0, depth: s.depth })
    if (rsy() < 0.7) spark(alongPolyline(pts, synR(0.35, 0.85)), s.depth)
  }
})

// Axons: link each soma to its TWO nearest neighbours, sampled into a ribbon too.
// A denser web, no fibre dangling in the void.
const axonSeen = new Set<string>()
SYN_SOMAS.forEach((s, i) => {
  const nearest = SYN_SOMAS.map((o, j) => ({ j, dd: Math.hypot(s.x - o.x, s.y - o.y) }))
    .filter((o) => o.j !== i)
    .sort((a, b) => a.dd - b.dd)
    .slice(0, 2)
  for (const { j } of nearest) {
    const key = i < j ? `${i}-${j}` : `${j}-${i}`
    if (axonSeen.has(key)) continue
    axonSeen.add(key)
    const o = SYN_SOMAS[j]
    const cx = (s.x + o.x) / 2 + synR(-14, 14)
    const cy = (s.y + o.y) / 2 + synR(-14, 14)
    const depth = Math.max(s.depth, o.depth)
    // Sample the quadratic into points (B(t) = (1-t)^2 P0 + 2(1-t)t C + t^2 P1).
    const pts: Pt[] = Array.from({ length: 9 }, (_, k) => {
      const t = k / 8
      const u = 1 - t
      return [u * u * s.x + 2 * u * t * cx + t * t * o.x, u * u * s.y + 2 * u * t * cy + t * t * o.y]
    })
    const base = 0.22 + depth * 0.3
    const hw = pts.map(() => Math.max(0.08, base * synR(0.7, 1.25)))
    SYN_FIBRES.push({ d: ribbon(pts, hw), color: 'var(--color-accent)', o: 0.18 + depth * 0.26, depth })
    for (const t of [synR(0.3, 0.45), synR(0.55, 0.7)]) spark(alongPolyline(pts, t), depth)
  }
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
  const svgRef = useRef<SVGSVGElement>(null)
  // Each cell drifts on its own slow Lissajous path (desynchronised), driven by
  // rAF via the SVG transform attribute (reliable for translation). Disabled
  // under prefers-reduced-motion.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      const t = (now - start) / 1000
      const svg = svgRef.current
      for (let i = 0; i < CELLS.length; i++) {
        const c = CELLS[i]
        const x = c.x + c.ax * Math.sin(t * c.fx + c.phx)
        const y = c.y + c.ay * Math.cos(t * c.fy + c.phy)
        svg
          ?.querySelector(`[data-cell="${i}"]`)
          ?.setAttribute(
            'transform',
            `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(c.rot + t * c.rotSpeed).toFixed(1)})`,
          )
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <svg ref={svgRef} className={svgClass} {...svgProps}>
      <Defs />
      {CELLS.map((c, i) => (
        <g key={i} data-cell={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
          <ellipse
            cx={0}
            cy={0}
            rx={c.rx}
            ry={c.ry}
            fill={c.tint}
            fillOpacity="0.1"
            stroke={c.tint}
            strokeOpacity="0.3"
            strokeWidth="0.4"
          />
          <circle cx={c.nx} cy={c.ny} r={c.ry * 0.4} fill={c.tint} opacity="0.28" />
        </g>
      ))}
    </svg>
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

/** Deterministic [-amt, amt] jitter from a seed: gives each plant instance an
 *  organic asymmetry without runtime randomness (stable across renders). */
const jit = (seed: number, amt: number) => {
  const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return (v - Math.floor(v) - 0.5) * 2 * amt
}

/** A lycophyte (Lepidodendron, a Carboniferous "scale tree"): a tall trunk topped
 *  by a dichotomous (repeatedly forking) crown with leaf tufts. The period-correct
 *  giant of the first forests. `seed` makes each one lean and fork irregularly. */
function lycophyte(x: number, baseY: number, s: number, key: number, seed: number): ReactElement {
  const top = baseY - (21 + jit(seed, 2.5)) * s
  // Trunk stays straight; asymmetry lives in the forks and tips.
  const fl = { x: x - (4 + jit(seed + 1, 1.4)) * s, y: top - (6 + jit(seed + 2, 1.6)) * s }
  const fr = { x: x + (4 + jit(seed + 3, 1.4)) * s, y: top - (6 + jit(seed + 4, 1.6)) * s }
  const tips = [
    {
      x: fl.x - (3 + jit(seed + 5, 1.4)) * s,
      y: fl.y - (5 + jit(seed + 6, 1.3)) * s,
      tuft: jit(seed + 20, 0.8),
    },
    {
      x: fl.x + (1.6 + jit(seed + 7, 1.2)) * s,
      y: fl.y - (5 + jit(seed + 8, 1.3)) * s,
      tuft: jit(seed + 21, 0.8),
    },
    {
      x: fr.x - (1.6 + jit(seed + 9, 1.2)) * s,
      y: fr.y - (5 + jit(seed + 10, 1.3)) * s,
      tuft: jit(seed + 22, 0.8),
    },
    {
      x: fr.x + (3 + jit(seed + 11, 1.4)) * s,
      y: fr.y - (5 + jit(seed + 12, 1.3)) * s,
      tuft: jit(seed + 23, 0.8),
    },
  ]
  const forks = [
    { p: fl, tips: [tips[0], tips[1]] },
    { p: fr, tips: [tips[2], tips[3]] },
  ]
  return (
    // Opacity on the GROUP (composited once) so overlapping strokes don't stack
    // alpha and brighten the junctions.
    <g key={key} stroke="#5fa452" opacity="0.34" fill="none" strokeLinecap="round">
      <path d={`M${x} ${baseY} V ${top}`} strokeWidth={1.8 * s} />
      {/* The first fork (trunk -> fork point) is rigid; the gust's bend COMPOUNDS
          outward - each fork sways at its joint, and each leaf tuft sways again at
          its tip - so the further from the trunk, the more it curves. */}
      <path
        d={`M${x} ${top} L${fl.x} ${fl.y} M${x} ${top} L${fr.x} ${fr.y}`}
        strokeWidth={1.2 * s}
      />
      {forks.map((fk, fi) => (
        <g
          key={fi}
          className="bg-fern"
          style={{ transformBox: 'view-box', transformOrigin: `${fk.p.x}px ${fk.p.y}px` }}
        >
          {fk.tips.map((t, ti) => (
            <g key={ti}>
              <path d={`M${fk.p.x} ${fk.p.y} L${t.x} ${t.y}`} strokeWidth={0.9 * s} />
              <g
                className="bg-fern"
                style={{ transformBox: 'view-box', transformOrigin: `${t.x}px ${t.y}px` }}
              >
                <path
                  strokeWidth={0.5 * s}
                  d={`M${t.x} ${t.y} l${-1.6 * s} ${-3 * s} M${t.x} ${t.y} l${t.tuft * s} ${-3.4 * s} M${t.x} ${t.y} l${1.6 * s} ${-3 * s}`}
                />
              </g>
            </g>
          ))}
        </g>
      ))}
    </g>
  )
}

/** A giant horsetail (Calamites): a segmented stem with whorls of fine needle-like
 *  leaves at each node, shrinking toward the top. `seed` leans the stem and makes
 *  node spacing and whorls uneven side to side. */
function calamites(x: number, baseY: number, s: number, key: number, seed: number): ReactElement {
  const H = (23 + jit(seed, 2)) * s
  const NODES = 5
  return (
    // Group opacity (see lycophyte) keeps node/whorl junctions from brightening.
    <g key={key} stroke="#5fa452" opacity="0.34" fill="none" strokeLinecap="round">
      <path d={`M${x} ${baseY} V ${baseY - H}`} strokeWidth={1.5 * s} />
      {Array.from({ length: NODES }, (_, k) => {
        const f = (k + 1) / (NODES + 1)
        const ny = baseY - H * f + jit(seed + k, 1) * s // uneven node spacing
        const base = (3.4 - k * 0.5) * s // whorls shorten toward the top
        const lL = base * (1 + jit(seed + 10 + k, 0.35)) // left whorl length
        const lR = base * (1 + jit(seed + 20 + k, 0.35)) // right whorl length
        return (
          <g key={k} strokeWidth={0.5 * s}>
            <path d={`M${x - 1.6 * s} ${ny} H ${x + 1.6 * s}`} strokeWidth={0.7 * s} />
            {/* The fine leaves of each whorl flutter at the node in the gust. */}
            <g
              className="bg-fern"
              style={{ transformBox: 'view-box', transformOrigin: `${x}px ${ny}px` }}
            >
              <path
                d={`M${x} ${ny} l${-lL} ${-lL * 0.6} M${x} ${ny} l${-lL * 0.5} ${-lL} M${x} ${ny} l${lR * 0.5} ${-lR} M${x} ${ny} l${lR} ${-lR * 0.6}`}
              />
            </g>
          </g>
        )
      })}
    </g>
  )
}

/** One stem segment (midrib piece + a pair of leaflets), with the next segment
 *  nested at its tip. Each segment carries the bg-fern gust rotation about its
 *  own base (fill-box, bottom-centre), so rotations COMPOUND up the chain and
 *  the whole stem arcs under the wind instead of pivoting rigidly. */
function frondSegment(level: number, segLen: number): ReactElement | null {
  const SEGMENTS = 3
  if (level >= SEGMENTS) return null
  const llen = 3 - level * 0.7
  const segment = (
    <g className="bg-fern" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
      <path d={`M0 0 V ${-segLen}`} strokeWidth="0.7" />
      <path
        strokeWidth="0.5"
        d={`M0 ${-segLen * 0.5} q ${llen * 0.5} ${-llen * 0.2} ${llen} ${-llen * 0.7} M0 ${-segLen * 0.5} q ${-llen * 0.5} ${-llen * 0.2} ${-llen} ${-llen * 0.7}`}
      />
      {frondSegment(level + 1, segLen)}
    </g>
  )
  // Each segment above the base sits at the tip of the one below.
  return level === 0 ? segment : <g transform={`translate(0 ${-segLen})`}>{segment}</g>
}

interface FernShape {
  /** Fan of frond directions (degrees); its length sets the frond count. */
  angles: number[]
  /** Per-segment length: longer = taller fronds. */
  segLen: number
}

/** A fern tuft: fronds fanning from a planted base, each built as a chain of
 *  segments that arc under the wind (see frondSegment). The shape (frond count,
 *  spread, lean, height) varies per tuft so no two ferns look alike. Fresh
 *  green, deliberate for the land scene (not a tier token). */
function fernTuft(
  cx: number,
  baseY: number,
  s: number,
  key: number,
  shape: FernShape,
): ReactElement {
  return (
    <g
      key={key}
      transform={`translate(${cx} ${baseY}) scale(${s})`}
      stroke="#6fb95a"
      opacity="0.4"
      fill="none"
      strokeLinecap="round"
    >
      {shape.angles.map((a, i) => (
        <g key={i} transform={`rotate(${a})`}>
          {frondSegment(0, shape.segLen)}
        </g>
      ))}
    </g>
  )
}

/** Era 10: conquest of land - a low sun, drifting clouds, visible ground, trees
 *  on the sides, ferns in the middle, and sauropods grazing on the horizon (which
 *  vanish once the mass-extinction crisis strikes). Terrestrial, NOT the 'sea'. */
function LandScene(): ReactElement {
  // The giant fauna disappears the moment the extinction is triggered (and stays
  // gone after it is overcome).
  const sauropodsGone = useGameStore((s) => {
    const e = s.state.crises['extinction']
    return !!e && (e.resolved || isCrisisReady(s.state, s.defs, 'extinction'))
  })
  return (
    <div className="absolute inset-0">
      {/* Drifting clouds. */}
      <div className="bg-drift absolute inset-0">
        <svg className={svgClass} {...svgProps}>
          <g fill="var(--color-fg)" opacity="0.06">
            <ellipse cx="26" cy="26" rx="17" ry="4.5" />
            <ellipse cx="68" cy="18" rx="21" ry="5" />
            <ellipse cx="88" cy="32" rx="12" ry="3.5" />
          </g>
        </svg>
      </div>
      <svg className={svgClass} {...svgProps}>
        <Defs />
        {/* Low sun glow. */}
        <circle
          cx="72"
          cy="30"
          r="30"
          fill="url(#sb-accent)"
          opacity="0.5"
          className="bg-breathe"
        />
        {/* Sauropods on the horizon, BEHIND the hills (the slopes hide their feet). */}
        {sauropodsGone ? null : (
          <>
            <Sauropod x={0} baseY={65} s={1.5} />
            <Sauropod x={98} baseY={60} s={0.62} flip={-1} />
          </>
        )}
        {/* Visible ground: a far slope, then a nearer solid ground band. */}
        <path d="M0 60 Q50 55 100 60 L100 100 L0 100 Z" fill="url(#sb-secondary)" opacity="0.5" />
        <path d="M0 67 Q50 63 100 67 L100 100 L0 100 Z" fill="url(#sb-accent)" opacity="0.6" />
        {/* Period-correct flora only on the sides (static): scale trees and giant
            horsetails framing the edges. */}
        {lycophyte(7, 72, 1.2, 1, 3.1)}
        {calamites(17, 73, 0.8, 2, 7.7)}
        {calamites(84, 73, 0.85, 3, 1.9)}
        {lycophyte(95, 71, 1.25, 4, 5.4)}
        {/* Ferns through the middle - each a different shape/size, stems arcing
            in unison under the same gust. */}
        {fernTuft(35, 74, 0.5, 5, { angles: [-48, -24, 0, 24, 48], segLen: 5 })}
        {fernTuft(50, 75, 0.72, 6, { angles: [-30, -12, 6, 26, 44], segLen: 6.2 })}
        {fernTuft(64, 73, 0.58, 7, { angles: [-42, -16, 10, 38], segLen: 5.4 })}
      </svg>
    </div>
  )
}

/** Civilization tier (e11-e14): a neuron field, kept as a single SOFTLY BLURRED,
 *  dim layer - prettier and less distracting behind the window than a sharp one.
 *  Organic fibres drawn as filled ribbons (tapering, fluctuating thickness),
 *  irregular blob somas hubbing many fibres, sparks ON the fibres. Reads as minds
 *  connecting and carries through the tier (cities/nations/tech). */
function CivilizationScene(): ReactElement {
  return (
    <svg className={svgClass} {...svgProps}>
      <Defs />
      <defs>
        <filter id="sb-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>
      <g filter="url(#sb-soft)" opacity="0.7">
        {/* Dendrites / axons (filled ribbons), all rooted in a neuron. */}
        {SYN_FIBRES.map((f, i) => (
          <path key={`f${i}`} d={f.d} fill={f.color} opacity={f.o} />
        ))}
        {/* Synaptic boutons: each dendrite ends in a small terminal (not in the void). */}
        {SYN_TERMINALS.map((tn, i) => (
          <circle key={`t${i}`} cx={tn.x} cy={tn.y} r={tn.r} fill="var(--color-accent)" opacity="0.4" />
        ))}
        {/* Neuron cell bodies: an irregular glowing blob, pulsing in place. */}
        {SYN_SOMAS.map((s, i) => (
          <g
            key={`m${i}`}
            className="bg-pulse"
            style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: `-${s.delay}s` }}
          >
            <circle cx={s.x} cy={s.y} r={s.r * 1.7} fill="url(#sb-core)" />
            <path d={s.blob} fill="var(--color-fg)" opacity="0.5" />
          </g>
        ))}
        {/* Synaptic sparks firing along the fibres. */}
        {SYN_SPARKS.map((s, i) => (
          <circle
            key={`k${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="var(--color-fg)"
            className="bg-twinkle"
            style={{ animationDelay: `-${s.delay}s`, animationDuration: `${s.dur}s` }}
          />
        ))}
      </g>
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
  land: LandScene,
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
