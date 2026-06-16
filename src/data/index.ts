import type { ConverterDef, GameDefs, GeneratorDef, ResourceDef } from '@/lib/types'
import { cosmosConverters, cosmosEras, cosmosGenerators, cosmosResources } from './eras/cosmos'
import { lifeConverters, lifeEras, lifeGenerators, lifeResources } from './eras/life'
import {
  civilizationConverters,
  civilizationEras,
  civilizationGenerators,
  civilizationResources,
} from './eras/civilization'
import { spaceConverters, spaceEras, spaceGenerators, spaceResources } from './eras/space'
import { era18, era18Generators, era18Resources } from './eras/transcendence'
import { crisisDefs } from './crises'
import { metaUpgradeDefs } from './metaUpgrades'
import { galetDefs } from './galets'

/**
 * Game data (data-driven). The engine is generic: adding an era = adding its
 * data + its i18n keys, no logic.
 *
 * Anti-spoiler (docs/GAME-DESIGN.md section 7.1): this content describes the
 * whole game, but the UI never reveals locked eras.
 */

function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]))
}

const resources: ResourceDef[] = [
  ...cosmosResources,
  ...lifeResources,
  ...civilizationResources,
  ...spaceResources,
  ...era18Resources,
]
const generators: GeneratorDef[] = [
  ...cosmosGenerators,
  ...lifeGenerators,
  ...civilizationGenerators,
  ...spaceGenerators,
  ...era18Generators,
]
const converters: ConverterDef[] = [
  ...cosmosConverters,
  ...lifeConverters,
  ...civilizationConverters,
  ...spaceConverters,
]

export const defs: GameDefs = {
  eras: [...cosmosEras, ...lifeEras, ...civilizationEras, ...spaceEras, era18],
  resources: byId(resources),
  generators: byId(generators),
  converters: byId(converters),
  upgrades: {},
  crises: byId(crisisDefs),
  metaUpgrades: metaUpgradeDefs,
  galets: galetDefs,
}
