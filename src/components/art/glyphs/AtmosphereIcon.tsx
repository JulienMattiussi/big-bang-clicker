import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Gas particles ringing the atmosphere glyph, evenly spaced around the planet. */
const DOTS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2
  return { cx: 12 + Math.cos(a) * 9.3, cy: 12 + Math.sin(a) * 9.3 }
})

/** Atmosphere glyph: the Earth ringed by gas particles all around. */
export function AtmosphereIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="12" cy="12" r="5.5" />
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r="1" fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}
