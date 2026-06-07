import type { CSSProperties } from 'react'
import { canManualConvert } from '@/lib/engine'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useTranslation } from '@/i18n/useTranslation'
import { formatFixed, formatNumber } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'
import type { ConverterId, EraDef, ResourceId } from '@/lib/types'

/**
 * Interactive periodic table (era 3, stellar forges). The base cell makes
 * fusion fuel by hand; the element cells fuse lighter elements into heavier
 * ones (manual recipes). A faint grid (the real table layout) sits behind the
 * cells so the player recognises a periodic table; cells reveal progressively
 * as you climb the chain. This is the era's mechanic (replaces the verb click).
 */
interface ElementSpec {
  resource: ResourceId
  symbol: string
  /** Real periodic-table position (group 1-18, period 1-4). */
  col: number
  row: number
  /** Manual recipe to fuse this element; absent for the base fuel cell. */
  converter?: ConverterId
}

const ELEMENTS: ElementSpec[] = [
  { resource: 'fusion', symbol: 'H', col: 1, row: 1 },
  { resource: 'helium', symbol: 'He', col: 18, row: 1, converter: 'fuseHelium' },
  { resource: 'carbon', symbol: 'C', col: 14, row: 2, converter: 'fuseCarbon' },
  { resource: 'silicon', symbol: 'Si', col: 14, row: 3, converter: 'fuseSilicon' },
  { resource: 'heavyElement', symbol: 'Fe', col: 8, row: 4, converter: 'fuseIron' },
]

/** Standard periodic-table cell positions (periods 1-4), the "canvas". */
const LAYOUT: { col: number; row: number }[] = [
  ...[1, 18].map((col) => ({ col, row: 1 })),
  ...[1, 2, 13, 14, 15, 16, 17, 18].map((col) => ({ col, row: 2 })),
  ...[1, 2, 13, 14, 15, 16, 17, 18].map((col) => ({ col, row: 3 })),
  ...Array.from({ length: 18 }, (_, i) => ({ col: i + 1, row: 4 })),
]

export function PeriodicTable({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)
  const click = useGameStore((s) => s.click)
  const manualConvert = useGameStore((s) => s.manualConvert)
  const spawn = useFeedbackStore((s) => s.spawn)

  const has = (resource: ResourceId) => (state.resources[resource] ?? 0) > 0
  const name = (resource: ResourceId) => t(defs.resources[resource].nameKey as TranslationKey)

  const elementAt = (col: number, row: number) =>
    ELEMENTS.find((el) => el.col === col && el.row === row)

  // Reveal: a cell shows once you can make it (you hold its main input) OR once
  // its element has ever been produced (`discovered` is sticky and persisted),
  // so a cell never vanishes after appearing, even with an empty stock.
  const revealed = (el: ElementSpec) => {
    if (!el.converter) return true
    if (state.discovered[el.resource]) return true
    const main = defs.converters[el.converter].inputs[0].resource
    return has(main)
  }

  const onBaseClick = (resource: ResourceId) => {
    click(resource)
    spawn(`res:${resource}`, '+1', 'resource')
  }

  const onFuse = (converterId: ConverterId) => {
    const conv = defs.converters[converterId]
    if (!canManualConvert(state, defs, converterId)) return
    manualConvert(converterId)
    for (const input of conv.inputs)
      spawn(`res:${input.resource}`, `-${formatNumber(input.amount)}`, 'spend')
    for (const output of conv.outputs)
      spawn(`res:${output.resource}`, `+${formatNumber(output.amount)}`, 'resource')
  }

  const recipe = (converterId: ConverterId) => {
    const conv = defs.converters[converterId]
    const side = (list: { resource: ResourceId; amount: number }[]) =>
      list.map((io) => `${formatNumber(io.amount)} ${name(io.resource)}`).join(' + ')
    return `${side(conv.inputs)} → ${side(conv.outputs)}`
  }

  const grid: CSSProperties = { gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }

  return (
    <div
      role="group"
      aria-label={t(era.verbKey as TranslationKey)}
      className="grid w-full gap-1"
      style={grid}
    >
      {/* The verb sits in the table's empty top-middle (saves vertical space). */}
      <div
        style={{ gridColumn: '3 / 13', gridRow: '1 / 3' }}
        className="flex items-center justify-center"
      >
        <span aria-hidden className="text-lg font-semibold text-fg">
          {t(era.verbKey as TranslationKey)}
        </span>
      </div>
      {LAYOUT.map(({ col, row }) => {
        const cell: CSSProperties = { gridColumnStart: col, gridRowStart: row }
        const el = elementAt(col, row)

        // Empty slot of the table outline (the recognisable grid / canvas).
        if (!el || !revealed(el)) {
          return (
            <div
              key={`${col}-${row}`}
              aria-hidden
              style={cell}
              className="aspect-square rounded-md border border-border/40 bg-surface/20"
            />
          )
        }

        const amount = state.resources[el.resource] ?? 0
        const affordable = el.converter ? canManualConvert(state, defs, el.converter) : true
        const title = el.converter ? recipe(el.converter) : t(era.verbKey as TranslationKey)

        return (
          <button
            key={el.resource}
            type="button"
            onClick={() => (el.converter ? onFuse(el.converter) : onBaseClick(el.resource))}
            disabled={!affordable}
            title={title}
            aria-label={`${name(el.resource)}: ${formatFixed(amount)}. ${title}`}
            style={cell}
            className={`flex aspect-square flex-col items-center justify-center rounded-md border p-0.5 text-center transition select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95 ${
              el.converter
                ? affordable
                  ? 'border-border bg-surface hover:border-accent'
                  : 'border-border bg-bg/40 opacity-50'
                : 'border-accent/60 bg-accent/10 hover:border-accent'
            }`}
          >
            <span className="text-sm leading-none font-bold text-fg">{el.symbol}</span>
            <span className="mt-0.5 text-[9px] leading-none text-muted tabular-nums">
              {formatFixed(amount)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
