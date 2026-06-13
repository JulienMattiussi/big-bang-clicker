import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (organism): a trilobite, the iconic Cambrian animal. */
export function TrilobiteIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <ellipse cx="12" cy="12" rx="7.5" ry="9" />
      <path d="M12 4 V20" />
      <path d="M6 9 H18 M5.5 13 H18.5 M7 17 H17" strokeWidth="1.4" />
      <circle cx="9.4" cy="7.4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="7.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}
