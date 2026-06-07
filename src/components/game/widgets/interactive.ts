import type { ReactElement } from 'react'
import { PeriodicTable } from './PeriodicTable'
import { BohrAtom } from './BohrAtom'
import { StarNursery } from './StarNursery'
import type { EraDef } from '@/lib/types'

/**
 * Widgets that own their mechanic (interactive), keyed by the era's `widget`
 * field. They replace the generic verb click with their own full-width scene.
 */
export const INTERACTIVE_WIDGETS: Record<string, (props: { era: EraDef }) => ReactElement> = {
  bohr: BohrAtom,
  galaxy: StarNursery,
  periodic: PeriodicTable,
}

/**
 * Interactive widgets that need the full content width (shown above the panels).
 * Compact ones (e.g. the Bohr atom) stay centered in the 3-column layout, like
 * the non-interactive eras.
 */
const FULLWIDTH_WIDGETS = new Set(['periodic'])

export function isFullWidthWidget(widget: string): boolean {
  return FULLWIDTH_WIDGETS.has(widget)
}
