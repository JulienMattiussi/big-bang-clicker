import { useEffect, useRef, useState } from 'react'
import { Galet } from '@/components/art/Galet'
import { GALET_SLOTS } from '@/data/galets'
import { useGameStore } from '@/store/gameStore'
import { useGaletStore } from '@/store/galetStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { IntroRect } from '@/components/ui/introRect'

interface GaletIntro extends IntroRect {
  id: string
}

/** Pebble size inside a socket (px); the FLIP clone matches it. */
const SOCKET_GALET = 30

/**
 * Receptacle for the infinity pebbles, top-left. Found pebbles fill the slots
 * (click to toggle their effect); remaining slots show empty "?" placeholders.
 * Hovering or focusing a pebble opens a styled card (the pebble enlarged, its
 * name, status and effect). Hidden until the first pebble is found.
 *
 * When a pebble is just discovered (its modal closed), a giant copy appears at
 * screen centre and shrinks into its socket (FLIP), like the memory/backpack
 * feature buttons, so the player sees where the relic landed.
 */
export function GaletReceptacle() {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const toggleGalet = useGameStore((s) => s.toggleGalet)
  const flashed = useGaletStore((s) => s.flashed)
  const clearFlash = useGaletStore((s) => s.clear)
  const [hovered, setHovered] = useState<string | null>(null)

  const socketRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [intro, setIntro] = useState<GaletIntro | null>(null)
  const [landed, setLanded] = useState(false)

  // On flash (discovery modal just closed): measure the pebble's socket and
  // spawn a giant clone transformed to screen centre; the next effect lets it
  // shrink home.
  useEffect(() => {
    if (!flashed) return
    const el = socketRefs.current[flashed]
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const r = el?.getBoundingClientRect()
    if (!r || r.width === 0 || reduce) {
      clearFlash()
      return
    }
    const big = Math.min(window.innerWidth * 0.5, 380)
    const scale = big / r.width
    const tx = window.innerWidth / 2 - (r.left + r.width / 2)
    const ty = window.innerHeight / 2 - (r.top + r.height / 2)
    setLanded(false)
    setIntro({
      id: flashed,
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    })
    const done = window.setTimeout(() => {
      setIntro(null)
      clearFlash()
    }, 1050)
    return () => window.clearTimeout(done)
  }, [flashed, clearFlash])

  // Once the giant clone is on screen, flip it to its natural place (animated).
  useEffect(() => {
    if (!intro) return
    const raf = requestAnimationFrame(() => setLanded(true))
    return () => cancelAnimationFrame(raf)
  }, [intro])

  const found = defs.galets.filter((g) => state.galets[g.id]?.found)
  if (found.length === 0) return null

  const card = found.find((g) => g.id === hovered)
  const cardActive = card ? (state.galets[card.id]?.active ?? false) : false
  const introGalet = intro ? found.find((g) => g.id === intro.id) : undefined

  return (
    <div className="relative">
      <div
        role="group"
        aria-label={t('galet.receptacle')}
        className="galet-tray inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-1.5"
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
              ref={(el) => {
                socketRefs.current[galet.id] = el
              }}
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
              {/* Hide the resting pebble while its clone flies in, to avoid a double. */}
              <span className={intro?.id === galet.id && !landed ? 'opacity-0' : ''}>
                <Galet
                  color={galet.color}
                  motif={galet.motif}
                  shape={galet.shape}
                  size={SOCKET_GALET}
                  dim={!active}
                />
              </span>
              <span className="sr-only">{label}</span>
            </button>
          )
        })}
      </div>

      {intro && introGalet ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 flex items-center justify-center"
          style={{
            top: intro.top,
            left: intro.left,
            width: intro.width,
            height: intro.height,
            transformOrigin: 'center center',
            transform: landed ? 'none' : intro.transform,
            transition: 'transform 0.95s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <Galet
            color={introGalet.color}
            motif={introGalet.motif}
            shape={introGalet.shape}
            size={SOCKET_GALET}
          />
        </div>
      ) : null}

      {card ? (
        <div
          role="tooltip"
          className="shadow-float modal-in absolute top-full left-0 z-30 mt-2 w-80 rounded-lg border border-octarine/40 bg-surface p-3 text-left"
        >
          <p className="text-center text-xs font-semibold tracking-wide text-octarine uppercase">
            {t('galet.kind')}
          </p>
          <div className="relative mt-2 flex h-28 items-center justify-center">
            <div
              aria-hidden
              className="absolute inset-0 rounded-lg blur-xl"
              style={{
                background: `radial-gradient(circle, ${card.color}, transparent 68%)`,
                opacity: cardActive ? 0.45 : 0.18,
              }}
            />
            <div className="relative">
              <Galet
                color={card.color}
                motif={card.motif}
                shape={card.shape}
                size={104}
                dim={!cardActive}
              />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-base font-semibold text-fg">
              {t(card.nameKey as TranslationKey)}
            </span>
            <span
              className={`shrink-0 text-xs font-semibold tracking-wide uppercase ${
                cardActive ? 'text-accent' : 'text-muted'
              }`}
            >
              {cardActive ? t('galet.active') : t('galet.inactive')}
            </span>
          </div>
          <p className="mt-2 text-sm leading-snug text-muted/80 italic">
            {t(card.loreKey as TranslationKey)}
          </p>
          <p className="mt-2 text-base leading-snug text-fg/90">
            {t(card.descKey as TranslationKey)}
          </p>
          <p className="mt-2 text-xs text-muted/70">{t('galet.toggle')}</p>
        </div>
      ) : null}
    </div>
  )
}
