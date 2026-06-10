import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (flora): a sprout - a stem with two leaves unfurling. */
export function FloraIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <path d="M12 21 V9" />
      <path d="M12 15 Q6 14.5 4.5 9 Q10.5 9 12 15 Z" fill="currentColor" stroke="none" />
      <path d="M12 12 Q18 11.5 19.5 6 Q13.5 6 12 12 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}
