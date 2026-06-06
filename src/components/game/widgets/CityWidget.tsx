const BUILDINGS = [
  { x: 18, w: 12, h: 30 },
  { x: 32, w: 14, h: 48 },
  { x: 48, w: 10, h: 38 },
  { x: 60, w: 14, h: 56 },
  { x: 76, w: 10, h: 26 },
]

/** Era 12: an isometric-ish city skyline. */
export function CityWidget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <line x1="10" y1="86" x2="90" y2="86" stroke="var(--color-border)" strokeWidth="2" />
      {BUILDINGS.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x}
            y={86 - b.h}
            width={b.w}
            height={b.h}
            rx="1.5"
            fill="var(--color-surface)"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
          />
          <rect x={b.x + 3} y={86 - b.h + 4} width="2" height="2" fill="var(--color-accent)" />
          <rect
            x={b.x + b.w - 5}
            y={86 - b.h + 4}
            width="2"
            height="2"
            fill="var(--color-accent)"
          />
        </g>
      ))}
    </svg>
  )
}
