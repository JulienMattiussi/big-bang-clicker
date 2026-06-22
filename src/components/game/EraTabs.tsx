import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { EraIcon } from '@/components/game/EraIcon'
import { eraTitle } from '@/components/game/eraTitle'
import { AlertBadge } from '@/components/ui/AlertBadge'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { decliningResources, stalledResources } from '@/lib/graph'
import { MEMORY_MAX_LEVEL, memoryCompletions } from '@/lib/memory'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'

const TAB_BASE =
  'relative flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/** flex gap-2 between tabs, in px (used by the fit computation). */
const TAB_GAP = 8

/**
 * Navigation across UNLOCKED eras only (cohabitation). "Chip" style distinct
 * from the verb button: the active tab is an accent outline (non-clickable),
 * not a filled button. No future era is shown (anti-spoiler).
 *
 * The tabs stay on a single line: when they no longer all fit, the ones
 * furthest from the active tab collapse to their icon alone, keeping the
 * labels of the active tab and its closest neighbours. A hidden full-width
 * copy is measured to drive the decision.
 */
export function EraTabs() {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const current = state.currentEraId
  const setEra = useGameStore((s) => s.setEra)

  const navRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  // era ids whose label is shown; null means "not measured yet, show all".
  const [labeled, setLabeled] = useState<Set<string> | null>(null)

  const visible = useMemo(
    () => defs.eras.filter((era) => state.unlockedEras.includes(era.id)),
    [defs.eras, state.unlockedEras],
  )

  useLayoutEffect(() => {
    const nav = navRef.current
    const measure = measureRef.current
    if (!nav || !measure || visible.length <= 1) return

    const fit = () => {
      const width = nav.clientWidth
      const items = Array.from(measure.querySelectorAll<HTMLElement>('[data-tab]'))
      if (items.length !== visible.length) return
      const metrics = items.map((el) => {
        const label = el.querySelector<HTMLElement>('[data-label]')
        const labelW = label ? label.offsetWidth + 4 /* gap-1 */ : 0
        return { full: el.offsetWidth, cost: labelW }
      })
      const n = metrics.length
      // Baseline: every tab collapsed to its icon, plus the gaps between them.
      const baseline = metrics.reduce((sum, m) => sum + (m.full - m.cost), 0) + TAB_GAP * (n - 1)
      let budget = width - baseline

      const show = new Array<boolean>(n).fill(false)
      const activeIdx = visible.findIndex((e) => e.id === current)
      // The active tab always keeps its label, even if it overflows.
      if (activeIdx >= 0) {
        show[activeIdx] = true
        budget -= metrics[activeIdx]!.cost
      }
      // Expand outward from the active tab; stop at the first label that no
      // longer fits so the labelled tabs stay contiguous around the active one.
      const rest = [...metrics.keys()]
        .filter((i) => i !== activeIdx)
        .sort((a, b) => Math.abs(a - activeIdx) - Math.abs(b - activeIdx))
      for (const i of rest) {
        if (budget - metrics[i]!.cost < 0) break
        show[i] = true
        budget -= metrics[i]!.cost
      }

      const next = new Set(visible.filter((_, i) => show[i]).map((e) => e.id))
      setLabeled((prev) => {
        if (prev && prev.size === next.size && [...next].every((id) => prev.has(id))) return prev
        return next
      })
    }

    fit()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(fit)
    ro.observe(nav)
    return () => ro.disconnect()
  }, [visible, current])

  if (visible.length <= 1) return null

  // A tab flags when one of its era's resources is shrinking (red) or its
  // production is stalled at zero (yellow).
  const declining = decliningResources(state, defs)
  const stalled = stalledResources(state, defs)

  const renderTab = (era: (typeof visible)[number], showLabel: boolean) => {
    const active = era.id === current
    const name = t(era.nameKey as TranslationKey)
    // Numbered form ("Ère 1 : Big Bang") for the tooltip and the icon-only a11y name.
    const numbered = eraTitle(t('era.word'), era.index, name)
    const done = memoryCompletions(state, era.id)
    const tip =
      done > 0 ? `${numbered} (${t('memory.eraLevel').replace('{n}', String(done))})` : numbered
    return (
      <button
        key={era.id}
        data-tab
        type="button"
        disabled={active}
        aria-current={active ? 'true' : undefined}
        aria-label={showLabel ? undefined : tip}
        title={tip}
        onClick={() => setEra(era.id)}
        className={`${TAB_BASE} ${
          active
            ? 'cursor-default border-accent bg-surface text-accent'
            : 'border-border bg-bg text-muted hover:bg-surface hover:text-fg'
        }`}
      >
        {/* 24px glyph but -m-0.5 keeps its layout footprint at 20px, so the icon
            looks bigger while the tab size stays put (it overflows into padding). */}
        <span className="relative -m-0.5 inline-flex shrink-0">
          <EraIcon icon={era.icon} className="h-6 w-6" />
          {done > 0 ? (
            <span className="absolute -right-1 -bottom-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-bg text-octarine">
              {done >= MEMORY_MAX_LEVEL ? (
                <Icon name="trophy" className="h-2.5 w-2.5" aria-hidden />
              ) : (
                <span className="text-[9px] leading-none font-bold" aria-hidden>
                  {done}
                </span>
              )}
            </span>
          ) : null}
        </span>
        {/* Label always present (animated collapse/expand); the gap to the icon
            is its own margin so it disappears cleanly when collapsed. */}
        <span
          data-label
          className={`tab-label ${showLabel ? 'tab-label-open' : 'tab-label-closed'}`}
        >
          {name}
        </span>
        {/* Notification badge overlapping the whole tab's corner:
            red for a declining resource, yellow for a production stalled at zero. */}
        {era.resources.some((r) => declining.has(r)) ? (
          <AlertBadge kind="decline" labelKey="alert.eraDeclining" size="md" />
        ) : era.resources.some((r) => stalled.has(r)) ? (
          <AlertBadge kind="stall" labelKey="alert.eraStalled" size="md" />
        ) : null}
      </button>
    )
  }

  return (
    <>
      <nav
        ref={navRef}
        aria-label={t('nav.eras')}
        /* No overflow-hidden: the fit computation keeps tabs on one line, and
           hiding overflow would clip the alert badges that sit on each corner. */
        className="flex min-w-0 flex-nowrap gap-2"
      >
        {visible.map((era) => renderTab(era, labeled ? labeled.has(era.id) : true))}
      </nav>
      {/* Hidden full-width copy, measured to decide which labels fit. */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute flex gap-2"
        style={{ left: -99999, top: 0 }}
      >
        {visible.map((era) => renderTab(era, true))}
      </div>
    </>
  )
}
