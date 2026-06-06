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
 * color.
 */
export function IconBadge({ icon, kind = 'resource' }: { icon: string; kind?: Kind }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${KINDS[kind]}`}
    >
      <Icon name={icon} className="h-3.5 w-3.5" />
    </span>
  )
}
