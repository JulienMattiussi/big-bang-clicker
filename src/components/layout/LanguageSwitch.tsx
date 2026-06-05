import { useTranslation } from '@/i18n/useTranslation'
import type { Locale } from '@/i18n/types'

const LOCALES: Locale[] = ['fr', 'en']

/** Sélecteur de langue (FR / EN). */
export function LanguageSwitch() {
  const { t, locale, setLocale } = useTranslation()
  return (
    <div className="flex gap-3 text-xs" aria-label={t('lang.label')}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={locale === code ? 'font-bold text-accent' : 'text-muted'}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
