import { Icon } from './Icon'

type Kind = 'resource' | 'machine' | 'complexity'

const KINDS: Record<Kind, string> = {
  resource: 'bg-secondary/15 text-secondary',
  machine: 'bg-accent/15 text-accent',
  complexity: 'bg-octarine/15 text-octarine',
}

/**
 * Pastille d'icône d'une ressource ou d'une machine. Code couleur : machines en
 * couleur d'accent (l'orange évoque l'action qu'on déclenche), ressources en
 * couleur secondaire.
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
