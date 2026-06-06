import type { ReactElement } from 'react'
import { PeriodicTable } from './PeriodicTable'
import type { EraDef } from '@/lib/types'

/**
 * Widgets that own their mechanic (interactive), keyed by the era's `widget`
 * field. They replace the generic verb click with their own full-width scene.
 */
export const INTERACTIVE_WIDGETS: Record<string, (props: { era: EraDef }) => ReactElement> = {
  periodic: PeriodicTable,
}

/** Whether an era's widget owns its mechanic (full-width scene) vs the verb. */
export function hasInteractiveWidget(widget: string): boolean {
  return widget in INTERACTIVE_WIDGETS
}
