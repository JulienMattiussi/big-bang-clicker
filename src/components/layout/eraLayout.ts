import type { EraLayoutName } from '@/lib/types'

/**
 * Catalogue of era page/panel dispositions. Each era declares one EraLayoutName
 * (data/eras/*); these helpers turn it into the matching Tailwind classes, so the
 * layout rules live in one place instead of scattered heuristics.
 */

/** Solo layout shows ONLY the widget (no resources/machines panels). */
export function isSoloLayout(layout: EraLayoutName): boolean {
  return layout === 'solo'
}

/** Wide layouts show the widget full-width on top, then a resources|machines row. */
export function isWideLayout(layout: EraLayoutName): boolean {
  return layout !== 'compact' && layout !== 'solo'
}

/** Grid class for the resources|machines row of a wide layout. */
export function wideRowClass(layout: EraLayoutName): string {
  return layout === 'wide-roomy' ? 'md:grid-cols-[1fr_2fr]' : 'md:grid-cols-[1fr_3fr]'
}

/** Whether the machines panel uses the asymmetric 2-card split (one wider card,
 *  e.g. a long-recipe converter). */
export function isSplitMachines(layout: EraLayoutName): boolean {
  return layout === 'wide-split'
}
