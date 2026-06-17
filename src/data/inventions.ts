/**
 * Industrial Revolution era (e14): real inventions revealed one by one as the
 * player charges the invention gauge, in historical order. Each base id maps to
 * i18n keys `invention.<id>.title` / `.desc` and a glyph in art/InventionGlyph.
 *
 * The list is then inflated as a running gag: once the real inventions run out,
 * the SAME list loops over and over, each pass restyling every invention with a
 * fashionable buzzword variant (USB, Bluetooth, Laser, Ionic, Quantum) in its
 * own colour. From the first loop on, the years go silly: starting in 2026 with
 * random 5-to-10-year jumps.
 */
export interface Invention {
  /** Base invention id (drives the glyph and the original title/desc). */
  id: string
  year: number
  /** 0 = original; 1..N = the matching VARIANTS entry (USB, Bluetooth...). */
  variant: number
  /** Crisis id triggered when this invention is reached (atomic bomb, machine revolt). */
  crisis?: string
}

/** A buzzword restyling applied to the whole list on each loop. */
interface InventionVariant {
  /** i18n suffix keys live under `invent.variant.<key>.tag` / `.note`. */
  key: string
  /** Fixed palette token for the recoloured glyph (see theme.css). */
  color: string
}

export const VARIANTS: InventionVariant[] = [
  { key: 'usb', color: 'var(--stone-light)' },
  { key: 'bluetooth', color: 'var(--part-6)' },
  { key: 'laser', color: 'var(--part-1)' },
  { key: 'ionic', color: 'var(--part-4)' },
  { key: 'quantum', color: 'var(--octarine)' },
]

const BASE_INVENTIONS: { id: string; year: number; crisis?: string }[] = [
  { id: 'steamEngine', year: 1712 },
  { id: 'spinningJenny', year: 1764 },
  { id: 'battery', year: 1800 },
  { id: 'locomotive', year: 1804 },
  { id: 'photography', year: 1826 },
  { id: 'telegraph', year: 1837 },
  { id: 'anaesthesia', year: 1846 },
  { id: 'dynamite', year: 1867 },
  { id: 'combustionEngine', year: 1876 },
  { id: 'telephone', year: 1876 },
  { id: 'lightBulb', year: 1879 },
  { id: 'automobile', year: 1886 },
  { id: 'cinema', year: 1895 },
  { id: 'xray', year: 1895 },
  { id: 'radio', year: 1896 },
  { id: 'airplane', year: 1903 },
  { id: 'plastic', year: 1907 },
  { id: 'penicillin', year: 1928 },
  { id: 'crash', year: 1929, crisis: 'crash' },
  { id: 'atomicBomb', year: 1945, crisis: 'atomic' },
  { id: 'transistor', year: 1947 },
  { id: 'internet', year: 1969 },
  { id: 'microprocessor', year: 1971 },
  { id: 'email', year: 1971 },
  { id: 'videoGame', year: 1972 },
  { id: 'personalComputer', year: 1977 },
  { id: 'mri', year: 1977 },
  { id: 'gps', year: 1978 },
  { id: 'compactDisc', year: 1982 },
  { id: 'cellPhone', year: 1983 },
  { id: 'dnaProfiling', year: 1984 },
  { id: 'liIonBattery', year: 1991 },
  { id: 'worldWideWeb', year: 1991 },
  { id: 'wifi', year: 1997 },
  { id: 'y2k', year: 2000, crisis: 'y2k' },
  { id: 'socialNetwork', year: 2004 },
  { id: 'videoSharing', year: 2005 },
  { id: 'smartphone', year: 2007 },
  { id: 'tablet', year: 2010 },
  { id: 'crispr', year: 2012 },
  { id: 'reusableRocket', year: 2015 },
  { id: 'mrnaVaccine', year: 2020 },
  { id: 'aiAssistant', year: 2022 },
  { id: 'machineRebellion', year: 2027, crisis: 'machineRebellion' },
  { id: 'climate', year: 2055, crisis: 'climate' },
]

/** Real inventions first, then VARIANTS.length restyled loops with silly years.
 *  Years from the first loop are deterministic (seeded), so they stay stable. */
function buildInventions(): Invention[] {
  const list: Invention[] = BASE_INVENTIONS.map((b) => ({ ...b, variant: 0 }))
  // Crises punctuate the real loop only; the variant loops are pure inventions.
  const loopable = BASE_INVENTIONS.filter((b) => !b.crisis)
  let seed = 1337 // Park-Miller LCG: stable fake-random 5..10-year jumps from 2026.
  const nextStep = () => {
    seed = (seed * 16807) % 2147483647
    return 5 + (seed % 6)
  }
  let year = 2026
  for (let v = 1; v <= VARIANTS.length; v++) {
    for (const b of loopable) {
      list.push({ id: b.id, year, variant: v })
      year += nextStep()
    }
  }
  return list
}

export const INVENTIONS: Invention[] = buildInventions()
