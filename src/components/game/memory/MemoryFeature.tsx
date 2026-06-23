import { useState } from 'react'
import { Answer42 } from '@/components/game/memory/Answer42'
import { MemoryGame } from '@/components/game/memory/MemoryGame'
import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useMemoryStore } from '@/store/memoryStore'
import { MEMORY_LEVELS, memoryEraMaxed, memoryLevel, memoryUnlocked } from '@/lib/memory'
import { FlipIntroClone } from '@/components/ui/FlipIntroClone'
import { useFlipIntro } from '@/hooks/useFlipIntro'
import { useTranslation } from '@/i18n/useTranslation'

/**
 * Entry point of the memory mini-game: a distinct call-to-action button (a card
 * on each side of "4 [era symbol] 2"), shown once the mechanic is unlocked
 * (era 7, oxidation leveled). When the unlock modal closes, the shared FLIP intro
 * lands a giant copy into its real spot so the player sees exactly where the new
 * power lives. Opens the game modal.
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
  const { btnRef, intro, landed } = useFlipIntro(highlight, clearHighlight, {
    maxSize: 680,
    vwFactor: 0.8,
  })

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
          clearHighlight()
          setOpen(true)
        }}
        aria-label={t('memory.button')}
        title={t('memory.button')}
        className="inline-flex h-9 w-24 items-center justify-center overflow-hidden rounded-md bg-octarine px-2 shadow-md transition hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {face}
      </button>

      {intro ? (
        <FlipIntroClone intro={intro} landed={landed}>
          <span className="flex h-full w-full items-center justify-center gap-1 overflow-hidden rounded-md bg-octarine shadow-2xl">
            {face}
          </span>
        </FlipIntroClone>
      ) : null}

      {open ? <MemoryGame onClose={() => setOpen(false)} /> : null}
    </>
  )
}
