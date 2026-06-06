import { LanguageSwitch } from '@/components/layout/LanguageSwitch'
import { SaveMenu } from '@/components/layout/SaveMenu'
import { EraTabs } from '@/components/game/EraTabs'
import { ClickArea } from '@/components/game/ClickArea'
import { ResourcePanel } from '@/components/game/ResourcePanel'
import { PurchasePanel } from '@/components/game/PurchasePanel'
import { ComplexityBadge } from '@/components/game/ComplexityBadge'
import { NextGoal } from '@/components/game/NextGoal'
import { EraIcon } from '@/components/game/EraIcon'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'

/**
 * Coquille de jeu : applique le thème du palier de l'ère active (data-tier),
 * affiche l'en-tête (ère, accroche, Complexité, langue) et les trois panneaux.
 */
export function GameShell() {
  const { t } = useTranslation()
  const defs = useGameStore((s) => s.defs)
  const currentEraId = useGameStore((s) => s.state.currentEraId)

  const era = defs.eras.find((e) => e.id === currentEraId) ?? defs.eras[0]

  return (
    <main
      data-tier={era.uiTier}
      className="mx-auto flex min-h-full max-w-5xl flex-col gap-6 bg-bg p-6 text-fg"
    >
      {/* Barre du haut : objectif central (Complexité + palier, centré en ligne) ;
          langue et options à droite. */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <ComplexityBadge />
          <NextGoal />
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <LanguageSwitch />
          <SaveMenu />
        </div>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <EraIcon icon={era.icon} className="mt-1 h-9 w-9 shrink-0" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t(era.nameKey as TranslationKey)}
            </h1>
            {/* Hauteur réservée (2 lignes) : changer de langue ne décale pas la suite. */}
            <p className="mt-1 min-h-12 max-w-prose leading-snug text-muted italic">
              {t(era.accrocheKey as TranslationKey)}
            </p>
          </div>
        </div>
        <EraTabs />
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <ResourcePanel era={era} />
        <div className="flex items-center justify-center py-6">
          <ClickArea era={era} />
        </div>
        <PurchasePanel era={era} />
      </section>
    </main>
  )
}
