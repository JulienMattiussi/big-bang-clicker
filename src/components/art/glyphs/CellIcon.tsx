import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (cell): a membrane with an off-centre nucleus. */
export function CellIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <ellipse cx="12" cy="12" rx="9" ry="7.5" transform="rotate(-12 12 12)" />
      <circle cx="14.5" cy="13" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  )
}
