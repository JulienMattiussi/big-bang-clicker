/** Era 1: Bohr atom (nucleus + electrons on orbits). */
export function BohrWidget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="none" stroke="var(--color-secondary)" strokeWidth="1" opacity="0.6">
        <ellipse cx="50" cy="50" rx="42" ry="16" />
        <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(120 50 50)" />
      </g>
      <g className="widget-spin" fill="var(--color-accent)">
        <circle cx="92" cy="50" r="3" />
        <circle cx="29" cy="86.4" r="3" />
        <circle cx="29" cy="13.6" r="3" />
      </g>
      <circle cx="50" cy="50" r="9" fill="var(--color-accent)" />
      <circle cx="50" cy="50" r="9" fill="var(--color-fg)" opacity="0.15" />
    </svg>
  )
}
