import type { ReactElement } from 'react'

export function StarField({
  stars,
  big = 1.3,
  small = 0.8,
}: {
  stars: readonly number[][]
  big?: number
  small?: number
}): ReactElement {
  return (
    <g aria-hidden>
      {stars.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? big : small}
          fill="var(--color-fg)"
          opacity="0.4"
        />
      ))}
    </g>
  )
}
