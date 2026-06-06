import { Icon } from '@/components/ui/Icon'

interface EraIconProps {
  icon: string
  className?: string
  /** On an accent background (active tab, verb button): switch to a dark color
   *  to keep good contrast. */
  onAccent?: boolean
}

/**
 * Two-tone (duotone) era icon with its dedicated colors (pink + teal), or a
 * readable dark color when placed on an accent background.
 */
export function EraIcon({ icon, className = 'h-5 w-5', onAccent = false }: EraIconProps) {
  const tone = onAccent ? 'fill-bg/20 text-bg' : 'fill-era-2/30 text-era'
  return <Icon name={icon} className={`${tone} ${className}`} />
}
