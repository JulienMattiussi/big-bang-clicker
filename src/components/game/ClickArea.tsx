import { EraWidget } from '@/components/game/widgets/EraWidget'
import { INTERACTIVE_WIDGETS } from '@/components/game/widgets/interactive'
import { WidgetGalet } from '@/components/game/widgets/WidgetGalet'
import { useEraMechanic } from '@/components/game/widgets/useEraMechanic'
import { useClickPulse } from '@/store/clickPulse'
import type { EraDef } from '@/lib/types'

/**
 * Central scene. Either the era's interactive widget (its own mechanic), or the
 * generic verb: clicking the iconic widget floats a "+1" on the produced resource.
 */
export function ClickArea({ era }: { era: EraDef }) {
  const { verb, gainBase, gainCombinedScaled } = useEraMechanic(era)

  const Interactive = INTERACTIVE_WIDGETS[era.widget]
  if (Interactive) return <Interactive era={era} />

  const handleClick = () => {
    gainBase(1)
    // Space follow-up eras (e16+) have no bespoke widget yet: the click also yields
    // a small, factory-scaled batch of the combined resource, like the e14/e15
    // widgets do on their milestones.
    if (era.uiTier === 'space') gainCombinedScaled(1)
    useClickPulse.getState().pulse() // generic verb signal (mouse + keyboard)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label={verb}
        onClick={handleClick}
        className="group rounded-full p-3 transition select-none hover:bg-surface/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
      >
        <EraWidget
          widget={era.widget}
          className="h-44 w-44 transition group-hover:brightness-110"
        />
      </button>
      <span className="flex flex-col items-center gap-1.5 text-base font-semibold text-fg">
        {verb}
        <WidgetGalet />
      </span>
    </div>
  )
}
