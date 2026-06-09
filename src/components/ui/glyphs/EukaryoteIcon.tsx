import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Small organelles dotted inside the eukaryote glyph, precomputed. */
const ORGANELLES = [
  { cx: 7.2, cy: 8.5 },
  { cx: 16.5, cy: 9 },
  { cx: 8, cy: 16 },
  { cx: 16, cy: 15.5 },
]

/** Custom glyph (eukaryote): a complex cell, large nucleus ringed by organelles. */
export function EukaryoteIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <ellipse cx="12" cy="12" rx="9.5" ry="8" transform="rotate(-12 12 12)" />
      <circle cx="12" cy="12" r="3.2" />
      {ORGANELLES.map((o, i) => (
        <circle key={i} cx={o.cx} cy={o.cy} r="1.2" fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}
