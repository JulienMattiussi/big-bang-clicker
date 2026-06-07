import { useId, type ReactElement } from 'react'

/**
 * Drawing of an "infinity pebble": a GREY stone (silhouette varies per pebble)
 * with a painted MOTIF in the pebble's own colour. The matter pebble carries a
 * painted atom in amber. Decorative (aria-hidden); `dim` renders it inactive.
 */

/** Irregular pebble silhouettes (viewBox 36x32), one per `shape` index. */
const PEBBLE_SHAPES = [
  'M4,16 C4,9 9,3.5 18,3.5 C27,3.5 33,9 33,17 C33,24 27,28.5 17,28.5 C8,28.5 4,23 4,16 Z',
  'M3,18 C3,11 8.5,3 19,3 C29,3 34,10.5 33,18.5 C32,25.5 25.5,29 16,29 C7,29 3,24.5 3,18 Z',
  'M5,13.5 C4,8 10,3.5 19,4 C28.5,4.5 34,10 32,18.5 C30.5,25.5 24.5,29 15,28 C7,27 6,20.5 5,13.5 Z',
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
  // A cell: membrane with an off-centre nucleus.
  cell: (color) => (
    <g transform="translate(18 16)">
      <ellipse rx="10" ry="8" fill="none" stroke={color} strokeWidth="1.4" transform="rotate(-12)" />
      <circle cx="2.5" cy="1" r="2.8" fill={color} />
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
  const d = PEBBLE_SHAPES[shape % PEBBLE_SHAPES.length]
  const paint = motif ? MOTIFS[motif]?.(color) : null
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
      </defs>
      {/* Grey stone body + soft bottom shade. */}
      <path d={d} fill={`url(#${stone})`} stroke="var(--stone-dark)" strokeWidth="0.6" />
      <path d={d} fill={`url(#${shadeId})`} />
      {/* Painted motif (the pebble's colour). */}
      {paint}
    </svg>
  )
}
