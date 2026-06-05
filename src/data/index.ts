import type { GameDefs } from '@/lib/types'

/**
 * Données du jeu (ères, ressources, usines, upgrades, crises).
 *
 * Vide pour l'instant : le contenu réel des ères arrive avec la tranche
 * verticale (voir docs/ROADMAP.md, phase D). Le moteur est générique et joue
 * ces données ; ajouter une ère = ajouter du contenu ici, pas de la logique.
 *
 * Anti-spoiler (docs/GAME-DESIGN.md section 7.1) : ce contenu décrit tout le
 * jeu, mais l'UI ne doit jamais révéler les ères non débloquées.
 */
export const defs: GameDefs = {
  eras: [],
  resources: {},
  generators: {},
  converters: {},
  upgrades: {},
  crises: {},
}
