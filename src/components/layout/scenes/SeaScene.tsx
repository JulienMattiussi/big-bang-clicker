import type { ReactElement } from 'react'
import { Defs } from './Defs'
import { mulberry32, svgClass, svgProps } from './shared'

const rb = mulberry32(303)
const BUBBLES = Array.from({ length: 18 }, () => ({
  x: rb() * 100,
  size: 4 + rb() * 12,
  delay: rb() * 9,
  dur: 7 + rb() * 6,
}))

/** Eras 7-9: oxygenation, eukaryotes, Cambrian seas - a swaying organic sea with
 *  fronds and rising bubbles, lightly out of focus. */
export function SeaScene(): ReactElement {
  return (
    // A light soft-focus (lighter than the cells/land scenes) on the marine decor.
    <div className="absolute inset-0" style={{ filter: 'blur(1.5px)' }}>
      <div className="bg-sway absolute inset-0">
        <svg className={svgClass} {...svgProps}>
          <Defs />
          <circle
            cx="50"
            cy="60"
            r="46"
            fill="url(#sb-secondary)"
            opacity="0.2"
            className="bg-breathe"
          />
          {/* Fronds swaying near the seabed. */}
          <g
            stroke="var(--color-accent)"
            strokeOpacity="0.3"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
          >
            <path d="M14 101 Q18 80 13 64" />
            <path d="M24 101 Q20 84 26 70" />
            <path d="M80 101 Q84 82 78 66" />
            <path d="M90 101 Q86 86 92 72" />
          </g>
        </svg>
      </div>
      {/* Rising bubbles (HTML so the upward translate is reliable). */}
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="bg-rise absolute bottom-0 rounded-full"
          style={{
            left: `${b.x}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            backgroundColor: 'var(--color-secondary)',
            opacity: 0.25,
            animationDelay: `-${b.delay}s`,
            animationDuration: `${b.dur}s`,
          }}
        />
      ))}
    </div>
  )
}
