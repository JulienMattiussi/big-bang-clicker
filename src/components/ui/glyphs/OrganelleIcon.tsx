import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Custom glyph (organelle): a mitochondrion, an oval ringed by cristae folds. */
export function OrganelleIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <g transform="rotate(-25 12 12)">
        <ellipse cx="12" cy="12" rx="9.5" ry="5.5" />
        <path d="M4.5 12 q2.4 -3.6 4.8 0 t4.8 0 t4.8 0" fill="none" />
      </g>
    </svg>
  )
}
