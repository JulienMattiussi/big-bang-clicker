/**
 * Era 9 (Cambrian assembly) data + plan logic: the body parts, the organisms made
 * of them, the conveyor pacing constants, and the production queue helpers. Pure
 * (no React); the art lives in art/PartGlyph + art/OrganismGlyph, the interaction
 * in BodyAssembly.tsx.
 */

/** Body parts that ride the conveyor; the SHAPE is the identity, and each part has
 *  its OWN rainbow hue so they are easy to tell apart at a glance. */
export const PARTS = [
  { id: 'eye', color: 'var(--part-1)' },
  { id: 'segment', color: 'var(--part-2)' },
  { id: 'appendage', color: 'var(--part-3)' },
  { id: 'spine', color: 'var(--part-4)' },
  { id: 'leg', color: 'var(--part-5)' },
  { id: 'shell', color: 'var(--part-6)' },
  { id: 'fin', color: 'var(--part-7)' },
  { id: 'frond', color: 'var(--part-8)' },
] as const
export type PartId = (typeof PARTS)[number]['id']
export const PART_IDS = PARTS.map((p) => p.id)
export const colorOf = (id: PartId) => PARTS.find((p) => p.id === id)!.color

/**
 * Cambrian organisms to assemble (Burgess Shale / Chengjiang fauna), each a
 * realistic combination of shared body parts - so most parts serve several
 * organisms (only the sponge's "frond" is unique).
 */
const ORGANISMS: { id: string; parts: PartId[] }[] = [
  { id: 'trilobite', parts: ['segment', 'eye', 'leg'] },
  { id: 'anomalocaris', parts: ['eye', 'appendage', 'fin'] },
  { id: 'opabinia', parts: ['eye', 'appendage', 'segment'] },
  { id: 'hallucigenia', parts: ['spine', 'leg', 'segment'] },
  { id: 'wiwaxia', parts: ['shell', 'spine'] },
  { id: 'pikaia', parts: ['fin', 'segment'] },
  { id: 'haikouichthys', parts: ['eye', 'fin', 'segment'] },
  { id: 'marrella', parts: ['eye', 'spine', 'leg'] },
  { id: 'brachiopod', parts: ['shell', 'appendage'] },
  { id: 'sponge', parts: ['frond', 'spine'] },
]

/** Conveyor pacing: a new part every SPAWN_MS, crossing in BELT_MS (lower
 *  SPAWN_MS = parts closer together on the belt). */
export const SPAWN_MS = 1000
export const BELT_MS = 11000
/** Organisms queued ahead of the current one (the production plan). */
const QUEUE_AHEAD = 2
/** Each organism lives this long before it dies; EXIT_MS = its leave animation. */
export const CYCLE_MS = 5000
export const EXIT_MS = 550
/** Combo: +1 per organism completed in time, reset on a miss, capped here. */
export const COMBO_CAP = 100
/** The era's main converter must reach this level before the pebble can appear. */
export const GALET_UNLOCK_LEVEL = 2
/** The diversity pebble surfaces on the belt about once every 20-30 parts. */
const GALET_MIN = 20
const GALET_MAX = 30
export const galetEvery = () => GALET_MIN + Math.floor(Math.random() * (GALET_MAX - GALET_MIN + 1))

export interface Piece {
  key: number
  id: PartId
  /** ms already elapsed on the belt at spawn (>0 only for the start pre-fill). */
  age: number
  /** This piece is the diversity pebble riding the belt (clicked to discover it). */
  galet?: boolean
}
interface Slot {
  id: PartId
  filled: boolean
}
export interface Plan {
  org: string
  slots: Slot[]
}

export function partsOf(orgId: string): PartId[] {
  return ORGANISMS.find((o) => o.id === orgId)?.parts ?? []
}

/** A random organism id, avoiding the ones already in the queue (no repeats). */
export function pickOrg(exclude: string[]): string {
  const pool = ORGANISMS.filter((o) => !exclude.includes(o.id))
  const src = pool.length > 0 ? pool : ORGANISMS
  return src[Math.floor(Math.random() * src.length)].id
}

export function planFor(orgId: string): Plan {
  return { org: orgId, slots: partsOf(orgId).map((id) => ({ id, filled: false })) }
}

/** The starting queue: a current plan plus QUEUE_AHEAD distinct upcoming organisms. */
export function freshQueue(): { plan: Plan; upcoming: string[] } {
  const upcoming: string[] = []
  const current = pickOrg([])
  for (let i = 0; i < QUEUE_AHEAD; i++) upcoming.push(pickOrg([current, ...upcoming]))
  return { plan: planFor(current), upcoming }
}
