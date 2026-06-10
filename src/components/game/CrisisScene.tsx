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
      {/* Impact flash (pulsing). */}
      <circle className="crisis-flash" cx="72" cy="113" r="48" fill="url(#crisis-flash)" />
      {/* A secondary debris streak. */}
      <path d="M150 30 L156 38 L120 70 L116 63 Z" fill="url(#crisis-trail)" opacity="0.5" />
      {/* Main meteor trail + head. */}
      <path d="M196 10 L205 22 L84 110 L70 103 Z" fill="url(#crisis-trail)" />
      <circle cx="198" cy="14" r="10" fill="url(#crisis-flash)" />
      <circle cx="198" cy="14" r="4.5" fill="var(--color-accent)" />
    </svg>
  )
}
