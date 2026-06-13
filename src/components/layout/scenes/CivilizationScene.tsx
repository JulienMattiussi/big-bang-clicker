import type { ReactElement } from 'react'
import { Defs } from './Defs'
import { mulberry32, svgClass, svgProps } from './shared'

// Civilization tier (e11-e14): a neuron field. Built so it reads as real synapses:
// every fibre ROOTS in a neuron (dendrites radiate from a soma, axons link two
// somas), each dendrite ends in a synaptic bouton, and sparks sit ON the fibres
// (never floating). Generated deterministically (stable layout).
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

/** Civilization tier (e11-e14): a neuron field, kept as a single SOFTLY BLURRED,
 *  dim layer - prettier and less distracting behind the window than a sharp one.
 *  Organic fibres drawn as filled ribbons (tapering, fluctuating thickness),
 *  irregular blob somas hubbing many fibres, sparks ON the fibres. Reads as minds
 *  connecting and carries through the tier (cities/nations/tech). */
export function CivilizationScene(): ReactElement {
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
