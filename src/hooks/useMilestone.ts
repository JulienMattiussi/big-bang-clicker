import { useGameStore } from '@/store/gameStore'

/** Display data for the next-era milestone, or null when there is none. */
export interface Milestone {
  current: number
  target: number
  ready: boolean
  icon: string
  kind: 'complexity' | 'resource'
  barColor: string
  pct: number
}

/**
 * Derives the next milestone (the threshold to unlock the next era). Shared by
 * the gauge (NextGoal) and the unlock button (MilestoneButton) so the detection
 * logic lives in one place. Anti-spoiler: only the threshold, never what it
 * unlocks.
 */
export function useMilestone(): Milestone | null {
  const state = useGameStore((s) => s.state)
  const defs = useGameStore((s) => s.defs)

  const next = defs.eras.find(
    (era) =>
      !state.unlockedEras.includes(era.id) &&
      (era.unlock.resource !== undefined || era.unlock.complexity !== undefined),
  )
  if (!next) return null

  const byComplexity = next.unlock.complexity !== undefined
  const resourceId = next.unlock.resource
  const current = byComplexity ? state.complexity : (state.resources[resourceId ?? ''] ?? 0)
  const target = byComplexity ? (next.unlock.complexity ?? 0) : (next.unlock.amount ?? 0)
  if (target <= 0) return null
  // Resource milestone: nothing until the resource is discovered.
  if (!byComplexity && current <= 0) return null

  return {
    current,
    target,
    ready: current >= target,
    icon: byComplexity ? 'gem' : resourceId ? defs.resources[resourceId]!.icon : 'gem',
    kind: byComplexity ? 'complexity' : 'resource',
    barColor: byComplexity ? 'bg-octarine' : 'bg-accent',
    pct: Math.min(100, (current / target) * 100),
  }
}
