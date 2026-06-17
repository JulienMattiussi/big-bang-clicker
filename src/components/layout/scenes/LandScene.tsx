import type { ReactElement } from 'react'
import { Sauropod } from '@/components/art/Sauropod'
import { useGameStore } from '@/store/gameStore'
import { isCrisisReady } from '@/lib/crises'
import { Defs } from './Defs'
import { svgClass, svgProps } from './shared'

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
    { p: fl, tips: [tips[0]!, tips[1]!] },
    { p: fr, tips: [tips[2]!, tips[3]!] },
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
export function LandScene(): ReactElement {
  // The giant fauna disappears the moment the extinction is triggered (and stays
  // gone after it is overcome).
  const sauropodsGone = useGameStore((s) => {
    const e = s.state.crises['extinction']
    return !!e && (e.resolved || isCrisisReady(s.state, s.defs, 'extinction'))
  })
  return (
    // A gentle soft-focus on the whole terrestrial decor (much lighter than the
    // intelligence era's blur), so it recedes a touch behind the window.
    <div className="absolute inset-0" style={{ filter: 'blur(3px)' }}>
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
