/**
 * Crisis mini-game (Starpacus's revolt) world: pure state + tick. The square is
 * split: the street on the left (2/3) where angry protesters stream in from the
 * edges and mill about, and the Parliament on the right (1/3). Clicking a red
 * protester turns it green and sends it walking right to take a seat; while it
 * crosses the street a red protester can bump it (it blinks red), and after
 * three bumps it turns red again. Fill the Parliament (CRISIS_GOAL seats) to win.
 * The protester art lives in art/Protester.tsx.
 */
export const W = 356
export const H = 100
export const STEP_MS = 80
const X_MIN = 8
const X_MAX = W - 8
const Y_MIN = 40
const Y_MAX = 92
/** Vertical divider: street to its left (2/3), Parliament to its right (1/3). */
export const SPLIT_X = Math.round((W * 2) / 3)
const STREET_MAX = SPLIT_X - 6
const PARL_X0 = SPLIT_X + 4
/** How many angry protesters the street holds at once (the spawn pressure). */
const TARGET_ANGRY = 20
const WALK_SPEED = 44
const CONTACT_R2 = 7 * 7
const HIT_CD_MS = 360
const MAX_HITS = 3
export const BLINK_MS = 240

// Tiered seating (gradins), front row at the bottom. Drawn by RevoltGame.
const SEAT_COLS = 10
const SEAT_ROWS = 5
export const PARL_LEFT = SPLIT_X + 4
export const PARL_RIGHT = X_MAX
const SEAT_TOP = 44
const SEAT_BOTTOM = 90
const ROW_H = (SEAT_BOTTOM - SEAT_TOP) / SEAT_ROWS
const COL_W = (PARL_RIGHT - PARL_LEFT) / SEAT_COLS
/** Y of each gradin ledge (front row last), for drawing the stone tiers. */
export const SEAT_TIERS = Array.from({ length: SEAT_ROWS }, (_, r) => SEAT_BOTTOM - r * ROW_H)

export type PersonState = 'angry' | 'walking' | 'seated'
export interface Person {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  state: PersonState
  /** False until an angry protester has walked in from off-screen (no bounce yet). */
  entered: boolean
  /** Bumps taken while walking to the Parliament; at MAX_HITS it turns red again. */
  hits: number
  /** Cooldown before the next bump counts (so one overlap is not many hits). */
  hitCd: number
  /** Time until which a freshly-bumped walker blinks red. */
  blinkUntil: number
  t0: number
}
export interface CrowdWorld {
  people: Person[]
  next: number
  time: number
  spawnTimer: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export const freshCrowd = (): CrowdWorld => ({ people: [], next: 1, time: 0, spawnTimer: 0 })

/** Seat position for the nth citizen filed into the Parliament (front row first). */
export function seatSlot(index: number): { x: number; y: number } {
  const col = index % SEAT_COLS
  const row = Math.floor(index / SEAT_COLS)
  return { x: PARL_LEFT + (col + 0.5) * COL_W, y: SEAT_BOTTOM - (row + 0.5) * ROW_H }
}

/** Turns an angry protester into a citizen walking right to the Parliament. */
export function enfranchise(world: CrowdWorld, id: number): CrowdWorld {
  return {
    ...world,
    people: world.people.map((p) =>
      p.id === id && p.state === 'angry'
        ? { ...p, state: 'walking', vx: WALK_SPEED, vy: rand(-6, 6), hits: 0, hitCd: 0 }
        : p,
    ),
  }
}

/** A cluster of 2-4 angry protesters walking in from a street edge (left or top). */
function spawnGroup(time: number, startId: number): { people: Person[]; nextId: number } {
  const people: Person[] = []
  let id = startId
  const size = 2 + Math.floor(rand(0, 3))
  const fromTop = Math.random() < 0.4
  const baseY = rand(Y_MIN + 6, Y_MAX - 6)
  const baseX = rand(X_MIN + 24, STREET_MAX - 24)
  for (let i = 0; i < size; i++) {
    const base = { id: id++, state: 'angry' as const, entered: false, hits: 0, hitCd: 0, blinkUntil: 0, t0: time }
    if (fromTop) {
      people.push({ ...base, x: baseX + rand(-10, 10), y: Y_MIN - rand(4, 14) - i * 6, vx: rand(-9, 9), vy: rand(18, 30) })
    } else {
      people.push({ ...base, x: -rand(4, 14) - i * 6, y: baseY + rand(-6, 6), vx: rand(18, 30), vy: rand(-7, 7) })
    }
  }
  return { people, nextId: id }
}

/** Advances the crowd one STEP_MS tick (pure: returns a new world). */
export function stepCrowd(prev: CrowdWorld): CrowdWorld {
  const dt = STEP_MS / 1000
  const time = prev.time + STEP_MS
  let next = prev.next

  // 1. Move everyone according to their state.
  let people = prev.people.map((p) => {
    if (p.state === 'seated') return p
    let { x, y, vx, vy, entered } = p
    x += vx * dt
    y += vy * dt
    if (p.state === 'walking') {
      if (y < Y_MIN) {
        y = Y_MIN
        vy = Math.abs(vy)
      } else if (y > Y_MAX) {
        y = Y_MAX
        vy = -Math.abs(vy)
      }
      return { ...p, x, y, vy }
    }
    // angry: bounce within the street once it has entered from off-screen.
    if (!entered && x >= X_MIN && x <= STREET_MAX && y >= Y_MIN && y <= Y_MAX) entered = true
    if (entered) {
      if (x < X_MIN) {
        x = X_MIN
        vx = Math.abs(vx)
      } else if (x > STREET_MAX) {
        x = STREET_MAX
        vx = -Math.abs(vx)
      }
      if (y < Y_MIN) {
        y = Y_MIN
        vy = Math.abs(vy)
      } else if (y > Y_MAX) {
        y = Y_MAX
        vy = -Math.abs(vy)
      }
    }
    return { ...p, x, y, vx, vy, entered }
  })

  // 2. Bumps: a walking citizen touched by an angry protester blinks, and turns
  //    red again after MAX_HITS contacts.
  const angries = people.filter((p) => p.state === 'angry')
  people = people.map((p) => {
    if (p.state !== 'walking') return p
    const hitCd = Math.max(0, p.hitCd - STEP_MS)
    let { hits, blinkUntil } = p
    let cd = hitCd
    if (cd === 0 && angries.some((a) => (a.x - p.x) ** 2 + (a.y - p.y) ** 2 < CONTACT_R2)) {
      hits += 1
      cd = HIT_CD_MS
      blinkUntil = time + BLINK_MS
    }
    if (hits >= MAX_HITS) {
      return {
        ...p,
        state: 'angry',
        entered: true,
        hits: 0,
        hitCd: 0,
        blinkUntil: 0,
        x: Math.min(p.x, STREET_MAX),
        vx: -rand(16, 26),
        vy: rand(-8, 8),
      }
    }
    return { ...p, hits, hitCd: cd, blinkUntil }
  })

  // 3. Seating: a walker that reaches the Parliament takes the next free seat.
  let seated = people.filter((p) => p.state === 'seated').length
  people = people.map((p) => {
    if (p.state === 'walking' && p.x >= PARL_X0) {
      const slot = seatSlot(seated)
      seated += 1
      return { ...p, state: 'seated', x: slot.x, y: slot.y, vx: 0, vy: 0 }
    }
    return p
  })

  // 4. Keep the street busy with fresh groups.
  let spawnTimer = prev.spawnTimer - STEP_MS
  const angryCount = people.filter((p) => p.state === 'angry').length
  if (angryCount < TARGET_ANGRY && spawnTimer <= 0) {
    const group = spawnGroup(time, next)
    people = [...people, ...group.people]
    next = group.nextId
    spawnTimer = rand(700, 1400)
  }

  return { people, next, time, spawnTimer }
}
