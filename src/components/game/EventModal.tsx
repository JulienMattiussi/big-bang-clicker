import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { EraIcon } from '@/components/game/EraIcon'
import { EventHero, type HeroTone } from '@/components/game/EventHero'
import { CrisisScene } from '@/components/art/CrisisScene'
import { UniverseCityScene } from '@/components/art/UniverseCityScene'
import { ChainReactionScene } from '@/components/art/ChainReactionScene'
import { Galet } from '@/components/art/Galet'
import { useGameStore } from '@/store/gameStore'
import { useMemoryStore } from '@/store/memoryStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { useGaletStore } from '@/store/galetStore'
import { useCrisisStore, CRISIS_GAMES } from '@/store/crisisStore'
import { describeCrisisEffect, type CrisisEffectLine } from './crisisEffectText'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { EventTone } from '@/lib/events'

/** Header tint by tone for the plain (non-hero) fallback. */
const TONE_COLOR: Record<EventTone, string> = {
  transition: 'text-accent',
  regression: 'text-accent',
  tutorial: 'text-secondary',
}

/**
 * Narrative event modal: era transitions, feature unlocks, the first-machine
 * tutorial, crises and the pebble discovery. Shows the front event of the queue;
 * the button dismisses it (and may trigger a one-shot effect). The dramatic
 * events share one layout via EventHero; the pebble keeps a bespoke layout, and
 * plain narrative events fall back to a simple title + body.
 */
export function EventModal() {
  const { t } = useTranslation()
  const event = useGameStore((s) => s.state.pendingEvents[0])
  const dismiss = useGameStore((s) => s.dismissEvent)
  const defs = useGameStore((s) => s.defs)
  const resources = useGameStore((s) => s.state.resources)
  const galet = useGameStore((s) =>
    event?.galetId ? s.defs.galets.find((g) => g.id === event.galetId) : undefined,
  )

  if (!event) return null

  // Era unlock: id is `era:<id>`; the era tints the modal in its tier.
  const eraId = event.id.startsWith('era:') ? event.id.slice(4) : null
  const era = eraId ? defs.eras.find((e) => e.id === eraId) : undefined
  const isMemory = event.id === 'feature:memory'
  const isBackpack = event.id === 'feature:backpack'
  const crisisId = event.id.startsWith('crisis:') ? event.id.slice('crisis:'.length) : null
  // A crisis with a survival mini-game: closing the modal drops into the widget.
  const crisisGame = crisisId !== null && CRISIS_GAMES.has(crisisId)
  const isCrisisWon = event.id.startsWith('crisis-won:')
  const isChain = event.id === 'endgame:chain'

  // Explicit, data-driven effect lines: the regression on the trigger modal, the
  // rebound on the "overcome" modal (derived from the crisis data).
  const effectCrisisId = crisisId ?? (isCrisisWon ? event.id.slice('crisis-won:'.length) : null)
  const effectDef = effectCrisisId ? defs.crises[effectCrisisId] : undefined
  const effectLines = effectDef
    ? (isCrisisWon ? effectDef.rebound : effectDef.regression)
        .map((e) => describeCrisisEffect(e, t, defs, resources))
        .filter((line): line is CrisisEffectLine => line !== null)
    : []

  const handleDismiss = () => {
    if (isMemory) useMemoryStore.getState().flash()
    if (isBackpack) useInventoryStore.getState().flash()
    if (galet) useGaletStore.getState().flash(galet.id)
    // Confronting a crisis: jump to its era and launch its mini-game on close.
    if (crisisGame && crisisId) {
      const eraOfCrisis = defs.crises[crisisId]?.eraId
      if (eraOfCrisis) useGameStore.getState().setEra(eraOfCrisis)
      useCrisisStore.getState().start(crisisId)
    }
    dismiss()
  }

  const title = t(event.titleKey as TranslationKey)
  const body = t(event.bodyKey as TranslationKey)

  // Resolve the shared hero treatment (everything but the pebble and the plain
  // fallback). tone drives the eyebrow/glow; glyph is the central illustration.
  let hero: { tone: HeroTone; eyebrow: string; glyph: ReactNode; wide?: boolean } | null = null
  if (era) {
    // The final era opens on a grand universe-city illustration, not its tab icon.
    hero =
      era.id === 'e19'
        ? {
            tone: 'accent',
            eyebrow: t('era.unlocked.eyebrow'),
            wide: true,
            glyph: <UniverseCityScene className="relative h-32 w-auto" />,
          }
        : {
            tone: 'accent',
            eyebrow: t('era.unlocked.eyebrow'),
            glyph: <EraIcon icon={era.icon} className="relative h-20 w-20" />,
          }
  } else if (isMemory) {
    hero = {
      tone: 'octarine',
      eyebrow: t('memory.event.eyebrow'),
      glyph: <Icon name="card" className="relative h-16 w-16 text-octarine" />,
    }
  } else if (isBackpack) {
    hero = {
      tone: 'accent',
      eyebrow: t('inventory.event.eyebrow'),
      glyph: <Icon name="backpack" className="relative h-16 w-16 text-accent" />,
    }
  } else if (isCrisisWon) {
    hero = {
      tone: 'accent',
      eyebrow: t('crisis.overcome.eyebrow'),
      glyph: <Icon name="sunrise" className="relative h-16 w-16 text-accent" />,
    }
  } else if (isChain) {
    hero = {
      tone: 'danger',
      eyebrow: t('app.collapse'),
      wide: true,
      glyph: <ChainReactionScene className="relative h-32 w-auto" />,
    }
  } else if (crisisId) {
    hero = {
      tone: 'danger',
      eyebrow: t('crisis.eyebrow'),
      wide: true,
      glyph: <CrisisScene id={crisisId} className="relative h-32 w-auto" />,
    }
  }

  const octarine = !!galet || isMemory || !!event.complexityFactor
  const accentBorder = !!era || isBackpack || isCrisisWon
  const centered = !!galet || hero !== null

  return (
    <Modal
      key={event.id}
      onClose={handleDismiss}
      labelledBy="event-title"
      tier={era?.uiTier}
      className={`w-full max-w-md rounded-lg border bg-surface p-6 text-fg shadow-xl ${
        crisisId || isChain ? 'crisis-modal' : 'modal-in'
      } ${
        octarine
          ? 'complexity-glow border-octarine/50'
          : accentBorder
            ? 'border-accent/50 shadow-[0_0_45px_-10px_var(--color-accent)]'
            : crisisId || isChain
              ? 'border-red-500/50'
              : 'border-border'
      }`}
    >
      {galet ? (
        // Legendary relic discovery: bespoke layout (title first, power box).
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-octarine uppercase">
            <span aria-hidden>✦</span>
            {t('galet.found.eyebrow')}
            <span aria-hidden>✦</span>
          </span>
          <h2 id="event-title" className="text-2xl font-bold">
            {t('galet.found.title')}
          </h2>
          <div className="relative my-1 flex h-32 w-32 items-center justify-center">
            <div
              aria-hidden
              className="bg-breathe absolute inset-0 rounded-full blur-md"
              style={{
                background: `radial-gradient(circle, ${galet.color}, transparent 68%)`,
                opacity: 0.55,
              }}
            />
            <div className="relative">
              <Galet color={galet.color} motif={galet.motif} shape={galet.shape} size={112} />
            </div>
          </div>
          <span className="text-lg font-semibold text-accent">
            {t(galet.nameKey as TranslationKey)}
          </span>
          <p className="leading-relaxed text-muted">{t(galet.loreKey as TranslationKey)}</p>
          <div className="mt-1 flex w-full items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-left">
            <span className="shrink-0">
              <Galet color={galet.color} motif={galet.motif} shape={galet.shape} size={24} />
            </span>
            <span className="text-sm">
              <span className="font-semibold text-fg">{t('galet.found.power')} : </span>
              <span className="text-muted">{t(galet.descKey as TranslationKey)}</span>
            </span>
          </div>
        </div>
      ) : hero ? (
        <EventHero
          tone={hero.tone}
          eyebrow={hero.eyebrow}
          title={title}
          body={body}
          wide={hero.wide}
        >
          {hero.glyph}
        </EventHero>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3">
            {event.icon ? (
              <Icon name={event.icon} className={`h-7 w-7 shrink-0 ${TONE_COLOR[event.tone]}`} />
            ) : null}
            <h2 id="event-title" className="text-xl font-bold">
              {title}
            </h2>
          </div>
          <p className="mb-5 leading-relaxed text-muted">{body}</p>
          {event.complexityFactor ? (
            <div className="mb-2 flex items-center justify-center gap-2 text-octarine">
              <span className="text-4xl font-extrabold tabular-nums">
                ×{event.complexityFactor}
              </span>
              <Icon name="gem" className="h-10 w-10" aria-hidden />
            </div>
          ) : null}
        </>
      )}

      {effectLines.length > 0 ? (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-left ${
            isCrisisWon ? 'border-accent/40 bg-accent/10' : 'border-red-500/40 bg-red-500/10'
          }`}
        >
          <span
            className={`text-xs font-semibold tracking-wide uppercase ${
              isCrisisWon ? 'text-accent' : 'text-red-400'
            }`}
          >
            {t(isCrisisWon ? 'crisis.effect.boost' : 'crisis.effect.damage')}
          </span>
          <ul className="mt-1.5 flex flex-col gap-1 text-sm">
            {effectLines.map((line, i) => {
              const res = line.resource
              const otherEra =
                res && res.eraId !== effectDef?.eraId
                  ? defs.eras.find((e) => e.id === res.eraId)
                  : undefined
              return (
                <li key={i} className="flex items-center gap-1.5">
                  {res ? (
                    res.symbol ? (
                      <span aria-hidden className="w-4 text-center text-xs leading-none font-bold">
                        {res.symbol}
                      </span>
                    ) : (
                      <Icon name={res.icon} className="h-4 w-4 shrink-0" />
                    )
                  ) : null}
                  {otherEra ? <EraIcon icon={otherEra.icon} className="h-4 w-4 shrink-0" /> : null}
                  <span className="flex-1 truncate text-fg">{line.label}</span>
                  <span
                    className={`shrink-0 font-semibold tabular-nums ${
                      isCrisisWon ? 'text-accent' : 'text-red-400'
                    }`}
                  >
                    {line.detail}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <div className={`mt-5 flex ${centered ? 'justify-center' : 'justify-end'}`}>
        <Button autoFocus onClick={handleDismiss}>
          {crisisGame ? t('crisis.confront') : galet ? t('galet.found.cta') : t('event.continue')}
        </Button>
      </div>
    </Modal>
  )
}
