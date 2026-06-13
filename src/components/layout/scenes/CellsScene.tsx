import { useEffect, useRef, type ReactElement } from 'react'
import { Defs } from './Defs'
import { mulberry32, svgClass, svgProps } from './shared'

const rc = mulberry32(202)
const CELLS = Array.from({ length: 26 }, () => {
  const rx = 1.5 + rc() * 2.3
  const ry = 1 + rc() * 1.6
  // Slight tint variation between cells: mostly accent with a touch of secondary.
  const mix = 62 + rc() * 33
  return {
    x: 6 + rc() * 88,
    y: 8 + rc() * 84,
    rx,
    ry,
    rot: rc() * 180,
    // Nucleus offset within the cell (not always centred), organic look.
    nx: (rc() - 0.5) * rx * 0.9,
    ny: (rc() - 0.5) * ry * 0.9,
    tint: `color-mix(in srgb, var(--color-accent) ${mix.toFixed(0)}%, var(--color-secondary))`,
    // Per-cell drift (Lissajous), desynchronised: amplitudes, frequencies, phases.
    ax: 1.5 + rc() * 3,
    ay: 1.5 + rc() * 3,
    fx: 0.05 + rc() * 0.12,
    fy: 0.05 + rc() * 0.12,
    phx: rc() * Math.PI * 2,
    phy: rc() * Math.PI * 2,
    rotSpeed: (rc() - 0.5) * 12,
  }
})

/** Eras 5-6: building blocks and first life - cells gently swimming on Lissajous
 *  paths, softly out of focus so they recede behind the window. */
export function CellsScene(): ReactElement {
  const svgRef = useRef<SVGSVGElement>(null)
  // Each cell drifts on its own slow Lissajous path (desynchronised), driven by
  // rAF via the SVG transform attribute (reliable for translation). Disabled
  // under prefers-reduced-motion.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      const t = (now - start) / 1000
      const svg = svgRef.current
      for (let i = 0; i < CELLS.length; i++) {
        const c = CELLS[i]
        const x = c.x + c.ax * Math.sin(t * c.fx + c.phx)
        const y = c.y + c.ay * Math.cos(t * c.fy + c.phy)
        svg
          ?.querySelector(`[data-cell="${i}"]`)
          ?.setAttribute(
            'transform',
            `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(c.rot + t * c.rotSpeed).toFixed(1)})`,
          )
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    // Gentle soft-focus, like the terrestrial scene, so the cells recede behind the window.
    <svg ref={svgRef} className={svgClass} {...svgProps} style={{ filter: 'blur(2.5px)' }}>
      <Defs />
      {CELLS.map((c, i) => (
        <g key={i} data-cell={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
          <ellipse
            cx={0}
            cy={0}
            rx={c.rx}
            ry={c.ry}
            fill={c.tint}
            fillOpacity="0.1"
            stroke={c.tint}
            strokeOpacity="0.3"
            strokeWidth="0.4"
          />
          <circle cx={c.nx} cy={c.ny} r={c.ry * 0.4} fill={c.tint} opacity="0.28" />
        </g>
      ))}
    </svg>
  )
}
