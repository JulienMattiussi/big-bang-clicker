/**
 * Formatage des grands nombres pour l'affichage (notation abrégée puis
 * scientifique). Centralisé ici : tout affichage de nombre du jeu doit passer
 * par ces fonctions (voir docs/ARCHITECTURE.md).
 *
 * - `formatNumber` : décimales rognées (zéros de fin retirés). Pour les valeurs
 *   discrètes (coûts, niveaux).
 * - `formatFixed` : décimales FIXES (jamais rognées). Pour les valeurs vivantes
 *   (ressources, flux, Complexité) afin d'éviter le "flick" de largeur quand la
 *   partie décimale passe par zéro (ex : 20.9 -> 21.0 -> 21.1).
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

/** Décimales rognées (zéros de fin retirés). Valeurs discrètes. */
export function formatNumber(value: number, decimals = 2): string {
  return abbreviate(value, decimals, true)
}

/** Décimales fixes (jamais rognées). Valeurs vivantes, largeur stable. */
export function formatFixed(value: number, decimals = 1): string {
  return abbreviate(value, decimals, false)
}
