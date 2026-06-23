import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { InventoryModal } from '@/components/game/inventory/InventoryModal'
import { useGameStore } from '@/store/gameStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { backpackUnlocked } from '@/lib/inventory'
import { FlipIntroClone } from '@/components/ui/FlipIntroClone'
import { useFlipIntro } from '@/hooks/useFlipIntro'
import { useTranslation } from '@/i18n/useTranslation'

/**
 * Round backpack button (right of the pebble receptacle) opening the global
 * inventory. Shown once the backpack is unlocked. When its unlock modal closes,
 * the shared FLIP intro lands a giant copy into the button's spot, so the player
 * sees where the new overview lives (mirrors the memory feature button).
 */
export function InventoryButton() {
  const { t } = useTranslation()
  const unlocked = useGameStore((s) => backpackUnlocked(s.state))
  const clearHighlight = useInventoryStore((s) => s.clearHighlight)
  const highlight = useInventoryStore((s) => s.highlight)
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
        aria-label={t('inventory.button')}
        title={t('inventory.button')}
        className="inventory-button inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-accent transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Icon name="backpack" className="h-6 w-6" aria-hidden />
      </button>

      {intro ? (
        <FlipIntroClone intro={intro} landed={landed}>
          <span className="inventory-button flex h-full w-full items-center justify-center rounded-full text-accent shadow-2xl">
            <Icon name="backpack" className="h-6 w-6" aria-hidden />
          </span>
        </FlipIntroClone>
      ) : null}

      {open ? <InventoryModal onClose={() => setOpen(false)} /> : null}
    </>
  )
}
