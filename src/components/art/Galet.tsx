import { useId, type ReactElement } from 'react'

/**
 * Drawing of an "infinity pebble": a GREY stone (silhouette varies per pebble),
 * its surface mottled and non-uniform, with a painted MOTIF in the pebble's own
 * colour - the paint looking worn, scraped off in flecks. The matter pebble
 * carries a painted atom in amber. Decorative (aria-hidden); `dim` renders it
 * inactive. The stone grain and paint wear come from per-pebble fractal-noise
 * filters, so no two silhouettes share the same texture.
 */

/** Irregular pebble silhouettes (viewBox 36x32), one per `shape` index. */
const PEBBLE_SHAPES = [
  'M4,16 C4,9 9,3.5 18,3.5 C27,3.5 33,9 33,17 C33,24 27,28.5 17,28.5 C8,28.5 4,23 4,16 Z',
  'M3,18 C3,11 8.5,3 19,3 C29,3 34,10.5 33,18.5 C32,25.5 25.5,29 16,29 C7,29 3,24.5 3,18 Z',
  'M5,13.5 C4,8 10,3.5 19,4 C28.5,4.5 34,10 32,18.5 C30.5,25.5 24.5,29 15,28 C7,27 6,20.5 5,13.5 Z',
  // A round-bodied creature facing right, mouth agape: an exact trace of a
  // supplied silhouette, with an irregular hole punched through the body (the
  // hole loop is wound opposite to the outline so nonzero fill carves it out).
  // Used by the octarine pebble.
  'M18.8,4.7 C18.5,4.8 17.8,5.1 17.2,5.3 C16.2,5.8 16.1,5.9 15.4,5.9 C14.6,6 12.7,6.4 11.7,6.8 C8.8,7.9 6,10.1 4,12.9 C3.6,13.3 2.9,14.6 2.6,15.1 C1.9,16.5 1.5,18.4 1.7,19.6 C1.9,21.4 3.1,23 5,24.2 C6.3,25 7.7,25.5 9.5,26 C10,26.1 10.6,26.3 10.7,26.3 C10.8,26.3 11.4,26.4 12.2,26.5 C12.9,26.6 13.8,26.7 14.1,26.8 C14.5,26.9 15.3,27 16,27 C16.6,27.1 17.6,27.1 18.1,27.2 C20.8,27.5 24.3,27.2 26.6,26.4 C27.6,26.1 28.3,25.8 29,25.3 C30.3,24.4 32.2,22.6 32.8,21.6 C33.2,21.1 33.7,20 33.9,19.3 C34,18.8 34,18.8 33.8,18.5 C33.6,18 33.4,17.9 32.4,17.9 C31.9,17.9 31,17.9 30.4,18 C29.2,18.1 27.2,18.2 27.1,18.2 C27,18.1 27.3,17 27.4,16.8 C27.5,16.7 27.7,16.6 27.7,16.5 C27.9,16.4 31.5,16.3 33,16.2 L33.8,16.2 L34,16 C34.3,15.7 34.5,15.1 34.4,14.6 C34.4,14.1 34.1,13.7 33.7,13.4 C33,12.8 30.3,11.3 27.8,10.2 C25.9,9.4 24.9,9 22.3,8.2 C21.6,8 20.9,7.8 20.9,7.8 C20.9,7.8 20.9,7.5 20.9,7.1 C20.9,6.4 20.8,5.6 20.6,5.2 C20.3,4.7 19.7,4.5 18.8,4.7 Z M18.1,17.1 C17.85,17.52 16.25,18.1 15.6,18.5 C14.95,18.9 14.75,19.73 14.2,19.5 C13.65,19.27 12.8,17.73 12.3,17.1 C11.8,16.47 10.87,16.15 11.2,15.7 C11.53,15.25 13.53,14.72 14.3,14.4 C15.07,14.08 15.33,13.53 15.8,13.8 C16.27,14.07 16.72,15.45 17.1,16 C17.48,16.55 18.35,16.68 18.1,17.1 Z',
]

/** Painted motifs, drawn in the pebble's colour over the grey stone. */
const MOTIFS: Record<string, (color: string) => ReactElement> = {
  // A classic atom: nucleus + three crossed orbits.
  atom: (color) => (
    <g transform="translate(18 16)">
      <g fill="none" stroke={color} strokeWidth="1.1">
        <ellipse rx="9.5" ry="3.6" />
        <ellipse rx="9.5" ry="3.6" transform="rotate(60)" />
        <ellipse rx="9.5" ry="3.6" transform="rotate(120)" />
      </g>
      <circle r="2.4" fill={color} />
    </g>
  ),
  // A family in a child's hand: two big stick figures and a small one.
  family: (color) => (
    <g
      transform="translate(18 16)"
      fill="none"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="-7" cy="-6" r="2.1" />
      <path d="M-9.1,-6.4 Q-9.7,-4 -9,-2.2 M-4.9,-6.4 Q-4.3,-4 -5,-2.2 M-8.6,-7.7 -8.9,-9 M-7,-8.1 -7,-9.5 M-5.4,-7.7 -5.1,-9" />
      <path d="M-7,-3.9 V3 M-10,-1 H-4 M-7,3 -9.5,7 M-7,3 -4.5,7" />
      <circle cx="7" cy="-6" r="2.1" />
      <path d="M7,-3.9 V3 M4,-1 H10 M7,3 4.5,7 M7,3 9.5,7" />
      <circle cx="0" cy="-1" r="1.6" />
      <path d="M0,0.6 V4 M-2.2,1.6 H2.2 M0,4 -1.6,7 M0,4 1.6,7" />
    </g>
  ),
  // A cell: membrane with an off-centre nucleus.
  cell: (color) => (
    <g transform="translate(18 16)">
      <ellipse
        rx="10"
        ry="8"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        transform="rotate(-12)"
      />
      <circle cx="2.5" cy="1" r="2.8" fill={color} />
    </g>
  ),
  // Spacetime: a row of hourglasses, each smaller than the last.
  hourglasses: (color) => (
    <g
      transform="translate(18 16)"
      fill="none"
      stroke={color}
      strokeWidth="1.1"
      strokeLinejoin="round"
    >
      {[0, 1, 2, 3].map((i) => {
        const w = 4.6 - i * 0.9
        const h = 9.5 - i * 1.8
        const cx = -13 + i * 8.5
        return (
          <path
            key={i}
            d={`M${cx - w} ${-h} L${cx + w} ${-h} L${cx} 0 L${cx + w} ${h} L${cx - w} ${h} L${cx} 0 Z`}
          />
        )
      })}
    </g>
  ),
  // A painted rainbow: concentric arcs, red (outer) to purple (inner). Self-coloured
  // from the rainbow tokens (the `color` argument is ignored), like a child's rock.
  rainbow: () => {
    const cx = 18
    const cy = 19
    const drip = { filter: 'blur(0.6px)' }
    return (
      // Slight tilt so it reads as hand-painted, not aligned to the screen axis.
      <g fill="none" strokeWidth="1.5" strokeLinecap="round" transform="rotate(-7 18 16)">
        {[1, 2, 3, 4, 5, 6].map((n, i) => {
          const r = 9.5 - i * 1.45
          return (
            <g key={n} stroke={`var(--galet-rainbow-${n})`}>
              <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} />
              {/* Paint that ran/bled at the two ends, softened (blurred). */}
              <path d={`M ${cx - r} ${cy} q -0.6 1.5 -0.2 2.6`} opacity="0.8" style={drip} />
              <path d={`M ${cx + r} ${cy} q 0.6 1.5 0.2 2.6`} opacity="0.8" style={drip} />
            </g>
          )
        })}
      </g>
    )
  },
  // A rebel starbird: a near-circular crest with a flaming central crown and two
  // raised wings, split from it by a pair of slits (the two reverse-wound loops,
  // carved out by nonzero fill). Sat on the body, clear of the snout.
  rebel: (color) => (
    <g transform="translate(17 15.5) scale(1.13)">
      <path
        fill={color}
        fillRule="nonzero"
        d="M0,8 C2.6,8 4.4,7 5.8,5.7 C7.1,4.4 7.9,2.6 8,0.3 C8.05,-1.4 7.9,-3 7.4,-4.3 L5.8,-7.6 L4.7,-5.9 L3,-3 L1.9,-7 L0.9,-4.7 L0,-8.7 L-0.9,-4.7 L-1.9,-7 L-3,-3 L-4.7,-5.9 L-5.8,-7.6 L-7.4,-4.3 C-7.9,-3 -8.05,-1.4 -8,0.3 C-7.9,2.6 -7.1,4.4 -5.8,5.7 C-4.4,7 -2.6,8 0,8 Z M4,-5.4 C4.42,-4.95 5.37,-3.33 5.7,-2.2 C6.03,-1.07 6.18,0.3 6,1.4 C5.82,2.5 5.12,3.77 4.6,4.4 C4.08,5.03 3.33,5.5 2.9,5.2 C2.47,4.9 2.1,3.57 2,2.6 C1.9,1.63 2.18,0.4 2.3,-0.6 C2.42,-1.6 2.55,-2.68 2.7,-3.4 C2.85,-4.12 2.98,-4.57 3.2,-4.9 C3.42,-5.23 3.58,-5.85 4,-5.4 Z M-3.2,-4.9 C-2.98,-4.57 -2.85,-4.12 -2.7,-3.4 C-2.55,-2.68 -2.42,-1.6 -2.3,-0.6 C-2.18,0.4 -1.9,1.63 -2,2.6 C-2.1,3.57 -2.47,4.9 -2.9,5.2 C-3.33,5.5 -4.08,5.03 -4.6,4.4 C-5.12,3.77 -5.82,2.5 -6,1.4 C-6.18,0.3 -6.03,-1.07 -5.7,-2.2 C-5.37,-3.33 -4.42,-4.95 -4,-5.4 C-3.58,-5.85 -3.42,-5.23 -3.2,-4.9 Z"
      />
    </g>
  ),
}

export function Galet({
  color,
  motif,
  shape = 0,
  size = 32,
  dim = false,
}: {
  color: string
  motif?: string
  shape?: number
  size?: number
  dim?: boolean
}) {
  const raw = useId()
  const uid = raw.replace(/[^a-zA-Z0-9]/g, '')
  const stone = `st-${uid}`
  const shadeId = `sh-${uid}`
  const clipId = `cl-${uid}`
  const grainId = `gn-${uid}`
  const wornId = `wo-${uid}`
  const d = PEBBLE_SHAPES[shape % PEBBLE_SHAPES.length]
  const paint = motif ? MOTIFS[motif]?.(color) : null
  // A distinct noise seed per silhouette so the texture never repeats.
  const seed = (shape % PEBBLE_SHAPES.length) * 9 + 1
  return (
    <svg
      viewBox="0 0 36 32"
      width={(size * 36) / 32}
      height={size}
      aria-hidden
      className={dim ? 'opacity-45 grayscale' : ''}
    >
      <defs>
        <linearGradient id={stone} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="var(--stone-light)" />
          <stop offset="100%" stopColor="var(--stone-dark)" />
        </linearGradient>
        <radialGradient id={shadeId} cx="68%" cy="80%" r="75%">
          <stop offset="0%" stopColor="var(--color-bg)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--color-bg)" stopOpacity="0.4" />
        </radialGradient>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
        {/* Mottled stone grain: fractal noise turned into faint dark speckles. */}
        <filter id={grainId} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.5"
            numOctaves="3"
            seed={seed}
            result="n"
          />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0"
          />
        </filter>
        {/* Worn paint: roughen the strokes, then scrape sparse flecks out of them. */}
        <filter id={wornId} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.13"
            numOctaves="2"
            seed={seed + 4}
            result="warp"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="0.9"
            xChannelSelector="R"
            yChannelSelector="G"
            result="rough"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed={seed + 9}
            result="flecks"
          />
          <feColorMatrix
            in="flecks"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.5"
            result="holes"
          />
          <feComposite in="rough" in2="holes" operator="in" />
        </filter>
      </defs>
      {/* Grey stone body, mottled, with a soft bottom shade (clipped to shape). */}
      <g clipPath={`url(#${clipId})`}>
        <path d={d} fill={`url(#${stone})`} />
        <rect x="0" y="0" width="36" height="32" filter={`url(#${grainId})`} />
        <path d={d} fill={`url(#${shadeId})`} />
      </g>
      <path d={d} fill="none" stroke="var(--stone-dark)" strokeWidth="0.6" />
      {paint ? (
        <g clipPath={`url(#${clipId})`}>
          <g filter={`url(#${wornId})`}>{paint}</g>
        </g>
      ) : null}
    </svg>
  )
}
