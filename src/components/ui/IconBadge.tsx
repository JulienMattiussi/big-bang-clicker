import { Icon } from './Icon'

type Kind = 'resource' | 'machine' | 'complexity'

const KINDS: Record<Kind, string> = {
  resource: 'bg-secondary/15 text-secondary',
  machine: 'bg-accent/15 text-accent',
  complexity: 'bg-octarine/15 text-octarine',
}

/**
 * Icon badge for a resource or a machine. Color code: machines in the accent
 * color (orange suggests the action you trigger), resources in the secondary
 * color. A `symbol` (e.g. a chemical symbol like "Si") is rendered as text
 * instead of an icon, for atom resources.
 */
export function IconBadge({
  icon,
  symbol,
  kind = 'resource',
}: {
  icon: string
  symbol?: string
  kind?: Kind
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${KINDS[kind]}`}
    >
      {symbol ? (
        // Single-letter symbols (H, O, C) are sized up so they fill the badge
        // like a two-letter one (He, Si); otherwise a lone round letter looks small.
        <span className={`${symbol.length > 1 ? 'text-[10px]' : 'text-xs'} leading-none font-bold`}>
          {symbol}
        </span>
      ) : (
        <Icon name={icon} className="h-3.5 w-3.5" />
      )}
    </span>
  )
}
