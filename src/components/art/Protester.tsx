import type { ReactElement } from 'react'

/**
 * A little stick figure drawn in currentColor, centred on its feet (origin),
 * about 14 units tall: one fist raised when `angry`, both arms lowered (a fresh
 * citizen) otherwise. Decorative; colour comes from the parent's text colour.
 */
export function ProtesterGlyph({ angry }: { angry: boolean }): ReactElement {
  return (
    <g
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="0" cy="-10.5" r="2.1" />
      <line x1="0" y1="-8.4" x2="0" y2="-3.4" />
      <line x1="0" y1="-3.4" x2="-1.9" y2="0.4" />
      <line x1="0" y1="-3.4" x2="1.9" y2="0.4" />
      {angry ? (
        <>
          <line x1="0" y1="-6.6" x2="2.4" y2="-11.4" />
          <circle cx="2.7" cy="-11.8" r="1" />
          <line x1="0" y1="-6.6" x2="-2.1" y2="-4.4" />
        </>
      ) : (
        <>
          <line x1="0" y1="-6.6" x2="-2.4" y2="-4" />
          <line x1="0" y1="-6.6" x2="2.4" y2="-4" />
        </>
      )}
    </g>
  )
}
