import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Scattered specks for the dust glyph (varied sizes), precomputed. */
const SPECKS = [
  { cx: 7, cy: 8, r: 1.7 },
  { cx: 14.5, cy: 6, r: 1.1 },
  { cx: 17.5, cy: 11, r: 1.8 },
  { cx: 10, cy: 13, r: 1.3 },
  { cx: 15, cy: 17, r: 1.5 },
  { cx: 6, cy: 16.5, r: 1 },
  { cx: 11.5, cy: 9.5, r: 0.9 },
]

/** Custom glyph (dust): a scatter of fine grains, distinct from the sparkle. */
export function DustIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      {SPECKS.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}
