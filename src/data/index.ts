import type { ConverterDef, GameDefs, GeneratorDef, ResourceDef } from '@/lib/types'
import { era0, era0Converters, era0Generators, era0Resources } from './eras/era0'
import { era1, era1Converters, era1Generators, era1Resources } from './eras/era1'

/**
 * Données du jeu (data-driven). Chaque ère vit dans son fichier ; ici on agrège.
 * Le moteur est générique : ajouter une ère = ajouter un fichier + ses clés
 * i18n, pas de logique.
 *
 * Anti-spoiler (docs/GAME-DESIGN.md section 7.1) : ce contenu décrit tout le
 * jeu, mais l'UI ne révèle jamais les ères non débloquées.
 */

function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]))
}

const resources: ResourceDef[] = [...era0Resources, ...era1Resources]
const generators: GeneratorDef[] = [...era0Generators, ...era1Generators]
const converters: ConverterDef[] = [...era0Converters, ...era1Converters]

export const defs: GameDefs = {
  eras: [era0, era1],
  resources: byId(resources),
  generators: byId(generators),
  converters: byId(converters),
  upgrades: {},
  crises: {},
}
