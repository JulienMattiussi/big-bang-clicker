import type { KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Galet } from '@/components/game/Galet'
import { useEventStore } from '@/store/eventStore'
import { useGameStore } from '@/store/gameStore'
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
 */
export function EventModal() {
  const { t } = useTranslation()
  const event = useEventStore((s) => s.queue[0])
  const dismiss = useEventStore((s) => s.dismiss)
  const galet = useGameStore((s) =>
    event?.galetId ? s.defs.galets.find((g) => g.id === event.galetId) : undefined,
  )

  if (!event) return null

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') dismiss()
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onKeyDown={onKeyDown}
    >
      <div
        key={event.id}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        className={`modal-in w-full max-w-md rounded-lg border bg-surface p-6 text-fg shadow-xl ${
          galet ? 'complexity-glow border-octarine/50' : 'border-border'
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
                style={{ background: `radial-gradient(circle, ${galet.color}, transparent 68%)`, opacity: 0.55 }}
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

        <div className="mt-5 flex justify-end">
          <Button autoFocus onClick={dismiss}>
            {galet ? t('galet.found.cta') : t('event.continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}
