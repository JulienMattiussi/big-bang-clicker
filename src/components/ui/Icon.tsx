import {
  Atom,
  CircleDot,
  Cog,
  Copy,
  Download,
  Flame,
  Gem,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Upload,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Registre d'icônes : les données ne référencent qu'un identifiant (string),
 * l'association avec la librairie d'icônes vit ici (UI). Ajouter une ressource
 * = ajouter son entrée ici si son icône n'existe pas encore.
 */
const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  'circle-dot': CircleDot,
  zap: Zap,
  atom: Atom,
  cog: Cog,
  gem: Gem,
  flame: Flame,
  orbit: Orbit,
  pause: Pause,
  play: Play,
  settings: Settings,
  download: Download,
  upload: Upload,
  'rotate-ccw': RotateCcw,
  copy: Copy,
}

export function Icon({ name, className }: { name: string; className?: string }) {
  const Glyph = ICONS[name] ?? CircleDot
  return <Glyph className={className} aria-hidden />
}
