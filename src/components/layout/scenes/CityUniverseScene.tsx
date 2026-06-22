import type { ReactElement } from 'react'
import { StarsScene } from './StarsScene'
import { Defs } from './Defs'
import { mulberry32, svgClass, svgProps } from './shared'

/**
 * Era 19 (Death and birth): the universe gathered into one vast city. A nocturnal
 * skyline of towers with twinkling windows under the starfield, lit by the city's
 * collective glow. Decorative; transforms limited to opacity (twinkle) per the
 * scene rules.
 */
const rng = mulberry32(421)

interface Tower {
  x: number
  w: number
  h: number
}
interface Window {
  x: number
  y: number
  twinkle: boolean
  delay: number
}

const TOWERS: Tower[] = []
const WINDOWS: Window[] = []
{
  let x = -2
  while (x < 102) {
    const w = 2.6 + rng() * 4.6
    const h = 16 + rng() * 44
    const top = 100 - h
    TOWERS.push({ x, w, h })
    const cols = Math.max(1, Math.floor(w / 2.4))
    const rows = Math.floor(h / 4.6)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng() < 0.4) continue // not every window is lit
        WINDOWS.push({
          x: x + ((c + 0.5) * w) / cols - 0.3,
          y: top + 3 + r * 4.4,
          twinkle: rng() < 0.45,
          delay: rng() * 4,
        })
      }
    }
    x += w + 0.5 + rng() * 1.2
  }
}

export function CityUniverseScene(): ReactElement {
  return (
    <>
      <StarsScene />
      <svg className={svgClass} {...svgProps}>
        <Defs />
        {/* The city's collective glow on the horizon. */}
        <ellipse cx="50" cy="100" rx="72" ry="34" fill="url(#sb-accent)" opacity="0.5" />
        {/* Tower silhouettes. */}
        {TOWERS.map((t, i) => (
          <rect
            key={i}
            x={t.x}
            y={100 - t.h}
            width={t.w}
            height={t.h}
            fill="var(--color-accent)"
            opacity="0.16"
          />
        ))}
        {/* Lit windows; some twinkle. */}
        {WINDOWS.map((w, i) => (
          <rect
            key={i}
            x={w.x}
            y={w.y}
            width="0.6"
            height="0.9"
            rx="0.15"
            fill="var(--color-accent)"
            opacity="0.6"
            className={w.twinkle ? 'bg-twinkle' : undefined}
            style={w.twinkle ? { animationDelay: `-${w.delay}s`, animationDuration: '3.5s' } : undefined}
          />
        ))}
      </svg>
    </>
  )
}
