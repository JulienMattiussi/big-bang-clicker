import { useEffect, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'

/** Temperature drop per click and passive re-heating rate (per second). */
const COOL_PER_CLICK = 10
const WARM_PER_SECOND = 30
const TICK_MS = 100

const SPARKS = [
  { x: 32, y: 34, r: 1.6, o: 0.8 },
  { x: 68, y: 30, r: 1.2, o: 0.6 },
  { x: 70, y: 64, r: 1.8, o: 0.7 },
  { x: 30, y: 66, r: 1.3, o: 0.6 },
  { x: 50, y: 26, r: 1, o: 0.5 },
  { x: 26, y: 50, r: 1.1, o: 0.5 },
  { x: 74, y: 48, r: 1.4, o: 0.6 },
]

/** Two temperature arcs hugging the orb (one per side), filling from the bottom. */
function TempArc({ d, temperature }: { d: string; temperature: number }) {
  return (
    <>
      <path d={d} fill="none" stroke="var(--color-border)" strokeWidth="4" opacity="0.3" />
      <path
        d={d}
        fill="none"
        stroke="url(#bbc-temp)"
        strokeWidth="4"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={100 - temperature}
      />
    </>
  )
}

/**
 * Era 0: a plasma orb cooling down. Clicking cools it (the temperature arcs
 * drop); left alone, the universe heats back up fast. Purely a materialization
 * of the "cool down" verb - the click itself still produces particles.
 */
export function CoolingWidget({ className }: { className?: string }) {
  const { t } = useTranslation()
  const [temperature, setTemperature] = useState(100)

  // Passive re-heating when the player stops cooling.
  useEffect(() => {
    const timer = setInterval(() => {
      setTemperature((temp) => Math.min(100, temp + (WARM_PER_SECOND * TICK_MS) / 1000))
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const cool = () => setTemperature((temp) => Math.max(0, temp - COOL_PER_CLICK))

  const heat = temperature / 100
  const radius = 34 + 8 * heat

  return (
    <div className={`relative ${className ?? ''}`} onPointerDown={cool}>
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="bbc-cooling" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="65%" stopColor="var(--color-accent)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.25" />
          </radialGradient>
          {/* Heat scale: lighter at the bottom (cool), red at the top (hot).
              Literal colors: this is a temperature ramp, not theme chrome. */}
          <linearGradient
            id="bbc-temp"
            gradientUnits="userSpaceOnUse"
            x1="50"
            y1="96"
            x2="50"
            y2="4"
          >
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="55%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Cool halo: grows as the orb cools. */}
        <circle cx="50" cy="50" r="42" fill="var(--color-secondary)" opacity={0.2 * (1 - heat)} />
        <circle cx="50" cy="50" r={radius} fill="url(#bbc-cooling)" className="widget-pulse" />
        {/* White-hot core: fades as it cools. */}
        <circle
          cx="50"
          cy="50"
          r={radius * 0.45}
          fill="var(--color-fg)"
          opacity={0.15 + 0.5 * heat}
        />
        <g fill="var(--color-fg)">
          {SPARKS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o * heat} />
          ))}
        </g>

        {/* Temperature arcs hugging the orb, one on each side. */}
        <TempArc d="M 50 96 A 46 46 0 0 1 50 4" temperature={temperature} />
        <TempArc d="M 50 96 A 46 46 0 0 0 50 4" temperature={temperature} />
      </svg>

      <span
        className="sr-only"
        role="progressbar"
        aria-label={t('widget.temperature')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(temperature)}
      />
    </div>
  )
}
