import type { ConverterDef, GameDefs, GeneratorDef, ResourceDef } from '@/lib/types'
import { era0, era0Converters, era0Generators, era0Resources } from './eras/era0'
import { era1, era1Converters, era1Generators, era1Resources } from './eras/era1'
import { era2, era2Converters, era2Generators, era2Resources } from './eras/era2'
import { era3, era3Converters, era3Generators, era3Resources } from './eras/era3'
import { era4, era4Converters, era4Generators, era4Resources } from './eras/era4'
import { lifeConverters, lifeEras, lifeGenerators, lifeResources } from './eras/life'
import {
  civilizationConverters,
  civilizationEras,
  civilizationGenerators,
  civilizationResources,
} from './eras/civilization'
import { spaceConverters, spaceEras, spaceGenerators, spaceResources } from './eras/space'
import { era19, era19Generators, era19Resources } from './eras/transcendence'
import { crisisDefs } from './crises'
import { metaUpgradeDefs } from './metaUpgrades'

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
  ...era0Resources,
  ...era1Resources,
  ...era2Resources,
  ...era3Resources,
  ...era4Resources,
  ...lifeResources,
  ...civilizationResources,
  ...spaceResources,
  ...era19Resources,
]
const generators: GeneratorDef[] = [
  ...era0Generators,
  ...era1Generators,
  ...era2Generators,
  ...era3Generators,
  ...era4Generators,
  ...lifeGenerators,
  ...civilizationGenerators,
  ...spaceGenerators,
  ...era19Generators,
]
const converters: ConverterDef[] = [
  ...era0Converters,
  ...era1Converters,
  ...era2Converters,
  ...era3Converters,
  ...era4Converters,
  ...lifeConverters,
  ...civilizationConverters,
  ...spaceConverters,
]

export const defs: GameDefs = {
  eras: [era0, era1, era2, era3, era4, ...lifeEras, ...civilizationEras, ...spaceEras, era19],
  resources: byId(resources),
  generators: byId(generators),
  converters: byId(converters),
  upgrades: {},
  crises: byId(crisisDefs),
  metaUpgrades: metaUpgradeDefs,
}
