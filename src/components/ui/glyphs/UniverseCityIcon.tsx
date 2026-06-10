import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (universe-city): a world crowned with spires - the city that has
 *  grown to cover a whole world, distinct from the plain 'globe' (planet). */
export function UniverseCityIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="12" cy="14" r="7.5" />
      <path d="M4.8 11 Q12 8.5 19.2 11" />
      <path d="M4.8 17 Q12 19.5 19.2 17" />
      <path d="M9 6.9 V3.5 M12 6.3 V2.4 M15 6.9 V3.5" />
    </svg>
  )
}
