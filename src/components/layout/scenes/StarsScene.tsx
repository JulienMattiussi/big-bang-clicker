import type { ReactElement } from 'react'
import { STARS, svgClass, svgProps } from './shared'

/** Eras 2-4: first stars, stellar forges, accretion - a soft twinkling starfield. */
export function StarsScene(): ReactElement {
  return (
    <svg className={svgClass} {...svgProps}>
      <defs>
        {/* Tiny bright core fading to a soft halo on the near periphery. */}
        <radialGradient id="sb-star" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-fg)" stopOpacity="0.9" />
          <stop offset="30%" stopColor="var(--color-fg)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--color-fg)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Small diffuse points (a bright core with a soft glow), easy on the eyes. */}
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="url(#sb-star)"
          className="bg-twinkle"
          style={{ animationDelay: `-${s.delay}s`, animationDuration: `${s.dur}s` }}
        />
      ))}
    </svg>
  )
}
