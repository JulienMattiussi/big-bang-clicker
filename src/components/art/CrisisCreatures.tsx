import type { ReactElement } from 'react'

/** A falling meteor: a cratered rocky head leading, with a flame trailing up
 *  behind it. Drawn at the local origin (rock centre); the caller translates it.
 *  Crisis-illustration colours (documented exception, not tier tokens). */
export function MeteorGlyph(): ReactElement {
  return (
    <g aria-hidden>
      {/* Flame trailing upward (the meteor falls downward). */}
      <path
        d="M-2.8 0 Q-3.3 -5 -1.6 -8 L-2.3 -11.5 L-0.6 -8 L0 -14 L0.7 -8 L2.3 -10.8 Q3.3 -5 2.8 0 Z"
        fill="#f4641e"
      />
      <path d="M-1.5 0 Q-1.7 -4 -0.6 -6.5 L0 -9.8 L0.7 -6.5 Q1.7 -4 1.5 0 Z" fill="#ffcf3f" />
      <circle cx="0" cy="0" r="2.8" fill="#5b5b5b" stroke="#2e2e2e" strokeWidth="0.5" />
      <circle cx="-0.9" cy="-0.6" r="0.75" fill="#3f3f3f" />
      <circle cx="0.9" cy="0.5" r="0.55" fill="#3f3f3f" />
      <circle cx="-0.1" cy="1.1" r="0.4" fill="#3f3f3f" />
    </g>
  )
}

/** A small creature silhouette - a rat or a raptor (the survivors of the
 *  extinction) - feet at the local origin, facing right (mirror via the parent). */
export function CritterGlyph({ kind }: { kind: 'rat' | 'raptor' }): ReactElement {
  if (kind === 'raptor') {
    // Bipedal theropod: stiff raised tail, body, neck rising to a snouted head,
    // two digitigrade legs.
    return (
      <g
        fill="var(--color-fg)"
        stroke="var(--color-fg)"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M-7 -3 Q-3 -4 0 -4.5 Q2 -4.8 3 -4.2 Q4 -6 4.8 -7.6 Q5.2 -8.3 6 -8.1 Q7 -7.9 6.6 -7.1 Q6 -6.7 5.2 -6.7 Q4.6 -5.7 4 -4.9 Q3.2 -3.9 2.4 -3.5 Q1 -3.1 -1 -3.3 Q-4 -3.3 -7 -3 Z" />
        <path
          d="M0.6 -3.3 L1.5 -1.4 L0.5 0 M2.2 -3.1 L3 -1.4 L2.2 0"
          fill="none"
          strokeWidth="0.85"
        />
        <path d="M3.4 -4.1 L4.2 -3.1 L3.7 -2.4" fill="none" strokeWidth="0.55" />
      </g>
    )
  }
  // Rodent: rounded body, head with a pointed snout and ear, long trailing tail.
  return (
    <g fill="var(--color-fg)" stroke="var(--color-fg)" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="-0.4" cy="-1.8" rx="3" ry="1.5" />
      <path d="M2 -2.5 Q4.3 -3 5.1 -1.9 Q5.3 -1.2 4.2 -1.1 Q3.1 -1.1 2.2 -1.7 Z" />
      <circle cx="2.5" cy="-3.1" r="0.75" />
      <path d="M-3.3 -1.9 q-3 -0.2 -4.4 1.1" fill="none" strokeWidth="0.6" />
      <path d="M-1.4 -0.5 V0 M1 -0.6 V0" fill="none" strokeWidth="0.7" />
    </g>
  )
}
