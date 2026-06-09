import type { ReactElement, SVGProps } from 'react'
import { GLYPH_PROPS } from './glyphProps'

/** Spikes for the virus glyph (capsid + glycoprotein knobs), precomputed. */
const SPIKES = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2
  const c = Math.cos(a)
  const s = Math.sin(a)
  return {
    x1: 12 + c * 6,
    y1: 12 + s * 6,
    x2: 12 + c * 9.2,
    y2: 12 + s * 9.2,
    kx: 12 + c * 10,
    ky: 12 + s * 10,
  }
})

/** Custom glyph (virus): a capsid hedged with spiked glycoproteins (VIH-like). */
export function VirusIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="12" cy="12" r="5.5" />
      {SPIKES.map((sp, i) => (
        <g key={i}>
          <line x1={sp.x1} y1={sp.y1} x2={sp.x2} y2={sp.y2} />
          <circle cx={sp.kx} cy={sp.ky} r="1.3" fill="currentColor" stroke="none" />
        </g>
      ))}
    </svg>
  )
}
