import type { ReactNode } from 'react'
import type { IntroRect } from '@/components/ui/introRect'

/**
 * Positioned clone rendered by buttons using useFlipIntro: a fixed copy that
 * starts giant at screen centre (intro.transform) and animates down into the
 * real button's box once `landed` is true. Children supply the icon/content.
 */
export function FlipIntroClone({
  intro,
  landed,
  children,
}: {
  intro: IntroRect
  landed: boolean
  children: ReactNode
}) {
  return (
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
      {children}
    </div>
  )
}
