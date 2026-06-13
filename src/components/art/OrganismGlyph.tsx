import type { ReactElement } from 'react'

/** Inner detail strokes (drawn in the background colour over the filled body). */
const DETAIL = {
  fill: 'none',
  stroke: 'var(--color-bg)',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}
const LIMB = { ...DETAIL, strokeWidth: 2 }
const bgDot = (cx: number, cy: number, r = 1) => (
  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="var(--color-bg)" />
)

/** Distinct stylised silhouette for each Cambrian organism (filled in currentColor). */
function shape(id: string): ReactElement | null {
  switch (id) {
    case 'trilobite':
      return (
        <>
          <ellipse cx="16" cy="12" rx="9.5" ry="8" />
          <path d="M16 5 V19" {...DETAIL} />
          <path d="M8 10 H24 M7.5 13.5 H24.5 M9 17 H23" {...DETAIL} />
          {bgDot(13, 8)}
          {bgDot(19, 8)}
        </>
      )
    case 'anomalocaris':
      return (
        <>
          <ellipse cx="18" cy="12" rx="10" ry="5" />
          <path d="M9 16 q2 3 4 0 q2 3 4 0 q2 3 4 0 q2 3 4 0" {...DETAIL} />
          <path d="M9 11 Q3 10 3 15" {...LIMB} />
          <path d="M10 13 Q5 13 5 17" {...LIMB} />
          {bgDot(12, 9, 1.2)}
        </>
      )
    case 'opabinia':
      return (
        <>
          <ellipse cx="19" cy="12" rx="9" ry="4.5" />
          <path d="M10 12 Q3 12.5 2.5 8.5" {...LIMB} />
          <circle cx="2.5" cy="7.8" r="1.5" />
          {[14, 16.5, 19, 21.5, 24].map((x) => bgDot(x, 8.5, 0.9))}
        </>
      )
    case 'hallucigenia':
      return (
        <>
          <rect x="5" y="10" width="20" height="4.5" rx="2.25" />
          <circle cx="25" cy="12.2" r="2.6" />
          {[8, 11, 14, 17, 20].map((x) => (
            <path key={`l${x}`} d={`M${x} 14.5 V19`} {...DETAIL} />
          ))}
          {[8, 11, 14, 17, 20].map((x) => (
            <path key={`s${x}`} d={`M${x} 10 L${x - 1} 3.5`} {...DETAIL} />
          ))}
        </>
      )
    case 'wiwaxia':
      return (
        <>
          <path d="M5 18 Q5 8 16 8 Q27 8 27 18 Z" />
          {[8, 12, 16, 20, 24].map((x, i) => (
            <path key={x} d={`M${x} 8.5 L${x + (i - 2) * 1.6} 2`} {...DETAIL} />
          ))}
        </>
      )
    case 'pikaia':
      return (
        <>
          <path d="M3 12 Q16 6 29 12 Q16 18 3 12 Z" />
          {[12, 16, 20, 24].map((x) => (
            <path key={x} d={`M${x} 9 L${x - 2.5} 12 L${x} 15`} {...DETAIL} />
          ))}
        </>
      )
    case 'haikouichthys':
      return (
        <>
          <ellipse cx="14" cy="12" rx="9" ry="4.5" />
          <path d="M22 12 L29 8 L29 16 Z" />
          <path d="M12 7.6 L16 4 L18 7.6 Z" />
          {bgDot(8, 11, 1.1)}
        </>
      )
    case 'marrella':
      return (
        <>
          <ellipse cx="8" cy="12" rx="3.5" ry="4.5" />
          <path d="M7 8 Q15 8 27 4" {...LIMB} />
          <path d="M7 10 Q16 11 28 8" {...DETAIL} />
          <path d="M7 14 Q16 13 28 16" {...DETAIL} />
          <path d="M7 16 Q15 16 27 20" {...LIMB} />
        </>
      )
    case 'brachiopod':
      return (
        <>
          <path d="M6 9 Q16 4 26 9 Q26 16 16 18 Q6 16 6 9 Z" />
          <path d="M16 17 V8 M11 16 V9 M21 16 V9 M8.5 13 V10 M23.5 13 V10" {...DETAIL} />
          <path d="M13.5 18 H18.5" {...LIMB} />
        </>
      )
    case 'sponge':
      return (
        <>
          <path d="M11 21 Q8 9 12 5 L20 5 Q24 9 21 21 Z" />
          <ellipse cx="16" cy="6" rx="4" ry="1.8" fill="var(--color-bg)" />
          {[
            [13, 12],
            [18, 13],
            [15, 16],
            [19, 17],
          ].map(([x, y]) => bgDot(x, y, 0.9))}
        </>
      )
    default:
      return <circle cx="16" cy="12" r="8" />
  }
}

/** A representative silhouette for a Cambrian organism (no two alike). */
export function OrganismGlyph({
  id,
  className = 'h-10 w-auto',
}: {
  id: string
  className?: string
}) {
  return (
    <svg viewBox="0 0 32 24" className={className} fill="currentColor" aria-hidden>
      {shape(id)}
    </svg>
  )
}
