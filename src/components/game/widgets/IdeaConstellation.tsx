import { useEffect, useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { WidgetGalet } from './WidgetGalet'
import { useGameStore } from '@/store/gameStore'
import { MAX_COMPLEXITY_BOOST } from '@/lib/engine'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

/** Ideas in the constellation (positions in viewBox units). */
const NODES = Array.from({ length: 6 }, (_, i) => {
  const a = -Math.PI / 2 + (i / 6) * Math.PI * 2
  return { x: 50 + Math.cos(a) * 34, y: 50 + Math.sin(a) * 34 }
})
/** One distinct hue per idea, so colour (not just position) helps memorise.
 *  Octarine replaces the orange (--part-2), too close to the yellow (--part-3). */
const NODE_COLORS = [
  'var(--part-1)', // red
  'var(--color-octarine)', // octarine
  'var(--part-3)', // yellow
  'var(--part-4)', // green
  'var(--part-5)', // teal
  'var(--part-6)', // blue
]
const FAIL_COLOR = 'var(--danger)'
const START_LEN = 2
/** Sequence cap. Clearing a full MAX_SEQ run doubles the era's Complexity (bonus). */
const MAX_SEQ = 10
const FLASH_MS = 600
/** How long the success/failure flash stays up (ms). */
const FEEDBACK_MS = 700

/**
 * Era 11 (Intelligence): a constellation of ideas (a Simon-style memory game).
 * Watch the sequence light up, then reproduce it by clicking the ideas in order.
 * EVERY click yields the base resource (the RIGHT one doubles it); reproducing the
 * whole sequence yields the secondary resource and the pattern grows by one. A
 * wrong step just shortens it - learning, never hard-punished. Each idea has its
 * own colour; clear success/fail flashes and a step indicator guide the player.
 */
export function IdeaConstellation({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)
  // Complexity-boost bonus for this era, capped (x8 = MAX_COMPLEXITY_BOOST clears).
  const boostCount = useGameStore((s) => s.state.complexityBoosts[era.id] ?? 0)
  const boostMaxed = boostCount >= MAX_COMPLEXITY_BOOST

  const [phase, setPhase] = useState<'watch' | 'input'>('watch')
  const [active, setActive] = useState<number | null>(null)
  const [announce, setAnnounce] = useState('')
  const [wrong, setWrong] = useState(0)
  const [feedback, setFeedback] = useState<'success' | 'fail' | null>(null)
  const [seqLen, setSeqLen] = useState(START_LEN)
  const [step, setStep] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)

  const seqRef = useRef<number[]>([])
  const succeededRef = useRef(0) // length of the last fully-cleared sequence
  const posRef = useRef(0)
  const phaseRef = useRef<'watch' | 'input'>('watch')
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  const randomNode = () => Math.floor(Math.random() * NODES.length)

  /** Plays the CURRENT sequence (seqRef): flashes each idea, then hands over. Like
   *  a real Simon, on a SUCCESS the sequence grows by one (cumulative, same prefix);
   *  on a MISS it resets to a FRESH sequence of START_LEN (back to the start). */
  const playRound = () => {
    clearTimers()
    const seq = seqRef.current
    posRef.current = 0
    phaseRef.current = 'watch'
    setPhase('watch')
    setActive(null)
    setFeedback(null)
    setSeqLen(seq.length)
    setStep(0)
    setAnnounce(seq.map((n) => n + 1).join(' '))
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
    timers.current.push(
      window.setTimeout(() => {
        seqRef.current = Array.from({ length: START_LEN }, randomNode)
        playRound()
      }, 200),
    )
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
    const correct = i === seq[posRef.current]
    // Every click yields the base resource (a fired neuron); the RIGHT one doubles
    // it. Completing the whole sequence yields the secondary resource (complete()).
    gainBase(correct ? 2 : 1)
    if (correct) {
      flash(i)
      posRef.current += 1
      setStep(posRef.current)
      if (posRef.current >= seq.length) {
        complete(seq.length) // reward scales with the length of the cleared sequence
        phaseRef.current = 'watch'
        setPhase('watch')
        setFeedback('success') // clear win signal: the whole constellation blooms
        succeededRef.current = seq.length
        const cleared = seq.length
        timers.current.push(
          window.setTimeout(() => {
            if (cleared >= MAX_SEQ) {
              // Pinnacle: a full 10-sequence DOUBLES the era's Complexity (announced),
              // until the cap is reached; then you start over from the beginning.
              const gs = useGameStore.getState()
              const era0 = gs.state.currentEraId
              if ((gs.state.complexityBoosts[era0] ?? 0) < MAX_COMPLEXITY_BOOST) {
                const count = gs.awardComplexityBoost()
                gs.enqueueEvent({
                  id: `idea:bonus:${era0}:${count}`,
                  tone: 'transition',
                  titleKey: 'idea.bonus.title',
                  bodyKey: 'idea.bonus.body',
                  icon: 'brain',
                  complexityFactor: 2 ** count,
                })
              }
              succeededRef.current = 0
              seqRef.current = Array.from({ length: START_LEN }, randomNode)
            } else {
              seqRef.current = [...seqRef.current, randomNode()] // grow by one (cumulative)
            }
            playRound()
          }, FEEDBACK_MS + 250),
        )
      }
    } else {
      setWrong((w) => w + 1)
      setFeedback('fail') // clear miss signal: a red flash + shake
      phaseRef.current = 'watch'
      setPhase('watch')
      // A miss sends you back to the start: a fresh sequence of START_LEN.
      succeededRef.current = 0
      timers.current.push(
        window.setTimeout(() => {
          seqRef.current = Array.from({ length: START_LEN }, randomNode)
          playRound()
        }, FEEDBACK_MS + 250),
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
        {NODES.map((n, i) => {
          // Lit when flashing, or for everyone during a success/fail flash.
          const lit = active === i || feedback !== null
          const fill = feedback === 'fail' ? FAIL_COLOR : NODE_COLORS[i]
          return (
            <g key={i}>
              <circle
                cx={n.x}
                cy={n.y}
                r={lit ? 8 : 6}
                fill={fill}
                fillOpacity={lit ? 1 : 0.3}
                stroke={fill}
                strokeWidth="1.6"
                style={{ transition: 'r 0.18s ease, fill 0.18s ease, fill-opacity 0.18s ease' }}
              />
              {/* Hover/focus affordance: a small dot of the idea's own colour. */}
              {hovered === i && !lit ? (
                <circle cx={n.x} cy={n.y} r="2.6" fill={NODE_COLORS[i]} pointerEvents="none" />
              ) : null}
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
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered((h) => (h === i ? null : h))}
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
          )
        })}
      </svg>
      <span className="flex flex-col items-center gap-1.5 text-base font-semibold text-fg">
        {verb}
        <WidgetGalet />
      </span>
      <div className="flex items-center gap-1.5" role="presentation">
        {Array.from({ length: seqLen }, (_, k) => (
          <span
            key={k}
            className={`h-2 w-2 rounded-full transition-colors ${k < step ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </div>
      <span
        className={`text-xs ${
          feedback === 'success'
            ? 'font-semibold text-octarine'
            : feedback === 'fail'
              ? 'font-semibold text-red-400'
              : 'text-muted'
        }`}
      >
        {feedback === 'success'
          ? t('memory.success')
          : feedback === 'fail'
            ? t('memory.fail')
            : phase === 'watch'
              ? t('memory.watch')
              : t('memory.repeat')}
      </span>
      {/* Bonus capped: tell the player so they are not frustrated chasing more. */}
      {boostMaxed ? (
        <span className="text-xs font-semibold text-octarine">
          {t('idea.bonus.max')} (×{2 ** MAX_COMPLEXITY_BOOST})
        </span>
      ) : null}
      {/* Screen-reader equivalent of the flashing pattern and the outcome. */}
      <span className="sr-only" aria-live="polite">
        {feedback === 'success'
          ? t('memory.success')
          : feedback === 'fail'
            ? t('memory.fail')
            : phase === 'watch'
              ? `${t('memory.watch')}: ${announce}`
              : t('memory.repeat')}
      </span>
    </div>
  )
}
