import { Icon } from '@/components/ui/Icon'
import { useTranslation } from '@/i18n/useTranslation'
import type { ResourceDef } from '@/lib/types'
import type { TranslationKey } from '@/i18n/types'

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

/** The card's face: chemical symbol if any, otherwise the resource icon. */
export function CardFace({ res }: { res: ResourceDef }) {
  const { t } = useTranslation()
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
