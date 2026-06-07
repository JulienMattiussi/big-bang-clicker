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
        <rect x="2" y="2" width="32" height="46" rx="5" style={{ fill: 'var(--color-bg)', fillOpacity: 0.18 }} />
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
 * The Answer "42" emblem: two playing cards - a "4" on the left, a "2" on the
 * right (Neogen display font) - framing the current era's symbol. Cards, digits
 * and symbol all share the same colour (the cards' colour) for a clean mark.
 */
export function Answer42({ eraIcon, className = '' }: { eraIcon: string; className?: string }) {
  return (
    <span className={`relative inline-flex items-center gap-1.5 text-bg ${className}`} aria-hidden>
      <PlayCard digit="4" />
      <Icon name={eraIcon} className="relative z-10 h-[78%] w-auto drop-shadow" />
      <PlayCard digit="2" />
    </span>
  )
}
