import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (fusion): two nuclei merging into a bright core - stellar fusion,
 *  distinct from the Big Bang's 'flame'. */
export function FusionIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="9" cy="12" r="4" />
      <circle cx="15" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  )
}
