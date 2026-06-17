import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { viewBoxPoint } from './svgCoords'
import { useEraMechanic } from './useEraMechanic'
import { WidgetGalet } from './WidgetGalet'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

/** Wide scene: a young solar system. Sun at centre, clumps orbiting around it. */
const VBW = 170
const VBH = 44
const CX = 85
const CY = 22
const CLUMP_COUNT = 4
/** Sustained clicks inside one clump to collapse it into a planet. */
const PLANET_CLICKS = 6
/** Progress decays if you stop clicking the clump (you must follow it). */
const SUSTAIN_MS = 650
const HIT_R = 12
/** Above this many planets, the oldest fades out (discreetly). */
const MAX_PLANETS = 10
/** Fade-out duration before the planet is removed (ms). */
const PLANET_FADE_MS = 700
/** Planet colours: realistic, muted, varied (never the sun's yellow). */
const PLANET_COLORS = [
  'var(--planet-1)',
  'var(--planet-2)',
  'var(--planet-3)',
  'var(--planet-4)',
  'var(--planet-5)',
  'var(--planet-6)',
]

const CLUMP_INDICES = Array.from({ length: CLUMP_COUNT }, (_, i) => i)

/** Irregular particle offsets for a formless clump (local coords around 0,0). */
const CLUMP_DOTS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2
  const d = 2 + (i % 3) * 2.4
  return { x: Math.cos(a) * d, y: Math.sin(a * 1.3) * d, r: 0.9 + (i % 2) * 0.7 }
})

interface Clump {
  rx: number
  ry: number
  speed: number
  spin: number
  phase: number
  progress: number
  lastTouch: number
  colorIndex: number
}
interface Planet {
  id: number
  colorIndex: number
  rx: number
  ry: number
  speed: number
  phase: number
  /** Clock (ms) at birth, so the orbit angle is measured FROM the spawn instant
   *  and the planet starts exactly at the accretion point. */
  bornMs: number
  /** Set when over the cap: the planet fades out, then is removed. */
  fading?: boolean
}

/**
 * Era 4 (Solar system), full-width: a rotating young system. Formless particle
 * clumps drift on orbits around the sun. Clicking empty space gathers dust
 * (+dust); clicking INSIDE a moving clump gathers dust AND builds it up - keep
 * clicking the same clump as it moves and it collapses into a planet (free,
 * varied colour, never the sun's yellow), which then joins the orbit. Everything
 * turns. Keyboard: Enter builds up the most-advanced clump (auto-aim).
 */
export function AccretionDisk({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const svgRef = useRef<SVGSVGElement>(null)
  const nextId = useRef(0)
  const clumps = useRef<Clump[]>(
    Array.from({ length: CLUMP_COUNT }, (_, i) => ({
      rx: 42 + i * 12,
      ry: 14 + i * 3,
      speed: 0.16 + i * 0.05,
      spin: 0.5 + i * 0.15,
      phase: (i / CLUMP_COUNT) * Math.PI * 2,
      progress: 0,
      lastTouch: 0,
      colorIndex: i % PLANET_COLORS.length,
    })),
  )
  const pos = useRef(Array.from({ length: CLUMP_COUNT }, () => ({ x: CX, y: CY })))

  const [planets, setPlanets] = useState<Planet[]>([])
  const planetsRef = useRef<Planet[]>([])
  const [puffs, setPuffs] = useState<{ id: number; x: number; y: number }[]>([])
  const [burst, setBurst] = useState<{ id: number; x: number; y: number; color: string } | null>(
    null,
  )

  useEffect(() => {
    planetsRef.current = planets
  }, [planets])

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      const svg = svgRef.current
      const tt = (now - start) / 1000
      const cs = clumps.current
      for (let i = 0; i < cs.length; i++) {
        const c = cs[i]!
        if (c.progress > 0 && now - c.lastTouch > SUSTAIN_MS) c.progress = 0
        const theta = c.phase + tt * c.speed
        const x = CX + c.rx * Math.cos(theta)
        const y = CY + c.ry * Math.sin(theta)
        pos.current[i] = { x, y }
        svg
          ?.querySelector(`[data-clump="${i}"]`)
          ?.setAttribute(
            'transform',
            `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(tt * 40 * c.spin).toFixed(1)})`,
          )
        const k = c.progress / PLANET_CLICKS
        const pe = svg?.querySelector(`[data-prog="${i}"]`)
        if (pe) {
          pe.setAttribute('r', (1.5 + k * 6).toFixed(2))
          pe.setAttribute('opacity', (0.1 + 0.6 * k).toFixed(2))
        }
        // The cloud condenses inward as clicks accumulate (re-expands on reset).
        svg
          ?.querySelector(`[data-cloud="${i}"]`)
          ?.setAttribute('transform', `scale(${(1 - 0.55 * k).toFixed(3)})`)
      }
      for (const p of planetsRef.current) {
        const theta = p.phase + ((now - p.bornMs) / 1000) * p.speed
        svg
          ?.querySelector(`[data-planet="${p.id}"]`)
          ?.setAttribute(
            'transform',
            `translate(${(CX + p.rx * Math.cos(theta)).toFixed(2)} ${(CY + p.ry * Math.sin(theta)).toFixed(2)})`,
          )
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const addPuff = (x: number, y: number) =>
    setPuffs((p) => [...p.slice(-7), { id: nextId.current++, x, y }])

  const spawnPlanet = (colorIndex: number, at: { x: number; y: number }) => {
    // Flattened, tilted orbit (ry = 0.4 rx) chosen so it passes EXACTLY through
    // the accretion point at birth: the planet appears where the dust collapsed
    // (under the cursor), then orbits from there.
    const dx = at.x - CX
    const dy = at.y - CY
    const rx = Math.max(14, Math.hypot(dx, dy / 0.4))
    const planet: Planet = {
      id: nextId.current++,
      colorIndex,
      rx,
      ry: rx * 0.4,
      speed: 0.1 + Math.random() * 0.14,
      phase: Math.atan2(dy / 0.4, dx),
      bornMs: performance.now(),
    }
    // Over the cap, the oldest solid planet fades out (then is removed) rather
    // than vanishing abruptly.
    const solid = planetsRef.current.filter((p) => !p.fading)
    const fadeId = solid.length + 1 > MAX_PLANETS ? solid[0]!.id : undefined
    setPlanets((ps) => {
      const next = [...ps, planet]
      return fadeId === undefined
        ? next
        : next.map((p) => (p.id === fadeId ? { ...p, fading: true } : p))
    })
    if (fadeId !== undefined) {
      window.setTimeout(() => setPlanets((ps) => ps.filter((p) => p.id !== fadeId)), PLANET_FADE_MS)
    }
    setBurst({ id: nextId.current++, x: at.x, y: at.y, color: PLANET_COLORS[colorIndex]! })
  }

  const accrete = (e: MouseEvent) => {
    gainBase()
    const keyboard = e.detail === 0
    const p = keyboard ? null : viewBoxPoint(svgRef.current, e.clientX, e.clientY, VBW, VBH)
    const px = p?.x ?? CX
    const py = p?.y ?? CY

    const cs = clumps.current
    let hit = -1
    if (keyboard) {
      let bp = -1
      for (let i = 0; i < cs.length; i++) {
        if (cs[i]!.progress > bp) {
          bp = cs[i]!.progress
          hit = i
        }
      }
    } else {
      let bestD = HIT_R
      for (let i = 0; i < cs.length; i++) {
        const d = Math.hypot(px - pos.current[i]!.x, py - pos.current[i]!.y)
        if (d < bestD) {
          bestD = d
          hit = i
        }
      }
    }

    if (hit >= 0) {
      const c = cs[hit]!
      const at = keyboard ? pos.current[hit]! : { x: px, y: py }
      c.lastTouch = performance.now()
      c.progress += 1
      addPuff(at.x, at.y)
      if (c.progress >= PLANET_CLICKS) {
        complete()
        spawnPlanet(c.colorIndex, pos.current[hit]!)
        c.progress = 0
        // The clump scatters and re-forms elsewhere, a new colour seed.
        c.phase = Math.random() * Math.PI * 2
        c.rx = 34 + Math.random() * 42
        c.ry = c.rx * (0.32 + Math.random() * 0.12)
        c.speed = 0.12 + Math.random() * 0.16
        c.colorIndex = Math.floor(Math.random() * PLANET_COLORS.length)
      }
    } else {
      addPuff(px, py)
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className="text-base font-semibold text-fg">{verb}</span>
      <button
        type="button"
        aria-label={verb}
        onClick={accrete}
        className="group w-full max-w-5xl rounded-lg transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VBW} ${VBH}`}
          className="w-full overflow-visible transition group-hover:brightness-110"
          style={{ aspectRatio: `${VBW} / ${VBH}` }}
        >
          <defs>
            <radialGradient id="acc-sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-fg)" stopOpacity="1" />
              <stop offset="35%" stopColor="var(--color-accent)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="acc-clump" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
            </radialGradient>
            {/* Sphere shading: transparent (lit, top-left) to dark (terminator),
                overlaid on any planet colour so it reads as a 3D body, not a flat disc. */}
            <radialGradient id="acc-shade" cx="36%" cy="32%" r="78%">
              <stop offset="0%" stopColor="var(--color-bg)" stopOpacity="0" />
              <stop offset="58%" stopColor="var(--color-bg)" stopOpacity="0" />
              <stop offset="100%" stopColor="var(--color-bg)" stopOpacity="0.6" />
            </radialGradient>
            <radialGradient id="acc-burst" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-fg)" stopOpacity="0.95" />
              <stop offset="55%" stopColor="var(--color-fg)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-fg)" stopOpacity="0" />
            </radialGradient>
            <filter id="acc-blur" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>

          {[34, 54, 74].map((r) => (
            <ellipse
              key={r}
              cx={CX}
              cy={CY}
              rx={r}
              ry={r * 0.4}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="0.3"
              strokeDasharray="1 3"
              opacity="0.5"
            />
          ))}

          <circle
            cx={CX}
            cy={CY}
            r="26"
            fill="url(#acc-sun)"
            opacity="0.5"
            className="widget-pulse"
          />
          <circle cx={CX} cy={CY} r="13" fill="url(#acc-sun)" opacity="0.95" />
          <circle cx={CX} cy={CY} r="6" fill="var(--color-fg)" />

          {planets.map((p) => (
            <g
              key={p.id}
              data-planet={p.id}
              style={{ opacity: p.fading ? 0 : 1, transition: `opacity ${PLANET_FADE_MS}ms ease` }}
            >
              <circle className="pop-in" r="2.8" fill={PLANET_COLORS[p.colorIndex]!} />
              {/* Shaded terminator (makes it a sphere, not a flat tint). */}
              <circle r="2.8" fill="url(#acc-shade)" />
              <circle r="0.7" cx="-1" cy="-1.1" fill="var(--color-fg)" opacity="0.45" />
            </g>
          ))}

          {CLUMP_INDICES.map((i) => (
            <g key={i} data-clump={i}>
              {/* Cloud (haze + particles) that CONDENSES toward the centre as you
                  click (scaled down by rAF with progress). */}
              <g data-cloud={i}>
                <circle r="8" fill="url(#acc-clump)" filter="url(#acc-blur)" />
                {CLUMP_DOTS.map((d, j) => (
                  <circle
                    key={j}
                    cx={d.x}
                    cy={d.y}
                    r={d.r}
                    fill="var(--color-muted)"
                    opacity="0.8"
                  />
                ))}
              </g>
              {/* Forming-planet core (grows/brightens with sustained clicks). */}
              <circle data-prog={i} r="1.5" fill="var(--color-fg)" opacity="0.1" />
            </g>
          ))}

          {puffs.map((p) => (
            <circle
              key={p.id}
              className="gas-puff"
              cx={p.x}
              cy={p.y}
              r="4"
              fill="url(#acc-clump)"
            />
          ))}

          {burst ? (
            <circle
              key={burst.id}
              cx={burst.x}
              cy={burst.y}
              r="9"
              fill="url(#acc-burst)"
              className="light-burst"
            />
          ) : null}
        </svg>
      </button>
      <span className="inline-flex items-center justify-center gap-1.5 text-xs text-muted">
        {t('accretion.hint')}
        <WidgetGalet />
      </span>
    </div>
  )
}
