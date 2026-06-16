/**
 * Pure simulation for the era-16 widget (MassRelay). Charge the relay core, then
 * catapult a ship through a mass-effect corridor toward a galaxy the moment the
 * sweeping alignment beam crosses it. No React, no store, no rendering. dt in s.
 */

export const CHARGE_PER_CLICK = 20
export const ALIGN_TOL = 24 // degrees: catapult window around the target galaxy
const SPIN_SPEED = 95 // alignment beam sweep, deg/s
const LAUNCH_TIME = 0.7 // seconds for the ship to streak to the galaxy
export const FLASH = 0.7
const MISS_PENALTY = 30 // charge bled by a mistimed catapult

export interface RelayWorld {
  charge: number // 0..100 core energy (filled by clicks)
  spin: number // 0..360 sweeping alignment beam angle
  target: number // 0..360 angle of the target galaxy
  launch: number // -1 idle, else 0..1 ship travel along the corridor
  result: 'hit' | 'miss' | null
  flash: number // seconds left on the outcome flash
  arrived: number // cumulative federations reached (caller rewards the delta)
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function freshRelay(): RelayWorld {
  return {
    charge: 0,
    spin: rand(0, 360),
    target: rand(0, 360),
    launch: -1,
    result: null,
    flash: 0,
    arrived: 0,
  }
}

/** Smallest angular gap (degrees) between two headings. */
export function angularGap(a: number, b: number): number {
  const d = Math.abs(((((a - b) % 360) + 360) % 360))
  return d > 180 ? 360 - d : d
}

export function step(w: RelayWorld, dt: number): RelayWorld {
  const n = { ...w }
  if (n.launch >= 0) {
    n.launch += dt / LAUNCH_TIME
    if (n.launch >= 1) {
      n.launch = -1
      n.arrived += 1
      n.result = null
      n.charge = 0
      n.target = rand(0, 360) // line up the next galaxy
    }
    return n
  }
  if (n.result === 'miss') {
    n.flash -= dt
    if (n.flash <= 0) n.result = null
  }
  if (n.charge >= 100) n.spin = (n.spin + SPIN_SPEED * dt) % 360
  return n
}

/** Click the core: add charge while it is not yet full. */
export function addCharge(w: RelayWorld): RelayWorld {
  if (w.charge >= 100 || w.launch >= 0) return w
  return { ...w, charge: Math.min(100, w.charge + CHARGE_PER_CLICK) }
}

/** Fire the catapult: a hit (beam on the galaxy) streaks a ship; a miss bleeds charge. */
export function fire(w: RelayWorld): RelayWorld {
  if (w.charge < 100 || w.launch >= 0) return w
  if (angularGap(w.spin, w.target) <= ALIGN_TOL) {
    return { ...w, launch: 0, result: 'hit' }
  }
  return { ...w, result: 'miss', flash: FLASH, charge: Math.max(0, w.charge - MISS_PENALTY) }
}
