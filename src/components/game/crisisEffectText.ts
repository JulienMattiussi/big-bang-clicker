import { formatNumber } from '@/lib/format'
import type { Effect, GameDefs, ResourceDef } from '@/lib/types'
import type { Translate, TranslationKey } from '@/i18n/types'

/** A crisis effect ready to render as an aligned row: the affected thing's name,
 *  the magnitude (loss/gain), and the resource (for its icon + era icon). */
export interface CrisisEffectLine {
  label: string
  detail: string
  resource?: ResourceDef
}

/**
 * One concrete, localized line for a crisis effect (a regression or a rebound),
 * shown EXPLICITLY in the crisis modals. Derived from the crisis data so tuning a
 * value in data/crises.ts updates the modal automatically. Returns null for effect
 * types a crisis does not surface.
 */
export function describeCrisisEffect(
  effect: Effect,
  t: Translate,
  defs: GameDefs,
  resources?: Record<string, number>,
): CrisisEffectLine | null {
  const resource = effect.target ? defs.resources[effect.target] : undefined
  const name = (id: string | undefined, generator = false) => {
    if (!id) return ''
    const def = generator ? defs.generators[id] : defs.resources[id]
    return def ? t(def.nameKey as TranslationKey) : id
  }
  const pctLoss = Math.round((1 - (effect.value ?? 0)) * 100)
  let label: string | null = null
  let detail = ''
  switch (effect.type) {
    case 'resetResource':
      label = name(effect.target)
      // The era is frozen during its crisis, so the current amount equals the
      // amount that will be wiped: show the precise loss alongside the percentage.
      detail = resources
        ? t('crisis.effect.loss')
            .replace(
              '{amount}',
              formatNumber((resources[effect.target ?? ''] ?? 0) * (1 - (effect.value ?? 0))),
            )
            .replace('{pct}', String(pctLoss))
        : t('crisis.effect.lossPct').replace('{pct}', String(pctLoss))
      break
    case 'resetGenerator':
      label = name(effect.target, true)
      detail = t('crisis.effect.lossPct').replace('{pct}', String(pctLoss))
      break
    case 'multiplier':
      label = name(effect.target)
      detail = t('crisis.effect.gain').replace('{mult}', String(effect.value ?? 1))
      break
    case 'grantResource': {
      // Flat add/remove (e.g. the Y2K bug: a single unit lost). formatNumber
      // already signs negatives; prepend '+' only for a gain.
      const v = effect.value ?? 0
      label = name(effect.target)
      detail = (v >= 0 ? '+' : '') + formatNumber(v)
      break
    }
  }
  return label === null ? null : { label, detail, resource }
}
