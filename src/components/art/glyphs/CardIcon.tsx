import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (card): a playing card with a centred diamond pip. */
export function CardIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M12 8 L14.3 12 L12 16 L9.7 12 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}
