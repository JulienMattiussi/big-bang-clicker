import { Icon } from '@/components/ui/Icon'

interface EraIconProps {
  icon: string
  className?: string
  /** Sur un fond d'accent (onglet actif, bouton du verbe) : bascule en couleur
   *  sombre pour garder un bon contraste. */
  onAccent?: boolean
}

/**
 * Icône d'ère en bicolore (duotone) avec ses couleurs dédiées (rose + turquoise),
 * ou en sombre lisible quand elle est posée sur un fond d'accent.
 */
export function EraIcon({ icon, className = 'h-5 w-5', onAccent = false }: EraIconProps) {
  const tone = onAccent ? 'fill-bg/20 text-bg' : 'fill-era-2/30 text-era'
  return <Icon name={icon} className={`${tone} ${className}`} />
}
