import { useTranslation } from '@/i18n/useTranslation'
import type { Locale } from '@/i18n/types'

const LOCALES: Locale[] = ['fr', 'en']

/** Sélecteur de langue (FR / EN). */
export function LanguageSwitch() {
  const { t, locale, setLocale } = useTranslation()
  return (
    <div role="group" aria-label={t('lang.label')} className="flex gap-3 text-xs">
      {LOCALES.map((code) => {
        const active = locale === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            disabled={active}
            aria-pressed={active}
            className={
              'w-7 text-center ' +
              (active
                ? 'cursor-default font-bold text-accent'
                : 'text-muted transition-colors hover:text-fg')
            }
          >
            {code.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
