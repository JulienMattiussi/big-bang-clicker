import { useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

/** Organites engulfed before the host matures into a eukaryote. */
const NEED = 5
const TINTS = ['var(--color-accent)', 'var(--color-secondary)', 'var(--color-octarine)']

/** Drifting organelles on a ring around the host (clickable to engulf). */
const SLOTS = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2
  return { x: 50 + Math.cos(a) * 34, y: 50 + Math.sin(a) * 30, tint: TINTS[i % TINTS.length] }
})

/**
 * Era 8 (Eukaryotes): endosymbiosis. A host cell sits at the centre, ringed by
 * drifting organelles. Click one to engulf it (+1 organelle): it settles inside
 * the membrane. Engulf enough and the host matures into a complex eukaryote
 * (free) and starts fresh. A deliberate combine gesture (A into B), new here.
 */
export function Endosymbiosis({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const nextId = useRef(0)
  const [inner, setInner] = useState<{ id: number; x: number; y: number; tint: string }[]>([])
  const [bloom, setBloom] = useState(0)

  const engulf = (tint: string) => {
    gainBase()
    // Golden-angle placement spreads engulfed organelles evenly inside the host.
    const k = inner.length
    const a = k * 2.39996
    const d = 3 + (k % 3) * 3
    const dot = { id: nextId.current++, x: 50 + Math.cos(a) * d, y: 50 + Math.sin(a) * d, tint }
    if (inner.length + 1 >= NEED) {
      // The host matures into a eukaryote and resets.
      complete()
      setBloom((b) => b + 1)
      setInner([])
    } else {
      setInner((list) => [...list, dot])
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
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

        {/* Host cell membrane (breathing). */}
        <g className="widget-pulse" key={bloom}>
          <circle
            cx="50"
            cy="50"
            r="20"
            fill="url(#endo-host)"
            stroke="var(--color-fg)"
            strokeWidth="1.4"
            opacity="0.9"
            className={bloom ? 'bloom' : undefined}
          />
          {/* Nucleus. */}
          <circle cx="50" cy="50" r="5" fill="var(--color-fg)" opacity="0.25" />
        </g>

        {/* Engulfed organelles living inside the host. */}
        {inner.map((d) => (
          <circle key={d.id} className="pop-in" cx={d.x} cy={d.y} r="3" fill={d.tint} />
        ))}

        {/* Drifting organelles (rotating ring), each a clickable button. */}
        <g className="widget-spin">
          {SLOTS.map((s, i) => (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r="4.5" fill={s.tint} opacity="0.9" />
              <circle
                cx={s.x}
                cy={s.y}
                r="6"
                fill="transparent"
                role="button"
                tabIndex={0}
                aria-label={t('endosymbiosis.organelle')}
                onClick={() => engulf(s.tint)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    engulf(s.tint)
                  }
                }}
                className="cursor-pointer outline-none focus-visible:stroke-accent"
                strokeWidth="2"
              />
            </g>
          ))}
        </g>
      </svg>
      <span className="text-base font-semibold text-fg">{verb}</span>
      <span className="text-xs text-muted">{t('endosymbiosis.hint')}</span>
    </div>
  )
}
