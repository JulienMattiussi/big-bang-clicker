import { useRef, useState } from 'react'
import { EraWidget } from '@/components/game/widgets/EraWidget'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

/**
 * Central scene: the era's iconic widget is the click area (the "verb").
 * Shows a floating "+1" feedback on each click.
 */
export function ClickArea({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const click = useGameStore((s) => s.click)
  const [pops, setPops] = useState<number[]>([])
  const nextId = useRef(0)

  const verb = t(era.verbKey as TranslationKey)

  const handleClick = () => {
    click(era.clickResource)
    const id = nextId.current++
    setPops((current) => [...current, id])
  }

  const removePop = (id: number) => setPops((current) => current.filter((p) => p !== id))

  return (
    <div className="relative flex flex-col items-center gap-3">
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

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        {pops.map((id) => (
          <span
            key={id}
            aria-hidden
            onAnimationEnd={() => removePop(id)}
            className="click-pop absolute font-bold text-accent"
          >
            +1
          </span>
        ))}
      </div>
    </div>
  )
}
