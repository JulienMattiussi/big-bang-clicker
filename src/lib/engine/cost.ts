import type { CostCurve, ResourceId } from '../types'

/** Geometric cost of the next level (0-indexed level). */
export function costAtLevel(curve: CostCurve, level: number): number {
  return curve.base * curve.growth ** level
}

/**
 * Rounds an upgrade cost cleanly at its displayed scale (the mantissa shown
 * before the k/M/... suffix, in [1, 1000), grouped by 1000 like format.ts):
 * - mantissa < 10  -> to the unit (e.g. 3k, 9k, 4M);
 * - mantissa >= 10 -> to the nearest 5, so the last digit is 0 or 5 (15, 20k,
 *   105k, 305k, 200M).
 */
function roundCost(amount: number): number {
  if (amount <= 0) return 0
  const tier = amount < 1000 ? 0 : Math.floor(Math.log10(amount) / 3)
  const scale = 1000 ** tier
  const mantissa = amount / scale
  const rounded = mantissa < 10 ? Math.round(mantissa) : Math.round(mantissa / 5) * 5
  return Math.max(1, rounded) * scale
}

/** Cost (multi-resource) to go from `level` to `level + 1`, rounded to the nearest ten. */
export function nextCost(cost: CostCurve[], level: number): Record<ResourceId, number> {
  const total: Record<ResourceId, number> = {}
  for (const curve of cost) {
    total[curve.resource] = (total[curve.resource] ?? 0) + costAtLevel(curve, level)
  }
  for (const id in total) total[id] = roundCost(total[id]!)
  return total
}

export function canAfford(
  resources: Record<ResourceId, number>,
  cost: Record<ResourceId, number>,
): boolean {
  for (const id in cost) {
    if ((resources[id] ?? 0) < cost[id]!) return false
  }
  return true
}

export function spend(
  resources: Record<ResourceId, number>,
  cost: Record<ResourceId, number>,
): Record<ResourceId, number> {
  const next = { ...resources }
  for (const id in cost) {
    next[id] = (next[id] ?? 0) - cost[id]!
  }
  return next
}
