import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (ship): a saucer-style starship (disc + dome + lights), distinct
 *  from the vertical 'rocket'. */
export function ShipIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <ellipse cx="12" cy="14" rx="9" ry="3" />
      <path d="M8 12.2 Q12 5 16 12.2" />
      <circle cx="8" cy="14.6" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14.6" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  )
}
