import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (nucleon): a cluster of balls. */
export function NucleonIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="9" cy="10" r="4" />
      <circle cx="16" cy="10" r="4" />
      <circle cx="12" cy="16" r="4" />
    </svg>
  )
}
