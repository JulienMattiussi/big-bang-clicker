import type { ReactElement } from 'react'
import { PeriodicTable } from './PeriodicTable'
import { BohrAtom } from './BohrAtom'
import { StarNursery } from './StarNursery'
import { AccretionDisk } from './AccretionDisk'
import { MoleculeBuilder } from './MoleculeBuilder'
import { PetriDish } from './PetriDish'
import { AtmosphereBalance } from './AtmosphereBalance'
import { Endosymbiosis } from './Endosymbiosis'
import { BodyAssembly } from './BodyAssembly'
import { TreeOfLife } from './TreeOfLife'
import { IdeaConstellation } from './IdeaConstellation'
import { CityGrid } from './CityGrid'
import { WorldMap } from './WorldMap'
import type { EraDef } from '@/lib/types'

/**
 * Widgets that own their mechanic (interactive), keyed by the era's `widget`
 * field. They replace the generic verb click with their own scene. Each gesture
 * is deliberately distinct (timing, scatter, grid, merge, draw, balance, memory,
 * placement, territory...) to keep the experience progressing across eras.
 */
export const INTERACTIVE_WIDGETS: Record<string, (props: { era: EraDef }) => ReactElement> = {
  bohr: BohrAtom,
  galaxy: StarNursery,
  periodic: PeriodicTable,
  accretion: AccretionDisk,
  molecule: MoleculeBuilder,
  cell: PetriDish,
  balance: AtmosphereBalance,
  endosymbiosis: Endosymbiosis,
  assembly: BodyAssembly,
  tree: TreeOfLife,
  memory: IdeaConstellation,
  city: CityGrid,
  map: WorldMap,
}

/**
 * Interactive widgets that need the full content width (shown above the panels).
 * Compact ones stay centered in the 3-column layout, like the non-interactive
 * eras.
 */
const FULLWIDTH_WIDGETS = new Set(['periodic', 'accretion', 'assembly', 'tree', 'city', 'map'])

export function isFullWidthWidget(widget: string): boolean {
  return FULLWIDTH_WIDGETS.has(widget)
}
