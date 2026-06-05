/**
 * Formatage des grands nombres pour l'affichage (notation abrégée puis
 * scientifique). Centralisé ici : tout affichage de nombre du jeu doit passer
 * par cette fonction (voir docs/ARCHITECTURE.md).
 */

const SUFFIXES = ['', 'k', 'M', 'G', 'T', 'P', 'E']

/** Retire les zéros décimaux inutiles. */
function trim(n: number, decimals: number): string {
  return Number(n.toFixed(decimals)).toString()
}

/**
 * Formate un nombre : tel quel sous 1000, abrégé (k, M, G...) jusqu'aux
 * suffixes connus, puis en notation scientifique au-delà.
 */
export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '-∞'
  if (value === 0) return '0'

  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)

  if (abs < 1000) return sign + trim(abs, decimals)

  const tier = Math.floor(Math.log10(abs) / 3)
  if (tier < SUFFIXES.length) {
    const scaled = abs / 1000 ** tier
    return sign + trim(scaled, decimals) + SUFFIXES[tier]
  }

  return sign + abs.toExponential(decimals)
}
