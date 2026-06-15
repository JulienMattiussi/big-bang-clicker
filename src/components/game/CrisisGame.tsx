import { useCrisisStore } from '@/store/crisisStore'
import { ExtinctionGame } from './ExtinctionGame'
import { RevoltGame } from './RevoltGame'
import { SurviveGame } from './SurviveGame'

/** Routes the active crisis fight to its mini-game. Extinction and the revolt
 *  keep their bespoke games; every other confronted crisis (the era-14 ones)
 *  shares the simple SurviveGame. */
export function CrisisGame() {
  const fighting = useCrisisStore((s) => s.fighting)
  if (fighting === 'extinction') return <ExtinctionGame />
  if (fighting === 'revolt') return <RevoltGame />
  return <SurviveGame />
}
