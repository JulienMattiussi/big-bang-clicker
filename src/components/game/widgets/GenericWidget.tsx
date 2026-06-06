const NODES = Array.from({ length: 6 }, (_, i) => {
  const a = (i * Math.PI) / 3
  return { x: 50 + 32 * Math.cos(a), y: 50 + 32 * Math.sin(a) }
})

/** Generic widget (node graph) for eras without a dedicated visual. */
export function GenericWidget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g className="widget-spin">
        <g stroke="var(--color-secondary)" strokeWidth="1" opacity="0.5">
          {NODES.map((n, i) => (
            <line key={i} x1="50" y1="50" x2={n.x} y2={n.y} />
          ))}
        </g>
        <g fill="var(--color-accent)">
          {NODES.map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r="4" />
          ))}
        </g>
      </g>
      <circle cx="50" cy="50" r="8" fill="var(--color-accent)" />
      <circle cx="50" cy="50" r="8" fill="var(--color-fg)" opacity="0.15" />
    </svg>
  )
}
