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
  // Flattened, asymmetric disc with a soft notch on the front edge: a pebble that
  // just hints at a saucer-shaped freighter, without copying any real silhouette.
  'M4,16 C4,10 9,5.5 18,5.5 C25,5.5 30,8.5 32,12 C31,13.6 30.5,14.8 30.5,16 C30.5,17.2 31,18.4 32,20 C30,23.5 25,26.5 18,26.5 C9,26.5 4,22 4,16 Z',
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
  // A stylised ascending starbird inside an arc - a rebel emblem (original design).
  rebel: (color) => (
    <g
      transform="translate(18 16)"
      fill="none"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M-10 3 A 11 11 0 0 1 10 3" opacity="0.6" />
      <path d="M-9 5 C -5 -2 -2 -7 0 -9 C 2 -7 5 -2 9 5" />
      <path d="M0 -8 V 6" />
      <circle r="1.3" cy="-9" fill={color} stroke="none" />
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
