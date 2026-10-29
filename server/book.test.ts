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

  it('passes the host’s book on to his guests before the game, and no guest’s', () => {
    const host = player('host')
    const room = rooms.join(host, 'new')
    const told = host.heard.at(-1)
    if (!room || told?.t !== 'lobby') throw new Error('no room')
    const friend = player('friend')
    rooms.join(friend, told.lobby.room)
    const book = hostSetup({
      seed: 'shown',
      size: 'large',
      guests: 1,
      bots: 2,
      level: 'easy',
      teams: 2,
      opening: 200,
    })
    rooms.hear(room, host, { t: 'book', setup: book })
    const seen = friend.heard.at(-1)
    if (seen?.t !== 'lobby') throw new Error('no lobby')
    expect(seen.lobby.setup).toEqual(book)
    rooms.hear(room, friend, { t: 'book', setup: { seed: 'mine' } })
    const after = friend.heard.at(-1)
    if (after?.t !== 'lobby') throw new Error('no lobby')
    expect(after.lobby.setup).toEqual(book)
  })

  it('fits the book to who sits when it begins, a guest come since the launch seated', () => {
    const host = player('host')
    const room = rooms.join(host, 'new')
    const told = host.heard.at(-1)
    if (!room || told?.t !== 'lobby') throw new Error('no room')
    const first = player('first')
    rooms.join(first, told.lobby.room)
    // The host launched with one guest; a second came on the way.
    const book = hostSetup({
      seed: 'fit',
      size: 'standard',
      guests: 1,
      bots: 3,
      level: 'hard',
      teams: 0,
      opening: 300,
    })
    const second = player('second')
    rooms.join(second, told.lobby.room)
    rooms.hear(room, host, { t: 'start', setup: book })
    const begin = begun(second.heard)
    if (begin?.t !== 'begin') throw new Error('no begin')
    expect(begin.seat).toBe(2)
    expect(begin.setup.seed).toBe('fit')
    expect(begin.setup.seats[2]).toMatchObject({ person: true, bot: null })
  })

  it('changes nothing of a game begun when the host says start again', () => {
    const host = player('host')
    const room = rooms.join(host, 'new')
    const told = host.heard.at(-1)
    if (!room || told?.t !== 'lobby') throw new Error('no room')
    rooms.join(player('friend'), told.lobby.room)
    rooms.hear(room, host, { t: 'start' })
    const setup = room.setup
    const other = hostSetup({
      seed: 'other',
      size: 'large',
      bots: 0,
      level: 'easy',
      teams: 0,
      opening: 100,
    })
    rooms.hear(room, host, { t: 'start', setup: other })
    expect(room.setup).toBe(setup)
  })

  it('tells the guests when the host leaves before his game, and the room is no more', () => {
    const host = player('host')
    const room = rooms.join(host, 'new')
    const told = host.heard.at(-1)
    if (!room || told?.t !== 'lobby') throw new Error('no room')
    const friend = player('friend')
    rooms.join(friend, told.lobby.room)
    rooms.leave(room, host)
    expect(friend.heard.at(-1)).toEqual({ t: 'error', reason: 'gone' })
    const late = player('late')
    rooms.join(late, told.lobby.room)
    expect(late.heard.at(-1)).toEqual({ t: 'error', reason: 'unknown' })
  })
})
