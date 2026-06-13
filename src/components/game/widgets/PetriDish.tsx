import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { viewBoxPoint } from './svgCoords'
import { useEraMechanic } from './useEraMechanic'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

/** Square petri dish; cells swim inside the circular boundary. */
const VB = 100
const CX = 50
const CY = 50
const DISH_R = 45
const START_CELLS = 6
const START_R = 6
const CHILD_R = START_R * 0.8
const GROW_RATE = 1.1 // units/s: the surviving half swells back to full size
const SHRINK_RATE = 3 // units/s: the other half withers away
const DEATH_R = 0.8
const SAFETY_MAX = 40 // hard guard against runaway spam
const BONUS_CUTS = 3 // cuts in a single stroke for a bonus microbe
const SLASH_MARGIN = 2 // extra hit width of the blade (thin, precise)

type Mode = 'stable' | 'grow' | 'shrink'
interface Cell {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  r: number
  mode: Mode
  // Cosmetic, set at birth so no two cells look quite alike.
  aspect: number // ry / rx
  rot: number // current orientation (deg)
  spin: number // deg/s
  nx: number // nucleus offset (fraction of r)
  ny: number
  tint: string
}

/** Shortest distance from point (px,py) to segment (x1,y1)-(x2,y2). */
function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

/**
 * Era 6 (First life): a petri dish of SWIMMING cells (each a slightly different
 * shape/tint/orientation). Drag the mouse across them to slice a cell in two -
 * each cut yields 2 cells, then one half regrows and the other withers, so the
 * population returns to baseline on its own. Slice 3+ in a single stroke for a
 * bonus microbe. A "Split a cell" button covers keyboard players.
 */
export function PetriDish({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const svgRef = useRef<SVGSVGElement>(null)
  const bladeRef = useRef<SVGPolylineElement>(null)
  const cellsRef = useRef<Map<number, Cell>>(new Map())
  const nextId = useRef(0)
  const lastFrame = useRef(0)

  const [cells, setCells] = useState<{ id: number; tint: string }[]>([])
  const [burst, setBurst] = useState<{ id: number; x: number; y: number } | null>(null)
  const [splits, setSplits] = useState<{ id: number; x: number; y: number }[]>([])

  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const trail = useRef<{ x: number; y: number }[]>([])
  const cutThisStroke = useRef<Set<number>>(new Set())
  const cutCount = useRef(0)
  const kbCombo = useRef(0)

  const syncCells = () =>
    setCells([...cellsRef.current.values()].map((c) => ({ id: c.id, tint: c.tint })))

  const addCell = (x: number, y: number, vx: number, vy: number, r: number, mode: Mode) => {
    const id = nextId.current++
    const mix = 60 + Math.random() * 35
    cellsRef.current.set(id, {
      id,
      x,
      y,
      vx,
      vy,
      r,
      mode,
      aspect: 0.66 + Math.random() * 0.32,
      rot: Math.random() * 360,
      spin: (Math.random() - 0.5) * 40,
      nx: (Math.random() - 0.5) * 0.75,
      ny: (Math.random() - 0.5) * 0.75,
      tint: `color-mix(in srgb, var(--color-accent) ${mix.toFixed(0)}%, var(--color-secondary))`,
    })
  }

  // Seed the dish (Math.random in an effect, not during render).
  useEffect(() => {
    for (let i = 0; i < START_CELLS; i++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.random() * (DISH_R - START_R - 4)
      const v = 5 + Math.random() * 6
      const va = Math.random() * Math.PI * 2
      addCell(
        CX + Math.cos(a) * d,
        CY + Math.sin(a) * d,
        Math.cos(va) * v,
        Math.sin(va) * v,
        START_R,
        'stable',
      )
    }
    syncCells()
  }, [])

  // Swim + grow/shrink loop; dead cells are removed (population self-balances).
  useEffect(() => {
    let raf = 0
    const loop = (now: number) => {
      const dt = lastFrame.current ? Math.min(0.05, (now - lastFrame.current) / 1000) : 0
      lastFrame.current = now
      const svg = svgRef.current
      const dead: number[] = []
      for (const c of cellsRef.current.values()) {
        c.x += c.vx * dt
        c.y += c.vy * dt
        c.rot += c.spin * dt
        if (c.mode === 'grow') {
          c.r = Math.min(START_R, c.r + GROW_RATE * dt)
          if (c.r >= START_R) c.mode = 'stable'
        } else if (c.mode === 'shrink') {
          c.r -= SHRINK_RATE * dt
          if (c.r <= DEATH_R) {
            dead.push(c.id)
            continue
          }
        }
        const dx = c.x - CX
        const dy = c.y - CY
        const d = Math.hypot(dx, dy)
        if (d + c.r > DISH_R && d > 0) {
          const nx = dx / d
          const ny = dy / d
          const dot = c.vx * nx + c.vy * ny
          c.vx -= 2 * dot * nx
          c.vy -= 2 * dot * ny
          c.x = CX + nx * (DISH_R - c.r)
          c.y = CY + ny * (DISH_R - c.r)
        }
        const g = svg?.querySelector(`[data-cell="${c.id}"]`)
        if (g) {
          g.setAttribute(
            'transform',
            `translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) rotate(${c.rot.toFixed(1)})`,
          )
          const el = g.querySelector('ellipse')
          el?.setAttribute('rx', c.r.toFixed(2))
          el?.setAttribute('ry', (c.r * c.aspect).toFixed(2))
          const nuc = g.querySelector('circle')
          nuc?.setAttribute('r', (c.r * 0.3).toFixed(2))
          nuc?.setAttribute('cx', (c.nx * c.r).toFixed(2))
          nuc?.setAttribute('cy', (c.ny * c.r).toFixed(2))
        }
      }
      if (dead.length) {
        dead.forEach((id) => cellsRef.current.delete(id))
        syncCells()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  /** Splits a cell: one half regrows, the other withers (net population stable). */
  const cut = (id: number, push: { x: number; y: number }) => {
    const c = cellsRef.current.get(id)
    if (!c || cellsRef.current.size > SAFETY_MAX) return
    cellsRef.current.delete(id)
    gainBase(2) // a division turns one cell into two
    cutCount.current += 1
    cutThisStroke.current.add(id)
    // Randomly pick which half survives (and where it swims off), so survivors
    // don't all drift the same way and pile up.
    const sign = Math.random() < 0.5 ? 1 : -1
    const sa = Math.random() * Math.PI * 2
    const sv = 5 + Math.random() * 6
    const fling = 13
    addCell(
      c.x + push.x * CHILD_R * 0.6 * sign,
      c.y + push.y * CHILD_R * 0.6 * sign,
      Math.cos(sa) * sv,
      Math.sin(sa) * sv,
      CHILD_R,
      'grow',
    )
    addCell(
      c.x - push.x * CHILD_R * 0.6 * sign,
      c.y - push.y * CHILD_R * 0.6 * sign,
      -push.x * fling * sign,
      -push.y * fling * sign,
      CHILD_R,
      'shrink',
    )
    setSplits((list) => [...list.slice(-5), { id: nextId.current++, x: c.x, y: c.y }])
  }

  const toViewBox = (e: PointerEvent<HTMLDivElement>) =>
    viewBoxPoint(svgRef.current, e.clientX, e.clientY, VB)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const p = toViewBox(e)
    if (!p) return
    dragging.current = true
    cutThisStroke.current = new Set()
    cutCount.current = 0
    last.current = p
    trail.current = [p]
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // pointer capture unsupported: ignore.
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const p = toViewBox(e)
    if (!p) return
    const a = last.current
    const len = Math.hypot(p.x - a.x, p.y - a.y) || 1
    const push = { x: -(p.y - a.y) / len, y: (p.x - a.x) / len } // perpendicular to the blade
    let cutAny = false
    for (const c of [...cellsRef.current.values()]) {
      if (c.mode === 'shrink' || cutThisStroke.current.has(c.id)) continue
      if (distToSegment(c.x, c.y, a.x, a.y, p.x, p.y) < c.r + SLASH_MARGIN) {
        cut(c.id, push)
        cutAny = true
      }
    }
    last.current = p
    trail.current = [...trail.current.slice(-9), p]
    bladeRef.current?.setAttribute('points', trail.current.map((q) => `${q.x},${q.y}`).join(' '))
    if (cutAny) syncCells()
  }

  const endStroke = () => {
    if (!dragging.current) return
    dragging.current = false
    if (cutCount.current >= BONUS_CUTS) {
      complete()
      setBurst({ id: nextId.current++, x: CX, y: CY })
    }
    trail.current = []
    bladeRef.current?.setAttribute('points', '')
  }

  // Keyboard / AT fallback: split one cell per press; every 3rd press = a microbe.
  const divideOne = () => {
    const first = [...cellsRef.current.values()].find((c) => c.mode !== 'shrink')
    if (!first) return
    const a = ((first.id % 8) / 8) * Math.PI * 2
    cut(first.id, { x: Math.cos(a), y: Math.sin(a) })
    syncCells()
    kbCombo.current += 1
    if (kbCombo.current % BONUS_CUTS === 0) {
      complete()
      setBurst({ id: nextId.current++, x: CX, y: CY })
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* The cut zone extends well around the dish (this padded surface), so a
          slash can be started from outside; a blade cursor signals it. */}
      <div
        role="group"
        aria-label={verb}
        className="cursor-blade touch-none p-9"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB} ${VB}`}
          className="h-60 w-60 overflow-hidden rounded-full border border-border bg-surface"
        >
          <defs>
            <radialGradient id="petri-burst" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-fg)" stopOpacity="0.9" />
              <stop offset="55%" stopColor="var(--color-fg)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-fg)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={CX} cy={CY} r={DISH_R} fill="var(--color-secondary)" opacity="0.05" />

          {/* Position/size/orientation are driven imperatively by rAF via data-cell. */}
          {cells.map((c) => (
            <g key={c.id} data-cell={c.id}>
              <ellipse
                rx={START_R}
                ry={START_R * 0.8}
                fill={c.tint}
                fillOpacity="0.18"
                stroke={c.tint}
                strokeOpacity="0.6"
                strokeWidth="0.6"
              />
              <circle r={START_R * 0.3} fill={c.tint} opacity="0.5" />
            </g>
          ))}

          {splits.map((sp) => (
            <circle
              key={sp.id}
              className="light-burst"
              cx={sp.x}
              cy={sp.y}
              r="5"
              fill="url(#petri-burst)"
            />
          ))}

          {/* Blade trail (set imperatively while slicing). */}
          <polyline
            ref={bladeRef}
            fill="none"
            stroke="var(--color-fg)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />

          {burst ? (
            <circle
              key={burst.id}
              cx={burst.x}
              cy={burst.y}
              r="14"
              fill="url(#petri-burst)"
              className="light-burst"
            />
          ) : null}
        </svg>
      </div>

      <span className="text-base font-semibold text-fg">{verb}</span>
      <button
        type="button"
        onClick={divideOne}
        className="rounded-md border border-border px-3 py-1 text-sm text-muted transition select-none hover:border-accent hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
      >
        {t('petri.divide')}
      </button>
      <span className="text-center text-xs whitespace-pre-line text-muted">{t('petri.hint')}</span>
    </div>
  )
}
