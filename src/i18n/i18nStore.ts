import { create } from 'zustand'
import type { Locale } from './types'

const STORAGE_KEY = 'big-bang-clicker:locale'

/** FR par défaut ; EN seulement si explicitement choisi ou navigateur anglais. */
function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'fr' || saved === 'en') return saved
  } catch {
    // Stockage indisponible : on ignore.
  }
  if (typeof navigator !== 'undefined' && navigator.language.startsWith('en')) return 'en'
  return 'fr'
}

interface I18nStore {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useI18nStore = create<I18nStore>((set) => ({
  locale: detectLocale(),
  setLocale: (locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // Stockage indisponible : on ignore.
    }
    set({ locale })
  },
}))
