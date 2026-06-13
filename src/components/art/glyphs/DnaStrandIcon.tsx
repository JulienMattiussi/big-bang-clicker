import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (dna-strand): a single helical strand with a few base stubs - the
 *  building blocks of life, distinct from the double-helix 'dna' (RNA) resource. */
export function DnaStrandIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <path d="M10 3 C16 6 16 10 10 12 C4 14 4 18 10 21" />
      <path d="M13 6.2 L8.6 7.4 M5.6 16.4 L10.2 17.6" strokeWidth="1.4" />
    </svg>
  )
}
