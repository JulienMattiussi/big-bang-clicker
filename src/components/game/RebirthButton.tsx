import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { RebirthModal } from '@/components/game/RebirthModal'
import { useGameStore } from '@/store/gameStore'
import { useRebirthStore } from '@/store/rebirthStore'
import { FlipIntroClone } from '@/components/ui/FlipIntroClone'
import { useFlipIntro } from '@/hooks/useFlipIntro'
import { useTranslation } from '@/i18n/useTranslation'

/**
 * Renaissances log button, shown once the first rebirth is done. Opens the recap
 * of renaissances + Echoes consumed. On the first rebirth it lands in place via
 * the shared FLIP intro (same as the memory / inventory feature buttons).
 */
export function RebirthButton() {
  const { t } = useTranslation()
  const unlocked = useGameStore((s) => s.state.rebirths >= 1)
  const highlight = useRebirthStore((s) => s.highlight)
  const clearHighlight = useRebirthStore((s) => s.clearHighlight)
  const [open, setOpen] = useState(false)
  const { btnRef, intro, landed } = useFlipIntro(highlight, clearHighlight)

  if (!unlocked) return null

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          clearHighlight()
          setOpen(true)
        }}
        aria-label={t('rebirth.button')}
        title={t('rebirth.button')}
        className="inventory-button inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-octarine transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Icon name="echo" className="h-6 w-6" aria-hidden />
      </button>

      {intro ? (
        <FlipIntroClone intro={intro} landed={landed}>
          <span className="inventory-button flex h-full w-full items-center justify-center rounded-full text-octarine shadow-2xl">
            <Icon name="echo" className="h-6 w-6" aria-hidden />
          </span>
        </FlipIntroClone>
      ) : null}

      {open ? <RebirthModal onClose={() => setOpen(false)} /> : null}
    </>
  )
}
