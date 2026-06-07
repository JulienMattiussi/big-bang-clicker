import { EraWidget } from '@/components/game/widgets/EraWidget'
import { INTERACTIVE_WIDGETS } from '@/components/game/widgets/interactive'
import { useGameStore } from '@/store/gameStore'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useClickPulse } from '@/store/clickPulse'
import { useTranslation } from '@/i18n/useTranslation'
import { clickYield } from '@/lib/engine'
import { formatNumber } from '@/lib/format'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

/**
 * Central scene. Either the era's interactive widget (its own mechanic), or the
 * generic verb: clicking the iconic widget floats a "+1" on the produced
 * resource's counter.
 */
export function ClickArea({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const click = useGameStore((s) => s.click)
  const spawn = useFeedbackStore((s) => s.spawn)

  const Interactive = INTERACTIVE_WIDGETS[era.widget]
  if (Interactive) return <Interactive era={era} />

  const verb = t(era.verbKey as TranslationKey)

  const handleClick = () => {
    const { state, defs } = useGameStore.getState()
    const amount = clickYield(state, defs, era)
    click(era.clickResource, amount)
    spawn(`res:${era.clickResource}`, `+${formatNumber(amount)}`, 'resource')
    useClickPulse.getState().pulse() // generic verb signal (mouse + keyboard)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label={verb}
        onClick={handleClick}
        className="group rounded-full p-3 transition select-none hover:bg-surface/50 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 active:scale-95"
      >
        <EraWidget
          widget={era.widget}
          className="h-44 w-44 transition group-hover:brightness-110"
        />
      </button>
      <span className="text-base font-semibold text-fg">{verb}</span>
    </div>
  )
}
