import type { ReactElement, ReactNode } from 'react'

/**
 * Line-art emblem for each Industrial Revolution invention (era 14), keyed by the
 * invention id (see data/inventions.ts). Pure outline art; the colour comes from
 * the parent's `currentColor`. First-pass glyphs meant to be recognisable, not
 * detailed illustrations.
 */
const GLYPHS: Record<string, ReactNode> = {
  steamEngine: (
    <>
      <rect x="3" y="11" width="13" height="7" rx="1.5" />
      <path d="M6 11V8h3v3" />
      <circle cx="6.5" cy="20" r="1.6" />
      <circle cx="13" cy="20" r="1.6" />
      <path d="M16 13h3a2 2 0 0 1 2 2v3" />
      <path d="M7 5q1.5 1 0 -2M10 6q1.5 1 0 -2" />
    </>
  ),
  spinningJenny: (
    <>
      <circle cx="9" cy="12" r="6" />
      <path d="M9 6v12M3 12h12M4.8 7.8l8.4 8.4M13.2 7.8l-8.4 8.4" />
      <path d="M17 6v12M20 6v12" />
    </>
  ),
  battery: (
    <>
      <rect x="4" y="7" width="14" height="11" rx="1.5" />
      <path d="M9 5h4v2H9z" />
      <path d="M8 12h2M9 11v2M14 12h2" />
    </>
  ),
  locomotive: (
    <>
      <path d="M3 16V9h7l4 4h5a1 1 0 0 1 1 1v2" />
      <path d="M3 16h18" />
      <path d="M7 6v3" />
      <circle cx="7" cy="19" r="1.6" />
      <circle cx="16" cy="19" r="1.6" />
    </>
  ),
  photography: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M8 8l2-2h4l2 2" />
      <circle cx="12" cy="14" r="3.5" />
    </>
  ),
  telegraph: (
    <>
      <path d="M3 18h18" />
      <path d="M6 18v-3h8" />
      <circle cx="14" cy="13" r="1.4" />
      <path d="M4 8h2M9 8h4M16 8h1.5M19 8h2" />
    </>
  ),
  anaesthesia: (
    <>
      <path d="M5 16q-1-6 5-7t6 4q0 4-5 4t-6-1z" />
      <path d="M16 12h3v4h-3" />
      <path d="M11 4h3l-3 3h3" />
    </>
  ),
  dynamite: (
    <>
      <rect x="7" y="9" width="6" height="11" rx="1.5" />
      <rect x="11" y="11" width="5" height="9" rx="1.5" />
      <path d="M10 9V6q3-1 4 1" />
      <path d="M16 4l1.2 1.2M18 6h1.6M17 8l1.4-.6" />
    </>
  ),
  combustionEngine: (
    <>
      <rect x="6" y="11" width="9" height="9" rx="1" />
      <path d="M10.5 11V6" />
      <path d="M15 14h3v4h-3" />
      <path d="M9 4l1.5 2M12 4l-1.5 2" />
    </>
  ),
  telephone: (
    <>
      <path d="M5 9q7-5 14 0l-2.5 3.5q-2-1.5-4-1.5t-4 1.5z" />
      <circle cx="7" cy="9.5" r="1.2" />
      <circle cx="17" cy="9.5" r="1.2" />
      <path d="M12 13v6M9 19h6" />
    </>
  ),
  lightBulb: (
    <>
      <path d="M8 14a5 5 0 1 1 8 0c-1 1.2-1.5 2-1.5 3h-5c0-1-.5-1.8-1.5-3z" />
      <path d="M9.5 20h5M10 22h4" />
      <path d="M10.5 11l1.5 2 1.5-2" />
    </>
  ),
  automobile: (
    <>
      <path d="M3 16v-2l3-1 2-3h7l3 3 2 1v3" />
      <path d="M3 16h18" />
      <circle cx="8" cy="18" r="1.8" />
      <circle cx="16" cy="18" r="1.8" />
    </>
  ),
  cinema: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="6.5" r="1.3" />
      <circle cx="12" cy="17.5" r="1.3" />
      <circle cx="6.5" cy="12" r="1.3" />
      <circle cx="17.5" cy="12" r="1.3" />
    </>
  ),
  xray: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <circle cx="15" cy="15" r="2" />
      <path d="M10.5 10.5l3 3" />
    </>
  ),
  radio: (
    <>
      <circle cx="12" cy="18" r="1.6" />
      <path d="M9 15a4 4 0 0 1 6 0" />
      <path d="M6.5 12.5a8 8 0 0 1 11 0" />
      <path d="M4 10a12 12 0 0 1 16 0" />
    </>
  ),
  airplane: (
    <>
      <path d="M12 3q1.5 0 1.5 4v3l7 4v2l-7-2v4l2 1.5v1.5l-3.5-1-3.5 1v-1.5l2-1.5v-4l-7 2v-2l7-4V7q0-4 1.5-4z" />
    </>
  ),
  plastic: (
    <>
      <path d="M10 4h4v2l1 2v11a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V8l1-2z" />
      <path d="M9.5 12h5" />
    </>
  ),
  penicillin: (
    <>
      <ellipse cx="12" cy="13" rx="8" ry="6" />
      <ellipse cx="12" cy="13" rx="5.5" ry="4" />
      <path d="M10 12q2-2 4 0t-1 3-3-1z" />
    </>
  ),
  transistor: (
    <>
      <rect x="7" y="8" width="10" height="8" rx="1" />
      <path d="M5 10h2M5 14h2M17 10h2M17 14h2M9 8V6M12 8V6M15 8V6M9 16v2M12 16v2M15 16v2" />
    </>
  ),
  internet: (
    <>
      <circle cx="12" cy="12" r="8" />
      <ellipse cx="12" cy="12" rx="3.5" ry="8" />
      <path d="M4 12h16M5.5 8h13M5.5 16h13" />
    </>
  ),
  microprocessor: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <rect x="10" y="10" width="4" height="4" rx="0.5" />
      <path d="M9 7V4M12 7V4M15 7V4M9 20v-3M12 20v-3M15 20v-3M7 9H4M7 12H4M7 15H4M20 9h-3M20 12h-3M20 15h-3" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3.5 7.5 12 13l8.5-5.5" />
    </>
  ),
  videoGame: (
    <>
      <rect x="2" y="8" width="20" height="9" rx="4.5" />
      <path d="M7 11v3M5.5 12.5h3" />
      <circle cx="16" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="14" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  personalComputer: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M10 16v3M7 21h10M8.5 21 9 19M15.5 21 15 19" />
    </>
  ),
  mri: (
    <>
      <rect x="3" y="4" width="16" height="16" rx="3" />
      <circle cx="11" cy="12" r="4.5" />
      <path d="M1 12h6" />
    </>
  ),
  gps: (
    <>
      <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  compactDisc: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3a9 9 0 0 1 8 5" />
    </>
  ),
  cellPhone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="1.5" />
      <path d="M9 6h6M15 3l2-1.5" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 9h1M13.5 9h1M9.5 12h1M13.5 12h1" />
    </>
  ),
  dnaProfiling: (
    <>
      <path d="M8 3c8 4 8 14 0 18M16 3c-8 4-8 14 0 18" />
      <path d="M9 7h6M9 12h6M9 17h6" />
    </>
  ),
  liIonBattery: (
    <>
      <rect x="4" y="7" width="14" height="11" rx="1.5" />
      <path d="M9 5h4v2H9z" />
      <path d="M11.5 9.5 9 13h3l-2.5 3.5" />
    </>
  ),
  worldWideWeb: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18" />
      <circle cx="6" cy="7" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="7" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="14" r="3" />
      <path d="M10.5 14h6M13.5 11v6" />
    </>
  ),
  wifi: (
    <>
      <rect x="4" y="14" width="16" height="5" rx="1.5" />
      <circle cx="7" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
      <path d="M9 11a8 8 0 0 1 11 0M11.5 8.5a4.5 4.5 0 0 1 6 0" />
    </>
  ),
  socialNetwork: (
    <>
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="5" cy="17" r="2.5" />
      <circle cx="19" cy="17" r="2.5" />
      <path d="M10.5 8 6.5 15M13.5 8 17.5 15M7.5 17h9" />
    </>
  ),
  videoSharing: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10.5 9 15 12l-4.5 3z" fill="currentColor" stroke="none" />
    </>
  ),
  smartphone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  tablet: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <circle cx="12" cy="18.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  crispr: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <path d="M7.7 7.3 20 17M7.7 16.7 20 7" />
    </>
  ),
  reusableRocket: (
    <>
      <path d="M12 2c3 3 4 8 4 12H8c0-4 1-9 4-12z" />
      <circle cx="12" cy="9" r="1.6" />
      <path d="M8 14l-3 3v2l3-1.5M16 14l3 3v2l-3-1.5M11 18h2v3h-2z" />
    </>
  ),
  mrnaVaccine: (
    <g transform="rotate(45 12 12)">
      <path d="M8.5 3h7" />
      <path d="M12 3v3.5" />
      <path d="M8.5 6.5h7" />
      <rect x="9.5" y="6.5" width="5" height="8" rx="0.8" />
      <path d="M11 9h2.4M11 11h2.4" />
      <path d="M12 14.5v5" />
      <path d="M11 18.5 12 21l1-2.5" />
    </g>
  ),
  aiAssistant: (
    <>
      <rect x="5" y="7" width="14" height="12" rx="2.5" />
      <path d="M12 7V4M12 4h-1.5M12 4h1.5" />
      <circle cx="9.5" cy="13" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="1.2" fill="currentColor" stroke="none" />
      <path d="M3 12v3M21 12v3" />
    </>
  ),
  atomicBomb: (
    <>
      <path d="M6 6q6-4 12 0-3 2-6 2T6 6z" />
      <path d="M7 9q5-2 10 0-2 1.5-5 1.5T7 9z" />
      <path d="M10 11h4l-1 4h-2z" />
      <path d="M9 16h6l1 5H8z" />
    </>
  ),
  machineRebellion: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="1.5" />
      <path d="M12 8V5M10.5 5h3" />
      <path d="M8.5 12l2.5 1.5-2.5 1.5M15.5 12L13 13.5l2.5 1.5" />
      <path d="M9 16.5h6" />
      <path d="M3 11v3M21 11v3" />
    </>
  ),
  crash: (
    <>
      <path d="M3 4v16h17" />
      <path d="M6 8l3 3 3-3 4 6" />
      <path d="M16 14l4 0v-4" />
    </>
  ),
  climate: (
    <>
      <path d="M9 5a2 2 0 0 1 4 0v8.2a3.4 3.4 0 1 1-4 0z" />
      <circle cx="11" cy="16.5" r="1.7" fill="currentColor" stroke="none" />
      <path d="M11 16.5V8.5" />
      <circle cx="18.5" cy="6" r="2" />
      <path d="M18.5 2.6v1.1M22 6h-1.1M20.9 3.6l-.8.8M16.1 8.4l.8-.8" />
    </>
  ),
  y2k: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12V6M12 12l4 2" />
      <path d="M17 3l1.5 1.5M3 8l2 .6" />
    </>
  ),
}

/** Buzzword badge stamped in a corner of a variant invention's image (the running
 *  gag): a USB trident, the Bluetooth rune, a laser hit, an ion, a quantum atom. */
const VARIANT_GLYPHS: Record<string, ReactNode> = {
  usb: (
    <>
      <circle cx="12" cy="3.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 3.5V20.5" />
      <path d="M9.2 6.7 12 3.9l2.8 2.8" />
      <path d="M12 11l-3.6 2.6" />
      <circle cx="8" cy="14" r="1.4" fill="currentColor" stroke="none" />
      <path d="M12 14.4 15.6 11.8" />
      <rect x="14.1" y="9.5" width="2.8" height="2.8" rx="0.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="20.5" r="1.7" fill="currentColor" stroke="none" />
    </>
  ),
  bluetooth: <path d="M7 7 17 17 12 22 12 2 17 7 7 17" />,
  laser: (
    <>
      <path d="M2 12h9" />
      <circle cx="15" cy="12" r="2" />
      <path d="M15 8.5V6M15 18v-2.5M20.5 12H23M18.9 8.1 20.6 6.4M18.9 15.9 20.6 17.6" />
    </>
  ),
  ionic: (
    <>
      <circle cx="10.5" cy="13" r="5.5" />
      <path d="M10.5 10.5v5M8 13h5" />
      <circle cx="19.5" cy="6" r="2.1" />
      <path d="M18 6h3" />
    </>
  ),
  quantum: (
    <>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(45 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-45 12 12)" />
    </>
  ),
}

export function VariantGlyph({
  variantKey,
  className = 'h-5 w-5',
}: {
  variantKey: string
  className?: string
}): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {VARIANT_GLYPHS[variantKey] ?? null}
    </svg>
  )
}

export function InventionGlyph({
  id,
  className = 'h-10 w-10',
}: {
  id: string
  className?: string
}): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {GLYPHS[id] ?? <circle cx="12" cy="12" r="7" />}
    </svg>
  )
}
