const ORGANELLES = [
  { x: 38, y: 42, r: 5 },
  { x: 60, y: 38, r: 3.5 },
  { x: 58, y: 62, r: 4.5 },
  { x: 40, y: 64, r: 3 },
]

/** Era 6: a cell (membrane + nucleus + organelles), gently pulsing. */
export function CellWidget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="var(--color-secondary)"
        opacity="0.12"
        stroke="var(--color-secondary)"
        strokeWidth="1.5"
        className="widget-pulse"
      />
      <g fill="var(--color-secondary)" opacity="0.7">
        {ORGANELLES.map((o, i) => (
          <circle key={i} cx={o.x} cy={o.y} r={o.r} />
        ))}
      </g>
      <circle cx="50" cy="50" r="9" fill="var(--color-accent)" />
    </svg>
  )
}
