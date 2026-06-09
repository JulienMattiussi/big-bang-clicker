import type { ReactElement, SVGProps } from 'react'

/**
 * Custom SVG glyphs (lucide stroke style) for resources/eras that have no
 * suitable lucide icon. Registered by name in Icon.tsx.
 */

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
export function EllipseIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-30 12 12)" />
    </svg>
  )
}

/** Custom glyph (electron): a dot on an orbit circle. */
export function ElectronIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="20" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Custom glyph (nucleon): a cluster of balls. */
export function NucleonIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="9" cy="10" r="4" />
      <circle cx="16" cy="10" r="4" />
      <circle cx="12" cy="16" r="4" />
    </svg>
  )
}

/** Custom glyph (molecule): a water-like ball-and-stick (one O, two H, bent). */
export function MoleculeIcon(props: SVGProps<SVGSVGElement>): ReactElement {
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
export function CellIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <ellipse cx="12" cy="12" rx="9" ry="7.5" transform="rotate(-12 12 12)" />
      <circle cx="14.5" cy="13" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Custom glyph (tissue): a sheet of cells joined together (membrane + nuclei). */
export function TissueIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 4 V20 M4 12 H20" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Custom glyph (organism): a trilobite, the iconic Cambrian animal. */
export function TrilobiteIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <ellipse cx="12" cy="12" rx="7.5" ry="9" />
      <path d="M12 4 V20" />
      <path d="M6 9 H18 M5.5 13 H18.5 M7 17 H17" strokeWidth="1.4" />
      <circle cx="9.4" cy="7.4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="7.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Granules scattered in the complex-cell's cytoplasm, precomputed. */
const COMPLEX_CELL_GRANULES = [
  { x1: 15.8, y1: 8, x2: 16.9, y2: 7.7 },
  { x1: 8.4, y1: 7, x2: 7.6, y2: 6.6 },
  { x1: 7.6, y1: 15, x2: 6.8, y2: 15.7 },
  { x1: 15.4, y1: 16.4, x2: 16.2, y2: 16.9 },
  { x1: 17.4, y1: 12.4, x2: 18.4, y2: 12.3 },
]

/**
 * Custom glyph (complex cell): an irregular membrane holding two ringed
 * organelles and scattered cytoplasm granules. Era icon for "the complex cell".
 */
export function ComplexCellIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <path d="M19.86 8.89 Q21.5 12 19.58 14.83 Q17.66 17.66 14.83 19.08 Q12 20.5 8.82 19.43 Q5.64 18.36 4.07 15.18 Q2.5 12 4.42 9.17 Q6.34 6.34 9.17 5.17 Q12 4 15.11 4.89 Q18.22 5.78 19.86 8.89 Z" />
      <circle cx="9.6" cy="10.4" r="2.6" />
      <circle cx="9.6" cy="10.4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13.6" r="2.6" />
      <circle cx="14" cy="13.6" r="0.9" fill="currentColor" stroke="none" />
      {COMPLEX_CELL_GRANULES.map((g, i) => (
        <line key={i} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} />
      ))}
    </svg>
  )
}

/** Spikes for the virus glyph (capsid + glycoprotein knobs), precomputed. */
const VIRUS_SPIKES = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2
  const c = Math.cos(a)
  const s = Math.sin(a)
  return {
    x1: 12 + c * 6,
    y1: 12 + s * 6,
    x2: 12 + c * 9.2,
    y2: 12 + s * 9.2,
    kx: 12 + c * 10,
    ky: 12 + s * 10,
  }
})

/** Custom glyph (virus): a capsid hedged with spiked glycoproteins (VIH-like). */
export function VirusIcon(props: SVGProps<SVGSVGElement>): ReactElement {
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
export function AtmosphereIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <circle cx="12" cy="12" r="5.5" />
      {ATMOSPHERE_DOTS.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r="1" fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}

/** Custom glyph (card): a playing card with a centred diamond pip. */
export function CardIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M12 8 L14.3 12 L12 16 L9.7 12 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Custom glyph (organelle): a mitochondrion, an oval ringed by cristae folds. */
export function OrganelleIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <g transform="rotate(-25 12 12)">
        <ellipse cx="12" cy="12" rx="9.5" ry="5.5" />
        <path d="M4.5 12 q2.4 -3.6 4.8 0 t4.8 0 t4.8 0" fill="none" />
      </g>
    </svg>
  )
}

/** Small organelles dotted inside the eukaryote glyph, precomputed. */
const EUKARYOTE_ORGANELLES = [
  { cx: 7.2, cy: 8.5 },
  { cx: 16.5, cy: 9 },
  { cx: 8, cy: 16 },
  { cx: 16, cy: 15.5 },
]

/** Custom glyph (eukaryote): a complex cell, large nucleus ringed by organelles. */
export function EukaryoteIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      <ellipse cx="12" cy="12" rx="9.5" ry="8" transform="rotate(-12 12 12)" />
      <circle cx="12" cy="12" r="3.2" />
      {EUKARYOTE_ORGANELLES.map((o, i) => (
        <circle key={i} cx={o.cx} cy={o.cy} r="1.2" fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}

/** Scattered specks for the dust glyph (varied sizes), precomputed. */
const DUST_SPECKS = [
  { cx: 7, cy: 8, r: 1.7 },
  { cx: 14.5, cy: 6, r: 1.1 },
  { cx: 17.5, cy: 11, r: 1.8 },
  { cx: 10, cy: 13, r: 1.3 },
  { cx: 15, cy: 17, r: 1.5 },
  { cx: 6, cy: 16.5, r: 1 },
  { cx: 11.5, cy: 9.5, r: 0.9 },
]

/** Custom glyph (dust): a scatter of fine grains, distinct from the sparkle. */
export function DustIcon(props: SVGProps<SVGSVGElement>): ReactElement {
  return (
    <svg {...GLYPH_PROPS} {...props}>
      {DUST_SPECKS.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="currentColor" stroke="none" />
      ))}
    </svg>
  )
}
