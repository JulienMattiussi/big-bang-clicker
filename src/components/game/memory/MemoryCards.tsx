import { Icon } from '@/components/ui/Icon'
import { useTranslation } from '@/i18n/useTranslation'
import { JOKER_LABEL, type Card } from './memoryDeck'
import type { TranslationKey } from '@/i18n/types'

/** A stylised glowing-blade emblem (original); colour and crossguard tell the two
 *  Force factions apart. */
function JokerGlyph({ kind }: { kind: 'sith' | 'jedi' }) {
  const color = kind === 'sith' ? 'var(--color-octarine)' : 'var(--color-secondary)'
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden>
      <line x1="12" y1="3" x2="12" y2="15" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.25" />
      <line x1="12" y1="3" x2="12" y2="15" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {kind === 'sith' ? (
        <path d="M8.5 14.6 L10 15.3 M15.5 14.6 L14 15.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      ) : null}
      <rect x="10.7" y="15" width="2.6" height="6" rx="1" fill={color} />
    </svg>
  )
}

/** A roughly realistic playing-card back: diamond lattice, frame, centre pip. */
export function CardBack() {
  const lines = []
  for (let i = -9; i <= 9; i++) {
    const o = i * 8
    lines.push(<line key={`u${i}`} x1={o} y1={0} x2={o + 70} y2={70} />)
    lines.push(<line key={`d${i}`} x1={o} y1={70} x2={o + 70} y2={0} />)
  }
  return (
    <svg viewBox="0 0 50 70" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <rect width="50" height="70" fill="var(--color-octarine)" fillOpacity="0.14" />
      <g stroke="var(--color-octarine)" strokeWidth="0.7" opacity="0.5">
        {lines}
      </g>
      <rect
        x="4"
        y="4"
        width="42"
        height="62"
        rx="4"
        fill="none"
        stroke="var(--color-octarine)"
        strokeWidth="1.2"
        opacity="0.85"
      />
      <path d="M25 26 L33 35 L25 44 L17 35 Z" fill="var(--color-octarine)" opacity="0.9" />
      <path d="M25 31 L29.5 35 L25 39 L20.5 35 Z" fill="var(--color-bg)" />
    </svg>
  )
}

/** The card's face: a joker's emblem, else the chemical symbol or resource icon. */
export function CardFace({ card }: { card: Card }) {
  const { t } = useTranslation()
  if (card.joker) {
    return (
      <span className="flex flex-col items-center gap-0.5 text-octarine">
        <JokerGlyph kind={card.joker} />
        <span className="max-w-full truncate px-0.5 text-[10px] text-muted">
          {t(JOKER_LABEL[card.joker])}
        </span>
      </span>
    )
  }
  const res = card.res
  return (
    <span className="flex flex-col items-center gap-0.5 text-secondary">
      {res.symbol ? (
        <span className="text-xl font-bold">{res.symbol}</span>
      ) : (
        <Icon name={res.icon} className="h-9 w-9" />
      )}
      <span className="max-w-full truncate px-0.5 text-[10px] text-muted">
        {t(res.nameKey as TranslationKey)}
      </span>
    </span>
  )
}
