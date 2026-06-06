/** Era 15: a multi-stage rocket with an animated flame. */
export function RocketWidget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {/* Nose cone */}
      <path d="M50 8 L60 30 L40 30 Z" fill="var(--color-accent)" />
      {/* Upper stage */}
      <rect
        x="40"
        y="30"
        width="20"
        height="22"
        fill="var(--color-surface)"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
      />
      {/* Lower stage */}
      <rect
        x="40"
        y="52"
        width="20"
        height="22"
        fill="var(--color-surface)"
        stroke="var(--color-secondary)"
        strokeWidth="1.5"
      />
      {/* Fins */}
      <path d="M40 64 L30 78 L40 74 Z" fill="var(--color-secondary)" />
      <path d="M60 64 L70 78 L60 74 Z" fill="var(--color-secondary)" />
      {/* Window */}
      <circle cx="50" cy="41" r="4" fill="var(--color-secondary)" />
      {/* Flame */}
      <path
        d="M44 74 L50 92 L56 74 Z"
        fill="var(--color-accent)"
        className="widget-pulse"
        opacity="0.9"
      />
    </svg>
  )
}
