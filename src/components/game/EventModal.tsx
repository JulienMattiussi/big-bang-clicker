import type { KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useEventStore } from '@/store/eventStore'
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
 * (regression) announcements, and a home for comic references. Shows the front
 * event of the queue; "Continuer" dismisses it (and reveals the next, if any).
 */
export function EventModal() {
  const { t } = useTranslation()
  const event = useEventStore((s) => s.queue[0])
  const dismiss = useEventStore((s) => s.dismiss)

  if (!event) return null

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') dismiss()
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onKeyDown={onKeyDown}
    >
      {/* key per event so it re-mounts and re-focuses the button each time. */}
      <div
        key={event.id}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        className="modal-in w-full max-w-md rounded-lg border border-border bg-surface p-6 text-fg shadow-xl"
      >
        <div className="mb-3 flex items-center gap-3">
          {event.icon ? (
            <Icon name={event.icon} className={`h-7 w-7 shrink-0 ${TONE_COLOR[event.tone]}`} />
          ) : null}
          <h2 id="event-title" className="text-xl font-bold">
            {t(event.titleKey as TranslationKey)}
          </h2>
        </div>
        <p className="mb-5 leading-relaxed text-muted">{t(event.bodyKey as TranslationKey)}</p>
        <div className="flex justify-end">
          <Button autoFocus onClick={dismiss}>
            {t('event.continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}
