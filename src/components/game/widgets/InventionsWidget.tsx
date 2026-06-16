import { useState, type ReactElement } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { WidgetGalet } from './WidgetGalet'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { Icon } from '@/components/ui/Icon'
import { InventionGlyph, VariantGlyph } from '@/components/art/InventionGlyph'
import { INVENTIONS, VARIANTS } from '@/data/inventions'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

/** Clicks per invention: 10 on the base loop, +2 per variant loop (12, 14, ...). */
const clicksFor = (variant: number) => 10 + variant * 2

/**
 * Era 14 (Industrial Revolution): tap on the left to charge the invention gauge;
 * each full gauge produces a free batch of Technology and reveals the next real
 * invention on the right, in historical order. Discoveries are persisted across
 * reloads. Full-width.
 */
export function InventionsWidget({ era }: { era: EraDef }): ReactElement {
  const { t } = useTranslation()
  const { verb, gainBase, gainCombinedScaled } = useEraMechanic(era)

  const discovered = useGameStore((s) => s.state.inventions)
  const crises = useGameStore((s) => s.state.crises)
  const discoverInvention = useGameStore((s) => s.discoverInvention)
  const triggerCrisis = useGameStore((s) => s.triggerCrisis)

  const [gauge, setGauge] = useState(0)
  // The card starts on the latest invention (newest takes focus on discovery).
  const [viewIndex, setViewIndex] = useState(() => Math.max(0, discovered - 1))

  // Discoverable timeline of the current cycle: the full list minus the crises
  // already overcome. After a crisis, discovery restarts from the first invention
  // (resetInventions), and that crisis is dropped here, so the next pass runs a
  // little further before reaching the following crisis.
  const timeline = INVENTIONS.filter((inv) => !inv.crisis || !crises[inv.crisis]?.resolved)
  // True once at least one crisis has been overcome: the restart from zero then
  // carries a "humanity fell back but rebounds" message instead of the plain hint.
  const afterCrisis = INVENTIONS.some((inv) => inv.crisis && crises[inv.crisis]?.resolved)

  // The gauge charges the NEXT entry to reveal; its loop sets the click cost.
  const charging = timeline[Math.min(discovered, timeline.length - 1)]
  const need = clicksFor(charging?.variant ?? 0)
  const shownIndex = discovered > 0 ? Math.min(viewIndex, discovered - 1) : -1
  const shown = shownIndex >= 0 ? timeline[shownIndex] : null
  const isLatest = shownIndex === discovered - 1

  // Variant 0 is the original; later loops append a buzzword tag/note and recolour.
  const variant = shown && shown.variant > 0 ? VARIANTS[shown.variant - 1] : null
  const title = shown
    ? t(`invention.${shown.id}.title` as TranslationKey) +
      (variant ? ` ${t(`invent.variant.${variant.key}.tag` as TranslationKey)}` : '')
    : ''
  const desc = shown
    ? t(`invention.${shown.id}.desc` as TranslationKey) +
      (variant ? ` ${t(`invent.variant.${variant.key}.note` as TranslationKey)}` : '')
    : ''

  // Side effects (complete/discover) stay OUT of the setState updater: in dev
  // StrictMode the updater runs twice, which would fire them twice (two inventions
  // at once). A click is its own event, so reading `gauge` from render is fresh.
  const tap = () => {
    gainBase(1)
    if (gauge + 1 < need) {
      setGauge(gauge + 1)
      return
    }
    setGauge(0)
    const next = timeline[discovered]
    if (!next) return // whole current timeline seen: nothing new
    // Reaching an unresolved crisis fires it (it is not an invention card, and not
    // counted): on resolution the discovery restarts from the first invention.
    if (next.crisis) {
      triggerCrisis(next.crisis)
      return
    }
    gainCombinedScaled(1) // +1 Technology per invention, scaled by the era's factory level
    discoverInvention()
    setViewIndex(discovered) // jump the card to the freshly revealed invention
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <span className="inline-flex items-center gap-2 text-base font-semibold text-fg">
        {verb}
        <WidgetGalet />
      </span>

      <div className="grid w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-surface/80 md:h-104 md:grid-cols-2 md:items-stretch">
        <div className="flex flex-col items-center justify-center gap-6 border-b border-border p-6 md:border-r md:border-b-0">
          <button
            type="button"
            onClick={tap}
            aria-label={verb}
            className="group flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-full border-2 border-accent bg-bg/60 text-accent transition select-none active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon
              name={era.icon}
              className="h-14 w-14 transition-transform group-active:-rotate-12"
            />
            <span className="text-sm font-semibold">{verb}</span>
          </button>

          <div className="flex w-full max-w-xs flex-col gap-1.5">
            <span className="text-center text-xs uppercase tracking-wide text-muted">
              {t('invent.gauge')}
            </span>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={need}
              aria-valuenow={gauge}
              aria-label={t('invent.gauge')}
              className="h-3 w-full overflow-hidden rounded-full border border-border bg-bg/60"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-150"
                style={{ width: `${(gauge / need) * 100}%` }}
              />
            </div>
            {discovered > 0 ? (
              <span className="text-center text-xs text-muted">
                {t('invent.count').replace('{n}', String(discovered))}
              </span>
            ) : null}
          </div>
        </div>

        <section aria-label={t('invent.title')} className="flex w-full flex-col gap-3 p-3">
          {shown === null ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              {afterCrisis ? (
                <p className="text-sm leading-snug font-semibold text-accent">
                  {t('invent.restart')}
                </p>
              ) : null}
              <p className="text-sm text-muted">{t('invent.empty')}</p>
            </div>
          ) : (
            <>
              {/* Every zone has a reserved, fixed size so the card never grows or
                  shrinks with the badge, the image, or the description length. */}
              <article
                key={`${shown.id}-${shown.variant}`}
                className="modal-in flex flex-1 flex-col gap-2 overflow-hidden rounded-md border border-border bg-bg/50 p-4 text-center"
              >
                <div className="flex h-6 shrink-0 items-center justify-center">
                  {isLatest ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-accent uppercase">
                      <Icon name="party" className="h-3.5 w-3.5" />
                      {t('invent.latest')}
                    </span>
                  ) : null}
                </div>
                <h3 className="line-clamp-2 flex h-11 shrink-0 items-center justify-center text-base font-semibold text-fg">
                  {title}
                </h3>
                <div
                  className="relative flex flex-1 items-center justify-center text-accent"
                  style={variant ? { color: variant.color } : undefined}
                >
                  <InventionGlyph id={shown.id} className="h-32 w-32" />
                  {variant ? (
                    <span className="absolute top-1 right-1 rounded-full border border-border bg-surface/85 p-1.5">
                      <VariantGlyph variantKey={variant.key} className="h-5 w-5" />
                    </span>
                  ) : null}
                </div>
                <p className="line-clamp-3 h-14 shrink-0 text-center text-sm leading-snug text-muted">
                  {desc}
                </p>
                <span className="inline-flex shrink-0 items-center gap-1.5 self-end rounded-full border border-border bg-surface/70 px-3 py-1 text-sm font-semibold text-fg tabular-nums">
                  <Icon name="calendar" className="h-3.5 w-3.5 text-accent" />
                  {shown.year}
                </span>
              </article>

              {/* Reserved slider slot: present even with a single invention, so the
                  card height stays constant whether or not navigation is available. */}
              <div className="flex h-5 shrink-0 items-center">
                {discovered > 1 ? (
                  <input
                    type="range"
                    min={0}
                    // While more remain to discover, the track extends one slot past
                    // the latest so the thumb sits short of the right edge: a hint
                    // that the list keeps going. Navigation still clamps to what's known.
                    max={discovered < timeline.length ? discovered : discovered - 1}
                    value={Math.min(viewIndex, discovered - 1)}
                    onChange={(e) => setViewIndex(Math.min(Number(e.target.value), discovered - 1))}
                    aria-label={t('invent.navigate')}
                    className="w-full accent-accent"
                  />
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
