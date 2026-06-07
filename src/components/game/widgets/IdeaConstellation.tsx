import { useEffect, useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

/** Ideas in the constellation (positions in viewBox units). */
const NODES = Array.from({ length: 6 }, (_, i) => {
  const a = -Math.PI / 2 + (i / 6) * Math.PI * 2
  return { x: 50 + Math.cos(a) * 34, y: 50 + Math.sin(a) * 34 }
})
const START_LEN = 2
const FLASH_MS = 600

/**
 * Era 11 (Intelligence): a constellation of ideas. Watch the sequence light up,
 * then reproduce it by clicking the ideas in order (+1 tool each). Repeat the
 * whole pattern and the insight crystallises into knowledge (free); the sequence
 * then grows by one. A wrong step just shortens it - learning, never punished.
 * A pure memory mechanic, unlike any other era.
 */
export function IdeaConstellation({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const [phase, setPhase] = useState<'watch' | 'input'>('watch')
  const [active, setActive] = useState<number | null>(null)
  const [announce, setAnnounce] = useState('')
  const [wrong, setWrong] = useState(0)

  const seqRef = useRef<number[]>([])
  const posRef = useRef(0)
  const phaseRef = useRef<'watch' | 'input'>('watch')
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  const startRound = (len: number) => {
    clearTimers()
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * NODES.length))
    seqRef.current = seq
    posRef.current = 0
    phaseRef.current = 'watch'
    setPhase('watch')
    setActive(null)
    setAnnounce(seq.map((n) => n + 1).join(' '))
    // Flash each idea in turn, then hand over to the player.
    seq.forEach((node, k) => {
      timers.current.push(window.setTimeout(() => setActive(node), k * FLASH_MS + 350))
      timers.current.push(
        window.setTimeout(() => setActive(null), k * FLASH_MS + 350 + FLASH_MS * 0.6),
      )
    })
    timers.current.push(
      window.setTimeout(
        () => {
          phaseRef.current = 'input'
          setPhase('input')
        },
        seq.length * FLASH_MS + 450,
      ),
    )
  }

  useEffect(() => {
    // Defer the first round to a timeout so the effect body doesn't setState
    // synchronously (and the sequence is generated outside of render).
    timers.current.push(window.setTimeout(() => startRound(START_LEN), 200))
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flash = (node: number) => {
    setActive(node)
    timers.current.push(window.setTimeout(() => setActive(null), 180))
  }

  const clickIdea = (i: number) => {
    if (phaseRef.current !== 'input') return
    const seq = seqRef.current
    if (i === seq[posRef.current]) {
      gainBase()
      flash(i)
      posRef.current += 1
      if (posRef.current >= seq.length) {
        complete() // full sequence reproduced: knowledge crystallises
        phaseRef.current = 'watch'
        setPhase('watch')
        timers.current.push(window.setTimeout(() => startRound(seq.length + 1), 750))
      }
    } else {
      setWrong((w) => w + 1) // gentle miss: shorten and retry
      phaseRef.current = 'watch'
      setPhase('watch')
      timers.current.push(
        window.setTimeout(() => startRound(Math.max(START_LEN, seq.length - 1)), 750),
      )
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 100 100"
        className={`h-60 w-60 overflow-visible ${wrong ? 'widget-shake' : ''}`}
        key={wrong}
        role="group"
        aria-label={verb}
      >
        {/* Faint links between neighbouring ideas. */}
        {NODES.map((n, i) => {
          const m = NODES[(i + 1) % NODES.length]
          return (
            <line
              key={`l${i}`}
              x1={n.x}
              y1={n.y}
              x2={m.x}
              y2={m.y}
              stroke="var(--color-border)"
              strokeWidth="0.8"
              opacity="0.5"
            />
          )
        })}
        {NODES.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r={active === i ? 8 : 6}
              fill={active === i ? 'var(--color-accent)' : 'var(--color-surface)'}
              stroke="var(--color-secondary)"
              strokeWidth="1.6"
              className={active === i ? 'pop-in' : undefined}
            />
            <circle
              cx={n.x}
              cy={n.y}
              r="9"
              fill="transparent"
              role="button"
              tabIndex={phase === 'input' ? 0 : -1}
              aria-disabled={phase === 'watch'}
              aria-label={`${t('memory.idea')} ${i + 1}`}
              onClick={() => clickIdea(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  clickIdea(i)
                }
              }}
              className="cursor-pointer outline-none focus-visible:stroke-accent"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
      <span className="text-base font-semibold text-fg">{verb}</span>
      <span className="text-xs text-muted">
        {phase === 'watch' ? t('memory.watch') : t('memory.repeat')}
      </span>
      {/* Screen-reader equivalent of the flashing pattern. */}
      <span className="sr-only" aria-live="polite">
        {phase === 'watch' ? `${t('memory.watch')}: ${announce}` : t('memory.repeat')}
      </span>
    </div>
  )
}
