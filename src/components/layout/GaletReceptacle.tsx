import { useState } from 'react'
import { Galet } from '@/components/game/Galet'
import { GALET_SLOTS } from '@/data/galets'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'

/**
 * Receptacle for the infinity pebbles, top-left. Found pebbles fill the slots
 * (click to toggle their effect); remaining slots show empty "?" placeholders.
 * Hovering or focusing a pebble opens a styled card (the pebble enlarged, its
 * name, status and effect). Hidden until the first pebble is found.
 */
export function GaletReceptacle() {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const toggleGalet = useGameStore((s) => s.toggleGalet)
  const [hovered, setHovered] = useState<string | null>(null)

  const found = defs.galets.filter((g) => state.galets[g.id]?.found)
  if (found.length === 0) return null

  const card = found.find((g) => g.id === hovered)
  const cardActive = card ? (state.galets[card.id]?.active ?? false) : false

  return (
    <div className="relative">
      <div role="group" aria-label={t('galet.receptacle')} className="galet-tray flex items-center gap-1.5 rounded-full px-2 py-1.5">
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
              onMouseEnter={() => setHovered(galet.id)}
              onMouseLeave={() => setHovered((h) => (h === galet.id ? null : h))}
              onFocus={() => setHovered(galet.id)}
              onBlur={() => setHovered((h) => (h === galet.id ? null : h))}
              aria-pressed={active}
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

      {/* Styled hover/focus card: the pebble enlarged, its name, status, effect. */}
      {card ? (
        <div
          role="tooltip"
          className="shadow-float modal-in absolute top-full left-0 z-30 mt-2 w-80 rounded-lg border border-octarine/40 bg-surface p-3 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <div
                aria-hidden
                className="absolute inset-0 rounded-full blur-md"
                style={{
                  background: `radial-gradient(circle, ${card.color}, transparent 70%)`,
                  opacity: cardActive ? 0.5 : 0.2,
                }}
              />
              <div className="relative">
                <Galet color={card.color} motif={card.motif} shape={card.shape} size={52} dim={!cardActive} />
              </div>
            </div>
            <div className="min-w-0">
              <div className="leading-tight font-semibold text-fg">{t(card.nameKey as TranslationKey)}</div>
              <div
                className={`text-[10px] font-semibold tracking-wide uppercase ${
                  cardActive ? 'text-accent' : 'text-muted'
                }`}
              >
                {cardActive ? t('galet.active') : t('galet.inactive')}
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs leading-snug text-muted/80 italic">
            {t(card.loreKey as TranslationKey)}
          </p>
          <p className="mt-1.5 text-sm leading-snug text-fg/90">{t(card.descKey as TranslationKey)}</p>
          <p className="mt-1.5 text-[11px] text-muted/70">{t('galet.toggle')}</p>
        </div>
      ) : null}
    </div>
  )
}
