import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslation } from '@/i18n/useTranslation'
import { clickYield, converterOutputMultiplier } from '@/lib/engine'
import { widgetGaletMultiplier } from '@/lib/galets'
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

  // The space-time pebble (when active) DOUBLES every widget reward; it never
  // touches the automated factories (which read engine multipliers, not this one).
  const widgetMult = () => {
    const { state, defs } = useGameStore.getState()
    return widgetGaletMultiplier(state, defs, era.index)
  }

  const gainBase = (n = 1) => {
    if (n <= 0) return
    const { state, defs } = useGameStore.getState()
    const amount = n * clickYield(state, defs, era) * widgetMult()
    click(era.clickResource, amount)
    spawn(`res:${era.clickResource}`, `+${formatNumber(amount)}`, 'resource')
  }

  /** Produces the recipe output `times` (free), with one floating +total per output. */
  const complete = (times = 1) => {
    if (!recipeId || times <= 0) return
    const conv = useGameStore.getState().defs.converters[recipeId]
    if (!conv) return
    const runs = times * widgetMult()
    for (let k = 0; k < runs; k++) manualProduce(recipeId)
    for (const o of conv.outputs)
      spawn(`res:${o.resource}`, `+${formatNumber(o.amount * runs)}`, 'resource')
  }

  const combinedResource = recipeId
    ? useGameStore.getState().defs.converters[recipeId]?.outputs[0]?.resource
    : undefined

  /** Grants the era's combined resource for a FIXED base `n` (e.g. +1), scaled by
   *  this era's FACTORY progression - the recipe's converter LEVEL plus its output
   *  multipliers (memory/crisis/global/meta + converter galets) - and the widget
   *  galet. It drops the recipe's flat late-game easing, so the manual reward stays
   *  small but grows as the era's factory is leveled up. */
  const gainCombinedScaled = (n = 1) => {
    if (!recipeId || !combinedResource || n <= 0) return
    const { state, defs } = useGameStore.getState()
    const level = state.converters[recipeId]?.level ?? 0
    const mult =
      (level + 1) *
      converterOutputMultiplier(state, defs, recipeId, combinedResource) *
      widgetMult()
    const amount = n * mult
    click(combinedResource, amount)
    spawn(`res:${combinedResource}`, `+${formatNumber(amount)}`, 'resource')
  }

  return { verb, name, gainBase, gainCombinedScaled, complete, baseResource: era.clickResource }
}
