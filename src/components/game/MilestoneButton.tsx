import { Button } from '@/components/ui/Button'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { useMilestone } from '@/hooks/useMilestone'

/**
 * The milestone unlock button (primary/accent), shown only once the next era's
 * threshold is reached. Sits on the era-title line; the progress gauge itself
 * stays in the top bar (NextGoal).
 */
export function MilestoneButton() {
  const { t } = useTranslation()
  const unlockNextEra = useGameStore((s) => s.unlockNextEra)
  const m = useMilestone()
  if (!m || !m.ready) return null

  return <Button onClick={() => unlockNextEra()}>{t('app.unlock')}</Button>
}
