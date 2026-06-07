import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { viewBoxPoint } from './svgCoords'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslation } from '@/i18n/useTranslation'
import { clickYield } from '@/lib/engine'
import { formatNumber } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

/** Keep the field lively without unbounded growth (oldest stars recycle out). */
const MAX_STARS = 22
/** Rapid clicks at (roughly) the same spot to collapse the gas into a star. */
const IGNITE_CLICKS = 5
const COMBO_WINDOW_MS = 600
const COMBO_RADIUS = 18

/** Overlapping soft blobs forming a gaseous, formless nebula (blurred edges). */
const NEBULA = [
  { x: 50, y: 50, r: 24, o: 0.26, fill: 'url(#bbc-gas)' },
  { x: 43, y: 46, r: 16, o: 0.22, fill: 'url(#bbc-gas)' },
  { x: 58, y: 53, r: 18, o: 0.2, fill: 'url(#bbc-glow)' },
  { x: 53, y: 43, r: 12, o: 0.24, fill: 'url(#bbc-glow)' },
  { x: 46, y: 57, r: 14, o: 0.18, fill: 'url(#bbc-gas)' },
  { x: 50, y: 50, r: 9, o: 0.3, fill: 'url(#bbc-light)' },
]

/**
 * Era 2 (First stars): a star nursery. Every click collapses gas (+1 gas cloud,
 * the era's verb) with a puff at the pointer. Rapidly clicking the SAME spot
 * also compresses a pocket until it IGNITES into a star (flash of light) - one
 * star per spot, so move on to seed the next. Ignition is a FREE bonus (no
 * stock consumed); gas/hydrogen stay the fuel of the AUTOMATED recipe.
 */
export function StarNursery({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const click = useGameStore((s) => s.click)
  const manualProduce = useGameStore((s) => s.manualProduce)
  const spawn = useFeedbackStore((s) => s.spawn)

  const svgRef = useRef<SVGSVGElement>(null)
  const nextId = useRef(0)
  const [stars, setStars] = useState<{ id: number; x: number; y: number }[]>([])
  const [puffs, setPuffs] = useState<{ id: number; x: number; y: number }[]>([])
  // The gas being compressed at the focus point (grows with each rapid click).
  const [build, setBuild] = useState({ x: 50, y: 50, count: 0 })
  const [flash, setFlash] = useState<{ id: number; x: number; y: number } | null>(null)

  const comboRef = useRef({ count: 0, x: 0, y: 0, t: 0 })
  const decayRef = useRef<number | undefined>(undefined)
  const lastStarRef = useRef<{ x: number; y: number } | null>(null)

  // Clear the pending combo-decay timer on unmount.
  useEffect(() => () => window.clearTimeout(decayRef.current), [])

  const addStar = (x: number, y: number) =>
    setStars((s) => [...s.slice(-(MAX_STARS - 1)), { id: nextId.current++, x, y }])
  const addPuff = (x: number, y: number) =>
    setPuffs((p) => [...p.slice(-7), { id: nextId.current++, x, y }])

  const collapse = (e: MouseEvent) => {
    // Cursor position for mouse; a scattered point for keyboard (detail === 0).
    let x = 50
    let y = 50
    const p = e.detail !== 0 ? viewBoxPoint(svgRef.current, e.clientX, e.clientY, 100) : null
    if (p) {
      x = Math.min(92, Math.max(8, p.x))
      y = Math.min(92, Math.max(8, p.y))
    } else {
      const a = Math.random() * Math.PI * 2
      const d = 20 + Math.random() * 22
      x = 50 + Math.cos(a) * d
      y = 50 + Math.sin(a) * d
    }
    addPuff(x, y)
    // Every click collapses gas (the era's verb), scaled by the generator level.
    const { state, defs } = useGameStore.getState()
    const gas = clickYield(state, defs, era)
    click(era.clickResource, gas)
    spawn(`res:${era.clickResource}`, `+${formatNumber(gas)}`, 'resource')
    window.clearTimeout(decayRef.current)

    // A rapid click near the previous one continues the combo; else it restarts.
    const now = performance.now()
    const c = comboRef.current
    const cont =
      c.count > 0 && now - c.t < COMBO_WINDOW_MS && Math.hypot(x - c.x, y - c.y) < COMBO_RADIUS

    // One star per spot: to start a NEW collapse you must move away from the
    // last star (that pocket of gas has already formed a star).
    if (!cont) {
      const last = lastStarRef.current
      if (last && Math.hypot(x - last.x, y - last.y) < COMBO_RADIUS) {
        comboRef.current = { count: 0, x, y, t: now }
        setBuild((b) => (b.count > 0 ? { ...b, count: 0 } : b))
        return
      }
    }

    const count = cont ? c.count + 1 : 1
    const fx = cont ? c.x : x
    const fy = cont ? c.y : y

    if (count >= IGNITE_CLICKS) {
      // Enough compression: a star ignites at the focus (free, no stock spent).
      const { defs } = useGameStore.getState()
      const recipe = era.converters[0]
      const conv = defs.converters[recipe]
      if (conv) {
        manualProduce(recipe)
        for (const o of conv.outputs)
          spawn(`res:${o.resource}`, `+${formatNumber(o.amount)}`, 'resource')
      }
      addStar(fx, fy)
      setFlash({ id: nextId.current++, x: fx, y: fy })
      lastStarRef.current = { x: fx, y: fy }
      comboRef.current = { count: 0, x: fx, y: fy, t: now }
      setBuild({ x: fx, y: fy, count: 0 })
    } else {
      comboRef.current = { count, x: fx, y: fy, t: now }
      setBuild({ x: fx, y: fy, count })
      // The half-collapsed cloud disperses if you stop clicking in time.
      decayRef.current = window.setTimeout(() => {
        comboRef.current = { ...comboRef.current, count: 0 }
        setBuild((b) => ({ ...b, count: 0 }))
      }, COMBO_WINDOW_MS)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label={t(era.verbKey as TranslationKey)}
        onClick={collapse}
        className="group rounded-full p-2 transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
      >
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="h-60 w-60 overflow-visible transition group-hover:brightness-110"
        >
          <defs>
            {/* Soft gas puff (cloudy edges) spawned at each click. */}
            <radialGradient id="bbc-gas" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
            </radialGradient>
            {/* Light burst when a star finally ignites. */}
            <radialGradient id="bbc-light" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-fg)" stopOpacity="0.95" />
              <stop offset="55%" stopColor="var(--color-fg)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--color-fg)" stopOpacity="0" />
            </radialGradient>
            {/* Warm tint for some nebula blobs. */}
            <radialGradient id="bbc-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
            {/* Soft blur for the gaseous, confused edges. */}
            <filter id="bbc-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.2" />
            </filter>
          </defs>

          {/* Faint outer haze. */}
          <circle cx="50" cy="50" r="46" fill="var(--color-secondary)" opacity="0.05" />

          {/* Gaseous, formless nebula: blurred overlapping blobs, slowly breathing. */}
          <g filter="url(#bbc-blur)" className="widget-pulse">
            {NEBULA.map((b, i) => (
              <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.fill} opacity={b.o} />
            ))}
          </g>

          {/* Gas-cloud puff around the pointer at each click. */}
          {puffs.map((p) => (
            <circle key={p.id} className="gas-puff" cx={p.x} cy={p.y} r="9" fill="url(#bbc-gas)" />
          ))}

          {/* Gas being compressed at the focus (grows toward ignition). */}
          {build.count > 0 ? (
            <circle
              cx={build.x}
              cy={build.y}
              r={4 + (build.count / IGNITE_CLICKS) * 8}
              fill="url(#bbc-gas)"
              opacity={0.3 + 0.45 * (build.count / IGNITE_CLICKS)}
            />
          ) : null}

          {/* Ignition flash (re-mounts per star so it replays). */}
          {flash ? (
            <circle
              key={flash.id}
              cx={flash.x}
              cy={flash.y}
              r="13"
              fill="url(#bbc-light)"
              className="light-burst"
            />
          ) : null}

          {/* Stars ignited by the player (ignite then twinkle). */}
          {stars.map((s) => (
            <circle key={s.id} className="star" cx={s.x} cy={s.y} r="0.9" fill="var(--color-fg)" />
          ))}
        </svg>
      </button>
      <span className="text-base font-semibold text-fg">{t(era.verbKey as TranslationKey)}</span>
      <span className="text-xs text-muted">{t('nursery.hint')}</span>
    </div>
  )
}
