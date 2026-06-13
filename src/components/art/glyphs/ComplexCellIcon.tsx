import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Granules scattered in the complex-cell's cytoplasm, precomputed. */
const GRANULES = [
  { x1: 15.8, y1: 8, x2: 16.9, y2: 7.7 },
  { x1: 8.4, y1: 7, x2: 7.6, y2: 6.6 },
  { x1: 7.6, y1: 15, x2: 6.8, y2: 15.7 },
  { x1: 15.4, y1: 16.4, x2: 16.2, y2: 16.9 },
  { x1: 17.4, y1: 12.4, x2: 18.4, y2: 12.3 },
]

/**
 * Custom glyph (complex cell): an irregular membrane holding two ringed
 * organelles and scattered cytoplasm granules. Era icon for "the complex cell".
 */
export function ComplexCellIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <path d="M19.86 8.89 Q21.5 12 19.58 14.83 Q17.66 17.66 14.83 19.08 Q12 20.5 8.82 19.43 Q5.64 18.36 4.07 15.18 Q2.5 12 4.42 9.17 Q6.34 6.34 9.17 5.17 Q12 4 15.11 4.89 Q18.22 5.78 19.86 8.89 Z" />
      <circle cx="9.6" cy="10.4" r="2.6" />
      <circle cx="9.6" cy="10.4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13.6" r="2.6" />
      <circle cx="14" cy="13.6" r="0.9" fill="currentColor" stroke="none" />
      {GRANULES.map((g, i) => (
        <line key={i} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} />
      ))}
    </svg>
  )
}
