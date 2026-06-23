import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { RebirthModal } from '@/components/game/RebirthModal'
import { useGameStore } from '@/store/gameStore'
import { useRebirthStore } from '@/store/rebirthStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { IntroRect } from '@/components/ui/introRect'

/**
 * Renaissances log button, shown once the first rebirth is done. Opens the recap
 * of renaissances + Echoes consumed. On the first rebirth a giant copy shrinks
 * from screen centre into its spot (FLIP), so the player sees the new button land
 * (same mechanic as the memory / inventory feature buttons).
 */
export function RebirthButton() {
  const { t } = useTranslation()
  const unlocked = useGameStore((s) => s.state.rebirths >= 1)
  const highlight = useRebirthStore((s) => s.highlight)
  const clearHighlight = useRebirthStore((s) => s.clearHighlight)
  const [open, setOpen] = useState(false)

  const btnRef = useRef<HTMLButtonElement>(null)
  const [intro, setIntro] = useState<IntroRect | null>(null)
  const [landed, setLanded] = useState(false)

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
        aria-label={t('rebirth.button')}
        title={t('rebirth.button')}
        className="inventory-button inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-octarine transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Icon name="echo" className="h-6 w-6" aria-hidden />
      </button>

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
          <span className="inventory-button flex h-full w-full items-center justify-center rounded-full text-octarine shadow-2xl">
            <Icon name="echo" className="h-6 w-6" aria-hidden />
          </span>
        </div>
      ) : null}

      {open ? <RebirthModal onClose={() => setOpen(false)} /> : null}
    </>
  )
}
