import { useCrisisStore } from '@/store/crisisStore'
import { ExtinctionGame } from './ExtinctionGame'
import { RevoltGame } from './RevoltGame'

/** Routes the active crisis fight to its mini-game (each crisis has its own). */
export function CrisisGame() {
  const fighting = useCrisisStore((s) => s.fighting)
  return fighting === 'revolt' ? <RevoltGame /> : <ExtinctionGame />
}
