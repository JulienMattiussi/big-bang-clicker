import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (burst): a bright core with radiating rays - the final cosmic
 *  explosion (era 19), distinct from the Big Bang's 'flame'. */
export function BurstIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
      <path d="M12 1.5 V5 M12 19 V22.5 M1.5 12 H5 M19 12 H22.5 M4.6 4.6 L7.2 7.2 M19.4 4.6 L16.8 7.2 M4.6 19.4 L7.2 16.8 M19.4 19.4 L16.8 16.8" />
    </svg>
  )
}
