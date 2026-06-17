/**
 * Pure simulation for the era-15 launch widget (RocketLaunch). A ship travels
 * through four phases, one slot per phase so several ships can be in flight at
 * once (juggling). Time-based behaviour (tilt, sweep, descent) lives here; the
 * component drives it with step() and mutates ships through the action helpers.
 * No React, no store, no rendering. dt is in seconds.
 */

export type Phase = 'launch' | 'ascent' | 'cruise' | 'landing'
export const PHASES: Phase[] = ['launch', 'ascent', 'cruise', 'landing']

/** Number of distinct rocket colours (mapped to palette tokens in the component). */
export const ROCKET_COLORS = 5

export interface Ship {
  id: number
  color: number // 0..ROCKET_COLORS-1 livery (never repeats two ships in a row)
  arrive: number // launch: 0..100 slide-in from the side onto the pad (100 = ready)
  thrust: number // launch: 0..100, filled by clicks
  lift: number // launch: 0..100 liftoff travel once fuelled (flies off the top)
  angle: number // ascent: rendered lean in degrees
  tilt: number // ascent: current jolt to correct (-1 left / 0 straight / +1 right)
  react: number // ascent: seconds left to correct the current jolt
  wait: number // ascent: seconds until the next jolt (while straight)
  corrected: number // ascent: jolts corrected so far
  needed: number // ascent: jolts to survive before it steadies and climbs away
  climb: number // ascent: 0..100 climb-away once steadied
  reticle: number // cruise: 0..100 horizontal sweep (X sight)
  rdir: number // cruise: X sweep direction (+/-1)
  reticleY: number // cruise: 0..100 vertical sweep (Y sight, after X is locked)
  rYdir: number // cruise: Y sweep direction (+/-1)
  star: number // cruise: 0..100 star X
  starY: number // cruise: 0..100 star Y
  lockX: boolean // cruise: X caught (then the Y sweep begins)
  locked: boolean // cruise: both axes caught
  x: number // landing: 0..100 horizontal
  vx: number // landing: horizontal drift (units/s)
  pad: number // landing: 0..100 pad centre
  descent: number // landing: 0..100 toward the ground
  result: 'land' | 'crash' | null
  flash: number // seconds left on the outcome flash before removal
}

export interface World {
  slots: (Ship | null)[] // length 4, indexed by PHASES
  nextId: number
  landedTotal: number // cumulative successful landings (the component rewards the delta)
  lastColor: number // livery of the last spawned ship (so the next one differs)
}

export const STEP_MS = 50

// Tuning (gentle, forgiving first pass).
export const THRUST_PER_CLICK = 8
const LIFT_SPEED = 150 // liftoff travel per second once the rocket is fuelled
const ARRIVE_SPEED = 260 // slide-in travel per second for a fresh rocket
const LEAN_MIN = 6 // initial lean, kept non-zero so the side is readable at once
const LEAN_MAX = 52
const CRASH_TILT = 78
export const URGENT_LEAD = 1 // seconds before tip-over: the correct steer button blinks
const REACT_TIME = 1.7 // seconds to correct a jolt before it tips over
const ASCENT_CLIMB = 130 // climb-away travel per second once steadied
const RETICLE_SPEED = 46 // cruise sweep (units/s)
export const STAR_HIT = 12 // cruise: catch tolerance around the star
export const LOCK_HOLD = 1 // cruise: the ship streaks to the star before cruising on
const DESCENT_SPEED = 21 // landing fall (units/s)
const STEER = 14 // landing: impulse per left/right tap (units/s)
export const PAD_HALF = 11 // landing: half-width of the safe pad
export const FLASH = 0.9 // outcome flash duration (seconds)

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** A livery index different from `prev` (uniform among the other colours). */
function pickColor(prev: number): number {
  const c = Math.floor(Math.random() * (ROCKET_COLORS - 1))
  return c >= prev ? c + 1 : c
}

function freshLaunch(id: number, color: number): Ship {
  return {
    id,
    color,
    arrive: 100, // the very first rocket is already on the pad
    thrust: 0,
    lift: 0,
    angle: 0,
    tilt: 0,
    react: 0,
    wait: 0,
    corrected: 0,
    needed: 0,
    climb: 0,
    reticle: 0,
    rdir: 1,
    reticleY: 0,
    rYdir: 1,
    star: 0,
    starY: 0,
    lockX: false,
    locked: false,
    x: 50,
    vx: 0,
    pad: 50,
    descent: 0,
    result: null,
    flash: 0,
  }
}

export function freshWorld(): World {
  const color = Math.floor(Math.random() * ROCKET_COLORS)
  return {
    slots: [freshLaunch(1, color), null, null, null],
    nextId: 2,
    landedTotal: 0,
    lastColor: color,
  }
}

/** Advances every in-flight ship by dt. `landedTotal` grows by each ship that just
 *  landed safely this step, so the caller can reward the delta. */
export function step(world: World, dt: number): World {
  // Idle: nothing in flight and the pad rocket has fully slid in but is not yet
  // thrusting - step would only re-clone an unchanged world. Return the SAME
  // reference so setState skips the re-render (the widget steps continuously,
  // even while the player is just waiting on the pad).
  if (!world.slots[1] && !world.slots[2] && !world.slots[3]) {
    const pad = world.slots[0]
    if (pad && pad.arrive >= 100 && pad.thrust < 100) return world
  }
  const slots = [...world.slots]
  let nextId = world.nextId
  let lastColor = world.lastColor
  let landed = 0

  // Each phase works on a CLONE (step stays pure: dev StrictMode invokes the state
  // updater twice, and mutating shared ships would double-advance the sim).

  // Phase 4 - landing: fall + drift, then judge the touchdown; flash, then remove.
  if (slots[3]) {
    const land = { ...slots[3] }
    if (land.result) {
      land.flash -= dt
      slots[3] = land.flash <= 0 ? null : land
    } else {
      land.x = Math.max(4, Math.min(96, land.x + land.vx * dt))
      if (land.x <= 4 || land.x >= 96) land.vx = -land.vx * 0.6
      land.descent += DESCENT_SPEED * dt
      if (land.descent >= 100) {
        land.descent = 100
        land.result = Math.abs(land.x - land.pad) <= PAD_HALF ? 'land' : 'crash'
        land.flash = FLASH
        if (land.result === 'land') landed += 1
      }
      slots[3] = land
    }
  }

  // Phase 3 - cruise: sweep the sight; advance once locked and the pad is free.
  if (slots[2]) {
    const cruise = { ...slots[2] }
    if (cruise.locked) {
      cruise.flash -= dt // hold the lock a beat so the catch is visible
      if (cruise.flash <= 0 && !slots[3]) {
        slots[3] = { ...cruise, x: 50, vx: rand(-12, 12), pad: rand(22, 78), descent: 0 }
        slots[2] = null
      } else {
        slots[2] = cruise
      }
    } else if (cruise.lockX) {
      // Stage B: the vertical (Y) sight sweeps now that X is caught.
      cruise.reticleY += cruise.rYdir * RETICLE_SPEED * dt
      if (cruise.reticleY >= 100) {
        cruise.reticleY = 100
        cruise.rYdir = -1
      } else if (cruise.reticleY <= 0) {
        cruise.reticleY = 0
        cruise.rYdir = 1
      }
      slots[2] = cruise
    } else {
      // Stage A: the horizontal (X) sight sweeps.
      cruise.reticle += cruise.rdir * RETICLE_SPEED * dt
      if (cruise.reticle >= 100) {
        cruise.reticle = 100
        cruise.rdir = -1
      } else if (cruise.reticle <= 0) {
        cruise.reticle = 0
        cruise.rdir = 1
      }
      slots[2] = cruise
    }
  }

  // Phase 2 - ascent: a discrete jolt leans the rocket; one tap on the correct
  // side rights it. Survive `needed` jolts and it steadies and climbs away; a late
  // or wrong reaction makes it explode.
  if (slots[1]) {
    const ascent = { ...slots[1] }
    if (ascent.result) {
      ascent.flash -= dt
      slots[1] = ascent.flash <= 0 ? null : ascent
    } else if (ascent.corrected >= ascent.needed) {
      // Steadied: climb up and off the top, then enter cruise.
      ascent.climb = Math.min(100, ascent.climb + ASCENT_CLIMB * dt)
      if (ascent.climb >= 100 && !slots[2]) {
        slots[2] = {
          ...ascent,
          reticle: rand(0, 100),
          rdir: 1,
          reticleY: rand(0, 100),
          rYdir: 1,
          star: rand(20, 80),
          starY: rand(12, 52), // kept in the top half of the frame
          lockX: false,
          locked: false,
        }
        slots[1] = null
      } else {
        slots[1] = ascent
      }
    } else if (ascent.tilt === 0) {
      // Straight: wait, then a new jolt leans it to one side.
      ascent.wait -= dt
      if (ascent.wait <= 0) {
        ascent.tilt = Math.random() < 0.5 ? -1 : 1
        ascent.angle = ascent.tilt * LEAN_MIN
        ascent.react = REACT_TIME
      }
      slots[1] = ascent
    } else {
      // Leaning: the lean accelerates (k squared) until corrected or it tips over.
      ascent.react -= dt
      const k = 1 - Math.max(0, ascent.react) / REACT_TIME
      ascent.angle = ascent.tilt * (LEAN_MIN + (LEAN_MAX - LEAN_MIN) * k * k)
      if (ascent.react <= 0) {
        ascent.result = 'crash'
        ascent.angle = ascent.tilt * CRASH_TILT
        ascent.flash = FLASH
      }
      slots[1] = ascent
    }
  }

  // Phase 1 - launch: a fresh rocket first slides in from the side; then thrust is
  // added by clicks; once full it rises and flies off the top, entering the ascent
  // phase (only when the slot ahead is free).
  if (slots[0]) {
    const launch = { ...slots[0] }
    if (launch.arrive < 100) {
      launch.arrive = Math.min(100, launch.arrive + ARRIVE_SPEED * dt)
      slots[0] = launch
    } else if (launch.thrust >= 100) {
      launch.lift = Math.min(100, launch.lift + LIFT_SPEED * dt)
      if (launch.lift >= 100 && !slots[1]) {
        slots[1] = {
          ...launch,
          lift: 0,
          angle: 0,
          tilt: 0,
          react: 0,
          wait: rand(0.5, 0.9),
          corrected: 0,
          needed: Math.random() < 0.5 ? 3 : 4,
          climb: 0,
        }
        slots[0] = null
      } else {
        slots[0] = launch
      }
    } else {
      slots[0] = launch
    }
  }
  if (!slots[0]) {
    // The replacement rolls in from the side (arrive starts at 0), in a new livery.
    lastColor = pickColor(lastColor)
    slots[0] = { ...freshLaunch(nextId, lastColor), arrive: 0 }
    nextId += 1
  }

  return { slots, nextId, landedTotal: world.landedTotal + landed, lastColor }
}

/** Click the rocket: add thrust to the launch ship. */
export function addThrust(world: World): World {
  const launch = world.slots[0]
  if (!launch || launch.arrive < 100 || launch.thrust >= 100) return world
  const slots = [...world.slots]
  slots[0] = { ...launch, thrust: Math.min(100, launch.thrust + THRUST_PER_CLICK) }
  return { ...world, slots }
}

/** Tap left/right to right a jolted ascending rocket. The correct side (opposite
 *  the lean) straightens it; the wrong side tips it over. Idle taps do nothing. */
export function nudge(world: World, dir: number): World {
  const ascent = world.slots[1]
  if (!ascent || ascent.result || ascent.corrected >= ascent.needed) return world
  if (ascent.tilt === 0) return world // nothing to correct right now
  const slots = [...world.slots]
  if (dir === -ascent.tilt) {
    // Correct side: straighten and arm the next jolt.
    slots[1] = {
      ...ascent,
      tilt: 0,
      angle: 0,
      react: 0,
      wait: rand(0.5, 1),
      corrected: ascent.corrected + 1,
    }
  } else {
    // Wrong side: it tips over and explodes.
    slots[1] = { ...ascent, result: 'crash', angle: ascent.tilt * CRASH_TILT, flash: FLASH }
  }
  return { ...world, slots }
}

/** Fire when a sight is on the star. Two stages: first the horizontal (X) sight,
 *  then the vertical (Y) one; the second catch locks the heading. */
export function fireStar(world: World): { world: World; hit: boolean } {
  const cruise = world.slots[2]
  if (!cruise || cruise.locked) return { world, hit: false }
  const slots = [...world.slots]
  if (!cruise.lockX) {
    if (Math.abs(cruise.reticle - cruise.star) > STAR_HIT) return { world, hit: false }
    slots[2] = { ...cruise, lockX: true }
    return { world: { ...world, slots }, hit: true }
  }
  if (Math.abs(cruise.reticleY - cruise.starY) > STAR_HIT) return { world, hit: false }
  // (Y caught: lock the heading.)
  slots[2] = { ...cruise, locked: true, flash: LOCK_HOLD }
  return { world: { ...world, slots }, hit: true }
}

/** Tap left/right to steer the landing ship toward the pad. */
export function steer(world: World, dir: number): World {
  const land = world.slots[3]
  if (!land || land.result) return world
  const slots = [...world.slots]
  slots[3] = { ...land, vx: land.vx + dir * STEER }
  return { ...world, slots }
}
