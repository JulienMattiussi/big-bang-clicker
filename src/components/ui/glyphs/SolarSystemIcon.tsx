import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (solar-system): a tilted orbital ellipse with a central sun and
 *  planets on it - distinct from the plain 'globe' (planet) resource. */
export function SolarSystemIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-20 12 12)" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="21.4" cy="8.6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="2.6" cy="15.4" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
