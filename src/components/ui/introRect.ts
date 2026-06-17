/**
 * Screen rect + transform of an element flying from a source spot to its slot,
 * captured to drive an "intro" animation. Shared by the inventory, memory and
 * pebble-receptacle reveals (GaletIntro extends it with the pebble id).
 */
export interface IntroRect {
  transform: string
  top: number
  left: number
  width: number
  height: number
}
