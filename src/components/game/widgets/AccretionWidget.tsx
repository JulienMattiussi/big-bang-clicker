const DISC = Array.from({ length: 40 }, (_, i) => {
  const a = i * 0.45
  const r = 16 + i * 0.7
  return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) * 0.4, accent: i % 4 === 0 }
})

/** Era 4: accretion disc condensing dust around a forming planet. */
export function AccretionWidget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g className="widget-spin">
        {DISC.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.accent ? 1.6 : 1}
            fill={d.accent ? 'var(--color-accent)' : 'var(--color-fg)'}
            opacity={0.8}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="10" fill="var(--color-accent)" className="widget-pulse" />
      <circle cx="50" cy="50" r="10" fill="var(--color-secondary)" opacity="0.3" />
    </svg>
  )
}
