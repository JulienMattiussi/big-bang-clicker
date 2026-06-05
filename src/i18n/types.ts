import { fr } from './translations/fr'

export type Locale = 'fr' | 'en'

/** Contrat de clés : dérivé du fichier FR (source de vérité). */
export type TranslationKey = keyof typeof fr

/** Une langue complète doit fournir toutes les clés. */
export type Translations = Record<TranslationKey, string>
