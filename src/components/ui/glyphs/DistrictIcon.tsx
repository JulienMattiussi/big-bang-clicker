import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (district): a cluster of towers of differing heights - a city
 *  district, distinct from the single 'city' building icon. */
export function DistrictIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <rect x="3.5" y="11" width="5" height="10" rx="0.5" />
      <rect x="9.5" y="6" width="5" height="15" rx="0.5" />
      <rect x="15.5" y="13" width="5" height="8" rx="0.5" />
    </svg>
  )
}
