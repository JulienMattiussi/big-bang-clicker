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

/** Custom glyph (molecule): a water-like ball-and-stick (one O, two H, bent). */
function MoleculeIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <line x1="12" y1="9" x2="6.5" y2="16" />
      <line x1="12" y1="9" x2="17.5" y2="16" />
      <circle cx="12" cy="9" r="3.4" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="16.5" r="2.3" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="16.5" r="2.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Custom glyph (cell): a membrane with an off-centre nucleus. */
function CellIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <ellipse cx="12" cy="12" rx="9" ry="7.5" transform="rotate(-12 12 12)" />
      <circle cx="14.5" cy="13" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Spikes for the virus glyph (capsid + glycoprotein knobs), precomputed. */
const VIRUS_SPIKES = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x1: 12 + c * 6, y1: 12 + s * 6, x2: 12 + c * 9.2, y2: 12 + s * 9.2, kx: 12 + c * 10, ky: 12 + s * 10 }
})

/** Custom glyph (virus): a capsid hedged with spiked glycoproteins (VIH-like). */
function VirusIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="12" cy="12" r="5.5" />
      {VIRUS_SPIKES.map((sp, i) => (
        <g key={i}>
          <line x1={sp.x1} y1={sp.y1} x2={sp.x2} y2={sp.y2} />
          <circle cx={sp.kx} cy={sp.ky} r="1.3" fill="currentColor" stroke="none" />
        </g>
      ))}
    </svg>
  )
}

/** Gas particles ringing the atmosphere glyph, evenly spaced around the planet. */
const ATMOSPHERE_DOTS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2
  return { cx: 12 + Math.cos(a) * 9.3, cy: 12 + Math.sin(a) * 9.3 }
})

/** Custom glyph (atmosphere): the Earth ringed by gas particles all around. */
function AtmosphereIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="12" cy="12" r="5.5" />
      {ATMOSPHERE_DOTS.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r="1" fill="currentColor" stroke="none" />
      ))}
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
  atmosphere: AtmosphereIcon,
  star: Star,
  disc: Disc,
  ellipse: EllipseIcon,
  electron: ElectronIcon,
  nucleon: NucleonIcon,
  cell: CellIcon,
  molecule: MoleculeIcon,
  virus: VirusIcon,
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
