import { describe, it, expect } from 'vitest'
import {
  SPLIT_X,
  enfranchise,
  freshCrowd,
  seatSlot,
  stepCrowd,
  type CrowdWorld,
  type Person,
} from '@/components/game/revoltWorld'

const person = (over: Partial<Person>): Person => ({
  id: 1,
  x: 100,
  y: 60,
  vx: 0,
  vy: 0,
  state: 'angry',
  entered: true,
  hits: 0,
  hitCd: 0,
  blinkUntil: 0,
  t0: 0,
  ...over,
})

const crowd = (people: Person[]): CrowdWorld => ({ people, next: 99, time: 0, spawnTimer: 9999 })

describe('seatSlot', () => {
  it('place des sièges adjacents à des abscisses différentes', () => {
    expect(seatSlot(0).x).not.toBe(seatSlot(1).x)
    expect(Number.isFinite(seatSlot(0).y)).toBe(true)
  })
})

describe('enfranchise', () => {
  it('transforme un protestataire en colon qui marche vers le parlement', () => {
    const after = enfranchise(crowd([person({ id: 7, state: 'angry' })]), 7)
    expect(after.people[0]?.state).toBe('walking')
    expect(after.people[0]?.vx).toBeGreaterThan(0)
  })

  it('ignore un id absent ou un non-protestataire', () => {
    const seated = crowd([person({ id: 7, state: 'seated' })])
    expect(enfranchise(seated, 7).people[0]?.state).toBe('seated')
  })
})

describe('stepCrowd', () => {
  it('assoit un marcheur qui atteint le parlement', () => {
    const walker = person({ state: 'walking', x: SPLIT_X + 10, vx: 0 })
    expect(stepCrowd(crowd([walker])).people[0]?.state).toBe('seated')
  })

  it('un marcheur bousculé par un protestataire clignote et encaisse un coup', () => {
    const walker = person({ id: 1, state: 'walking', x: 100, y: 60, vx: 0, vy: 0, hitCd: 0 })
    const angry = person({ id: 2, state: 'angry', x: 100, y: 60, vx: 0, vy: 0 })
    const after = stepCrowd(crowd([walker, angry]))
    const w = after.people.find((p) => p.id === 1)
    expect(w?.hits).toBe(1)
    expect(w?.blinkUntil).toBeGreaterThan(0)
  })
})
