import type { ReactElement } from 'react'
import { Icon } from '@/components/ui/Icon'

/** Faint stars scattered in the meteor sky, precomputed. */
const STARS = [
  [28, 20],
  [62, 34],
  [120, 24],
  [156, 16],
  [208, 38],
  [92, 14],
]

/**
 * Big symbolic illustration for a crisis. Mass extinction (era 10) is a meteor
 * streaking into a horizon with a glowing impact; other crises fall back to a
 * large skull. Decorative (aria-hidden); the title/text carry the meaning.
 */
export function CrisisScene({
  id,
  className = 'h-28 w-auto',
}: {
  id: string
  className?: string
}): ReactElement {
  if (id === 'encounter') {
    // A far galaxy: hooded figures brandishing glowing torches (a wink at certain
    // robed, blade-wielding orders).
    const figures = [
      { cx: 70, dir: -1 },
      { cx: 120, dir: 1 },
      { cx: 168, dir: -1 },
    ]
    return (
      <svg viewBox="0 0 240 140" className={className} fill="none" aria-hidden>
        {STARS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1" fill="var(--color-fg)" opacity="0.35" />
        ))}
        {/* distant galaxy + ground */}
        <ellipse cx="180" cy="34" rx="40" ry="11" fill="var(--color-accent)" opacity="0.12" />
        <ellipse cx="180" cy="34" rx="16" ry="5" fill="var(--color-accent)" opacity="0.18" />
        <path d="M0 124 Q120 112 240 124 L240 140 L0 140 Z" fill="var(--color-fg)" fillOpacity="0.14" />
        {figures.map(({ cx, dir }) => (
          <g key={cx}>
            {/* torch beam (halo + core) */}
            <line
              x1={cx + dir * 8}
              y1={104}
              x2={cx + dir * 19}
              y2={62}
              stroke="var(--color-accent)"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.18"
            />
            <line
              x1={cx + dir * 8}
              y1={104}
              x2={cx + dir * 19}
              y2={62}
              stroke="var(--color-accent)"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            {/* hooded robe */}
            <path
              d={`M${cx} 74 C ${cx - 12} 78 ${cx - 13} 106 ${cx - 12} 124 L ${cx + 12} 124 C ${cx + 13} 106 ${cx + 12} 78 ${cx} 74 Z`}
              fill="var(--color-fg)"
              fillOpacity="0.55"
            />
            <ellipse cx={cx} cy={89} rx="4" ry="5.4" fill="var(--color-bg)" />
          </g>
        ))}
      </svg>
    )
  }
  if (id !== 'extinction') {
    return <Icon name="skull" className={`${className} text-red-400`} />
  }
  return (
    <svg viewBox="0 0 240 140" className={className} fill="none" aria-hidden>
      <defs>
        <radialGradient id="crisis-flash" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="crisis-trail" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="var(--color-fg)" opacity="0.35" />
      ))}
      {/* Planet / horizon. */}
      <path
        d="M0 118 Q120 92 240 118 L240 140 L0 140 Z"
        fill="var(--color-fg)"
        fillOpacity="0.12"
      />
      <path
        d="M0 118 Q120 92 240 118"
        stroke="var(--color-fg)"
        strokeOpacity="0.25"
        strokeWidth="1.2"
        fill="none"
      />
      <circle className="crisis-flash" cx="72" cy="113" r="48" fill="url(#crisis-flash)" />
      {/* Secondary debris streak (diagonal sliver). */}
      <path d="M150 30 L156 38 L120 70 L116 63 Z" fill="url(#crisis-trail)" opacity="0.5" />
      {/* Main meteor trail (top-right to horizon) + glowing head. */}
      <path d="M196 10 L205 22 L84 110 L70 103 Z" fill="url(#crisis-trail)" />
      <circle cx="198" cy="14" r="10" fill="url(#crisis-flash)" />
      <circle cx="198" cy="14" r="4.5" fill="var(--color-accent)" />
    </svg>
  )
}
