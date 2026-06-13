import type { ReactElement } from 'react'
import { Defs } from './Defs'
import { svgClass, svgProps } from './shared'

/** Era 19: collapse / rebirth - lines converging on a pulsing core (contraction). */
export function SingularityScene(): ReactElement {
  return (
    <svg className={svgClass} {...svgProps}>
      <Defs />
      {/* Lines converging on the core (contraction). */}
      <g stroke="var(--color-accent)" strokeOpacity="0.18" strokeWidth="0.4">
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2
          return (
            <line key={i} x1={50 + Math.cos(a) * 60} y1={50 + Math.sin(a) * 60} x2="50" y2="50" />
          )
        })}
      </g>
      <circle cx="50" cy="50" r="26" fill="url(#sb-core)" className="bg-pulse" />
      <circle
        cx="50"
        cy="50"
        r="6"
        fill="var(--color-fg)"
        opacity="0.5"
        className="bg-pulse"
        style={{ animationDelay: '-2s' }}
      />
    </svg>
  )
}
