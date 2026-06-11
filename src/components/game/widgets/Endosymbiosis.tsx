import { useEffect, useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { useTranslation } from '@/i18n/useTranslation'
import { viewBoxPoint } from './svgCoords'
import type { EraDef } from '@/lib/types'

/** Organites engulfed before the host matures into a eukaryote. */
const NEED = 5
const TINTS = ['var(--color-accent)', 'var(--color-secondary)', 'var(--color-octarine)']
/** Travel duration; keep in sync with `.engulf-travel` in index.css. */
const TRAVEL_MS = 500

/** How many organelles drift on the ring at the start of each cycle. */
const RING_SIZE = 6

type Point = { x: number; y: number }
type Organelle = { id: number; tint: string; shape: number }
type Traveler = {
  id: number
  from: Point
  to: Point
  tint: string
  shape: number
  completing: boolean
}

/**
 * Smooth closed blob path (centred on 0,0) from a list of per-vertex radii:
 * each vertex becomes a quadratic control point and the segment midpoints the
 * on-curve anchors. Irregular radii give organic, non-circular organelles.
 */
function blobPath(radii: number[], rot = 0, cx = 0, cy = 0): string {
  const n = radii.length
  const pt = (i: number) => {
    const a = (i / n) * Math.PI * 2 + rot
    return { x: cx + Math.cos(a) * radii[i % n], y: cy + Math.sin(a) * radii[i % n] }
  }
  const mid = (i: number) => {
    const p = pt(i)
    const q = pt(i + 1)
    return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
  }
  const r = (v: number) => Math.round(v * 100) / 100
  const start = mid(n - 1)
  let d = `M${r(start.x)} ${r(start.y)}`
  for (let i = 0; i < n; i++) {
    const v = pt(i)
    const m = mid(i)
    d += ` Q${r(v.x)} ${r(v.y)} ${r(m.x)} ${r(m.y)}`
  }
  return `${d} Z`
}

/** A handful of irregular organelle outlines (vesicle, elongated, lumpy). */
const SHAPES = [
  blobPath([4.6, 4.0, 4.7, 4.1, 4.5, 3.9]),
  blobPath([5.3, 3.7, 3.3, 3.8, 5.3, 3.7, 3.3, 3.8], 0.35),
  blobPath([4.4, 3.4, 4.9, 3.6, 4.6, 3.3, 4.8, 3.7]),
]

/**
 * Host membrane outline (~r20 around 50,50), deterministically reshaped from a
 * seed so every matured eukaryote looks slightly different, never a clean circle.
 */
function hostPath(seed: number): string {
  const radii = Array.from(
    { length: 8 },
    (_, i) => 20 + 2.4 * Math.sin(seed * 2.1 + i * 1.7) + 1.3 * Math.cos(seed * 1.3 + i * 2.9),
  )
  return blobPath(radii, -Math.PI / 2 + seed * 0.2, 50, 50)
}

/** Even placement on the ring for organelle `i` of `n` still present, so the
 *  survivors always stay evenly spread (no lopsided gaps) and slide there. */
function ringPos(i: number, n: number): Point {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2
  return { x: 50 + Math.cos(a) * 34, y: 50 + Math.sin(a) * 30 }
}

/** A fresh ring of organelles, with ids continuing from `startId`. */
function makeRing(startId: number): Organelle[] {
  return Array.from({ length: RING_SIZE }, (_, i) => ({
    id: startId + i,
    tint: TINTS[i % TINTS.length],
    shape: i % SHAPES.length,
  }))
}

/** Golden-angle placement spreads engulfed organelles evenly inside the host. */
function innerPos(k: number): Point {
  const a = k * 2.39996
  const d = 3 + (k % 3) * 3
  return { x: 50 + Math.cos(a) * d, y: 50 + Math.sin(a) * d }
}

/** A single organelle gliding from the ring into the host, then settling. */
function FlyingOrganelle({ traveler, onArrive }: { traveler: Traveler; onArrive: () => void }) {
  const [pos, setPos] = useState(traveler.from)
  useEffect(() => {
    // Paint at the start point first, then flip to the target so the
    // transition has somewhere to animate from.
    const raf = requestAnimationFrame(() => setPos(traveler.to))
    const timer = setTimeout(onArrive, TRAVEL_MS + 40)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
    // Mount once per traveler; ids are unique so the component is fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <path
      className="engulf-travel"
      d={SHAPES[traveler.shape]}
      fill={traveler.tint}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    />
  )
}

/**
 * Era 8 (Eukaryotes): endosymbiosis. A host cell sits at the centre, ringed by
 * drifting organelles. Click one to engulf it (+1 organelle): it glides across
 * the membrane and settles inside. Engulf enough and the host matures into a
 * complex eukaryote (free) and starts fresh. A deliberate combine gesture, new here.
 */
export function Endosymbiosis({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const svgRef = useRef<SVGSVGElement>(null)
  const nextId = useRef(0)
  // Counts organelles already heading for / living inside the host, so each
  // engulf lands in a fresh inner slot even while others are still in flight.
  const placed = useRef(0)
  const [inner, setInner] = useState<
    { id: number; x: number; y: number; tint: string; shape: number }[]
  >([])
  const [travelers, setTravelers] = useState<Traveler[]>([])
  const [bloom, setBloom] = useState(0)
  // A ring organelle leaves for good when engulfed; the survivors redistribute
  // evenly. The ring only repopulates once the host has matured into a eukaryote.
  const ringId = useRef(RING_SIZE)
  const [ring, setRing] = useState<Organelle[]>(() => makeRing(0))

  const engulf = (o: Organelle, i: number, n: number, from: Point | null) => {
    gainBase()
    // The clicked organelle leaves the ring (it becomes the traveler); the rest
    // slide to a fresh even layout.
    setRing((prev) => prev.filter((x) => x.id !== o.id))
    const completing = placed.current + 1 >= NEED
    const id = nextId.current++
    setTravelers((list) => [
      ...list,
      {
        id,
        // The ring spins, so a real click carries the true on-screen position;
        // keyboard activation falls back to the organelle's resting point.
        from: from ?? ringPos(i, n),
        to: completing ? { x: 50, y: 50 } : innerPos(placed.current),
        tint: o.tint,
        shape: o.shape,
        completing,
      },
    ])
    if (completing) {
      complete()
      placed.current = 0
    } else {
      placed.current += 1
    }
  }

  const arrive = (tr: Traveler) => {
    setTravelers((list) => list.filter((x) => x.id !== tr.id))
    if (tr.completing) {
      // The host matures into a eukaryote: clear it, burst, and let a fresh
      // ring of organelles drift back in.
      setBloom((b) => b + 1)
      setInner([])
      setRing(makeRing(ringId.current))
      ringId.current += RING_SIZE
    } else {
      setInner((list) => [
        ...list,
        { id: tr.id, x: tr.to.x, y: tr.to.y, tint: tr.tint, shape: tr.shape },
      ])
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="h-60 w-60 overflow-visible"
        role="group"
        aria-label={verb}
      >
        <defs>
          <radialGradient id="endo-host" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="var(--color-surface)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* Host cell membrane (breathing). An irregular blob (~r20 around 50,50)
            rather than a circle, reshaped on each maturation so no two matured
            eukaryotes look quite alike. */}
        <g className="widget-pulse" key={bloom}>
          <path
            d={hostPath(bloom)}
            fill="url(#endo-host)"
            stroke="var(--color-fg)"
            strokeWidth="1.4"
            opacity="0.9"
            className={bloom ? 'bloom' : undefined}
          />
          {/* Nucleus (off-centre, to keep the cell organic). */}
          <circle cx="52" cy="51.5" r="5" fill="var(--color-fg)" opacity="0.25" />
        </g>

        {/* Engulfed organelles living inside the host (same irregular shapes). */}
        {inner.map((d) => (
          <g key={d.id} transform={`translate(${d.x} ${d.y})`}>
            <path className="pop-in" d={SHAPES[d.shape]} fill={d.tint} opacity="0.9" />
          </g>
        ))}

        {/* Organelles mid-engulfment, gliding from the ring into the host. */}
        {travelers.map((tr) => (
          <FlyingOrganelle key={tr.id} traveler={tr} onArrive={() => arrive(tr)} />
        ))}

        {/* Drifting organelles (rotating ring), each a clickable button. As they
            are engulfed the survivors slide to a fresh even layout (.ring-slide);
            the ring only refills once the host matures. */}
        <g className="widget-spin">
          {ring.map((o, i) => {
            const p = ringPos(i, ring.length)
            return (
              <g
                key={o.id}
                className="ring-slide"
                style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
              >
                {/* Inner group fades in on mount (.organelle-grow) without
                    disturbing the slide transform on the outer group. */}
                <g className="organelle-grow group">
                  <path
                    d={SHAPES[o.shape]}
                    fill={o.tint}
                    opacity="0.9"
                    className="transition group-hover:brightness-125"
                  />
                  <circle
                    r="6"
                    fill="transparent"
                    role="button"
                    tabIndex={0}
                    aria-label={t('endosymbiosis.organelle')}
                    onClick={(e) =>
                      engulf(
                        o,
                        i,
                        ring.length,
                        viewBoxPoint(svgRef.current, e.clientX, e.clientY, 100),
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        engulf(o, i, ring.length, null)
                      }
                    }}
                    className="cursor-pointer outline-none transition hover:stroke-accent focus-visible:stroke-accent"
                    strokeWidth="2"
                  />
                </g>
              </g>
            )
          })}
        </g>
      </svg>
      <span className="text-base font-semibold text-fg">{verb}</span>
      <span className="text-xs text-muted">{t('endosymbiosis.hint')}</span>
    </div>
  )
}
