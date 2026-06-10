import { useEffect, useRef, type ReactElement } from 'react'
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
    { x: fl.x - (3 + jit(seed + 5, 1.4)) * s, y: fl.y - (5 + jit(seed + 6, 1.3)) * s, tuft: jit(seed + 20, 0.8) },
    { x: fl.x + (1.6 + jit(seed + 7, 1.2)) * s, y: fl.y - (5 + jit(seed + 8, 1.3)) * s, tuft: jit(seed + 21, 0.8) },
    { x: fr.x - (1.6 + jit(seed + 9, 1.2)) * s, y: fr.y - (5 + jit(seed + 10, 1.3)) * s, tuft: jit(seed + 22, 0.8) },
    { x: fr.x + (3 + jit(seed + 11, 1.4)) * s, y: fr.y - (5 + jit(seed + 12, 1.3)) * s, tuft: jit(seed + 23, 0.8) },
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
      <path d={`M${x} ${top} L${fl.x} ${fl.y} M${x} ${top} L${fr.x} ${fr.y}`} strokeWidth={1.2 * s} />
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
            <g className="bg-fern" style={{ transformBox: 'view-box', transformOrigin: `${x}px ${ny}px` }}>
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
function fernTuft(cx: number, baseY: number, s: number, key: number, shape: FernShape): ReactElement {
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

// Sauropod silhouette auto-traced (Pillow contour) from an Argentinosaurus
// profile, then simplified. Local units: feet at y=0, height ~24, facing right.
const SAUROPOD_A =
  'M44.2 -22.8 L43.9 -23.4 L43.5 -23.6 L43.1 -23.6 L42.6 -24.0 L42.6 -23.8 L42.4 -24.0 L42.1 -23.8 L41.9 -23.9 L41.6 -23.6 L41.4 -23.7 L40.3 -23.1 L39.7 -22.4 L39.4 -22.3 L39.2 -22.0 L39.0 -22.0 L38.8 -21.5 L38.5 -21.4 L38.3 -21.0 L38.1 -21.0 L36.7 -19.4 L35.4 -17.4 L35.2 -17.2 L34.2 -15.3 L33.5 -14.7 L33.3 -14.2 L33.1 -14.2 L33.0 -13.8 L32.7 -13.8 L32.4 -13.3 L32.2 -13.3 L31.5 -12.5 L31.2 -12.4 L30.7 -11.9 L30.2 -11.6 L30.1 -11.7 L29.1 -11.4 L28.2 -10.9 L28.2 -11.0 L26.3 -10.3 L26.2 -10.4 L25.8 -10.3 L25.7 -10.2 L25.6 -10.2 L25.2 -10.2 L24.5 -9.8 L24.4 -9.9 L23.6 -9.5 L23.5 -9.6 L22.7 -9.1 L22.1 -9.0 L21.5 -8.8 L21.4 -8.9 L21.2 -8.7 L19.4 -8.1 L18.3 -7.6 L17.6 -7.5 L14.5 -6.4 L12.7 -6.0 L12.4 -5.8 L11.7 -5.7 L11.4 -5.8 L10.5 -5.6 L10.2 -5.7 L8.3 -5.6 L8.0 -5.8 L7.8 -5.6 L7.5 -5.8 L6.9 -5.7 L6.7 -5.9 L6.4 -5.8 L6.2 -6.0 L5.9 -5.9 L5.7 -6.1 L5.4 -6.0 L5.3 -6.2 L5.0 -6.1 L4.8 -6.3 L4.5 -6.2 L4.3 -6.4 L4.0 -6.4 L3.9 -6.6 L3.7 -6.5 L3.4 -6.6 L3.0 -6.6 L3.0 -6.7 L2.6 -6.6 L2.4 -6.8 L2.2 -6.7 L1.8 -6.9 L1.5 -6.8 L1.3 -7.0 L1.1 -6.8 L0.8 -7.0 L0.6 -6.8 L0.0 -6.8 L2.1 -6.6 L6.8 -5.3 L12.4 -4.5 L14.3 -4.5 L18.2 -5.2 L20.6 -5.3 L20.7 -0.5 L21.0 -0.3 L22.4 -0.4 L22.5 -2.9 L22.8 -3.1 L23.0 -0.2 L23.2 0.0 L24.1 0.0 L24.7 -0.2 L24.8 -3.8 L27.0 -3.7 L29.0 -4.1 L30.0 -4.4 L30.7 -0.2 L30.8 -0.1 L31.8 -0.1 L32.0 -0.2 L32.1 -1.8 L32.6 -0.2 L33.5 -0.1 L33.8 -0.2 L33.9 -0.3 L34.0 -8.1 L36.5 -11.6 L38.6 -15.7 L39.8 -18.4 L40.6 -19.7 L42.5 -21.6 L43.6 -22.3 L44.0 -22.3 L44.2 -22.6 Z'

/** A distant sauropod silhouette (traced from a real Argentinosaurus profile).
 *  `flip` = -1 faces it left. Faint, far in the background. */
function sauropod(x: number, baseY: number, s: number, flip: number, body: string, key: number): ReactElement {
  return (
    <g key={key} transform={`translate(${x} ${baseY}) scale(${flip * s} ${s})`} opacity="0.15">
      <path d={body} fill="var(--color-fg)" />
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
        <circle cx="72" cy="30" r="30" fill="url(#sb-accent)" opacity="0.5" className="bg-breathe" />
        {/* Sauropods on the horizon, BEHIND the hills (the slopes hide their feet). */}
        {sauropodsGone ? null : (
          <>
            {sauropod(0, 65, 1.5, 1, SAUROPOD_A, 1)}
            {sauropod(98, 60, 0.62, -1, SAUROPOD_A, 2)}
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
