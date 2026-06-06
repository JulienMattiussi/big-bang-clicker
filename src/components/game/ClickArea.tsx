import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { EraIcon } from '@/components/game/EraIcon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'
import type { EraDef } from '@/lib/types'

/** Zone de clic : exécute le "verbe" de l'ère et affiche un retour flottant. */
export function ClickArea({ era }: { era: EraDef }) {
  const { t } = useTranslation()
  const click = useGameStore((s) => s.click)
  const [pops, setPops] = useState<number[]>([])
  const nextId = useRef(0)

  const handleClick = () => {
    click(era.clickResource)
    const id = nextId.current++
    setPops((current) => [...current, id])
  }

  const removePop = (id: number) => setPops((current) => current.filter((p) => p !== id))

  return (
    <div className="relative inline-flex">
      <Button
        className="min-w-60 px-8 py-6 text-lg whitespace-nowrap shadow-lg"
        onClick={handleClick}
      >
        <span className="flex items-center justify-center gap-2">
          <EraIcon icon={era.icon} onAccent className="h-6 w-6 shrink-0" />
          {t(era.verbKey as TranslationKey)}
        </span>
      </Button>
      <div className="pointer-events-none absolute inset-x-0 -top-2 flex justify-center">
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
