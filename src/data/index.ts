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

const eras = [...cosmosEras, ...lifeEras, ...civilizationEras, ...spaceEras, era18]

// "La grande unification" (e17) is conclusive: its recipe also draws one unit of
// each EARLIER era's base resource - the whole universe converging into the city.
// Visualised by the convergence-wheel widget (one spoke per era).
const unification = converters.find((c) => c.id === 'unification')
if (unification) {
  const have = new Set(unification.inputs.map((i) => i.resource))
  for (const e of eras) {
    if (e.index < 17 && e.clickResource && !have.has(e.clickResource)) {
      unification.inputs.push({ resource: e.clickResource, amount: 1 })
      have.add(e.clickResource)
    }
  }
}

export const defs: GameDefs = {
  eras,
  resources: byId(resources),
  generators: byId(generators),
  converters: byId(converters),
  upgrades: {},
  crises: byId(crisisDefs),
  metaUpgrades: metaUpgradeDefs,
  galets: galetDefs,
}
