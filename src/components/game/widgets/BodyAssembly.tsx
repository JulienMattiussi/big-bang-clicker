import { useEffect, useRef, useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import {
  BELT_MS,
  COMBO_CAP,
  CYCLE_MS,
  EXIT_MS,
  GALET_UNLOCK_LEVEL,
  PART_IDS,
  SPAWN_MS,
  colorOf,
  freshQueue,
  galetEvery,
  partsOf,
  pickOrg,
  planFor,
  type PartId,
  type Piece,
} from './assemblyPlan'
import { OrganismGlyph } from '@/components/art/OrganismGlyph'
import { PartGlyph } from '@/components/art/PartGlyph'
import { Galet } from '@/components/art/Galet'
import { announceGalet } from '@/hooks/useGalets'
import { widgetGaletForEra } from '@/lib/galets'
import { useGameStore } from '@/store/gameStore'
import { WidgetHint } from './WidgetHint'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

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

  // The diversity pebble: it rides this belt once the era's main converter reaches
  // GALET_UNLOCK_LEVEL, until the player clicks it (then it is found for good).
  const defs = useGameStore((s) => s.defs)
  const galetDef = widgetGaletForEra(defs, era.id)
  const galetFound = useGameStore((s) => (galetDef ? !!s.state.galets[galetDef.id]?.found : false))
  const converterId = era.converters[0]
  const converterLevel = useGameStore((s) =>
    converterId ? (s.state.converters[converterId]?.level ?? 0) : 0,
  )
  const galetEligible = !!galetDef && !galetFound && converterLevel >= GALET_UNLOCK_LEVEL

  const nextId = useRef(0)
  const [belt, setBelt] = useState<Piece[]>([])
  // The current plan plus the upcoming organisms (the production queue), as one
  // state so the upcoming list can be seeded distinct from the current organism.
  const [queue, setQueue] = useState(freshQueue)
  const { plan, upcoming } = queue
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
  const upcomingRef = useRef(upcoming)
  useEffect(() => {
    upcomingRef.current = upcoming
  }, [upcoming])
  const beltRef = useRef(belt)
  useEffect(() => {
    beltRef.current = belt
  }, [belt])
  const statusRef = useRef(status)
  useEffect(() => {
    statusRef.current = status
  }, [status])
  const galetEligibleRef = useRef(galetEligible)
  useEffect(() => {
    galetEligibleRef.current = galetEligible
  }, [galetEligible])
  // Whether a pebble is currently on the belt (so we never spawn a second one).
  const galetOnBeltRef = useRef(false)

  // Conveyor: spawn a part on a timer; each part is removed after it has crossed.
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>()
    let last: PartId | null = null
    const emit = (id: PartId, age = 0) => {
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
    const pick = (ids: readonly PartId[]) => ids[Math.floor(Math.random() * ids.length)]!
    // The diversity pebble as a special belt item (clicked to discover it).
    const emitGalet = () => {
      galetOnBeltRef.current = true
      const key = nextId.current++
      setBelt((b) => [...b, { key, id: PART_IDS[0]!, age: 0, galet: true }])
      const tm = setTimeout(() => {
        setBelt((b) => b.filter((p) => p.key !== key))
        galetOnBeltRef.current = false
        timers.delete(tm)
      }, BELT_MS)
      timers.add(tm)
    }
    // Two-tier guarantee, so the belt always holds every part of BOTH the current
    // and the immediate next organism. 1) a current part absent from the belt is
    // produced first (the current one stays completable); 2) then a NEXT part absent
    // from the belt, so the next organism is fully stocked before it ever arrives;
    // 3) once both are covered, keep the belt lively with current parts.
    const chooseId = (): PartId => {
      const onBelt = new Set(beltRef.current.filter((p) => !p.galet).map((p) => p.id))
      const curMissing = planRef.current.slots.filter((s) => !s.filled).map((s) => s.id)
      const curAbsent = curMissing.filter((id) => !onBelt.has(id))
      if (curAbsent.length > 0) return pick(curAbsent)
      const next = upcomingRef.current[0]
      const nextAbsent = next ? partsOf(next).filter((id) => !onBelt.has(id)) : []
      if (nextAbsent.length > 0) return pick(nextAbsent)
      const pool = curMissing.length > 0 ? curMissing : partsOf(planRef.current.org)
      let id = pick(pool) ?? PART_IDS[0]
      // Never spawn the same part twice in a row (the guarantee branches are exempt).
      if (id === last) {
        const others = PART_IDS.filter((p) => p !== last)
        id = pick(others)
      }
      return id
    }
    // Pre-fill a FULL belt that already covers BOTH first organisms: each distinct
    // part they need gets a fresh copy (longest belt life), older ages get current
    // fillers. So nothing the player needs early is about to scroll off.
    const ages: number[] = []
    for (let age = SPAWN_MS; age < BELT_MS; age += SPAWN_MS) ages.push(age)
    const curOrg = planRef.current.org
    const needed = [...new Set([...partsOf(curOrg), ...partsOf(upcomingRef.current[0]!)])]
    const curParts = partsOf(curOrg)
    ages.forEach((age, i) => emit(i < needed.length ? needed[i]! : pick(curParts), age))
    emit(chooseId(), 0)
    // Every tick spawns a part; every ~20-30 parts SEEN, if eligible and not
    // already out, the diversity pebble surfaces (it keeps coming back until
    // clicked). The counter starts at the pre-fill count, so the cadence is in
    // items the player actually sees, not just the ones added afterwards.
    let sinceGalet = ages.length + 1
    let every = galetEvery()
    const tick = () => {
      emit(chooseId(), 0)
      sinceGalet++
      if (galetEligibleRef.current && !galetOnBeltRef.current && sinceGalet >= every) {
        emitGalet()
        sinceGalet = 0
        every = galetEvery()
      }
    }
    const iv = setInterval(tick, SPAWN_MS)
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

  // After the exit animation, the queue advances: the next organism becomes
  // current and a fresh one is drawn at the tail (kept distinct from the queue).
  useEffect(() => {
    if (status === null) return
    const tm = setTimeout(() => {
      const [next, ...rest] = upcomingRef.current
      const tail = pickOrg([next!, ...rest])
      setQueue({ plan: planFor(next!), upcoming: [...rest, tail] })
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
    setQueue((q) => ({
      ...q,
      plan: {
        ...q.plan,
        slots: q.plan.slots.map((sl, i) => (i === slotIdx ? { ...sl, filled: true } : sl)),
      },
    }))
    if (willComplete) resolve('swam')
    return true
  }

  // Click the pebble on the belt: discover it (modal + receptacle), once.
  const grabGalet = (key: number) => {
    if (!galetDef) return
    setBelt((b) => b.filter((p) => p.key !== key))
    galetOnBeltRef.current = false
    announceGalet(galetDef)
  }

  const clickPiece = (piece: Piece) => {
    if (piece.galet) grabGalet(piece.key)
    else grab(piece.key, piece.id)
  }

  // Click a plan slot: grab the earliest matching part on the belt (keyboard path).
  const clickSlot = (i: number) => {
    if (status !== null) return
    const slot = plan.slots[i]
    if (!slot || slot.filled) return
    const piece = belt.find((p) => !p.galet && p.id === slot.id)
    if (piece) grab(piece.key, piece.id)
  }

  const partName = (id: PartId) => t(`assembly.part.${id}` as TranslationKey)
  const orgName = t(`assembly.org.${plan.org}` as TranslationKey)
  const nextOrg = upcoming[0]
  const nextName = nextOrg ? t(`assembly.org.${nextOrg}` as TranslationKey) : ''

  const pieceButton = (piece: Piece, moving: boolean) => {
    const gd = piece.galet ? galetDef : undefined
    return (
      <button
        key={piece.key}
        type="button"
        tabIndex={-1}
        aria-label={gd ? t(gd.nameKey as TranslationKey) : partName(piece.id)}
        onClick={() => clickPiece(piece)}
        style={{
          color: gd ? undefined : colorOf(piece.id),
          ...(moving
            ? {
                animationDuration: `${BELT_MS}ms`,
                // Negative delay places a pre-filled part already part-way across.
                animationDelay: piece.age ? `-${piece.age}ms` : undefined,
              }
            : {}),
        }}
        className={[
          moving ? 'belt-piece top-1/2 -translate-y-1/2' : 'pop-in shrink-0',
          'flex h-16 w-16 items-center justify-center rounded-lg border bg-surface transition hover:brightness-125',
          // The pebble stands out (octarine ring) as the special, clickable relic.
          gd ? 'border-octarine ring-2 ring-octarine/60' : 'border-border',
        ].join(' ')}
      >
        {gd ? (
          <Galet color={gd.color} motif={gd.motif} shape={gd.shape} size={44} />
        ) : (
          <PartGlyph id={piece.id} filled />
        )}
      </button>
    )
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-base font-semibold text-fg">{verb}</span>
        <WidgetHint>{t('assembly.hint')}</WidgetHint>
      </div>

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
            {plan.slots.map((slot, i) => {
              const slotLabel = slot.filled
                ? `${partName(slot.id)} (${t('assembly.fitted')})`
                : `${t('assembly.wanted')} : ${partName(slot.id)}`
              const slotBox = `flex h-16 w-16 items-center justify-center rounded-lg border-2 bg-surface transition ${
                slot.filled ? 'border-current' : 'border-dashed border-border opacity-70'
              }`
              // Slots are interactive only under reduced motion (static tray, no
              // timing): in normal play they would let the player skip the belt.
              return (
                <li key={i}>
                  {reduced ? (
                    <button
                      type="button"
                      onClick={() => clickSlot(i)}
                      disabled={slot.filled}
                      aria-label={slotLabel}
                      style={{ color: colorOf(slot.id) }}
                      className={`${slotBox} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        slot.filled ? '' : 'cursor-pointer hover:opacity-100'
                      }`}
                    >
                      <PartGlyph id={slot.id} filled={slot.filled} />
                    </button>
                  ) : (
                    <span aria-label={slotLabel} style={{ color: colorOf(slot.id) }} className={slotBox}>
                      <PartGlyph id={slot.id} filled={slot.filled} />
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Up next: a discreet preview of the queued organism, so the player can
            anticipate which parts to keep an eye on. */}
        {nextOrg ? (
          <div
            className="ml-2 flex flex-col items-center gap-1 border-l border-border/50 pl-4 text-muted"
            aria-label={`${t('assembly.next')} : ${nextName}`}
          >
            <span className="text-[0.65rem] font-semibold uppercase tracking-wide">
              {t('assembly.next')}
            </span>
            <OrganismGlyph id={nextOrg} className="h-12 w-auto opacity-60" />
            <span className="text-xs">{nextName}</span>
          </div>
        ) : null}
      </div>

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

      <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-border/40">
        {status === null ? (
          <div
            key={cycle}
            className="assembly-timer h-full w-full rounded-full bg-accent"
            style={{ animationDuration: `${CYCLE_MS}ms` }}
          />
        ) : null}
      </div>

      <div className="relative h-24 w-full overflow-hidden rounded-xl border border-border bg-bg/40 shadow-inner">
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
