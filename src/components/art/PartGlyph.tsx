import type { ReactElement } from 'react'

/** One Cambrian body part as a fillable glyph (solid when acquired, dim outline
 *  otherwise). Pure art, keyed by part id; the colour comes from the parent's
 *  `currentColor`. See data/plan in widgets/assemblyPlan.ts. */
export function PartGlyph({ id, filled }: { id: string; filled: boolean }): ReactElement {
  const f = filled ? 'currentColor' : 'none'
  const s = {
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  }
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden>
      {id === 'eye' ? (
        <>
          <circle cx="12" cy="12" r="8" fill={f} {...s} />
          <circle
            cx="12"
            cy="12"
            r="3"
            fill={filled ? 'var(--color-bg)' : 'currentColor'}
            stroke="none"
          />
        </>
      ) : null}
      {id === 'segment'
        ? [0, 1, 2].map((k) => (
            <rect key={k} x="4" y={6 + k * 5} width="16" height="3.4" rx="1.7" fill={f} {...s} />
          ))
        : null}
      {id === 'appendage' ? <path d="M5 5 Q21 7 17 20 Q13 12 5 11 Z" fill={f} {...s} /> : null}
      {id === 'spine' ? (
        <>
          <polygon points="3,20 6,7 9,20" fill={f} {...s} />
          <polygon points="9,20 12,4 15,20" fill={f} {...s} />
          <polygon points="15,20 18,8 21,20" fill={f} {...s} />
        </>
      ) : null}
      {id === 'leg' ? (
        <>
          <rect x="3" y="6" width="18" height="4" rx="2" fill={f} {...s} />
          {[4.5, 9, 13.5, 18].map((x, k) => (
            <rect key={k} x={x} y="10" width="2.6" height="9" rx="1.3" fill={f} {...s} />
          ))}
        </>
      ) : null}
      {id === 'shell' ? (
        <>
          <path d="M3 19 A9 9 0 0 1 21 19 Z" fill={f} {...s} />
          <path
            d="M12 10 V19 M7.5 13 V19 M16.5 13 V19"
            stroke="currentColor"
            strokeWidth="1.3"
            opacity={filled ? 0.45 : 0.85}
          />
        </>
      ) : null}
      {id === 'fin' ? <path d="M12 3 L21 21 Q12 16 3 21 Z" fill={f} {...s} /> : null}
      {id === 'frond' ? (
        <>
          <path d="M7 21 Q5 8 9 5 L15 5 Q19 8 17 21 Z" fill={f} {...s} />
          <ellipse cx="12" cy="6" rx="3" ry="1.5" fill={filled ? 'var(--color-bg)' : 'none'} {...s} />
        </>
      ) : null}
    </svg>
  )
}
