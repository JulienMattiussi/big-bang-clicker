import type { CSSProperties, ReactElement } from 'react'
import { StarsScene } from './StarsScene'
import { Defs } from './Defs'
import { mulberry32, svgClass, svgProps } from './shared'

/**
 * Era 19 (Death and birth): the universe gathered into one vast futuristic city.
 * A Coruscant-like skyline of tapered spires, needle towers and floating disc
 * platforms in two depth layers, with twinkling windows, air traffic and the
 * city's glow. Decorative; SVG motion limited to opacity (twinkle), drifting
 * craft ride HTML wrappers per the scene rules.
 */
const rng = mulberry32(421)

type Building =
  | { kind: 'spire'; cx: number; w: number; h: number; op: number }
  | { kind: 'tower'; cx: number; baseW: number; topW: number; h: number; op: number }
  | { kind: 'needle'; cx: number; h: number; op: number }
interface Disc {
  cx: number
  cy: number
  w: number
  op: number
}
interface Win {
  x: number
  y: number
  twinkle: boolean
  delay: number
}

const BUILDINGS: Building[] = []
const WINDOWS: Win[] = []
const DISCS: Disc[] = []

/** Rows of lit windows down a building body of the given span and height. */
function addWindows(cx: number, span: number, top: number, height: number) {
  const cols = Math.max(1, Math.floor(span / 2.4))
  const rows = Math.floor(height / 4.6)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() < 0.45) continue
      WINDOWS.push({
        x: cx - span / 2 + ((c + 0.5) * span) / cols - 0.3,
        y: top + 3 + r * 4.4,
        twinkle: rng() < 0.45,
        delay: rng() * 4,
      })
    }
  }
}

{
  // Back layer: shorter, fainter towers and needles peeking between the front.
  let x = -2
  while (x < 104) {
    const roll = rng()
    if (roll < 0.4) {
      const h = 18 + rng() * 26
      BUILDINGS.push({ kind: 'needle', cx: x, h, op: 0.1 })
      x += 3 + rng() * 4
    } else {
      const baseW = 4 + rng() * 6
      const h = 22 + rng() * 30
      BUILDINGS.push({ kind: 'tower', cx: x, baseW, topW: baseW * 0.7, h, op: 0.12 })
      x += baseW + 1 + rng() * 3
    }
  }
  // Front layer: taller, denser, windowed - spires, towers and needles.
  x = -1
  while (x < 103) {
    const roll = rng()
    if (roll < 0.28) {
      const h = 30 + rng() * 30
      BUILDINGS.push({ kind: 'needle', cx: x, h, op: 0.24 })
      x += 4 + rng() * 4
    } else if (roll < 0.6) {
      const w = 6 + rng() * 5
      const h = 40 + rng() * 42
      BUILDINGS.push({ kind: 'spire', cx: x, w, h, op: 0.26 })
      addWindows(x, w * 0.55, 100 - h + w * 1.6, h - w * 1.6)
      x += w + 2 + rng() * 4
    } else {
      const baseW = 7 + rng() * 7
      const h = 34 + rng() * 40
      BUILDINGS.push({ kind: 'tower', cx: x, baseW, topW: baseW * 0.6, h, op: 0.26 })
      addWindows(x, baseW * 0.7, 100 - h, h)
      x += baseW + 2 + rng() * 4
    }
  }
  // Floating disc platforms drifting between the towers.
  for (let i = 0; i < 5; i++) {
    DISCS.push({ cx: 8 + rng() * 84, cy: 26 + rng() * 40, w: 7 + rng() * 8, op: 0.2 })
  }
}

// Two ring stations in the upper sky. The square viewBox is sliced, so on a wide
// screen only the y ~29-71 band shows: keep them well inside it, in the corners
// away from the central widget.
const STATIONS = [
  { cx: 16, cy: 31, r: 11 },
  { cx: 85, cy: 36, r: 8 },
]

/** A few craft drifting across the sky lanes (HTML wrappers carry the translate). */
const TRAFFIC = Array.from({ length: 6 }, () => ({
  dur: 22 + rng() * 20,
  delay: rng() * 36,
  y: 12 + rng() * 46,
  size: 8 + rng() * 10,
  ltr: rng() < 0.5,
}))

export function CityUniverseScene(): ReactElement {
  return (
    <>
      <StarsScene />
      <svg className={svgClass} {...svgProps}>
        <Defs />
        {/* The city's collective glow on the horizon. */}
        <ellipse cx="50" cy="100" rx="78" ry="38" fill="url(#sb-accent)" opacity="0.5" />

        {/* Orbital ring stations high in the sky (behind the skyline). */}
        {STATIONS.map((s, i) => (
          <g key={`st${i}`} opacity="0.42">
            <ellipse cx={s.cx} cy={s.cy} rx={s.r} ry={s.r * 0.32} fill="none" stroke="var(--color-accent)" strokeWidth="0.7" />
            <ellipse cx={s.cx} cy={s.cy} rx={s.r * 0.62} ry={s.r * 0.2} fill="none" stroke="var(--color-accent)" strokeWidth="0.5" opacity="0.6" />
            <line x1={s.cx - s.r} y1={s.cy} x2={s.cx + s.r} y2={s.cy} stroke="var(--color-accent)" strokeWidth="0.4" />
            <ellipse cx={s.cx} cy={s.cy} rx={s.r * 0.14} ry={s.r * 0.14} fill="var(--color-accent)" />
            <circle cx={s.cx - s.r} cy={s.cy} r="0.7" fill="var(--color-accent)" className="bg-twinkle" style={{ animationDelay: `-${i}s`, animationDuration: '1.6s' }} />
            <circle cx={s.cx + s.r} cy={s.cy} r="0.7" fill="var(--color-accent)" className="bg-twinkle" style={{ animationDelay: `-${i + 0.8}s`, animationDuration: '1.6s' }} />
          </g>
        ))}

        {BUILDINGS.map((b, i) => {
          if (b.kind === 'needle') {
            const top = 100 - b.h
            return (
              <g key={i} fill="var(--color-accent)" opacity={b.op}>
                <polygon points={`${b.cx - 0.9},100 ${b.cx},${top} ${b.cx + 0.9},100`} />
                <circle cx={b.cx} cy={top} r="0.7" opacity="0.9" />
              </g>
            )
          }
          if (b.kind === 'spire') {
            const top = 100 - b.h
            const bulbCy = top + b.w * 1.1
            return (
              <g key={i} fill="var(--color-accent)" opacity={b.op}>
                {/* tapered shaft */}
                <polygon
                  points={`${b.cx - b.w / 2},100 ${b.cx - b.w * 0.18},${bulbCy} ${b.cx + b.w * 0.18},${bulbCy} ${b.cx + b.w / 2},100`}
                />
                {/* bulbous crown + antenna */}
                <ellipse cx={b.cx} cy={bulbCy} rx={b.w * 0.5} ry={b.w * 0.8} />
                <rect x={b.cx - 0.3} y={top - 4} width="0.6" height={bulbCy - top + 4} />
                <circle cx={b.cx} cy={top - 4} r="0.7" opacity="0.9" />
              </g>
            )
          }
          const top = 100 - b.h
          return (
            <polygon
              key={i}
              fill="var(--color-accent)"
              opacity={b.op}
              points={`${b.cx - b.baseW / 2},100 ${b.cx - b.topW / 2},${top} ${b.cx + b.topW / 2},${top} ${b.cx + b.baseW / 2},100`}
            />
          )
        })}

        {/* Floating disc platforms: saucer + dome + mast light. */}
        {DISCS.map((d, i) => (
          <g key={`d${i}`} fill="var(--color-accent)" opacity={d.op}>
            <ellipse cx={d.cx} cy={d.cy} rx={d.w / 2} ry={d.w / 6} />
            <ellipse cx={d.cx} cy={d.cy - d.w / 10} rx={d.w / 4} ry={d.w / 8} />
            <rect x={d.cx - 0.25} y={d.cy - d.w / 4} width="0.5" height={d.w / 8} />
            <circle cx={d.cx} cy={d.cy - d.w / 4} r="0.6" opacity="0.9" />
          </g>
        ))}

        {/* Lit windows; some twinkle. */}
        {WINDOWS.map((w, i) => (
          <rect
            key={`w${i}`}
            x={w.x}
            y={w.y}
            width="0.6"
            height="0.9"
            rx="0.15"
            fill="var(--color-accent)"
            opacity="0.6"
            className={w.twinkle ? 'bg-twinkle' : undefined}
            style={w.twinkle ? { animationDelay: `-${w.delay}s`, animationDuration: '3.5s' } : undefined}
          />
        ))}
      </svg>

      {/* Air traffic: small craft drifting along sky lanes. */}
      <div className="absolute inset-0 overflow-hidden">
        {TRAFFIC.map((c, i) => (
          <span
            key={i}
            className="bg-cross absolute"
            style={
              {
                top: `${c.y}vh`,
                animationDuration: `${c.dur}s`,
                animationDelay: `-${c.delay}s`,
                '--bx-from': c.ltr ? '-8vw' : '108vw',
                '--bx-to': c.ltr ? '108vw' : '-8vw',
                '--by-from': '0vh',
                '--by-to': '0vh',
              } as CSSProperties
            }
          >
            <span
              className="block rounded-full bg-accent/40"
              style={{ width: `${c.size}px`, height: '2px' }}
            />
          </span>
        ))}
      </div>
    </>
  )
}
