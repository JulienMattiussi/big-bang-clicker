import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { OrganismGlyph } from './OrganismGlyph'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

/** Body parts that ride the conveyor; identity is the SHAPE, colour is a hint. */
const PARTS = [
  { id: 'eye', color: 'var(--color-accent)' },
  { id: 'segment', color: 'var(--color-secondary)' },
  { id: 'appendage', color: 'var(--color-octarine)' },
  { id: 'spine', color: 'var(--color-secondary)' },
  { id: 'leg', color: 'var(--color-accent)' },
  { id: 'shell', color: 'var(--color-octarine)' },
  { id: 'fin', color: 'var(--color-secondary)' },
  { id: 'frond', color: 'var(--color-accent)' },
] as const
type PartId = (typeof PARTS)[number]['id']
const PART_IDS = PARTS.map((p) => p.id)
const colorOf = (id: PartId) => PARTS.find((p) => p.id === id)!.color

/**
 * Cambrian organisms to assemble (Burgess Shale / Chengjiang fauna), each a
 * realistic combination of shared body parts - so most parts serve several
 * organisms (only the sponge's "frond" is unique).
 */
const ORGANISMS: { id: string; parts: PartId[] }[] = [
  { id: 'trilobite', parts: ['segment', 'eye', 'leg'] },
  { id: 'anomalocaris', parts: ['eye', 'appendage', 'fin'] },
  { id: 'opabinia', parts: ['eye', 'appendage', 'segment'] },
  { id: 'hallucigenia', parts: ['spine', 'leg', 'segment'] },
  { id: 'wiwaxia', parts: ['shell', 'spine'] },
  { id: 'pikaia', parts: ['fin', 'segment'] },
  { id: 'haikouichthys', parts: ['eye', 'fin', 'segment'] },
  { id: 'marrella', parts: ['eye', 'spine', 'leg'] },
  { id: 'brachiopod', parts: ['shell', 'appendage'] },
  { id: 'sponge', parts: ['frond', 'spine'] },
]

/** Conveyor pacing: a new part every SPAWN_MS, crossing in BELT_MS (lower
 *  SPAWN_MS = parts closer together on the belt). */
const SPAWN_MS = 1000
const BELT_MS = 11000
/** Bias: this share of spawns is a currently-needed part (anti-frustration). */
const NEEDED_BIAS = 0.55
/** Each organism lives this long before it dies; EXIT_MS = its leave animation. */
const CYCLE_MS = 5000
const EXIT_MS = 550
/** Combo: +1 per organism completed in time, reset on a miss, capped here. */
const COMBO_CAP = 100

interface Piece {
  key: number
  id: PartId
  /** ms already elapsed on the belt at spawn (>0 only for the start pre-fill). */
  age: number
}
interface Slot {
  id: PartId
  filled: boolean
}
interface Plan {
  org: string
  slots: Slot[]
}

/**
 * A fresh body plan. Never repeats `prevOrg`, and - when belt contents are known
 * - prefers an organism with at least 2 of its parts already on the belt (then
 * at least 1), so the new organism is achievable right away.
 */
function makePlan(prevOrg?: string, beltIds?: PartId[]): Plan {
  let pool = ORGANISMS.filter((o) => o.id !== prevOrg)
  if (pool.length === 0) pool = ORGANISMS
  if (beltIds && beltIds.length > 0) {
    const present = (o: (typeof ORGANISMS)[number]) =>
      o.parts.filter((p) => beltIds.includes(p)).length
    const withTwo = pool.filter((o) => present(o) >= 2)
    const withOne = pool.filter((o) => present(o) >= 1)
    pool = withTwo.length > 0 ? withTwo : withOne.length > 0 ? withOne : pool
  }
  const org = pool[Math.floor(Math.random() * pool.length)]
  return { org: org.id, slots: org.parts.map((id) => ({ id, filled: false })) }
}

/** One body part as a fillable glyph (solid when acquired, dim outline otherwise). */
function PartGlyph({ id, filled }: { id: PartId; filled: boolean }): ReactElement {
  const f = filled ? 'currentColor' : 'none'
  const s = {
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  }
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden>
      {id === 'eye' ? (
        <>
          <circle cx="12" cy="12" r="8" fill={f} {...s} />
          <circle
            cx="12"
            cy="12"
            r="3"
            fill={filled ? 'var(--color-bg)' : 'currentColor'}
            stroke="none"
          />
        </>
      ) : null}
      {id === 'segment'
        ? [0, 1, 2].map((k) => (
            <rect key={k} x="4" y={6 + k * 5} width="16" height="3.4" rx="1.7" fill={f} {...s} />
          ))
        : null}
      {id === 'appendage' ? (
        <path d="M5 5 Q21 7 17 20 Q13 12 5 11 Z" fill={f} {...s} />
      ) : null}
      {id === 'spine' ? (
        <>
          <polygon points="3,20 6,7 9,20" fill={f} {...s} />
          <polygon points="9,20 12,4 15,20" fill={f} {...s} />
          <polygon points="15,20 18,8 21,20" fill={f} {...s} />
        </>
      ) : null}
      {id === 'leg' ? (
        <>
          <rect x="3" y="6" width="18" height="4" rx="2" fill={f} {...s} />
          {[4.5, 9, 13.5, 18].map((x, k) => (
            <rect key={k} x={x} y="10" width="2.6" height="9" rx="1.3" fill={f} {...s} />
          ))}
        </>
      ) : null}
      {id === 'shell' ? (
        <>
          <path d="M3 19 A9 9 0 0 1 21 19 Z" fill={f} {...s} />
          <path
            d="M12 10 V19 M7.5 13 V19 M16.5 13 V19"
            stroke="currentColor"
            strokeWidth="1.3"
            opacity={filled ? 0.45 : 0.85}
          />
        </>
      ) : null}
      {id === 'fin' ? <path d="M12 3 L21 21 Q12 16 3 21 Z" fill={f} {...s} /> : null}
      {id === 'frond' ? (
        <>
          <path d="M7 21 Q5 8 9 5 L15 5 Q19 8 17 21 Z" fill={f} {...s} />
          <ellipse
            cx="12"
            cy="6"
            rx="3"
            ry="1.5"
            fill={filled ? 'var(--color-bg)' : 'none'}
            {...s}
          />
        </>
      ) : null}
    </svg>
  )
}

/**
 * Era 9 (Cambrian explosion): the assembly line of life (full-width). Body parts
 * ride a conveyor; a body plan names a real Cambrian organism and asks for its
 * specific parts. Each organism lives 5s: grab the right parts in time and it
 * SWIMS AWAY (the recipe output, free); otherwise it DIES, scoring 1 tissue per
 * part fitted (0 if none). Missed parts scroll off (light tension, no penalty).
 * Keyboard/reduced-motion: click a plan slot to grab the next matching part.
 */
export function BodyAssembly({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)
  const [reduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )

  const nextId = useRef(0)
  const [belt, setBelt] = useState<Piece[]>([])
  const [plan, setPlan] = useState<Plan>(makePlan)
  // Each organism lives one CYCLE_MS; `cycle` keys it, `status` drives its exit.
  const [cycle, setCycle] = useState(0)
  const [status, setStatus] = useState<'died' | 'swam' | null>(null)
  // Combo: rises with each organism completed in time, resets on a miss.
  const [combo, setCombo] = useState(0)
  const comboRef = useRef(combo)
  useEffect(() => {
    comboRef.current = combo
  }, [combo])
  // Latest values for timer/spawner closures.
  const planRef = useRef(plan)
  useEffect(() => {
    planRef.current = plan
  }, [plan])
  const beltRef = useRef(belt)
  useEffect(() => {
    beltRef.current = belt
  }, [belt])
  const statusRef = useRef(status)
  useEffect(() => {
    statusRef.current = status
  }, [status])

  // Conveyor: spawn a part on a timer; each part is removed after it has crossed.
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>()
    let last: PartId | null = null
    const spawn = (age = 0) => {
      const needed = planRef.current.slots.filter((s) => !s.filled).map((s) => s.id)
      let id =
        needed.length > 0 && Math.random() < NEEDED_BIAS
          ? needed[Math.floor(Math.random() * needed.length)]
          : PART_IDS[Math.floor(Math.random() * PART_IDS.length)]
      // Never spawn the same part twice in a row.
      if (id === last) {
        const others = PART_IDS.filter((p) => p !== last)
        id = others[Math.floor(Math.random() * others.length)]
      }
      last = id
      const key = nextId.current++
      setBelt((b) => [...b, { key, id, age }])
      const tm = setTimeout(
        () => {
          setBelt((b) => b.filter((p) => p.key !== key))
          timers.delete(tm)
        },
        Math.max(0, BELT_MS - age),
      )
      timers.add(tm)
    }
    // Start with a FULL belt (parts already mid-way), so the first organism is
    // achievable: pre-fill from the oldest (about to exit) to the one entering now.
    for (let age = BELT_MS - SPAWN_MS; age > 0; age -= SPAWN_MS) spawn(age)
    spawn(0)
    const iv = setInterval(() => spawn(0), SPAWN_MS)
    return () => {
      clearInterval(iv)
      timers.forEach(clearTimeout)
    }
  }, [])

  // Resolves the current organism: assembled in time -> it swims away (the recipe
  // output, free); otherwise it dies, scoring 1 tissue per part fitted (0 if none).
  function resolve(outcome: 'died' | 'swam') {
    if (statusRef.current !== null) return
    if (outcome === 'swam') {
      complete()
      // Combo grows, and rewards a bonus of +1 tissue per combo level.
      const next = Math.min(comboRef.current + 1, COMBO_CAP)
      setCombo(next)
      gainBase(next)
    } else {
      // Missed organism: cash in the parts fitted (1 each), reset the combo.
      const filled = planRef.current.slots.filter((s) => s.filled).length
      if (filled > 0) gainBase(filled)
      setCombo(0)
    }
    setStatus(outcome)
  }

  // The 5s lifetime: if the organism is not completed in time, it dies.
  useEffect(() => {
    const tm = setTimeout(() => resolve('died'), CYCLE_MS)
    return () => clearTimeout(tm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle])

  // After the exit animation, the next organism (a fresh body plan) appears.
  useEffect(() => {
    if (status === null) return
    const tm = setTimeout(() => {
      setPlan(makePlan(planRef.current.org, beltRef.current.map((p) => p.id)))
      setStatus(null)
      setCycle((c) => c + 1)
    }, EXIT_MS)
    return () => clearTimeout(tm)
  }, [status])

  /** Fits a part into the first open slot that wants it; returns false on no match. */
  const grab = (key: number, id: PartId): boolean => {
    if (status !== null) return false // resolving: ignore further grabs
    const slotIdx = plan.slots.findIndex((s) => !s.filled && s.id === id)
    if (slotIdx === -1) return false
    setBelt((b) => b.filter((p) => p.key !== key))
    const willComplete = plan.slots.filter((s) => s.filled).length + 1 === plan.slots.length
    setPlan((prev) => ({
      ...prev,
      slots: prev.slots.map((sl, i) => (i === slotIdx ? { ...sl, filled: true } : sl)),
    }))
    if (willComplete) resolve('swam')
    return true
  }

  const clickPiece = (piece: Piece) => {
    grab(piece.key, piece.id)
  }

  // Click a plan slot: grab the earliest matching part on the belt (keyboard path).
  const clickSlot = (i: number) => {
    if (status !== null) return
    const slot = plan.slots[i]
    if (!slot || slot.filled) return
    const piece = belt.find((p) => p.id === slot.id)
    if (piece) grab(piece.key, piece.id)
  }

  const partName = (id: PartId) => t(`assembly.part.${id}` as TranslationKey)
  const orgName = t(`assembly.org.${plan.org}` as TranslationKey)

  const pieceButton = (piece: Piece, moving: boolean) => (
    <button
      key={piece.key}
      type="button"
      tabIndex={-1}
      aria-label={partName(piece.id)}
      onClick={() => clickPiece(piece)}
      style={
        moving
          ? {
              color: colorOf(piece.id),
              animationDuration: `${BELT_MS}ms`,
              // Negative delay places a pre-filled part already part-way across.
              animationDelay: piece.age ? `-${piece.age}ms` : undefined,
            }
          : { color: colorOf(piece.id) }
      }
      className={
        moving
          ? 'belt-piece top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-surface transition hover:brightness-125'
          : 'pop-in flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-surface transition hover:brightness-125'
      }
    >
      <PartGlyph id={piece.id} filled />
    </button>
  )

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-base font-semibold text-fg">{verb}</span>
        <span className="text-xs text-muted">{t('assembly.hint')}</span>
      </div>

      {/* Target organism + the specific parts it still wants. */}
      <div className="flex items-center gap-4">
        <span
          key={cycle}
          className={`text-secondary ${
            status === 'swam' ? 'organism-swim' : status === 'died' ? 'organism-die' : 'pop-in'
          }`}
        >
          <OrganismGlyph id={plan.org} className="h-32 w-auto" />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-accent">{orgName}</span>
          <ul className="flex items-center gap-2" aria-label={`${t('assembly.plan')} : ${orgName}`}>
            {plan.slots.map((slot, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => clickSlot(i)}
                  disabled={slot.filled}
                  aria-label={
                    slot.filled
                      ? `${partName(slot.id)} (${t('assembly.fitted')})`
                      : `${t('assembly.wanted')} : ${partName(slot.id)}`
                  }
                  style={{ color: colorOf(slot.id) }}
                  className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 bg-surface transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    slot.filled
                      ? 'border-current'
                      : 'cursor-pointer border-dashed border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <PartGlyph id={slot.id} filled={slot.filled} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Combo: consecutive organisms completed in time (resets on a miss). */}
      <span className="flex h-5 items-center">
        {combo > 0 ? (
          <span
            key={combo}
            className="pop-in rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent"
          >
            {t('assembly.combo')} &times;{combo}
          </span>
        ) : null}
      </span>

      {/* Lifetime bar: depletes over 5s; the organism dies when it empties. */}
      <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-border/40">
        {status === null ? (
          <div
            key={cycle}
            className="assembly-timer h-full w-full rounded-full bg-accent"
            style={{ animationDuration: `${CYCLE_MS}ms` }}
          />
        ) : null}
      </div>

      {/* The conveyor belt: parts drift right to left; click the ones you need. */}
      <div className="relative h-24 w-full overflow-hidden rounded-xl border border-border bg-bg/40 shadow-inner">
        {/* Centre guide line (the belt). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border/50"
        />
        {reduced ? (
          // Reduced motion: a static tray of the available parts (no scrolling).
          <div className="flex h-full items-center gap-2 overflow-hidden px-3">
            {belt.map((piece) => pieceButton(piece, false))}
          </div>
        ) : (
          belt.map((piece) => pieceButton(piece, true))
        )}
      </div>
    </div>
  )
}
