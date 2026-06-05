import { formatNumber } from '@/lib/format'
import { useTick } from '@/hooks/useTick'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n/useTranslation'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'

function App() {
  useTick()
  const complexity = useGameStore((s) => s.state.complexity)
  const { t } = useTranslation()

  return (
    <main
      data-tier="cosmos"
      className="flex min-h-full flex-col items-center justify-center gap-4 bg-bg p-8 text-center text-fg"
    >
      <LanguageSwitch />
      <h1 className="text-4xl font-bold tracking-tight">{t('app.title')}</h1>
      <p className="max-w-prose text-balance text-muted">{t('app.tagline')}</p>
      <p className="text-sm text-muted">{t('app.wip')}</p>
      <p className="text-xs text-muted">
        {t('app.complexity')} : {formatNumber(complexity)}
      </p>
    </main>
  )
}

export default App
