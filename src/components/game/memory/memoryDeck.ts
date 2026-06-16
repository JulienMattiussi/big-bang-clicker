import type { ResourceDef } from '@/lib/types'
import type { TranslationKey } from '@/i18n/types'

/** i18n label for a joker card's faction. */
export const JOKER_LABEL: Record<'sith' | 'jedi', TranslationKey> = {
  sith: 'memory.joker.sith',
  jedi: 'memory.joker.jedi',
}

/** A single board card: a resource shown face-up when flipped or matched. A joker
 *  card (Force pebble) is dealt pre-solved with a sith/jedi emblem instead. */
export interface Card {
  key: number
  res: ResourceDef
  flipped: boolean
  matched: boolean
  joker?: 'sith' | 'jedi'
}

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Build a shuffled deck of `symbols` distinct resources, each repeated `group` times. */
export function dealCards(pool: ResourceDef[], symbols: number, group: number): Card[] {
  const unique: ResourceDef[] = []
  const seen = new Set<string>()
  for (const r of pool) {
    if (r && !seen.has(r.id)) {
      seen.add(r.id)
      unique.push(r)
    }
  }
  const chosen = unique.slice(0, symbols)
  const cards = chosen.flatMap((res, i) =>
    Array.from({ length: group }, (_, k) => ({
      key: i * group + k,
      res,
      flipped: false,
      matched: false,
    })),
  )
  return shuffle(cards)
}

/** With the Force pebble active: turn two symbol groups into pre-solved joker sets
 *  (one sith, one jedi), revealed and matched from the deal, so the player has two
 *  fewer sets to memorise. Keeps at least one real set to play. */
export function applyJokers(cards: Card[]): Card[] {
  const ids = [...new Set(cards.map((c) => c.res.id))]
  if (ids.length < 3) return cards
  const [sith, jedi] = ids
  return cards.map((c) =>
    c.res.id === sith
      ? { ...c, joker: 'sith' as const, flipped: true, matched: true }
      : c.res.id === jedi
        ? { ...c, joker: 'jedi' as const, flipped: true, matched: true }
        : c,
  )
}
