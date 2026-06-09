import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (electron): a dot on an orbit circle. */
export function ElectronIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="20" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}
