import { useEffect, useRef, useState } from 'react'
import { useCrisisStore } from '@/store/crisisStore'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { H, LIMIT_MS, STEP_MS, W, extinguish, freshGasLeak, step, type GasLeakWorld } from './gasLeakWorld'

// Flame colours: a physical-material scale, like the other crisis-art literals.
const FLAME = '#f59e0b'
const FLAME_CORE = '#fde68a'

/**
 * End-game crisis (era 19): a galactic-district leader forgot to turn off the gas.
 * Leaks bloom across the full width, faster and faster; tap them to snuff them out.
 * It is UNWINNABLE on purpose: the 15 s countdown always ends in the chain reaction
 * (a forced modal), after which the crisis resolves (no effect) and the era's
 * contraction widget takes over. World/tick in gasLeakWorld.ts.
 */
export function GasLeakGame() {
  const { t } = useTranslation()
  const resolveCrisis = useGameStore((s) => s.resolveCrisis)
  const enqueueEvent = useGameStore((s) => s.enqueueEvent)
  const stop = useCrisisStore((s) => s.stop)

  const [world, setWorld] = useState<GasLeakWorld>(freshGasLeak)
  const done = useRef(false)

  useEffect(() => {
    // Pause the countdown while any event modal is up (e.g. the "Soudain..."
    // intro), so the 15 s only ever run while the player is actually playing.
    const handle = setInterval(() => {
      if (useGameStore.getState().state.pendingEvents.length === 0) setWorld(step)
    }, STEP_MS)
    return () => clearInterval(handle)
  }, [])

  useEffect(() => {
    if (done.current || world.time < LIMIT_MS) return
    done.current = true
    enqueueEvent({
      id: 'endgame:chain',
      tone: 'transition',
      titleKey: 'endgame.chain.title',
      bodyKey: 'endgame.chain.body',
      icon: 'flame',
    })
    resolveCrisis('gasLeak')
    stop()
  }, [world.time, enqueueEvent, resolveCrisis, stop])

  const snuff = (id: number) => setWorld((prev) => extinguish(prev, id))

  const remaining = Math.max(0, Math.ceil((LIMIT_MS - world.time) / 1000))
  const pct = Math.min(100, (world.time / LIMIT_MS) * 100)

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className="text-base font-semibold text-red-400">{t('gasLeak.hint')}</span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-72 w-full max-w-6xl overflow-hidden rounded-xl border border-red-500/40"
        role="group"
        aria-label={t('gasLeak.aria')}
      >
        <rect x="0" y="0" width={W} height={H} fill="#1a0d12" opacity="0.6" />
        {world.leaks.map((l) => (
          <g key={l.id} className="group">
            {/* Flame: outer body + bright core, with a soft glow behind. */}
            <circle cx={l.x} cy={l.y} r="6" fill={FLAME} opacity="0.18" aria-hidden />
            <path
              d={`M${l.x} ${l.y - 6} C ${l.x + 4} ${l.y - 1} ${l.x + 3.5} ${l.y + 4} ${l.x} ${l.y + 5} C ${l.x - 3.5} ${l.y + 4} ${l.x - 4} ${l.y - 1} ${l.x} ${l.y - 6} Z`}
              fill={FLAME}
              className="transition group-hover:brightness-125"
              aria-hidden
            />
            <path
              d={`M${l.x} ${l.y - 2.5} C ${l.x + 2} ${l.y} ${l.x + 1.8} ${l.y + 2.5} ${l.x} ${l.y + 3} C ${l.x - 1.8} ${l.y + 2.5} ${l.x - 2} ${l.y} ${l.x} ${l.y - 2.5} Z`}
              fill={FLAME_CORE}
              aria-hidden
            />
            <circle
              cx={l.x}
              cy={l.y}
              r="6.5"
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label={t('gasLeak.leak')}
              onClick={() => snuff(l.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  snuff(l.id)
                }
              }}
              className="cursor-pointer outline-none transition hover:stroke-accent focus-visible:stroke-accent"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>

      <div className="flex w-full max-w-6xl items-center gap-3">
        <span className="text-sm font-semibold tabular-nums text-red-400">{remaining}s</span>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={Math.round(LIMIT_MS / 1000)}
          aria-valuenow={remaining}
          aria-label={t('gasLeak.aria')}
        >
          <div
            className="h-full rounded-full bg-red-500 transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
