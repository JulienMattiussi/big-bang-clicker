import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (jerrycan): a fuel can with a top handle, filler cap and the
 *  characteristic X-ribbing on its face. */
export function JerrycanIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <rect x="6" y="7" width="12" height="13" rx="1.5" />
      <path d="M8.5 7 V5 H13 V7" />
      <path d="M15 7 V5.4 H17 V7" />
      <path d="M8.8 10 L15.2 17 M15.2 10 L8.8 17" />
    </svg>
  )
}
