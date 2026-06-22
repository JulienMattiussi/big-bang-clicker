import type { ReactElement } from 'react'

/** Faint stars, precomputed. */
const STARS = [
  [24, 22],
  [60, 14],
  [206, 26],
  [168, 18],
  [216, 60],
  [40, 54],
]

/**
 * Era-19 opening illustration: the whole universe gathered into a single domed
 * metropolis, ringed by orbital arcs. Decorative (aria-hidden); the text carries
 * the meaning. Uses the accent token so it tints with the era's tier.
 */
export function UniverseCityScene({
  className = 'h-28 w-auto',
}: {
  className?: string
}): ReactElement {
  const towers = [
    { x: 96, w: 9, h: 34 },
    { x: 108, w: 11, h: 52 },
    { x: 122, w: 8, h: 44 },
    { x: 132, w: 12, h: 64 },
    { x: 147, w: 9, h: 40 },
    { x: 158, w: 10, h: 50 },
    { x: 171, w: 8, h: 30 },
  ]
  const GROUND = 116
  return (
    <svg viewBox="0 0 240 140" className={className} fill="none" aria-hidden>
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="var(--color-fg)" opacity="0.35" />
      ))}
      {/* Orbital rings: the universe wrapped around the city. */}
      <ellipse cx="138" cy="84" rx="104" ry="34" stroke="var(--color-accent)" strokeWidth="1" opacity="0.3" />
      <ellipse cx="138" cy="84" rx="74" ry="22" stroke="var(--color-accent)" strokeWidth="1" opacity="0.45" />
      {/* Dome glow over the skyline. */}
      <ellipse cx="138" cy={GROUND} rx="62" ry="40" fill="var(--color-accent)" opacity="0.12" />
      {/* Skyline of towers, with a few lit windows. */}
      <g>
        {towers.map((t) => (
          <g key={t.x}>
            <rect
              x={t.x}
              y={GROUND - t.h}
              width={t.w}
              height={t.h}
              rx="1.5"
              fill="var(--color-accent)"
              opacity="0.85"
            />
            {Array.from({ length: Math.max(1, Math.floor(t.h / 12)) }, (_, k) => (
              <rect
                key={k}
                x={t.x + t.w / 2 - 1}
                y={GROUND - t.h + 6 + k * 11}
                width="2"
                height="2"
                fill="var(--color-bg)"
                opacity="0.8"
              />
            ))}
          </g>
        ))}
      </g>
      {/* Ground line. */}
      <line x1="70" y1={GROUND} x2="206" y2={GROUND} stroke="var(--color-accent)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
