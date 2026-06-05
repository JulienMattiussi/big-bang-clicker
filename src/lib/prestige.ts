/**
 * Prestige (nouveau Big Bang) : calcul des Échos et reset New Game+.
 * Voir docs/GAME-DESIGN.md section 3.3 et docs/ARCHITECTURE.md section 8.
 */

import type { GameState } from './types'

export const ECHO_K = 1
export const ECHO_BASE = 1000

/** Échos "mérités" sur l'ensemble de la partie (monotone avec la Complexité totale). */
export function lifetimeEchoes(state: GameState): number {
  if (state.totalComplexityEver <= 0) return 0
  return Math.floor(ECHO_K * Math.sqrt(state.totalComplexityEver / ECHO_BASE))
}

/** Échos gagnables en faisant un prestige maintenant (au-delà de ceux déjà acquis). */
export function echoesGain(state: GameState): number {
  return Math.max(0, lifetimeEchoes(state) - state.echoes)
}

export function canPrestige(state: GameState): boolean {
  return echoesGain(state) >= 1
}

/**
 * Déclenche le prestige : reset complet de la partie. Conserve les Échos
 * (incrémentés du gain), les méta-upgrades et la Complexité totale cumulée.
 */
export function prestige(state: GameState, now: number): GameState {
  return {
    version: state.version,
    startedAt: state.startedAt,
    lastSeen: now,
    currentEraId: '',
    unlockedEras: [],
    resources: {},
    generators: {},
    converters: {},
    upgrades: {},
    crises: {},
    multipliers: {},
    complexity: 0,
    echoes: state.echoes + echoesGain(state),
    metaUpgrades: state.metaUpgrades,
    totalComplexityEver: state.totalComplexityEver,
  }
}
