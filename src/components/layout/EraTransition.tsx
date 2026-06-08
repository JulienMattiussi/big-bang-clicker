import { useState, type ReactNode } from 'react'

/**
 * Slides the era content in on each switch: from the right when moving to a
 * later era, from the left when going back to an earlier one. The inner div is
 * keyed by era id so it remounts and replays the CSS animation; the direction
 * comes from comparing the new era index with the previous one. The previous
 * era is tracked in state (adjusted during render) rather than a ref, so it
 * never reads a ref during render.
 */
export function EraTransition({
  eraId,
  index,
  className = '',
  children,
}: {
  eraId: string
  index: number
  className?: string
  children: ReactNode
}) {
  const [info, setInfo] = useState<{ eraId: string; index: number; dir: 'right' | 'left' }>({
    eraId,
    index,
    dir: 'right',
  })
  if (eraId !== info.eraId) {
    setInfo({ eraId, index, dir: index >= info.index ? 'right' : 'left' })
  }

  return (
    <div
      key={info.eraId}
      className={`${info.dir === 'right' ? 'era-slide-right' : 'era-slide-left'} ${className}`}
    >
      {children}
    </div>
  )
}
