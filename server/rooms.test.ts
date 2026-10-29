import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SETUP_LIMITS } from '../engine'
import { SEATS, TURN_MS } from '../net/protocol'
import type { FromRelay, Turn } from '../net/protocol'
import type * as Rooms from './rooms'

// The public game's cycle, on a clock of the test's: one is always in its
// opening, its land drawn and its turns flowing from the first, bots in
// every seat; whoever comes sits at once, given the turns so far; when no one
// may come in any more, it goes on with whoever came and the next opens, or,
// empty, is dropped for the next.

let rooms: typeof Rooms

/** A player who keeps every word of the relay. */
function player(name = '') {
  const heard: Array<FromRelay> = []
  return { name, send: (message: FromRelay) => heard.push(message), heard }
}

const begun = (heard: Array<FromRelay>) => heard.find((m) => m.t === 'begin')
const turns = (heard: Array<FromRelay>) =>
  heard.filter((m): m is Turn => m.t === 'turn')

beforeEach(async () => {
  vi.useFakeTimers()
  // Each test its own relay, its games and its clock.
  vi.resetModules()
  rooms = await import('./rooms')
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('the public game', () => {
  it('is always in its opening, its land drawn, joined for a little less than the opening', () => {
    const first = rooms.upcoming()
    expect(first).toMatchObject({
      size: 'standard',
      closesIn: rooms.JOIN_MS,
      taken: 0,
      seats: SEATS,
    })
    // Joining closes before the opening ends: the last to come may plant.
    expect(rooms.JOIN_MS).toBeLessThan(SETUP_LIMITS.opening.public * TURN_MS)
    vi.advanceTimersByTime(10_000)
    expect(rooms.upcoming()).toMatchObject({
      seed: first.seed,
      closesIn: rooms.JOIN_MS - 10_000,
    })
  })

  it('is dropped when no one came, and another takes its place: a new land, the whole time to join', () => {
    const first = rooms.upcoming()
    vi.advanceTimersByTime(rooms.JOIN_MS - TURN_MS)
    expect(rooms.upcoming()).toMatchObject({
      seed: first.seed,
      closesIn: TURN_MS,
    })
    vi.advanceTimersByTime(TURN_MS)
    const next = rooms.upcoming()
    expect(next.seed).not.toBe(first.seed)
    expect(next).toMatchObject({ closesIn: rooms.JOIN_MS, taken: 0 })
  })

  it('takes a player in at once on a free seat, with the land, the opening and the turns so far', () => {
    const { seed } = rooms.upcoming()
    vi.advanceTimersByTime(4_000)
    const one = player('one')
    rooms.join(one, null)
    expect(one.heard[0]).toEqual({
      t: 'begin',
      seat: 0,
      seed,
      size: 'standard',
      level: 'normal',
      opening: SETUP_LIMITS.opening.public,
    })
    // The forty turns played, from the first, every seat a bot's.
    const past = turns(one.heard)
    expect(past.map((t) => t.n)).toEqual(
      Array.from({ length: 40 }, (_, n) => n),
    )
    expect(past.every((t) => t.joined.length === 0)).toBe(true)
    expect(rooms.upcoming()).toMatchObject({ seed, taken: 1 })
    // His seat is his from the next turn, on every browser.
    vi.advanceTimersByTime(TURN_MS)
    expect(one.heard.at(-1)).toMatchObject({ t: 'turn', n: 40, joined: [0] })
    const two = player('two')
    rooms.join(two, null)
    expect(begun(two.heard)).toMatchObject({ seat: 1, seed })
    expect(turns(two.heard)).toHaveLength(41)
    vi.advanceTimersByTime(TURN_MS)
    for (const p of [one, two])
      expect(p.heard.at(-1)).toMatchObject({ n: 41, joined: [1] })
  })

  it('goes on with whoever came when no one may come in any more, and the next opens', () => {
    const { seed } = rooms.upcoming()
    const one = player('one')
    const room = rooms.join(one, null)
    vi.advanceTimersByTime(rooms.JOIN_MS)
    const next = rooms.upcoming()
    expect(next.seed).not.toBe(seed)
    expect(next).toMatchObject({ closesIn: rooms.JOIN_MS, taken: 0 })
    // The game goes on past its opening, its turns flowing.
    vi.advanceTimersByTime(SETUP_LIMITS.opening.public * TURN_MS)
    expect(one.heard.at(-1)).toMatchObject({
      t: 'turn',
      n: rooms.JOIN_MS / TURN_MS + SETUP_LIMITS.opening.public - 1,
    })
    // Whoever comes now comes into the one in its opening.
    const shown = rooms.upcoming()
    expect(shown.seed).not.toBe(seed)
    const two = player('two')
    rooms.join(two, null)
    expect(begun(two.heard)).toMatchObject({ seat: 0, seed: shown.seed })
    // Its last player gone, the game stops.
    if (room) rooms.leave(room, one)
    const heard = one.heard.length
    vi.advanceTimersByTime(10 * TURN_MS)
    expect(one.heard).toHaveLength(heard)
  })

  it('gives a seat left in the opening back to a bot, and to whoever comes next', () => {
    const one = player('one')
    const room = rooms.join(one, null)
    vi.advanceTimersByTime(TURN_MS)
    if (room) rooms.leave(room, one)
    const two = player('two')
    rooms.join(two, null)
    vi.advanceTimersByTime(TURN_MS)
    // Left and taken in the same turn: the seat stays a person's.
    expect(two.heard.at(-1)).toMatchObject({ n: 1, joined: [], left: [] })
    expect(begun(two.heard)).toMatchObject({ seat: 0 })
    if (room) rooms.leave(room, two)
    vi.advanceTimersByTime(TURN_MS)
    const three = player('three')
    rooms.join(three, null)
    vi.advanceTimersByTime(TURN_MS)
    const last = turns(three.heard).slice(-2)
    expect(last).toMatchObject([
      { n: 2, left: [0] },
      { n: 3, joined: [0] },
    ])
    // Taken and left in the same turn: never a person's on any browser.
    const four = player('four')
    rooms.join(four, null)
    if (room) rooms.leave(room, four)
    vi.advanceTimersByTime(TURN_MS)
    expect(three.heard.at(-1)).toMatchObject({ n: 4, joined: [], left: [] })
  })

  it('closes its doors when full, and the next opens', () => {
    const { seed } = rooms.upcoming()
    const all = Array.from({ length: SEATS }, (_, i) => player(`p${i}`))
    for (const p of all) rooms.join(p, null)
    expect(all.map((p) => begun(p.heard))).toMatchObject(
      all.map((_, seat) => ({ seat, seed })),
    )
    const next = rooms.upcoming()
    expect(next.seed).not.toBe(seed)
    expect(next).toMatchObject({ taken: 0, closesIn: rooms.JOIN_MS })
  })
})

describe('a private room', () => {
  it('starts on its host’s word, its players seated from the first turn', () => {
    const host = player('host')
    const room = rooms.join(host, 'new')
    const told = host.heard.at(-1)
    if (!room || told?.t !== 'lobby') throw new Error('no room')
    const friend = player('friend')
    rooms.join(friend, told.lobby.room.toLowerCase())
    expect(friend.heard.at(-1)).toMatchObject({
      t: 'lobby',
      seat: 1,
      lobby: { names: ['host', 'friend'], host: 0 },
    })
    vi.advanceTimersByTime(rooms.JOIN_MS)
    expect(begun(friend.heard)).toBeUndefined()
    rooms.hear(room, host, { t: 'start' })
    expect(begun(host.heard)).toMatchObject({
      seat: 0,
      opening: SETUP_LIMITS.opening.public,
    })
    expect(begun(friend.heard)).toMatchObject({ seat: 1 })
    vi.advanceTimersByTime(TURN_MS)
    expect(friend.heard.at(-1)).toMatchObject({ n: 0, joined: [0, 1] })
    // Begun, it takes no one more.
    const late = player('late')
    rooms.join(late, told.lobby.room)
    expect(late.heard).toEqual([{ t: 'error', reason: 'started' }])
  })
})
