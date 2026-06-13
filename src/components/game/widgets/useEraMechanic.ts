import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslation } from '@/i18n/useTranslation'
import { clickYield } from '@/lib/engine'
import { formatNumber } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef, ResourceId } from '@/lib/types'

/**
 * Shared building blocks for the interactive era widgets (eras 4+). Every widget
 * exposes its own GESTURE; this hook turns that gesture into the two game
 * actions all of them share, so we don't re-wire the store in each file:
 *
 * - `gainBase(n)`  : +n of the era's base resource (the raw "verb" click), with
 *                    a floating +n on its counter.
 * - `complete()`   : produces the era recipe's output once, FREE (no input
 *                    consumed), like the star nursery's ignition - the manual
 *                    reward never strands the player; the inputs stay the fuel
 *                    of the AUTOMATED recipe bought in the panel.
 *
 * Also returns translated names (for hints/labels) and the verb string.
 */
export function useEraMechanic(era: EraDef) {
  const { t } = useTranslation()
  const click = useGameStore((s) => s.click)
  const manualProduce = useGameStore((s) => s.manualProduce)
  const spawn = useFeedbackStore((s) => s.spawn)

  const recipeId = era.converters[0] as string | undefined
  const verb = t(era.verbKey as TranslationKey)
  const name = (resource: ResourceId) => {
    const def = useGameStore.getState().defs.resources[resource]
    return def ? t(def.nameKey as TranslationKey) : resource
  }

  const gainBase = (n = 1) => {
    if (n <= 0) return
    const { state, defs } = useGameStore.getState()
    const amount = n * clickYield(state, defs, era)
    click(era.clickResource, amount)
    spawn(`res:${era.clickResource}`, `+${formatNumber(amount)}`, 'resource')
  }

  /** Produces the recipe output `times` (free), with one floating +total per output. */
  const complete = (times = 1) => {
    if (!recipeId || times <= 0) return
    const conv = useGameStore.getState().defs.converters[recipeId]
    if (!conv) return
    for (let k = 0; k < times; k++) manualProduce(recipeId)
    for (const o of conv.outputs)
      spawn(`res:${o.resource}`, `+${formatNumber(o.amount * times)}`, 'resource')
  }

  return { verb, name, gainBase, complete, baseResource: era.clickResource }
}
