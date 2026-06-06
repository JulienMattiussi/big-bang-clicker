import { fr } from './translations/fr'

export type Locale = 'fr' | 'en'

/** Key contract: derived from the FR file (source of truth). */
export type TranslationKey = keyof typeof fr

/** A complete language must provide every key. */
export type Translations = Record<TranslationKey, string>
