import {
  Atom,
  Bomb,
  Brain,
  Building2,
  CircleDot,
  Cloud,
  Cog,
  Coins,
  Copy,
  Cpu,
  Crown,
  Disc,
  Dna,
  Download,
  Droplet,
  Fish,
  Flame,
  FlaskConical,
  Gem,
  Globe,
  Hammer,
  Hexagon,
  Landmark,
  Leaf,
  Network,
  Orbit,
  PawPrint,
  Pause,
  Play,
  Rocket,
  RotateCcw,
  Satellite,
  Settings,
  Skull,
  Sparkles,
  Star,
  Swords,
  Trees,
  Upload,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ReactElement, SVGProps } from 'react'

/** Base SVG props for the custom glyphs (lucide stroke style). */
const GLYPH_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Custom glyph (galaxy): an ellipse tilted on the diagonal. */
function EllipseIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-30 12 12)" />
    </svg>
  )
}

/** Custom glyph (electron): a dot on an orbit circle. */
function ElectronIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="20" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Custom glyph (nucleon): a cluster of balls. */
function NucleonIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="9" cy="10" r="4" />
      <circle cx="16" cy="10" r="4" />
      <circle cx="12" cy="16" r="4" />
    </svg>
  )
}

type Glyph = LucideIcon | ((props: SVGProps<SVGSVGElement>) => ReactElement)

/**
 * Icon registry: data only references an identifier (string); the mapping to
 * the icon library lives here (UI). Adding a resource = adding its entry here
 * if its icon does not exist yet.
 */
const ICONS: Record<string, Glyph> = {
  sparkles: Sparkles,
  'circle-dot': CircleDot,
  zap: Zap,
  atom: Atom,
  cog: Cog,
  gem: Gem,
  flame: Flame,
  orbit: Orbit,
  cloud: Cloud,
  star: Star,
  disc: Disc,
  ellipse: EllipseIcon,
  electron: ElectronIcon,
  nucleon: NucleonIcon,
  hexagon: Hexagon,
  globe: Globe,
  flask: FlaskConical,
  dna: Dna,
  droplet: Droplet,
  leaf: Leaf,
  fish: Fish,
  paw: PawPrint,
  trees: Trees,
  brain: Brain,
  hammer: Hammer,
  users: Users,
  city: Building2,
  landmark: Landmark,
  coins: Coins,
  crown: Crown,
  swords: Swords,
  cpu: Cpu,
  rocket: Rocket,
  satellite: Satellite,
  network: Network,
  bomb: Bomb,
  skull: Skull,
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
