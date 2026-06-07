import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'

type AlertKind = 'decline' | 'stall'

// Two corner placements: 'sm' hugs a resource icon, 'md' hugs a whole era tab.
const POSITION = {
  sm: '-top-1.5 -right-1.5 h-4 w-4 text-[10px]',
  md: '-top-2 -right-2 h-5 w-5 text-xs',
} as const

// Red = declining (consumed faster than produced), yellow = stalled at zero.
const COLOR: Record<AlertKind, string> = {
  decline: 'bg-red-500 text-white',
  stall: 'bg-yellow-400 text-black',
}

/**
 * Small "!" notification dot overlapping an icon or tab corner. The "!" glyph
 * plus an sr-only label carry the meaning, so the alert never relies on colour
 * alone (a11y). Placed inside a `relative` parent.
 */
export function AlertBadge({
  kind,
  labelKey,
  size = 'sm',
}: {
  kind: AlertKind
  labelKey: TranslationKey
  size?: keyof typeof POSITION
}) {
  const { t } = useTranslation()
  const label = t(labelKey)
  return (
    <span
      title={label}
      className={`pointer-events-none absolute flex items-center justify-center rounded-full leading-none font-bold shadow ${POSITION[size]} ${COLOR[kind]}`}
    >
      <span aria-hidden>!</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
