import { useState } from 'react'
import { useEraMechanic } from './useEraMechanic'
import { WidgetHint } from './WidgetHint'
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

/** A regular polygon ring of atoms (helper for the cyclic molecules). */
function ring(syms: string[], r = 22): Molecule {
  const atoms = syms.map((sym, i) => {
    const a = -Math.PI / 2 + (i / syms.length) * Math.PI * 2
    return { x: 50 + Math.cos(a) * r, y: 50 + Math.sin(a) * r, sym }
  })
  const bonds = syms.map((_, i) => [i, (i + 1) % syms.length] as [number, number])
  return { atoms, bonds }
}

/** Target molecules, cycled as the player completes them (simple + chains + rings). */
const MOLECULES: Molecule[] = [
  // Dihydrogen H2.
  {
    atoms: [
      { x: 38, y: 50, sym: 'H' },
      { x: 62, y: 50, sym: 'H' },
    ],
    bonds: [[0, 1]],
  },
  // Water H2O.
  {
    atoms: [
      { x: 50, y: 42, sym: 'O' },
      { x: 34, y: 58, sym: 'H' },
      { x: 66, y: 58, sym: 'H' },
    ],
    bonds: [
      [0, 1],
      [0, 2],
    ],
  },
  // Carbon dioxide CO2 (linear).
  {
    atoms: [
      { x: 26, y: 50, sym: 'O' },
      { x: 50, y: 50, sym: 'C' },
      { x: 74, y: 50, sym: 'O' },
    ],
    bonds: [
      [1, 0],
      [1, 2],
    ],
  },
  // Ammonia NH3.
  {
    atoms: [
      { x: 50, y: 46, sym: 'N' },
      { x: 32, y: 58, sym: 'H' },
      { x: 68, y: 58, sym: 'H' },
      { x: 50, y: 70, sym: 'H' },
    ],
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  },
  // Methane CH4.
  {
    atoms: [
      { x: 50, y: 50, sym: 'C' },
      { x: 50, y: 28, sym: 'H' },
      { x: 72, y: 62, sym: 'H' },
      { x: 28, y: 62, sym: 'H' },
      { x: 50, y: 72, sym: 'H' },
    ],
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
  },
  // Methanol CH3OH (simplified).
  {
    atoms: [
      { x: 40, y: 52, sym: 'C' },
      { x: 64, y: 46, sym: 'O' },
      { x: 26, y: 42, sym: 'H' },
      { x: 26, y: 62, sym: 'H' },
      { x: 78, y: 36, sym: 'H' },
    ],
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 4],
    ],
  },
  // Propane: a 3-carbon zigzag chain with end hydrogens.
  {
    atoms: [
      { x: 28, y: 54, sym: 'C' },
      { x: 50, y: 46, sym: 'C' },
      { x: 72, y: 54, sym: 'C' },
      { x: 28, y: 36, sym: 'H' },
      { x: 72, y: 36, sym: 'H' },
    ],
    bonds: [
      [0, 1],
      [1, 2],
      [0, 3],
      [2, 4],
    ],
  },
  // Butane: a 4-carbon zigzag (skeletal).
  {
    atoms: [
      { x: 22, y: 56, sym: 'C' },
      { x: 40, y: 44, sym: 'C' },
      { x: 58, y: 56, sym: 'C' },
      { x: 76, y: 44, sym: 'C' },
    ],
    bonds: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  },
  // Five-membered ring (nucleotide-like).
  ring(['C', 'N', 'C', 'C', 'P']),
  // Six-membered carbon ring (benzene-like).
  ring(['C', 'C', 'C', 'C', 'C', 'C']),
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
  const [hovered, setHovered] = useState<number | null>(null)
  const [done, setDone] = useState(0)

  const mol = MOLECULES[index]!
  const isBond = (a: number, b: number) =>
    mol.bonds.some(([i, j]) => bondKey(i, j) === bondKey(a, b))
  const awaitsBond = (i: number) =>
    mol.bonds.some(([a, b]) => (a === i || b === i) && !drawn.has(bondKey(a, b)))

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
        viewBox="10 10 80 80"
        className="h-60 w-60 overflow-visible"
        role="group"
        aria-label={verb}
      >
        {mol.bonds.map(([a, b]) => {
          const on = drawn.has(bondKey(a, b))
          return (
            <line
              key={bondKey(a, b)}
              x1={mol.atoms[a]!.x}
              y1={mol.atoms[a]!.y}
              x2={mol.atoms[b]!.x}
              y2={mol.atoms[b]!.y}
              stroke={on ? 'var(--color-accent)' : 'var(--color-muted)'}
              strokeWidth={on ? 3 : 2}
              strokeOpacity={on ? 1 : 0.7}
              strokeDasharray={on ? undefined : '3 2.5'}
              strokeLinecap="round"
              className={on ? 'pop-in' : undefined}
            />
          )
        })}

        {mol.atoms.map((atom, i) => {
          const isSelected = selected === i
          const isHovered = hovered === i && !isSelected && awaitsBond(i)
          return (
          <g key={i}>
            <circle
              cx={atom.x}
              cy={atom.y}
              r={isSelected || isHovered ? 7.5 : 6.5}
              fill={isSelected ? 'var(--color-accent)' : 'var(--color-surface)'}
              stroke={isSelected || isHovered ? 'var(--color-accent)' : (TINT[atom.sym] ?? 'var(--color-border)')}
              strokeWidth={isHovered ? 2.6 : 1.8}
              className="transition-all duration-150"
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
              r="8"
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-pressed={selected === i}
              aria-label={`${t('molecule.atom')} ${atom.sym}`}
              onClick={() => clickAtom(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
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
          )
        })}
      </svg>
      <span className="text-base font-semibold text-fg">{verb}</span>
      <WidgetHint>{t('molecule.hint')}</WidgetHint>
    </div>
  )
}
