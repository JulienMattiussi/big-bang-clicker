import { useEffect, useRef, useState } from 'react'
import { useCrisisWin } from '@/hooks/useCrisisWin'
import { useTranslation } from '@/i18n/useTranslation'
import {
  DIR_VEC,
  DST_ROW,
  ROWS,
  SRC_ROW,
  STAGES,
  computeFlow,
  freshSpice,
  openings,
  rotate,
  type SpiceWorld,
} from './spiceWorld'

const SPICE = '#e8a13a' // spice amber: a physical-material colour, like the crisis-scene reds
const CELL = 40
const PAD_X = 46 // room for the spice source (left) and the universe-city (right)
const PAD_Y = 14
const WIN_DELAY_MS = 700 // let the full conduit glow before advancing / the victory modal

const cellCenter = (r: number, c: number) => ({
  x: PAD_X + c * CELL + CELL / 2,
  y: PAD_Y + r * CELL + CELL / 2,
})

/**
 * Spice-cartel crisis mini-game (era 18): the cartel has cut the spice conduits.
 * Rotate the pipe tiles (click) to relink the spice source on the left to the
 * universe-city on the right; spice flowing from the source lights its tiles amber.
 * The crisis runs in THREE stages, each two columns wider and harder; clearing a
 * stage extends the conduit, and only the last one breaks the blockade (resolves
 * the crisis and queues the victory modal). Puzzle/connectivity in spiceWorld.ts.
 */
export function SpiceGame() {
  const { t } = useTranslation()
  const win = useCrisisWin()

  const [stage, setStage] = useState(1)
  const [world, setWorld] = useState<SpiceWorld>(() => freshSpice(1))
  const busy = useRef(false)

  const { flowing, solved, reach } = computeFlow(world)
  const cols = world.cols

  useEffect(() => {
    if (busy.current || !solved) return
    busy.current = true
    const handle = setTimeout(() => {
      if (stage < STAGES) {
        setStage((s) => s + 1)
        setWorld(freshSpice(stage + 1))
        busy.current = false
        return
      }
      win()
    }, WIN_DELAY_MS)
    return () => clearTimeout(handle)
  }, [solved, stage, win])

  const turn = (i: number) => setWorld((prev) => rotate(prev, i))

  const vbW = cols * CELL + PAD_X * 2
  const vbH = ROWS * CELL + PAD_Y * 2
  const src = cellCenter(SRC_ROW, 0)
  const dst = cellCenter(DST_ROW, cols - 1)
  const pct = reach / (cols - 1)

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className="text-base font-semibold text-red-400">
        {t('spiceGame.hint')}{' '}
        {t('spiceGame.stage').replace('{n}', String(stage)).replace('{total}', String(STAGES))}
      </span>
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="h-72 w-full max-w-6xl overflow-visible rounded-xl border border-red-500/40"
        role="group"
        aria-label={t('spiceGame.aria')}
      >
        <rect x="0" y="0" width={vbW} height={vbH} fill="#1a0d12" opacity="0.55" />

        {/* Spice source (left): worm-spice node feeding the inlet. */}
        <g aria-hidden>
          <line
            x1={src.x - CELL / 2}
            y1={src.y}
            x2={PAD_X - 8}
            y2={src.y}
            stroke={SPICE}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx={PAD_X - 16} cy={src.y} r="8" fill={SPICE} opacity="0.85" />
          <circle cx={PAD_X - 26} cy={src.y - 7} r="3.5" fill={SPICE} opacity="0.6" />
        </g>

        {/* Universe-city (right): the outlet, lit once the conduit reconnects. */}
        <g aria-hidden>
          <line
            x1={dst.x + CELL / 2}
            y1={dst.y}
            x2={vbW - PAD_X + 8}
            y2={dst.y}
            stroke={solved ? SPICE : 'var(--color-fg)'}
            strokeOpacity={solved ? 1 : 0.25}
            strokeWidth="6"
            strokeLinecap="round"
          />
          {[0, 6, 12].map((dx, k) => (
            <rect
              key={dx}
              x={vbW - 30 + dx}
              y={dst.y - 8 - k * 2}
              width="4"
              height={16 + k * 5}
              rx="1"
              fill="var(--color-accent)"
              opacity={solved ? 1 : 0.6}
            />
          ))}
        </g>

        {world.tiles.map((tile, i) => {
          const r = Math.floor(i / cols)
          const c = i % cols
          const { x, y } = cellCenter(r, c)
          const on = flowing[i]
          const col = on ? SPICE : 'var(--color-fg)'
          return (
            <g key={i} className="group">
              <rect
                x={x - CELL / 2 + 2}
                y={y - CELL / 2 + 2}
                width={CELL - 4}
                height={CELL - 4}
                rx="5"
                fill="var(--color-surface)"
                fillOpacity="0.5"
                stroke="var(--color-border)"
                strokeWidth="0.6"
              />
              {openings(tile).map((d) => {
                const [vx, vy] = DIR_VEC[d]!
                return (
                  <line
                    key={d}
                    x1={x}
                    y1={y}
                    x2={x + vx * (CELL / 2 - 2)}
                    y2={y + vy * (CELL / 2 - 2)}
                    stroke={col}
                    strokeOpacity={on ? 1 : 0.5}
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                )
              })}
              <circle cx={x} cy={y} r="5" fill={col} fillOpacity={on ? 1 : 0.5} />
              <rect
                x={x - CELL / 2}
                y={y - CELL / 2}
                width={CELL}
                height={CELL}
                rx="5"
                fill="transparent"
                role="button"
                tabIndex={0}
                aria-label={t('spiceGame.tile')}
                onClick={() => turn(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    turn(i)
                  }
                }}
                className="cursor-pointer outline-none transition hover:stroke-accent focus-visible:stroke-accent"
                strokeWidth="2"
              />
            </g>
          )
        })}
      </svg>

      <div className="flex w-full max-w-6xl items-center gap-3">
        <span className="text-sm font-semibold text-fg">{t('spiceGame.progress')}</span>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={cols - 1}
          aria-valuenow={reach}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
