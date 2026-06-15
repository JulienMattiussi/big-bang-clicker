import { Icon } from '@/components/ui/Icon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { isCrisisReady } from '@/lib/crises'
import { INVENTIONS } from '@/data/inventions'
import type { TranslationKey } from '@/i18n/types'

/** Timeline position of an invention-triggered crisis (era-14 crises appear in
 *  historical order); crises with no invention (extinction, revolt) sort first. */
const crisisOrder = (cid: string) => {
  const idx = INVENTIONS.findIndex((inv) => inv.crisis === cid)
  return idx === -1 ? -1 : idx
}

/**
 * Marks a resource hit by a crisis: a danger icon (skull) while a crisis striking
 * it is active, a rebirth icon (sunrise) once they are all overcome. A resource
 * can be hit by SEVERAL crises (the era of crises): a single icon shows, and the
 * tooltip lists each crisis it touched, one per line. Nothing shows while a crisis
 * is still only a building risk.
 */
export function ResourceCrisisBadge({ resourceId }: { resourceId: string }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)

  const hits = (cid: string) => {
    const c = defs.crises[cid]
    return (
      c.risk.sourceResource === resourceId ||
      c.regression.some((e) => e.target === resourceId) ||
      c.rebound.some((e) => e.target === resourceId)
    )
  }
  // Crises that actually happened to this resource (active or already resolved),
  // in timeline order (not definition order).
  const happened = Object.keys(defs.crises)
    .filter(hits)
    .filter((cid) => state.crises[cid]?.resolved || isCrisisReady(state, defs, cid))
    .sort((a, b) => crisisOrder(a) - crisisOrder(b))
  if (happened.length === 0) return null

  const isActive = (cid: string) => !state.crises[cid]?.resolved && isCrisisReady(state, defs, cid)
  const anyActive = happened.some(isActive)
  const resName = t(defs.resources[resourceId]?.nameKey as TranslationKey)

  const lineFor = (cid: string) => {
    const def = defs.crises[cid]
    if (!isActive(cid)) {
      const boost = def.rebound.find(
        (e) => e.target === resourceId && e.type === 'multiplier',
      )?.value
      return t('crisis.effect.recovered')
        .replace('{name}', t(`crisis.${cid}.name` as TranslationKey))
        .replace('{mult}', String(boost ?? 1))
    }
    const narrative = t(def.textKeys.triggerKey as TranslationKey)
    const stockCut = def.regression.find(
      (e) => e.target === resourceId && e.type === 'resetResource',
    )?.value
    const loss = stockCut != null ? Math.round((1 - stockCut) * 100) : null
    return loss != null
      ? `${narrative} ${t('crisis.effect.struck').replace('{pct}', String(loss)).replace('{res}', resName)}`
      : narrative
  }
  const tip = happened.map(lineFor).join('\n')

  return (
    <span
      title={tip}
      className={`inline-flex shrink-0 whitespace-pre-line ${anyActive ? 'text-red-400' : 'text-accent'}`}
    >
      <Icon name={anyActive ? 'skull' : 'sunrise'} className="h-5 w-5" aria-hidden />
      <span className="sr-only">{tip}</span>
    </span>
  )
}
