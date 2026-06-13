import type { ReactElement } from 'react'

/** Shared gradients/filter for the SVG scenes (referenced by url(#sb-*)). */
export function Defs(): ReactElement {
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
