import { useEffect, useRef, useState } from 'react'
import { Answer42 } from '@/components/game/memory/Answer42'
import { MemoryGame } from '@/components/game/memory/MemoryGame'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useMemoryStore } from '@/store/memoryStore'
import { MEMORY_LEVELS, memoryEraMaxed, memoryLevel, memoryUnlocked } from '@/lib/memory'
import { useTranslation } from '@/i18n/useTranslation'
import type { IntroRect } from '@/components/ui/introRect'

/**
 * Entry point of the memory mini-game: a distinct call-to-action button (a card
 * on each side of "4 [era symbol] 2"), shown once the mechanic is unlocked
 * (era 7, oxidation leveled). When the unlock modal closes, a giant copy of the
 * button appears at screen centre and shrinks into its real spot (FLIP) so the
 * player sees exactly where the new power lives. Opens the game modal.
 */
export function MemoryFeature() {
  const { t } = useTranslation()
  const unlocked = useGameStore((s) => memoryUnlocked(s.state))
  // Current era's icon, clustered between the digits (the Answer, themed).
  const eraIcon = useGameStore(
    (s) =>
      (s.defs.eras.find((e) => e.id === s.state.currentEraId) ?? s.defs.eras[0])?.icon ?? 'flame',
  )
  // The next attempt's level shapes the emblem: deck size (21/42) and set size.
  const cfg = useGameStore((s) => MEMORY_LEVELS[memoryLevel(s.state, s.state.currentEraId)]!)
  const digits: [string, string] = cfg.cards === 21 ? ['2', '1'] : ['4', '2']
  const maxed = useGameStore((s) => memoryEraMaxed(s.state, s.state.currentEraId))
  const highlight = useMemoryStore((s) => s.highlight)
  const clearHighlight = useMemoryStore((s) => s.clearHighlight)
  const [open, setOpen] = useState(false)

  const btnRef = useRef<HTMLButtonElement>(null)
  const [intro, setIntro] = useState<IntroRect | null>(null)
  const [landed, setLanded] = useState(false)

  // On highlight (modal just closed): measure the real button and spawn a giant
  // clone transformed to screen centre; the next effect lets it shrink home.
  useEffect(() => {
    if (!highlight) return
    const el = btnRef.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const r = el?.getBoundingClientRect()
    if (!r || r.width === 0 || reduce) {
      clearHighlight()
      return
    }
    const big = Math.min(window.innerWidth * 0.8, 680)
    const scale = big / r.width
    const tx = window.innerWidth / 2 - (r.left + r.width / 2)
    const ty = window.innerHeight / 2 - (r.top + r.height / 2)
    setLanded(false)
    setIntro({
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    })
    const done = window.setTimeout(() => {
      setIntro(null)
      clearHighlight()
    }, 1050)
    return () => window.clearTimeout(done)
  }, [highlight, clearHighlight])

  // Once the giant clone is on screen, flip it to its natural place (animated).
  useEffect(() => {
    if (!intro) return
    const raf = requestAnimationFrame(() => setLanded(true))
    return () => cancelAnimationFrame(raf)
  }, [intro])

  if (!unlocked) return null

  const face = maxed ? (
    <Icon name="trophy" className="h-6 w-6 shrink-0 text-bg" aria-hidden />
  ) : (
    <Answer42 eraIcon={eraIcon} digits={digits} count={cfg.group} className="h-7 shrink-0" />
  )

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setIntro(null)
          clearHighlight()
          setOpen(true)
        }}
        aria-label={t('memory.button')}
        title={t('memory.button')}
        className="inline-flex h-9 w-24 items-center justify-center overflow-hidden rounded-md bg-octarine px-2 shadow-md transition hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {face}
      </button>

      {/* Giant clone shrinking from screen centre into the button's place. */}
      {intro ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50"
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
          <span className="flex h-full w-full items-center justify-center gap-1 overflow-hidden rounded-md bg-octarine shadow-2xl">
            {face}
          </span>
        </div>
      ) : null}

      {open ? <MemoryGame onClose={() => setOpen(false)} /> : null}
    </>
  )
}
