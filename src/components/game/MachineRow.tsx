import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { IconBadge } from '@/components/ui/IconBadge'
import { Icon } from '@/components/ui/Icon'
import { EraIcon } from '@/components/game/EraIcon'
import { Galet } from '@/components/game/Galet'
import { formatFixed } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'

export type T = (key: TranslationKey) => string

/** A machine flow entry: a resource and its per-second rate now and next level. */
export interface FlowEntry {
  icon: string
  /** Chemical symbol (e.g. "Si"): shown instead of the icon, like the resources panel. */
  symbol?: string
  name: string
  perSec: number
  nextPerSec: number
  /** Set when the resource belongs to a different era (which tab to find it). */
  era?: { icon: string; name: string }
}

function FlowLine({ label, entries }: { label: string; entries: FlowEntry[] }) {
  // Stack the resources vertically when there are several (more readable than
  // a long inline row, e.g. recombination consuming nucleons + electrons).
  const stacked = entries.length > 1
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0">{label}</span>
      <div className={stacked ? 'flex flex-col gap-0.5' : 'flex flex-wrap items-center gap-x-2'}>
        {entries.map((e, i) => (
          <span
            key={i}
            title={e.era ? `${e.name} - ${e.era.name}` : e.name}
            className="inline-flex items-center gap-1 tabular-nums text-secondary"
          >
            {e.symbol ? (
              <span
                aria-hidden
                className={`${e.symbol.length > 1 ? 'text-[9px]' : 'text-xs'} leading-none font-bold`}
              >
                {e.symbol}
              </span>
            ) : (
              <Icon name={e.icon} className="h-3 w-3" aria-hidden />
            )}
            {e.era ? <EraIcon icon={e.era.icon} className="h-3 w-3" /> : null}
            <span className="sr-only">{e.era ? `${e.name}, ${e.era.name}` : e.name}</span>
            {formatFixed(e.perSec)}
            <span className="text-muted/60">&rarr; {formatFixed(e.nextPerSec)}/s</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Explicit inputs/outputs of a machine, at the current and next level. */
export function MachineFlows({
  t,
  consume,
  produce,
}: {
  t: T
  consume: FlowEntry[]
  produce: FlowEntry[]
}) {
  return (
    <div className="mb-2 flex flex-col gap-0.5 text-xs text-muted">
      {consume.length > 0 ? <FlowLine label={t('machine.consumes')} entries={consume} /> : null}
      <FlowLine label={t('machine.produces')} entries={produce} />
    </div>
  )
}

/** A found pebble affecting this machine (shown next to its name). */
export interface GaletBadge {
  id: string
  color: string
  motif: string
  shape?: number
  active: boolean
  title: string
}

interface RowProps {
  name: string
  outputIcon: string
  level: number
  badges?: GaletBadge[]
  costLabel: string
  affordable: boolean
  onBuy: () => void
  t: T
  flows: ReactNode
  /** Converters only: manual craft (one recipe per click) + automation toggle. */
  onCraft?: () => void
  canCraft?: boolean
  craftTitle?: string
  enabled?: boolean
  onToggle?: () => void
}

/** One machine: title (with activity underlay), flows, and buy/craft/toggle controls. */
export function MachineRow({
  name,
  outputIcon,
  level,
  badges,
  costLabel,
  affordable,
  onBuy,
  t,
  flows,
  onCraft,
  canCraft,
  craftTitle,
  enabled,
  onToggle,
}: RowProps) {
  const toggleLabel = enabled ? t('machine.pause') : t('machine.resume')
  const running = level >= 1 && enabled !== false
  const boosted = !!badges?.some((b) => b.active) // an active pebble speeds it up
  // Quick "fill" pulse on each upgrade (re-keys the bar to replay), then it loops.
  const [boost, setBoost] = useState(0)
  const handleBuy = () => {
    onBuy()
    setBoost((b) => b + 1)
  }
  return (
    <li
      className={`flex h-full flex-col rounded-md border border-border bg-bg/40 p-2 ${enabled === false ? 'opacity-60' : ''}`}
    >
      <div className="relative mb-2 rounded">
        {/* Activity underlay BEHIND the title: two overlapping waves sweep and
            fade (never a hard reset) to convey endless progression, faster when
            galet-boosted; an upgrade replays a quick brighter sweep. */}
        {running ? (
          <div
            aria-hidden
            className={`${boosted ? 'activity-track-fast' : 'activity-track'} absolute inset-y-0 left-0 w-full overflow-hidden rounded`}
          >
            <span className="activity-wave absolute inset-y-0 left-0 w-full rounded bg-accent/15" />
            <span className="activity-wave activity-wave-2 absolute inset-y-0 left-0 w-full rounded bg-accent/15" />
            {boost > 0 ? (
              <span
                key={boost}
                className="activity-flash absolute inset-y-0 left-0 w-full rounded bg-accent/25"
              />
            ) : null}
          </div>
        ) : null}
        <div className="relative flex items-center gap-2 px-1 py-0.5">
          {/* Gear: marks a machine that automates production. */}
          <Icon name="cog" className="h-4 w-4 shrink-0 text-accent" />
          <IconBadge icon={outputIcon} kind="machine" />
          <span className="min-w-0 leading-tight">{name}</span>
          {/* Infinity-pebble badges: a pebble that boosts this machine (dim if off). */}
          {badges?.map((b) => (
            <span key={b.id} title={b.title} className="inline-flex shrink-0">
              <Galet color={b.color} motif={b.motif} shape={b.shape} size={26} dim={!b.active} />
              <span className="sr-only">{b.title}</span>
            </span>
          ))}
          <span className="flex-1" />
          <span className="shrink-0 text-xs text-muted">
            {t('ui.level')} {level}
          </span>
          {onToggle && level > 0 ? (
            <Button
              variant="ghost"
              className="shrink-0 px-2 py-1"
              aria-label={toggleLabel}
              aria-pressed={enabled === false}
              title={toggleLabel}
              onClick={onToggle}
            >
              <Icon name={enabled ? 'pause' : 'play'} className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
      {flows}
      <div className="mt-auto flex gap-2">
        {/* Manual craft (orange = the action you trigger), constant width; then
            automation, which flexes to absorb the variable cost label. */}
        {onCraft ? (
          <Button
            className="flex shrink-0 items-center justify-center whitespace-nowrap"
            disabled={!canCraft}
            title={craftTitle}
            onClick={onCraft}
          >
            {t('machine.produce')}
          </Button>
        ) : null}
        {/* Label and cost on separate lines: the button keeps the same shape
            whatever the cost text length (no awkward mid-label wrap). */}
        <Button
          variant="ghost"
          className="flex flex-1 flex-col items-center justify-center leading-tight"
          disabled={!affordable}
          onClick={handleBuy}
        >
          <span>{t('ui.buy')}</span>
          <span className="text-muted">({costLabel})</span>
        </Button>
      </div>
    </li>
  )
}
