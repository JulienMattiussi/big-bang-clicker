/**
 * Shared constants/helpers for the ambient scene backgrounds (one file per scene
 * in this folder). The shared <Defs> gradients live in Defs.tsx (a component file).
 * SVG transforms are limited to scale/opacity/rotate (reliable across browsers);
 * any translate-based motion lives on HTML wrappers.
 */

/** Deterministic PRNG (no Math.random in render; stable layout across renders). */
export function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const svgClass = 'absolute inset-0 h-full w-full'
export const svgProps = { viewBox: '0 0 100 100', preserveAspectRatio: 'xMidYMid slice' } as const

/** Starfield, shared by the stars (e2-4) and cosmos (e15-18) scenes. */
const rs = mulberry32(101)
export const STARS = Array.from({ length: 150 }, () => ({
  x: rs() * 100,
  y: rs() * 100,
  r: 0.15 + rs() * 0.29,
  delay: rs() * 5,
  dur: 3 + rs() * 4,
}))
