import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (star-cluster): a scatter of stars of varying size - a swarm of
 *  the first stars, distinct from the single 'star' resource. */
export function StarClusterIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <g fill="currentColor" stroke="none">
        <circle cx="12" cy="5" r="1.9" />
        <circle cx="6" cy="8" r="1.3" />
        <circle cx="17.5" cy="8" r="1.2" />
        <circle cx="9.5" cy="12.5" r="1" />
        <circle cx="15.5" cy="13" r="1.6" />
        <circle cx="20" cy="15" r="0.9" />
        <circle cx="6.5" cy="17" r="1.2" />
        <circle cx="12.5" cy="18.5" r="1.1" />
      </g>
    </svg>
  )
}
