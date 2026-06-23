import { useEffect, useRef, useState } from 'react'
import type { IntroRect } from '@/components/ui/introRect'

/**
 * Shared "land the new button" intro for the feature buttons (memory, inventory,
 * renaissances log). When `highlight` flips on, it measures the real button and
 * returns an IntroRect describing a giant clone at screen centre; the consumer
 * renders that clone and it shrinks (FLIP) into the button's spot. Disabled under
 * prefers-reduced-motion. The clone's content is left to each caller (it differs).
 */
export function useFlipIntro(
  highlight: boolean,
  clearHighlight: () => void,
  opts: { maxSize?: number; vwFactor?: number } = {},
): { btnRef: React.RefObject<HTMLButtonElement | null>; intro: IntroRect | null; landed: boolean } {
  const { maxSize = 360, vwFactor = 0.5 } = opts
  const btnRef = useRef<HTMLButtonElement>(null)
  const [intro, setIntro] = useState<IntroRect | null>(null)
  const [landed, setLanded] = useState(false)

  useEffect(() => {
    if (!highlight) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const r = btnRef.current?.getBoundingClientRect()
    if (!r || r.width === 0 || reduce) {
      clearHighlight()
      return
    }
    const big = Math.min(window.innerWidth * vwFactor, maxSize)
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
  }, [highlight, clearHighlight, maxSize, vwFactor])

  // Once the clone is on screen, flip it to its natural place (animated).
  useEffect(() => {
    if (!intro) return
    const raf = requestAnimationFrame(() => setLanded(true))
    return () => cancelAnimationFrame(raf)
  }, [intro])

  return { btnRef, intro, landed }
}
