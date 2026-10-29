import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TURN_MS } from '../net/protocol'
import { begun, player, turns } from './testing'
import type * as Rooms from './rooms'

// The public game has no bot (« en ligne il faut 0 bot »): one alone in it
// when its doors close never wins alone; its opening begins again, on a
// clock of the test's.

let rooms: typeof Rooms

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

describe('one alone in the public game', () => {
  it('never wins alone: the opening begins again on the same land, his standard planted, and the home says he waits', () => {
    const { seed } = rooms.upcoming()
    const one = player('one')
    const room = rooms.join(one, null)
    const other = player('other')
    rooms.join(other, null)
    if (!room) throw new Error('no room')
    vi.advanceTimersByTime(TURN_MS)
    const standard = { type: 'pickStart', tile: 1234 } as const
    rooms.hear(room, one, { t: 'order', move: { ...standard, tile: 99 } })
    rooms.hear(room, one, { t: 'order', move: standard })
    // The other leaves: his lord is no more once the opening begins again.
    rooms.leave(room, other)
    vi.advanceTimersByTime(rooms.JOIN_MS - TURN_MS)
    // The doors closed on him alone: told it begins again, the same game.
    const begins = one.heard.filter((m) => m.t === 'begin')
    expect(begins).toHaveLength(2)
    expect(begins[1]).toEqual(begins[0])
    expect(rooms.upcoming()).toMatchObject({
      seed,
      closesIn: rooms.JOIN_MS,
      taken: 1,
      waiting: 1,
    })
    // Its first turn: his seat his, his last standard planted again.
    vi.advanceTimersByTime(TURN_MS)
    const first = { n: 0, joined: [0], left: [] }
    const again = { ...first, orders: [{ ...standard, player: 0 }] }
    expect(one.heard.at(-1)).toEqual({ t: 'turn', ...again })
    // Whoever comes plays the same turns from that first one.
    const two = player('two')
    rooms.join(two, null)
    expect(begun(two.heard)).toMatchObject({ seat: 1, setup: { seed } })
    expect(turns(two.heard)[0]).toEqual({ t: 'turn', ...again })
    // Two now: the game goes on, and the next opens, no one waiting.
    vi.advanceTimersByTime(rooms.JOIN_MS)
    expect(one.heard.filter((m) => m.t === 'begin')).toHaveLength(2)
    expect(rooms.upcoming()).toMatchObject({ taken: 0, waiting: 0 })
    expect(rooms.upcoming().seed).not.toBe(seed)
  })
})
