import type { ReactElement } from 'react'
import { Defs } from './Defs'
import { svgClass, svgProps } from './shared'

/** Eras 0-1: formless luminous primordial gas, slowly breathing and drifting. */
export function PlasmaScene(): ReactElement {
  return (
    <div className="bg-drift absolute inset-0">
      <svg className={svgClass} {...svgProps}>
        <Defs />
        <g filter="url(#sb-blur)">
          <circle cx="30" cy="34" r="36" fill="url(#sb-accent)" className="bg-breathe" />
          <circle
            cx="72"
            cy="62"
            r="42"
            fill="url(#sb-secondary)"
            className="bg-breathe"
            style={{ animationDelay: '-3s' }}
          />
          <circle
            cx="58"
            cy="26"
            r="26"
            fill="url(#sb-accent)"
            className="bg-breathe"
            style={{ animationDelay: '-6s' }}
          />
          <circle
            cx="20"
            cy="74"
            r="30"
            fill="url(#sb-secondary)"
            className="bg-breathe"
            style={{ animationDelay: '-4.5s' }}
          />
        </g>
      </svg>
    </div>
  )
}
