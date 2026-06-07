import { useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { useTranslation } from '@/i18n/useTranslation'
import type { EraDef } from '@/lib/types'

/** An atom node: position (viewBox units) and element symbol. */
interface Atom {
  x: number
  y: number
  sym: string
}
interface Molecule {
  atoms: Atom[]
  /** Bonds to draw, as pairs of atom indices. */
  bonds: [number, number][]
}

/** Element tint (semantic tokens only; never a hardcoded color). */
const TINT: Record<string, string> = {
  C: 'var(--color-muted)',
  H: 'var(--color-fg)',
  O: 'var(--color-accent)',
  N: 'var(--color-secondary)',
  P: 'var(--color-octarine)',
}

/** A few target molecules, cycled as the player completes them. */
const MOLECULES: Molecule[] = [
  {
    atoms: [
      { x: 50, y: 44, sym: 'O' },
      { x: 33, y: 60, sym: 'H' },
      { x: 67, y: 60, sym: 'H' },
    ],
    bonds: [
      [0, 1],
      [0, 2],
    ],
  },
  {
    atoms: [
      { x: 50, y: 50, sym: 'C' },
      { x: 50, y: 28, sym: 'H' },
      { x: 72, y: 58, sym: 'H' },
      { x: 28, y: 58, sym: 'H' },
      { x: 50, y: 72, sym: 'N' },
    ],
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
  },
  {
    // A 5-membered ring (nucleotide-like): connect consecutive atoms.
    atoms: Array.from({ length: 5 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2
      return {
        x: 50 + Math.cos(a) * 22,
        y: 50 + Math.sin(a) * 22,
        sym: ['C', 'N', 'C', 'C', 'P'][i],
      }
    }),
    bonds: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
  },
]

const bondKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)

/**
 * Era 5 (Building blocks of life): a ball-and-stick model. Faint guide bonds
 * show the target molecule; click two atoms to draw the bond between them
 * (+1 molecule each). Complete every bond and the molecule snaps together (free
 * RNA) before a new target appears. A graph-drawing gesture, brand new here.
 */
export function MoleculeBuilder({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const { verb, gainBase, complete } = useEraMechanic(era)

  const [index, setIndex] = useState(0)
  const [drawn, setDrawn] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<number | null>(null)
  const [done, setDone] = useState(0)

  const mol = MOLECULES[index]
  const isBond = (a: number, b: number) =>
    mol.bonds.some(([i, j]) => bondKey(i, j) === bondKey(a, b))

  const clickAtom = (i: number) => {
    if (selected === null) {
      setSelected(i)
      return
    }
    if (selected === i) {
      setSelected(null)
      return
    }
    const key = bondKey(selected, i)
    if (isBond(selected, i) && !drawn.has(key)) {
      const next = new Set(drawn)
      next.add(key)
      gainBase()
      setSelected(null)
      if (next.size >= mol.bonds.length) {
        // Molecule complete: it assembles into RNA, then a new target loads.
        complete()
        setDone((d) => d + 1)
        setDrawn(new Set())
        setIndex((n) => (n + 1) % MOLECULES.length)
      } else {
        setDrawn(next)
      }
    } else {
      // Not a valid bond (or already drawn): just move the selection, no penalty.
      setSelected(i)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        key={done}
        viewBox="0 0 100 100"
        className="h-60 w-60 overflow-visible"
        role="group"
        aria-label={verb}
      >
        {/* Guide + drawn bonds. */}
        {mol.bonds.map(([a, b]) => {
          const on = drawn.has(bondKey(a, b))
          return (
            <line
              key={bondKey(a, b)}
              x1={mol.atoms[a].x}
              y1={mol.atoms[a].y}
              x2={mol.atoms[b].x}
              y2={mol.atoms[b].y}
              stroke={on ? 'var(--color-accent)' : 'var(--color-border)'}
              strokeWidth={on ? 2.4 : 1}
              strokeDasharray={on ? undefined : '2 3'}
              strokeLinecap="round"
              className={on ? 'pop-in' : undefined}
            />
          )
        })}

        {/* Atoms (clickable, keyboard-accessible). */}
        {mol.atoms.map((atom, i) => (
          <g key={i}>
            <circle
              cx={atom.x}
              cy={atom.y}
              r="8"
              fill={selected === i ? 'var(--color-accent)' : 'var(--color-surface)'}
              stroke={TINT[atom.sym] ?? 'var(--color-border)'}
              strokeWidth="2"
            />
            <text
              x={atom.x}
              y={atom.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-fg text-[7px] font-bold select-none"
              aria-hidden
            >
              {atom.sym}
            </text>
            {/* Transparent hit target as a real button for accessibility. */}
            <circle
              cx={atom.x}
              cy={atom.y}
              r="9"
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-pressed={selected === i}
              aria-label={`${t('molecule.atom')} ${atom.sym}`}
              onClick={() => clickAtom(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  clickAtom(i)
                }
              }}
              className="cursor-pointer outline-none focus-visible:stroke-accent"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
      <span className="text-base font-semibold text-fg">{verb}</span>
      <span className="text-xs text-muted">{t('molecule.hint')}</span>
    </div>
  )
}
