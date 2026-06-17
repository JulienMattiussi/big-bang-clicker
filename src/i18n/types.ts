import { fr } from './translations/fr'

export type Locale = 'fr' | 'en'

/** Key contract: derived from the FR file (source of truth). */
export type TranslationKey = keyof typeof fr

/** A complete language must provide every key. */
export type Translations = Record<TranslationKey, string>

/** The translation function (a key in, its localized string out). Returned by
 *  useTranslation and passed down to pure render helpers. */
export type Translate = (key: TranslationKey) => string
