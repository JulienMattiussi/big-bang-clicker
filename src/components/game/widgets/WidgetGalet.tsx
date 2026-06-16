import type { ReactElement } from 'react'
import { Galet } from '@/components/art/Galet'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'

/**
 * Small badge of the found 'widgetMultiplier' pebble (the space-time pebble),
 * shown beside each era widget's hint to signal that its rewards are boosted.
 * Renders nothing until the pebble is found; dimmed when toggled off.
 */
export function WidgetGalet({ size = 26 }: { size?: number }): ReactElement | null {
  const { t } = useTranslation()
  const defs = useGameStore((s) => s.defs)
  const galets = useGameStore((s) => s.state.galets)
  const galet = defs.galets.find((g) => g.effect.type === 'widgetMultiplier')
  const owned = galet ? galets[galet.id] : undefined
  if (!galet || !owned?.found) return null
  const tip = t('galet.widget.tip').replace('{mult}', String(galet.effect.value))
  return (
    <span className="inline-flex shrink-0 align-middle" title={tip}>
      <Galet
        color={galet.color}
        motif={galet.motif}
        shape={galet.shape}
        size={size}
        dim={!owned.active}
      />
    </span>
  )
}
