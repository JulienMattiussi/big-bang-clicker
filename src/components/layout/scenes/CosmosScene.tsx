import type { CSSProperties, ReactElement } from 'react'
import { StarsScene } from './StarsScene'
import { mulberry32 } from './shared'

/** One blinking nav light: a bright dot with a soft halo, both pulsing. */
function NavLight({ x, y, delay }: { x: number; y: number; delay: string }): ReactElement {
  const blink = { animationDelay: delay, animationDuration: '1.2s' }
  return (
    <g className="bg-twinkle" style={blink}>
      <circle cx={x} cy={y} r="3" fill="var(--color-accent)" opacity="0.3" />
      <circle cx={x} cy={y} r="1.5" fill="var(--color-accent)" />
    </g>
  )
}

/** A ship in profile (nose to the right): hull, fin, cockpit, engine glow and
 *  blinking nav lights - so it reads as a vessel, not an asteroid. */
function Ship({ size }: { size: number }): ReactElement {
  return (
    <svg width={size} height={(size * 14) / 28} viewBox="0 0 28 14" fill="none" aria-hidden>
      <path d="M1 7 L6 5 L6 9 Z" fill="var(--color-accent)" opacity="0.6" />
      <path d="M6 4.4 H18 Q26 7 18 9.6 H6 Q4 7 6 4.4 Z" fill="var(--color-fg)" opacity="0.5" />
      <path d="M9 4.4 L8 2.2 L13.5 4.4 Z" fill="var(--color-fg)" opacity="0.4" />
      <circle cx="16" cy="7" r="1.1" fill="var(--color-fg)" opacity="0.5" />
      <NavLight x={9.5} y={2} delay="-0.2s" />
      <NavLight x={9.5} y={12} delay="-0.8s" />
      <NavLight x={19.5} y={7} delay="-0.5s" />
    </svg>
  )
}

/**
 * Eras 15-17 (space conquest onward): the same twinkling starfield as the first
 * stars, with a few ships drifting across now and then - and more of them each
 * later era (the fleet grows as humanity spreads).
 */
export function CosmosScene({ eraIndex }: { eraIndex: number }): ReactElement {
  const count = ({ 15: 2, 16: 8, 17: 16 } as Record<number, number>)[eraIndex] ?? 2
  const rng = mulberry32(900 + eraIndex)
  const VH_PER_VW = 0.5625 // 16:9, to turn the path angle into a visual heading
  const ships = Array.from({ length: count }, () => {
    // Each ship flies along its OWN heading across the screen (horizontal,
    // vertical or any diagonal), offset sideways so the lanes don't overlap.
    const theta = rng() * Math.PI * 2
    const cos = Math.cos(theta)
    const sin = Math.sin(theta)
    const perp = (rng() * 2 - 1) * 34 // sideways offset of the lane
    const cx = 50 - perp * sin // lane centre (vw)
    const cy = 50 + perp * cos // lane centre (vh)
    const R = 95 // half-length: starts/ends well off-screen
    return {
      dur: 16 + rng() * 18,
      delay: rng() * 30,
      size: 30 + rng() * 24,
      fromX: cx - R * cos,
      toX: cx + R * cos,
      fromY: cy - R * sin,
      toY: cy + R * sin,
      angle: (Math.atan2(sin * VH_PER_VW, cos) * 180) / Math.PI, // nose along the route
    }
  })
  return (
    <>
      <StarsScene />
      <div className="absolute inset-0 overflow-hidden">
        {ships.map((s, i) => (
          <span
            key={i}
            className="bg-cross absolute"
            style={
              {
                animationDuration: `${s.dur}s`,
                animationDelay: `-${s.delay}s`,
                '--bx-from': `${s.fromX}vw`,
                '--bx-to': `${s.toX}vw`,
                '--by-from': `${s.fromY}vh`,
                '--by-to': `${s.toY}vh`,
              } as CSSProperties
            }
          >
            <span className="inline-block" style={{ transform: `rotate(${s.angle}deg)` }}>
              <Ship size={s.size} />
            </span>
          </span>
        ))}
      </div>
    </>
  )
}
