import { LanguageSwitch } from '@/components/layout/LanguageSwitch'
import { SaveMenu } from '@/components/layout/SaveMenu'
import { SceneBackground } from '@/components/layout/SceneBackground'
import { GaletReceptacle } from '@/components/layout/GaletReceptacle'
import { EraTransition } from '@/components/layout/EraTransition'
import { InventoryButton } from '@/components/game/inventory/InventoryButton'
import { EraTabs } from '@/components/game/EraTabs'
import { ClickArea } from '@/components/game/ClickArea'
import { isWideLayout, wideRowClass } from '@/components/layout/eraLayout'
import { ResourcePanel } from '@/components/game/ResourcePanel'
import { PurchasePanel } from '@/components/game/PurchasePanel'
import { ComplexityBadge } from '@/components/game/ComplexityBadge'
import { MemoryFeature } from '@/components/game/memory/MemoryFeature'
import { NextGoal } from '@/components/game/NextGoal'
import { MilestoneButton } from '@/components/game/MilestoneButton'
import { EraIcon } from '@/components/game/EraIcon'
import { eraTitle } from '@/components/game/eraTitle'
import { PrestigeBanner } from '@/components/game/PrestigeBanner'
import { CrisisBanner } from '@/components/game/CrisisBanner'
import { CrisisGame } from '@/components/game/CrisisGame'
import { useGameStore } from '@/store/gameStore'
import { useCrisisStore } from '@/store/crisisStore'
import { readyCrises } from '@/lib/crises'
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
  // A ready crisis takes over the central scene, but ONLY in its own era (it
  // stays put when the player visits other eras): the banner to confront it,
  // then the survival mini-game once engaged.
  const crisisHere = useGameStore((s) =>
    readyCrises(s.state, s.defs).some((id) => s.defs.crises[id].eraId === s.state.currentEraId),
  )
  const fighting = useCrisisStore((s) => s.fighting)
  // Replacing the whole state (import/reset/prestige) must remount the widget, or
  // its transient local state (e.g. ships in flight) lingers from the old save.
  const epoch = useGameStore((s) => s.epoch)

  const era = defs.eras.find((e) => e.id === currentEraId) ?? defs.eras[0]
  const fightingHere = fighting != null && defs.crises[fighting]?.eraId === era.id
  const central = crisisHere ? (
    fightingHere ? (
      <CrisisGame />
    ) : (
      <CrisisBanner />
    )
  ) : (
    <ClickArea key={`${era.id}-${epoch}`} era={era} />
  )

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
        {/* Two-row grid. The centre column holds the Complexity pill (so the pill
            is centred on the page); the milestone gauge sits at the start of the
            right column, glued to the pill's right, with options at the far right.
            This keeps the left column (era title) as wide as possible. Row 1 always
            exists thanks to the pills, so row 2 (era title / memory button under
            Complexity / unlock button under the gauge) stays put. */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-4 gap-y-1.5">
          <div className="col-start-1 row-start-1 flex items-center gap-2">
            <GaletReceptacle />
            <InventoryButton />
          </div>
          <div className="col-start-2 row-start-1 flex justify-center">
            <ComplexityBadge />
          </div>
          <div className="col-start-3 row-start-1 flex items-center justify-between gap-3">
            <NextGoal />
            <div className="flex gap-3">
              <LanguageSwitch />
              <SaveMenu />
            </div>
          </div>

          <div className="col-start-1 row-start-2 flex items-start gap-3">
            <EraIcon icon={era.icon} className="mt-1 h-9 w-9 shrink-0" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {eraTitle(t('era.word'), era.index, t(era.nameKey as TranslationKey))}
              </h1>
              {/* Reserved height (2 lines): switching language doesn't shift the rest. */}
              <p className="mt-0.5 min-h-6 max-w-prose text-sm leading-snug text-muted italic">
                {t(era.taglineKey as TranslationKey)}
              </p>
            </div>
          </div>
          <div className="col-start-2 row-start-2 flex justify-center">
            <MemoryFeature />
          </div>
          {/* Centred within the gauge's own width (w-48), pinned to the start of
              the column, so it stays directly under the gauge as before. */}
          <div className="col-start-3 row-start-2 flex">
            <div className="flex w-48 justify-center">
              <MilestoneButton />
            </div>
          </div>
        </div>
        <EraTabs />
      </header>

      <PrestigeBanner />

      {/* Sliding transition between eras (direction by tab order). */}
      <EraTransition eraId={era.id} index={era.index} className="flex flex-col gap-4">
        {isWideLayout(era.layout) ? (
          <>
            <section className="-mt-2 flex justify-center pb-2">{central}</section>
            {/* Resources stay narrow next to the wide machines panel; 'wide-roomy'
                eras (Societies -> Industry) widen the resource column a bit, where
                many eras' resources cohabit and it gets cramped. */}
            <section className={`grid gap-4 ${wideRowClass(era.layout)}`}>
              <ResourcePanel era={era} />
              <PurchasePanel era={era} wide />
            </section>
          </>
        ) : (
          <section className="grid gap-4 md:grid-cols-[5fr_4fr_5fr]">
            <ResourcePanel era={era} />
            <div className="flex items-center justify-center py-6">{central}</div>
            <PurchasePanel era={era} />
          </section>
        )}
      </EraTransition>
    </main>
  )
}
