const SPARKS = [
  { x: 32, y: 34, r: 1.6, o: 0.8 },
  { x: 68, y: 30, r: 1.2, o: 0.6 },
  { x: 70, y: 64, r: 1.8, o: 0.7 },
  { x: 30, y: 66, r: 1.3, o: 0.6 },
  { x: 50, y: 26, r: 1, o: 0.5 },
  { x: 26, y: 50, r: 1.1, o: 0.5 },
  { x: 74, y: 48, r: 1.4, o: 0.6 },
]

/** Era 0: a plasma orb cooling down (hot -> cold). */
export function CoolingWidget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="bbc-cooling" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="65%" stopColor="var(--color-accent)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill="url(#bbc-cooling)" className="widget-pulse" />
      <g fill="var(--color-fg)">
        {SPARKS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
        ))}
      </g>
    </svg>
  )
}
