/**
 * Large-number formatting for display (abbreviated then scientific). Centralized
 * here: every number shown in the game must go through these functions
 * (see docs/ARCHITECTURE.md).
 *
 * - `formatNumber`: trimmed decimals (trailing zeros removed). For discrete
 *   values (costs, levels).
 * - `formatFixed`: FIXED decimals (never trimmed). For live values (resources,
 *   flows, Complexity) to avoid the width "flicker" when the decimal part
 *   crosses zero (e.g. 20.9 -> 21.0 -> 21.1).
 */

const SUFFIXES = ['', 'k', 'M', 'G', 'T', 'P', 'E']

function render(n: number, decimals: number, trim: boolean): string {
  const fixed = n.toFixed(decimals)
  return trim ? Number(fixed).toString() : fixed
}

function abbreviate(value: number, decimals: number, trim: boolean): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '-∞'

  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)

  if (abs === 0) return sign + render(0, decimals, trim)
  if (abs < 1000) return sign + render(abs, decimals, trim)

  const tier = Math.floor(Math.log10(abs) / 3)
  if (tier < SUFFIXES.length) {
    return sign + render(abs / 1000 ** tier, decimals, trim) + SUFFIXES[tier]
  }
  return sign + abs.toExponential(decimals)
}

/** Trimmed decimals (trailing zeros removed). For discrete values. */
export function formatNumber(value: number, decimals = 2): string {
  return abbreviate(value, decimals, true)
}

/** Fixed decimals (never trimmed). For live values, stable width. */
export function formatFixed(value: number, decimals = 1): string {
  return abbreviate(value, decimals, false)
}
