import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hostSetup } from '../engine'
import { begun, player } from './testing'
import type * as Rooms from './rooms'

// A private room started from its host's book (« quand on host y'a pas de
// code »): the code given, the friends seated, the game begun as the book
// set it, on a clock of the test's.

let rooms: typeof Rooms

beforeEach(async () => {
  vi.useFakeTimers()
  vi.resetModules()
  rooms = await import('./rooms')
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('a private room and its host’s book', () => {
  it('starts as the host’s book set it, his guests seated after him and his bots after them', () => {
    const host = player('host')
    const room = rooms.join(host, 'new')
    const told = host.heard.at(-1)
    if (!room || told?.t !== 'lobby') throw new Error('no room')
    const friend = player('friend')
    rooms.join(friend, told.lobby.room)
    const book = hostSetup({
      seed: 'book',
      size: 'standard',
      guests: 1,
      bots: 3,
      level: 'hard',
      teams: 0,
      opening: 300,
    })
    rooms.hear(room, host, { t: 'start', setup: book })
    const begin = begun(friend.heard)
    if (begin?.t !== 'begin') throw new Error('no begin')
    expect(begin.seat).toBe(1)
    expect(begin.setup.seed).toBe('book')
    expect(begin.setup.seats.slice(0, 5).map((s) => [s.person, s.bot])).toEqual(
      [
        [true, null],
        [true, null],
        [false, 'hard'],
        [false, 'hard'],
        [false, 'hard'],
      ],
    )
  })
})
