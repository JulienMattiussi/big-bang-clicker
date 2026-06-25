import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslation } from '@/i18n/useTranslation'
import {
  applyComplete,
  applyGainBase,
  applyGainCombinedScaled,
  type GestureResult,
} from '@/lib/engine'
import { formatNumber } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef, ResourceId } from '@/lib/types'

/**
 * Shared building blocks for the interactive era widgets (eras 4+). Every widget
 * exposes its own GESTURE; this hook turns that gesture into a game action.
 *
 * - `gainBase(n)`         : the raw "verb" click (+n base resource).
 * - `complete(times)`     : a free completion of the era recipe.
 * - `gainCombinedScaled(n)`: +n combined resource, scaled by the factory.
 *
 * The actual reward maths live in PURE engine functions (`applyGainBase` etc.),
 * shared with the headless sim so the two can't diverge. This hook only commits
 * the new state and spawns the floating "+N" feedback.
 */
export function useEraMechanic(era: EraDef) {
  const { t } = useTranslation()
  const spawn = useFeedbackStore((s) => s.spawn)

  const verb = t(era.verbKey as TranslationKey)
  const name = (resource: ResourceId) => {
    const def = useGameStore.getState().defs.resources[resource]
    return def ? t(def.nameKey as TranslationKey) : resource
  }

  /** Applies a pure gesture: commit the new state, then float each "+N". */
  const run = ({ state, floaters }: GestureResult) => {
    if (floaters.length === 0) return
    useGameStore.setState({ state })
    for (const f of floaters) spawn(`res:${f.resource}`, `+${formatNumber(f.amount)}`, 'resource')
  }

  const gainBase = (n = 1) => {
    const { state, defs } = useGameStore.getState()
    run(applyGainBase(state, defs, era, n))
  }
  const complete = (times = 1) => {
    const { state, defs } = useGameStore.getState()
    run(applyComplete(state, defs, era, times))
  }
  const gainCombinedScaled = (n = 1) => {
    const { state, defs } = useGameStore.getState()
    run(applyGainCombinedScaled(state, defs, era, n))
  }

  return { verb, name, gainBase, gainCombinedScaled, complete, baseResource: era.clickResource }
}
