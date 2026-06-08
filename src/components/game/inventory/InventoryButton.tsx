import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { InventoryModal } from '@/components/game/inventory/InventoryModal'
import { useGameStore } from '@/store/gameStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { backpackUnlocked } from '@/lib/inventory'
import { useTranslation } from '@/i18n/useTranslation'

interface Intro {
  transform: string
  top: number
  left: number
  width: number
  height: number
}

/**
 * Round backpack button (right of the pebble receptacle) opening the global
 * inventory. Shown once the backpack is unlocked. When its unlock modal closes,
 * a giant copy appears at screen centre and shrinks into the button's spot
 * (FLIP), so the player sees where the new overview lives (mirrors the memory
 * feature button).
 */
export function InventoryButton() {
  const { t } = useTranslation()
  const unlocked = useGameStore((s) => backpackUnlocked(s.state))
  const highlight = useInventoryStore((s) => s.highlight)
  const clearHighlight = useInventoryStore((s) => s.clearHighlight)
  const [open, setOpen] = useState(false)

  const btnRef = useRef<HTMLButtonElement>(null)
  const [intro, setIntro] = useState<Intro | null>(null)
  const [landed, setLanded] = useState(false)

  // On highlight (unlock modal just closed): measure the real button and spawn a
  // giant clone transformed to screen centre; the next effect lets it shrink home.
  useEffect(() => {
    if (!highlight) return
    const el = btnRef.current
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const r = el?.getBoundingClientRect()
    if (!r || r.width === 0 || reduce) {
      clearHighlight()
      return
    }
    const big = Math.min(window.innerWidth * 0.5, 360)
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
        aria-label={t('inventory.button')}
        title={t('inventory.button')}
        className="inventory-button inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-accent transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Icon name="backpack" className="h-6 w-6" aria-hidden />
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
          <span className="inventory-button flex h-full w-full items-center justify-center rounded-full text-accent shadow-2xl">
            <Icon name="backpack" className="h-6 w-6" aria-hidden />
          </span>
        </div>
      ) : null}

      {open ? <InventoryModal onClose={() => setOpen(false)} /> : null}
    </>
  )
}
