import type { ReactElement } from 'react'
import { Icon } from '@/components/ui/Icon'

/** A playing card bearing a digit (its value), in octarine like the card itself. */
function PlayCard({ digit }: { digit: string }): ReactElement {
  return (
    <span className="relative inline-flex h-full items-center justify-center text-bg">
      <svg
        viewBox="0 0 36 50"
        className="h-full w-auto drop-shadow"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinejoin="round"
        aria-hidden
      >
        <rect
          x="2"
          y="2"
          width="32"
          height="46"
          rx="5"
          style={{ fill: 'var(--color-bg)', fillOpacity: 0.18 }}
        />
      </svg>
      <span
        className="absolute text-base leading-none font-bold"
        style={{ fontFamily: '"Neogen", sans-serif' }}
      >
        {digit}
      </span>
    </span>
  )
}

/**
 * A cluster of the current era's symbol, `count` times: a triplet is laid out as
 * a triangle (one on top overlapping two below), anything else as an overlapping
 * row. The triplet uses absolute placement in a square box so it always spans the
 * box's full height (top symbol touches the top, the pair touches the bottom) and
 * scales cleanly from the small button to the large modal hero. Size via the
 * `className` height (the box is square).
 */
export function EraSymbolCluster({
  eraIcon,
  count,
  className = '',
}: {
  eraIcon: string
  count: number
  className?: string
}) {
  if (count === 3) {
    return (
      <span className={`relative inline-block aspect-square ${className}`} aria-hidden>
        <Icon
          name={eraIcon}
          className="absolute top-0 left-1/2 z-10 h-[62%] w-auto -translate-x-1/2 drop-shadow"
        />
        <Icon name={eraIcon} className="absolute bottom-0 left-0 h-[62%] w-auto drop-shadow" />
        <Icon name={eraIcon} className="absolute right-0 bottom-0 h-[62%] w-auto drop-shadow" />
      </span>
    )
  }
  if (count === 2) {
    // Overlapping pair, placed absolutely in a wide-ish box so the symbols
    // clearly overlap (proportionally, at any size).
    return (
      <span className={`relative inline-block aspect-11/10 ${className}`} aria-hidden>
        <Icon
          name={eraIcon}
          className="absolute top-1/2 left-0 h-[72%] w-auto -translate-y-1/2 drop-shadow"
        />
        <Icon
          name={eraIcon}
          className="absolute top-1/2 right-0 z-10 h-[72%] w-auto -translate-y-1/2 drop-shadow"
        />
      </span>
    )
  }
  return (
    <span className={`relative inline-flex items-center ${className}`} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Icon
          key={i}
          name={eraIcon}
          className="-mx-1 h-full w-auto drop-shadow first:ml-0 last:mr-0"
        />
      ))}
    </span>
  )
}

/**
 * Memory emblem: two playing cards framing a cluster of the current era's
 * symbol. The two digits spell the deck size ("42" or "21"), and the number of
 * stacked symbols (2 or 3) tells whether the level wants pairs or triplets.
 */
export function Answer42({
  eraIcon,
  digits,
  count,
  className = '',
}: {
  eraIcon: string
  digits: [string, string]
  count: number
  className?: string
}) {
  return (
    <span className={`relative inline-flex items-center gap-1.5 text-bg ${className}`} aria-hidden>
      <PlayCard digit={digits[0]} />
      <EraSymbolCluster eraIcon={eraIcon} count={count} className="z-10 h-full" />
      <PlayCard digit={digits[1]} />
    </span>
  )
}
