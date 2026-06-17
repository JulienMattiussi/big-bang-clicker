/**
 * Era name prefixed by its 1-based number, e.g. "Ère 1 : Big Bang". `word` is the
 * localized term for "era" (t('era.word')), `index` the 0-based era index.
 */
export function eraTitle(word: string, index: number, name: string): string {
  return `${word} ${index + 1} : ${name}`
}
