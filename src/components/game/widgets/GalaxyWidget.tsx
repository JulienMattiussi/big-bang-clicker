const STARS = Array.from({ length: 46 }, (_, i) => {
  const angle = i * 0.6
  const radius = 3 + i * 0.95
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
    r: 0.8 + (i % 3) * 0.4,
    accent: i % 5 === 0,
  }
})

/** Era 2: a spiral galaxy whose stars rotate slowly. */
export function GalaxyWidget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g className="widget-spin">
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={s.accent ? 'var(--color-accent)' : 'var(--color-fg)'}
            opacity={0.85}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="4" fill="var(--color-accent)" />
    </svg>
  )
}
