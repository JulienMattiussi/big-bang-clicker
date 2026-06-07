import { Galet } from '@/components/game/Galet'
import { GALET_SLOTS } from '@/data/galets'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'

/**
 * Receptacle for the infinity pebbles, top-left. Found pebbles fill the slots
 * from the left (click to toggle their effect, hover for the effect); remaining
 * slots show empty "?" placeholders for the rest of the collection. Hidden until
 * the first pebble is found.
 */
export function GaletReceptacle() {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const toggleGalet = useGameStore((s) => s.toggleGalet)

  const found = defs.galets.filter((g) => state.galets[g.id]?.found)
  if (found.length === 0) return null

  return (
    <div
      role="group"
      aria-label={t('galet.receptacle')}
      className="galet-tray flex items-center gap-1.5 rounded-full px-2 py-1.5"
    >
      {Array.from({ length: GALET_SLOTS }, (_, i) => {
        const galet = found[i]
        if (!galet) {
          return (
            <span
              key={`empty-${i}`}
              aria-hidden
              className="galet-socket flex h-9 w-9 items-center justify-center rounded-full text-xs text-muted/50"
            >
              ?
            </span>
          )
        }
        const active = state.galets[galet.id]?.active ?? false
        const name = t(galet.nameKey as TranslationKey)
        const desc = t(galet.descKey as TranslationKey)
        const label = active ? `${name} - ${desc}` : `${name} - ${desc} (${t('galet.inactive')})`
        return (
          <button
            key={galet.id}
            type="button"
            onClick={() => toggleGalet(galet.id)}
            aria-pressed={active}
            title={label}
            className={`galet-socket flex h-9 w-9 items-center justify-center rounded-full transition select-none hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
              active ? 'galet-socket-filled' : ''
            }`}
          >
            <Galet color={galet.color} motif={galet.motif} shape={galet.shape} size={30} dim={!active} />
            <span className="sr-only">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
