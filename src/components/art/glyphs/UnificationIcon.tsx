import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (unification): lines converging from all sides into a single
 *  core - the grand unification, distinct from the 'crown' (empire). */
export function UnificationIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2 V5.4 M12 22 V18.6 M2 12 H5.4 M22 12 H18.6" />
      <path d="M4.6 4.6 L7 7 M19.4 4.6 L17 7 M4.6 19.4 L7 17 M19.4 19.4 L17 17" />
    </svg>
  )
}
