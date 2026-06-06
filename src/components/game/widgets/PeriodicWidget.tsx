const CELLS = Array.from({ length: 24 }, (_, i) => {
  const col = i % 6
  const row = Math.floor(i / 6)
  return { x: 6 + col * 15, y: 18 + row * 15, filled: (i * 7) % 5 < 2 }
})

/** Era 3: a mini periodic table that fills up (forging elements). */
export function PeriodicWidget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {CELLS.map((cell, i) => (
        <rect
          key={i}
          x={cell.x}
          y={cell.y}
          width="13"
          height="13"
          rx="2"
          fill={cell.filled ? 'var(--color-accent)' : 'var(--color-surface)'}
          stroke="var(--color-border)"
          strokeWidth="1"
        />
      ))}
    </svg>
  )
}
