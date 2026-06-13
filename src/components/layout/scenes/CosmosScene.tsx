import type { ReactElement } from 'react'
import { Defs } from './Defs'
import { STARS, svgClass, svgProps } from './shared'

/** Eras 15-18: space, galaxies, the universe-city - a faint spiral galaxy over a
 *  twinkling starfield. */
export function CosmosScene(): ReactElement {
  return (
    <svg className={svgClass} {...svgProps}>
      <Defs />
      <g className="bg-breathe" style={{ transformOrigin: 'center' }}>
        <g transform="rotate(20 50 48)">
          <ellipse cx="50" cy="48" rx="38" ry="12" fill="url(#sb-secondary)" opacity="0.4" />
          <ellipse cx="50" cy="48" rx="22" ry="8" fill="url(#sb-core)" opacity="0.6" />
        </g>
      </g>
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r * 0.85}
          fill="var(--color-fg)"
          className="bg-twinkle"
          style={{ animationDelay: `-${s.delay}s`, animationDuration: `${s.dur}s` }}
        />
      ))}
    </svg>
  )
}
