import { LanguageSwitch } from '@/components/layout/LanguageSwitch'
import { SaveMenu } from '@/components/layout/SaveMenu'
import { SceneBackground } from '@/components/layout/SceneBackground'
import { GaletReceptacle } from '@/components/layout/GaletReceptacle'
import { EraTransition } from '@/components/layout/EraTransition'
import { InventoryButton } from '@/components/game/inventory/InventoryButton'
import { EraTabs } from '@/components/game/EraTabs'
import { ClickArea } from '@/components/game/ClickArea'
import { isFullWidthWidget } from '@/components/game/widgets/interactive'
import { ResourcePanel } from '@/components/game/ResourcePanel'
import { PurchasePanel } from '@/components/game/PurchasePanel'
import { ComplexityBadge } from '@/components/game/ComplexityBadge'
import { MemoryFeature } from '@/components/game/memory/MemoryFeature'
import { NextGoal } from '@/components/game/NextGoal'
import { MilestoneButton } from '@/components/game/MilestoneButton'
import { EraIcon } from '@/components/game/EraIcon'
import { PrestigeBanner } from '@/components/game/PrestigeBanner'
import { CrisisBanner } from '@/components/game/CrisisBanner'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/types'

/**
 * Game shell: applies the active era's tier theme (data-tier), shows the header
 * (era, tagline, Complexity, language) and the three panels.
 */
export function GameShell() {
  const { t } = useTranslation()
  const defs = useGameStore((s) => s.defs)
  const currentEraId = useGameStore((s) => s.state.currentEraId)

  const era = defs.eras.find((e) => e.id === currentEraId) ?? defs.eras[0]

  return (
    <main
      data-tier={era.uiTier}
      className="relative isolate mx-auto flex min-h-full max-w-7xl flex-col gap-4 px-3.5 py-6 text-fg transition-colors duration-700"
    >
      {/* Ambient scene background (per era group), behind everything. */}
      <SceneBackground eraIndex={era.index} />
      {/* Top region. Center: Complexity and the milestone gauge stay on top
          (their vertical position is unchanged), each with its button directly
          beneath - memory under Complexity, unlock under the gauge. Left: pebbles
          then the era title, which lands on the buttons' line (so the buttons
          never push the title down). Right: language and options. */}
      <header className="flex flex-col gap-3">
        {/* Two-row grid. Row 1 (pebbles / Complexity / milestone gauge / options)
            always exists thanks to the pills, so row 2 (era title / memory button
            under Complexity / unlock button under the gauge) stays put: the title
            shares the buttons' row instead of rising to the pills, and the
            pebbles keep their reserved slot above the title even when empty. */}
        <div className="grid grid-cols-[1fr_auto_auto_1fr] items-start gap-x-4 gap-y-1.5">
          <div className="col-start-1 row-start-1 flex items-center gap-2">
            <GaletReceptacle />
            <InventoryButton />
          </div>
          <div className="col-start-2 row-start-1 flex justify-center">
            <ComplexityBadge />
          </div>
          <div className="col-start-3 row-start-1 flex justify-center">
            <NextGoal />
          </div>
          <div className="col-start-4 row-start-1 flex justify-end gap-3">
            <LanguageSwitch />
            <SaveMenu />
          </div>

          <div className="col-start-1 row-start-2 flex items-start gap-3">
            <EraIcon icon={era.icon} className="mt-1 h-9 w-9 shrink-0" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t(era.nameKey as TranslationKey)}
              </h1>
              {/* Reserved height (2 lines): switching language doesn't shift the rest. */}
              <p className="mt-0.5 min-h-6 max-w-prose leading-snug text-muted italic">
                {t(era.taglineKey as TranslationKey)}
              </p>
            </div>
          </div>
          <div className="col-start-2 row-start-2 flex justify-center">
            <MemoryFeature />
          </div>
          <div className="col-start-3 row-start-2 flex justify-center">
            <MilestoneButton />
          </div>
        </div>
        <EraTabs />
      </header>

      <CrisisBanner />
      <PrestigeBanner />

      {/* Sliding transition between eras (direction by tab order). */}
      <EraTransition eraId={era.id} index={era.index} className="flex flex-col gap-4">
        {isFullWidthWidget(era.widget) ? (
          // Wide widget (e.g. periodic table): full-width on top, panels below.
          <>
            <section className="-mt-2 flex justify-center pb-2">
              <ClickArea era={era} />
            </section>
            {/* Resources kept narrow so the wide machines panel fits 3 columns. */}
            <section className="grid gap-4 md:grid-cols-[1fr_3fr]">
              <ResourcePanel era={era} />
              <PurchasePanel era={era} wide />
            </section>
          </>
        ) : (
          <section className="grid gap-4 md:grid-cols-[5fr_4fr_5fr]">
            <ResourcePanel era={era} />
            <div className="flex items-center justify-center py-6">
              <ClickArea era={era} />
            </div>
            <PurchasePanel era={era} />
          </section>
        )}
      </EraTransition>
    </main>
  )
}
