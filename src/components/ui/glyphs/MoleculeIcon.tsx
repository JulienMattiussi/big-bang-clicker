import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (molecule): a water-like ball-and-stick (one O, two H, bent). */
export function MoleculeIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <line x1="12" y1="9" x2="6.5" y2="16" />
      <line x1="12" y1="9" x2="17.5" y2="16" />
      <circle cx="12" cy="9" r="3.4" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="16.5" r="2.3" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="16.5" r="2.3" fill="currentColor" stroke="none" />
    </svg>
  )
}
