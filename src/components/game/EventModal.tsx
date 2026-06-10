import type { KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { EraIcon } from '@/components/game/EraIcon'
import { CrisisScene } from '@/components/game/CrisisScene'
import { Galet } from '@/components/game/Galet'
import { useEventStore } from '@/store/eventStore'
import { useGameStore } from '@/store/gameStore'
import { useMemoryStore } from '@/store/memoryStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { useGaletStore } from '@/store/galetStore'
import { useCrisisStore, CRISIS_GAMES } from '@/store/crisisStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { EventTone } from '@/lib/events'

/** Header tint by tone (semantic tokens only). */
const TONE_COLOR: Record<EventTone, string> = {
  transition: 'text-accent',
  regression: 'text-accent',
  tutorial: 'text-secondary',
}

/**
 * Narrative event modal: era transitions, the first-machine tutorial, crisis
 * (regression) announcements, and the elaborate discovery of an infinity pebble.
 * Shows the front event of the queue; the button dismisses it (next, if any).
 *
 * Two "hero" treatments: the infinity-pebble discovery (octarine), and an era
 * unlock - the same hype, but tinted in the INCOMING era's colour via its
 * `data-tier` (accent), not octarine.
 */
export function EventModal() {
  const { t } = useTranslation()
  const event = useEventStore((s) => s.queue[0])
  const dismiss = useEventStore((s) => s.dismiss)
  const defs = useGameStore((s) => s.defs)
  const galet = useGameStore((s) =>
    event?.galetId ? s.defs.galets.find((g) => g.id === event.galetId) : undefined,
  )

  if (!event) return null

  // Era unlock: id is `era:<id>`; look up the era to tint the modal in its tier.
  const eraId = event.id.startsWith('era:') ? event.id.slice(4) : null
  const era = eraId ? defs.eras.find((e) => e.id === eraId) : undefined
  // The memory feature unlock gets its own hero treatment (octarine).
  const isMemory = event.id === 'feature:memory'
  // The backpack (inventory) unlock: accent hero, then its button settles in.
  const isBackpack = event.id === 'feature:backpack'
  // A crisis (regression): a dramatic red hero with the impact illustration.
  const crisisId = event.id.startsWith('crisis:') ? event.id.slice('crisis:'.length) : null
  // A crisis with a survival mini-game: the modal IS the call to action, and
  // closing it drops the player straight into the widget.
  const crisisGame = crisisId !== null && CRISIS_GAMES.has(crisisId)
  // A crisis overcome: life springs back (green/accent celebration).
  const isCrisisWon = event.id.startsWith('crisis-won:')

  const handleDismiss = () => {
    // Closing a feature unlock flashes its button so the player spots the new power.
    if (isMemory) useMemoryStore.getState().flash()
    if (isBackpack) useInventoryStore.getState().flash()
    // A discovered pebble shrinks into its receptacle socket.
    if (galet) useGaletStore.getState().flash(galet.id)
    // Confronting a crisis: jump to its era and launch its mini-game on close.
    if (crisisGame && crisisId) {
      const eraOfCrisis = defs.crises[crisisId]?.eraId
      if (eraOfCrisis) useGameStore.getState().setEra(eraOfCrisis)
      useCrisisStore.getState().start(crisisId)
    }
    dismiss()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleDismiss()
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onKeyDown={onKeyDown}
    >
      <div
        key={event.id}
        data-tier={era ? era.uiTier : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        className={`w-full max-w-md rounded-lg border bg-surface p-6 text-fg shadow-xl ${
          crisisId ? 'crisis-modal' : 'modal-in'
        } ${
          galet || isMemory
            ? 'complexity-glow border-octarine/50'
            : era || isBackpack
              ? 'border-accent/50 shadow-[0_0_45px_-10px_var(--color-accent)]'
              : crisisId
                ? 'border-red-500/50'
                : 'border-border'
        }`}
      >
        {galet ? (
          // Legendary relic discovery: hype the moment.
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
        ) : era ? (
          // Era unlock: a new era dawns, tinted in the incoming era's colour.
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-accent uppercase">
              <span aria-hidden>✦</span>
              {t('era.unlocked.eyebrow')}
              <span aria-hidden>✦</span>
            </span>
            <div className="relative my-1 flex h-28 w-28 items-center justify-center">
              <div
                aria-hidden
                className="bg-breathe absolute inset-0 rounded-full blur-md"
                style={{
                  background: 'radial-gradient(circle, var(--color-accent), transparent 68%)',
                  opacity: 0.5,
                }}
              />
              <EraIcon icon={era.icon} className="relative h-20 w-20" />
            </div>
            <h2 id="event-title" className="text-2xl font-bold">
              {t(event.titleKey as TranslationKey)}
            </h2>
            <p className="leading-relaxed text-muted">{t(event.bodyKey as TranslationKey)}</p>
          </div>
        ) : isMemory ? (
          // Major new power: the eternal memory of the universe (octarine hero).
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-octarine uppercase">
              <span aria-hidden>✦</span>
              {t('memory.event.eyebrow')}
              <span aria-hidden>✦</span>
            </span>
            <div className="relative my-1 flex h-28 w-28 items-center justify-center">
              <div
                aria-hidden
                className="bg-breathe absolute inset-0 rounded-full blur-md"
                style={{
                  background: 'radial-gradient(circle, var(--color-octarine), transparent 68%)',
                  opacity: 0.5,
                }}
              />
              <Icon name="card" className="relative h-16 w-16 text-octarine" />
            </div>
            <h2 id="event-title" className="text-2xl font-bold">
              {t(event.titleKey as TranslationKey)}
            </h2>
            <p className="leading-relaxed text-muted">{t(event.bodyKey as TranslationKey)}</p>
          </div>
        ) : isBackpack ? (
          // New overview unlocked: the backpack (accent hero).
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-accent uppercase">
              <span aria-hidden>✦</span>
              {t('inventory.event.eyebrow')}
              <span aria-hidden>✦</span>
            </span>
            <div className="relative my-1 flex h-28 w-28 items-center justify-center">
              <div
                aria-hidden
                className="bg-breathe absolute inset-0 rounded-full blur-md"
                style={{
                  background: 'radial-gradient(circle, var(--color-accent), transparent 68%)',
                  opacity: 0.5,
                }}
              />
              <Icon name="backpack" className="relative h-16 w-16 text-accent" />
            </div>
            <h2 id="event-title" className="text-2xl font-bold">
              {t(event.titleKey as TranslationKey)}
            </h2>
            <p className="leading-relaxed text-muted">{t(event.bodyKey as TranslationKey)}</p>
          </div>
        ) : crisisId ? (
          // Crisis: a dramatic red hero with the large impact illustration.
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-red-400 uppercase">
              <Icon name="skull" className="h-3.5 w-3.5" aria-hidden />
              {t('crisis.eyebrow')}
              <Icon name="skull" className="h-3.5 w-3.5" aria-hidden />
            </span>
            {/* The illustration's accent is forced to danger red (the SVG reads
                var(--color-accent), inherited from this wrapper). */}
            <div className="relative my-1 flex h-32 w-full items-center justify-center [--color-accent:#ef4444]">
              <div
                aria-hidden
                className="crisis-flash absolute inset-0 blur-xl"
                style={{ background: 'radial-gradient(circle, #ef4444, transparent 65%)', opacity: 0.35 }}
              />
              <CrisisScene id={crisisId} className="relative h-32 w-auto" />
            </div>
            <h2 id="event-title" className="text-2xl font-bold">
              {t(event.titleKey as TranslationKey)}
            </h2>
            <p className="leading-relaxed text-muted">{t(event.bodyKey as TranslationKey)}</p>
          </div>
        ) : isCrisisWon ? (
          // Crisis overcome: life springs back, greener (accent celebration).
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] text-accent uppercase">
              <span aria-hidden>✦</span>
              {t('crisis.overcome.eyebrow')}
              <span aria-hidden>✦</span>
            </span>
            <div className="relative my-1 flex h-28 w-28 items-center justify-center">
              <div
                aria-hidden
                className="bg-breathe absolute inset-0 rounded-full blur-md"
                style={{
                  background: 'radial-gradient(circle, var(--color-accent), transparent 68%)',
                  opacity: 0.5,
                }}
              />
              <Icon name="flora" className="relative h-16 w-16 text-accent" />
            </div>
            <h2 id="event-title" className="text-2xl font-bold">
              {t(event.titleKey as TranslationKey)}
            </h2>
            <p className="leading-relaxed text-muted">{t(event.bodyKey as TranslationKey)}</p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3">
              {event.icon ? (
                <Icon name={event.icon} className={`h-7 w-7 shrink-0 ${TONE_COLOR[event.tone]}`} />
              ) : null}
              <h2 id="event-title" className="text-xl font-bold">
                {t(event.titleKey as TranslationKey)}
              </h2>
            </div>
            <p className="mb-5 leading-relaxed text-muted">{t(event.bodyKey as TranslationKey)}</p>
          </>
        )}

        <div
          className={`mt-5 flex ${galet || era || isMemory || isBackpack || crisisId || isCrisisWon ? 'justify-center' : 'justify-end'}`}
        >
          <Button autoFocus onClick={handleDismiss}>
            {crisisGame ? t('crisis.confront') : galet ? t('galet.found.cta') : t('event.continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}
