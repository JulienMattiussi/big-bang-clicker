import type { ReactElement } from 'react'
import { PlasmaScene } from './scenes/PlasmaScene'
import { StarsScene } from './scenes/StarsScene'
import { CellsScene } from './scenes/CellsScene'
import { SeaScene } from './scenes/SeaScene'
import { LandScene } from './scenes/LandScene'
import { CivilizationScene } from './scenes/CivilizationScene'
import { CosmosScene } from './scenes/CosmosScene'
import { CityUniverseScene } from './scenes/CityUniverseScene'
import { usePageHidden } from '@/hooks/usePageHidden'
import { useIdle } from '@/hooks/useIdle'

/** Freeze the ambient animations after this long without any interaction. */
const IDLE_FREEZE_MS = 120_000

/**
 * Ambient scene background, rendered behind the whole UI. It changes by ERA GROUP
 * (finer than the colour tier): primordial gas, a starfield, cells, an organic sea,
 * a terrestrial scene, a civilisation neuron field, a galactic field, and finally
 * the collapsing singularity. Each scene lives in its own file under `scenes/`;
 * this module just maps the era index to one and fades between them. Decorative
 * only: aria-hidden, no pointer events, disabled under prefers-reduced-motion.
 */

type Scene =
  | 'plasma'
  | 'stars'
  | 'cells'
  | 'sea'
  | 'land'
  | 'civilization'
  | 'cosmos'
  | 'cityUniverse'

function sceneFor(index: number): Scene {
  if (index <= 1) return 'plasma' // e0-e1: formless luminous gas
  if (index <= 4) return 'stars' // e2-e4: first stars, forges, accretion
  if (index <= 6) return 'cells' // e5-e6: building blocks, first life
  if (index <= 9) return 'sea' // e7-e9: oxygen, eukaryotes, cambrian seas
  if (index === 10) return 'land' // e10: conquest of land (terrestrial)
  if (index <= 14) return 'civilization' // e11-e14: minds, cities, nations, tech (neuron field)
  if (index <= 17) return 'cosmos' // e15-e17: space, galaxies, universe-city
  return 'cityUniverse' // e19: the universe gathered into one vast city
}

const SCENES: Record<Scene, (props: { eraIndex: number }) => ReactElement> = {
  plasma: PlasmaScene,
  stars: StarsScene,
  cells: CellsScene,
  sea: SeaScene,
  land: LandScene,
  civilization: CivilizationScene,
  cosmos: CosmosScene,
  cityUniverse: CityUniverseScene,
}

export function SceneBackground({ eraIndex }: { eraIndex: number }): ReactElement {
  const scene = sceneFor(eraIndex)
  const Scene = SCENES[scene]
  // Freeze the ambient animations when nothing is watching: tab hidden, or the
  // player idle in the foreground (screen left on overnight) - the continuous
  // compositing is otherwise the heaviest CPU/raster cost on screen.
  const hidden = usePageHidden()
  const idle = useIdle(IDLE_FREEZE_MS)
  const frozen = hidden || idle
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg transition-colors duration-700 ${
        frozen ? 'scene-paused' : ''
      }`}
    >
      {/* Keyed so switching era groups fades the new scene in. The city-universe
          finale is softened (depth of field) so it sits behind the widget. The
          slight scale-up hides the blur's transparent edge bleed. */}
      <div
        key={scene}
        className={`bg-scene absolute inset-0 ${scene === 'cityUniverse' ? 'scale-105 blur-[3px]' : ''}`}
      >
        <Scene eraIndex={eraIndex} />
      </div>
    </div>
  )
}
