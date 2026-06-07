/**
 * Map a pointer/mouse event to the coordinates of an SVG's viewBox, or null if
 * the element isn't laid out yet. Keyboard-synthesised clicks carry no real
 * position (MouseEvent.detail === 0), so callers branch on that themselves and
 * provide a fallback point.
 */
export function viewBoxPoint(
  el: SVGSVGElement | null,
  clientX: number,
  clientY: number,
  vbWidth: number,
  vbHeight = vbWidth,
): { x: number; y: number } | null {
  const rect = el?.getBoundingClientRect()
  if (!rect) return null
  return {
    x: ((clientX - rect.left) / rect.width) * vbWidth,
    y: ((clientY - rect.top) / rect.height) * vbHeight,
  }
}
