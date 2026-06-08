import type { ResourceDef } from '@/lib/types'

/** A single board card: a resource shown face-up when flipped or matched. */
export interface Card {
  key: number
  res: ResourceDef
  flipped: boolean
  matched: boolean
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
