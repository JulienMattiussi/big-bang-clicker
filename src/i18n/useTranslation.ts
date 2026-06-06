import { useI18nStore } from './i18nStore'
import { translations } from './translations'
import type { Locale, TranslationKey } from './types'

interface UseTranslation {
  t: (key: TranslationKey) => string
  locale: Locale
  setLocale: (locale: Locale) => void
}

/** Translation hook: `t(key)` in the current language, falling back to FR. */
export function useTranslation(): UseTranslation {
  const locale = useI18nStore((s) => s.locale)
  const setLocale = useI18nStore((s) => s.setLocale)
  const t = (key: TranslationKey): string =>
    translations[locale][key] || translations.fr[key] || key
  return { t, locale, setLocale }
}
