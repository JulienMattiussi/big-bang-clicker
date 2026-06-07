import { useState, type ReactElement } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

type Kind = 'head' | 'finL' | 'finR' | 'tail' | 'spine'
interface Slot {
  kind: Kind
  x: number
  y: number
}

const SLOTS: Slot[] = [
  { kind: 'head', x: 50, y: 26 },
  { kind: 'spine', x: 50, y: 42 },
  { kind: 'finL', x: 24, y: 58 },
  { kind: 'finR', x: 76, y: 58 },
  { kind: 'tail', x: 50, y: 86 },
]
const TINTS = ['var(--color-accent)', 'var(--color-secondary)', 'var(--color-octarine)']

/** Draws an equipped body part (shape varies per slot kind, tint per variant). */
function part(kind: Kind, x: number, y: number, tint: string): ReactElement {
  switch (kind) {
    case 'head':
      return <circle cx={x} cy={y} r="7" fill={tint} />
    case 'spine':
      return <rect x={x - 6} y={y - 2} width="12" height="4" rx="2" fill={tint} />
    case 'finL':
      return <ellipse cx={x} cy={y} rx="8" ry="4" transform={`rotate(-30 ${x} ${y})`} fill={tint} />
    case 'finR':
      return <ellipse cx={x} cy={y} rx="8" ry="4" transform={`rotate(30 ${x} ${y})`} fill={tint} />
    case 'tail':
      return <polygon points={`${x},${y - 7} ${x - 7},${y + 6} ${x + 7},${y + 6}`} fill={tint} />
  }
}

/**
 * Era 9 (Cambrian explosion): a body-plan workshop. Click each empty slot of the
 * silhouette to grow a body part (+1 tissue); cycle a filled slot to vary it.
 * Fill every slot and the creature comes alive as an organism (free) before a
 * fresh body plan appears. Modular assembly - composing an entity, new here.
 */
export function BodyAssembly({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  // null = empty slot; otherwise the variant index (tint).
  const [parts, setParts] = useState<(number | null)[]>(() => SLOTS.map(() => null))
  const [alive, setAlive] = useState(0)

  const clickSlot = (i: number) => {
    setParts((prev) => {
      const next = [...prev]
      if (next[i] === null) {
        next[i] = 0
        gainBase()
        if (next.every((p) => p !== null)) {
          // Every slot filled: the organism comes alive, then a new body plan.
          complete()
          setAlive((a) => a + 1)
          return SLOTS.map(() => null)
        }
      } else {
        next[i] = (next[i]! + 1) % TINTS.length // cycle the variant (no gain)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 100 100"
        className="h-60 w-60 overflow-visible"
        role="group"
        aria-label={verb}
      >
        {/* Body silhouette. */}
        <g key={alive} className={alive ? 'bloom' : undefined}>
          <ellipse
            cx="50"
            cy="58"
            rx="18"
            ry="26"
            fill="var(--color-surface)"
            stroke="var(--color-border)"
            strokeWidth="1.4"
          />
        </g>

        {SLOTS.map((s, i) => {
          const variant = parts[i]
          return (
            <g key={i}>
              {variant === null ? (
                <circle
                  cx={s.x}
                  cy={s.y}
                  r="5"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  opacity="0.7"
                />
              ) : (
                <g className="pop-in">{part(s.kind, s.x, s.y, TINTS[variant])}</g>
              )}
              <circle
                cx={s.x}
                cy={s.y}
                r="8"
                fill="transparent"
                role="button"
                tabIndex={0}
                aria-label={`${t('assembly.part')} ${i + 1}`}
                onClick={() => clickSlot(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    clickSlot(i)
                  }
                }}
                className="cursor-pointer outline-none focus-visible:stroke-accent"
                strokeWidth="2"
              />
            </g>
          )
        })}
      </svg>
      <span className="text-base font-semibold text-fg">{verb}</span>
      <span className="text-xs text-muted">{t('assembly.hint')}</span>
    </div>
  )
}
